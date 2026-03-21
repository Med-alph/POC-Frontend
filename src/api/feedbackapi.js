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

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

const feedbackAPI = {
  getStats: async (hospitalId) => {
    return apiRequest(`/feedback/stats?hospital_id=${hospitalId}`);
  },

  getInbox: async (hospitalId) => {
    return apiRequest(`/feedback/inbox?hospital_id=${hospitalId}`);
  },

  acknowledge: async (id) => {
    return apiRequest(`/feedback/${id}/acknowledge`, {
      method: 'PATCH',
    });
  },
};

export default feedbackAPI;
