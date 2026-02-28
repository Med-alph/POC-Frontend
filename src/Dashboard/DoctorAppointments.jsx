import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { CalendarDays, User, X, Clock, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import toast from "react-hot-toast";
import JitsiMeeting from "@/components/JitsiMeeting";
import socketService from "@/services/socketService";
import { videoCallAPI } from "@/api/videocallapi";
import { generateRoomName, generateMeetingUrl } from "@/utils/callUtils";

const DoctorAppointments = ({ appointments, loading, doctorName }) => {
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showCall, setShowCall] = useState(false);
  const [activeCallId, setActiveCallId] = useState(null);
  const [activeRoomName, setActiveRoomName] = useState(null); // Store room name from API
  const [callStatus, setCallStatus] = useState(null);
  const [isInitiatingCall, setIsInitiatingCall] = useState(false);
  const [existingActiveCall, setExistingActiveCall] = useState(null); // Store existing active call for rejoin

  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (user?.id) {
      console.log('Initializing Socket.IO for doctor:', user.id);
      socketService.connect(user.id);

      // Check connection status after a moment
      setTimeout(() => {
        const isConnected = socketService.isConnected();
        console.log('Doctor Socket.IO connection status:', isConnected);
        if (isConnected) {
          toast.success('Connected to call service');
        } else {
          toast.error('Failed to connect to call service');
        }
      }, 2000);

      // Listen for call status events
      socketService.onCallStarted((data) => {
        console.log('Call started:', data);
        setActiveCallId(data.callId);
        setCallStatus('pending');
        toast.success('Call initiated successfully');
      });

      socketService.onCallAccepted((data) => {
        console.log('Patient accepted call:', data);
        setCallStatus('active');
        toast.success('Patient joined the call');
      });

      socketService.onCallRejected((data) => {
        console.log('Patient rejected call:', data);
        setCallStatus('rejected');
        setShowCall(false);
        setActiveCallId(null);
        toast.error('Patient rejected the call');
      });

      socketService.onCallEnded((data) => {
        console.log('Call ended:', data);
        setCallStatus('ended');
        setShowCall(false);
        setActiveCallId(null);
        setActiveRoomName(null);
        toast.info('Call ended');
      });

      return () => {
        // Cleanup listeners on unmount
        socketService.offDoctorEvents();
        socketService.offCallEnded();
      };
    }
  }, [user]);

  // Note: Removed active call check as the endpoint doesn't exist
  // The rejoin functionality will work based on local state (activeCallId and activeRoomName)

  function ViewRecord(id) {
    navigate("/doctor-patient-record/" + id);
  }

  const formatTime = (time) => {
    if (!time) return "N/A";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "fulfilled":
      case "completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700";
      case "arrived":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-300 dark:border-blue-700";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-300 dark:border-red-700";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600";
    }
  };

  const maskPhone = (phone) => {
    if (!phone) return "N/A";
    return phone.slice(0, 3) + "****" + phone.slice(-3);
  };

  // Start call handler with Socket.IO integration
  const startCallHandler = async () => {
    if (!selectedAppointment) {
      toast.error("Please select an appointment first");
      return;
    }

    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    if (!socketService.isConnected()) {
      console.warn('Socket not connected, attempting to connect...');
      socketService.connect(user.id);

      // Wait a moment for connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!socketService.isConnected()) {
        toast.error("Socket connection not established. Please refresh the page.");
        return;
      }
    }

    try {
      setIsInitiatingCall(true);

      // Generate room name and meeting URL for the API call
      // IMPORTANT: We generate it here, but will use the room name from API response
      const roomName = generateRoomName(selectedAppointment.id);
      const meetingUrl = generateMeetingUrl(roomName, doctorName || user.name || 'Doctor');

      console.log('Starting call with:', {
        appointmentId: selectedAppointment.id,
        patientId: selectedAppointment.patient_id,
        roomName,
        socketConnected: socketService.isConnected()
      });

      // Call REST API to create call record
      // Backend stores the room name and emits Socket.IO event to patient
      const callResponse = await videoCallAPI.startCall({
        appointmentId: selectedAppointment.id,
        patientId: selectedAppointment.patient_id,
        roomName,
        meetingUrl
      });

      console.log('Call created via REST API:', callResponse);

      // CRITICAL: Use room name from API response (backend returns what it stored)
      // This ensures we use the exact same room name that patient will receive
      setActiveCallId(callResponse.id);
      setActiveRoomName(callResponse.roomName || roomName);

      // Emit Socket.IO event to notify patient with the exact data from backend
      // Using the room name from the API response ensures synchronization
      console.log('Emitting Socket.IO event to patient with backend data...');
      console.log('Call data being sent:', {
        callId: callResponse.id,
        appointmentId: callResponse.appointmentId,
        patientId: callResponse.patientId,
        doctorId: callResponse.doctorId,
        roomName: callResponse.roomName,
        meetingUrl: callResponse.meetingUrl,
        doctorName: doctorName || user?.name || 'Doctor',
        reason: selectedAppointment.reason || 'Consultation'
      });

      try {
        await socketService.startCall(
          callResponse.appointmentId,
          callResponse.patientId,
          callResponse.roomName,
          callResponse.meetingUrl,
          doctorName || user?.name || 'Doctor',
          selectedAppointment.reason || 'Consultation'
        );
        console.log('Socket.IO event emitted successfully to patient');
      } catch (socketError) {
        console.error('Socket.IO emit failed:', socketError);
        // Continue anyway - patient might still receive backend emission
      }

      // Open Jitsi meeting for doctor immediately with room name from backend
      setShowCall(true);
      setCallStatus('pending');

      toast.success('Call initiated - waiting for patient to join');

    } catch (error) {
      console.error('Failed to start call:', error);
      toast.error(error.message || 'Failed to start call. Please try again.');
    } finally {
      setIsInitiatingCall(false);
    }
  };

  // Close call handler (without ending the call)
  const closeCallHandler = () => {
    setShowCall(false);
    // Keep activeCallId and activeRoomName so we can rejoin
    // Don't clear existingActiveCall
    toast.info('Call is still active. You can rejoin anytime.');
  };

  // End call handler
  const endCallHandler = async (callId) => {
    if (!callId) {
      console.warn('No call ID provided for ending call');
      return;
    }

    try {
      console.log('Ending call:', callId);

      // Emit Socket.IO event to end call
      await socketService.endCall(callId);

      // Update call status in backend
      await videoCallAPI.updateCallStatus(callId, 'ended');

      setShowCall(false);
      setActiveCallId(null);
      setActiveRoomName(null);
      setCallStatus('ended');
      setExistingActiveCall(null);

      toast.success('Call ended successfully');
    } catch (error) {
      console.error('Failed to end call:', error);
      toast.error('Failed to end call properly');
    }
  };

  // Rejoin call handler
  const rejoinCallHandler = () => {
    // Check if we have an existing active call or current call state
    const callToRejoin = existingActiveCall || (activeCallId && activeRoomName ? { id: activeCallId, roomName: activeRoomName, status: callStatus } : null);

    if (!callToRejoin) {
      toast.error('No active call found');
      return;
    }

    console.log('Rejoining call:', callToRejoin);

    // Use the room name from the call record
    setActiveCallId(callToRejoin.id);
    setActiveRoomName(callToRejoin.roomName);
    setCallStatus(callToRejoin.status || 'active');
    setShowCall(true);

    toast.success('Rejoining call...');
  };

  if (loading) {
    return (
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            Today's Appointments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading appointments...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            Today's Appointments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <CalendarDays className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No appointments scheduled for today</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Jitsi Meeting - Render when showCall is true */}
      {showCall && selectedAppointment && activeCallId && activeRoomName && (
        <JitsiMeeting
          roomName={activeRoomName}
          displayName={doctorName || user?.name || "Doctor"}
          callId={activeCallId}
          onClose={closeCallHandler}
          onCallEnd={endCallHandler}
        />
      )}

      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            Today's Appointments ({appointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                onClick={() => setSelectedAppointment(appt)}
                className="flex justify-between items-center p-3 rounded-md cursor-pointer transition-colors 
                  bg-gray-50 dark:bg-gray-800 
                  border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-white mb-0.5">
                    {appt.patient_name || "Unknown Patient"}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(appt.appointment_time)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/doctor-patient-record/${appt.patient_id}`);
                        }}
                        className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        aria-label="Show patient details"
                      >
                        <Info className="h-4 w-4 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Show patient details</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${getStatusColor(appt.status)}`}>
                    {appt.status?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        {/* Modal */}
        {selectedAppointment && !showCall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setSelectedAppointment(null)}
            />
            <div className="relative z-50 bg-white dark:bg-gray-800 rounded-md shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700">
              <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    {selectedAppointment.patient_name || "Unknown Patient"}
                  </h3>
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Time</p>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                      {formatTime(selectedAppointment.appointment_time)}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Age</p>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                      {calculateAge(selectedAppointment.patient_dob) || selectedAppointment.patient_age || "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Type</p>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                      {selectedAppointment.appointment_type || "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Duration</p>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                      {selectedAppointment.duration || 30} min
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Reason</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedAppointment.reason || "N/A"}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Contact</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {maskPhone(selectedAppointment.patient_contact)}
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(selectedAppointment.status)}`}>
                    {selectedAppointment.status?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {(existingActiveCall || (activeCallId && activeRoomName && !showCall)) ? (
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white h-9 text-sm font-medium rounded-md"
                      onClick={rejoinCallHandler}
                    >
                      Rejoin Active Call
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={startCallHandler}
                      disabled={isInitiatingCall || !socketService.isConnected()}
                    >
                      {isInitiatingCall ? 'Starting Call...' : 'Start Call'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 h-9 text-sm font-medium rounded-md"
                    onClick={() => ViewRecord(selectedAppointment.patient_id)}
                  >
                    View Record
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 h-9 text-sm font-medium rounded-md"
                    onClick={() => navigate(`/consultation/${selectedAppointment.id}`)}
                  >
                    Start Consultation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </>
  );
};

export default DoctorAppointments;