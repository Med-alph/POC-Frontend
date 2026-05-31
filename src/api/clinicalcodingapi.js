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

const clinicalCodingAPI = {
  searchIcd10: async (query, limit = 30) => {
    return apiRequest(`/clinical-coding/icd/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  },

  searchCpt: async (query, limit = 30) => {
    return apiRequest(`/clinical-coding/cpt/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  },

  // Lightweight flag check — safe to call on every page load or route change
  checkEnabled: async () => {
    return apiRequest('/clinical-coding/enabled');
  },
};

export default clinicalCodingAPI;
