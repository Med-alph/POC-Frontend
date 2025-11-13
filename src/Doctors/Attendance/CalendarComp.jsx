import { useState } from "react";
import { Calendar } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Calendar.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Users, Clock, Calendar as CalendarIcon } from "lucide-react";

// Example data with patients and events
const attendanceRecords = [
    {
        date: "2025-10-01",
        status: "present",
        checkIn: "09:05",
        checkOut: "17:15",
        patients: ["John Doe", "Jane Smith", "Bob Johnson"],
        events: ["Team meeting at 3 PM"],
    },
    {
        date: "2025-10-02",
        status: "present",
        checkIn: "09:00",
        checkOut: "17:10",
        patients: ["Alice Brown", "Charlie Davis"],
        events: ["Prescription review"],
    },
    {
        date: "2025-10-03",
        status: "absent",
        patients: [],
        events: [],
    },
    {
        date: "2025-10-04",
        status: "present",
        checkIn: "09:10",
        checkOut: "17:20",
        patients: ["Emily Clark", "Frank Lee"],
        events: ["Follow-up calls"],
    },
    {
        date: "2025-10-05",
        status: "present",
        checkIn: "09:00",
        checkOut: "17:00",
        patients: ["George Hall", "Hannah King"],
        events: [],
    },
    {
        date: "2025-10-06",
        status: "late",
        checkIn: "09:25",
        checkOut: "17:15",
        patients: ["Ian Moore"],
        events: ["Lab review"],
    },
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

export default function DoctorAttendanceCalendar() {
    const [selectedDate, setSelectedDate] = useState(null);

    const selectedRecord = selectedDate
        ? attendanceRecords.find(
            (r) => r.date === selectedDate.toISOString().split("T")[0]
        )
        : null;

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Calendar Card */}
            <Card className="flex-1 shadow-xl border-0 rounded-2xl overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 text-white p-6">
                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                            <CalendarIcon className="h-6 w-6" />
                        </div>
                        Monthly Attendance Calendar
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="w-full flex justify-center">
                        <Calendar
                            onChange={(date) => setSelectedDate(date)}
                            value={selectedDate}
                            tileContent={({ date, view }) => {
                                if (view === "month") {
                                    const record = attendanceRecords.find(
                                        (r) => r.date === date.toISOString().split("T")[0]
                                    );
                                    if (record) {
                                        const Icon = statusIcon[record.status];
                                        const statusColors = {
                                            present: "text-green-600 dark:text-green-400",
                                            absent: "text-red-600 dark:text-red-400",
                                            late: "text-yellow-600 dark:text-yellow-400",
                                        };
                                        return (
                                            <div className="flex flex-col items-center justify-center mt-1 gap-1">
                                                <Icon className={`h-4 w-4 ${statusColors[record.status]}`} />
                                                <span className={`text-xs font-bold ${statusColors[record.status]}`}>
                                                    {record.status[0].toUpperCase()}
                                                </span>
                                            </div>
                                        );
                                    }
                                }
                                return null;
                            }}
                            tileClassName={({ date, view }) => {
                                const today = new Date().toISOString().split("T")[0];
                                const d = date.toISOString().split("T")[0];
                                const record = attendanceRecords.find((r) => r.date === d);
                                const baseClasses = "rounded-xl transition-all duration-200 h-20 flex flex-col items-center justify-center";
                                const todayClass = view === "month" && d === today 
                                    ? "bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-600 font-bold" 
                                    : "";
                                const statusClass = record
                                    ? record.status === "present"
                                        ? "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800"
                                        : record.status === "absent"
                                            ? "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800"
                                            : "bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-700/50";
                                return `${baseClasses} ${todayClass} ${statusClass}`;
                            }}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Details Panel */}
            <Card className="w-full lg:w-1/3 shadow-xl border-0 rounded-2xl overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-500 text-white p-6">
                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                            <CalendarIcon className="h-6 w-6" />
                        </div>
                        {selectedRecord
                            ? `Details for ${new Date(selectedRecord.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                            : "Select a Date"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    {selectedRecord ? (
                        <>
                            {/* Status */}
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-gray-700 dark:text-gray-300">Status:</p>
                                    <Badge
                                        className={`px-4 py-1.5 rounded-full font-bold text-sm ${
                                            selectedRecord.status === "present"
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700"
                                                : selectedRecord.status === "absent"
                                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-300 dark:border-red-700"
                                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700"
                                        }`}
                                    >
                                        {selectedRecord.status.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>

                            {/* Check-in / Check-out */}
                            {selectedRecord.status !== "absent" && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 space-y-3">
                                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Check-in</p>
                                            <p className="font-bold text-lg">{selectedRecord.checkIn}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Check-out</p>
                                            <p className="font-bold text-lg">{selectedRecord.checkOut}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Patients */}
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                                <p className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    Patients Attended
                                </p>
                                {selectedRecord.patients.length > 0 ? (
                                    <ul className="space-y-2">
                                        {selectedRecord.patients.map((p, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700/50 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                {p}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-400 dark:text-gray-500 text-sm">No patients attended</p>
                                )}
                            </div>

                            {/* Other Events */}
                            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
                                <p className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                                    <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                        <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    Other Events
                                </p>
                                {selectedRecord.events.length > 0 ? (
                                    <ul className="space-y-2">
                                        {selectedRecord.events.map((e, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700/50 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                {e}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-400 dark:text-gray-500 text-sm">No events scheduled</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <CalendarIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 font-medium">Click a date to see attendance details</p>
                        </div>
                    )}
                </CardContent>
            </Card>

        </div >
    );
}