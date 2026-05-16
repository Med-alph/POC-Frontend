import { baseUrl } from '../constants/Constant';
import { getAuthToken } from '../utils/auth';

const apiRequest = async (endpoint, options = {}) => {
  const url = `${baseUrl}${endpoint}`;
  const token = getAuthToken();

  const config = {
    method: 'GET',
    ...options,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response;
};

const reportsAPI = {
  generateReport: async (type, patientId, options = {}) => {
    const queryParams = new URLSearchParams(options).toString();
    const endpoint = `/reports/generate/${type}/${patientId}${queryParams ? `?${queryParams}` : ''}`;
    return apiRequest(endpoint);
  },

  generateEncounterReport: async (consultationId, options = {}) => {
    const queryParams = new URLSearchParams(options).toString();
    const endpoint = `/reports/encounter/${consultationId}${queryParams ? `?${queryParams}` : ''}`;
    return apiRequest(endpoint);
  },

  shareOnWhatsApp: async (type, patientId) => {
    const endpoint = `/reports/share/whatsapp/${type}/${patientId}`;
    const response = await apiRequest(endpoint);
    return response.json();
  },
};

export default reportsAPI;
