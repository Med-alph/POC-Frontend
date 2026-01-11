import React, { useState, useEffect } from 'react';
import { ChevronDown, Users } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { rolesAPI } from '../../api/rolesapi';

const RoleAssignmentDropdown = ({ 
  value, 
  onChange, 
  required = false, 
  disabled = false,
  label = "Role",
  placeholder = "Select a role..."
}) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await rolesAPI.getRolesDropdown();
      console.log('Roles API response:', response);
      console.log('Roles data:', response.data);
      // Handle both response formats: direct array or wrapped in data property
      const rolesData = response.data || response || [];
      console.log('Final roles data:', rolesData);
      setRoles(rolesData);
    } catch (err) {
      setError('Failed to load roles');
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>{label} {required && <span className="text-red-500">*</span>}</Label>
        <div className="flex items-center space-x-2 p-3 border rounded-md bg-gray-50">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Loading roles...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label>{label} {required && <span className="text-red-500">*</span>}</Label>
        <div className="p-3 border rounded-md bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="role-select">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled || !roles || roles.length === 0}
      >
        <SelectTrigger id="role-select" className="w-full">
          <SelectValue placeholder={
            !roles || roles.length === 0 
              ? "No roles available" 
              : placeholder
          } />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 italic">No role assigned</span>
            </div>
          </SelectItem>
          {roles && roles.map((role) => (
            <SelectItem key={role.id} value={role.id.toString()}>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span>{role.name || role.role_name}</span>
                {role.module_count && (
                  <span className="text-xs text-gray-500">
                    ({role.module_count} modules)
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {(!roles || roles.length === 0) && (
        <p className="text-xs text-gray-500">
          No roles available. Create roles first in the Roles & Access section.
        </p>
      )}
    </div>
  );
};

export default RoleAssignmentDropdown;