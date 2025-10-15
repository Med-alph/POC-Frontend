import React, { useState } from "react";

const AppointmentTimer = () => {
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);

    const handleStart = () => {
        const now = new Date();
        setStartTime(now);
        console.log("Consultation started at:", now.toLocaleString());
        // Send to backend → PATCH /appointments/:id { consultation_start_time: now }
    };

    const handleEnd = () => {
        const now = new Date();
        setEndTime(now);
        console.log("Consultation ended at:", now.toLocaleString());
        // Send to backend → PATCH /appointments/:id { consultation_end_time: now }
    };

    const handleReset = () => {
        setStartTime(null);
        setEndTime(null);
    }

    const calculateDuration = () => {
        if (!startTime || !endTime) return "—";
        const diffMs = endTime - startTime;
        const minutes = Math.floor(diffMs / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    };

    return (
        <div className="bg-white shadow rounded-lg p-4 mt-4">
            <h3 className="text-lg font-semibold mb-2">Consultation Timer</h3>
            <div className="flex gap-3">
                <button
                    onClick={handleStart}
                    className="bg-green-500 text-white px-4 py-2 rounded-md cursor-pointer"
                    disabled={!!startTime}
                >
                    Start Appointment
                </button>
                <button
                    onClick={handleEnd}
                    className="bg-red-500 text-white px-4 py-2 rounded-md cursor-pointer"
                    disabled={!startTime || !!endTime}
                >
                    End Appointment
                </button>
                <button
                    onClick={handleReset}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer"

                >
                    Reset
                </button>
            </div>

            <div className="mt-3 text-sm text-gray-700">
                <p><strong>Start:</strong> {startTime ? startTime.toLocaleTimeString() : "—"}</p>
                <p><strong>End:</strong> {endTime ? endTime.toLocaleTimeString() : "—"}</p>
                <p><strong>Duration:</strong> {calculateDuration()}</p>
            </div>
        </div>
    );
};

export default AppointmentTimer;
