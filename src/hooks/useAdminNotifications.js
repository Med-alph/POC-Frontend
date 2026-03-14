import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { baseUrl, socketUrl } from '../constants/Constant';
import toast from 'react-hot-toast';
import notificationAPI from '../api/notificationapi';
import socketService from '../services/socketService';
import { getAuthToken } from '../utils/auth';

const SOCKET_SERVER_URL = socketUrl;

function useAdminNotifications(adminUserId, hospitalId) {
  const [notifications, setNotifications] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch historical notifications on mount
  useEffect(() => {
    if (!adminUserId) return;

    fetchHistoricalNotifications();
  }, [adminUserId, hospitalId]);

  const fetchHistoricalNotifications = async () => {
    setIsLoadingHistory(true);
    try {
      console.log('📥 Fetching historical notifications...');
      const response = await notificationAPI.list({ limit: 50, filter: 'unread' });
      
      if (response && response.notifications) {
        const historicalNotifs = response.notifications.map(normalizeNotification);
        console.log('✅ Loaded historical notifications:', historicalNotifs.length);
        setNotifications(historicalNotifs);
      }
    } catch (error) {
      console.error('❌ Error fetching historical notifications:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const normalizeNotification = (notif) => {
    if (!notif) return null;
    
    const type = (notif.notification_type || notif.type || 'INFO').toUpperCase();
    const id = notif.id || notif.notification_id || notif.notificationId;
    
    return {
      ...notif,
      type: type,
      notification_type: type,
      notificationId: id,
      id: id,
      createdAt: notif.created_at || notif.createdAt || new Date().toISOString(),
      message: notif.body || notif.summary || notif.message || notif.title || 'New notification',
      status: notif.status || 'unread'
    };
  };

  const refreshHistory = async () => {
    await fetchHistoricalNotifications();
  };

  useEffect(() => {
    console.log('🧪 [useAdminNotifications] Effect starting...', { adminUserId, hospitalId });
    
    if (!adminUserId || !hospitalId) {
      console.log('⚠️ [useAdminNotifications] Missing ID, returning early');
      return;
    }

    const socket = socketService.connectNotifications(adminUserId);

    if (!socket) {
      console.error('❌ [useAdminNotifications] Failed to get socket from service');
      return;
    }

    const setupSocketListeners = (s) => {
      // Catch-all debugger for ANY incoming event
      s.onAny((eventName, ...args) => {
        console.log(`🔌 [SOCKET DEBUG] Received any event: "${eventName}"`, args);
      });

      // Common notification events
      const notificationEvents = [
        'notification:receive',
        'notification',
        'new_notification',
        'app_notification',
        'appointmentCancellationRequested',
        'leaveRequestSubmitted'
      ];

      notificationEvents.forEach(eventName => {
        s.on(eventName, (payload) => {
          console.log(`🔔 Notifications Listener! Event [${eventName}] received:`, payload);
          
          let type = eventName === 'appointmentCancellationRequested' ? 'CANCELLATION_REQUEST' :
                     eventName === 'leaveRequestSubmitted' ? 'LEAVE_REQUEST' :
                     null;

          const structuredNotification = normalizeNotification({
            ...payload,
            ...(type && { type, notification_type: type })
          });

          setNotifications((prev) => {
            const exists = prev.some(n => n.notificationId === structuredNotification.notificationId);
            if (exists) return prev;
            return [structuredNotification, ...prev];
          });

          // Show toast
          const message = structuredNotification.message || 'New notification received';
          const icon = type === 'LEAVE_REQUEST' ? '🏖️' : 
                       type === 'CANCELLATION_REQUEST' ? '📋' : '🔔';
          
          toast(message, { duration: 4000, icon });
        });
      });

      // Status change listener
      s.on('notification:status-change', (payload) => {
        console.log('🔄 Notification status change:', payload);
        refreshHistory();
        
        setNotifications((prev) =>
          prev.map((n) => {
            const isMatch = (n.notificationId === payload.notification_id) || (n.id === payload.notification_id);
            if (isMatch) return { ...n, status: payload.status };
            return n;
          })
        );
      });
    };

    const handleConnect = () => {
      console.log('🟢 [useAdminNotifications] Socket session started:', socket.id);
      
      const userIdStr = String(adminUserId);
      const userRoom = `user_${userIdStr}`;
      
      console.log(`🚪 [useAdminNotifications] Attempting to join user room: ${userRoom}`);
      socket.emit('joinRoom', userRoom, (response) => {
        console.log(`✅ [useAdminNotifications] Server acknowledged joinRoom (${userRoom}):`, response);
      });
      
      if (hospitalId) {
        const hospitalRoom = `hospital_${hospitalId}_admins`;
        console.log(`🚪 [useAdminNotifications] Attempting to join hospital room: ${hospitalRoom}`);
        socket.emit('joinRoom', hospitalRoom, (response) => {
          console.log(`✅ [useAdminNotifications] Server acknowledged joinRoom (${hospitalRoom}):`, response);
        });
      }
    };

    // Remove existing listeners to avoid duplicates if service is sharing the socket
    socket.off('connect');
    socket.off('reconnect');
    socket.off('notification:receive');
    socket.off('notification');
    socket.off('new_notification');
    socket.off('app_notification');
    socket.off('notification:status-change');
    socket.off('appointmentCancellationRequested');
    socket.off('leaveRequestSubmitted');

    socket.on('connect', handleConnect);
    socket.on('reconnect', handleConnect);
    
    // Setup listeners
    setupSocketListeners(socket);

    // Initial manual trigger if already connected
    if (socket.connected) {
      console.log('🔍 [useAdminNotifications] Socket already connected, joining rooms now');
      handleConnect();
    }

    // Status check interval
    const intervalId = setInterval(() => {
      console.log('📡 [useAdminNotifications] Heartbeat - Socket Connected:', socket.connected, socket.id);
    }, 30000);

    return () => {
      console.log('🧹 [useAdminNotifications] Cleaning up effect listeners');
      clearInterval(intervalId);
      socket.offAny();
      socket.off('connect', handleConnect);
      socket.off('reconnect', handleConnect);
      socket.off('notification:receive');
      socket.off('notification');
      socket.off('new_notification');
      socket.off('app_notification');
      socket.off('notification:status-change');
      socket.off('appointmentCancellationRequested');
      socket.off('leaveRequestSubmitted');
    };
  }, [adminUserId, hospitalId]);

  return { notifications, refreshHistory };
}

export default useAdminNotifications;
