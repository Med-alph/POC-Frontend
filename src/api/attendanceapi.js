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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  const token = getAuthToken();

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
    console.error(`AttendanceAPI Error for ${endpoint}:`, error);
    throw error;
  }
};

// Attendance API
export const attendanceAPI = {
  // ==================== ATTENDANCE ====================
  
  // Check in
  checkIn: async (data) => {
    return apiRequest('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Check out
  checkOut: async (attendanceId, notes = null) => {
    return apiRequest('/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify({ attendance_id: attendanceId, notes }),
    });
  },

  // Get today's status
  getTodayStatus: async (staffId) => {
    return apiRequest(`/attendance/today/${staffId}`);
  },

  // Get attendance history
  getHistory: async (staffId, params = {}) => {
    const { month, year, limit = 31, offset = 0 } = params;
    const queryParams = new URLSearchParams();
    
    if (month) queryParams.append('month', month);
    if (year) queryParams.append('year', year);
    if (limit) queryParams.append('limit', limit.toString());
    if (offset) queryParams.append('offset', offset.toString());

    const endpoint = `/attendance/history/${staffId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiRequest(endpoint);
  },

  // Get monthly summary
  getMonthlySummary: async (staffId, month, year) => {
    return apiRequest(`/attendance/monthly-summary/${staffId}?month=${month}&year=${year}`);
  },

  // ==================== LEAVE MANAGEMENT ====================

  // Apply for leave
  applyLeave: async (data) => {
    return apiRequest('/attendance/leave/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get leave list
  getLeaveList: async (staffId, params = {}) => {
    const { status, limit = 10, offset = 0 } = params;
    const queryParams = new URLSearchParams();
    
    if (status) queryParams.append('status', status);
    if (limit) queryParams.append('limit', limit.toString());
    if (offset) queryParams.append('offset', offset.toString());

    const endpoint = `/attendance/leave/list/${staffId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiRequest(endpoint);
  },

  // Get pending leave requests (for admin)
  getPendingLeaves: async (hospitalId, params = {}) => {
    const { limit = 50, offset = 0 } = params;
    const queryParams = new URLSearchParams();
    
    queryParams.append('hospital_id', hospitalId);
    if (limit) queryParams.append('limit', limit.toString());
    if (offset) queryParams.append('offset', offset.toString());

    const endpoint = `/attendance/leave/pending?${queryParams.toString()}`;
    return apiRequest(endpoint);
  },

  // Get all leave requests for hospital (for admin - includes all statuses)
  getHospitalLeaves: async (hospitalId, params = {}) => {
    const { status, limit = 100, offset = 0 } = params;
    const queryParams = new URLSearchParams();
    
    queryParams.append('hospital_id', hospitalId);
    if (status) queryParams.append('status', status);
    if (limit) queryParams.append('limit', limit.toString());
    if (offset) queryParams.append('offset', offset.toString());

    const endpoint = `/attendance/leave/hospital?${queryParams.toString()}`;
    return apiRequest(endpoint);
  },

  // Get leave balance
  getLeaveBalance: async (staffId, year) => {
    return apiRequest(`/attendance/leave/balance/${staffId}?year=${year}`);
  },

  // Update leave status (approve/reject)
  updateLeaveStatus: async (leaveId, data) => {
    return apiRequest(`/attendance/leave/${leaveId}/status`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Approve leave
  approveLeave: async (leaveId, approvedBy) => {
    return apiRequest(`/attendance/leave/${leaveId}/status`, {
      method: 'POST',
      body: JSON.stringify({ 
        status: 'approved', 
        approved_by: approvedBy 
      }),
    });
  },

  // Reject leave
  rejectLeave: async (leaveId, approvedBy, rejectionReason) => {
    return apiRequest(`/attendance/leave/${leaveId}/status`, {
      method: 'POST',
      body: JSON.stringify({ 
        status: 'rejected', 
        approved_by: approvedBy,
        rejection_reason: rejectionReason
      }),
    });
  },

  // ==================== PERMISSION REQUESTS ====================

  // Request permission
  requestPermission: async (data) => {
    return apiRequest('/attendance/permission/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get permission list
  getPermissionList: async (staffId, params = {}) => {
    const { status, limit = 10, offset = 0 } = params;
    const queryParams = new URLSearchParams();
    
    if (status) queryParams.append('status', status);
    if (limit) queryParams.append('limit', limit.toString());
    if (offset) queryParams.append('offset', offset.toString());

    const endpoint = `/attendance/permission/list/${staffId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiRequest(endpoint);
  },

  // Update permission status (approve/reject)
  updatePermissionStatus: async (permissionId, data) => {
    return apiRequest(`/attendance/permission/${permissionId}/status`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export default attendanceAPI;
