import React from "react";
import { Button } from "@/components/ui/button";
import { Clock, User, Stethoscope, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LiveAppointmentList = () => {
    const navigate = useNavigate();
    const [isLoaded, setIsLoaded] = React.useState(true);

    const appointments = [
        {
            id: 1,
            doctorName: "Jeffrey",
            patientName: "Alice Brown",
            startTime: "2025-10-30T10:00:00Z",
            status: "ongoing",
        },
        {
            id: 2,
            doctorName: "John Smith",
            patientName: "David Lee",
            startTime: "2025-10-29T09:00:00Z",
            status: "ended",
        },
    ];
    const handleBilling = (appointmentId) => {
        navigate(`/billing/${appointmentId}`);
    };

    return (
        <div
            className={`w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-0 overflow-hidden transition-all duration-300 hover:shadow-2xl ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-500 text-white px-6 py-4 flex items-center font-bold text-sm">
                <div className="w-1/5 flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" /> Doctor
                </div>
                <div className="w-1/5 flex items-center gap-2">
                    <User className="h-5 w-5" /> Patient
                </div>
                <div className="w-1/5 flex items-center gap-2">
                    <Clock className="h-5 w-5" /> Start Time
                </div>
                <div className="w-1/5">Status</div>
                <div className="w-1/5 text-center">Action</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {appointments.length > 0 ? (
                    appointments.map((appt) => (
                        <div
                            key={appt.id}
                            className="flex items-center px-6 py-4 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
                        >
                            <div className="w-1/5 text-gray-900 dark:text-white font-bold truncate">
                                Dr. {appt.doctorName}
                            </div>
                            <div className="w-1/5 text-gray-700 dark:text-gray-300 font-medium truncate">
                                {appt.patientName}
                            </div>
                            <div className="w-1/5 text-gray-600 dark:text-gray-400 whitespace-normal break-words text-xs">
                                {new Date(appt.startTime).toLocaleString()}
                            </div>
                            <div className="w-1/5">
                                {appt.status === "ongoing" ? (
                                    <span className="text-green-700 dark:text-green-400 text-xs font-bold bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-full">
                                        Ongoing
                                    </span>
                                ) : (
                                    <span className="text-gray-700 dark:text-gray-300 text-xs font-bold bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
                                        Ended
                                    </span>
                                )}
                            </div>
                            <div className="w-1/5 flex justify-center">
                                {appt.status === "ended" ? (
                                    <Button
                                        variant="outline"
                                        className="border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs font-semibold flex items-center gap-1 rounded-xl px-4 py-2"
                                        onClick={() => handleBilling(appt.id)}
                                    >
                                        <CheckCircle2 className="h-4 w-4" /> Billing
                                    </Button>
                                ) : (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">In progress</p>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-400 dark:text-gray-500 text-sm">
                            No appointments found.
                        </p>
                    </div>
                )}
            </div>
        </div>

    );
};

export default LiveAppointmentList;
