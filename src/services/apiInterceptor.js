/**
 * API Interceptor Service
 * 
 * Intercepts all API requests and responses to:
 * - Attach JWT token and session_id to requests
 * - Handle 401/session-invalid responses
 * - Automatically logout on session expiration
 * - Handle token refresh if needed
 * 
 * This service wraps the native fetch API to provide
 * consistent session management across all API calls.
 */

import { getSecureItem, SECURE_KEYS, setSecureItem, clearSecureStorage } from '../utils/secureStorage';
import { isPlatformAppAdmin } from '../utils/subdomain';

// Global reference to auth context logout handler
let sessionInvalidationHandler = null;

/**
 * Set the session invalidation handler (called from AuthContext)
 * @param {Function} handler - Function to call when session is invalid
 */
export const setSessionInvalidationHandler = (handler) => {
  sessionInvalidationHandler = handler;
};

// Store original fetch before we override it
let originalFetch = null;

// Only override fetch once
if (typeof window !== 'undefined' && !window.__fetchIntercepted) {
  originalFetch = window.fetch;
  window.__fetchIntercepted = true;
}

// Variables for managing the silent token refresh queue
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Enhanced fetch with session management
 * 
 * Flow:
 * 1. Attach JWT + session_id to request headers
 * 2. Make request
 * 3. Check response status
 * 4. Handle 401 with ACCESS_TOKEN_EXPIRED (silent token refresh)
 * 5. Handle other 401s (revoked, idle, absolute timeouts) with session invalidation
 * 6. Return response or throw error
 */
