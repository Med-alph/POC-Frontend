import { baseUrl } from '../constants/Constant';
import { getAuthToken } from '../utils/auth';

const apiRequest = async (endpoint, options = {}) => {
  const url = `${baseUrl}${endpoint}`;
  const token = getAuthToken();
  
  const config = {
    method: 'GET',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    // Check if the response actually has body content before parsing JSON
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    throw error;
  }
};

const pharmacyAPI = {
  // Get pharmacy queue filtered by hospital and optionally status
  getQueue: async (hospitalId, status = '') => {
    const queryParams = new URLSearchParams({ hospital_id: hospitalId });
    if (status) {
      queryParams.append('status', status);
    }
    return apiRequest(`/pharmacy/queue?${queryParams.toString()}`);
  },

  // Get dashboard statistics/KPIs
  getStats: async (hospitalId) => {
    return apiRequest(`/pharmacy/stats?hospital_id=${hospitalId}`);
  },

  // Get single order detail
  getOrder: async (id) => {
    return apiRequest(`/pharmacy/orders/${id}`);
  },

  // Get order payment status (specifically for polling)
  getPaymentStatus: async (id) => {
    return apiRequest(`/pharmacy/orders/${id}/payment-status`);
  },

  // Manually trigger pharmacy order creation from consultation
  createFromConsultation: async (consultationId) => {
    return apiRequest(`/pharmacy/orders/from-consultation/${consultationId}`, {
      method: 'POST',
    });
  },

  // Pharmacist verifies order items stock availability
  verifyOrder: async (id, staffId, data) => {
    return apiRequest(`/pharmacy/orders/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({
        staff_id: staffId,
        items: data.items, // Array of { id, availability, pharmacist_notes }
        pharmacist_notes: data.pharmacist_notes || ''
      }),
    });
  },

  // Generate invoice for cashier
  billOrder: async (id, staffId) => {
    return apiRequest(`/pharmacy/orders/${id}/bill`, {
      method: 'PATCH',
      body: JSON.stringify({ staff_id: staffId }),
    });
  },

  // Dispense medications (deduct stock)
  dispenseOrder: async (id, staffId, data = {}) => {
    return apiRequest(`/pharmacy/orders/${id}/dispense`, {
      method: 'PATCH',
      body: JSON.stringify({
        staff_id: staffId,
        dispense_summary: data.dispense_summary || 'Dispensed successfully'
      }),
    });
  },

  // Cancel medication order
  cancelOrder: async (id, staffId, reason) => {
    return apiRequest(`/pharmacy/orders/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({
        staff_id: staffId,
        reason: reason || 'Cancelled by pharmacist'
      }),
    });
  },
};

export default pharmacyAPI;
