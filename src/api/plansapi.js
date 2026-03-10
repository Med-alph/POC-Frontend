import { baseUrl } from '../constants/Constant';
import appAdminAuthService from '../AppAdmin/services/appAdminAuthService';

const API_BASE = `${baseUrl}`;

class PlansApiService {
  // Get standard headers
  getHeaders() {
    return {
      'Content-Type': 'application/json',
    };
  }

  // Admin Plans Management
  async getAllPlans() {
    try {
      const response = await fetch(`${API_BASE}/app-admin/plans`, {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch plans');
      }

      return data;
    } catch (error) {
      console.error('Get plans error:', error);
      throw error;
    }
  }

  async getPlanById(id) {
    try {
      const response = await fetch(`${API_BASE}/app-admin/plans/${id}`, {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch plan');
      }

      return data;
    } catch (error) {
      console.error('Get plan error:', error);
      throw error;
    }
  }

  async createPlan(planData) {
    try {
      const response = await fetch(`${API_BASE}/app-admin/plans`, {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include',
        body: JSON.stringify(planData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create plan');
      }

      return data;
    } catch (error) {
      console.error('Create plan error:', error);
      throw error;
    }
  }

  async updatePlan(id, planData) {
    try {
      const response = await fetch(`${API_BASE}/app-admin/plans/${id}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        credentials: 'include',
        body: JSON.stringify(planData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update plan');
      }

      return data;
    } catch (error) {
      console.error('Update plan error:', error);
      throw error;
    }
  }

  async deletePlan(id) {
    try {
      const response = await fetch(`${API_BASE}/app-admin/plans/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete plan');
      }

      return true;
    } catch (error) {
      console.error('Delete plan error:', error);
      throw error;
    }
  }

  async togglePlanStatus(id) {
    try {
      const response = await fetch(`${API_BASE}/app-admin/plans/${id}/toggle-status`, {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle plan status');
      }

      return data;
    } catch (error) {
      console.error('Toggle plan status error:', error);
      throw error;
    }
  }

  // Public Plans (for client-side)
  async getPublicPlans() {
    try {
      const response = await fetch(`${API_BASE}/public/plans`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch public plans');
      }

      return data;
    } catch (error) {
      console.error('Get public plans error:', error);
      throw error;
    }
  }

  async getPublicPlanById(id) {
    try {
      const response = await fetch(`${API_BASE}/public/plans/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch public plan');
      }

      return data;
    } catch (error) {
      console.error('Get public plan error:', error);
      throw error;
    }
  }
}

export default new PlansApiService();