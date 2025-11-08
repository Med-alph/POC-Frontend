import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { baseUrl } from '../constants/Constant';

const SOCKET_SERVER_URL = baseUrl; // Replace with your backend URL

function useAdminNotifications(adminUserId) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!adminUserId) return;

    const socket = io(`${SOCKET_SERVER_URL}/notifications`, {
      query: { userId: adminUserId },
    });

    socket.on('appointmentCancellationRequested', (payload) => {
      console.log('New cancellation request notification', payload);
      setNotifications((prev) => [payload, ...prev]);
      // Optionally, trigger UI toast or sound notification here
    });

    // Optional: listen to cancellation review and other events here too

    return () => {
      socket.disconnect();
    };
  }, [adminUserId]);

  return notifications;
}

export default useAdminNotifications;
