import { baseUrl } from '../constants/Constant';

const API_BASE = `${baseUrl}`;

class SubscriptionsApiService {
  // Get authorization headers
  getAuthHeaders() {
    const token = localStorage.getItem('appAdminToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Admin Subscription Management
  async getAllSubscriptions() {
    try {
      const response = await fetch(`${API_BASE}/app-admin/subscriptions`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch subscriptions');
      }

      return data;
    } catch (error) {
      console.error('Get subscriptions error:', error);
      throw error;
    }
  }

  async subscribeTenantToPlan(tenantId, planId) {
    try {
      const response = await fetch(`${API_BASE}/tenants/${tenantId}/subscribe/${planId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to subscribe tenant to plan');
      }

      return data;
    } catch (error) {
      console.error('Subscribe tenant error:', error);
      throw error;
    }
  }

  async getTenantSubscription(tenantId) {
    try {
      const response = await fetch(`${API_BASE}/tenants/${tenantId}/subscription`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch tenant subscription');
      }

      return data;
    } catch (error) {
      console.error('Get tenant subscription error:', error);
      throw error;
    }
  }

  async getTenantSubscriptionHistory(tenantId) {
    try {
      const response = await fetch(`${API_BASE}/tenants/${tenantId}/subscriptions`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch tenant subscription history');
      }

      return data;
    } catch (error) {
      console.error('Get tenant subscription history error:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId) {
    try {
      const response = await fetch(`${API_BASE}/app-admin/subscriptions/${subscriptionId}/cancel`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel subscription');
      }

      return data;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  }

  async updatePaymentStatus(subscriptionId, paymentStatus) {
    try {
      const response = await fetch(`${API_BASE}/app-admin/subscriptions/${subscriptionId}/payment-status`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ payment_status: paymentStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update payment status');
      }

      return data;
    } catch (error) {
      console.error('Update payment status error:', error);
      throw error;
    }
  }
}

export default new SubscriptionsApiService();