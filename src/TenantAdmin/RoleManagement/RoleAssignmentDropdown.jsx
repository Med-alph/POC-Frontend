import React, { useState, useEffect } from 'react';
import { ChevronDown, Users } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuCheckboxItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { rolesAPI } from '../../api/rolesapi';
import { cn } from "@/lib/utils";

const RoleAssignmentDropdown = ({ 
  value = [], // Expect an array now
  onChange, 
  required = false, 
  disabled = false,
  label = "Roles",
  placeholder = "Select roles..."
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

  const selectedRoles = Array.isArray(value) ? value : [];

  const toggleRole = (roleId) => {
    const idStr = roleId.toString();
    let newRoles;
    if (selectedRoles.includes(idStr)) {
      newRoles = selectedRoles.filter(id => id !== idStr);
    } else {
      newRoles = [...selectedRoles, idStr];
    }
    onChange(newRoles);
  };

  const getDisplayValue = () => {
    if (selectedRoles.length === 0) return placeholder;
    if (selectedRoles.length === 1) {
      const role = roles.find(r => r.id.toString() === selectedRoles[0]);
      return role ? (role.name || role.role_name) : placeholder;
    }
    return `${selectedRoles.length} Roles Selected`;
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={disabled || !roles || roles.length === 0}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              disabled && "bg-gray-50 opacity-50 cursor-not-allowed"
            )}
          >
            <span className={cn("truncate", selectedRoles.length === 0 && "text-muted-foreground")}>
              {getDisplayValue()}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[250px] max-h-[300px] overflow-y-auto">
          <DropdownMenuLabel>Available Roles</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {roles && roles.length > 0 ? (
            roles.map((role) => {
              const idStr = role.id.toString();
              const isChecked = selectedRoles.includes(idStr);
              return (
                <DropdownMenuCheckboxItem
                  key={role.id}
                  checked={isChecked}
                  onCheckedChange={() => toggleRole(role.id)}
                  onSelect={(e) => e.preventDefault()} // Keep open on toggle
                  className="cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{role.name || role.role_name}</span>
                    {role.module_count && (
                      <span className="text-[10px] text-gray-500 italic">
                        {role.module_count} permission modules
                      </span>
                    )}
                  </div>
                </DropdownMenuCheckboxItem>
              );
            })
          ) : (
            <div className="p-2 text-xs text-gray-500 italic">No roles available</div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedRoles.length > 0 && roles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedRoles.map(id => {
            const role = roles.find(r => r.id.toString() === id);
            if (!role) return null;
            return (
              <div 
                key={id} 
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold"
              >
                <Users size={10} />
                {role.name || role.role_name}
                <button 
                  type="button"
                  onClick={() => toggleRole(id)}
                  className="ml-0.5 hover:text-blue-900"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {(!roles || roles.length === 0) && !loading && (
        <p className="text-xs text-gray-500 italic">
          No roles available. Create roles first in the Roles & Access section.
        </p>
      )}
    </div>
  );
};

export default RoleAssignmentDropdown;