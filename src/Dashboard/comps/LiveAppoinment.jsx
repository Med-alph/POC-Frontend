import React from "react";
import { Button } from "@/components/ui/button";
import { Clock, User, Stethoscope, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const LiveAppointmentList = ({ appointments = [] }) => {
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth.user);
    const isAdmin = user?.role?.toLowerCase() === 'admin' ||
        user?.designation_group?.toLowerCase() === 'admin' ||
        user?.role?.toLowerCase() === 'tenant_admin' ||
        user?.role?.toLowerCase() === 'receptionist' ||
        user?.role?.toLowerCase() === 'billing';

    const handleBilling = (appointmentId) => {
        navigate(`/billing/${appointmentId}`);
    };

    const getStatusBadge = (status) => {
        const normalizedStatus = status?.toLowerCase() || "";

        if (normalizedStatus === "completed" || normalizedStatus === "fulfilled") {
            return (
                <span className="text-green-700 dark:text-green-400 text-xs font-medium bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded border border-green-200 dark:border-green-800">
                    Completed
                </span>
            );
        } else if (normalizedStatus === "cancelled") {
            return (
                <span className="text-red-700 dark:text-red-300 text-xs font-medium bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded border border-red-200 dark:border-red-800">
                    Cancelled
                </span>
            );
        } else if (normalizedStatus === "pending") {
            return (
                <span className="text-yellow-700 dark:text-yellow-400 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded border border-yellow-200 dark:border-yellow-800">
                    Pending
                </span>
            );
        } else {
            return (
                <span className="text-blue-700 dark:text-blue-400 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded border border-blue-200 dark:border-blue-800">
                    Ongoing
                </span>
            );
        }
    };

    const getPaymentBadge = (orders = []) => {
        const isPaid = orders.some(order => order.status?.toLowerCase() === 'paid');

        if (isPaid) {
            return (
                <span className="text-green-700 dark:text-green-400 text-[10px] font-bold bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded border border-green-200 dark:border-green-800 uppercase tracking-wider">
                    Paid
                </span>
            );
        }

        return (
            <span className="text-amber-700 dark:text-amber-400 text-[10px] font-bold bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 uppercase tracking-wider">
                Unpaid
            </span>
        );
    };

    return (
        <div className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 flex items-center text-xs font-semibold text-gray-900 dark:text-white">
                <div className="w-[18%] flex items-center gap-1.5">
                    <Stethoscope className="h-4 w-4 text-gray-500 dark:text-gray-400" /> Doctor
                </div>
                <div className="w-[18%] flex items-center gap-1.5">
                    <User className="h-4 w-4 text-gray-500 dark:text-gray-400" /> Patient
                </div>
                <div className="w-[18%] flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" /> Time
                </div>
                <div className="w-[15%]">Status</div>
                <div className="w-[15%]">Payment</div>
                <div className="w-[16%] text-center">Action</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {appointments && appointments.length > 0 ? (
                    appointments.map((appt) => {
                        const status = appt.status?.toLowerCase();
                        const isFinished = status === "completed" || status === "fulfilled";

                        return (
                            <div
                                key={appt.id}
                                className="flex items-center px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <div className="w-[18%] text-gray-900 dark:text-white font-medium truncate text-sm">
                                    {appt.staff_name || "Unknown"}
                                </div>
                                <div className="w-[18%] text-gray-700 dark:text-gray-300 truncate text-sm">
                                    {appt.patient_name || "Unknown"}
                                </div>
                                <div className="w-[18%] text-gray-600 dark:text-gray-400 whitespace-normal break-words text-xs">
                                    {appt.appointment_time}
                                </div>
                                <div className="w-[15%]">
                                    {getStatusBadge(appt.status)}
                                </div>
                                <div className="w-[15%]">
                                    {getPaymentBadge(appt.orders)}
                                </div>
                                <div className="w-[16%] flex justify-center">
                                    {(isFinished && isAdmin) ? (
                                        <Button
                                            variant="outline"
                                            className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-[10px] font-bold uppercase flex items-center gap-1 rounded-md px-2 py-1 h-7 shadow-sm"
                                            onClick={() => handleBilling(appt.id)}
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5" /> Billing
                                        </Button>
                                    ) : (
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 italic uppercase font-medium">
                                            {status === 'cancelled' ? 'No action' : 'In progress'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })
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
