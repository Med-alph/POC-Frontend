import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, User, X, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const JitsiMeeting = ({ roomName, displayName, onClose }) => {
  // Custom button handler
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
      {/* Custom Button (example: top left) */}
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

  // Format time to 12-hour format
  const formatTime = (time) => {
    if (!time) return "N/A";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Calculate age from DOB
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

  // Get status color with dark mode support
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

  // Mask phone number
  const maskPhone = (phone) => {
    if (!phone) return "N/A";
    return phone.slice(0, 3) + "****" + phone.slice(-3);
  };

  const startCallHandler = () => {
    if (selectedAppointment) {
      setShowCall(true);
    } else {
      alert("Please select an appointment first");
    }
  };

  if (loading) {
    return (
      <Card className="shadow-xl border-0 rounded-2xl overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 text-white p-6">
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
              <CalendarDays className="h-6 w-6" />
            </div>
            Today's Appointments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading appointments...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <Card className="shadow-xl border-0 rounded-2xl overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 text-white p-6">
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
              <CalendarDays className="h-6 w-6" />
            </div>
            Today's Appointments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <CalendarDays className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No appointments scheduled for today</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-xl border-0 rounded-2xl overflow-hidden dark:bg-gray-800 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 text-white p-6">
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
              <CalendarDays className="h-6 w-6" />
            </div>
            Today's Appointments ({appointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* List of Appointments */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                onClick={() => setSelectedAppointment(appt)}
                className="flex justify-between items-center p-4 rounded-xl cursor-pointer transition-all bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 hover:shadow-md hover:scale-[1.02]"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                    {appt.patient_name || "Unknown Patient"}
                  </p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {formatTime(appt.appointment_time)}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-full ml-3 shadow-sm ${getStatusColor(
                    appt.status
                  )}`}
                >
                  {appt.status?.toUpperCase() || "UNKNOWN"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>

        {/* Modal */}
        {selectedAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedAppointment(null)}
            />
            <div className="relative z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 animate-in fade-in-0 zoom-in-95">
              <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 text-white p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <User className="h-6 w-6" />
                    </div>
                    {selectedAppointment.patient_name || "Unknown Patient"}
                  </h3>
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-blue-100 text-sm">Appointment Details</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Time</p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {formatTime(selectedAppointment.appointment_time)}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-200 dark:border-green-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Age</p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {calculateAge(selectedAppointment.patient_dob) ||
                        selectedAppointment.patient_age ||
                        "N/A"}
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Type</p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {selectedAppointment.appointment_type || "N/A"}
                    </p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 border border-orange-200 dark:border-orange-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Duration</p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {selectedAppointment.duration || 30} min
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Reason</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedAppointment.reason || "N/A"}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Contact</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {maskPhone(selectedAppointment.patient_contact)}
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                  <span
                    className={`text-xs font-bold px-3 py-1.5 rounded-full ${getStatusColor(
                      selectedAppointment.status
                    )}`}
                  >
                    {selectedAppointment.status?.toUpperCase() || "UNKNOWN"}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11 font-semibold rounded-xl"
                    onClick={startCallHandler}
                  >
                    Start Call
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-11 font-semibold rounded-xl"
                    onClick={() => ViewRecord(selectedAppointment.patient_id)}
                  >
                    View Record
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 h-11 font-semibold rounded-xl"
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

      {/* Jitsi Meeting Modal */}
      {showCall && selectedAppointment && (
        <JitsiMeeting
          roomName={`EMR-Appointment-${selectedAppointment.id}-${Math.random().toString(36).substr(2, 8)}`}
          displayName={doctorName || "Doctor"}
          onClose={() => setShowCall(false)}
        />
      )}
    </>
  );
};

export default DoctorAppointments;
