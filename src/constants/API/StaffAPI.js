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
    console.log('StaffAPI: Adding auth token to request:', endpoint)
  } else {
    console.warn('StaffAPI: No auth token found for request:', endpoint)
  }

  try {
    const response = await fetch(url, config)
    return await handleResponse(response)
  } catch (error) {
    console.error(`StaffAPI Error for ${endpoint}:`, error)
    throw error
  }
}

// Staff API (handles both doctors and staff)
export const staffAPI = {
  // Get all staff/doctors with optional filters
  getAll: async (params = {}) => {
    const { hospital_id, search, limit = 10, offset = 0 } = params
    const queryParams = new URLSearchParams()
    
    // Get hospital_id from Redux store if not provided
    const state = store.getState()
    const userHospitalId = state.auth.user?.hospital_id
    
    // Use provided hospital_id or fallback to user's hospital_id
    const finalHospitalId = hospital_id || userHospitalId
    
    if (finalHospitalId) queryParams.append('hospital_id', finalHospitalId)
    if (search) queryParams.append('search', search)
    if (limit) queryParams.append('limit', limit.toString())
    if (offset) queryParams.append('offset', offset.toString())
    
    const endpoint = queryParams.toString() ? `/staffs?${queryParams.toString()}` : '/staffs'
    console.log('StaffAPI: Making request to:', endpoint)
    return apiRequest(endpoint)
  },

  // Get staff member by ID
  getById: async (id) => {
    return apiRequest(`/staffs/${id}`)
  },

  // Create new staff member
  create: async (staffData) => {
    return apiRequest('/staffs', {
      method: 'POST',
      body: JSON.stringify(staffData),
    })
  },

  // Update staff member
  update: async (id, staffData) => {
    return apiRequest(`/staffs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(staffData),
    })
  },

  // Delete staff member
  delete: async (id) => {
    return apiRequest(`/staffs/${id}`, {
      method: 'DELETE',
    })
  },

  // Search staff members
  search: async (query, filters = {}) => {
    const params = { search: query, ...filters }
    return staffAPI.getAll(params)
  },

  // Get staff by hospital
  getByHospital: async (hospitalId, params = {}) => {
    return staffAPI.getAll({ hospital_id: hospitalId, ...params })
  },

  // Get staff by role/type (doctor, nurse, admin, etc.)
  getByRole: async (role, params = {}) => {
    const paramsWithRole = { ...params, role }
    return staffAPI.getAll(paramsWithRole)
  },

  // Get staff statistics with hospital_id
  getStats: async (params = {}) => {
    const state = store.getState()
    const userHospitalId = state.auth.user?.hospital_id
    const finalHospitalId = params.hospital_id || userHospitalId
    
    const queryParams = new URLSearchParams()
    if (finalHospitalId) queryParams.append('hospital_id', finalHospitalId)
    if (params.period) queryParams.append('period', params.period)
    
    const endpoint = queryParams.toString() ? `/staffs/stats?${queryParams.toString()}` : '/staffs/stats'
    return apiRequest(endpoint)
  },

  // Get staff availability
  getAvailability: async (id, date) => {
    const params = date ? `?date=${date}` : ''
    return apiRequest(`/staffs/${id}/availability${params}`)
  },

  // Update staff availability
  updateAvailability: async (id, availabilityData) => {
    return apiRequest(`/staffs/${id}/availability`, {
      method: 'PUT',
      body: JSON.stringify(availabilityData),
    })
  },

  // Get staff specialties (for doctors)
  getSpecialties: async () => {
    return apiRequest('/staffs/specialties')
  },

  // Get staff schedule
  getSchedule: async (id, params = {}) => {
    const { start_date, end_date } = params
    const queryParams = new URLSearchParams()
    
    if (start_date) queryParams.append('start_date', start_date)
    if (end_date) queryParams.append('end_date', end_date)
    
    const endpoint = queryParams.toString() 
      ? `/staffs/${id}/schedule?${queryParams.toString()}` 
      : `/staffs/${id}/schedule`
    return apiRequest(endpoint)
  },

  // Update staff schedule
  updateSchedule: async (id, scheduleData) => {
    return apiRequest(`/staffs/${id}/schedule`, {
      method: 'PUT',
      body: JSON.stringify(scheduleData),
    })
  },

}

export default staffAPI