if (typeof window !== 'undefined' && originalFetch) {
  window.fetch = async function (url, options = {}) {
    // Skip interception for non-API requests or if URL is absolute external
    const isApiRequest = typeof url === 'string' && (
      url.startsWith('/api') ||
      url.includes('/api/') ||
      (url.startsWith('http') && url.includes('/api/'))
    );

    if (!isApiRequest) {
      return originalFetch.apply(this, arguments);
    }

    // Get token and session ID from secure storage (RAM only)
    let token = getSecureItem(SECURE_KEYS.JWT_TOKEN);
    const sessionId = getSecureItem(SECURE_KEYS.SESSION_ID);

    // Check if body is FormData - if so, don't set Content-Type (browser will set it with boundary)
    const isFormData = options.body instanceof FormData;

    // Prepare headers (copy existing headers)
    const headers = { ...options.headers };

    // For FormData, remove Content-Type if it exists (browser will set it with boundary)
    if (isFormData) {
      delete headers['Content-Type'];
      delete headers['content-type'];
    } else if (!headers['Content-Type'] && !headers['content-type']) {
      // Only set Content-Type for non-FormData requests if not already set
      headers['Content-Type'] = 'application/json';
    }

    // Attach JWT token as a fallback for httpOnly cookies (essential for local dev)
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Attach session ID
    if (sessionId) {
      headers['X-Session-Id'] = sessionId;
    }

    // Merge with existing headers
    const config = {
      ...options,
      credentials: 'include', // SOC 2: Required for httpOnly cookies
      headers,
    };

    try {
      // Make the request
      let response = await originalFetch(url, config);

      // Handle session-related errors
      if (response.status === 401) {
        const errorData = await response.clone().json().catch(() => ({}));

        // Determine reason code returned from backend
        // Backend returns { reason, message } — check both `reason` and `code` for compatibility
        const errorCode = errorData.reason || errorData.code || errorData.message || '';

        const isAccessTokenExpired =
          errorCode === 'ACCESS_TOKEN_EXPIRED' ||
          errorCode.toLowerCase().includes('expired') ||
          errorCode.toLowerCase().includes('access token');

        const isAuthEndpoint = typeof url === 'string' && (
          url.includes('/auth/refresh') ||
          url.includes('/auth/staff/login') ||
          url.includes('/auth/admin/login') ||
          url.includes('/auth/logout')
        );

        // 1. Silent Refresh Intercept for Expired Access Tokens
        if (isAccessTokenExpired && !isAuthEndpoint) {
          if (isRefreshing) {
            // Queue this request while refresh is in progress
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((newToken) => {
                config.headers.Authorization = `Bearer ${newToken}`;
                return originalFetch(url, config);
              })
              .catch((err) => Promise.reject(err));
          }

          isRefreshing = true;

          return new Promise((resolve, reject) => {
            // Trigger refresh endpoint via originalFetch directly to avoid loops
            // Include session ID so backend can validate the refresh request
            const refreshSessionId = getSecureItem(SECURE_KEYS.SESSION_ID);
            const refreshHeaders = { 'Content-Type': 'application/json' };
            if (refreshSessionId) {
              refreshHeaders['X-Session-Id'] = refreshSessionId;
            }
            originalFetch('/api/auth/refresh', {
              method: 'POST',
              headers: refreshHeaders,
              credentials: 'include',
            })
              .then(async (refreshResponse) => {
                if (!refreshResponse.ok) {
                  const refreshErrorData = await refreshResponse.json().catch(() => ({}));
                  const refreshReason = refreshErrorData.reason || refreshErrorData.code || 'SESSION_REVOKED';
                  throw new Error(refreshReason);
                }
                const data = await refreshResponse.json();
                const newToken = data.access_token;

                // Save new access token in secure RAM memory
                setSecureItem(SECURE_KEYS.JWT_TOKEN, newToken);

                // If backend rotates the refresh token and returns it in the body
                // (some backends do this instead of/in addition to Set-Cookie),
                // store it in RAM. The HttpOnly cookie rotation is handled automatically
                // by the browser via Set-Cookie response headers — no JS needed for that.
                if (data.refresh_token) {
                  setSecureItem(SECURE_KEYS.REFRESH_TOKEN, data.refresh_token);
                }

                // Update original request auth header
                config.headers.Authorization = `Bearer ${newToken}`;

                // Process queued requests
                processQueue(null, newToken);

                // Replay the current original request
                resolve(originalFetch(url, config));
              })
              .catch((err) => {
                processQueue(err, null);

                // Clear memory storage on refresh failure
                clearSecureStorage();

                const reason = err.message && err.message !== 'REFRESH_FAILED'
                  ? err.message
                  : (errorData.reason || errorData.code || 'SESSION_REVOKED');

                if (sessionInvalidationHandler) {
                  sessionInvalidationHandler(reason);
                }
                reject(new Error(reason));
              })
              .finally(() => {
                isRefreshing = false;
              });
          });
        }

        // 2. Global Session Invalidation for Other 401s (Idle, Absolute Timeout, Revoked)
        // Check both `reason` and `code` fields for compatibility
        const reasonCode = errorData.reason || errorData.code || '';
        const isSessionError =
          reasonCode === 'SESSION_INVALID' ||
          reasonCode === 'SESSION_EXPIRED' ||
          reasonCode === 'SESSION_REVOKED' ||
          reasonCode === 'IDLE_TIMEOUT' ||
          reasonCode === 'ABSOLUTE_TIMEOUT' ||
          reasonCode === 'TOKEN_REUSE_DETECTED' ||
          errorCode.toLowerCase().includes('session') ||
          response.headers.get('X-Session-Status') === 'invalid';

        if (isSessionError && sessionInvalidationHandler && !isAuthEndpoint) {
          const isHandshake = url.includes('/auth/me');
          if (isHandshake || isPlatformAppAdmin()) {
            return Promise.reject(new Error('Session validation failed'));
          }

          // Prefer `reason` (new backend filter shape) then `code` (legacy shape)
          const reason = errorData.reason || errorData.code || 'SESSION_REVOKED';
          sessionInvalidationHandler(reason);

          // Return a rejected promise to prevent further processing
          return Promise.reject(new Error(reason));
        }

        // Regular 401 fallback — only trigger if no refresh is in progress
        if (!isRefreshing && sessionInvalidationHandler && !isPlatformAppAdmin() && !isAuthEndpoint) {
          sessionInvalidationHandler('SESSION_REVOKED');
          return Promise.reject(new Error('Authentication failed'));
        }
      }

      // Handle other error statuses
      if (!response.ok && response.status >= 400) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`[API Interceptor] Request failed: ${url}`, {
            status: response.status,
            statusText: response.statusText,
          });
        }
      }

      return response;
    } catch (error) {
      console.error('[API Interceptor] Request error:', error);
      throw error;
    }
  };
}

