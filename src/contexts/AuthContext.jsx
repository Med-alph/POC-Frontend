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
import { clearCredentials, checkAuth } from '../features/auth/authSlice';
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
   * Initialize auth state and check session status via cookies
   */
  useEffect(() => {
    const validateSession = async () => {
      // Skip validation for public routes and patient routes
      const publicRoutes = ['/', '/landing', '/otp-verification', '/patient-details', '/patient-details-form', '/appointment', '/confirmation', '/auth-callback', '/forgotpassword', '/change-password', '/admin/login', '/privacy-policy', '/terms-of-service'];
      const currentPath = window.location.pathname;

      if (publicRoutes.includes(currentPath) || currentPath.startsWith('/patient-dashboard')) {
        console.log('[AuthContext] Skipping validation for public/patient route:', currentPath);
        setIsInitialized(true);
        return;
      }

      console.log('[AuthContext] Initial validation starting...');
      try {
        // SOC 2: Check authentication status using httpOnly cookies by calling /auth/me
        const result = await dispatch(checkAuth()).unwrap();

        if (result) {
          console.log('[AuthContext] Initial validation success:', result.user?.email);
          setIsSessionValid(true);
        }

        // Register session invalidation handler with API interceptor
        setSessionInvalidationHandler(handleSessionInvalidation);
      } catch (error) {
        console.warn('[AuthContext] Initial validation failed:', error);
        setIsSessionValid(false);
      } finally {
        setIsInitialized(true);
      }
    };

    validateSession();
  }, [dispatch]);

  // Removed beforeunload logout as it triggers on page refresh, clearing secure sessions unexpectedly.
  // Security should be handled by cookie expiration (maxAge) and session validation on backend.

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

      // SOC 2: Token is handled via httpOnly cookies
      // Store in memory for immediate use if needed by other components
      setSecureItem(SECURE_KEYS.JWT_TOKEN, access_token);

      if (session_id) {
        setSecureItem(SECURE_KEYS.SESSION_ID, session_id);
        setSessionId(session_id);
      }

      // Extract and store tenant/hospital IDs from token
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
      // 1. Attempt to call logout API (to clear httpOnly cookie on backend)
      // SOC 2: Always try to notify backend for session invalidation
      await authAPI.logout().catch(err => {
        console.warn('[AuthContext] API logout failed, proceeding with local cleanup:', err.message);
      });
    } catch (error) {
      console.error('[AuthContext] Logout logic error:', error);
    } finally {
      // 2. ABSOLUTELY clear all local and physical storage regardless of API success
      // Uses the unified utility from utils/auth.js
      import('../utils/auth').then(m => m.clearAuthData());

      clearSecureStorage();

      // Manual cleanup for redundant keys to be safe
      localStorage.removeItem('user');
      localStorage.removeItem('session_id');
      localStorage.removeItem('access_token');
      localStorage.removeItem('loginResponse');
      localStorage.removeItem('isAuthenticated'); // Patient-side auth flag
      sessionStorage.clear();

      setSessionId(null);
      setIsSessionValid(false);

      // 3. Clear Redux state
      dispatch(clearCredentials());

      // 4. Redirect using window.location to ensure a clean slate
      // 4. Redirect using window.location to ensure a clean slate
      if (redirectToLogin) {
        // If on patient routes, redirect to landing
        const path = window.location.pathname;
        const isPatientRoute = path.startsWith('/patient-dashboard') ||
          path === '/landing' ||
          path === '/otp-verification' ||
          path === '/patient-details';

        if (isPatientRoute) {
          window.location.href = '/landing';
        } else {
          window.location.href = '/';
        }
      }
    }
  }, [dispatch]);

  /**
   * Handle session invalidation (called by API interceptor)
   */
  const handleSessionInvalidation = useCallback((reason = 'Session expired or invalid') => {
    console.warn('[AuthContext] Session invalidated:', reason);

    // 1. Comprehensive local cleanup
    import('../utils/auth').then(m => m.clearAuthData());
    clearSecureStorage();

    localStorage.removeItem('user');
    localStorage.removeItem('session_id');
    localStorage.removeItem('access_token');
    localStorage.removeItem('loginResponse');
    sessionStorage.clear();

    // 2. Clear Redux state
    dispatch(clearCredentials());

    // 3. Redirect to login
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

  useEffect(() => {
    if (isInitialized) {
      console.log('[AuthContext] AuthProvider fully initialized and mounted');
    }
  }, [isInitialized]);

  if (!isInitialized) {
    return (
      <div id="auth-loading-screen" className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 font-medium animate-pulse">Restoring your secure session...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('[useAuth] Error: Component is outside of AuthProvider.');
    throw new Error('useAuth must be used within AuthProvider. Ensure that your component is a child of the AuthProvider in main.jsx or App.jsx.');
  }
  return context;
};

