import { getSecureItem, SECURE_KEYS, setSecureItem, removeSecureItem } from './secureStorage';
import { isProduction } from '../constants/Constant';

/**
 * Get the authentication token
 * SOC 2 COMPLIANT: Tokens are only accessible from secure memory (RAM).
 * This function NEVER reads from localStorage or document.cookie in production.
 * @returns {string|null} The access token or null if not found
 */
export const getAuthToken = () => {
  // Try secure memory first (Fastest/Safe)
  return getSecureItem(SECURE_KEYS.JWT_TOKEN);
};

/**
 * Check if user is authenticated (Intent check)
 * SOC 2: This only checks if the user *intended* to be logged in.
 * The actual validity is handled by the backend /auth/me call.
 * @returns {boolean} True if user has a valid session intent
 */
export const isAuthenticated = () => {
  // Check memory token first
  if (getAuthToken()) return true;
  // Check non-sensitive intent flag
  return localStorage.getItem('isAuthenticated') === 'true';
}

/**
 * Get user data from localStorage
 * @returns {object|null} User data or null if not found
 */
export const getUserData = () => {
  const userData = localStorage.getItem('user')
  if (!userData || userData === 'undefined' || userData === 'null') return null;
  try {
    return JSON.parse(userData);
  } catch (error) {
    console.error('[Auth] Error parsing user data:', error);
    return null;
  }
}

/**
 * Clear authentication data
 */
export const clearAuthData = () => {
  removeSecureItem(SECURE_KEYS.JWT_TOKEN);
  removeSecureItem(SECURE_KEYS.SESSION_ID);
  removeSecureItem(SECURE_KEYS.TENANT_ID);
  removeSecureItem(SECURE_KEYS.HOSPITAL_ID);

  localStorage.removeItem('user');
  localStorage.removeItem('loginResponse');
  localStorage.removeItem('session_id');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('appAdminAuthenticated');
  localStorage.removeItem('appAdminData');
  localStorage.removeItem('appAdminToken');

  // Clear legacy tokens if any
  document.cookie = `auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;

  sessionStorage.clear();
};

/**
 * Set authentication data
 * SOC 2 COMPLIANT: We ONLY store the token in memory (setSecureItem).
 * We NEVER store the JWT in localStorage or cookies from the frontend.
 * @param {string} token - Access token
 * @param {object} user - User data
 */
export const setAuthData = (token, user) => {
  if (token) {
    // RAM-only storage
    setSecureItem(SECURE_KEYS.JWT_TOKEN, token);
    localStorage.setItem('isAuthenticated', 'true');
  }
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

/**
 * Get authorization header for API requests
 * @returns {object} Authorization header object
 */
export const getAuthHeader = () => {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Check if token is expired (basic check)
 * @returns {boolean} True if token might be expired
 */
export const isTokenExpired = () => {
  const token = getAuthToken()
  if (!token) return true

  try {
    // Basic JWT token expiration check
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Date.now() / 1000
    return payload.exp < currentTime
  } catch (error) {
    console.error('Error checking token expiration:', error)
    return true
  }
}
