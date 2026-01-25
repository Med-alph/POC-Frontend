import React from "react";
import { Button } from "@/components/ui/button";
import { Clock, User, Stethoscope, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LiveAppointmentList = ({ appointments = [] }) => {
    const navigate = useNavigate();

    const handleBilling = (appointmentId) => {
        navigate(`/billing/${appointmentId}`);
    };

    const getStatusBadge = (status) => {
        const normalizedStatus = status?.toLowerCase() || "";

        if (normalizedStatus === "completed") {
            return (
                <span className="text-gray-700 dark:text-gray-300 text-xs font-medium bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
                    Ended
                </span>
            );
        } else if (normalizedStatus === "cancelled") {
            return (
                <span className="text-red-700 dark:text-red-300 text-xs font-medium bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded border border-red-200 dark:border-red-800">
                    Cancelled
                </span>
            );
        } else {
            return (
                <span className="text-green-700 dark:text-green-400 text-xs font-medium bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded border border-green-200 dark:border-green-800">
                    Ongoing
                </span>
            );
        }
    };

    return (
        <div className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 flex items-center text-xs font-semibold text-gray-900 dark:text-white">
                <div className="w-1/5 flex items-center gap-1.5">
                    <Stethoscope className="h-4 w-4 text-gray-500 dark:text-gray-400" /> Doctor
                </div>
                <div className="w-1/5 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-gray-500 dark:text-gray-400" /> Patient
                </div>
                <div className="w-1/5 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" /> Start Time
                </div>
                <div className="w-1/5">Status</div>
                <div className="w-1/5 text-center">Action</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {appointments && appointments.length > 0 ? (
                    appointments.map((appt) => (
                        <div
                            key={appt.id}
                            className="flex items-center px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            <div className="w-1/5 text-gray-900 dark:text-white font-medium truncate text-sm">
                                {appt.staff_name || "Unknown"}
                            </div>
                            <div className="w-1/5 text-gray-700 dark:text-gray-300 truncate text-sm">
                                {appt.patient_name || "Unknown"}
                            </div>
                            <div className="w-1/5 text-gray-600 dark:text-gray-400 whitespace-normal break-words text-xs">
                                {appt.appointment_date} {appt.appointment_time}
                            </div>
                            <div className="w-1/5">
                                {getStatusBadge(appt.status)}
                            </div>
                            <div className="w-1/5 flex justify-center">
                                {appt.status === "completed" ? (
                                    <Button
                                        variant="outline"
                                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium flex items-center gap-1 rounded-md px-3 py-1.5 h-7"
                                        onClick={() => handleBilling(appt.id)}
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Billing
                                    </Button>
                                ) : (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                                        {appt.status === 'cancelled' ? 'Cancelled' : 'In progress'}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            No appointments found for today.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveAppointmentList;
