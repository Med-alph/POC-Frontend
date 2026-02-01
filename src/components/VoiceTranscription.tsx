import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { io, Socket } from 'socket.io-client';
import { voiceProcessingSocketUrl } from '../constants/Constant';

interface VoiceTranscriptionProps {
  userId: string;
  appointmentId?: string;
  onTranscriptionComplete?: (fullText: string) => void;
  onError?: (error: string) => void;
  showTranscription?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  isRecording?: boolean;
  onToggleRecording?: () => void;
}

interface TranscriptionData {
  text: string;
  isFinal: boolean;
  timestamp?: number;
  end?: boolean;
  error?: string;
}

const VoiceTranscription = forwardRef<any, VoiceTranscriptionProps>(({
  userId,
  appointmentId,
  onTranscriptionComplete,
  onError,
  showTranscription = false,
  onStartRecording,
  onStopRecording,
  isRecording: externalIsRecording,
  onToggleRecording
}, ref) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(externalIsRecording || false);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const completionCalledRef = useRef<boolean>(false);
  const isStoppingRef = useRef<boolean>(false);
  const isErrorRef = useRef<boolean>(false);
  const fullTextRef = useRef<string>('');

  // Use voice processing socket URL from constants
  // It automatically handles ws:// for local and wss:// for production
  const SOCKET_URL = voiceProcessingSocketUrl;

  useImperativeHandle(ref, () => ({
    handleStartRecording,
    handleStopRecording: () => handleStopRecording(true),
    isConnected,
  }));

  // Sync internal state removed to prevent infinite loops / race conditions
  // The parent controls the recording via the useImperativeHandle ref methods

  useEffect(() => {
    // Build query params matching the required format
    // Format: { userId, appointmentId, sessionId (optional) }
    const queryParams: Record<string, string> = {
      userId,
    };

    // Always include appointmentId if provided
    if (appointmentId) {
      queryParams.appointmentId = appointmentId;
    }
    // sessionId is optional (not used in current implementation)

    // Log query params for debugging
    console.log('Socket connection query params:', queryParams);
    console.log('Socket URL:', SOCKET_URL);

    // Socket connection format: io('http://localhost:9009/voice-processing', { query: { userId, appointmentId } })
    const socket = io(SOCKET_URL, {
      query: queryParams,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      if (isRecording) {
        handleStopRecording();
      }
    });

    socket.on('connected', (data: { status: string; connectionId: string }) => {
      setConnectionId(data.connectionId);
    });

    socket.on('transcription', (data: TranscriptionData) => {
      if (data.text) {
        console.log(`📝 Transcription Received: "${data.text}" (isFinal: ${data.isFinal})`);
      }

      if (data.error) {
        setError(data.error);
        if (onError) {
          onError(data.error);
        }
        return;
      }

      if (data.text) {
        setFinalText((prev) => {
          const newText = prev ? `${prev} ${data.text}` : data.text;
          fullTextRef.current = newText;
          return newText;
        });
        setInterimText(''); // Clear interim since we've "finalized" this segment in the UI
      }

      if (data.end) {
        // Server signaled end of stream - just do cleanup, don't emit 'end' back
        handleStopRecording(false);
        if (onTranscriptionComplete && !completionCalledRef.current) {
          // Only trigger completion if we actually have some text
          if (fullTextRef.current.trim()) {
            completionCalledRef.current = true;
            onTranscriptionComplete(fullTextRef.current);
          }
        }
      }
    });

    socket.on('error', (data: { message: string }) => {
      const errorMsg = data.message || 'An error occurred';
      // Don't show error if we're intentionally stopping the recording
      if (isStoppingRef.current) {
        return;
      }
      isErrorRef.current = true;
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
      if (isRecording) {
        handleStopRecording();
      }
    });

    socket.on('ended', () => {
      // Server confirmed end - just do cleanup
      handleStopRecording(false);
      if (onTranscriptionComplete && !completionCalledRef.current) {
        // Only trigger completion if we actually have some text
        if (fullTextRef.current.trim()) {
          completionCalledRef.current = true;
          onTranscriptionComplete(fullTextRef.current);
        }
      }
    });

    socket.on('pong', (data: { timestamp: number; connectionActive: boolean }) => {
      if (!data.connectionActive && isRecording) {
        handleStopRecording();
      }
    });

    return () => {
      isStoppingRef.current = true;
      socket.disconnect();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [userId, appointmentId]);

  const convertAudioToBase64 = async (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleStartRecording = async () => {
    if (!isConnected || !socketRef.current) {
      setError('Socket not connected');
      return;
    }

    // Tell backend to prepare a new transcription session
    socketRef.current.emit('start');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 16000,
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0 && socketRef.current?.connected && !isErrorRef.current && !isStoppingRef.current) {
          try {
            const base64Audio = await convertAudioToBase64(event.data);
            console.log(`📤 Emitting Audio Chunk: ${event.data.size} bytes`);
            socketRef.current.emit('audio', { audio: base64Audio });
          } catch (err) {
            console.error('Error converting audio to base64:', err);
            isErrorRef.current = true;
            setError('Failed to process audio chunk');
          }
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording error occurred');
        handleStopRecording();
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setError(null);
      isErrorRef.current = false;
      setInterimText('');
      setFinalText('');
      fullTextRef.current = '';
      completionCalledRef.current = false;
      isStoppingRef.current = false;
      if (onStartRecording) {
        onStartRecording();
      }
    } catch (err: any) {
      let errorMsg = 'Failed to start recording';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Microphone permission denied';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'No microphone found';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    }
  };

  const handleStopRecording = (emitEnd = true) => {
    // Only stop if we are actually recording or a stop is not already in progress
    if (!isRecording && !isStoppingRef.current) return;

    console.log(`⏹️ Stopping recording (emitEnd: ${emitEnd})`);
    isStoppingRef.current = true;
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('Error stopping MediaRecorder:', err);
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => { });
      audioContextRef.current = null;
    }

    // Only emit 'end' if this was triggered by the user (not by the 'ended' server msg)
    if (emitEnd && socketRef.current?.connected) {
      socketRef.current.emit('end');
    }

    if (onStopRecording) {
      onStopRecording();
    }

    // Reset stopping flag after a delay to prevent immediate re-triggering
    setTimeout(() => {
      isStoppingRef.current = false;
    }, 1000);
  };


  const handleCopyTranscription = () => {
    const textToCopy = finalText || interimText;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        // Visual feedback could be added here
      }).catch((err) => {
        console.error('Failed to copy:', err);
        setError('Failed to copy transcription');
      });
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: isConnected ? '#10b981' : '#ef4444',
          }}
        />
        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {error && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', color: '#991b1b', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {onToggleRecording ? (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={onToggleRecording}
            disabled={!isConnected}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isRecording ? '#ef4444' : (isConnected ? '#3b82f6' : '#9ca3af'),
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: isConnected ? 'pointer' : 'not-allowed',
              fontWeight: '500',
              opacity: isConnected ? 1 : 0.6,
            }}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => isRecording ? handleStopRecording() : handleStartRecording()}
            disabled={!isConnected}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isRecording ? '#ef4444' : (isConnected ? '#3b82f6' : '#9ca3af'),
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: isConnected ? 'pointer' : 'not-allowed',
              fontWeight: '500',
              opacity: isConnected ? 1 : 0.6,
            }}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
        </div>
      )}

      {showTranscription && (
        <div style={{ marginTop: '1rem', minHeight: '200px', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
          {!finalText && !interimText ? (
            <p style={{ color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>No transcription yet</p>
          ) : (
            <div>
              {finalText && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <p style={{ color: '#374151', margin: 0, whiteSpace: 'pre-wrap' }}>{finalText}</p>
                </div>
              )}
              {interimText && (
                <div>
                  <p style={{ color: '#6b7280', fontStyle: 'italic', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {interimText}
                  </p>
                </div>
              )}
              {(finalText || interimText) && (
                <button
                  onClick={handleCopyTranscription}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6b7280',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  Copy
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

VoiceTranscription.displayName = 'VoiceTranscription';

export default VoiceTranscription;

