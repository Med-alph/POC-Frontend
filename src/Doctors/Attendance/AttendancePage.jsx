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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 lg:p-8 transition-all">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="mb-6">
                    {/* <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg mb-4">
                        <CalendarIcon className="h-6 w-6" />
                        <span className="text-sm font-semibold">Doctor Attendance</span>
                    </div> */}
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Attendance Tracker
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
                        Track your attendance records and view detailed history
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6 mb-6">
                    {/* Present Card */}
                    <Card className="shadow-xl border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                        <CardHeader className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 text-white p-6">
                            <CardTitle className="text-xl font-bold flex items-center gap-3">
                                <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <CheckCircle className="h-6 w-6" />
                                </div>
                                Present Days
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="text-center">
                                <p className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                                    {totalPresent}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    Days attended
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Absent Card */}
                    <Card className="shadow-xl border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                        <CardHeader className="bg-gradient-to-r from-red-600 via-red-500 to-rose-500 text-white p-6">
                            <CardTitle className="text-xl font-bold flex items-center gap-3">
                                <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <XCircle className="h-6 w-6" />
                                </div>
                                Absent Days
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="text-center">
                                <p className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                                    {totalAbsent}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    Days missed
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Late Card */}
                    <Card className="shadow-xl border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                        <CardHeader className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-orange-500 text-white p-6">
                            <CardTitle className="text-xl font-bold flex items-center gap-3">
                                <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <AlertTriangle className="h-6 w-6" />
                                </div>
                                Late Arrivals
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="text-center">
                                <p className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                                    {totalLate}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    Late check-ins
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <Button
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white h-12 px-6 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                        <FileText className="h-5 w-5" />
                        Apply Leave
                    </Button>
                    <Button
                        variant="outline"
                        className="border-yellow-600 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 h-12 px-6 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                        <Clock className="h-5 w-5" />
                        Adjust Attendance
                    </Button>
                </div>

                {/* Calendar */}
                <DoctorAttendanceCalendar />
            </div>
        </div>
    );
}