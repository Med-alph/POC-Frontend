import { io } from 'socket.io-client';
import { getAuthToken } from '../utils/auth';
import { socketUrl } from '../constants/Constant.js';

class SocketService {
  constructor() {
    this.socket = null;
    this.notificationsSocket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
  }

  /**
   * Connect to Socket.IO server
   * @param {number} userId - Current user's ID
   * @param {string} token - JWT authentication token
   */
  connect(userId, token = null) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    const authToken = token || getAuthToken();

    console.log('Connecting to Socket.IO server:', socketUrl);

    this.socket = io(socketUrl, {
      auth: {
        token: authToken,
        userId: userId
      },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });

    this._setupConnectionHandlers();
    return this.socket;
  }

  /**
   * Setup connection event handlers
   * @private
   */
  _setupConnectionHandlers() {
    this.socket.on('connect', () => {
      console.log('Socket.IO connected:', this.socket.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket.IO reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Socket.IO reconnection attempt:', attemptNumber);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket.IO reconnection failed');
    });
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect() {
    if (this.socket) {
      // Remove all listeners
      this.listeners.forEach((callback, event) => {
        this.socket.off(event, callback);
      });
      this.listeners.clear();

      this.socket.disconnect();
      this.socket = null;
      console.log('Socket.IO disconnected');
    }
  }

  /**
   * Check if socket is connected
   * @returns {boolean}
   */
  isConnected() {
    return this.socket?.connected || false;
  }

  /**
   * Register event listener
   * @private
   */
  _on(event, callback) {
    if (!this.socket) {
      console.error('Socket not connected. Call connect() first.');
      return;
    }
    this.socket.on(event, callback);
    this.listeners.set(event, callback);
  }

  /**
   * Remove event listener
   * @private
   */
  _off(event) {
    if (!this.socket) return;
    const callback = this.listeners.get(event);
    if (callback) {
      this.socket.off(event, callback);
      this.listeners.delete(event);
    }
  }

  /**
   * Emit event to server
   * @private
   */
  _emit(event, data) {
    if (!this.socket?.connected) {
      console.error('Socket not connected. Cannot emit event:', event);
      return Promise.reject(new Error('Socket not connected'));
    }
    
    console.log(`Emitting Socket.IO event: ${event}`, data);
    
    return new Promise((resolve, reject) => {
      // Set a timeout in case the server doesn't respond
      const timeout = setTimeout(() => {
        console.warn(`Socket.IO event ${event} timed out after 10 seconds`);
        resolve({ ok: true, timeout: true }); // Resolve anyway to not block the flow
      }, 10000);

      this.socket.emit(event, data, (response) => {
        clearTimeout(timeout);
        console.log(`Socket.IO event ${event} response:`, response);
        
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve(response || { ok: true });
        }
      });
    });
  }

  // ==================== DOCTOR EVENTS ====================

  /**
   * Doctor starts a video call
   * @param {number} appointmentId
   * @param {number} patientId
   * @param {string} roomName
   * @param {string} meetingUrl
   * @param {string} doctorName - Name of the doctor starting the call
   * @param {string} reason - Reason for the appointment/call
   */
  async startCall(appointmentId, patientId, roomName, meetingUrl, doctorName, reason) {
    return this._emit('doctor:start_call', {
      appointmentId,
      patientId,
      roomName,
      meetingUrl,
      doctorName,
      reason
    });
  }

  /**
   * Listen for call started confirmation (doctor side)
   * @param {Function} callback - (data) => void
   */
  onCallStarted(callback) {
    this._on('doctor:call_started', callback);
  }

  /**
   * Listen for call accepted by patient (doctor side)
   * @param {Function} callback - (data) => void
   */
  onCallAccepted(callback) {
    this._on('doctor:call_accepted', callback);
  }

  /**
   * Listen for call rejected by patient (doctor side)
   * @param {Function} callback - (data) => void
   */
  onCallRejected(callback) {
    this._on('doctor:call_rejected', callback);
  }

  /**
   * Remove doctor event listeners
   */
  offDoctorEvents() {
    this._off('doctor:call_started');
    this._off('doctor:call_accepted');
    this._off('doctor:call_rejected');
  }

  // ==================== PATIENT EVENTS ====================

  /**
   * Listen for incoming call (patient side)
   * @param {Function} callback - (data) => void
   */
  onIncomingCall(callback) {
    this._on('patient:incoming_call', callback);
  }

  /**
   * Patient accepts the call
   * @param {number} callId
   */
  async acceptCall(callId) {
    return this._emit('patient:accept_call', { callId });
  }

  /**
   * Patient rejects the call
   * @param {number} callId
   */
  async rejectCall(callId) {
    return this._emit('patient:reject_call', { callId });
  }

  /**
   * Remove patient event listeners
   */
  offPatientEvents() {
    this._off('patient:incoming_call');
  }

  // ==================== SHARED EVENTS ====================

  /**
   * End the call (either doctor or patient)
   * @param {number} callId
   */
  async endCall(callId) {
    return this._emit('call:end', { callId });
  }

  /**
   * Listen for call ended event
   * @param {Function} callback - (data) => void
   */
  onCallEnded(callback) {
    this._on('call:ended', callback);
  }

  /**
   * Remove call ended listener
   */
  offCallEnded() {
    this._off('call:ended');
  }

  /**
   * Remove all call-related event listeners
   */
  offAllCallEvents() {
    this.offDoctorEvents();
    this.offPatientEvents();
    this.offCallEnded();
  }

  // ==================== NOTIFICATION EVENTS ====================

  /**
   * Generic method to listen to any socket event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.socket) {
      console.error('Socket not connected. Call connect() first.');
      return;
    }
    this.socket.on(event, callback);
    // Track listener for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Generic method to remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Optional callback to remove specific listener
   */
  off(event, callback = null) {
    if (!this.socket) return;
    
    if (callback) {
      // Remove specific callback
      this.socket.off(event, callback);
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
        if (callbacks.length === 0) {
          this.listeners.delete(event);
        }
      }
    } else {
      // Remove all listeners for this event
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.forEach(cb => this.socket.off(event, cb));
      }
      this.listeners.delete(event);
    }
  }

  /**
   * Connect to notifications namespace
   * @param {number} userId - Current user's ID
   * @param {string} token - JWT authentication token
   */
  connectNotifications(userId, token = null) {
    if (this.notificationsSocket?.connected) {
      console.log('Notifications socket already connected');
      return this.notificationsSocket;
    }

    const authToken = token || getAuthToken();
    // Construct notifications namespace URL
    let notificationsUrl = socketUrl.replace(/\/$/, '');
    if (!notificationsUrl.endsWith('/notifications')) {
      notificationsUrl += '/notifications';
    }
    
    console.log('Connecting to Notifications namespace:', notificationsUrl);

    // Create a separate socket connection for notifications namespace
    if (!this.notificationsSocket) {
      this.notificationsSocket = io(notificationsUrl, {
        auth: {
          token: authToken,
          userId: userId
        },
        query: {
          userId: userId
        },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        transports: ['websocket', 'polling']
      });

      this.notificationsSocket.on('connect', () => {
        console.log('Notifications Socket.IO connected:', this.notificationsSocket.id);
      });

      this.notificationsSocket.on('disconnect', (reason) => {
        console.log('Notifications Socket.IO disconnected:', reason);
      });

      this.notificationsSocket.on('connect_error', (error) => {
        console.error('Notifications Socket.IO connection error:', error.message);
      });
    }

    return this.notificationsSocket;
  }

  /**
   * Get notifications socket instance
   * @returns {Socket|null}
   */
  getNotificationsSocket() {
    return this.notificationsSocket;
  }

  /**
   * Disconnect notifications socket
   */
  disconnectNotifications() {
    if (this.notificationsSocket) {
      this.notificationsSocket.disconnect();
      this.notificationsSocket = null;
      console.log('Notifications Socket.IO disconnected');
    }
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
