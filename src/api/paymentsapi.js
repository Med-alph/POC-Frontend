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
  // Create a Razorpay order
  createOrder: async ({ amount, receipt, patientId }) => {
  return apiRequest('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({ amount, receipt, patientId }),
  });
},


  // Verify payment signature and complete the payment process
  verifyPayment: async ({ orderId, paymentId, signature, paymentMethod }) => {
  return apiRequest('/payments/verify', {
    method: 'POST',
    body: JSON.stringify({ orderId, paymentId, signature, paymentMethod }),
  });
},


  // Additional payment related APIs can be added here, for example webhook logs retrieval or refunds
};

export default paymentsAPI;
