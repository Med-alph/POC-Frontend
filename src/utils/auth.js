// Authentication utility functions
import { getSecureItem, SECURE_KEYS, setSecureItem, removeSecureItem } from './secureStorage'

/**
 * Get the authentication token
 * SOC 2: Tokens are now in httpOnly cookies, frontend can only access memory-cached token if available
 * @returns {string|null} The access token or null if not found
 */
export const getAuthToken = () => {
  return getSecureItem(SECURE_KEYS.JWT_TOKEN)
}

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
  removeSecureItem(SECURE_KEYS.JWT_TOKEN)
  removeSecureItem(SECURE_KEYS.SESSION_ID)
  localStorage.removeItem('user')
  localStorage.removeItem('access_token')
  localStorage.removeItem('loginResponse')
  localStorage.removeItem('session_id')
  sessionStorage.clear()
}

/**
 * Set authentication data
 * SOC 2: Token is in httpOnly cookie, we only cache in memory for immediate use
 * @param {string} token - Access token
 * @param {object} user - User data
 */
export const setAuthData = (token, user) => {
  if (token) {
    setSecureItem(SECURE_KEYS.JWT_TOKEN, token)
  }
  if (user) {
    localStorage.setItem('user', JSON.stringify(user))
  }
}

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
