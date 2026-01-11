import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { uiModulesAPI } from '../api/uiModulesApi';

const PermissionsContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

export const PermissionsProvider = ({ children }) => {
  const [allowedModules, setAllowedModules] = useState([]);
  const [disabledModules, setDisabledModules] = useState([]);
  const [tenantPlan, setTenantPlan] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen to authentication state changes
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Small delay to ensure login response is stored in localStorage
      const timer = setTimeout(() => {
        fetchUIModules();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // Clear permissions when not authenticated
      setAllowedModules([]);
      setDisabledModules([]);
      setTenantPlan('');
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchUIModules = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching UI modules...');
      
      // Check if we have UI modules from login response first
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('User from localStorage:', user);
      
      // Check for uiModules in user object first, then check root level
      let uiModules = user.uiModules;
      if (!uiModules) {
        // Try to get the full login response which might have uiModules at root level
        const loginResponse = JSON.parse(localStorage.getItem('loginResponse') || '{}');
        uiModules = loginResponse.uiModules;
        console.log('Login response from localStorage:', loginResponse);
      }
      
      if (uiModules) {
        console.log('✅ UI Modules found in localStorage:', uiModules);
        setAllowedModules(uiModules.allowedModules || []);
        setDisabledModules(uiModules.disabledModules || []);
        setTenantPlan(uiModules.tenantPlan || '');
        setError(null);
        setLoading(false);
        return;
      }

      console.log('⚠️ UI Modules not found in localStorage, fetching from new API...');
      // Use the new final modules endpoint that returns intersection
      const response = await uiModulesAPI.getFinalUserUIModules();
      console.log('✅ Final UI Modules fetched from API:', response);
      setAllowedModules(response.allowedModules || []);
      setDisabledModules(response.disabledModules || []);
      setTenantPlan(response.tenantPlan || '');
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching UI modules:', err);
      setError('Failed to load permissions');
      setAllowedModules([]);
      setDisabledModules([]);
    } finally {
      setLoading(false);
    }
  };

  const hasModule = (module) => {
    const result = allowedModules.includes(module);
    console.log(`hasModule check: ${module} -> ${result}`, 'allowedModules:', allowedModules);
    return result;
  };

  const hasAnyModule = (modules) => {
    return modules.some(module => allowedModules.includes(module));
  };

  const hasAllModules = (modules) => {
    return modules.every(module => allowedModules.includes(module));
  };

  const isModuleDisabled = (module) => {
    return disabledModules.includes(module);
  };

  const refreshPermissions = async () => {
    // Clear localStorage cache and fetch fresh permissions
    localStorage.removeItem('loginResponse');
    await fetchUIModules();
  };

  const value = {
    allowedModules,
    disabledModules,
    tenantPlan,
    loading,
    error,
    hasModule,
    hasAnyModule,
    hasAllModules,
    isModuleDisabled,
    refreshPermissions,
    // Legacy support for existing code
    userFeatures: allowedModules,
    hasFeature: hasModule,
    hasAnyFeature: hasAnyModule,
    hasAllFeatures: hasAllModules,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

export default PermissionsContext;