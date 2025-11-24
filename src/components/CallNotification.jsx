import React, { useState, useEffect } from 'react';
import { Phone, X, Video, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * CallNotification Component
 * Displays incoming call notification popup for patients
 * Similar to Teams call notification with countdown timer
 */
const CallNotification = ({ callData, onAccept, onTimeout }) => {
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes in seconds
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleTimeout = () => {
    setIsVisible(false);
    if (onTimeout) {
      onTimeout(callData.callId);
    }
  };

  const handleAccept = () => {
    setIsVisible(false);
    if (onAccept) {
      onAccept(callData);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-96 border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-full animate-pulse">
                <Video className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">
                  {callData.doctorName || callData.doctor?.staff_name || callData.doctor?.name || 'Doctor'} started the call
                </h3>
                <p className="text-blue-100 text-sm">Medical Consultation</p>
              </div>
            </div>
          </div>

          {/* Doctor Info */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-full">
                <Phone className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-base">
                  {callData.doctorName || callData.doctor?.staff_name || callData.doctor?.name || 'Doctor'}
                </p>
                <p className="text-blue-100 text-sm">
                  {callData.reason || callData.appointment?.reason || 'Consultation'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Timer */}
          <div className="flex items-center justify-center gap-2 mb-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              Call expires in{' '}
              <span className="text-blue-600 dark:text-blue-400 font-bold">
                {formatTime(timeRemaining)}
              </span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 transition-all duration-1000 ease-linear"
                style={{ width: `${(timeRemaining / 120) * 100}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleAccept}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Video className="h-5 w-5" />
              Join Call
            </Button>
          </div>

          {/* Info Text */}
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
            The call will automatically expire if not answered
          </p>
        </div>
      </div>
    </div>
  );
};

export default CallNotification;
