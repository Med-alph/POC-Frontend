import { useState, useEffect, useRef } from "react";
import DoctorAppointments from "./DoctorAppointments";
import { CalendarDays, Users, UserX, Stethoscope, TrendingUp, BarChart2, Clock } from "lucide-react";
import TodaysSchedule from "./comps/TodaysSchedule";
import { useSelector } from "react-redux";
import appointmentsAPI from "../API/AppointmentsAPI";
import toast from 'react-hot-toast';

const DoctorDashboard = () => {
    const [isLoaded, setIsLoaded] = useState(true);
    const [todaysData, setTodaysData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const intervalRef = useRef(null);

    const user = useSelector((state) => state.auth.user);

    // Fetch today's appointments
    useEffect(() => {
        const fetchTodaysAppointments = async () => {
            try {
                setLoading(true);
                const response = await appointmentsAPI.getTodaysAppointments();
                console.log("Today's appointments:", response);
                setTodaysData(response);
            } catch (err) {
                console.error("Failed to fetch today's appointments:", err);
                toast.error("Failed to load today's appointments");
            } finally {
                setLoading(false);
            }
        };

        fetchTodaysAppointments();
    }, []);

    // Check-in/Check-out logic
    useEffect(() => {
        const status = localStorage.getItem("isCheckedIn");
        const startTime = localStorage.getItem("checkInTime");

        if (status === "true" && startTime) {
            const now = Date.now();
            const prevElapsed = Math.floor((now - Number(startTime)) / 1000);
            setIsCheckedIn(true);
            setElapsedTime(prevElapsed);

            intervalRef.current = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
            }, 1000);
        }
    }, []);

    const handleCheckIn = () => {
        const now = Date.now();
        localStorage.setItem("isCheckedIn", "true");
        localStorage.setItem("checkInTime", now.toString());

        setIsCheckedIn(true);
        intervalRef.current = setInterval(() => {
            setElapsedTime((prev) => prev + 1);
        }, 1000);
    };

    const handleCheckOut = () => {
        setIsCheckedIn(false);
        clearInterval(intervalRef.current);

        localStorage.removeItem("isCheckedIn");
        localStorage.removeItem("checkInTime");
    };

    const formatTime = (seconds) => {
        const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
        const s = String(seconds % 60).padStart(2, "0");
        return `${h}:${m}:${s}`;
    };

    useEffect(() => {
        return () => clearInterval(intervalRef.current);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 transition-all">
            <div className="mb-6 flex items-center justify-between">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold">Good Morning, {user.name}</h1>
                    <p className="text-gray-600">Here's your live attendance tracker</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Live Time */}
                    <span className="text-sm font-medium text-gray-700">
                        {isCheckedIn
                            ? `Time Working: ${formatTime(elapsedTime)}`
                            : elapsedTime > 0
                                ? `Total Worked: ${formatTime(elapsedTime)}`
                                : "Not Checked In Yet"}
                    </span>

                    {/* Button */}
                    {isCheckedIn ? (
                        <button
                            onClick={handleCheckOut}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700"
                        >
                            Check Out
                        </button>
                    ) : (
                        <button
                            onClick={handleCheckIn}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
                        >
                            Check In
                        </button>
                    )}
                </div>
            </div>

            {/* Grid layout for cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="col-span-1 lg:col-span-1">
                    <DoctorAppointments 
                        appointments={todaysData?.appointments || []}
                        loading={loading}
                    />
                </div>

                {/* Card 2 - Cancellations */}
                <div className={`bg-white rounded-lg shadow p-3 sm:p-5 border-l-4 border-red-500 transition-all duration-700 delay-500 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${
                    isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}>
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <h2 className="text-xs sm:text-base font-semibold text-gray-700">Cancellations Today</h2>
                        <UserX className="h-4 w-4 sm:h-6 sm:w-6 text-red-500" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-3">
                        {loading ? "..." : todaysData?.stats?.cancelled || 0}
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-red-500 mt-1">
                        {loading ? "Loading..." : "See details"}
                    </p>
                </div>

                {/* Card 3 - Quick Stats */}
                <div className={`bg-white rounded-lg shadow p-3 sm:p-5 border-l-4 border-green-500 transition-all duration-700 delay-500 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${
                    isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}>
                    <h3 className="font-semibold text-gray-700 mb-2">Quick Stats</h3>
                    {loading ? (
                        <p className="text-sm text-gray-500">Loading...</p>
                    ) : (
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>✔️ Completed: {todaysData?.stats?.completed || 0}</li>
                            <li>⏳ Pending: {todaysData?.stats?.pending || 0}</li>
                            <li>❌ Cancelled: {todaysData?.stats?.cancelled || 0}</li>
                        </ul>
                    )}
                </div>

                <div className="col-span-1 lg:col-span-1">
                    <TodaysSchedule 
                        appointments={todaysData?.appointments || []}
                        loading={loading}
                    />
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;
