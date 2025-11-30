/**
 * NotificationToast Component
 * 
 * Toast notification component for displaying high-priority notifications.
 * Shows for critical severity or immediate appointment events.
 * 
 * Usage:
 *   <NotificationToast notification={notification} onClose={handleClose} />
 */

import { useEffect } from 'react';
import { X, Bell, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Notification } from '../../api/notifications';
import { Button } from '../ui/button';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  onAction?: () => void;
  autoClose?: number; // Auto-close after milliseconds (default: 5000)
}

export default function NotificationToast({
  notification,
  onClose,
  onAction,
  autoClose = 5000,
}: NotificationToastProps) {
  useEffect(() => {
    if (autoClose > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoClose);

      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const getSeverityIcon = (severity: Notification['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getSeverityBg = (severity: Notification['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 w-full max-w-sm p-4 rounded-lg border shadow-lg ${getSeverityBg(
        notification.severity
      )}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getSeverityIcon(notification.severity)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              {notification.title}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            {notification.body}
          </p>
          {onAction && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onAction();
                onClose();
              }}
              className="mt-2"
            >
              View Details
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

