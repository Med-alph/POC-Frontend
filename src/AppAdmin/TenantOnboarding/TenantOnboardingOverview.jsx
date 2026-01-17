import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Info, Edit2, Users, Building, CreditCard, ArrowRight } from 'lucide-react';
import TenantOnboardingDialog from './TenantOnboardingDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import tenantsAPI from '../../api/tenantsapi';
import plansApi from '../../api/plansapi';

export default function TenantOnboardingOverview() {
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    pendingTenants: 0,
    totalRevenue: 0
  });

  // Fetch tenants and plans on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tenantsRes, plansRes] = await Promise.all([
          tenantsAPI.getAll(),
          plansApi.getAllPlans()
        ]);

        const tenantsWithDefaults = (tenantsRes.data || []).map((t) => ({
          ...t,
          status: t.status || "Active",
          preferred_languages: t.preferred_languages || [],
          notification_channels: t.notification_channels || [],
          branch_types: Array.isArray(t.branch_types) ? t.branch_types : (t.branch_type ? [t.branch_type] : []),
        }));

        setTenants(tenantsWithDefaults);
        setPlans(plansRes || []);

        // Calculate stats
        const totalTenants = tenantsWithDefaults.length;
        const activeTenants = tenantsWithDefaults.filter(t => t.status === 'Active').length;
        const pendingTenants = tenantsWithDefaults.filter(t => t.status === 'Pending').length;

        setStats({
          totalTenants,
          activeTenants,
          pendingTenants,
          totalRevenue: 0 // This would come from subscription data
        });

      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle Add Tenant
  const handleAddTenant = (response) => {
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
      branch_types: Array.isArray(newTenant.branch_types) ? newTenant.branch_types : (newTenant.branch_type ? [newTenant.branch_type] : []),
      phone: Array.isArray(newTenant.phone)
        ? newTenant.phone
        : [newTenant.phone || ""],
      plan_type: newTenant.plan_type || "N/A",
      address_city: newTenant.address_city || newTenant.city || "",
    };

    setTenants((prev) => [...prev, normalizedTenant]);
    setStats(prev => ({
      ...prev,
      totalTenants: prev.totalTenants + 1,
      activeTenants: normalizedTenant.status === 'Active' ? prev.activeTenants + 1 : prev.activeTenants
    }));
    toast.success(`Tenant "${normalizedTenant.name}" onboarded successfully!`);
  };

  // Handle Edit Tenant
  const handleEditTenant = async (updatedTenant) => {
    try {
      const res = await tenantsAPI.update(updatedTenant.id, updatedTenant);

      const tenantWithDefaults = {
        ...res,
        status: res.status || "Active",
        preferred_languages: res.preferred_languages || [],
        notification_channels: res.notification_channels || [],
        branch_types: Array.isArray(res.branch_types) ? res.branch_types : (res.branch_type ? [res.branch_type] : []),
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
      case "pending": return "bg-yellow-500 text-black";
      case "suspended": return "bg-orange-500 text-white";
      default: return "bg-gray-400 text-white";
    }
  };

  if (loading) return <div className="p-6">Loading tenant onboarding data...</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenant Onboarding</h1>
          <p className="text-gray-600 mt-1">
            Onboard new tenants and assign subscription plans
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/tenant-onboarding/list">
            <Button variant="outline" className="flex items-center gap-2">
              View All Tenants <ArrowRight size={16} />
            </Button>
          </Link>
          <TenantOnboardingDialog onAdd={handleAddTenant} plans={plans}>
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <PlusCircle size={18} /> Onboard Tenant
            </Button>
          </TenantOnboardingDialog>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Tenants"
          value={stats.totalTenants}
          icon={<Building className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Active Tenants"
          value={stats.activeTenants}
          icon={<Users className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Pending Onboarding"
          value={stats.pendingTenants}
          icon={<PlusCircle className="w-6 h-6" />}
          color="yellow"
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={<CreditCard className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Tenant Table */}
      <Card className="shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Recent Tenants</h3>
          <Link to="/tenant-onboarding/list">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              View All <ArrowRight size={14} className="ml-1" />
            </Button>
          </Link>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead>ID</TableHead>
                <TableHead>Tenant Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Onboarded</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...tenants]
                .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
                .slice(0, 5) // Show only first 5 recent tenants
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
                    <TableCell>
                      {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setSelectedTenant(tenant); setInfoOpen(true); }}
                      >
                        <Info size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setSelectedTenant(tenant); setEditOpen(true); }}
                      >
                        <Edit2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              {tenants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    No tenants onboarded yet. Start by onboarding your first tenant!
                  </TableCell>
                </TableRow>
              )}
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
                <p><strong>Tenant ID:</strong> {selectedTenant.id}</p>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="font-semibold text-lg">Contact Info</h3>
                <p><strong>Email:</strong> {selectedTenant.email}</p>
                <p><strong>Phone:</strong> {Array.isArray(selectedTenant.phone) ? selectedTenant.phone.join(", ") : selectedTenant.phone}</p>
                <p><strong>Website:</strong> {selectedTenant.website}</p>
                <p><strong>Address:</strong> {selectedTenant.address_street}, {selectedTenant.address_city}, {selectedTenant.address_state}, {selectedTenant.address_country} - {selectedTenant.address_zip}</p>
              </div>

              {/* Subscription & Plan */}
              <div>
                <h3 className="font-semibold text-lg">Subscription & Plan</h3>
                <p><strong>Plan Type:</strong> {selectedTenant.plan_type}</p>
                <p><strong>Plan Start:</strong> {selectedTenant.plan_start}</p>
                <p><strong>Plan End:</strong> {selectedTenant.plan_end}</p>
                <p><strong>Allowed Users:</strong> {selectedTenant.allowed_users}</p>
                <p><strong>Billing Contact:</strong> {selectedTenant.billing_contact}</p>
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
                <p><strong>Status:</strong> <Badge className={getStatusBadgeColor(selectedTenant.status)}>{selectedTenant.status}</Badge></p>
                <p><strong>Currency:</strong> {selectedTenant.currency}</p>
                <p><strong>Timezone:</strong> {selectedTenant.timezone}</p>
                <p><strong>Working Hours:</strong> {selectedTenant.working_hours_start} - {selectedTenant.working_hours_end}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editOpen && selectedTenant && (
        <TenantOnboardingDialog
          onAdd={handleEditTenant}
          editMode
          tenantData={selectedTenant}
          plans={plans}
          open={editOpen}
          setOpen={setEditOpen}
        />
      )}
    </div>
  );
}

const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-current opacity-80">{icon}</div>
      </div>
    </div>
  );
};