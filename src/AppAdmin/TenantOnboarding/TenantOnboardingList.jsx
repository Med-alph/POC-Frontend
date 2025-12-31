import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Filter, Download, Eye, Edit, Trash2 } from 'lucide-react';
import TenantOnboardingDialog from './TenantOnboardingDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import tenantsAPI from '../../api/tenantsapi';
import plansApi from '../../api/plansapi';

export default function TenantOnboardingList() {
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Fetch data
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
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  // Filter tenants
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tenant.status.toLowerCase() === statusFilter.toLowerCase();
    
    const matchesPlan = planFilter === 'all' || 
                       (tenant.plan_type && tenant.plan_type.toLowerCase() === planFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesPlan;
  });

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

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Type', 'Email', 'Phone', 'Plan', 'Status', 'City', 'Created'];
    const csvData = filteredTenants.map(tenant => [
      tenant.id,
      tenant.name,
      tenant.type,
      tenant.email,
      Array.isArray(tenant.phone) ? tenant.phone.join('; ') : tenant.phone,
      tenant.plan_type || 'N/A',
      tenant.status,
      tenant.address_city || tenant.city || '',
      tenant.created_at ? new Date(tenant.created_at).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tenants-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-6">Loading tenants...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Tenants</h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor all onboarded tenants
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
          <Download size={16} />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="all">All Plans</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.name.toLowerCase()}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {filteredTenants.length} of {tenants.length} tenants
        </span>
        {(searchTerm || statusFilter !== 'all' || planFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setPlanFilter('all');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Tenant Table */}
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead>ID</TableHead>
                <TableHead>Tenant Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No tenants found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants
                  .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
                  .map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-mono text-sm">{tenant.id}</TableCell>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>{tenant.type}</TableCell>
                      <TableCell>{tenant.email}</TableCell>
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
                      <TableCell>{tenant.allowed_users || 'N/A'}</TableCell>
                      <TableCell>
                        {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => { setSelectedTenant(tenant); setViewOpen(true); }}
                          >
                            <Eye size={14} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => { setSelectedTenant(tenant); setEditOpen(true); }}
                          >
                            <Edit size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tenant Details</DialogTitle>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-4 text-sm">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold text-lg">Basic Info</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <p><strong>Name:</strong> {selectedTenant.name}</p>
                  <p><strong>Type:</strong> {selectedTenant.type}</p>
                  <p><strong>Email:</strong> {selectedTenant.email}</p>
                  <p><strong>Phone:</strong> {Array.isArray(selectedTenant.phone) ? selectedTenant.phone.join(", ") : selectedTenant.phone}</p>
                </div>
              </div>

              {/* Plan Info */}
              <div>
                <h3 className="font-semibold text-lg">Subscription Details</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <p><strong>Plan:</strong> 
                    <Badge className={`ml-2 ${getPlanBadgeColor(selectedTenant.plan_type)}`}>
                      {selectedTenant.plan_type || 'N/A'}
                    </Badge>
                  </p>
                  <p><strong>Status:</strong> 
                    <Badge className={`ml-2 ${getStatusBadgeColor(selectedTenant.status)}`}>
                      {selectedTenant.status}
                    </Badge>
                  </p>
                  <p><strong>Max Users:</strong> {selectedTenant.allowed_users || 'N/A'}</p>
                  <p><strong>Plan Start:</strong> {selectedTenant.plan_start ? new Date(selectedTenant.plan_start).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>

              {/* Admin Info */}
              <div>
                <h3 className="font-semibold text-lg">Admin Contact</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <p><strong>Name:</strong> {selectedTenant.super_admin_name || 'N/A'}</p>
                  <p><strong>Email:</strong> {selectedTenant.super_admin_email || 'N/A'}</p>
                  <p><strong>Phone:</strong> {selectedTenant.super_admin_phone || 'N/A'}</p>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="font-semibold text-lg">Location</h3>
                <p>{selectedTenant.address_city}, {selectedTenant.address_state}, {selectedTenant.address_country}</p>
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