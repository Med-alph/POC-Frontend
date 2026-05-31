/**
 * PatientSessionGuard
 *
 * Lightweight idle timeout for the patient portal.
 * Simpler than the staff SessionTimeoutGuard — no warning modal,
 * just a clean redirect to /landing with a reason message after
 * 30 minutes of inactivity.
 *
 * Why different from staff guard:
 * - Patients have shorter, task-focused sessions (5–30 min)
 * - No refresh token to silently extend — re-OTP is the recovery path
 * - Shared/family devices make idle logout more important, not less
 * - No complex warning countdown needed — just redirect cleanly
 */

import { useEffect, useRef } from 'react';
import { clearAuthData } from '../utils/auth';
import { clearSecureStorage } from '../utils/secureStorage';

// 30 minutes of inactivity → redirect to landing
const PATIENT_IDLE_TIMEOUT = 30 * 60 * 1000;
// const PATIENT_IDLE_TIMEOUT = 10 * 1000;

export default function PatientSessionGuard() {
  const lastActivityRef = useRef(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    // Only run if patient is authenticated
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuth) return;

    const resetActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetActivity, { passive: true }));

    // Check idle duration every minute
    timerRef.current = setInterval(() => {
      const idleDuration = Date.now() - lastActivityRef.current;

      if (idleDuration >= PATIENT_IDLE_TIMEOUT) {
        clearInterval(timerRef.current);

        // Clean up auth state
        clearAuthData();
        clearSecureStorage();
        localStorage.removeItem('isAuthenticated');
        sessionStorage.clear();

        // Redirect to landing with reason
        window.location.href = '/landing?reason=IDLE_TIMEOUT';
      }
    }, 60 * 1000); // check every 60 seconds

    return () => {
      events.forEach(e => window.removeEventListener(e, resetActivity));
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Renders nothing — purely behavioral
  return null;
}
