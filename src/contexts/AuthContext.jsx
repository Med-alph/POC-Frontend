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
import { isPlatformAppAdmin } from '../utils/subdomain';
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

const AuthContext = createContext(null);
export default AuthContext;

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
  const [isSessionValid, setIsSessionValid] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 1. Multi-tab synchronization broadcast helper
  const broadcastLogout = useCallback((reason) => {
    try {
      const channel = new BroadcastChannel('medalph_auth_channel');
      channel.postMessage({ type: 'LOGOUT', reason });
      channel.close();
    } catch (e) {
      console.warn('[AuthContext] Broadcast logout sync failed:', e);
    }
    // localStorage fallback trigger for older browsers
    localStorage.setItem('medalph_logout_trigger', `${reason}_${Date.now()}`);
    setTimeout(() => {
      localStorage.removeItem('medalph_logout_trigger');
    }, 1000);
  }, []);

  // 2. Handle session invalidation (called by API interceptor and BroadcastChannel)
  const handleSessionInvalidation = useCallback((reason = 'SESSION_REVOKED') => {
    console.warn('[AuthContext] Session invalidated:', reason);

    // Synchronize logout across other open tabs
    broadcastLogout(reason);

    // Comprehensive local cleanup
    import('../utils/auth').then(m => m.clearAuthData());
    clearSecureStorage();

    localStorage.removeItem('user');
    localStorage.removeItem('session_id');
    localStorage.removeItem('access_token');
    localStorage.removeItem('loginResponse');
    localStorage.removeItem('isAuthenticated');
    sessionStorage.clear();

    // Clear Redux state
    dispatch(clearCredentials());

    // Redirect to login with reason
    const path = window.location.pathname;
    const isPatientRoute = path.startsWith('/patient-dashboard') ||
      path === '/landing' ||
      path === '/otp-verification' ||
      path === '/patient-details';

    if (isPatientRoute) {
      window.location.href = `/landing?reason=${reason}`;
    } else {
      window.location.href = `/?reason=${reason}`;
    }
  }, [dispatch, broadcastLogout]);

  // 3. Clear authentication and logout
  const logout = useCallback(async (redirectToLogin = true, reason = 'SESSION_REVOKED') => {
    try {
      setIsLoggingOut(true);

      // ✅ CRITICAL: Call backend logout FIRST before broadcasting.
      // The backend clears httpOnly cookies (access_token, refresh_token) via Set-Cookie response headers.
      // httpOnly cookies CANNOT be deleted from JS — the server response is the ONLY way to remove them.
      // We must await this before redirecting, otherwise the page unloads before the response arrives.
      const logoutTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Logout API timeout')), 5000)
      );
      await Promise.race([authAPI.logout(), logoutTimeout]).catch(err => {
        console.warn('[AuthContext] API logout call failed/timed-out, proceeding with local cleanup:', err.message);
      });

      // Broadcast to other tabs AFTER the API call completes (or times out).
      // This prevents the storage event from triggering a redirect in this tab
      // before the logout API has had a chance to clear the HttpOnly cookies.
      broadcastLogout(reason);

    } catch (error) {
      console.error('[AuthContext] Logout logic error:', error);
    } finally {
      // ✅ Belt-and-suspenders: clear any non-httpOnly cookies or residual values
      // that might have been set during older sessions or by non-httpOnly flows.
      try {
        const cookiesToClear = ['access_token', 'refresh_token', 'session_id'];
        cookiesToClear.forEach(name => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });
      } catch (_) { /* silently skip if cookies API unavailable */ }

      import('../utils/auth').then(m => m.clearAuthData());
      clearSecureStorage();

      localStorage.removeItem('user');
      localStorage.removeItem('session_id');
      localStorage.removeItem('access_token');
      localStorage.removeItem('loginResponse');
      localStorage.removeItem('isAuthenticated');
      sessionStorage.clear();

      setSessionId(null);
      setIsSessionValid(false);

      dispatch(clearCredentials());

      if (redirectToLogin) {
        const path = window.location.pathname;
        const isPatientRoute = path.startsWith('/patient-dashboard') ||
          path === '/landing' ||
          path === '/otp-verification' ||
          path === '/patient-details';

        if (isPatientRoute) {
          window.location.href = `/landing?reason=${reason}`;
        } else {
          window.location.href = `/?reason=${reason}`;
        }
      } else {
        setIsLoggingOut(false);
      }
    }
  }, [dispatch, broadcastLogout]);

  // 4. Initial state loader
  const [isInitialized, setIsInitialized] = useState(() => {
    if (isPlatformAppAdmin()) return true;

    const publicRoutes = ['/', '/landing', '/otp-verification', '/patient-details', '/patient-details-form', '/appointment', '/confirmation', '/auth-callback', '/forgotpassword', '/change-password', '/admin/login', '/privacy-policy', '/terms-of-service'];
    const currentPath = window.location.pathname;
    return publicRoutes.includes(currentPath) || currentPath.startsWith('/patient-dashboard');
  });

  // 5. Initialize auth state and check session status via cookies
  useEffect(() => {
    const validateSession = async () => {
      const currentPath = window.location.pathname;
      const publicRoutes = ['/', '/landing', '/otp-verification', '/patient-details', '/patient-details-form', '/appointment', '/confirmation', '/auth-callback', '/forgotpassword', '/change-password', '/admin/login', '/privacy-policy', '/terms-of-service'];

      if (isPlatformAppAdmin() || publicRoutes.includes(currentPath) || currentPath.startsWith('/patient-dashboard')) {
        console.log('[AuthContext] Skipping validation for route/appmode:', currentPath);
        setIsInitialized(true);
        return;
      }

      console.log('[AuthContext] Initial validation starting...');
      try {
        const result = await dispatch(checkAuth()).unwrap();

        if (result) {
          console.log('[AuthContext] Initial validation success:', result.user?.email);
          setIsSessionValid(true);
        }

        setSessionInvalidationHandler(handleSessionInvalidation);
      } catch (error) {
        console.warn('[AuthContext] Initial validation failed:', error);
        setIsSessionValid(false);
      } finally {
        setIsInitialized(true);
      }
    };

    validateSession();
  }, [dispatch, handleSessionInvalidation]);

  // 6. Multi-tab synchronization listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let authChannel;
    try {
      authChannel = new BroadcastChannel('medalph_auth_channel');
      authChannel.onmessage = (event) => {
        console.log('[AuthContext] Multi-tab sync message received:', event.data);
        if (event.data?.type === 'LOGOUT') {
          const intentAuth = localStorage.getItem('isAuthenticated') === 'true';
          if (intentAuth) {
            handleSessionInvalidation(event.data.reason || 'MULTI_TAB_LOGOUT');
          }
        }
      };
    } catch (e) {
      console.warn('[AuthContext] BroadcastChannel failed to initialize:', e);
    }

    const handleStorageEvent = (event) => {
      if (event.key === 'medalph_logout_trigger' && event.newValue) {
        console.log('[AuthContext] Multi-tab localStorage fallback logout triggered');
        const [reason] = event.newValue.split('_');
        const intentAuth = localStorage.getItem('isAuthenticated') === 'true';
        if (intentAuth) {
          handleSessionInvalidation(reason || 'MULTI_TAB_LOGOUT');
        }
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      if (authChannel) authChannel.close();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [handleSessionInvalidation]);

  // 7. Set authentication credentials (called after login)
  const setAuthCredentials = useCallback((loginResponse) => {
    try {
      const { access_token, session_id, user } = loginResponse;

      if (!access_token) {
        throw new Error('No access token in login response');
      }

      setSecureItem(SECURE_KEYS.JWT_TOKEN, access_token);

      if (session_id) {
        setSecureItem(SECURE_KEYS.SESSION_ID, session_id);
        setSessionId(session_id);
      }

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
    // Use the intent flag + session validity to determine auth status
    // since the actual token is now hidden in an httpOnly cookie
    isAuthenticated: (localStorage.getItem('isAuthenticated') === 'true' || !!getToken()) && isSessionValid,
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

  if (!isInitialized || isLoggingOut) {
    return (
      <div id="auth-loading-screen" className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 font-medium animate-pulse">
            {isLoggingOut ? "Logging out securely..." : "Restoring your secure session..."}
          </p>
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

