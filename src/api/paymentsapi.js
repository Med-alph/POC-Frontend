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

    return response.json();
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    throw error;
  }
};

const paymentsAPI = {
  // Initiate an order (Digital, Cash, or Credit)
  initiateOrder: async (orderData) => {
    return apiRequest('/payments/orders/initiate', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Settle a cash order manually
  settleManually: async (orderId, staffId) => {
    return apiRequest(`/payments/orders/${orderId}/settle-manually`, {
      method: 'POST',
      body: JSON.stringify({ staffId }),
    });
  },

  // Fetch all UNPAID orders (Accounts Receivable)
  getAccountsReceivable: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `/payments/orders/accounts-receivable?${queryParams}` : '/payments/orders/accounts-receivable';
    return apiRequest(endpoint);
  },

  // Legacy Razorpay order creation (Backwards compatibility)
  createOrder: async ({ amount, receipt, patientId, appointmentId }) => {
    return apiRequest('/payments/orders/initiate', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        receipt,
        patientId,
        appointmentId,
        paymentModeCategory: 'digital'
      }),
    });
  },

  // Verify payment signature
  verifyPayment: async ({ orderId, paymentId, signature, paymentMethod }) => {
    return apiRequest('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ orderId, paymentId, signature, paymentMethod }),
    });
  },
};

export default paymentsAPI;
