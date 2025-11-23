import React, { useEffect, useRef } from 'react';
import { X, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * JitsiMeeting Component
 * Renders Jitsi video conference iframe with custom controls
 */
const JitsiMeeting = ({ roomName, displayName, onClose, onCallEnd, callId }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      console.log('JitsiMeeting component unmounted');
    };
  }, []);

  const handleEndCall = () => {
    console.log('Ending call:', callId);
    if (onCallEnd) {
      onCallEnd(callId);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // Generate Jitsi meeting URL
  const jitsiDomain = import.meta.env.VITE_JITSI_DOMAIN || 'meet.jit.si';
  const meetingUrl = `https://${jitsiDomain}/${roomName}#userInfo.displayName="${encodeURIComponent(
    displayName
  )}"&interfaceConfigOverwrite={"TOOLBAR_BUTTONS":["microphone","camera","chat","hangup","fullscreen","fodeviceselection","profile","raisehand","tileview"]}&config.disableDeepLinking=true`;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top Control Bar */}
      <div className="absolute top-0 left-0 right-0 z-60 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 px-3 py-1 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">Live</span>
          </div>
          <span className="text-white text-sm font-medium">{displayName}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleEndCall}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-200"
          >
            <PhoneOff className="h-4 w-4" />
            End Call
          </Button>
          <button
            onClick={handleClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all duration-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Jitsi Iframe */}
      <iframe
        ref={iframeRef}
        src={meetingUrl}
        allow="camera; microphone; fullscreen; display-capture"
        style={{ width: '100%', height: '100%', border: 'none' }}
        frameBorder="0"
        allowFullScreen
        title="Jitsi Meeting"
      />
    </div>
  );
};

export default JitsiMeeting;
