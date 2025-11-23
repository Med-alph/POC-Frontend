import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import socketService from '@/services/socketService';
import { CheckCircle, XCircle, Wifi, WifiOff } from 'lucide-react';

/**
 * Socket.IO Debugger Component
 * Use this to test Socket.IO connection and events
 */
const SocketIODebugger = ({ userId, userType = 'patient' }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (userId) {
      console.log('SocketIODebugger: Connecting with userId:', userId);
      socketService.connect(userId);

      // Check connection status
      const checkConnection = setInterval(() => {
        setIsConnected(socketService.isConnected());
      }, 1000);

      // Listen for incoming call events (patient)
      if (userType === 'patient') {
        socketService.onIncomingCall((data) => {
          addEvent('incoming_call', data);
        });
      }

      // Listen for call status events (doctor)
      if (userType === 'doctor') {
        socketService.onCallStarted((data) => {
          addEvent('call_started', data);
        });
        socketService.onCallAccepted((data) => {
          addEvent('call_accepted', data);
        });
        socketService.onCallRejected((data) => {
          addEvent('call_rejected', data);
        });
      }

      // Listen for call ended (both)
      socketService.onCallEnded((data) => {
        addEvent('call_ended', data);
      });

      return () => {
        clearInterval(checkConnection);
      };
    }
  }, [userId, userType]);

  const addEvent = (eventName, data) => {
    const timestamp = new Date().toLocaleTimeString();
    setEvents((prev) => [
      { timestamp, eventName, data },
      ...prev.slice(0, 9), // Keep last 10 events
    ]);
  };

  const sendTestEvent = async () => {
    if (!testMessage) return;

    try {
      const result = await socketService._emit('test_event', {
        message: testMessage,
        userId,
        userType,
      });
      addEvent('test_event_sent', result);
      setTestMessage('');
    } catch (error) {
      addEvent('test_event_error', { error: error.message });
    }
  };

  return (
    <Card className="border-2 border-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Socket.IO Debugger</span>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="h-5 w-5 text-green-600" />
                <span className="text-sm font-normal text-green-600">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-600" />
                <span className="text-sm font-normal text-red-600">Disconnected</span>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Info */}
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">User ID:</span>
            <span className="font-mono">{userId || 'Not set'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">User Type:</span>
            <span className="font-mono">{userType}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Socket URL:</span>
            <span className="font-mono text-xs">
              {import.meta.env.VITE_SOCKET_URL || 'Not configured'}
            </span>
          </div>
        </div>

        {/* Test Event Sender */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Send Test Event</label>
          <div className="flex gap-2">
            <Input
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Test message..."
              disabled={!isConnected}
            />
            <Button onClick={sendTestEvent} disabled={!isConnected || !testMessage}>
              Send
            </Button>
          </div>
        </div>

        {/* Events Log */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Events Log (Last 10)</label>
          <div className="bg-gray-900 text-green-400 p-3 rounded-lg h-64 overflow-y-auto font-mono text-xs">
            {events.length === 0 ? (
              <div className="text-gray-500">No events yet...</div>
            ) : (
              events.map((event, index) => (
                <div key={index} className="mb-2 border-b border-gray-700 pb-2">
                  <div className="text-yellow-400">
                    [{event.timestamp}] {event.eventName}
                  </div>
                  <div className="text-gray-400 pl-4">
                    {JSON.stringify(event.data, null, 2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              socketService.disconnect();
              setIsConnected(false);
            }}
          >
            Disconnect
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              socketService.connect(userId);
            }}
          >
            Reconnect
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEvents([])}
          >
            Clear Log
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SocketIODebugger;
