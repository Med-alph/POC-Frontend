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
  // Status 304 is considered successful for cache hits, but response.ok is only true for 200-299
  const isSuccess = response.ok || response.status === 304;

  if (!isSuccess) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }

  // Status 304 often has no body, so return an empty structure
  if (response.status === 304) {
    return { content: "" }; // Component will fall back to default policy if empty
  }

  const contentType = response.headers.get('content-type')
  if (contentType && (contentType.includes('application/json'))) {
    return response.json()
  }

  // For HTML/Text content (like privacy policy/terms)
  const text = await response.text()

  // If we got HTML or it looks like HTML, wrap it in a mock JSON object
  const isHTML = (contentType && contentType.includes('text/html')) || text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');

  if (isHTML) {
    // Try to extract body content if it's a full HTML page
    const bodyMatch = text.match(/<body[^>]*>([\s\S]*)<\/body>/i)
    const content = bodyMatch ? bodyMatch[1] : text
    return { content: content }
  }

  // For plain text, also return it as content so the UI can use it
  return { content: text }
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
    console.error(`ComplianceAPI Error for ${endpoint}:`, error)
    throw error
  }
}

export const complianceAPI = {
  // Patient Consent APIs
  grantConsent: async (patientId, consentData) => {
    return apiRequest(`/api/patients/${patientId}/consent`, {
      method: 'POST',
      body: JSON.stringify(consentData),
    })
  },

  getConsentStatus: async (patientId, hospitalId) => {
    return apiRequest(`/api/patients/${patientId}/consent-status?hospital_id=${hospitalId}`, {
      method: 'GET',
    })
  },

  withdrawConsent: async (patientId, withdrawData) => {
    return apiRequest(`/api/patients/${patientId}/consent/withdraw`, {
      method: 'POST',
      body: JSON.stringify(withdrawData),
    })
  },

  // Terms Acceptance APIs
  acceptTerms: async (termsData) => {
    return apiRequest('/api/terms/accept', {
      method: 'POST',
      body: JSON.stringify(termsData),
    })
  },

  getTermsStatus: async (userId, hospitalId = null) => {
    const queryString = hospitalId ? `?hospital_id=${hospitalId}` : ''
    return apiRequest(`/api/terms/status/${userId}${queryString}`, {
      method: 'GET',
    })
  },

  // Static Content APIs
  getPrivacyPolicy: async () => {
    return apiRequest('/api/privacy-policy', {
      method: 'GET',
    })
  },

  getTermsOfService: async () => {
    return apiRequest('/api/terms-of-service', {
      method: 'GET',
    })
  },

  // Hospital Consent Configuration APIs
  getHospitalConsentConfig: async (hospitalId) => {
    return apiRequest(`/api/hospitals/${hospitalId}/consent-config`, {
      method: 'GET',
    })
  },

  updateHospitalConsentConfig: async (hospitalId, updateData) => {
    return apiRequest(`/api/hospitals/${hospitalId}/consent-config`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    })
  },

  // New Consent Recording APIs
  recordSelfConsent: async (patientId, consentData) => {
    return apiRequest(`/api/patients/${patientId}/self-consent`, {
      method: 'POST',
      body: JSON.stringify(consentData),
    })
  },

  recordStaffConsent: async (patientId, consentData) => {
    return apiRequest(`/api/patients/${patientId}/staff-consent`, {
      method: 'POST',
      body: JSON.stringify(consentData),
    })
  }
};

export default complianceAPI;