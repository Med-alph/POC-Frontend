import axios from 'axios';
import { getAuthToken } from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9009';

// Create axios instance with auth
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const complianceAPI = {
  // Patient Consent APIs
  grantConsent: async (patientId, consentData) => {
    const response = await api.post(`/api/patients/${patientId}/consent`, consentData);
    return response.data;
  },

  getConsentStatus: async (patientId, hospitalId) => {
    const response = await api.get(`/api/patients/${patientId}/consent-status`, {
      params: { hospital_id: hospitalId }
    });
    return response.data;
  },

  withdrawConsent: async (patientId, withdrawData) => {
    const response = await api.post(`/api/patients/${patientId}/consent/withdraw`, withdrawData);
    return response.data;
  },

  // Terms Acceptance APIs
  acceptTerms: async (termsData) => {
    const response = await api.post('/api/terms/accept', termsData);
    return response.data;
  },

  getTermsStatus: async (userId, hospitalId = null) => {
    const params = hospitalId ? { hospital_id: hospitalId } : {};
    const response = await api.get(`/api/terms/status/${userId}`, { params });
    return response.data;
  },

  // Static Content APIs
  getPrivacyPolicy: async () => {
    const response = await api.get('/api/privacy-policy');
    return response.data;
  },

  getTermsOfService: async () => {
    const response = await api.get('/api/terms-of-service');
    return response.data;
  },

  // Hospital Consent Configuration APIs
  getHospitalConsentConfig: async (hospitalId) => {
    const response = await api.get(`/api/hospitals/${hospitalId}/consent-config`);
    return response.data;
  },

  updateHospitalConsentConfig: async (hospitalId, updateData) => {
    const response = await api.put(`/api/hospitals/${hospitalId}/consent-config`, updateData);
    return response.data;
  },

  // New Consent Recording APIs
  recordSelfConsent: async (patientId, consentData) => {
    const response = await api.post(`/api/patients/${patientId}/self-consent`, consentData);
    return response.data;
  },

  recordStaffConsent: async (patientId, consentData) => {
    const response = await api.post(`/api/patients/${patientId}/staff-consent`, consentData);
    return response.data;
  }
};