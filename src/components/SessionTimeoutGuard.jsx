import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, LogOut, RefreshCw } from 'lucide-react';
import { authAPI } from '../api/authapi';

// HIPAA Inactivity Constants (in milliseconds)
const WARNING_TIMEOUT = 13 * 60 * 1000; // 13 minutes
const LOGOUT_TIMEOUT = 15 * 60 * 1000; // 15 minutes total (2 minutes warning)

// // TEMP TESTING TIMEOUTS
// const WARNING_TIMEOUT = 10 * 1000;  // 10 seconds of idle
// const LOGOUT_TIMEOUT = 25 * 1000;   // 25 seconds total (15 seconds warning countdown)
export default function SessionTimeoutGuard() {
  const { isAuthenticated, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(120); // 2 minutes countdown
  
  const lastActivityRef = useRef(Date.now());
  const intervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Monitor interaction events to reset the inactivity timer
  useEffect(() => {
    if (!isAuthenticated) {
      cleanupTimers();
      setShowWarning(false);
      return;
    }

    const resetActivity = () => {
      // If warning is already showing, do not passively reset activity (requires explicit click)
      if (showWarning) return;
      lastActivityRef.current = Date.now();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'click', 'touchstart', 'mousemove'];
    events.forEach(event => window.addEventListener(event, resetActivity));

    // Periodic check interval (runs every 5 seconds to inspect inactive duration)
    intervalRef.current = setInterval(() => {
      const inactiveDuration = Date.now() - lastActivityRef.current;
      
      if (inactiveDuration >= WARNING_TIMEOUT && !showWarning) {
        setShowWarning(true);
        setCountdown(Math.ceil((LOGOUT_TIMEOUT - inactiveDuration) / 1000));
      }
    }, 5000);

    return () => {
      events.forEach(event => window.removeEventListener(event, resetActivity));
      cleanupTimers();
    };
  }, [isAuthenticated, showWarning]);

  // Manage the 120-second active warning countdown
  useEffect(() => {
    if (showWarning) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            clearInterval(intervalRef.current);
            // Inactivity limit reached - force logout with IDLE_TIMEOUT code
            logout(true, 'IDLE_TIMEOUT');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [showWarning, logout]);

  const cleanupTimers = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };

  // Explicit session extension (triggers API ping to rotate credentials & resets idle)
  const handleExtendSession = async () => {
    try {
      // Trigger silent token refresh to keep session alive on backend
      await authAPI.refreshToken();
      lastActivityRef.current = Date.now();
      setShowWarning(false);
    } catch (error) {
      console.error('[SessionTimeoutGuard] Failed to extend session:', error);
      // If refresh fails during extension, force logout
      logout(true, 'SESSION_REVOKED');
    }
  };

  // Force secure immediate logout
  const handleLogoutNow = () => {
    logout(true, 'SESSION_REVOKED');
  };

  if (!showWarning) return null;

  // Render a high-fidelity glassmorphic overlay modal
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Dynamic Glassmorphic Blur Overlay */}
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity duration-300"></div>

      {/* Premium Glass Card container */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl border border-amber-500/20 bg-white/90 p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 dark:border-amber-400/10 dark:bg-gray-950/90 text-center">
        {/* Animated Warning Icon Container */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30 animate-pulse">
          <ShieldAlert className="h-8 w-8 text-amber-500" />
        </div>

        {/* Headline */}
        <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
          Session Expiring Soon
        </h3>
        
        {/* Subtitle */}
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          For patient data safety, inactive sessions are automatically locked. You will be logged out in:
        </p>

        {/* Dynamic Countdown Circular Timer display */}
        <div className="mt-6 flex flex-col items-center">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-amber-500/20">
            <span className="text-3xl font-extrabold text-amber-500 tabular-nums">
              {countdown}
            </span>
            <span className="absolute bottom-2 text-[10px] uppercase tracking-wider font-semibold text-gray-400">
              seconds
            </span>
          </div>
        </div>

        {/* Buttons Action Area */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={handleLogoutNow}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <LogOut className="h-4 w-4" />
            Log Out Now
          </button>
          
          <button
            onClick={handleExtendSession}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-amber-500/10 transition-all hover:bg-amber-600 hover:shadow-amber-500/20 animate-bounce-subtle"
          >
            <RefreshCw className="h-4 w-4 animate-spin-slow" />
            Extend Session
          </button>
        </div>
      </div>
    </div>
  );
}
