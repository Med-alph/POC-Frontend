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
      console.warn('Response body is not valid JSON:', jsonError);
      errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
    }
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const text = await response.text();
    if (!text) {
      return {};
    }
    try {
      return JSON.parse(text);
    } catch (jsonError) {
      console.warn('Response is not valid JSON:', text);
      return { message: 'Operation completed successfully' };
    }
  } else {
    const text = await response.text();
    return text ? { message: text } : { message: 'Operation completed successfully' };
  }
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  const token = getAuthToken();

  const config = {
    ...options,
    credentials: 'include', // SOC 2: Required for httpOnly cookies
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
    console.error(`UIModulesAPI Error for ${endpoint}:`, error);
    throw error;
  }
};

export const uiModulesAPI = {
  // Get tenant's allowed UI modules
  getTenantUIModules: () => apiRequest('/tenant/ui-modules', { method: 'GET' }),

  // Get final UI modules for current user (intersection of tenant plan + user role)
  getFinalUserUIModules: () => apiRequest('/tenant/ui-modules/user/final-modules', { method: 'GET' }),

  // Check specific module access
  checkModuleAccess: (moduleKey) => apiRequest(`/tenant/ui-modules/${moduleKey}/access`, { method: 'GET' }),

  // Get all available UI modules
  getAllUIModules: () => apiRequest('/tenant/ui-modules/all', { method: 'GET' }),

  // Get feature-module mapping
  getFeatureModuleMapping: () => apiRequest('/tenant/ui-modules/mapping', { method: 'GET' }),
};

export default uiModulesAPI;