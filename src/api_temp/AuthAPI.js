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
    console.error(`AuthAPI Error for ${endpoint}:`, error)
    throw error
  }
}

// Authentication API
export const authAPI = {
  // Login user
  login: async (credentials) => {
    return apiRequest('/auth/staff/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  },

  // Admin login
  adminLogin: async (credentials) => {
    return apiRequest('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  },

  // Register new user
  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  },

  // Logout user
  logout: async () => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    })
  },

  // Get current user profile
  getProfile: async () => {
    return apiRequest('/auth/profile')
  },

  // Update user profile
  updateProfile: async (profileData) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    })
  },

  // Change password
  changePassword: async (passwordData) => {
    return apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    })
  },

  // Forgot password
  forgotPassword: async (email) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },

  // Reset password
  resetPassword: async (resetData) => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(resetData),
    })
  },

  // Refresh token
  refreshToken: async () => {
    return apiRequest('/auth/refresh', {
      method: 'POST',
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
  // Send OTP
  sendOtp: async ({ phone }) => {
    return apiRequest('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  // Verify OTP
  verifyOtp: async ({ phone, otp }) => {
    return apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  },

   // Add checkPhone method
  checkPhone: async ({ phone }) => {
    return apiRequest(`/auth/check-phone?phone=${encodeURIComponent(phone)}`, {
      method: 'GET',
    });
  },
}

export default authAPI
