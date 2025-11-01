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
    console.error(`RemindersAPI Error for ${endpoint}:`, error)
    throw error
  }
}

// Reminders API
export const remindersAPI = {
  // Get all reminders with optional filters
  getAll: async (params = {}) => {
    const { 
      hospital_id, 
      search, 
      limit = 10, 
      offset = 0, 
      patient_id, 
      staff_id, 
      status, 
      priority, 
      reminder_type,
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
    if (priority) queryParams.append('priority', priority)
    if (reminder_type) queryParams.append('reminder_type', reminder_type)
    if (start_date) queryParams.append('start_date', start_date)
    if (end_date) queryParams.append('end_date', end_date)
    
    const endpoint = queryParams.toString() ? `/reminders?${queryParams.toString()}` : '/reminders'
    return apiRequest(endpoint)
  },

  // Get reminder by ID
  getById: async (id) => {
    return apiRequest(`/reminders/${id}`)
  },

  // Create new reminder
  create: async (reminderData) => {
    return apiRequest('/reminders', {
      method: 'POST',
      body: JSON.stringify(reminderData),
    })
  },

  // Update reminder
  update: async (id, reminderData) => {
    return apiRequest(`/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reminderData),
    })
  },

  // Delete reminder
  delete: async (id) => {
    return apiRequest(`/reminders/${id}`, {
      method: 'DELETE',
    })
  },

  // Mark reminder as completed
  markCompleted: async (id, notes) => {
    return apiRequest(`/reminders/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    })
  },

  // Get reminders by patient
  getByPatient: async (patientId, params = {}) => {
    return remindersAPI.getAll({ patient_id: patientId, ...params })
  },

  // Get reminders by staff
  getByStaff: async (staffId, params = {}) => {
    return remindersAPI.getAll({ staff_id: staffId, ...params })
  },

  // Get reminders by hospital
  getByHospital: async (hospitalId, params = {}) => {
    return remindersAPI.getAll({ hospital_id: hospitalId, ...params })
  },

  // Get reminders by status
  getByStatus: async (status, params = {}) => {
    return remindersAPI.getAll({ status, ...params })
  },

  // Get reminders by priority
  getByPriority: async (priority, params = {}) => {
    return remindersAPI.getAll({ priority, ...params })
  },

  // Get overdue reminders
  getOverdue: async (params = {}) => {
    const { hospital_id, staff_id } = params
    const queryParams = new URLSearchParams()
    
    if (hospital_id) queryParams.append('hospital_id', hospital_id)
    if (staff_id) queryParams.append('staff_id', staff_id)
    
    const endpoint = queryParams.toString() 
      ? `/reminders/overdue?${queryParams.toString()}` 
      : '/reminders/overdue'
    return apiRequest(endpoint)
  },

  // Get upcoming reminders
  getUpcoming: async (params = {}) => {
    const { days = 7, hospital_id, staff_id, priority } = params
    const queryParams = new URLSearchParams()
    queryParams.append('days', days.toString())
    
    if (hospital_id) queryParams.append('hospital_id', hospital_id)
    if (staff_id) queryParams.append('staff_id', staff_id)
    if (priority) queryParams.append('priority', priority)
    
    return apiRequest(`/reminders/upcoming?${queryParams.toString()}`)
  },

  // Get reminder statistics
  getStats: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString()
    const endpoint = queryParams ? `/reminders/stats?${queryParams}` : '/reminders/stats'
    return apiRequest(endpoint)
  },
}

export default remindersAPI
