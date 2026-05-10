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

  getProfile: async () => {
    return apiRequest('/hospitals/profile');
  },

  getById: async (id) => {
    return apiRequest(`/hospitals/${id}`);
  },

  getByTenant: async () => {
    // The backend determines the tenant from the auth token
    return apiRequest('/hospitals/tenant');
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

  getSettings: async (id) => {
    return apiRequest(`/hospitals/${id}/settings`);
  },

  updateSettings: async (id, settingsData) => {
    return apiRequest(`/hospitals/${id}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(settingsData),
    });
  },

  validateRazorpay: async (data) => {
    return apiRequest('/hospitals/validate-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getTimings: async (id) => {
    return apiRequest(`/hospitals/${id}/settings/timings`);
  },

  updateTimings: async (id, timingsData) => {
    return apiRequest(`/hospitals/${id}/settings/timings`, {
      method: 'PUT',
      body: JSON.stringify(timingsData),
    });
  },

    uploadLogo: async (id, file) => {
      const formData = new FormData();
      formData.append('logo', file);

      const token = getAuthToken();
      const response = await fetch(`${baseUrl}/hospitals/${id}/logo`,{
        method: 'PATCH',
        headers: {
          ...(token ? {Authorization: `Bearer ${token}`} : {}),
        },
        body: formData,
      });

      if (!response.ok){
        const errorData = await response.json().catch(()=>({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
};

export default hospitalsAPI;