/**
 * Active Sessions Component
 * 
 * Displays all active sessions for the current user with:
 * - Device information
 * - Browser information
 * - IP address
 * - Last active time
 * - Current session indicator
 * 
 * Allows user to:
 * - View all active sessions
 * - Logout current session
 * - Logout other sessions
 * 
 * Available for all roles in profile dropdown
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { sessionAPI } from '../api/sessionapi';
import { useToast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Monitor, Globe, MapPin, Clock, LogOut, AlertCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * Format device name from user agent
 */
const getDeviceName = (userAgent) => {
  if (!userAgent) return 'Unknown Device';
  
  if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
    if (/iPhone/i.test(userAgent)) return 'iPhone';
    if (/iPad/i.test(userAgent)) return 'iPad';
    if (/Android/i.test(userAgent)) return 'Android Device';
    return 'Mobile Device';
  }
  
  if (/Windows/i.test(userAgent)) return 'Windows PC';
  if (/Mac/i.test(userAgent)) return 'Mac';
  if (/Linux/i.test(userAgent)) return 'Linux PC';
  
  return 'Desktop';
};

/**
 * Format browser name from user agent
 */
const getBrowserName = (userAgent) => {
  if (!userAgent) return 'Unknown Browser';
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
  
  return 'Unknown Browser';
};

/**
 * Format last active time
 */
const formatLastActive = (lastActive) => {
  if (!lastActive) return 'Never';
  
  try {
    const date = new Date(lastActive);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Unknown';
  }
};

export default function ActiveSessions({ trigger, open: controlledOpen, onOpenChange }) {
  const { getCurrentSessionId, logout } = useAuth();
  const { addToast: toast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const currentSessionId = getCurrentSessionId();
  
  // Use controlled open if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  /**
   * Fetch active sessions
   */
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await sessionAPI.getActiveSessions();
      
      // Mark current session
      const sessionsWithCurrent = data.map(session => ({
        ...session,
        is_current: session.session_id === currentSessionId,
      }));
      
      setSessions(sessionsWithCurrent);
    } catch (error) {
      console.error('[ActiveSessions] Failed to fetch sessions:', error);
      toast({
        title: 'Failed to load sessions',
        description: error.message || 'Could not retrieve active sessions.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Revoke a specific session
   */
  const handleRevokeSession = async (sessionIdToRevoke, isCurrentSession = false) => {
    try {
      setRevoking(sessionIdToRevoke);
      
      if (isCurrentSession) {
        // If revoking current session, logout
        await logout(true);
        toast({
          title: 'Session ended',
          description: 'You have been logged out.',
        });
      } else {
        // Revoke other session
        await sessionAPI.revokeSession(sessionIdToRevoke);
        toast({
          title: 'Session revoked',
          description: 'The selected session has been ended.',
        });
        // Refresh sessions list
        await fetchSessions();
      }
    } catch (error) {
      console.error('[ActiveSessions] Failed to revoke session:', error);
      toast({
        title: 'Failed to revoke session',
        description: error.message || 'Could not end the session.',
        variant: 'destructive',
      });
    } finally {
      setRevoking(null);
    }
  };

  /**
   * Revoke all other sessions
   */
  const handleRevokeAllOthers = async () => {
    try {
      setRevoking('all-others');
      await sessionAPI.revokeAllOtherSessions();
      toast({
        title: 'Sessions ended',
        description: 'All other sessions have been ended.',
      });
      // Refresh sessions list
      await fetchSessions();
    } catch (error) {
      console.error('[ActiveSessions] Failed to revoke other sessions:', error);
      toast({
        title: 'Failed to end sessions',
        description: error.message || 'Could not end other sessions.',
        variant: 'destructive',
      });
    } finally {
      setRevoking(null);
    }
  };

  /**
   * Fetch sessions when dialog opens
   */
  useEffect(() => {
    if (open) {
      fetchSessions();
    }
  }, [open]);

  /**
   * Auto-refresh sessions every 30 seconds when dialog is open
   */
  useEffect(() => {
    if (!open) return;
    
    const interval = setInterval(() => {
      fetchSessions();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [open]);

  const otherSessions = sessions.filter(s => !s.is_current);
  const hasOtherSessions = otherSessions.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Active Sessions
          </DialogTitle>
          <DialogDescription>
            Manage your active sessions across different devices and browsers.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading sessions...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No active sessions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.session_id}
                  className={`border rounded-lg p-4 ${
                    session.is_current
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Monitor className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-sm">
                          {getDeviceName(session.user_agent || session.device)}
                        </span>
                        {session.is_current && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded">
                            Current
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5" />
                          <span>{getBrowserName(session.user_agent || session.browser)}</span>
                        </div>

                        {session.ip_address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{session.ip_address}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Last active: {formatLastActive(session.last_active_at || session.last_active)}</span>
                        </div>

                        {session.created_at && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            Started: {new Date(session.created_at).toLocaleString()}
                          </div>
                        )}
                        {session.platform && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            Platform: {session.platform}
                          </div>
                        )}
                        {session.expires_at && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            Expires: {new Date(session.expires_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeSession(session.session_id, session.is_current)}
                      disabled={revoking === session.session_id}
                      className="ml-4 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      {revoking === session.session_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {hasOtherSessions && (
          <div className="border-t pt-4 mt-4">
            <Button
              variant="outline"
              onClick={handleRevokeAllOthers}
              disabled={revoking === 'all-others'}
              className="w-full"
            >
              {revoking === 'all-others' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ending sessions...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  End All Other Sessions
                </>
              )}
            </Button>
          </div>
        )}

        <div className="border-t pt-4 mt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            If you notice any suspicious activity, end all sessions and change your password.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

