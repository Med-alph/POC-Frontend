import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { baseUrl } from '../constants/Constant';
import toast from 'react-hot-toast';

const SOCKET_SERVER_URL = baseUrl;

function useAdminNotifications(adminUserId, hospitalId) {
  const [notifications, setNotifications] = useState([]);

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
      
      setNotifications((prev) => [structuredNotification, ...prev]);
      
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
      
      setNotifications((prev) => [structuredNotification, ...prev]);
      
      // Show toast notification with doctor name and leave type
      const doctorName = payload.doctorName || 'A doctor';
      const leaveType = payload.leaveType || 'leave';
      toast.success(`${doctorName} requested ${leaveType} leave`, {
        duration: 5000,
        icon: '🏖️',
      });
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
