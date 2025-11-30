/**
 * useNotifications Hook
 * 
 * React hook for managing notifications with real-time updates via Socket.IO.
 * 
 * Features:
 * - Fetches notifications from API
 * - Listens to socket events for real-time updates
 * - Maintains local state for notifications and counts
 * - Handles mark-as-read with optimistic updates
 * - Groups notifications by date/groupedKey
 * 
 * Usage:
 *   const { notifications, counts, markAsRead, markAllAsRead, loading } = useNotifications();
 * 
 * TODO: Update socket connection to match your existing socket service.
 * The hook assumes socket events: 'notification:receive', 'notification:group-update', 'notification:status-change'
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import notificationsAPI, { Notification, NotificationCounts } from '../api/notifications';
import socketService from '../services/socketService';

interface UseNotificationsOptions {
  autoFetch?: boolean;
  limit?: number;
  filter?: 'all' | 'unread' | 'read';
  type?: Notification['type'];
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { autoFetch = true, limit = 20, filter = 'all', type } = options;
  const user = useSelector((state: any) => state.auth.user);
  const userId = user?.id;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [counts, setCounts] = useState<NotificationCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Track if socket listeners are set up
  const socketListenersSet = useRef(false);

  /**
   * Fetch notifications from API
   */
  const fetchNotifications = useCallback(async (reset = false) => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;
      const response = await notificationsAPI.list({
        limit,
        offset: currentOffset,
        filter,
        type,
      });

      if (reset) {
        setNotifications(response.notifications);
      } else {
        setNotifications((prev) => [...prev, ...response.notifications]);
      }

      setHasMore(response.notifications.length === limit);
      setOffset(currentOffset + response.notifications.length);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, limit, offset, filter, type]);

  /**
   * Fetch notification counts
   */
  const fetchCounts = useCallback(async () => {
    if (!userId) return;

    try {
      const countsData = await notificationsAPI.getCounts();
      setCounts(countsData);
    } catch (err) {
      console.error('Failed to fetch notification counts:', err);
    }
  }, [userId]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId
          ? { ...n, status: 'read' as const, read_at: new Date().toISOString() }
          : n
      )
    );

    // Update counts optimistically
    setCounts((prev) => {
      if (!prev) return prev;
      const notification = notifications.find((n) => n.id === notificationId);
      if (notification && notification.status === 'unread') {
        return {
          ...prev,
          unread: Math.max(0, prev.unread - 1),
          by_type: {
            ...prev.by_type,
            [notification.type]: Math.max(0, prev.by_type[notification.type] - 1),
          },
          by_severity: {
            ...prev.by_severity,
            [notification.severity]: Math.max(0, prev.by_severity[notification.severity] - 1),
          },
        };
      }
      return prev;
    });

    try {
      await notificationsAPI.markAsRead(notificationId);
      // Refresh counts to ensure accuracy
      await fetchCounts();
    } catch (err) {
      // Revert optimistic update on error
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, status: 'unread' as const, read_at: undefined }
            : n
        )
      );
      console.error('Failed to mark notification as read:', err);
      throw err;
    }
  }, [notifications, fetchCounts]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, status: 'read' as const, read_at: new Date().toISOString() }))
    );
    setCounts((prev) =>
      prev ? { ...prev, unread: 0, by_type: { appointment: 0, lab: 0, claim: 0, task: 0, inventory: 0, system: 0 }, by_severity: { info: 0, warning: 0, critical: 0 } } : null
    );

    try {
      await notificationsAPI.markAllAsRead();
      await fetchCounts();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      // Refresh to revert
      await fetchNotifications(true);
      await fetchCounts();
    }
  }, [fetchNotifications, fetchCounts]);

  /**
   * Dismiss a notification
   */
  const dismiss = useCallback(async (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    await notificationsAPI.dismiss(notificationId);
    await fetchCounts();
  }, [fetchCounts]);

  /**
   * Dismiss all notifications (clear all)
   */
  const dismissAll = useCallback(async () => {
    // Optimistic update
    setNotifications([]);
    setCounts((prev) =>
      prev ? { ...prev, total: 0, unread: 0, by_type: { appointment: 0, lab: 0, claim: 0, task: 0, inventory: 0, system: 0 }, by_severity: { info: 0, warning: 0, critical: 0 } } : null
    );

    try {
      await notificationsAPI.dismissAll();
      await fetchCounts();
      await fetchNotifications(true);
    } catch (err) {
      console.error('Failed to dismiss all notifications:', err);
      // Refresh to revert
      await fetchNotifications(true);
      await fetchCounts();
    }
  }, [fetchNotifications, fetchCounts]);

  /**
   * Load more notifications (pagination)
   */
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNotifications(false);
    }
  }, [loading, hasMore, fetchNotifications]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch && userId) {
      fetchNotifications(true);
      fetchCounts();
    }
  }, [userId, autoFetch]); // Only run on mount or userId change

  // Set up socket listeners for real-time updates
  useEffect(() => {
    if (!userId || socketListenersSet.current) return;

    // Listen for new notifications
    const handleNotificationReceive = (payload: any) => {
      const newNotification: Notification = {
        id: payload.id,
        user_id: userId,
        type: payload.type,
        title: payload.title,
        body: payload.summary,
        target_type: payload.target_type,
        target_id: payload.target_id,
        severity: payload.severity,
        status: 'unread',
        grouped_key: payload.grouped_key,
        created_at: payload.created_at,
        updated_at: payload.created_at,
      };

      setNotifications((prev) => [newNotification, ...prev]);
      fetchCounts();

      // Show toast for high-severity notifications
      if (payload.severity === 'critical' || payload.type === 'appointment') {
        // TODO: Trigger toast notification here
        console.log('High-priority notification:', payload);
      }
    };

    // Listen for group updates
    const handleGroupUpdate = (payload: any) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.grouped_key === payload.grouped_key
            ? { ...n, title: payload.latest_title, updated_at: payload.latest_created_at }
            : n
        )
      );
      fetchCounts();
    };

    // Listen for status changes
    const handleStatusChange = (payload: any) => {
      if (payload.notification_id === 'all') {
        // All marked as read
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, status: 'read' as const }))
        );
      } else {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === payload.notification_id
              ? { ...n, status: payload.status as 'read' | 'dismissed' }
              : n
          )
        );
      }

      setCounts((prev) =>
        prev ? { ...prev, unread: payload.unread_count || 0 } : null
      );
    };

    // TODO: Replace with your socket service's event listener methods
    // Example for Socket.IO:
    // socketService.on('notification:receive', handleNotificationReceive);
    // socketService.on('notification:group-update', handleGroupUpdate);
    // socketService.on('notification:status-change', handleStatusChange);

    // For now, using a placeholder - update based on your socket service
    if (socketService && typeof socketService.on === 'function') {
      socketService.on('notification:receive', handleNotificationReceive);
      socketService.on('notification:group-update', handleGroupUpdate);
      socketService.on('notification:status-change', handleStatusChange);
      socketListenersSet.current = true;
    }

    return () => {
      // Cleanup listeners
      if (socketService && typeof socketService.off === 'function') {
        socketService.off('notification:receive', handleNotificationReceive);
        socketService.off('notification:group-update', handleGroupUpdate);
        socketService.off('notification:status-change', handleStatusChange);
      }
      socketListenersSet.current = false;
    };
  }, [userId, fetchCounts]);

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = new Date(notification.created_at).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  return {
    notifications,
    groupedNotifications,
    counts,
    loading,
    error,
    hasMore,
    markAsRead,
    markAllAsRead,
    dismiss,
    dismissAll,
    loadMore,
    refresh: () => {
      setOffset(0);
      fetchNotifications(true);
      fetchCounts();
    },
  };
}

