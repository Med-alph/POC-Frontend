import { baseUrl } from '../constants/Constant';
import { getAuthToken } from '../utils/auth';

const apiRequest = async (endpoint, options = {}) => {
  const url = `${baseUrl}${endpoint}`;
  const token = getAuthToken();
  
  const config = {
    method: 'GET',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    throw error;
  }
};

const notificationAPI = {
  // Get notifications for a specific user
  getUserNotifications: async (userId) => {
    return apiRequest(`/notifications/user/${userId}`);
  },

  // Mark a notification as read
  markAsRead: async (notificationId) => {
    return apiRequest(`/notifications/${notificationId}/mark-read`, {
      method: 'POST',
    });
  },

  // Additional notification-related APIs can be added here
};

export default notificationAPI;
