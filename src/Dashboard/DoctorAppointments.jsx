import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, User, X } from "lucide-react";

const DoctorAppointments = ({ appointments, loading }) => {
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const navigate = useNavigate();

    function ViewRecord(id) {
        navigate("/doctor-patient-record/" + id);
    }

    // Format time to 12-hour format
    const formatTime = (time) => {
        if (!time) return "N/A";
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
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

    // Get status color
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'fulfilled':
            case 'completed':
                return "bg-green-100 text-green-700";
            case 'booked':
            case 'pending':
                return "bg-yellow-100 text-yellow-700";
            case 'arrived':
                return "bg-blue-100 text-blue-700";
            case 'cancelled':
                return "bg-red-100 text-red-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    // Mask phone number
    const maskPhone = (phone) => {
        if (!phone) return "N/A";
        return phone.slice(0, 3) + "****" + phone.slice(-3);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-3 sm:p-5 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-blue-500" />
                        Today's Appointments
                    </h2>
                </div>
                <div className="text-center py-8">
                    <p className="text-gray-500">Loading appointments...</p>
                </div>
            </div>
        );
    }

    if (!appointments || appointments.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-3 sm:p-5 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-blue-500" />
                        Today's Appointments
                    </h2>
                </div>
                <div className="text-center py-8">
                    <p className="text-gray-500">No appointments scheduled for today</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-3 sm:p-5 border-l-4 border-blue-500 transition-all duration-700 hover:shadow-xl">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-blue-500" />
                    Today's Appointments ({appointments.length})
                </h2>
            </div>

            {/* List of Appointments */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {appointments.map((appt) => (
                    <div
                        key={appt.id}
                        onClick={() => setSelectedAppointment(appt)}
                        className="flex justify-between items-center p-2 rounded-md cursor-pointer transition-all 
                            hover:bg-gray-50 border-l-4 border-transparent hover:border-blue-500"
                    >
                        <div>
                            <p className="font-semibold text-gray-800">
                                {appt.patient_name || "Unknown Patient"}
                            </p>
                            <p className="text-sm text-gray-500">
                                {formatTime(appt.appointment_time)}
                            </p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusColor(appt.status)}`}>
                            {appt.status}
                        </span>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {selectedAppointment && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-11/12 sm:w-96 relative animate-fade-in-up">
                        <button
                            onClick={() => setSelectedAppointment(null)}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-500" />
                            {selectedAppointment.patient_name || "Unknown Patient"}
                        </h3>

                        <div className="text-sm text-gray-600 space-y-1">
                            <p>
                                <strong>Time:</strong> {formatTime(selectedAppointment.appointment_time)}
                            </p>
                            <p>
                                <strong>Age:</strong> {calculateAge(selectedAppointment.patient_dob) || selectedAppointment.patient_age || "N/A"}
                            </p>
                            <p>
                                <strong>Type:</strong> {selectedAppointment.appointment_type || "N/A"}
                            </p>
                            <p>
                                <strong>Reason:</strong> {selectedAppointment.reason || "N/A"}
                            </p>
                            <p>
                                <strong>Contact:</strong> {maskPhone(selectedAppointment.patient_contact)}
                            </p>
                            <p>
                                <strong>Duration:</strong> {selectedAppointment.duration || 30} minutes
                            </p>
                            <p>
                                <strong>Status:</strong>{" "}
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusColor(selectedAppointment.status)}`}>
                                    {selectedAppointment.status}
                                </span>
                            </p>
                        </div>

                        <div className="mt-4 flex gap-3">
                            <button className="text-white bg-blue-500 hover:bg-blue-600 text-sm px-3 py-1 rounded-md">
                                Start Call
                            </button>
                            <button
                                className="text-blue-500 border border-blue-500 text-sm px-3 py-1 rounded-md hover:bg-blue-50"
                                onClick={() => ViewRecord(selectedAppointment.patient_id)}
                            >
                                View Record
                            </button>
                           <button
    className="text-blue-500 border border-blue-500 text-sm px-3 py-1 rounded-md hover:bg-blue-50"
    onClick={() => navigate(`/consultation/${selectedAppointment.id}`)}
>
    Start
</button>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorAppointments;
