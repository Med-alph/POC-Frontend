/**
 * Session Management API
 * 
 * Handles session-related operations:
 * - Get active sessions
 * - Revoke specific session
 * - Revoke all other sessions
 */

import { baseUrl } from '../constants/Constant';
import { getSecureItem, SECURE_KEYS } from '../utils/secureStorage';

// API Configuration
const API_CONFIG = {
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Helper function to handle API responses
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }
  return response.json();
};

/**
 * Helper function to make API requests with session management
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  const token = getSecureItem(SECURE_KEYS.JWT_TOKEN);
  const sessionId = getSecureItem(SECURE_KEYS.SESSION_ID);

  const config = {
    ...options,
    headers: {
      ...API_CONFIG.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(sessionId && { 'X-Session-Id': sessionId }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    console.error(`SessionAPI Error for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Session Management API
 */
export const sessionAPI = {
  /**
   * Get all active sessions for the current user
   * @returns {Promise<Array>} Array of session objects
   * 
   * Expected response format:
   * [
   *   {
   *     session_id: string,
   *     device: string,
   *     browser: string,
   *     ip_address: string,
   *     last_active: string (ISO date),
   *     created_at: string (ISO date),
   *     is_current: boolean
   *   }
   * ]
   */
  getActiveSessions: async () => {
    return apiRequest('/auth/sessions', {
      method: 'GET',
    });
  },

  /**
   * Revoke a specific session
   * @param {string} sessionIdToRevoke - Session ID to revoke
   * @returns {Promise<object>} Success response
   */
  revokeSession: async (sessionIdToRevoke) => {
    return apiRequest(`/auth/sessions/${sessionIdToRevoke}`, {
      method: 'DELETE',
    });
  },

  /**
   * Revoke all other sessions (keep current session)
   * @returns {Promise<object>} Success response
   */
  revokeAllOtherSessions: async () => {
    return apiRequest('/auth/sessions/others', {
      method: 'DELETE',
    });
  },

  /**
   * Refresh current session (extend expiration)
   * @returns {Promise<object>} Updated session info
   */
  refreshSession: async () => {
    return apiRequest('/auth/sessions/refresh', {
      method: 'POST',
    });
  },

  /**
   * Invalidate sessions older than specified days OR inactive for specified hours
   * @param {Object} options - Invalidation options
   * @param {number} options.olderThanDays - Invalidate sessions older than this many days (default: 30)
   * @param {number} options.inactiveForHours - Invalidate sessions inactive for this many hours (default: 48)
   * @param {boolean} options.keepCurrent - Whether to keep the current session (default: true)
   * @returns {Promise<object>} Response with count of invalidated sessions
   */
  invalidateOlderSessions: async ({ olderThanDays = 30, inactiveForHours = 48, keepCurrent = true } = {}) => {
    return apiRequest('/auth/sessions/invalidate-older', {
      method: 'POST',
      body: JSON.stringify({
        olderThanDays,
        inactiveForHours,
        keepCurrent,
      }),
    });
  },
};

export default sessionAPI;

