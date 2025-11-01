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
    console.error(`HospitalsAPI Error for ${endpoint}:`, error)
    throw error
  }
}

// Hospital API methods
export const hospitalsapi = {
  create: async (payload) => {
    const token = getAuthToken()
    return apiRequest('/hospitals', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },

  getAll: async () => {
    return apiRequest('/hospitals', {
      method: 'GET',
    })
  },

  getOne: async (id) => {
    return apiRequest(`/hospitals/${id}`, {
      method: 'GET',
    })
  },

  getByTenant: async () => {
    return apiRequest('/hospitals/tenant', {
      method: 'GET',
    })
  },

  update: async (id, payload) => {
    const token = getAuthToken()
    return apiRequest(`/hospitals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },

  delete: async (id) => {
    const token = getAuthToken()
    return apiRequest(`/hospitals/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },
}

export default hospitalsapi
