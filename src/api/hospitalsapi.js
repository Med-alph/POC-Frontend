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

const hospitalsAPI = {
  getAll: async () => {
    return apiRequest('/hospitals');
  },

  getById: async (id) => {
    return apiRequest(`/hospitals/${id}`);
  },

  getByTenant: async (tenantId) => {
    // If tenantId is provided, use it; otherwise, the backend should determine from auth token
    const endpoint = tenantId ? `/hospitals/tenant/${tenantId}` : '/hospitals/tenant';
    return apiRequest(endpoint);
  },

  create: async (hospitalData) => {
    return apiRequest('/hospitals', {
      method: 'POST',
      body: JSON.stringify(hospitalData),
    });
  },

  update: async (id, hospitalData) => {
    return apiRequest(`/hospitals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(hospitalData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/hospitals/${id}`, {
      method: 'DELETE',
    });
  },
};

export default hospitalsAPI;