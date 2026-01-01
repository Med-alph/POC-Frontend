import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Star, Zap, Crown, Check } from "lucide-react";
import toast from "react-hot-toast";
import tenantsAPI from "../../api/tenantsapi";
import featuresApi from "../../api/featuresapi";

export default function TenantOnboardingDialog({
  onAdd,
  editMode = false,
  tenantData = {},
  plans = [],
  open,
  setOpen,
  children,
}) {
  const [formLoading, setFormLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [step, setStep] = useState(1); // 1: Plan Selection, 2: Tenant Details
  const [features, setFeatures] = useState([]);
  
  const controlledOpen = open !== undefined ? open : isOpen;
  const setControlledOpen = setOpen || setIsOpen;

  const [formData, setFormData] = useState({
    // Basic Info
    name: tenantData.name || "",
    legal_name: tenantData.legal_name || "",
    type: tenantData.type || "",

    // Contact Info
    email: tenantData.email || "",
    phone: tenantData.phone || [],
    website: tenantData.website || "",
    address_street: tenantData.address_street || "",
    address_city: tenantData.address_city || "",
    address_state: tenantData.address_state || "",
    address_zip: tenantData.address_zip || "",
    address_country: tenantData.address_country || "",

    // Branding
    logo: tenantData.logo || "",
    theme_color: tenantData.theme_color || "",

    // Operational Info
    timezone: tenantData.timezone || "",
    working_days: tenantData.working_days || [],
    working_hours_start: tenantData.working_hours_start || "",
    working_hours_end: tenantData.working_hours_end || "",
    departments: tenantData.departments || [],

    // Subscription & Plan
    plan_type: tenantData.plan_type || "",
    plan_start: tenantData.plan_start || "",
    plan_end: tenantData.plan_end || "",
    allowed_users: tenantData.allowed_users || "",
    billing_contact: tenantData.billing_contact || "",

    // Regulatory Info
    license_no: tenantData.license_no || "",
    tax_id: tenantData.tax_id || "",
    healthcare_id: tenantData.healthcare_id || "",

    // Super Admin
    super_admin_name: tenantData.super_admin_name || "",
    super_admin_email: tenantData.super_admin_email || "",
    super_admin_phone: tenantData.super_admin_phone || "",

    // System Setup
    currency: tenantData.currency || "",
    preferred_languages: tenantData.preferred_languages || [],
    notification_channels: tenantData.notification_channels || [],
    status: tenantData.status || "Active",

    // Integrations
    integration_keys: tenantData.integration_keys || null,
    branch_types: Array.isArray(tenantData.branch_types) ? tenantData.branch_types : (tenantData.branch_type ? [tenantData.branch_type] : []),
  });

  // Load features when dialog opens
  useEffect(() => {
    if (controlledOpen) {
      loadFeatures();
    }
  }, [controlledOpen]);

  const loadFeatures = async () => {
    try {
      const response = await featuresApi.getAllFeatures();
      setFeatures(response || []);
    } catch (error) {
      console.error('Failed to load features:', error);
      setFeatures([]);
    }
  };

  // Set selected plan if editing
  useEffect(() => {
    if (editMode && tenantData.plan_type) {
      const plan = plans.find(p => p.name.toLowerCase() === tenantData.plan_type.toLowerCase());
      if (plan) {
        setSelectedPlan(plan);
        setStep(2); // Skip plan selection in edit mode
      }
    }
  }, [editMode, tenantData.plan_type, plans]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle array fields
    if (
      ["phone", "working_days", "departments", "preferred_languages", "notification_channels", "branch_types"].includes(name)
    ) {
      setFormData((prev) => ({
        ...prev,
        [name]: value.split(",").map((v) => v.trim()).filter(Boolean),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setFormData(prev => ({
      ...prev,
      plan_type: plan.name,
      allowed_users: plan.maxUsers || "",
    }));
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const payload = {
        ...formData,
        plan_start: formData.plan_start ? new Date(formData.plan_start) : new Date(),
        plan_end: formData.plan_end ? new Date(formData.plan_end) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        allowed_users: formData.allowed_users ? Number(formData.allowed_users) : selectedPlan?.maxUsers || 10,
        status: formData.status || "Active",
        plan_type: selectedPlan?.name || formData.plan_type,
      };

      let response;
      if (editMode && tenantData?.id) {
        response = await tenantsAPI.update(tenantData.id, payload);
      } else {
        response = await tenantsAPI.create(payload);
      }

      onAdd?.(response);
      toast.success(editMode ? "Tenant updated successfully!" : "Tenant onboarded successfully!");
      setControlledOpen(false);
      setStep(1);
      setSelectedPlan(null);
    } catch (error) {
      console.error(error);
      toast.error(error.message || (editMode ? "Failed to update tenant." : "Failed to onboard tenant."));
    } finally {
      setFormLoading(false);
    }
  };

  const getPlanIcon = (planName) => {
    switch (planName.toLowerCase()) {
      case 'basic': return <Star className="w-6 h-6" />;
      case 'pro': return <Zap className="w-6 h-6" />;
      case 'enterprise': return <Crown className="w-6 h-6" />;
      default: return <Star className="w-6 h-6" />;
    }
  };

  return (
    <Dialog open={controlledOpen} onOpenChange={setControlledOpen}>
      {!editMode && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className={`${step === 1 ? 'max-w-[90vw] w-[90vw] max-h-[95vh]' : 'max-w-[90vw] w-[90vw] max-h-[85vh]'} overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>
            {editMode ? "Edit Tenant" : step === 1 ? "Choose Your Plan" : "Tenant Onboarding Details"}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Plan Selection */}
        {step === 1 && !editMode && (
          <div className="bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 mb-6">
              <div className="w-full px-4 py-6">
                <div className="text-center">
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Select the perfect plan for your tenant's needs. You can upgrade or downgrade at any time.
                  </p>
                </div>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="w-full px-4 pb-6">
              {plans.filter(plan => plan.status === 'active').length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active plans available</h3>
                  <p className="text-gray-500">Plans will appear here once they are activated.</p>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto space-y-4">
                  {plans
                    .filter(plan => plan.status === 'active')
                    .sort((a, b) => {
                      const tierOrder = { starter: 1, professional: 2, business: 3, enterprise: 4 };
                      return (tierOrder[a.tier] || 5) - (tierOrder[b.tier] || 5);
                    })
                    .map((plan) => (
                      <div 
                        key={plan.id} 
                        className={`w-full p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedPlan?.id === plan.id 
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handlePlanSelect(plan)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${
                              selectedPlan?.id === plan.id 
                                ? 'border-blue-500 bg-blue-500' 
                                : 'border-gray-300'
                            }`}>
                              {selectedPlan?.id === plan.id && (
                                <Check className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                              <p className="text-sm text-gray-600">
                                {plan.tier} • ${plan.price}/{plan.billing_cycle}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              plan.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {plan.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="bg-white border-t border-gray-200 px-4 py-6 mt-6">
              <div className="w-full flex justify-between items-center">
                <Button 
                  onClick={() => setControlledOpen(false)}
                  variant="outline"
                  size="lg"
                >
                  Cancel
                </Button>
                {selectedPlan && (
                  <Button 
                    onClick={() => setStep(2)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    Continue with {selectedPlan.name}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Tenant Details Form */}
        {(step === 2 || editMode) && (
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Selected Plan Display */}
            {selectedPlan && !editMode && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                      {getPlanIcon(selectedPlan.name)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900">{selectedPlan.name} Plan Selected</h4>
                      <p className="text-blue-700 text-sm">
                        ${selectedPlan.price}/{selectedPlan.billing_cycle} • {selectedPlan.tier} tier
                      </p>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setStep(1)}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Change Plan
                  </Button>
                </div>
              </div>
            )}

            {/* Basic Info */}
            <Section title="Basic Info">
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  name="name" 
                  placeholder="Hospital / Clinic Name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                />
                <Input 
                  name="legal_name" 
                  placeholder="Legal Name (optional)" 
                  value={formData.legal_name} 
                  onChange={handleChange} 
                />
                <Input 
                  name="type" 
                  placeholder="Type (Clinic, Hospital, Lab, etc.)" 
                  value={formData.type} 
                  onChange={handleChange} 
                />
              </div>
            </Section>

            {/* Contact Info */}
            <Section title="Contact Info">
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  name="email" 
                  type="email" 
                  placeholder="Official Email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required
                />
                <Input
                  name="phone"
                  placeholder="Phone Numbers (comma separated)"
                  value={formData.phone.join(", ")}
                  onChange={handleChange}
                />
                <Input 
                  name="website" 
                  placeholder="Website" 
                  value={formData.website} 
                  onChange={handleChange} 
                />
                <Input 
                  name="address_city" 
                  placeholder="City" 
                  value={formData.address_city} 
                  onChange={handleChange} 
                />
                <Input 
                  name="address_state" 
                  placeholder="State" 
                  value={formData.address_state} 
                  onChange={handleChange} 
                />
                <Input 
                  name="address_country" 
                  placeholder="Country" 
                  value={formData.address_country} 
                  onChange={handleChange} 
                />
              </div>
            </Section>

            {/* Super Admin Info */}
            <Section title="Super Admin Info">
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  name="super_admin_name" 
                  placeholder="Super Admin Name" 
                  value={formData.super_admin_name} 
                  onChange={handleChange} 
                  required
                />
                <Input 
                  name="super_admin_email" 
                  type="email" 
                  placeholder="Super Admin Email" 
                  value={formData.super_admin_email} 
                  onChange={handleChange} 
                  required
                />
                <Input 
                  name="super_admin_phone" 
                  placeholder="Super Admin Phone" 
                  value={formData.super_admin_phone} 
                  onChange={handleChange} 
                />
              </div>
            </Section>

            {/* System Setup */}
            <Section title="System Setup">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  name="currency"
                  placeholder="Currency (e.g., USD, EUR)"
                  value={formData.currency}
                  onChange={handleChange}
                />
                <Input
                  name="timezone"
                  placeholder="Timezone (e.g., America/New_York)"
                  value={formData.timezone}
                  onChange={handleChange}
                />
                <Input
                  name="branch_types"
                  placeholder="Branch Types (comma separated, e.g., Main, Satellite)"
                  value={formData.branch_types.join(", ")}
                  onChange={handleChange}
                />
                <div>
                  <label className="block mb-1 font-medium">Status</label>
                  <select
                    name="status"
                    value={formData.status || "Active"}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="border rounded p-2 w-full"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </Section>

            {/* Buttons */}
            <div className="flex justify-end">
              <Button 
                type="button" 
                variant="outline" 
                className="mr-2" 
                onClick={() => {
                  if (step === 2 && !editMode) {
                    setStep(1);
                  } else {
                    setControlledOpen(false);
                  }
                }}
              >
                {step === 2 && !editMode ? "Back" : "Cancel"}
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={formLoading}
              >
                {formLoading ? "Processing..." : editMode ? "Save Changes" : "Onboard Tenant"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-3 text-gray-900">{title}</h3>
      <div>{children}</div>
    </div>
  );
}