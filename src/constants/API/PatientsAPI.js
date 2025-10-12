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
    console.error(`PatientsAPI Error for ${endpoint}:`, error)
    throw error
  }
}

// Patients API
export const patientsAPI = {
  // Get all patients with optional filters
  getAll: async (params = {}) => {
    const { hospital_id, search, limit = 10, offset = 0, status, age_group } = params
    const queryParams = new URLSearchParams()
    
    if (hospital_id) queryParams.append('hospital_id', hospital_id)
    if (search) queryParams.append('search', search)
    if (limit) queryParams.append('limit', limit.toString())
    if (offset) queryParams.append('offset', offset.toString())
    if (status) queryParams.append('status', status)
    if (age_group) queryParams.append('age_group', age_group)
    
    const endpoint = queryParams.toString() ? `/patients?${queryParams.toString()}` : '/patients'
    return apiRequest(endpoint)
  },

  // Get patient by ID
  getById: async (id) => {
    return apiRequest(`/patients/${id}`)
  },

  // Create new patient
  create: async (patientData) => {
    return apiRequest('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    })
  },

  // Update patient
  update: async (id, patientData) => {
    return apiRequest(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patientData),
    })
  },

  // Delete patient
  delete: async (id) => {
    return apiRequest(`/patients/${id}`, {
      method: 'DELETE',
    })
  },

  // Search patients
  search: async (query, filters = {}) => {
    const params = { search: query, ...filters }
    return patientsAPI.getAll(params)
  },

  // Get patients by hospital
  getByHospital: async (hospitalId, params = {}) => {
    return patientsAPI.getAll({ hospital_id: hospitalId, ...params })
  },

  // Get patients by status
  getByStatus: async (status, params = {}) => {
    return patientsAPI.getAll({ status, ...params })
  },

  // Get patient medical history
  getMedicalHistory: async (id) => {
    return apiRequest(`/patients/${id}/medical-history`)
  },

  // Add medical record
  addMedicalRecord: async (id, recordData) => {
    return apiRequest(`/patients/${id}/medical-history`, {
      method: 'POST',
      body: JSON.stringify(recordData),
    })
  },

  // Get patient appointments
  getAppointments: async (id, params = {}) => {
    const { status, start_date, end_date } = params
    const queryParams = new URLSearchParams()
    
    if (status) queryParams.append('status', status)
    if (start_date) queryParams.append('start_date', start_date)
    if (end_date) queryParams.append('end_date', end_date)
    
    const endpoint = queryParams.toString() 
      ? `/patients/${id}/appointments?${queryParams.toString()}` 
      : `/patients/${id}/appointments`
    return apiRequest(endpoint)
  },

  // Get patient reminders
  getReminders: async (id, params = {}) => {
    const { status, priority } = params
    const queryParams = new URLSearchParams()
    
    if (status) queryParams.append('status', status)
    if (priority) queryParams.append('priority', priority)
    
    const endpoint = queryParams.toString() 
      ? `/patients/${id}/reminders?${queryParams.toString()}` 
      : `/patients/${id}/reminders`
    return apiRequest(endpoint)
  },

  // Get patient statistics
  getStats: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString()
    const endpoint = queryParams ? `/patients/stats?${queryParams}` : '/patients/stats'
    return apiRequest(endpoint)
  },
}

export default patientsAPI
