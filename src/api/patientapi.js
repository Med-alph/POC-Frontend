import { baseUrl } from '../constants/Constant';
import { getAuthToken } from '../utils/auth';

const API_CONFIG = {
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  const token = getAuthToken();

  const config = {
    ...options,
    headers: {
      ...API_CONFIG.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  return handleResponse(response);
};

export const patientAPI = {
  // Create new patient
  create: async (data) => {
    return apiRequest('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export default patientAPI;
