import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function AddHospitalDialog({
    onAdd,
    editMode = false,
    tenantData = {},
    open,
    setOpen,
    children
}) {
    const [formLoading, setFormLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const controlledOpen = open !== undefined ? open : isOpen;
    const setControlledOpen = setOpen || setIsOpen;

    const [formData, setFormData] = useState({
        // Basic Info
        name: tenantData.name || "",
        legalName: tenantData.legalName || "",
        type: tenantData.type || "",
        hospitalId: tenantData.hospitalId || "",
        // Contact Info
        email: tenantData.email || "",
        phone: tenantData.phone || "",
        website: tenantData.website || "",
        address: tenantData.address || "",
        // Branding
        logo: tenantData.logo || "",
        themeColor: tenantData.themeColor || "",
        // Operational
        timezone: tenantData.timezone || "",
        workingHours: tenantData.workingHours || "",
        departments: tenantData.departments || "",
        // Subscription
        planType: tenantData.planType || "",
        planStart: tenantData.planStart || "",
        planEnd: tenantData.planEnd || "",
        allowedUsers: tenantData.allowedUsers || "",
        billingContact: tenantData.billingContact || "",
        // Regulatory
        licenseNo: tenantData.licenseNo || "",
        taxId: tenantData.taxId || "",
        healthcareId: tenantData.healthcareId || "",
        // Super Admin
        superAdminName: tenantData.superAdminName || "",
        superAdminEmail: tenantData.superAdminEmail || "",
        superAdminPhone: tenantData.superAdminPhone || "",
        // System Setup
        currency: tenantData.currency || "",
        languages: tenantData.languages || "",
        notificationChannels: tenantData.notificationChannels || "",
        // Integrations
        integrationKeys: tenantData.integrationKeys || "",
        branchType: tenantData.branchType || "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            await new Promise((res) => setTimeout(res, 1000));
            const updated = { ...tenantData, ...formData };
            onAdd?.(updated);
            toast.success(editMode ? "Tenant updated successfully!" : "Tenant added successfully!");
            setControlledOpen(false);
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
                    {/* BASIC INFO */}
                    <Section title="Basic Info">
                        <div className="grid grid-cols-2 gap-4">
                            <Input name="name" placeholder="Hospital / Clinic Name" value={formData.name} onChange={handleChange} required />
                            <Input name="legalName" placeholder="Legal Name (optional)" value={formData.legalName} onChange={handleChange} />
                            <Input name="type" placeholder="Type (Clinic, Hospital, Lab, etc.)" value={formData.type} onChange={handleChange} />
                        </div>
                    </Section>

                    {/* CONTACT INFO */}
                    <Section title="Contact Info">
                        <div className="grid grid-cols-2 gap-4">
                            <Input name="email" type="email" placeholder="Official Email" value={formData.email} onChange={handleChange} />
                            <Input name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} />
                            <Input name="website" placeholder="Website" value={formData.website} onChange={handleChange} />
                            <Input name="address" placeholder="Address" value={formData.address} onChange={handleChange} className="col-span-2" />
                        </div>
                    </Section>

                    {/* BRANDING */}
                    <Section title="Branding">
                        <div className="grid grid-cols-2 gap-4">
                            <Input name="logo" placeholder="Logo URL / Upload" value={formData.logo} onChange={handleChange} />
                            <Input name="themeColor" placeholder="Theme Color / Subdomain" value={formData.themeColor} onChange={handleChange} />
                        </div>
                    </Section>

                    {/* OPERATIONAL INFO */}
                    <Section title="Operational Info">
                        <div className="grid grid-cols-2 gap-4">
                            <Input name="timezone" placeholder="Timezone" value={formData.timezone} onChange={handleChange} />
                            <Input name="workingHours" placeholder="Working Days / Hours" value={formData.workingHours} onChange={handleChange} />
                            <Input name="departments" placeholder="Departments / Specialties" value={formData.departments} onChange={handleChange} className="col-span-2" />
                        </div>
                    </Section>

                    {/* SUBSCRIPTION & PLAN */}
                    <Section title="Subscription & Plan">
                        <div className="grid grid-cols-2 gap-4">
                            <Input name="planType" placeholder="Plan Type" value={formData.planType} onChange={handleChange} />
                            <Input name="allowedUsers" placeholder="Allowed Users / Doctors" value={formData.allowedUsers} onChange={handleChange} />
                            <Input type="date" name="planStart" placeholder="Plan Start Date" value={formData.planStart} onChange={handleChange} />
                            <Input type="date" name="planEnd" placeholder="Plan End Date" value={formData.planEnd} onChange={handleChange} />
                            <Input name="billingContact" placeholder="Billing Contact" value={formData.billingContact} onChange={handleChange} className="col-span-2" />
                        </div>
                    </Section>

                    {/* REGULATORY INFO */}
                    <Section title="Regulatory Info">
                        <div className="grid grid-cols-2 gap-4">
                            <Input name="licenseNo" placeholder="Registration / License No." value={formData.licenseNo} onChange={handleChange} />
                            <Input name="taxId" placeholder="Tax ID / GST / VAT No." value={formData.taxId} onChange={handleChange} />
                            <Input name="healthcareId" placeholder="Healthcare ID" value={formData.healthcareId} onChange={handleChange} />
                        </div>
                    </Section>

                    {/* SUPER ADMIN INFO */}
                    <Section title="Super Admin Info">
                        <div className="grid grid-cols-2 gap-4">
                            <Input name="superAdminName" placeholder="Super Admin Name" value={formData.superAdminName} onChange={handleChange} />
                            <Input name="superAdminEmail" type="email" placeholder="Super Admin Email" value={formData.superAdminEmail} onChange={handleChange} />
                            <Input name="superAdminPhone" placeholder="Super Admin Phone" value={formData.superAdminPhone} onChange={handleChange} />
                        </div>
                    </Section>

                    {/* SYSTEM SETUP */}
                    <Section title="System Setup">
                        <div className="grid grid-cols-2 gap-4">
                            <Input name="currency" placeholder="Default Currency" value={formData.currency} onChange={handleChange} />
                            <Input name="languages" placeholder="Preferred Language(s)" value={formData.languages} onChange={handleChange} />
                            <Input name="notificationChannels" placeholder="Notification Channels (SMS / Email / WhatsApp)" value={formData.notificationChannels} onChange={handleChange} className="col-span-2" />
                        </div>
                    </Section>

                    {/* INTEGRATIONS */}
                    <Section title="Integrations / Branches">
                        <div className="grid grid-cols-2 gap-4">
                            <Input name="integrationKeys" placeholder="Integration Keys (Twilio, Zoom...)" value={formData.integrationKeys} onChange={handleChange} />
                            <Input name="branchType" placeholder="Branch Type (Main / Satellite)" value={formData.branchType} onChange={handleChange} />
                        </div>
                    </Section>

                    {/* BUTTONS */}
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
        <div>
            {/* <Label className="text-lg font-semibold mb-2 block">{title}</Label> */}
            <h3 className="text-2xl font-bold">{title}</h3>
            <div>{children}</div>

        </div>
    );
}
