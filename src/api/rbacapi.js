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
    console.error(`RBAC API Error for ${endpoint}:`, error)
    throw error
  }
}

// RBAC API
export const rbacAPI = {
  // Roles Management
  getRoles: async () => {
    return apiRequest('/admin/roles')
  },

  createRole: async (roleData) => {
    return apiRequest('/admin/roles', {
      method: 'POST',
      body: JSON.stringify(roleData),
    })
  },

  updateRole: async (roleId, roleData) => {
    return apiRequest(`/admin/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    })
  },

  deleteRole: async (roleId) => {
    return apiRequest(`/admin/roles/${roleId}`, {
      method: 'DELETE',
    })
  },

  // Permissions Management
  getPermissions: async () => {
    return apiRequest('/admin/permissions')
  },

  createPermission: async (permissionData) => {
    return apiRequest('/admin/permissions', {
      method: 'POST',
      body: JSON.stringify(permissionData),
    })
  },

  updatePermission: async (permissionId, permissionData) => {
    return apiRequest(`/admin/permissions/${permissionId}`, {
      method: 'PUT',
      body: JSON.stringify(permissionData),
    })
  },

  deletePermission: async (permissionId) => {
    return apiRequest(`/admin/permissions/${permissionId}`, {
      method: 'DELETE',
    })
  },

  // Staff Role Assignment
  getStaff: async () => {
    return apiRequest('/admin/staff')
  },

  assignRoleToStaff: async (staffId, roleId) => {
    return apiRequest(`/admin/staff/${staffId}/role`, {
      method: 'POST',
      body: JSON.stringify({ roleId }),
    })
  },

  removeRoleFromStaff: async (staffId, roleId) => {
    return apiRequest(`/admin/staff/${staffId}/role/${roleId}`, {
      method: 'DELETE',
    })
  },

  // Role Permissions
  getRolePermissions: async (roleId) => {
    return apiRequest(`/admin/roles/${roleId}/permissions`)
  },

  assignPermissionToRole: async (roleId, permissionId) => {
    return apiRequest(`/admin/roles/${roleId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ permissionId }),
    })
  },

  removePermissionFromRole: async (roleId, permissionId) => {
    return apiRequest(`/admin/roles/${roleId}/permissions/${permissionId}`, {
      method: 'DELETE',
    })
  },

  // Set authentication token
  setAuthToken: (token) => {
    API_CONFIG.headers.Authorization = `Bearer ${token}`
  },

  // Remove authentication token
  removeAuthToken: () => {
    delete API_CONFIG.headers.Authorization
  },
}

export default rbacAPI