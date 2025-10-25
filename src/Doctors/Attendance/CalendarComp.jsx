
import { useState } from "react";
import { Calendar } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Calendar.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { CheckCircle, XCircle, AlertTriangle, Users } from "lucide-react";

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
        <div className="flex flex-col lg:flex-row gap-6 p-6 bg-gray-50 min-h-screen">
            {/* Calendar Card */}
            <Card className="flex-1 shadow-xl">
                <CardHeader>
                    <CardTitle>Monthly Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="w-full lg:w-[700px]">
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
                                        return (
                                            <Tooltip
                                                content={
                                                    record.status === "absent"
                                                        ? "Absent"
                                                        : `Check-in: ${record.checkIn} | Check-out: ${record.checkOut}`
                                                }
                                            >
                                                <div className="flex items-center justify-center mt-2 px-2 py-1 rounded-full text-xs font-semibold text-black space-x-1">
                                                    <Icon className={`h-3 w-3 text-${statusColor[record.status]}-600`} />
                                                    <span>{record.status[0].toUpperCase()}</span>
                                                </div>
                                            </Tooltip>
                                        );
                                    }
                                }
                                return null;
                            }}
                            tileClassName={({ date, view }) => {
                                const today = new Date().toISOString().split("T")[0];
                                const d = date.toISOString().split("T")[0];
                                const record = attendanceRecords.find((r) => r.date === d);
                                return [
                                    "rounded-lg transition-all duration-150 h-16",
                                    view === "month" && d === today ? "bg-blue-50 border border-blue-300" : "",
                                    record
                                        ? record.status === "present"
                                            ? "bg-green-100 hover:bg-green-200"
                                            : record.status === "absent"
                                                ? "bg-red-100 hover:bg-red-200"
                                                : "bg-yellow-100 hover:bg-yellow-200"
                                        : "",
                                ].join(" ");
                            }}
                        />
                    </div>
                </CardContent>

            </Card >

            {/* Details Panel */}
            <Card className="w-full lg:w-1/3 shadow-xl rounded-xl border border-gray-200">
                <CardHeader>
                    <CardTitle className="text-lg lg:text-xl font-bold text-gray-800">
                        {selectedRecord
                            ? `Details for ${selectedRecord.date}`
                            : "Select a date to view details"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {selectedRecord ? (
                        <>
                            {/* Status */}
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border-l-4 border-gray-200">
                                <p className="font-semibold text-gray-700">Status:</p>
                                <Badge
                                    variant="outline"
                                    className={`border-${statusColor[selectedRecord.status]}-500 text-${statusColor[selectedRecord.status]}-700 px-3 py-1 rounded-full`}
                                >
                                    {selectedRecord.status.toUpperCase()}
                                </Badge>
                            </div>

                            {/* Check-in / Check-out */}
                            {selectedRecord.status !== "absent" && (
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1">
                                    <div className="flex items-center gap-2 text-gray-700 font-medium">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span>Check-in:</span>
                                        <span className="font-semibold">{selectedRecord.checkIn}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700 font-medium mt-1">
                                        <XCircle className="h-4 w-4 text-red-500" />
                                        <span>Check-out:</span>
                                        <span className="font-semibold">{selectedRecord.checkOut}</span>
                                    </div>
                                </div>
                            )}

                            {/* Patients */}
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <p className="font-semibold text-gray-700 flex items-center gap-2 mb-2">
                                    <Users className="h-5 w-5 text-blue-500" />
                                    Patients Attended:
                                </p>
                                {selectedRecord.patients.length > 0 ? (
                                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                                        {selectedRecord.patients.map((p) => (
                                            <li key={p}>{p}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-400">No patients</p>
                                )}
                            </div>

                            {/* Other Events */}
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <p className="font-semibold text-gray-700 mb-2">Other Events:</p>
                                {selectedRecord.events.length > 0 ? (
                                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                                        {selectedRecord.events.map((e) => (
                                            <li key={e}>{e}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-400">No events</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <p className="text-gray-500 italic">Click a date to see attendance details</p>
                    )}
                </CardContent>
            </Card>

        </div >
    );
}