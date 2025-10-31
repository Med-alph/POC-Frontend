import { baseUrl } from '../constants/Constant'
import { store } from '../../app/store'

// API Configuration
const API_CONFIG = {
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
}

// Helper function to get token from Redux store
const getToken = () => {
  const state = store.getState()
  return state.auth.token
}

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }
  return response.json()
}

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.baseURL}${endpoint}`
  const token = getToken()
  
  const config = {
    ...options,
    headers: {
      ...API_CONFIG.headers,
      ...options.headers,
    },
  }

  // Add authorization header if token exists
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, config)
    return await handleResponse(response)
  } catch (error) {
    console.error(`AppointmentsAPI Error for ${endpoint}:`, error)
    throw error
  }
}

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
      start_date, 
      end_date 
    } = params
    const queryParams = new URLSearchParams()
    
    if (hospital_id) queryParams.append('hospital_id', hospital_id)
    if (search) queryParams.append('search', search)
    if (limit) queryParams.append('limit', limit.toString())
    if (offset) queryParams.append('offset', offset.toString())
    if (patient_id) queryParams.append('patient_id', patient_id)
    if (staff_id) queryParams.append('staff_id', staff_id)
    if (status) queryParams.append('status', status)
    if (start_date) queryParams.append('start_date', start_date)
    if (end_date) queryParams.append('end_date', end_date)
    
    const endpoint = queryParams.toString() ? `/appointments?${queryParams.toString()}` : '/appointments'
    return apiRequest(endpoint)
  },

  // Get appointment by ID
  getById: async (id) => {
    return apiRequest(`/appointments/${id}`)
  },

  // Create new appointment
  create: async (appointmentData) => {
    return apiRequest('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    })
  },

  // Update appointment
  update: async (id, appointmentData) => {
    return apiRequest(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    })
  },

  // Delete appointment
  delete: async (id) => {
    return apiRequest(`/appointments/${id}`, {
      method: 'DELETE',
    })
  },

  // Cancel appointment
  cancel: async (id, reason) => {
    return apiRequest(`/appointments/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  },

  // Reschedule appointment
  reschedule: async (id, newDateTime) => {
    return apiRequest(`/appointments/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(newDateTime),
    })
  },

  // Confirm appointment
  confirm: async (id) => {
    return apiRequest(`/appointments/${id}/confirm`, {
      method: 'POST',
    })
  },

  // Complete appointment
  complete: async (id, notes) => {
    return apiRequest(`/appointments/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    })
  },

  // Get appointments by patient
  getByPatient: async (patientId, params = {}) => {
    return appointmentsAPI.getAll({ patient_id: patientId, ...params })
  },

  // Get appointments by doctor/staff
  getByStaff: async (staffId, params = {}) => {
    return appointmentsAPI.getAll({ staff_id: staffId, ...params })
  },

  // Get appointments by hospital
  getByHospital: async (hospitalId, params = {}) => {
    return appointmentsAPI.getAll({ hospital_id: hospitalId, ...params })
  },

  // Get appointments by status
  getByStatus: async (status, params = {}) => {
    return appointmentsAPI.getAll({ status, ...params })
  },

  // Get available time slots for a staff member
  getAvailableSlots: async (staffId, date, params = {}) => {
    const { duration = 30 } = params
    const queryParams = new URLSearchParams()
    queryParams.append('date', date)
    if (duration) queryParams.append('duration', duration.toString())
    
    return apiRequest(`/appointments/available-slots/${staffId}?${queryParams.toString()}`)
  },

  // Get appointment statistics
  getStats: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString()
    const endpoint = queryParams ? `/appointments/stats?${queryParams}` : '/appointments/stats'
    return apiRequest(endpoint)
  },
}

export default appointmentsAPI
