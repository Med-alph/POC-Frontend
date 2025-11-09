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
  const token = getAuthToken();

  console.log('API Request:', { url, token: token ? 'Present' : 'Missing', options }); // Debug log

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
    console.error(`AppointmentsAPI Error for ${endpoint}:`, error);
    throw error;
  }
};

// Appointments API
export const appointmentsAPI = {
  // Get all appointments with optional filters
  getAll: async (params = {}) => {
    const {
      hospital_id,
      search,
      limit = 10,
      offset = 0,
      patient_id,
      staff_id,
      status,
      fromDate,      // <<< Use fromDate not start_date
      toDate         // <<< Use toDate not end_date
    } = params;
    const queryParams = new URLSearchParams();

    if (hospital_id) queryParams.append('hospital_id', hospital_id);
    if (search) queryParams.append('search', search);
    if (limit) queryParams.append('limit', limit.toString());
    if (offset) queryParams.append('offset', offset.toString());
    if (patient_id) queryParams.append('patient_id', patient_id);
    if (staff_id) queryParams.append('staff_id', staff_id);
    if (status) queryParams.append('status', status);

    // >>> Correct parameter keys:
    if (fromDate) queryParams.append('fromDate', fromDate);
    if (toDate) queryParams.append('toDate', toDate);

    // Remove these lines (do NOT use start_date or end_date at all!)
    // if (start_date) queryParams.append('start_date', start_date);
    // if (end_date) queryParams.append('end_date', end_date);

    const endpoint = queryParams.toString() ? `/appointments?${queryParams.toString()}` : '/appointments';
    // Add log for verification!
    console.log("appointmentsAPI.getAll - url:", endpoint);
    return apiRequest(endpoint);
  },


  // Get appointment by ID
  getById: async (id) => {
    console.log('appointmentsAPI.getById called with id:', id); // Debug log
    return apiRequest(`/appointments/${id}`);
  },

  // Create new appointment
  create: async (appointmentData) => {
  return apiRequest('/appointments', {
    method: 'POST',
    body: JSON.stringify(appointmentData),
  });
},


  // Update appointment (use PATCH method)
  // API call method to update appointment
update: async (id, data) => {
  return apiRequest(`/appointments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
},


  // Delete appointment
  delete: async (id) => {
    return apiRequest(`/appointments/${id}`, {
      method: 'DELETE',
    });
  },

  // Cancel appointment
  cancel: async (id, reason) => {
    return apiRequest(`/appointments/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Reschedule appointment
  reschedule: async (id, newDateTime) => {
    return apiRequest(`/appointments/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(newDateTime),
    });
  },

  // Confirm appointment
  confirm: async (id) => {
    return apiRequest(`/appointments/${id}/confirm`, {
      method: 'POST',
    });
  },

  // Complete appointment
  complete: async (id, notes) => {
    return apiRequest(`/appointments/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  // Get appointments by patient
  getByPatient: async (patientId, params = {}) => {
    return appointmentsAPI.getAll({ patient_id: patientId, ...params });
  },

  // Get appointments by doctor/staff
  getByStaff: async (staffId, params = {}) => {
    return appointmentsAPI.getAll({ staff_id: staffId, ...params });
  },

  // Get appointments by hospital
  getByHospital: async (hospitalId, params = {}) => {
    return appointmentsAPI.getAll({ hospital_id: hospitalId, ...params });
  },

  // Get appointments by status
  getByStatus: async (status, params = {}) => {
    return appointmentsAPI.getAll({ status, ...params });
  },

  // Get available slots for a doctor on a specific date
  getAvailableSlots: async (staffId, date) => {
    const params = new URLSearchParams({
      staff_id: staffId,
      date: date,
    });
    return apiRequest(`/appointments/available-slots?${params.toString()}`);
  },

  // Get appointment statistics
  getStats: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `/appointments/stats?${queryParams}` : '/appointments/stats';
    return apiRequest(endpoint);
  },

  // Get today's appointments for logged-in doctor
  getTodaysAppointments: async () => {
    return apiRequest('/appointments/doctor/today');
  },

  // New: Get upcoming (future) appointments for logged-in doctor (e.g. next 7 days)
  getUpcomingAppointments: async () => {
    return apiRequest('/appointments/doctor/upcoming');
  },

  // New: Get weekly patient visits count for last 7 days (optionally by hospital)
  getWeeklyVisits: async (hospital_id) => {
    // Append hospital_id as query param if provided
    const url = hospital_id ? `/appointments/stats/weekly-visits?hospital_id=${hospital_id}` : '/appointments/stats/weekly-visits';
    return apiRequest(url);
  },

  getAppointmentsPerDepartment: async (hospital_id) => {
    const url = hospital_id
      ? `/appointments/stats/appointments-per-department?hospital_id=${hospital_id}`
      : '/appointments/stats/appointments-per-department';
    return apiRequest(url);
  },


  // New: Get fulfilled appointments for logged-in doctor
  getFulfilledAppointments: async () => {
    return apiRequest('/appointments/doctor/fulfilled');
  },

  getAppointmentStatusCounts: async (hospital_id) => {
    const url = hospital_id
      ? `/appointments/stats/appointments-status-counts?hospital_id=${hospital_id}`
      : '/appointments/stats/appointments-status-counts';
    return apiRequest(url);
  },


};

export default appointmentsAPI;
