import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import tenantsAPI from "../../api/tenantsapi";

export default function AddHospitalDialog({
  onAdd,
  editMode = false,
  tenantData = {},
  open,
  setOpen,
  children,
}) {
  const [formLoading, setFormLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
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
    status: tenantData.status || "Active", // ✅ Add status here

    // Integrations
    integration_keys: tenantData.integration_keys || null,
    branch_types: Array.isArray(tenantData.branch_types) ? tenantData.branch_types : (tenantData.branch_type ? [tenantData.branch_type] : []),
  });


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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const payload = {
        ...formData,
        plan_start: formData.plan_start ? new Date(formData.plan_start) : undefined,
        plan_end: formData.plan_end ? new Date(formData.plan_end) : undefined,
        allowed_users: formData.allowed_users ? Number(formData.allowed_users) : undefined,
        status: formData.status || "Active",
      };

      let response;
      if (editMode && tenantData?.id) {
        // Edit mode: PATCH endpoint
        response = await tenantsAPI.update(tenantData.id, payload);
      } else {
        // Create mode: POST endpoint
        response = await tenantsAPI.create(payload);
      }

      onAdd?.(response); // Callback to update parent table
      toast.success(editMode ? "Tenant updated successfully!" : "Tenant added successfully!");
      setControlledOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(error.message || (editMode ? "Failed to update tenant." : "Failed to create tenant."));
    } finally {
      setFormLoading(false);
    }
  };


  return (
    <Dialog open={controlledOpen} onOpenChange={setControlledOpen}>
      {!editMode && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="max-w-[900px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMode ? "Edit Tenant" : "Add New Hospital / Clinic"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Basic Info */}
          <Section title="Basic Info">
            <div className="grid grid-cols-2 gap-4">
              <Input name="name" placeholder="Hospital / Clinic Name" value={formData.name} onChange={handleChange} required />
              <Input name="legal_name" placeholder="Legal Name (optional)" value={formData.legal_name} onChange={handleChange} />
              <Input name="type" placeholder="Type (Clinic, Hospital, Lab, etc.)" value={formData.type} onChange={handleChange} />
            </div>
          </Section>

          {/* Contact Info */}
          <Section title="Contact Info">
            <div className="grid grid-cols-2 gap-4">
              <Input name="email" type="email" placeholder="Official Email" value={formData.email} onChange={handleChange} />
              <Input
                name="phone"
                placeholder="Enter Phone"
                value={formData.phone.join(", ")}
                onChange={handleChange}
              />
              <Input name="website" placeholder="Website" value={formData.website} onChange={handleChange} />
              <Input name="address_street" placeholder="Street" value={formData.address_street} onChange={handleChange} />
              <Input name="address_city" placeholder="City" value={formData.address_city} onChange={handleChange} />
              <Input name="address_state" placeholder="State" value={formData.address_state} onChange={handleChange} />
              <Input name="address_zip" placeholder="Zip" value={formData.address_zip} onChange={handleChange} />
              <Input name="address_country" placeholder="Country" value={formData.address_country} onChange={handleChange} />
            </div>
          </Section>

          {/* Branding */}
          <Section title="Branding">
            <div className="grid grid-cols-2 gap-4">
              <Input name="logo" placeholder="Logo URL / Upload" value={formData.logo} onChange={handleChange} />
              <Input name="theme_color" placeholder="Theme Color / Subdomain" value={formData.theme_color} onChange={handleChange} />
            </div>
          </Section>

          {/* Operational Info */}
          <Section title="Operational Info">
            <div className="grid grid-cols-2 gap-4">
              <Input name="timezone" placeholder="Timezone" value={formData.timezone} onChange={handleChange} />
              <Input name="working_days" placeholder="Working Days (comma separated)" value={formData.working_days.join(", ")} onChange={handleChange} />
              <Input name="departments" placeholder="Departments / Specialties" value={formData.departments.join(", ")} onChange={handleChange} className="col-span-2" />
              <Input name="working_hours_start" placeholder="Start Time (HH:mm)" value={formData.working_hours_start} onChange={handleChange} />
              <Input name="working_hours_end" placeholder="End Time (HH:mm)" value={formData.working_hours_end} onChange={handleChange} />
            </div>
          </Section>

          {/* Subscription & Plan */}
          <Section title="Subscription & Plan">
            <div className="grid grid-cols-2 gap-4">
              <Input name="plan_type" placeholder="Plan Type" value={formData.plan_type} onChange={handleChange} />
              <Input name="allowed_users" placeholder="Allowed Users / Doctors" value={formData.allowed_users} onChange={handleChange} />
              <Input type="date" name="plan_start" value={formData.plan_start} onChange={handleChange} />
              <Input type="date" name="plan_end" value={formData.plan_end} onChange={handleChange} />
              <Input name="billing_contact" placeholder="Billing Contact" value={formData.billing_contact} onChange={handleChange} className="col-span-2" />
            </div>
          </Section>

          {/* Regulatory Info */}
          <Section title="Regulatory Info">
            <div className="grid grid-cols-2 gap-4">
              <Input name="license_no" placeholder="Registration / License No." value={formData.license_no} onChange={handleChange} />
              <Input name="tax_id" placeholder="Tax ID / GST / VAT No." value={formData.tax_id} onChange={handleChange} />
              <Input name="healthcare_id" placeholder="Healthcare ID" value={formData.healthcare_id} onChange={handleChange} />
            </div>
          </Section>

          {/* Super Admin Info */}
          <Section title="Super Admin Info">
            <div className="grid grid-cols-2 gap-4">
              <Input name="super_admin_name" placeholder="Super Admin Name" value={formData.super_admin_name} onChange={handleChange} />
              <Input name="super_admin_email" type="email" placeholder="Super Admin Email" value={formData.super_admin_email} onChange={handleChange} />
              <Input name="super_admin_phone" placeholder="Super Admin Phone" value={formData.super_admin_phone} onChange={handleChange} />
            </div>
          </Section>

          {/* System Setup */}
          {/* System Setup */}
          <Section title="System Setup">
            <div className="grid grid-cols-2 gap-4">
              <Input
                name="currency"
                placeholder="Currency"
                value={formData.currency}
                onChange={handleChange}
              />
              <Input
                name="preferred_languages"
                placeholder="Languages (comma separated)"
                value={formData.preferred_languages.join(", ")}
                onChange={handleChange}
              />
              <Input
                name="notification_channels"
                placeholder="Notification Channels (comma separated)"
                value={formData.notification_channels.join(", ")}
                onChange={handleChange}
              />
              {/* Status Dropdown */}
              <div className="col-span-2">
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
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
          </Section>


          {/* Integrations / Branches */}
          <Section title="Integrations / Branches">
            <div className="grid grid-cols-2 gap-4">
              <Input name="integration_keys" placeholder="Integration Keys (JSON or comma separated)" value={formData.integration_keys} onChange={handleChange} />
              <Input name="branch_types" placeholder="Branch Types (comma separated, e.g., Main, Satellite)" value={formData.branch_types.join(", ")} onChange={handleChange} />
            </div>
          </Section>

          {/* Buttons */}
          <div className="flex justify-end">
            <Button type="button" variant="outline" className="mr-2" onClick={() => setControlledOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              {formLoading ? "Saving..." : editMode ? "Save Changes" : "Add Tenant"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <div>{children}</div>
    </div>
  );
}
