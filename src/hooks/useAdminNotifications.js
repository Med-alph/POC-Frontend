import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { baseUrl } from '../constants/Constant';
import toast from 'react-hot-toast';
import notificationAPI from '../api/notificationapi';
import { getAuthToken } from '../utils/auth';

const SOCKET_SERVER_URL = baseUrl;

function useAdminNotifications(adminUserId, hospitalId) {
  const [notifications, setNotifications] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch historical notifications on mount
  useEffect(() => {
    if (!adminUserId) {
      console.log('❌ No userId provided for fetching notifications');
      return;
    }

    const fetchHistoricalNotifications = async () => {
      setIsLoadingHistory(true);
      try {
        console.log('📥 Fetching historical notifications for user:', adminUserId);
        
        // Use the base URL with auth token (backend will identify user from token)
        const token = getAuthToken();
        
        if (!token) {
          console.warn('⚠️ No auth token found, skipping historical fetch');
          return;
        }
        
        console.log('🔑 Using auth token:', token.substring(0, 20) + '...');
        
        const response = await fetch(`${baseUrl}/notifications?limit=50&filter=unread`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📡 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Response error:', errorText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📦 Response data:', data);
        
        if (data.notifications) {
          // Normalize the historical notifications
          const historicalNotifs = data.notifications.map(notif => ({
            ...notif,
            type: notif.notification_type?.toUpperCase() || notif.type?.toUpperCase(),
            notification_type: notif.notification_type?.toUpperCase() || notif.type?.toUpperCase(),
            notificationId: notif.id || notif.notificationId,
            createdAt: notif.created_at || notif.createdAt,
            message: notif.body || notif.message || notif.title,
          }));
          
          console.log('✅ Loaded historical notifications:', historicalNotifs.length);
          setNotifications(historicalNotifs);
        }
      } catch (error) {
        console.error('❌ Error fetching historical notifications:', error);
        // Don't show error to user, just log it - notifications will come via socket
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistoricalNotifications();
  }, [adminUserId]);

  useEffect(() => {
    // Don't connect if no adminUserId or hospitalId provided
    if (!adminUserId || !hospitalId) {
      console.log('❌ useAdminNotifications: No adminUserId or hospitalId provided', {
        adminUserId,
        hospitalId
      });
      return;
    }

    console.log('🔌 Connecting to notifications socket...', {
      url: `${SOCKET_SERVER_URL}/notifications`,
      userId: adminUserId,
      hospitalId: hospitalId
    });

    const socket = io(`${SOCKET_SERVER_URL}/notifications`, {
      query: { 
        userId: adminUserId,
        hospitalId: hospitalId 
      },
      transports: ['websocket', 'polling']
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      console.log('🏥 Hospital ID:', hospitalId);
      
      // Join hospital admin room if hospitalId is provided
      if (hospitalId) {
        const roomName = `hospital_${hospitalId}_admins`;
        console.log('🚪 Attempting to join room:', roomName);
        socket.emit('joinRoom', roomName);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    socket.on('roomJoined', (data) => {
      console.log('✅ Successfully joined room:', data);
    });

    // Listen for appointment cancellation requests
    socket.on('appointmentCancellationRequested', (payload) => {
      console.log('📋 New cancellation request notification', payload);
      
      // Structure the notification properly for display
      const structuredNotification = {
        ...payload,
        type: 'cancellation_request',
        notification_type: 'CANCELLATION_REQUEST',
        status: 'unread',
        createdAt: payload.createdAt || new Date().toISOString(),
        // Use the id from payload as notificationId (this is the actual DB notification id)
        notificationId: payload.id || payload.notificationId,
      };
      
      // Avoid duplicates - check if notification already exists
      setNotifications((prev) => {
        const exists = prev.some(n => 
          (n.notificationId && n.notificationId === structuredNotification.notificationId) ||
          (n.id && n.id === structuredNotification.notificationId)
        );
        if (exists) {
          console.log('⚠️ Duplicate notification, skipping:', structuredNotification.notificationId);
          return prev;
        }
        return [structuredNotification, ...prev];
      });
      
      // Show toast notification
      toast.success('New appointment cancellation request', {
        duration: 4000,
        icon: '📋',
      });
    });

    // Listen for leave request submissions
    socket.on('leaveRequestSubmitted', (payload) => {
      console.log('🏖️ New leave request notification received!', payload);
      console.log('🔍 Payload keys:', Object.keys(payload));
      console.log('🔍 notificationId:', payload.notificationId);
      console.log('🔍 id:', payload.id);
      
      // Structure the notification properly for display
      // Backend sends the actual notification DB id, not the leave_request_id
      const structuredNotification = {
        ...payload,
        type: 'leave_request',
        notification_type: 'LEAVE_REQUEST',
        status: 'unread',
        createdAt: payload.createdAt || new Date().toISOString(),
        // Use the id from payload as notificationId (this is the actual DB notification id)
        notificationId: payload.id || payload.notificationId,
      };
      
      console.log('📦 Structured notification:', structuredNotification);
      
      // Avoid duplicates - check if notification already exists
      setNotifications((prev) => {
        const exists = prev.some(n => 
          (n.notificationId && n.notificationId === structuredNotification.notificationId) ||
          (n.id && n.id === structuredNotification.notificationId)
        );
        if (exists) {
          console.log('⚠️ Duplicate notification, skipping:', structuredNotification.notificationId);
          return prev;
        }
        return [structuredNotification, ...prev];
      });
      
      // Show toast notification with doctor name and leave type
      const doctorName = payload.doctorName || 'A doctor';
      const leaveType = payload.leaveType || 'leave';
      toast.success(`${doctorName} requested ${leaveType} leave`, {
        duration: 5000,
        icon: '🏖️',
      });
    });

    // Listen for image upload notifications
    socket.on('new_notification', (payload) => {
      console.log('📸 New notification received (image/session)', payload);
      
      // Structure the notification properly for display
      const structuredNotification = {
        ...payload,
        // Normalize the type to uppercase for consistency
        type: payload.type?.toUpperCase() || payload.notification_type,
        notification_type: payload.type?.toUpperCase() || payload.notification_type,
        status: 'unread',
        createdAt: payload.created_at || payload.createdAt || new Date().toISOString(),
        message: payload.body || payload.message || payload.title,
        notificationId: payload.id || payload.notificationId,
      };
      
      // Avoid duplicates - check if notification already exists
      setNotifications((prev) => {
        const exists = prev.some(n => 
          (n.notificationId && n.notificationId === structuredNotification.notificationId) ||
          (n.id && n.id === structuredNotification.notificationId)
        );
        if (exists) {
          console.log('⚠️ Duplicate notification, skipping:', structuredNotification.notificationId);
          return prev;
        }
        return [structuredNotification, ...prev];
      });
      
      // Show toast notification based on type
      const isImageUpload = payload.type === 'image_uploaded' || payload.type === 'IMAGE_UPLOADED';
      const isSessionReview = payload.type === 'session_reviewed' || payload.type === 'SESSION_REVIEWED';
      
      if (isImageUpload) {
        toast.info(payload.body || payload.message, {
          duration: 5000,
          icon: '📸',
        });
      } else if (isSessionReview) {
        toast.info(payload.body || payload.message, {
          duration: 5000,
          icon: '✅',
        });
      }
    });

    // Optional: Listen for other notification events
    socket.on('notification', (payload) => {
      console.log('🔔 Generic notification received', payload);
      setNotifications((prev) => [payload, ...prev]);
    });

    // Debug: Listen to all events
    socket.onAny((eventName, ...args) => {
      console.log('📡 Socket event received:', eventName, args);
    });

    return () => {
      console.log('🔌 Disconnecting socket...');
      socket.disconnect();
    };
  }, [adminUserId, hospitalId]);

  return notifications;
}

export default useAdminNotifications;
