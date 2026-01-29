/**
 * Auth Context with Session Management
 * 
 * Provides authentication state and session management functionality.
 * Handles JWT tokens, session IDs, and multi-tenant context.
 * 
 * Security:
 * - Tokens stored in memory (not localStorage)
 * - Session IDs tracked and validated
 * - Automatic logout on session invalidation
 * - Tenant/Hospital IDs derived from token (never user-editable)
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setSecureItem, 
  getSecureItem, 
  removeSecureItem, 
  clearSecureStorage,
  SECURE_KEYS 
} from '../utils/secureStorage';
import { clearCredentials } from '../features/auth/authSlice';
import { authAPI } from '../api/authapi';
import { sessionAPI } from '../api/sessionapi';
import { setSessionInvalidationHandler } from '../services/apiInterceptor';
import { baseUrl } from '../constants/Constant';

const AuthContext = createContext(null);

/**
 * Decode JWT token to extract payload
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload
 */
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('[AuthContext] Failed to decode JWT:', error);
    return null;
  }
};

/**
 * Extract tenant_id and hospital_id from JWT token
 * @param {string} token - JWT token
 * @returns {{tenant_id: string|null, hospital_id: string|null}}
 */
const extractTenantContext = (token) => {
  if (!token) return { tenant_id: null, hospital_id: null };
  
  const payload = decodeJWT(token);
  if (!payload) return { tenant_id: null, hospital_id: null };
  
  return {
    tenant_id: payload.tenant_id || payload.tenantId || null,
    hospital_id: payload.hospital_id || payload.hospitalId || null,
  };
};

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const reduxToken = useSelector((state) => state.auth.token);
  const reduxUser = useSelector((state) => state.auth.user);
  
  const [sessionId, setSessionId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSessionValid, setIsSessionValid] = useState(true);

  /**
   * Initialize auth state from secure storage and set up API interceptor
   */
  useEffect(() => {
    const initAuth = () => {
      try {
        // First check memory storage
        let storedToken = getSecureItem(SECURE_KEYS.JWT_TOKEN);
        let storedSessionId = getSecureItem(SECURE_KEYS.SESSION_ID);
        
        // If not in memory (e.g., after page refresh), load from localStorage
        if (!storedToken) {
          const localStorageToken = localStorage.getItem('access_token');
          if (localStorageToken) {
            storedToken = localStorageToken;
            // Restore to memory storage
            setSecureItem(SECURE_KEYS.JWT_TOKEN, storedToken);
          }
        }
        
        if (!storedSessionId) {
          const localStorageSessionId = localStorage.getItem('session_id');
          if (localStorageSessionId) {
            storedSessionId = localStorageSessionId;
            // Restore to memory storage
            setSecureItem(SECURE_KEYS.SESSION_ID, storedSessionId);
          }
        }
        
        // If we have a token in Redux but not in secure storage, sync it
        if (reduxToken && !storedToken) {
          setSecureItem(SECURE_KEYS.JWT_TOKEN, reduxToken);
          localStorage.setItem('access_token', reduxToken);
          const context = extractTenantContext(reduxToken);
          if (context.tenant_id) setSecureItem(SECURE_KEYS.TENANT_ID, context.tenant_id);
          if (context.hospital_id) setSecureItem(SECURE_KEYS.HOSPITAL_ID, context.hospital_id);
        }
        
        // If we have a stored token, use it
        if (storedToken) {
          setSessionId(storedSessionId);
          setIsSessionValid(true);
        }
        
        // Register session invalidation handler with API interceptor
        setSessionInvalidationHandler(handleSessionInvalidation);
      } catch (error) {
        console.error('[AuthContext] Initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    
    initAuth();
  }, [reduxToken]);

  /**
   * Handle page close/unload - logout user
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Only logout if user is authenticated
      const token = getSecureItem(SECURE_KEYS.JWT_TOKEN);
      if (!token) return;

      const currentSessionId = getSecureItem(SECURE_KEYS.SESSION_ID);
      
      try {
        // Prepare headers
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };
        if (currentSessionId) {
          headers['X-Session-Id'] = currentSessionId;
        }
        
        // Use fetch with keepalive for reliable logout on page close
        const logoutUrl = `${baseUrl}/auth/logout`;
        fetch(logoutUrl, {
          method: 'POST',
          headers: headers,
          keepalive: true, // Ensures request completes even if page closes
          body: JSON.stringify({}),
        }).catch(() => {
          // Ignore errors during page unload
        });
      } catch (error) {
        // Ignore errors during page unload
        console.warn('[AuthContext] Logout on page close failed:', error);
      }
    };

    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  /**
   * Set authentication credentials (called after login)
   * @param {object} loginResponse - Login response with access_token, session_id, user
   */
  const setAuthCredentials = useCallback((loginResponse) => {
    try {
      const { access_token, session_id, user } = loginResponse;
      
      if (!access_token) {
        throw new Error('No access token in login response');
      }
      
      // Store in secure storage (memory)
      setSecureItem(SECURE_KEYS.JWT_TOKEN, access_token);
      if (session_id) {
        setSecureItem(SECURE_KEYS.SESSION_ID, session_id);
        setSessionId(session_id);
      }
      
      // Store in localStorage for persistence across page refreshes
      localStorage.setItem('access_token', access_token);
      if (session_id) {
        localStorage.setItem('session_id', session_id);
      }
      
      // Extract and store tenant/hospital IDs from token (never user-editable)
      const context = extractTenantContext(access_token);
      if (context.tenant_id) {
        setSecureItem(SECURE_KEYS.TENANT_ID, context.tenant_id);
      }
      if (context.hospital_id) {
        setSecureItem(SECURE_KEYS.HOSPITAL_ID, context.hospital_id);
      }
      
      setIsSessionValid(true);
    } catch (error) {
      console.error('[AuthContext] Failed to set credentials:', error);
      throw error;
    }
  }, []);

  /**
   * Clear authentication and logout
   * @param {boolean} redirectToLogin - Whether to redirect to login page
   */
  const logout = useCallback(async (redirectToLogin = true) => {
    try {
      const currentSessionId = getSecureItem(SECURE_KEYS.SESSION_ID);
      
      // Call logout API endpoint
      try {
        await authAPI.logout();
      } catch (error) {
        console.error('[AuthContext] Logout API error:', error);
        // Continue with logout even if API call fails
      }
      
      // Also revoke current session on backend (if session_id exists)
      if (currentSessionId) {
        try {
          await sessionAPI.revokeSession(currentSessionId);
        } catch (error) {
          console.error('[AuthContext] Failed to revoke session:', error);
          // Continue with logout even if API call fails
        }
      }
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
    } finally {
      // Clear secure storage
      clearSecureStorage();
      // Clear localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('session_id');
      setSessionId(null);
      setIsSessionValid(false);
      
      // Clear Redux state
      dispatch(clearCredentials());
      
      // Redirect to login using window.location (works outside Router context)
      if (redirectToLogin) {
        window.location.href = '/';
      }
    }
  }, [dispatch]);

  /**
   * Handle session invalidation (called by API interceptor)
   */
  const handleSessionInvalidation = useCallback((reason = 'Session expired or invalid') => {
    console.warn('[AuthContext] Session invalidated:', reason);
    setIsSessionValid(false);
    clearSecureStorage();
    // Clear localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('session_id');
    dispatch(clearCredentials());
    // Use window.location for navigation (works outside Router context)
    window.location.href = '/';
  }, [dispatch]);

  /**
   * Get current JWT token
   */
  const getToken = useCallback(() => {
    return getSecureItem(SECURE_KEYS.JWT_TOKEN) || reduxToken;
  }, [reduxToken]);

  /**
   * Get current session ID
   */
  const getCurrentSessionId = useCallback(() => {
    return getSecureItem(SECURE_KEYS.SESSION_ID) || sessionId;
  }, [sessionId]);

  /**
   * Get tenant ID (derived from token, never user-editable)
   */
  const getTenantId = useCallback(() => {
    const stored = getSecureItem(SECURE_KEYS.TENANT_ID);
    if (stored) return stored;
    
    // Fallback: extract from current token
    const token = getToken();
    if (token) {
      const context = extractTenantContext(token);
      if (context.tenant_id) {
        setSecureItem(SECURE_KEYS.TENANT_ID, context.tenant_id);
        return context.tenant_id;
      }
    }
    return null;
  }, [getToken]);

  /**
   * Get hospital ID (derived from token, never user-editable)
   */
  const getHospitalId = useCallback(() => {
    const stored = getSecureItem(SECURE_KEYS.HOSPITAL_ID);
    if (stored) return stored;
    
    // Fallback: extract from current token
    const token = getToken();
    if (token) {
      const context = extractTenantContext(token);
      if (context.hospital_id) {
        setSecureItem(SECURE_KEYS.HOSPITAL_ID, context.hospital_id);
        return context.hospital_id;
      }
    }
    return null;
  }, [getToken]);

  /**
   * Check if token is expired
   */
  const isTokenExpired = useCallback(() => {
    const token = getToken();
    if (!token) return true;
    
    try {
      const payload = decodeJWT(token);
      if (!payload || !payload.exp) return true;
      
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }, [getToken]);

  const value = {
    // State
    isAuthenticated: !!getToken() && isSessionValid,
    isInitialized,
    isSessionValid,
    sessionId: getCurrentSessionId(),
    user: reduxUser,
    
    // Methods
    setAuthCredentials,
    logout,
    handleSessionInvalidation,
    getToken,
    getCurrentSessionId,
    getTenantId,
    getHospitalId,
    isTokenExpired,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

