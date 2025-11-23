/**
 * Generate a unique and unpredictable room name for Jitsi meetings
 * Format: medportal-{appointmentId}-{timestamp}-{randomString}
 * 
 * @param {number} appointmentId - The appointment ID
 * @returns {string} Unique room name
 */
export const generateRoomName = (appointmentId) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  return `medportal-${appointmentId}-${timestamp}-${randomString}`;
};

/**
 * Generate Jitsi meeting URL
 * 
 * @param {string} roomName - The room name
 * @param {string} displayName - User's display name
 * @param {string} domain - Jitsi domain (default: meet.jit.si)
 * @returns {string} Complete Jitsi meeting URL
 */
export const generateMeetingUrl = (roomName, displayName = '', domain = null) => {
  const jitsiDomain = domain || import.meta.env.VITE_JITSI_DOMAIN || 'meet.jit.si';
  const encodedName = encodeURIComponent(displayName);
  
  return `https://${jitsiDomain}/${roomName}#userInfo.displayName="${encodedName}"&config.disableDeepLinking=true`;
};

/**
 * Format call duration in minutes and seconds
 * 
 * @param {Date|string} startTime - Call start time
 * @param {Date|string} endTime - Call end time (optional, defaults to now)
 * @returns {string} Formatted duration (e.g., "5m 30s")
 */
export const formatCallDuration = (startTime, endTime = null) => {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const durationMs = end - start;
  
  if (durationMs < 0) return '0s';
  
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
};

/**
 * Get call status display text and color
 * 
 * @param {string} status - Call status
 * @returns {Object} { text, color }
 */
export const getCallStatusDisplay = (status) => {
  const statusMap = {
    pending: { text: 'Calling...', color: 'text-yellow-600' },
    ringing: { text: 'Ringing', color: 'text-blue-600' },
    active: { text: 'Active', color: 'text-green-600' },
    rejected: { text: 'Rejected', color: 'text-red-600' },
    ended: { text: 'Ended', color: 'text-gray-600' },
    missed: { text: 'Missed', color: 'text-orange-600' },
  };
  
  return statusMap[status] || { text: 'Unknown', color: 'text-gray-600' };
};
