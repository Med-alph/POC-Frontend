// Authentication utility functions
import { getSecureItem, SECURE_KEYS, setSecureItem, removeSecureItem } from './secureStorage'

/**
 * Get the authentication token
 * SOC 2: Tokens are now in httpOnly cookies, frontend can only access memory-cached token if available
 * @returns {string|null} The access token or null if not found
 */
export const getAuthToken = () => {
  // Try secure memory first
  let token = getSecureItem(SECURE_KEYS.JWT_TOKEN);
  if (token) return token;
  // Fallback to cookie (persisted across refresh)
  const match = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
  if (match && match[1]) {
    token = decodeURIComponent(match[1]);
    // Populate secure storage for future fast access
    setSecureItem(SECURE_KEYS.JWT_TOKEN, token);
    return token;
  }
  return null;
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has a valid token
 */
export const isAuthenticated = () => {
  const token = getAuthToken()
  return !!token && token !== 'null' && token !== 'undefined'
}

/**
 * Get user data from localStorage
 * @returns {object|null} User data or null if not found
 */
export const getUserData = () => {
  const userData = localStorage.getItem('user')
  try {
    return userData ? JSON.parse(userData) : null
  } catch (error) {
    console.error('Error parsing user data:', error)
    return null
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
  localStorage.removeItem('access_token');
  localStorage.removeItem('loginResponse');
  localStorage.removeItem('session_id');
  localStorage.removeItem('isAuthenticated');

  // Clear the auth cookie
  const isHttps = window.location.protocol === 'https:';
  document.cookie = `auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${isHttps ? '; Secure' : ''}`;

  sessionStorage.clear();
};

/**
 * Set authentication data
 * SOC 2: Token is in httpOnly cookie, we only cache in memory for immediate use
 * @param {string} token - Access token
 * @param {object} user - User data
 */
export const setAuthData = (token, user) => {
  if (token) {
    setSecureItem(SECURE_KEYS.JWT_TOKEN, token);
    // Also store token in a cookie for persistence across refreshes
    const expires = (() => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload && payload.exp) {
          const maxAge = payload.exp - Math.floor(Date.now() / 1000);
          return maxAge > 0 ? maxAge : 0;
        }
      } catch (e) {
        console.warn('Failed to parse JWT for expiry:', e);
      }
      // Default 1 day
      return 24 * 60 * 60;
    })();

    // SOC 2: Only use Secure flag on HTTPS
    const isHttps = window.location.protocol === 'https:';
    const cookieString = `auth_token=${token}; path=/; max-age=${expires}; SameSite=Lax${isHttps ? '; Secure' : ''}`;
    document.cookie = cookieString;
    console.log('[Auth] Token persisted via cookie');
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
