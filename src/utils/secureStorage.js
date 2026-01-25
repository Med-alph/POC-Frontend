/**
 * Secure Storage Utility
 * 
 * Healthcare-grade secure storage that avoids localStorage for sensitive data.
 * Uses in-memory storage with sessionStorage as fallback for persistence.
 * 
 * Security considerations:
 * - JWT tokens stored in memory (cleared on page refresh/close)
 * - Session IDs stored in memory
 * - Non-sensitive data (user preferences) can use sessionStorage
 * - Never stores sensitive tokens in localStorage
 */

// In-memory storage (cleared on page refresh)
const memoryStore = new Map();

// Session storage keys (for non-sensitive data only)
const SESSION_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
};

/**
 * Store sensitive data in memory only
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 */
export const setSecureItem = (key, value) => {
  try {
    memoryStore.set(key, value);
  } catch (error) {
    console.error(`[SecureStorage] Failed to set ${key}:`, error);
  }
};

/**
 * Retrieve sensitive data from memory
 * @param {string} key - Storage key
 * @returns {any|null} Stored value or null
 */
export const getSecureItem = (key) => {
  try {
    return memoryStore.get(key) || null;
  } catch (error) {
    console.error(`[SecureStorage] Failed to get ${key}:`, error);
    return null;
  }
};

/**
 * Remove sensitive data from memory
 * @param {string} key - Storage key
 */
export const removeSecureItem = (key) => {
  try {
    memoryStore.delete(key);
  } catch (error) {
    console.error(`[SecureStorage] Failed to remove ${key}:`, error);
  }
};

/**
 * Clear all secure storage
 */
export const clearSecureStorage = () => {
  try {
    memoryStore.clear();
    // Also clear sessionStorage for user preferences
    Object.values(SESSION_KEYS).forEach(key => {
      sessionStorage.removeItem(key);
    });
  } catch (error) {
    console.error('[SecureStorage] Failed to clear storage:', error);
  }
};

/**
 * Store non-sensitive data in sessionStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 */
export const setSessionItem = (key, value) => {
  try {
    if (Object.values(SESSION_KEYS).includes(key)) {
      sessionStorage.setItem(key, JSON.stringify(value));
    } else {
      console.warn(`[SecureStorage] Key ${key} not allowed in sessionStorage`);
    }
  } catch (error) {
    console.error(`[SecureStorage] Failed to set session ${key}:`, error);
  }
};

/**
 * Retrieve non-sensitive data from sessionStorage
 * @param {string} key - Storage key
 * @returns {any|null} Stored value or null
 */
export const getSessionItem = (key) => {
  try {
    if (Object.values(SESSION_KEYS).includes(key)) {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    }
    return null;
  } catch (error) {
    console.error(`[SecureStorage] Failed to get session ${key}:`, error);
    return null;
  }
};

/**
 * Storage keys for sensitive data (memory only)
 */
export const SECURE_KEYS = {
  JWT_TOKEN: 'jwt_token',
  SESSION_ID: 'session_id',
  REFRESH_TOKEN: 'refresh_token', // If using refresh tokens
  TENANT_ID: 'tenant_id', // Derived from token, not user-editable
  HOSPITAL_ID: 'hospital_id', // Derived from token, not user-editable
};

/**
 * Check if secure storage is available
 * @returns {boolean}
 */
export const isSecureStorageAvailable = () => {
  try {
    return typeof Map !== 'undefined';
  } catch {
    return false;
  }
};

