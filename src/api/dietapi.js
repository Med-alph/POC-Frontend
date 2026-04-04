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

const dietAPI = {
  // Master Templates
  getTemplates: async (hospitalId) => {
    return apiRequest(`/diet-templates?hospital_id=${hospitalId}`);
  },
  createTemplate: async (data) => {
    return apiRequest('/diet-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateTemplate: async (id, data) => {
    return apiRequest(`/diet-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Consultation Diet Plans
  getConsultationPlan: async (consultationId) => {
    return apiRequest(`/consultations/${consultationId}/diet-plan`);
  },
  saveConsultationPlan: async (consultationId, data) => {
    return apiRequest(`/consultations/${consultationId}/diet-plan`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get all diet plans for a patient
  getPatientPlans: async (patientId) => {
    return apiRequest(`/patients/${patientId}/diet-plans`);
  },
};

export default dietAPI;
