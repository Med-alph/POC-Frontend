import { baseUrl } from '../constants/Constant';

const API_BASE = `${baseUrl}/app-admin`;

class FeaturesApiService {
  // Get authorization headers
  getAuthHeaders() {
    const token = localStorage.getItem('appAdminToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async getAllFeatures() {
    try {
      const response = await fetch(`${API_BASE}/features`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch features');
      }

      return data;
    } catch (error) {
      console.error('Get features error:', error);
      throw error;
    }
  }

  async getFeaturesByCategory() {
    try {
      const response = await fetch(`${API_BASE}/features/by-category`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch features by category');
      }

      return data;
    } catch (error) {
      console.error('Get features by category error:', error);
      throw error;
    }
  }

  async createFeature(featureData) {
    try {
      const response = await fetch(`${API_BASE}/features`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(featureData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create feature');
      }

      return data;
    } catch (error) {
      console.error('Create feature error:', error);
      throw error;
    }
  }

  async getFeatureById(id) {
    try {
      const response = await fetch(`${API_BASE}/features/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch feature');
      }

      return data;
    } catch (error) {
      console.error('Get feature error:', error);
      throw error;
    }
  }

  async updateFeature(id, featureData) {
    try {
      const response = await fetch(`${API_BASE}/features/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(featureData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update feature');
      }

      return data;
    } catch (error) {
      console.error('Update feature error:', error);
      throw error;
    }
  }

  async deleteFeature(id) {
    try {
      const response = await fetch(`${API_BASE}/features/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete feature');
      }

      return true;
    } catch (error) {
      console.error('Delete feature error:', error);
      throw error;
    }
  }
}

export default new FeaturesApiService();