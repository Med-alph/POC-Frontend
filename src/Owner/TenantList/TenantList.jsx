import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Info, Edit2 } from "lucide-react";
import AddHospitalDialog from "./AddHospital";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import toast from "react-hot-toast";
import tenantsAPI from "../../api/tenantsAPI";

export default function TenantListPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Fetch tenants on mount
  useEffect(() => {
    const fetchTenants = async () => {
      setLoading(true);
      try {
        const res = await tenantsAPI.getAll();
        const tenantsWithDefaults = (res.data || []).map((t) => ({
          ...t,
          status: t.status || "Active",
          preferred_languages: t.preferred_languages || [],
          notification_channels: t.notification_channels || [],
          branch_type: t.branch_type || "",
        }));
        setTenants(tenantsWithDefaults);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch tenants");
      } finally {
        setLoading(false);
      }
    };
    fetchTenants();
  }, []);

  // Handle Add
  // Updated handleAddTenant to receive full API response,
  // extract tenant data, normalize fields, and then update state
  const handleAddTenant = (response) => {
    // Only use the 'tenant' object from the response for the table!
    const newTenant = response.tenant;

    const normalizedTenant = {
      ...newTenant,
      status: newTenant.status || "Active",
      preferred_languages: Array.isArray(newTenant.preferred_languages)
        ? newTenant.preferred_languages
        : [],
      notification_channels: Array.isArray(newTenant.notification_channels)
        ? newTenant.notification_channels
        : [],
      branch_type: newTenant.branch_type || "",
      phone: Array.isArray(newTenant.phone)
        ? newTenant.phone
        : [newTenant.phone || ""],
      plan_type: newTenant.plan_type || "N/A",
      address_city: newTenant.address_city || newTenant.city || "",
    };

    setTenants((prev) => [...prev, normalizedTenant]);
    toast.success(`Tenant "${normalizedTenant.name}" added successfully!`);
  };



  // Handle Edit (update DB + UI)
  const handleEditTenant = async (updatedTenant) => {
    try {
      const res = await tenantsAPI.update(updatedTenant.id, updatedTenant); // PATCH endpoint

      // Apply defaults like in initial fetch
      const tenantWithDefaults = {
        ...res,
        status: res.status || "Active",
        preferred_languages: res.preferred_languages || [],
        notification_channels: res.notification_channels || [],
        branch_type: res.branch_type || "",
      };

      setTenants((prev) =>
        prev.map((t) => (t.id === tenantWithDefaults.id ? tenantWithDefaults : t))
      );

      toast.success(`Tenant "${tenantWithDefaults.name}" updated successfully!`);
      setEditOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update tenant");
    }
  };




  // Badge colors
  const getPlanBadgeColor = (plan) => {
    switch ((plan || "").toLowerCase()) {
      case "basic": return "bg-gray-400 text-white";
      case "pro": return "bg-blue-500 text-white";
      case "enterprise": return "bg-purple-500 text-white";
      default: return "bg-gray-300 text-black";
    }
  };

  const getStatusBadgeColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "active": return "bg-green-500 text-white";
      case "inactive": return "bg-red-500 text-white";
      case "suspended": return "bg-yellow-500 text-black";
      default: return "bg-gray-400 text-white";
    }
  };

  if (loading) return <div className="p-6">Loading tenants...</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tenant Management</h1>
        <AddHospitalDialog onAdd={handleAddTenant}>
          <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <PlusCircle size={18} /> Add Tenant
          </Button>
        </AddHospitalDialog>
      </div>

      {/* Tenant Table */}
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...tenants]
                .sort((a, b) => a.id - b.id)
                .map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>{tenant.id}</TableCell>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>{tenant.type}</TableCell>
                    <TableCell>{tenant.email}</TableCell>
                    <TableCell>{Array.isArray(tenant.phone) ? tenant.phone.join(", ") : tenant.phone}</TableCell>
                    <TableCell>
                      <Badge className={getPlanBadgeColor(tenant.plan_type || tenant.planType)}>
                        {tenant.plan_type || tenant.planType || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(tenant.status)}>
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{tenant.address_city || tenant.city}</TableCell>
                    <TableCell className="flex gap-3">
                      <Button size="icon" variant="outline" onClick={() => { setSelectedTenant(tenant); setInfoOpen(true); }}>
                        <Info size={16} />
                      </Button>
                      <Button size="icon" variant="outline" onClick={() => { setSelectedTenant(tenant); setEditOpen(true); }}>
                        <Edit2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Info Dialog */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tenant Details</DialogTitle>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-4 text-sm">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold text-lg">Basic Info</h3>
                <p><strong>Name:</strong> {selectedTenant.name}</p>
                <p><strong>Legal Name:</strong> {selectedTenant.legal_name}</p>
                <p><strong>Type:</strong> {selectedTenant.type}</p>
                <p><strong>Hospital ID:</strong> {selectedTenant.id}</p>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="font-semibold text-lg">Contact Info</h3>
                <p><strong>Email:</strong> {selectedTenant.email}</p>
                <p><strong>Phone:</strong> {Array.isArray(selectedTenant.phone) ? selectedTenant.phone.join(", ") : selectedTenant.phone}</p>
                <p><strong>Website:</strong> {selectedTenant.website}</p>
                <p><strong>Address:</strong> {selectedTenant.address_street}, {selectedTenant.address_city}, {selectedTenant.address_state}, {selectedTenant.address_country} - {selectedTenant.address_zip}</p>
              </div>

              {/* Branding */}
              <div>
                <h3 className="font-semibold text-lg">Branding</h3>
                <p><strong>Logo:</strong> {selectedTenant.logo}</p>
                <p><strong>Theme Color / Subdomain:</strong> {selectedTenant.theme_color}</p>
              </div>

              {/* Operational Info */}
              <div>
                <h3 className="font-semibold text-lg">Operational Info</h3>
                <p><strong>Timezone:</strong> {selectedTenant.timezone}</p>
                <p><strong>Working Days:</strong> {Array.isArray(selectedTenant.working_days) ? selectedTenant.working_days.join(", ") : selectedTenant.working_days}</p>
                <p><strong>Working Hours:</strong> {selectedTenant.working_hours_start} - {selectedTenant.working_hours_end}</p>
                <p><strong>Departments / Specialties:</strong> {Array.isArray(selectedTenant.departments) ? selectedTenant.departments.join(", ") : selectedTenant.departments}</p>
              </div>

              {/* Subscription & Plan */}
              <div>
                <h3 className="font-semibold text-lg">Subscription & Plan</h3>
                <p><strong>Plan Type:</strong> {selectedTenant.plan_type}</p>
                <p><strong>Plan Start:</strong> {selectedTenant.plan_start}</p>
                <p><strong>Plan End:</strong> {selectedTenant.plan_end}</p>
                <p><strong>Allowed Users / Doctors:</strong> {selectedTenant.allowed_users}</p>
                <p><strong>Billing Contact:</strong> {selectedTenant.billing_contact}</p>
              </div>

              {/* Regulatory Info */}
              <div>
                <h3 className="font-semibold text-lg">Regulatory Info</h3>
                <p><strong>Registration / License No.:</strong> {selectedTenant.license_no}</p>
                <p><strong>Tax ID / GST / VAT No.:</strong> {selectedTenant.tax_id}</p>
                <p><strong>Healthcare ID:</strong> {selectedTenant.healthcare_id}</p>
              </div>

              {/* Super Admin Info */}
              <div>
                <h3 className="font-semibold text-lg">Super Admin Info</h3>
                <p><strong>Name:</strong> {selectedTenant.super_admin_name}</p>
                <p><strong>Email:</strong> {selectedTenant.super_admin_email}</p>
                <p><strong>Phone:</strong> {selectedTenant.super_admin_phone}</p>
              </div>

              {/* System Setup */}
              <div>
                <h3 className="font-semibold text-lg">System Setup</h3>
                <p><strong>Currency:</strong> {selectedTenant.currency}</p>
                <p><strong>Preferred Languages:</strong> {Array.isArray(selectedTenant.preferred_languages) ? selectedTenant.preferred_languages.join(", ") : selectedTenant.preferred_languages}</p>
                <p><strong>Notification Channels:</strong> {Array.isArray(selectedTenant.notification_channels) ? selectedTenant.notification_channels.join(", ") : selectedTenant.notification_channels}</p>
                <p><strong>Branch Type:</strong> {selectedTenant.branch_type}</p>
              </div>

              {/* Integrations */}
              <div>
                <h3 className="font-semibold text-lg">Integrations & Branch</h3>
                <p><strong>Integration Keys:</strong> {JSON.stringify(selectedTenant.integration_keys)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editOpen && selectedTenant && (
        <AddHospitalDialog
          onAdd={handleEditTenant}
          editMode
          tenantData={selectedTenant}
          open={editOpen}
          setOpen={setEditOpen}
        />
      )}
    </div>
  );
}
