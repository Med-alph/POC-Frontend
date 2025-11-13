import { useState, useEffect, useRef } from "react";
import DoctorAppointments from "./DoctorAppointments";
import { CalendarDays, UserX, Clock, CheckCircle2, XCircle, Stethoscope, Timer, LogIn, LogOut } from "lucide-react";
import TodaysSchedule from "./comps/TodaysSchedule";
import { useSelector } from "react-redux";
import appointmentsAPI from "../api/appointmentsapi";
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DoctorDashboard = () => {
  const [isLoaded, setIsLoaded] = useState(true);
  const [todaysData, setTodaysData] = useState(null);
  const [upcomingData, setUpcomingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
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
        setTodaysData(response);
      } catch (err) {
        toast.error("Failed to load today's appointments");
      } finally {
        setLoading(false);
      }
    };
    fetchTodaysAppointments();
  }, []);

  // Fetch upcoming appointments (future 7 days)
  useEffect(() => {
    const fetchUpcomingAppointments = async () => {
      try {
        setLoadingUpcoming(true);
        const response = await appointmentsAPI.getUpcomingAppointments();
        setUpcomingData(response);
      } catch (err) {
        toast.error("Failed to load upcoming appointments");
      } finally {
        setLoadingUpcoming(false);
      }
    };
    fetchUpcomingAppointments();
  }, []);

  // Check-in/out logic remains unchanged...
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
    return () => clearInterval(intervalRef.current);
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

  const formatDateTime = (dateStr, timeStr) => {
    try {
      const date = new Date(`${dateStr}T${timeStr}`);
      return date.toLocaleString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return `${dateStr} ${timeStr}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 lg:p-8 transition-all relative">
      {/* Check-in/Check-out Card - Fixed in top-right corner */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50">
        <Card className={`shadow-2xl border-0 rounded-2xl overflow-hidden transition-all backdrop-blur-sm ${
          isCheckedIn 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-300 dark:border-green-700' 
            : 'bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700'
        }`}>
          <CardContent className="p-4">
            <div className="flex flex-col items-center gap-3 min-w-[180px]">
              <div className="flex items-center gap-2 w-full justify-center">
                <div className={`p-2 rounded-lg ${
                  isCheckedIn 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  <Timer className="h-4 w-4" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    {isCheckedIn ? "Working" : "Status"}
                  </p>
                  <p className={`text-xl font-bold ${
                    isCheckedIn 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {isCheckedIn
                      ? formatTime(elapsedTime)
                      : elapsedTime > 0
                        ? formatTime(elapsedTime)
                        : "00:00:00"
                    }
                  </p>
                </div>
              </div>
              {isCheckedIn ? (
                <Button
                  onClick={handleCheckOut}
                  className="bg-red-600 hover:bg-red-700 text-white h-10 px-4 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 w-full text-sm"
                >
                  <LogOut className="h-4 w-4" />
                  Check Out
                </Button>
              ) : (
                <Button
                  onClick={handleCheckIn}
                  className="bg-green-600 hover:bg-green-700 text-white h-10 px-4 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 w-full text-sm"
                >
                  <LogIn className="h-4 w-4" />
                  Check In
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          {/* <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg mb-4">
            <Stethoscope className="h-6 w-6" />
            <span className="text-sm font-semibold">Doctor Dashboard</span>
          </div> */}
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Good Morning, {user?.name || "Doctor"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
              Here's your live attendance tracker and today's schedule
            </p>
          </div>
        </div>

        {/* First row with 3 cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Today's appointments card */}
          <div>
            <DoctorAppointments
              appointments={todaysData?.appointments || []}
              loading={loading}
            />
          </div>

          {/* Cancellations Today */}
          <Card className={`shadow-xl border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <CardHeader className="bg-gradient-to-r from-red-600 via-red-500 to-rose-500 text-white p-6">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                  <UserX className="h-6 w-6" />
                </div>
                Cancellations Today
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                  {loading ? (
                    <span className="text-3xl">...</span>
                  ) : (
                    todaysData?.stats?.cancelled || 0
                  )}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {loading ? "Loading..." : "Appointments cancelled"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className={`shadow-xl border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <CardHeader className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 text-white p-6">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Clock className="h-6 w-6" />
                </div>
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Completed</span>
                    </div>
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      {todaysData?.stats?.completed || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Pending</span>
                    </div>
                    <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                      {todaysData?.stats?.pending || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Cancelled</span>
                    </div>
                    <span className="text-xl font-bold text-red-600 dark:text-red-400">
                      {todaysData?.stats?.cancelled || 0}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Second row with 3 col grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule - first column */}
          <div>
            <TodaysSchedule
              appointments={todaysData?.appointments || []}
              loading={loading}
            />
          </div>

          {/* Upcoming Appointments - second column */}
          <Card className="shadow-xl border-0 rounded-2xl dark:bg-gray-800 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
            <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 text-white p-6">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                  <CalendarDays className="h-6 w-6" />
                </div>
                Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loadingUpcoming ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Loading upcoming appointments...</p>
                </div>
              ) : upcomingData && upcomingData.appointments?.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {upcomingData.appointments.map((apt) => {
                    const statusColors = {
                      booked: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                      cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                    };
                    return (
                      <div
                        key={apt.id}
                        className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white mb-1 truncate">
                              {apt.patient_name || 'Unknown Patient'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDateTime(apt.appointment_date, apt.appointment_time)}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                            statusColors[apt.status?.toLowerCase()] || statusColors.booked
                          }`}>
                            {apt.status?.toUpperCase() || 'BOOKED'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarDays className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No upcoming appointments in the next 7 days.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Empty third column for spacing */}
          <div></div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
