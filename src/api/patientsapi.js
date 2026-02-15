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
  console.log('[handleResponse] Status:', response.status, response.statusText);

  if (!response.ok && response.status !== 304) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }

  // Handle 304 Not Modified - read from cache
  const text = await response.text()
  console.log('[handleResponse] Response text length:', text?.length);

  if (!text || text.trim() === '' || text === 'null') {
    console.log('[handleResponse] Empty or null response');
    return null
  }

  try {
    const parsed = JSON.parse(text)
    console.log('[handleResponse] Parsed response:', parsed);
    return parsed
  } catch (error) {
    console.error('[handleResponse] Failed to parse JSON:', error)
    return null
  }
}

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.baseURL}${endpoint}`
  const token = getAuthToken()

  console.log('[apiRequest] URL:', url);
  console.log('[apiRequest] Method:', options.method || 'GET');

  const config = {
    ...options,
    credentials: 'include', // SOC 2: Required for httpOnly cookies
    headers: {
      ...API_CONFIG.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)
    return await handleResponse(response)
  } catch (error) {
    console.error(`[apiRequest] Error for ${endpoint}:`, error)
    throw error
  }
}

// Patients API
export const patientsAPI = {
  getAll: async (params = {}) => {
    const { hospital_id, search, limit = 10, offset = 0, status, age_group, fromDate, toDate } = params;
    const queryParams = new URLSearchParams();

    if (hospital_id) queryParams.append('hospital_id', hospital_id);
    if (search) queryParams.append('search', search);
    if (limit) queryParams.append('limit', limit.toString());
    if (offset) queryParams.append('offset', offset.toString());
    if (status) queryParams.append('status', status);
    if (age_group) queryParams.append('age_group', age_group);
    if (fromDate) queryParams.append('fromDate', fromDate);  // Add fromDate param
    if (toDate) queryParams.append('toDate', toDate);        // Add toDate param

    const endpoint = queryParams.toString() ? `/patients?${queryParams.toString()}` : '/patients';
    return apiRequest(endpoint);
  },


  // Get patient by ID
  getById: async (id) => {
    return apiRequest(`/patients/${id}`)
  },

  /**
   * Get patient by phone number and hospital ID
   * Returns patient object if found, null if not found
   */
  getByPhoneAndHospital: async (phone, hospitalId) => {
    try {
      console.log(`[PatientsAPI.getByPhoneAndHospital] START`);
      console.log(`[PatientsAPI.getByPhoneAndHospital] phone: ${phone}`);
      console.log(`[PatientsAPI.getByPhoneAndHospital] hospitalId: ${hospitalId}`);

      const endpoint = `/patients/phone/${phone}/hospital/${hospitalId}`
      console.log(`[PatientsAPI.getByPhoneAndHospital] endpoint: ${endpoint}`);

      const result = await apiRequest(endpoint)

      console.log(`[PatientsAPI.getByPhoneAndHospital] Raw result:`, result);
      console.log(`[PatientsAPI.getByPhoneAndHospital] Result type:`, typeof result);

      // Explicitly handle null response
      if (result === null || result === undefined) {
        console.log('[PatientsAPI.getByPhoneAndHospital] Patient not found (null/undefined)')
        return null
      }

      // Check if result is an empty object
      if (typeof result === 'object' && Object.keys(result).length === 0) {
        console.log('[PatientsAPI.getByPhoneAndHospital] Patient not found (empty object)')
        return null
      }

      // Valid patient data found
      if (result && result.id) {
        console.log(`[PatientsAPI.getByPhoneAndHospital] Patient found: ${result.patient_name} (ID: ${result.id})`)
        console.log('[PatientsAPI.getByPhoneAndHospital] Full patient data:', JSON.stringify(result, null, 2))
        return result
      }

      // Any other case, treat as not found
      console.log('[PatientsAPI.getByPhoneAndHospital] Patient not found (no id field)')
      return null

    } catch (error) {
      console.error('[PatientsAPI.getByPhoneAndHospital] Error:', error)

      // If it's a 404 error, return null instead of throwing
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        console.log('[PatientsAPI.getByPhoneAndHospital] Patient not found (404 error)')
        return null
      }

      // For other errors (network issues, 500, etc.), rethrow
      throw error
    }
  },

  // Create new patient
  create: async (patientData) => {
    console.log('[PatientsAPI.create] Creating patient:', patientData.patient_name)
    return apiRequest('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    })
  },

  // Update patient
  update: async (id, patientData) => {
    console.log('[PatientsAPI.update] Updating patient:', id)
    return apiRequest(`/patients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patientData),
    })
  },

  // Delete patient (soft delete)
  delete: async (id) => {
    console.log('[PatientsAPI.delete] Deleting patient:', id)
    return apiRequest(`/patients/${id}`, {
      method: 'DELETE',
    })
  },

  // Search patients
  search: async (query, filters = {}) => {
    console.log('[PatientsAPI.search] Searching patients:', query)
    const params = { search: query, ...filters }
    return patientsAPI.getAll(params)
  },

  // Get patients by hospital
  getByHospital: async (hospitalId, params = {}) => {
    console.log('[PatientsAPI.getByHospital] Getting patients for hospital:', hospitalId)
    return patientsAPI.getAll({ hospital_id: hospitalId, ...params })
  },

  // Get patients by status
  getByStatus: async (status, params = {}) => {
    console.log('[PatientsAPI.getByStatus] Getting patients by status:', status)
    return patientsAPI.getAll({ status, ...params })
  },

  // Get patient medical history
  getMedicalHistory: async (id) => {
    console.log('[PatientsAPI.getMedicalHistory] Getting medical history for patient:', id)
    return apiRequest(`/patients/${id}/medical-history`)
  },

  // Add medical record
  addMedicalRecord: async (id, recordData) => {
    console.log('[PatientsAPI.addMedicalRecord] Adding medical record for patient:', id)
    return apiRequest(`/patients/${id}/medical-history`, {
      method: 'POST',
      body: JSON.stringify(recordData),
    })
  },

  // Get patient appointments
  getAppointments: async (id, params = {}) => {
    console.log('[PatientsAPI.getAppointments] Getting appointments for patient:', id)
    const { status, start_date, end_date } = params
    const queryParams = new URLSearchParams()

    if (status) queryParams.append('status', status)
    if (start_date) queryParams.append('start_date', start_date)
    if (end_date) queryParams.append('end_date', end_date)

    const endpoint = queryParams.toString()
      ? `/patients/${id}/appointments?${queryParams.toString()}`
      : `/patients/${id}/appointments`
    return apiRequest(endpoint)
  },

  // Get patient reminders
  getReminders: async (id, params = {}) => {
    console.log('[PatientsAPI.getReminders] Getting reminders for patient:', id)
    const { status, priority } = params
    const queryParams = new URLSearchParams()

    if (status) queryParams.append('status', status)
    if (priority) queryParams.append('priority', priority)

    const endpoint = queryParams.toString()
      ? `/patients/${id}/reminders?${queryParams.toString()}`
      : `/patients/${id}/reminders`
    return apiRequest(endpoint)
  },

  // Get patient statistics
  getStats: async (params = {}) => {
    console.log('[PatientsAPI.getStats] Getting patient statistics')
    const queryParams = new URLSearchParams(params).toString()
    const endpoint = queryParams ? `/patients/stats?${queryParams}` : '/patients/stats'
    return apiRequest(endpoint)
  },
}

export default patientsAPI