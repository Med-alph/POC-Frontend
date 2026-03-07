import { baseUrl } from '../../constants/Constant';

const API_BASE = `${baseUrl}/app-admin`;

class AppAdminAuthService {
  constructor() {
    this.token = null; // No longer storing JWT in this.token from localStorage
  }

  // Set authorization header
  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      // SOC 2: We no longer manually attach the Authorization header.
      // The browser automatically attaches the 'access_token' cookie via credentials: 'include'.
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

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store non-sensitive flag and admin data
      localStorage.setItem('appAdminAuthenticated', 'true');
      localStorage.setItem('appAdminData', JSON.stringify(data.admin));

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
      // Clear local storage regardless of API call success
      localStorage.removeItem('appAdminAuthenticated');
      localStorage.removeItem('appAdminData');
      localStorage.removeItem('appAdminToken');
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
      return true;
    } catch (error) {
      // Session is invalid, clear intent
      this.logout();
      return false;
    }
  }
}

export default new AppAdminAuthService();