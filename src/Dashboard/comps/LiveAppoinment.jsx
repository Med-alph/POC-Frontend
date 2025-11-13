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
            className={`w-full bg-white rounded-xl shadow border border-gray-100 transition-all duration-700 delay-300 
      hover:shadow-lg hover:-translate-y-1 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
        >
            {/* Header */}
            <div className="bg-blue-50 border-b px-4 py-3 sm:px-6 flex items-center font-semibold text-sm text-gray-700">
                <div className="w-1/5 flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-blue-500" /> Doctor
                </div>
                <div className="w-1/5 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" /> Patient
                </div>
                <div className="w-1/5 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" /> Start Time
                </div>
                <div className="w-1/5 text-gray-600">Status</div>
                <div className="w-1/5 text-gray-600 text-center">Action</div>
            </div>

            {/* Rows */}
            <div className="divide-y">
                {appointments.length > 0 ? (
                    appointments.map((appt) => (
                        <div
                            key={appt.id}
                            className="flex items-center px-4 py-3 sm:px-6 text-sm hover:bg-gray-50 transition"
                        >
                            <div className="w-1/5 text-gray-800 font-medium truncate">
                                Dr. {appt.doctorName}
                            </div>
                            <div className="w-1/5 text-gray-600 truncate">
                                {appt.patientName}
                            </div>
                            <div className="w-1/5 text-gray-600 whitespace-normal break-words">
                                {new Date(appt.startTime).toLocaleString()}
                            </div>
                            <div className="w-1/5">
                                {appt.status === "ongoing" ? (
                                    <span className="text-green-600 text-xs font-semibold bg-green-50 px-3 py-1 rounded-full">
                                        Ongoing
                                    </span>
                                ) : (
                                    <span className="text-gray-600 text-xs font-semibold bg-gray-100 px-3 py-1 rounded-full">
                                        Ended
                                    </span>
                                )}
                            </div>
                            <div className="w-1/5 flex justify-center">
                                {appt.status === "ended" ? (
                                    <Button
                                        variant="outline"
                                        className="border-blue-500 text-blue-600 hover:bg-blue-50 text-xs flex items-center gap-1"
                                        onClick={() => handleBilling(appt.id)}
                                    >
                                        <CheckCircle2 className="h-4 w-4" /> Billing
                                    </Button>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">In progress</p>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-400 py-6 text-sm">
                        No appointments found.
                    </p>
                )}
            </div>
        </div>

    );
};

export default LiveAppointmentList;
