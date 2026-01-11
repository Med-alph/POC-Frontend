import React, { useState, useEffect } from 'react';
import { Plus, Users, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import RolesList from './RolesList';
import CreateRoleModal from './CreateRoleModal';
import { rolesAPI } from '../../api/rolesapi';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const rolesResponse = await rolesAPI.getRoles();
      
      // Handle different response structures
      const rolesData = rolesResponse?.data || rolesResponse || [];
      
      console.log('Roles API Response:', rolesResponse);
      
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError(err.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (roleData) => {
    try {
      await rolesAPI.createRole(roleData);
      await fetchRoles(); // Refresh the list
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating role:', err);
      throw new Error(err.message || 'Failed to create role');
    }
  };

  const handleUpdateRole = async (roleData) => {
    try {
      // The CreateRoleModal now handles the update internally
      await fetchRoles(); // Just refresh the list
      setEditingRole(null);
    } catch (err) {
      console.error('Error updating role:', err);
      throw new Error(err.message || 'Failed to update role');
    }
  };

  const handleDeleteRole = async (roleId) => {
    try {
      await rolesAPI.deleteRole(roleId);
      await fetchRoles(); // Refresh the list
    } catch (err) {
      console.error('Error deleting role:', err);
      throw new Error(err.message || 'Failed to delete role');
    }
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading roles...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Roles & Access</h1>
            <p className="text-gray-600">Manage staff roles and module permissions</p>
          </div>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Role</span>
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {roles && roles.length === 0 && !error ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No roles created yet</h3>
          <p className="text-gray-600 mb-6">Create roles to control staff access to different modules</p>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Your First Role</span>
          </Button>
        </div>
      ) : roles && roles.length > 0 ? (
        /* Roles List */
        <RolesList 
          roles={roles}
          onEdit={handleEditRole}
          onDelete={handleDeleteRole}
        />
      ) : null}

      {/* Create/Edit Role Modal */}
      {(showCreateModal || editingRole) && (
        <CreateRoleModal
          isOpen={showCreateModal || !!editingRole}
          onClose={() => {
            setShowCreateModal(false);
            setEditingRole(null);
          }}
          onSubmit={editingRole ? handleUpdateRole : handleCreateRole}
          editingRole={editingRole}
        />
      )}
    </div>
  );
};

export default RoleManagement;