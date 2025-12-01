import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import socketService from '@/services/socketService';
import { baseUrl } from '../constants/Constant';
import { getAuthToken } from '../utils/auth';

/**
 * Shared hook for chart data with HTTP + Socket.IO updates
 *
 * @param {string} endpoint - API endpoint path, e.g. '/charts/doctor/next-hours'
 * @param {Object} options
 * @param {string} [options.socketEvent='chart:update'] - Socket.IO event to listen for
 * @param {string|null} [options.socketRoom=null] - Optional room or key to filter updates
 * @param {number|null} [options.userId=null] - User ID for establishing socket connection when needed
 */
export function useChartData(endpoint, options = {}) {
  const {
    socketEvent = 'chart:update',
    socketRoom = null,
    userId = null,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasConnectedSocketRef = useRef(false);

  useEffect(() => {
    if (!endpoint) return;

    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = getAuthToken();
        const url = endpoint.startsWith('http')
          ? endpoint
          : `${baseUrl}${endpoint}`;

        const response = await axios.get(url, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!isMounted) return;
        setData(response.data || null);
      } catch (err) {
        if (!isMounted) return;
        console.error('useChartData fetch error:', err);
        setError(err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [endpoint]);

  useEffect(() => {
    // Optional real-time updates via Socket.IO
    if (!socketEvent) return;

    // Ensure socket connection exists
    if (!hasConnectedSocketRef.current && userId) {
      socketService.connect(userId);
      hasConnectedSocketRef.current = true;
    }

    const eventName = socketEvent;

    const handleUpdate = (payload) => {
      // Optional filtering by room / key
      if (socketRoom && payload?.room !== socketRoom && payload?.key !== socketRoom) {
        return;
      }

      // Payload may directly contain chart data or diff; here we assume full replacement
      // and fall back to re-fetch if payload has a `refresh` flag.
      if (payload?.refresh) {
        // Trigger re-fetch by temporarily toggling loading and letting the HTTP effect re-run
        // The simplest is just to call fetch again via a small helper API: for now,
        // we optimistically set data if available.
        if (payload.data) {
          setData(payload.data);
        }
      } else if (payload?.data !== undefined) {
        setData(payload.data);
      } else {
        // If server emits plain chart data without wrapping
        setData(payload);
      }
    };

    // Directly subscribe via underlying socket instance
    if (!socketService.socket) {
      // If no explicit userId, connect anonymously with dummy ID
      socketService.connect(userId || 0);
      hasConnectedSocketRef.current = true;
    }

    socketService._on(eventName, handleUpdate);

    return () => {
      socketService._off(eventName);
    };
  }, [socketEvent, socketRoom, userId]);

  return { data, loading, error };
}


