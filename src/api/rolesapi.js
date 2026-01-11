import { baseUrl } from '../constants/Constant';
import { getAuthToken } from '../utils/auth';

// API Configuration
const API_CONFIG = {
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch (jsonError) {
      // If response body is empty or not JSON, create a generic error
      console.warn('Response body is not valid JSON:', jsonError);
      errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
    }
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  // Handle successful responses that might be empty
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const text = await response.text();
    if (!text) {
      // Empty response is OK for some operations (like role assignment)
      return {};
    }
    try {
      return JSON.parse(text);
    } catch (jsonError) {
      console.warn('Response is not valid JSON:', text);
      return { message: 'Operation completed successfully' };
    }
  } else {
    // Non-JSON response, return as text or empty object
    const text = await response.text();
    return text ? { message: text } : { message: 'Operation completed successfully' };
  }
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  const token = getAuthToken();
  
  console.log('RolesAPI Debug:', {
    endpoint,
    token: token ? `${token.substring(0, 20)}...` : 'No token',
    url
  });
  
  const config = {
    ...options,
    headers: {
      ...API_CONFIG.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    console.error(`RolesAPI Error for ${endpoint}:`, error);
    throw error;
  }
};

export const rolesAPI = {
  // Get all roles for tenant
  getRoles: () => apiRequest('/tenant-admin/roles', { method: 'GET' }),
  
  // Create new role
  createRole: (data) => apiRequest('/tenant-admin/roles', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Update role
  updateRole: (id, data) => apiRequest(`/tenant-admin/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  // Update role UI modules (new endpoint for granular permissions)
  updateRoleUIModules: (id, allowedUIModules) => apiRequest(`/roles/${id}/ui-modules`, {
    method: 'PUT',
    body: JSON.stringify({ allowed_ui_modules: allowedUIModules }),
  }),
  
  // Delete role
  deleteRole: (id) => apiRequest(`/tenant-admin/roles/${id}`, { method: 'DELETE' }),
  
  // Get available features based on tenant plan
  getAvailableFeatures: () => apiRequest('/tenant-admin/available-features', { method: 'GET' }),
  
  // Get roles for dropdown (staff assignment)
  getRolesDropdown: () => apiRequest('/tenant-admin/roles/dropdown', { method: 'GET' }),
  
  // Assign role to staff member
  assignRoleToStaff: (staffId, roleId) => {
    console.log('assignRoleToStaff called with:', { staffId, roleId, roleIdType: typeof roleId });
    const payload = { role_id: roleId };
    console.log('Role assignment payload:', payload);
    return apiRequest(`/tenant-admin/staff/${staffId}/role`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};

export default rolesAPI;