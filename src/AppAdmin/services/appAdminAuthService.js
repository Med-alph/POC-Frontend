import { baseUrl } from '../../constants/Constant';

const API_BASE = `${baseUrl}/app-admin`;

class AppAdminAuthService {
  constructor() {
    this.token = localStorage.getItem('appAdminToken');
  }

  // Set authorization header
  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` })
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
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and admin data
      this.token = data.access_token;
      localStorage.setItem('appAdminToken', this.token);
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
      if (this.token) {
        await fetch(`${API_BASE}/logout`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      this.token = null;
      localStorage.removeItem('appAdminToken');
      localStorage.removeItem('appAdminData');
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }

  // Get stored admin data
  getAdminData() {
    const data = localStorage.getItem('appAdminData');
    return data ? JSON.parse(data) : null;
  }

  // Verify token validity
  async verifyToken() {
    if (!this.token) return false;

    try {
      await this.getProfile();
      return true;
    } catch (error) {
      // Token is invalid, clear it
      this.logout();
      return false;
    }
  }
}

export default new AppAdminAuthService();