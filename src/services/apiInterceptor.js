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

import { getSecureItem, SECURE_KEYS } from '../utils/secureStorage';

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

/**
 * Enhanced fetch with session management
 * 
 * Flow:
 * 1. Attach JWT + session_id to request headers
 * 2. Make request
 * 3. Check response status
 * 4. Handle 401/session-invalid responses
 * 5. Return response or throw error
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

  // Get token and session ID from secure storage
  const token = getSecureItem(SECURE_KEYS.JWT_TOKEN);
  const sessionId = getSecureItem(SECURE_KEYS.SESSION_ID);

  // Prepare headers
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
  };

  // Attach JWT token
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
    headers,
  };

  try {
    // Make the request
    const response = await originalFetch(url, config);

    // Handle session-related errors
    if (response.status === 401) {
      const errorData = await response.clone().json().catch(() => ({}));
      
      // Check if it's a session-specific error
      const isSessionError = 
        errorData.code === 'SESSION_INVALID' ||
        errorData.code === 'SESSION_EXPIRED' ||
        errorData.code === 'SESSION_REVOKED' ||
        errorData.message?.toLowerCase().includes('session') ||
        response.headers.get('X-Session-Status') === 'invalid';

      if (isSessionError && sessionInvalidationHandler) {
        const reason = errorData.message || 'Your session has expired or been revoked';
        sessionInvalidationHandler(reason);
        
        // Return a rejected promise to prevent further processing
        return Promise.reject(new Error(reason));
      }
      
      // Regular 401 (invalid token, etc.)
      if (sessionInvalidationHandler) {
        sessionInvalidationHandler('Authentication failed. Please login again.');
        return Promise.reject(new Error('Authentication failed'));
      }
    }

    // Handle other error statuses
    if (!response.ok && response.status >= 400) {
      // Log error for debugging (in development)
      if (process.env.NODE_ENV === 'development') {
        console.error(`[API Interceptor] Request failed: ${url}`, {
          status: response.status,
          statusText: response.statusText,
        });
      }
    }

    return response;
    } catch (error) {
      // Network errors, etc.
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

