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

const pediatricsAPI = {
  getVaccines: async (patientId) => {
    return apiRequest(`/pediatrics/vaccines/${patientId}`);
  },
  getVaccineSchedule: async (patientId) => {
    return apiRequest(`/pediatrics/vaccines/${patientId}`);
  },

  administerVaccine: async (patientId, data) => {
    return apiRequest(`/pediatrics/vaccines/${patientId}/administer`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getVaccineMaster: async (page = 1, limit = 10) => {
    return apiRequest(`/pediatrics/vaccine-master?page=${page}&limit=${limit}`);
  },
  createVaccineMaster: async (data) => {
    return apiRequest('/pediatrics/vaccine-master', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateVaccineMaster: async (id, data) => {
    return apiRequest(`/pediatrics/vaccine-master/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  deleteVaccineMaster: async (id) => {
    return apiRequest(`/pediatrics/vaccine-master/${id}`, {
      method: 'DELETE',
    });
  },
  getTemplates: async () => {
    return apiRequest('/pediatrics/templates');
  },
  loadTemplate: async (templateName, mode = 'REPLACE') => {
    return apiRequest('/pediatrics/load-template', {
      method: 'POST',
      body: JSON.stringify({ template_name: templateName, mode }),
    });
  },
  importCSV: async (data, mode = 'MERGE') => {
    return apiRequest('/pediatrics/import-csv', {
      method: 'POST',
      body: JSON.stringify({ data, mode }),
    });
  },
  remindVaccine: async (patientId, vaccineId, stage = 'manual') => {
    return apiRequest(`/pediatrics/vaccines/${patientId}/${vaccineId}/remind`, {
      method: 'POST',
      body: JSON.stringify({ stage }),
    });
  },
  
  // Growth Module Endpoints
  getGrowthHistory: async (patientId) => {
    return apiRequest(`/pediatrics/growth/${patientId}`);
  },
  saveGrowthEntry: async (patientId, data) => {
    return apiRequest(`/pediatrics/growth/${patientId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export default pediatricsAPI;
