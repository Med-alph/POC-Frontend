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
    console.error(`DashboardAPI Error for ${endpoint}:`, error)
    throw error
  }
}

// Dashboard API
export const dashboardAPI = {
  // Get dashboard statistics
  getStats: async (params = {}) => {
    const { hospital_id, period = 'week' } = params
    const queryParams = new URLSearchParams()
    
    if (hospital_id) queryParams.append('hospital_id', hospital_id)
    queryParams.append('period', period)
    
    const endpoint = queryParams.toString() ? `/dashboard/stats?${queryParams.toString()}` : '/dashboard/stats'
    return apiRequest(endpoint)
  },

  // Get recent appointments
  getRecentAppointments: async (params = {}) => {
    const { hospital_id, limit = 10 } = params
    const queryParams = new URLSearchParams()
    
    if (hospital_id) queryParams.append('hospital_id', hospital_id)
    queryParams.append('limit', limit.toString())
    
    return apiRequest(`/dashboard/recent-appointments?${queryParams.toString()}`)
  },

  // Get upcoming appointments
  getUpcomingAppointments: async (params = {}) => {
    const { hospital_id, days = 7, limit = 10 } = params
    const queryParams = new URLSearchParams()
    
    if (hospital_id) queryParams.append('hospital_id', hospital_id)
    queryParams.append('days', days.toString())
    queryParams.append('limit', limit.toString())
    
    return apiRequest(`/dashboard/upcoming-appointments?${queryParams.toString()}`)
  },

  // Get patient visits chart data
  getPatientVisitsChart: async (params = {}) => {
    const { hospital_id, period = 'week', start_date, end_date } = params
    const queryParams = new URLSearchParams()
    
    if (hospital_id) queryParams.append('hospital_id', hospital_id)
    queryParams.append('period', period)
    if (start_date) queryParams.append('start_date', start_date)
    if (end_date) queryParams.append('end_date', end_date)
    
    return apiRequest(`/dashboard/patient-visits-chart?${queryParams.toString()}`)
  },

  // Get appointment status distribution
  getAppointmentStatusDistribution: async (params = {}) => {
    const { hospital_id, period = 'month' } = params
    const queryParams = new URLSearchParams()
    
    if (hospital_id) queryParams.append('hospital_id', hospital_id)
    queryParams.append('period', period)
    
    return apiRequest(`/dashboard/appointment-status-distribution?${queryParams.toString()}`)
  },

  // Get overdue reminders
  getOverdueReminders: async (params = {}) => {
    const { hospital_id, limit = 10 } = params
    const queryParams = new URLSearchParams()
    
    if (hospital_id) queryParams.append('hospital_id', hospital_id)
    queryParams.append('limit', limit.toString())
    
    return apiRequest(`/dashboard/overdue-reminders?${queryParams.toString()}`)
  },

  // Get upcoming reminders
  getUpcomingReminders: async (params = {}) => {
    const { hospital_id, days = 7, limit = 10 } = params
    const queryParams = new URLSearchParams()
    
    if (hospital_id) queryParams.append('hospital_id', hospital_id)
    queryParams.append('days', days.toString())
    queryParams.append('limit', limit.toString())
    
    return apiRequest(`/dashboard/upcoming-reminders?${queryParams.toString()}`)
  },
}

export default dashboardAPI