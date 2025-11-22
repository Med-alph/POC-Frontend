import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle, Calendar as CalendarIcon, Clock, FileText } from "lucide-react";
import DoctorAttendanceCalendar from "./CalendarComp";

const attendanceRecords = [
    { date: "2025-10-01", status: "present", checkIn: "09:05", checkOut: "17:15" },
    { date: "2025-10-02", status: "present", checkIn: "09:00", checkOut: "17:10" },
    { date: "2025-10-03", status: "absent" },
    { date: "2025-10-04", status: "present", checkIn: "09:10", checkOut: "17:20" },
    { date: "2025-10-05", status: "present", checkIn: "09:00", checkOut: "17:00" },
    { date: "2025-10-06", status: "late", checkIn: "09:25", checkOut: "17:15" },
    { date: "2025-10-07", status: "present", checkIn: "09:00", checkOut: "17:00" },
    { date: "2025-10-08", status: "present", checkIn: "09:05", checkOut: "17:05" },
    { date: "2025-10-09", status: "absent" },
    { date: "2025-10-10", status: "present", checkIn: "09:00", checkOut: "17:10" },
];

export default function DoctorAttendancePage() {
    const totalPresent = attendanceRecords.filter((r) => r.status === "present").length;
    const totalAbsent = attendanceRecords.filter((r) => r.status === "absent").length;
    const totalLate = attendanceRecords.filter((r) => r.status === "late").length;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                        Attendance Tracker
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Track your attendance records and view detailed history
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Present Card */}
                    <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                Present Days
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="text-center">
                                <p className="text-4xl font-semibold text-gray-900 dark:text-white mb-1">
                                    {totalPresent}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Days attended
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Absent Card */}
                    <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                Absent Days
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="text-center">
                                <p className="text-4xl font-semibold text-gray-900 dark:text-white mb-1">
                                    {totalAbsent}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Days missed
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Late Card */}
                    <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                Late Arrivals
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="text-center">
                                <p className="text-4xl font-semibold text-gray-900 dark:text-white mb-1">
                                    {totalLate}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Late check-ins
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        className="bg-red-600 hover:bg-red-700 text-white h-9 px-4 text-sm font-medium rounded-md flex items-center gap-2"
                    >
                        <FileText className="h-4 w-4" />
                        Apply Leave
                    </Button>
                    <Button
                        variant="outline"
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 h-9 px-4 text-sm font-medium rounded-md flex items-center gap-2"
                    >
                        <Clock className="h-4 w-4" />
                        Adjust Attendance
                    </Button>
                </div>

                {/* Calendar */}
                <DoctorAttendanceCalendar />
            </div>
        </div>
    );
}