import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import subscriptionsApi from '../api/subscriptionsapi';
import { useAuth } from '../contexts/AuthContext';

const SubscriptionContext = createContext(null);

/**
 * SubscriptionProvider
 * Fetches and manages subscription status globally.
 */
export const SubscriptionProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      // Fetch both status and final modules in parallel for efficiency
      const [statusData, modulesData] = await Promise.all([
        subscriptionsApi.getSubscriptionStatus().catch(err => {
          console.error('Subscription Status Error:', err);
          return null;
        }),
        subscriptionsApi.getFinalModules().catch(err => {
          console.error('Final Modules Error:', err);
          return null;
        })
      ]);
      
      // Combine results. modulesData is now the ultimate source for gating.
      setStatus({
        ...statusData,
        ...modulesData // This brings allowedModules, disabledModules to root
      });
      setError(null);
    } catch (err) {
      console.error('[SubscriptionProvider] Failed to fetch status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Derived values for easier consumption
  const isTrial = status?.status === 'trialing';
  const isGrace = status?.status === 'grace';
  const isExpired = status?.status === 'expired';
  const isActive = status?.status === 'active';
  const isReadOnly = status?.is_read_only || isExpired;
  
  const daysLeft = status?.days_left || 0;
  const limits = status?.limits || {};
  const activation = status?.activation || {};
  const { user } = useAuth();
  
  // Combine disabled modules from API status AND the user profile (Redux/LocalStorage)
  // The login response often contains uiModules, so we use it as a reliable source.
  const disabledModules = React.useMemo(() => {
    const fromStatus = status?.uiModules?.disabledModules || status?.disabledModules || [];
    const fromUser = user?.uiModules?.disabledModules || [];
    
    // Merge and de-duplicate
    return Array.from(new Set([...fromStatus, ...fromUser]));
  }, [status, user]);

  // Helper to check if a specific module is disabled
  const isModuleDisabled = useCallback((moduleName) => {
    if (!moduleName || !disabledModules) return false;
    const normalizedName = moduleName.toUpperCase();
    return disabledModules.some(m => m && m.toUpperCase() === normalizedName);
  }, [disabledModules]);

  const contextValue = {
    status: status?.status,
    isTrial,
    isGrace,
    isExpired,
    isActive,
    isReadOnly,
    daysLeft,
    limits,
    activation,
    disabledModules,
    isModuleDisabled,
    loading,
    error,
    refreshStatus: fetchStatus
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

/**
 * useSubscription hook
 * Consumes the global subscription context.
 */
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined || context === null) {
    // If used outside provider, return default values or throw error
    // For smoother transition, we return a loading state or default.
    return {
      status: null,
      isTrial: false,
      isGrace: false,
      isExpired: false,
      isActive: false,
      isReadOnly: false,
      daysLeft: 0,
      limits: {},
      activation: {},
      disabledModules: [],
      isModuleDisabled: () => false,
      loading: true,
      error: null,
      refreshStatus: () => {}
    };
  }
  return context;
};
