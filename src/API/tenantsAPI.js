import { baseUrl } from '../constants/Constant'

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
  const config = {
    ...options,
    headers: {
      ...API_CONFIG.headers,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)
    return await handleResponse(response)
  } catch (error) {
    console.error(`TenantsAPI Error for ${endpoint}:`, error)
    throw error
  }
}

// Tenants API
export const tenantsAPI = {
  // Get all tenants with optional search/pagination
  getAll: async (params = {}) => {
    const { search, limit = 10, offset = 0 } = params
    const queryParams = new URLSearchParams()
    if (search) queryParams.append('search', search)
    if (limit) queryParams.append('limit', limit.toString())
    if (offset) queryParams.append('offset', offset.toString())

    const endpoint = queryParams.toString() ? `/tenants?${queryParams.toString()}` : '/tenants'
    return apiRequest(endpoint)
  },

  // Get tenant by ID
  getById: async (id) => {
    return apiRequest(`/tenants/${id}`)
  },

  // Create new tenant
  create: async (tenantData) => {
    // Convert single string values to arrays if needed (like phone)
    const payload = {
      ...tenantData,
      phone: tenantData.phone
        ? Array.isArray(tenantData.phone)
          ? tenantData.phone.filter(Boolean)
          : [tenantData.phone]
        : [],
      working_days: tenantData.working_days
        ? Array.isArray(tenantData.working_days)
          ? tenantData.working_days.filter(Boolean)
          : [tenantData.working_days]
        : [],
      preferred_languages: tenantData.languages
        ? Array.isArray(tenantData.languages)
          ? tenantData.languages.filter(Boolean)
          : [tenantData.languages]
        : [],
      notification_channels: tenantData.notificationChannels
        ? Array.isArray(tenantData.notificationChannels)
          ? tenantData.notificationChannels.filter(Boolean)
          : [tenantData.notificationChannels]
        : [],
    }

    return apiRequest('/tenants', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  // Update tenant
  update: async (id, tenantData) => {
    return apiRequest(`/tenants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(tenantData),
    })
  },

  // Delete tenant
  delete: async (id) => {
    return apiRequest(`/tenants/${id}`, {
      method: 'DELETE',
    })
  },
}

export default tenantsAPI
