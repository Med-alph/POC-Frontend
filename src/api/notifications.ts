/**
 * Notifications API Client
 * 
 * REST API client for notification management.
 * Handles authentication and error handling.
 * 
 * Usage:
 *   import notificationsAPI from '@/api/notifications';
 *   const notifications = await notificationsAPI.list({ limit: 20, filter: 'unread' });
 */

import { baseUrl } from '../constants/Constant';
import { getAuthToken } from '../utils/auth';

export interface Notification {
  id: string;
  user_id: string;
  actor_id?: string;
  type: 'appointment' | 'lab' | 'claim' | 'task' | 'inventory' | 'system';
  title: string;
  body: string;
  target_type?: string;
  target_id?: string;
  data?: Record<string, any>;
  severity: 'info' | 'warning' | 'critical';
  status: 'unread' | 'read' | 'dismissed';
  grouped_key?: string;
  created_at: string;
  updated_at: string;
  read_at?: string;
  dismissed_at?: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
}

export interface NotificationCounts {
  total: number;
  unread: number;
  by_type: {
    appointment: number;
    lab: number;
    claim: number;
    task: number;
    inventory: number;
    system: number;
  };
  by_severity: {
    info: number;
    warning: number;
    critical: number;
  };
}

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${baseUrl}${endpoint}`;
  const token = getAuthToken();

  const config: RequestInit = {
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

const notificationsAPI = {
  /**
   * List notifications with pagination and filtering
   * 
   * @param options - Query options
   * @returns Paginated notifications
   */
  list: async (options: {
    limit?: number;
    offset?: number;
    filter?: 'all' | 'unread' | 'read';
    type?: Notification['type'];
  } = {}): Promise<NotificationListResponse> => {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.filter) params.append('filter', options.filter);
    if (options.type) params.append('type', options.type);

    const queryString = params.toString();
    return apiRequest(`/notifications${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get single notification by ID
   * 
   * @param id - Notification ID
   * @returns Notification
   */
  get: async (id: string): Promise<Notification> => {
    return apiRequest(`/notifications/${id}`);
  },

  /**
   * Get notification counts
   * 
   * @returns Counts by type and severity
   */
  getCounts: async (): Promise<NotificationCounts> => {
    return apiRequest('/notifications/counts');
  },

  /**
   * Mark notification as read
   * 
   * @param id - Notification ID
   * @returns Updated notification
   */
  markAsRead: async (id: string): Promise<Notification> => {
    return apiRequest(`/notifications/${id}/mark-read`, {
      method: 'POST',
    });
  },

  /**
   * Mark all notifications as read
   * 
   * @returns Count of updated notifications
   */
  markAllAsRead: async (): Promise<{ updated: number }> => {
    return apiRequest('/notifications/mark-all-read', {
      method: 'POST',
    });
  },

  /**
   * Dismiss a notification
   * 
   * @param id - Notification ID
   * @returns Updated notification
   */
  dismiss: async (id: string): Promise<Notification> => {
    return apiRequest(`/notifications/${id}/dismiss`, {
      method: 'POST',
    });
  },

  /**
   * Dismiss all notifications (clear all)
   * 
   * @returns Count of dismissed notifications
   */
  dismissAll: async (): Promise<{ dismissed: number }> => {
    return apiRequest('/notifications/dismiss-all', {
      method: 'POST',
    });
  },
};

export default notificationsAPI;

