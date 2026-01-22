import { baseUrl } from '../constants/Constant'
import { getAuthToken } from '../utils/auth'

// API Configuration
const API_CONFIG = {
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
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
  const token = getAuthToken()

  const config = {
    ...options,
    headers: {
      ...API_CONFIG.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)
    return await handleResponse(response)
  } catch (error) {
    console.error(`StaffAPI Error for ${endpoint}:`, error)
    throw error
  }
}

//--- PATCH helper
const patch = async (endpoint, data) => {
  return apiRequest(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined
  })
}

// Staff API (handles both doctors and staff)
export const staffApi = {
  // Get all staff/doctors with optional filters
  getAll: async (params = {}) => {
    const { hospital_id, search, limit = 10, offset = 0 } = params
    const queryParams = new URLSearchParams()
    if (hospital_id) queryParams.append('hospital_id', hospital_id)
    if (search) queryParams.append('search', search)
    if (limit) queryParams.append('limit', limit.toString())
    if (offset) queryParams.append('offset', offset.toString())
    const endpoint = queryParams.toString() ? `/staffs?${queryParams.toString()}` : '/staffs'
    return apiRequest(endpoint)
  },

  getById: async (id) => {
    return apiRequest(`/staffs/${id}`)
  },

  create: async (staffData) => {
    return apiRequest('/staffs', {
      method: 'POST',
      body: JSON.stringify(staffData),
    })
  },

  update: async (id, staffData) => {
    return apiRequest(`/staffs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(staffData),
    })
  },

  delete: async (id) => {
    return apiRequest(`/staffs/${id}`, {
      method: 'DELETE',
    })
  },

  search: async (query, filters = {}) => {
    const params = { search: query, ...filters }
    return staffApi.getAll(params)
  },

  getByHospital: async (hospitalId, params = {}) => {
    return staffApi.getAll({ hospital_id: hospitalId, ...params })
  },

  getByRole: async (role, params = {}) => {
    const paramsWithRole = { ...params, role }
    return staffApi.getAll(paramsWithRole)
  },

  getAvailability: async (id, date) => {
    const params = date ? `?date=${date}` : ''
    return apiRequest(`/staffs/${id}/availability${params}`)
  },

  updateAvailability: async (id, availabilityData) => {
    return apiRequest(`/staffs/${id}/availability`, {
      method: 'PUT',
      body: JSON.stringify(availabilityData),
    })
  },

  getSpecialties: async () => {
    return apiRequest('/staffs/specialties')
  },

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

  updateSchedule: async (id, scheduleData) => {
    return apiRequest(`/staffs/${id}/schedule`, {
      method: 'PUT',
      body: JSON.stringify(scheduleData),
    })
  },

  getStats: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString()
    const endpoint = queryParams ? `/staffs/stats?${queryParams}` : '/staffs/stats'
    return apiRequest(endpoint)
  },

  // Check if a phone number already exists in a hospital
  checkPhone: async (phone, hospitalId, excludeId = null) => {
    const queryParams = new URLSearchParams({
      phone,
      hospital_id: hospitalId
    });
    if (excludeId) queryParams.append('exclude_id', excludeId);
    return apiRequest(`/staffs/check-phone?${queryParams.toString()}`);
  },

  // Fixed: Soft delete staff by ID via PATCH
  softDelete: async (id) => {
    return patch(`/staffs/${id}/soft-delete`)
  }
}

export default staffApi
