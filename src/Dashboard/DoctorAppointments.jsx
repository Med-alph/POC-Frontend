import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, User, X, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const JitsiMeeting = ({ roomName, displayName, onClose }) => {
  const handleCustomClick = () => {
    console.log("Custom button clicked!");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-60 p-2 bg-white rounded"
      >
        Close
      </button>
      <button
        onClick={handleCustomClick}
        className="absolute top-4 left-4 z-60 p-2 bg-yellow-400 rounded shadow text-black font-semibold"
      >
        Custom Action
      </button>
      <iframe
        src={`https://meet.jit.si/${roomName}#userInfo.displayName="${encodeURIComponent(
          displayName
        )}"&interfaceConfigOverwrite={"TOOLBAR_BUTTONS":["microphone","camera","chat","hangup","fullscreen","fodeviceselection","profile","raisehand","tileview"]}&config.disableDeepLinking=true`}
        allow="camera; microphone; fullscreen; display-capture"
        style={{ width: "100%", height: "100%" }}
        frameBorder="0"
        allowFullScreen
        title="Jitsi Meeting"
      />
    </div>
  );
};

const DoctorAppointments = ({ appointments, loading, doctorName }) => {
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showCall, setShowCall] = useState(false);
  const navigate = useNavigate();

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
      case "booked":
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

  // Generate unique room name for the call
  const generateRoomName = (appointment) => {
    return `medportal-${appointment.id}-${Date.now()}`;
  };

  // Start call handler - now properly connected
  const startCallHandler = () => {
    if (selectedAppointment) {
      setShowCall(true);
    } else {
      alert("Please select an appointment first");
    }
  };

  // Close call handler
  const closeCallHandler = () => {
    setShowCall(false);
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
      {showCall && selectedAppointment && (
        <JitsiMeeting
          roomName={generateRoomName(selectedAppointment)}
          displayName={doctorName || "Doctor"}
          onClose={closeCallHandler}
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
                <span className={`text-xs font-medium px-2 py-0.5 rounded ml-2 ${getStatusColor(appt.status)}`}>
                  {appt.status?.toUpperCase() || 'UNKNOWN'}
                </span>
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
                  {/* FIX: Added onClick handler to Start Call button */}
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm font-medium rounded-md"
                    onClick={startCallHandler}
                  >
                    Start Call
                  </Button>
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