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
    credentials: 'include', // SOC 2: Required for httpOnly cookies
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
    console.error(`TenantSuperAdminAPI Error for ${endpoint}:`, error)
    throw error
  }
}

// Tenant Super Admin API methods
export const tenantsuperadminapi = {
  // Admin login for tenant superadmin
  login: async (credentials) => {
    return apiRequest('/tenant-admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  },

  // Password reset for tenant superadmin
  resetPassword: async (adminId, resetData, authToken) => {
    return apiRequest(`/tenant-admin/change-password`, {
      method: 'POST',
      body: JSON.stringify({ adminId, newPassword: resetData.newPassword }),
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
  },

  // Get tenant info by tenant ID
  getTenantInfo: async (tenantId) => {
    return apiRequest(`/tenant-admin/tenant-info?tenantId=${encodeURIComponent(tenantId)}`, {
      method: 'GET',
    })
  },
}

export default tenantsuperadminapi
