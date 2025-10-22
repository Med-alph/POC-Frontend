
import { useState } from "react";
import { Calendar } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
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

const statusColor = {
    present: "green",
    absent: "red",
    late: "yellow",
};

const statusIcon = {
    present: CheckCircle,
    absent: XCircle,
    late: AlertTriangle,
};

export default function DoctorAttendancePage() {
    const [selectedDate, setSelectedDate] = useState(null);

    const tileContent = ({ date, view }) => {
        if (view === "month") {
            const record = attendanceRecords.find(
                (r) => r.date === date.toISOString().split("T")[0]
            );
            if (record) {
                const Icon = statusIcon[record.status];
                return (
                    <Tooltip
                        content={
                            record.status === "absent"
                                ? "Absent"
                                : `Check-in: ${record.checkIn} | Check-out: ${record.checkOut}`
                        }
                    >
                        <div className="flex items-center justify-center mt-1 space-x-1">
                            <Icon
                                className={`h-4 w-4 text-${statusColor[record.status]}-600`}
                            />
                            <Badge
                                variant="outline"
                                className={`text-xs capitalize border-${statusColor[record.status]}-500 text-${statusColor[record.status]}-700`}
                            >
                                {record.status}
                            </Badge>
                        </div>
                    </Tooltip>
                );
            }
        }
        return null;
    };

    const totalPresent = attendanceRecords.filter((r) => r.status === "present").length;
    const totalAbsent = attendanceRecords.filter((r) => r.status === "absent").length;
    const totalLate = attendanceRecords.filter((r) => r.status === "late").length;

    return (
        <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <h1 className="text-3xl font-bold text-gray-800">Doctor Attendance</h1>
            <p className="text-gray-600">Track your attendance records at a glance</p>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-6">
                {/* Cards */}
                <Card className="sm:col-span-1 shadow-lg border-l-4 border-green-500">
                    <CardContent className="flex items-center space-x-4">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                        <div>
                            <p className="text-2xl font-bold">{totalPresent}</p>
                            <p className="text-gray-600">Present</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="sm:col-span-1 shadow-lg border-l-4 border-red-500">
                    <CardContent className="flex items-center space-x-4">
                        <XCircle className="h-8 w-8 text-red-500" />
                        <div>
                            <p className="text-2xl font-bold">{totalAbsent}</p>
                            <p className="text-gray-600">Absent</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="sm:col-span-1 shadow-lg border-l-4 border-yellow-500">
                    <CardContent className="flex items-center space-x-4">
                        <AlertTriangle className="h-8 w-8 text-yellow-500" />
                        <div>
                            <p className="text-2xl font-bold">{totalLate}</p>
                            <p className="text-gray-600">Late</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Buttons: span remaining columns */}
                <div className="sm:col-span-3 flex flex-col sm:flex-row sm:justify-end sm:space-x-4 space-y-2 sm:space-y-0 mt-0">
                    <button className="px-4 py-1.5 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition cursor-pointer">
                        Apply Leave
                    </button>
                    <button className="px-4 py-1.5 bg-yellow-500 text-white rounded-lg shadow hover:bg-yellow-600 transition cursor-pointer">
                        Adjust Attendance
                    </button>
                </div>
            </div>


            {/* Calendar */}
            <DoctorAttendanceCalendar />
        </div>
    );
}