/**
 * Restore original fetch (for testing or special cases)
 */
export const restoreOriginalFetch = () => {
  if (typeof window !== 'undefined' && originalFetch) {
    window.fetch = originalFetch;
    window.__fetchIntercepted = false;
  }
};

/**
 * Session Management Flow Diagram (Commented)
 * 
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    USER LOGIN                               │
 * └──────────────────────┬──────────────────────────────────────┘
 *                        │
 *                        ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Backend returns:                                            │
 * │  - access_token (JWT)                                       │
 * │  - session_id (opaque reference)                           │
 * │  - user object                                               │
 * └──────────────────────┬──────────────────────────────────────┘
 *                        │
 *                        ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │  AuthContext.setAuthCredentials()                           │
 * │  - Store JWT in memory (secureStorage)                      │
 * │  - Store session_id in memory                               │
 * │  - Extract tenant_id/hospital_id from JWT                   │
 * └──────────────────────┬──────────────────────────────────────┘
 *                        │
 *                        ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │              API REQUEST (via fetch interceptor)            │
 * └──────────────────────┬──────────────────────────────────────┘
 *                        │
 *                        ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Interceptor adds headers:                                   │
 * │  - Authorization: Bearer <JWT>                               │
 * │  - X-Session-Id: <session_id>                               │
 * └──────────────────────┬──────────────────────────────────────┘
 *                        │
 *                        ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    BACKEND VALIDATES                          │
 * │  - JWT signature & expiration                                │
 * │  - Session exists & is active                                 │
 * │  - Session matches user                                       │
 * └──────────────────────┬──────────────────────────────────────┘
 *                        │
 *            ┌───────────┴───────────┐
 *            │                      │
 *            ▼                      ▼
 * ┌──────────────────┐   ┌──────────────────────────────┐
 * │   SUCCESS (200)   │   │   SESSION ERROR (401)        │
 * │                  │   │  - SESSION_INVALID            │
 * │  Return data     │   │  - SESSION_EXPIRED            │
 * │                  │   │  - SESSION_REVOKED            │
 * └──────────────────┘   └──────────┬───────────────────┘
 *                                   │
 *                                   ▼
 *                    ┌──────────────────────────────┐
 *                    │  Interceptor detects 401      │
 *                    │  + session error code         │
 *                    └──────────┬───────────────────┘
 *                               │
 *                               ▼
 *                    ┌──────────────────────────────┐
 *                    │  Call sessionInvalidationHandler│
 *                    │  - Clear secure storage        │
 *                    │  - Clear Redux state          │
 *                    │  - Redirect to login           │
 *                    └──────────────────────────────┘
 * 
 * EDGE CASES HANDLED:
 * 
 * 1. Token expired but session still active:
 *    - Backend should return 401 with SESSION_EXPIRED
 *    - Frontend logs out user
 *    - User must re-authenticate
 * 
 * 2. Session revoked from another device:
 *    - Backend marks session as revoked
 *    - Next API call returns 401 with SESSION_REVOKED
 *    - Frontend automatically logs out
 * 
 * 3. Multiple tabs/windows:
 *    - Each tab has same session_id in memory
 *    - If one tab logs out, others detect on next API call
 *    - Consider using BroadcastChannel for real-time sync
 */

export default {
  setSessionInvalidationHandler,
  restoreOriginalFetch,
};

