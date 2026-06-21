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
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error(`[MedicalCodingAPI] Error for ${endpoint}:`, error);
    throw error;
  }
};

const medicalCodingAPI = {
  /**
   * Fetch coding queue — completed consultations awaiting ICD/CPT coding.
   * @param {string} hospitalId
   * @param {string} [status] - optional filter: 'pending' | 'in_progress' | 'clarification_required' | 'pending_recoding' | 'coded'
   * @param {number} [page=1]
   * @param {number} [limit=30]
   */
  getQueue: async (hospitalId, status = '', page = 1, limit = 30) => {
    const params = new URLSearchParams({ hospital_id: hospitalId, page, limit });
    if (status) params.append('status', status);
    return apiRequest(`/consultations/coding/queue?${params.toString()}`);
  },

  /**
   * Get a single consultation by ID with all relations for the coding workspace.
   */
  getConsultation: async (consultationId) => {
    return apiRequest(`/consultations/${consultationId}`);
  },

  /**
   * Medical coder submits coded ICD/CPT codes for a consultation.
   * @param {string} consultationId
   * @param {object} data - { coding_status, coding_comments, diagnoses, procedures }
   */
  updateCoding: async (consultationId, data) => {
    return apiRequest(`/consultations/${consultationId}/coding`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Search ICD-10 codes (fuzzy autocomplete).
   */
  searchIcd: async (query, limit = 30) => {
    const params = new URLSearchParams({ q: query, limit });
    return apiRequest(`/clinical-coding/icd/search?${params.toString()}`);
  },

  /**
   * Search CPT codes (fuzzy autocomplete).
   */
  searchCpt: async (query, limit = 30) => {
    const params = new URLSearchParams({ q: query, limit });
    return apiRequest(`/clinical-coding/cpt/search?${params.toString()}`);
  },
};

export default medicalCodingAPI;
