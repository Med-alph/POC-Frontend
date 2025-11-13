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
    console.error(`DesignationAPI Error for ${endpoint}:`, error)
    throw error
  }
}


// Designation API
export const designationapi = {
  // Fetch all designations grouped by department
  getAllGrouped: async () => {
    return apiRequest('/designations')
  },

  // Get single designation by ID
  getById: async (id) => {
    return apiRequest(`/designations/${id}`)
  },

  // Create new designation
  create: async (designationData) => {
    return apiRequest('/designations', {
      method: 'POST',
      body: JSON.stringify(designationData),
    })
  },

  // Update existing designation by ID
  update: async (id, designationData) => {
    return apiRequest(`/designations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(designationData),
    })
  },

  // Delete designation by ID
  remove: async (id) => {
    return apiRequest(`/designations/${id}`, {
      method: 'DELETE',
    })
  },
}

export default designationapi