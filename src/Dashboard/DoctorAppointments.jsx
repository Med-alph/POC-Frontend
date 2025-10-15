import React, { useState } from "react";
import { CalendarDays, User, X } from "lucide-react";
import { todaysAppointments } from "./doctorAppointmentsData";

const DoctorAppointments = () => {
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showAllAppointments, setShowAllAppointments] = useState(false);

    const handleViewAll = () => {
        setShowAllAppointments(true);
    };

    const closeAllModal = () => {
        setShowAllAppointments(false);
    };

    return (
        <div
            className="bg-white rounded-lg shadow p-3 sm:p-5 border-l-4 border-blue-500 transition-all duration-700 hover:shadow-xl"
        >
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-blue-500" />
                    Today's Appointments
                </h2>
                <button
                    onClick={handleViewAll}
                    className="text-sm text-blue-500 hover:underline"
                >
                    View All
                </button>
            </div>

            {/* List of Appointments */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {todaysAppointments.map((appt) => (
                    <div
                        key={appt.id}
                        onClick={() => setSelectedAppointment(appt)}
                        className={`flex justify-between items-center p-2 rounded-md cursor-pointer transition-all hover:bg-gray-50 border-l-4 border-transparent`}
                    >
                        <div>
                            <p className="font-semibold text-gray-800">{appt.patientName}</p>
                            <p className="text-sm text-gray-500">{appt.time}</p>
                        </div>
                        <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${appt.status === "Completed"
                                    ? "bg-green-100 text-green-700"
                                    : appt.status === "Pending"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-blue-100 text-blue-700"
                                }`}
                        >
                            {appt.status}
                        </span>
                    </div>
                ))}
            </div>

            {/* Single Appointment Modal */}
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
                            {selectedAppointment.patientName}
                        </h3>

                        <div className="text-sm text-gray-600 space-y-1">
                            <p>
                                <strong>Time:</strong> {selectedAppointment.time}
                            </p>
                            <p>
                                <strong>Age/Gender:</strong> {selectedAppointment.age} /{" "}
                                {selectedAppointment.gender}
                            </p>
                            <p>
                                <strong>Reason:</strong> {selectedAppointment.reason}
                            </p>
                            <p>
                                <strong>Contact:</strong> ********** ***
                            </p>
                            <p>
                                <strong>Notes:</strong> {selectedAppointment.notes}
                            </p>
                        </div>

                        <div className="mt-4 flex gap-3">
                            <button className="text-white bg-blue-500 hover:bg-blue-600 text-sm px-3 py-1 rounded-md">
                                Start Call
                            </button>
                            <button className="text-blue-500 border border-blue-500 text-sm px-3 py-1 rounded-md hover:bg-blue-50">
                                View Record
                            </button>
                            <button className="text-blue-500 border border-blue-500 text-sm px-3 py-1 rounded-md hover:bg-blue-50">
                                Start
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* All Appointments Modal */}
            {showAllAppointments && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-11/12 sm:w-3/4 max-h-[80vh] overflow-y-auto relative animate-fade-in-up">
                        <button
                            onClick={closeAllModal}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            All Appointments
                        </h3>

                        <div className="divide-y divide-gray-200">
                            {todaysAppointments.map((appt) => (
                                <div
                                    key={appt.id}
                                    className="flex justify-between items-center p-2 hover:bg-gray-50"
                                >
                                    <div>
                                        <p className="font-semibold text-gray-800">{appt.patientName}</p>
                                        <p className="text-sm text-gray-500">{appt.time}</p>
                                    </div>
                                    <span
                                        className={`text-xs font-semibold px-2 py-1 rounded-full ${appt.status === "Completed"
                                                ? "bg-green-100 text-green-700"
                                                : appt.status === "Pending"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-blue-100 text-blue-700"
                                            }`}
                                    >
                                        {appt.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorAppointments;
