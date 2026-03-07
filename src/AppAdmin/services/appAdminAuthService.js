import { baseUrl } from '../../constants/Constant';
import { setAuthData, clearAuthData } from '../../utils/auth';

const API_BASE = `${baseUrl}/app-admin`;

class AppAdminAuthService {
  constructor() {
    this.token = null; // No longer storing JWT in this.token from localStorage
  }

  // Get authorization header (delegated to interceptor)
  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
    };
  }

  // Login
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // SOC 2: Required for httpOnly cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // Store non-sensitive flag and admin data for frontend UI
      localStorage.setItem('appAdminAuthenticated', 'true');
      localStorage.setItem('appAdminData', JSON.stringify(data.admin));

      // SOC 2: Store JWT in memory only (fast fallback if cookie fails)
      if (data.access_token) {
        setAuthData(data.access_token, data.admin);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Register (for initial setup)
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // SOC 2: Required for httpOnly cookies
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Get Profile
  async getProfile() {
    try {
      const response = await fetch(`${API_BASE}/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include', // SOC 2: Required for httpOnly cookies
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch profile');
      }

      // Re-hydrate memory token if returned (restores session after refresh)
      if (data.access_token) {
        setAuthData(data.access_token, data.admin || data);
        // console.log('[AppAdmin] Token re-hydrated from profile');
      }

      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  // Logout
  async logout() {
    try {
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include', // SOC 2: Required for httpOnly cookies
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all local and memory storage
      clearAuthData();
    }
  }

  // Check if user is authenticated (Intent check)
  isAuthenticated() {
    return localStorage.getItem('appAdminAuthenticated') === 'true';
  }

  // Get stored admin data
  getAdminData() {
    const data = localStorage.getItem('appAdminData');
    return data ? JSON.parse(data) : null;
  }

  // Verify token validity
  async verifyToken() {
    // If we have an intent flag, we verify it with the profile call
    if (!this.isAuthenticated()) return false;

    try {
      await this.getProfile();
      // console.log('[AppAdmin] verifyToken successful');
      return true;
    } catch (error) {
      // DEBUG: console.warn('[AppAdmin] verifyToken failed (potential backend cookie issue):', error.message);
      // We no longer call this.logout() here.
      // The calling context (AppAdminAuthContext) will decide based on the return value.
      return false;
    }
  }
}

export default new AppAdminAuthService();