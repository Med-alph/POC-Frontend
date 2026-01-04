import React, { useState, useEffect } from 'react';
import { X, Shield, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { uiModulesAPI } from '../../api/uiModulesApi';
import { rolesAPI } from '../../api/rolesapi';
import { usePermissions } from '../../contexts/PermissionsContext';
import { UI_MODULES, UI_MODULE_LABELS, convertPlanFeaturesToModules } from '../../constants/Constant';

const CreateRoleModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingRole 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    allowed_ui_modules: [] // Store individual UI modules directly
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tenantAllowedModules, setTenantAllowedModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const { refreshPermissions } = usePermissions();

  useEffect(() => {
    if (isOpen) {
      fetchTenantModules();
    }
  }, [isOpen]);

  const fetchTenantModules = async () => {
    try {
      setLoadingModules(true);
      
      // Get tenant's allowed UI modules (what the plan allows)
      const tenantModules = await uiModulesAPI.getTenantUIModules();
      
      console.log('Tenant allowed modules:', tenantModules);
      
      const allowedKeys = tenantModules.allowedModules || [];
      setTenantAllowedModules(allowedKeys);
      
    } catch (err) {
      console.error('Error fetching tenant modules:', err);
      setError('Failed to load available modules');
    } finally {
      setLoadingModules(false);
    }
  };

  useEffect(() => {
    if (editingRole) {
      console.log('Editing role:', editingRole);
      
      // Handle both old and new role data formats
      let existingModules = [];
      
      if (editingRole.allowed_ui_modules && editingRole.allowed_ui_modules.length > 0) {
        // New format - direct UI modules
        existingModules = editingRole.allowed_ui_modules;
      } else if (editingRole.feature_ids && editingRole.feature_ids.length > 0) {
        // Old format - convert feature IDs to UI modules
        existingModules = convertPlanFeaturesToModules(editingRole.feature_ids);
      }
      
      setFormData({
        name: editingRole.name || editingRole.role_name,
        allowed_ui_modules: existingModules || []
      });
    } else {
      setFormData({
        name: '',
        allowed_ui_modules: []
      });
    }
    setError(null);
  }, [editingRole, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError('Role name is required');
      return;
    }
    
    if (formData.allowed_ui_modules.length === 0) {
      setError('At least one module must be selected');
      return;
    }

    // Check if any selected modules are not allowed by tenant plan
    const unavailableSelected = formData.allowed_ui_modules.filter(
      moduleId => !tenantAllowedModules.includes(moduleId)
    );
    if (unavailableSelected.length > 0) {
      setError('Cannot select modules not included in your current plan');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      if (editingRole) {
        // For editing, use the new UI modules endpoint
        await rolesAPI.updateRoleUIModules(editingRole.id, formData.allowed_ui_modules);
        // Also update the basic role info if needed
        await rolesAPI.updateRole(editingRole.id, { name: formData.name });
      } else {
        // For creating, include UI modules in the creation payload
        const payload = {
          name: formData.name,
          allowed_ui_modules: formData.allowed_ui_modules
        };
        await onSubmit(payload);
      }
      
      // Close modal and refresh parent
      onClose();
      
      // Refresh permissions if this was the current user's role
      await refreshPermissions();
      
    } catch (err) {
      setError(err.message);
      console.error('Role submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModuleToggle = (moduleId, checked) => {
    setFormData(prev => ({
      ...prev,
      allowed_ui_modules: checked 
        ? [...prev.allowed_ui_modules, moduleId]
        : prev.allowed_ui_modules.filter(id => id !== moduleId)
    }));
  };

  const isModuleAvailable = (moduleId) => {
    return tenantAllowedModules.includes(moduleId);
  };

  // Get all UI modules for display
  const allUIModules = Object.entries(UI_MODULES).map(([key, value]) => ({
    key: value,
    label: UI_MODULE_LABELS[key] || key,
    available: isModuleAvailable(value)
  }));

  if (loadingModules) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Loading available modules...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>{editingRole ? 'Edit Role' : 'Create New Role'}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Role Name */}
          <div className="space-y-2">
            <Label htmlFor="role_name">Role Name *</Label>
            <Input
              id="role_name"
              type="text"
              placeholder="e.g., Receptionist, Doctor, Admin"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={loading}
              className="w-full"
            />
          </div>

          {/* Module Access */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Label className="text-base font-semibold">Module Access *</Label>
              <Info className="h-4 w-4 text-gray-400" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              {allUIModules.map((module) => {
                const isAvailable = module.available;
                const isChecked = formData.allowed_ui_modules.includes(module.key);

                return (
                  <div key={module.key} className="flex items-center space-x-3">
                    <Checkbox
                      id={module.key}
                      checked={isChecked}
                      onCheckedChange={(checked) => handleModuleToggle(module.key, checked)}
                      disabled={!isAvailable || loading}
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor={module.key}
                        className={`cursor-pointer ${!isAvailable ? 'text-gray-400' : ''}`}
                      >
                        {module.label}
                      </Label>
                      {!isAvailable && (
                        <div className="text-xs text-orange-500 mt-1">
                          Not included in current plan - upgrade required
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {formData.allowed_ui_modules.length === 0 && (
              <p className="text-sm text-gray-500">
                Select at least one module for this role
              </p>
            )}
            
            {tenantAllowedModules.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No modules are available in your current plan. Please upgrade to create roles.
                </AlertDescription>
              </Alert>
            )}
            
            {tenantAllowedModules.length > 0 && (
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Plan Information:</span>
                </div>
                <p className="mt-1">
                  {tenantAllowedModules.length} modules available in your current plan. 
                  Disabled modules require a plan upgrade.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || formData.allowed_ui_modules.length === 0}
              className="min-w-[120px]"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{editingRole ? 'Updating...' : 'Creating...'}</span>
                </div>
              ) : (
                editingRole ? 'Update Role' : 'Create Role'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoleModal;