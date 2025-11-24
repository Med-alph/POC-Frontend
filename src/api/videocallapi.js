import { baseUrl } from '../constants/Constant';
import { getAuthToken } from '../utils/auth';

// API Configuration
const API_CONFIG = {
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  // Try both token keys for compatibility with different auth flows
  const token = getAuthToken() || localStorage.getItem('auth_token');

  const config = {
    ...options,
    headers: {
      ...API_CONFIG.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    console.error(`VideoCallAPI Error for ${endpoint}:`, error);
    throw error;
  }
};

// Video Call API
export const videoCallAPI = {
  /**
   * Start a video call
   * @param {Object} callData
   * @param {string} callData.appointmentId - Appointment ID
   * @param {string} callData.patientId - Patient ID
   * @param {string} callData.roomName - Unique room name for Jitsi meeting
   * @param {string} callData.meetingUrl - Jitsi meeting URL
   * @returns {Promise<Object>} Call object with id, roomName, meetingUrl, status, etc.
   * 
   * Note: Backend stores the roomName and emits it to patient via Socket.IO.
   * Always use the roomName from the response to ensure synchronization.
   */
  startCall: async (callData) => {
    return apiRequest('/video-call/start', {
      method: 'POST',
      body: JSON.stringify(callData),
    });
  },

  /**
   * Update call status
   * @param {number} callId - Call ID
   * @param {string} status - New status (ringing, active, rejected, ended, missed)
   * @returns {Promise<Object>} Updated call object
   */
  updateCallStatus: async (callId, status) => {
    return apiRequest(`/video-call/${callId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * Get call details
   * @param {number} callId - Call ID
   * @returns {Promise<Object>} Call object
   */
  getCall: async (callId) => {
    return apiRequest(`/video-call/${callId}`);
  },

  /**
   * Get calls for a specific appointment
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Array>} Array of call objects
   */
  getCallsByAppointment: async (appointmentId) => {
    return apiRequest(`/video-call/appointment/${appointmentId}`);
  },

  /**
   * Get active call for a specific appointment
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Object|null>} Active call object or null if no active call
   */
  getActiveCall: async (appointmentId) => {
    try {
      const calls = await apiRequest(`/video-call/appointment/${appointmentId}`);
      // Find the most recent active call
      return calls.find(call => call.status === 'active' || call.status === 'pending') || null;
    } catch (error) {
      console.error('Error getting active call:', error);
      return null;
    }
  },

  /**
   * Get call history for a patient
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Array of call objects
   */
  getPatientCallHistory: async (patientId) => {
    return apiRequest(`/video-call/patient/${patientId}`);
  },
};

export default videoCallAPI;
