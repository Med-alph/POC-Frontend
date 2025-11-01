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

const consultationsAPI = {
  // Create consultation with SOAP notes, prescriptions, and lab orders
  create: async (data) => {
    return apiRequest('/consultations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get consultation by appointment ID
  getByAppointment: async (appointmentId) => {
    return apiRequest(`/consultations/appointment/${appointmentId}`);
  },

  // Get consultation by ID
  getById: async (id) => {
    return apiRequest(`/consultations/${id}`);
  },

  // Get all consultations for a patient
  getByPatient: async (patientId) => {
    return apiRequest(`/consultations/patient/${patientId}`);
  },
};

export default consultationsAPI;
