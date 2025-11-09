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


    const cancellationRequestAPI = {
    createCancellationRequest: async ({ appointmentId, doctorId, reason }) => {
    return apiRequest('/cancellation-requests', {
      method: 'POST',
      body: JSON.stringify({ appointmentId, doctorId, reason }),
    });
  },

    reviewRequest: async ({ requestId, adminId, approve, comments }) => {
      return apiRequest(`/cancellation-requests/${requestId}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ adminId, approve, comments }),
      });
    },

    // Additional APIs for cancellation requests can be added here if needed
    getDoctorRequests: async (doctorId) => {
    return apiRequest(`/cancellation-requests/doctor/${doctorId}`);
  },

  hasRequestForAppointment: async (appointmentId, doctorId) => {
    return apiRequest(`/cancellation-requests/check?appointmentId=${appointmentId}&doctorId=${doctorId}`);
  },

  };

  export default cancellationRequestAPI;
