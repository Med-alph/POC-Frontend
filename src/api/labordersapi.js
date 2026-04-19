import { baseUrl } from '../constants/Constant';
import { getAuthToken } from '../utils/auth';

const apiRequest = async (endpoint, options = {}) => {
  const url = `${baseUrl}${endpoint}`;
  const token = getAuthToken();

  const config = {
    method: 'GET',
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  // Don't set Content-Type for FormData (let browser set boundary)
  if (!(options.body instanceof FormData) && !config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error(`[LabOrdersAPI] Error for ${endpoint}:`, error);
    throw error;
  }
};

const labOrdersAPI = {
  /**
   * Get all lab orders for a patient (tenant-isolated via JWT)
   * GET /api/lab-orders/patient/:patientId
   */
  getByPatient: async (patientId) => {
    return apiRequest(`/lab-orders/patient/${patientId}`);
  },

  /**
   * Update lab order status
   * PATCH /api/lab-orders/:id/status
   * @param {string} id - Lab order ID
   * @param {object} data - { status: 'sample_collected'|'completed'|'reviewed', doctor_notes?: string }
   */
  updateStatus: async (id, data) => {
    return apiRequest(`/lab-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Upload a lab report file (PDF/JPG/PNG, max 10MB)
   * POST /api/lab-orders/:id/upload
   * Auto-triggers status = COMPLETED
   * @param {string} id - Lab order ID
   * @param {File} file - The file to upload
   */
  uploadReport: async (id, file) => {
    const formData = new FormData();
    formData.append('report', file);

    return apiRequest(`/lab-orders/${id}/upload`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type with boundary for FormData
    });
  },

  /**
   * Delete a lab order (ORDERED status only)
   * DELETE /api/lab-orders/:id
   */
  remove: async (id) => {
    return apiRequest(`/lab-orders/${id}`, {
      method: 'DELETE',
    });
  },
};

export default labOrdersAPI;
