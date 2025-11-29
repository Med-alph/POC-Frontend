import { useState, useEffect, useRef } from "react";
import DoctorAppointments from "./DoctorAppointments";
import { CalendarDays, UserX, Clock, CheckCircle2, XCircle, Stethoscope, Timer, LogIn, LogOut } from "lucide-react";
import TodaysSchedule from "./comps/TodaysSchedule";
import { useSelector } from "react-redux";
import appointmentsAPI from "../api/appointmentsapi";
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NextHoursChart from "@/components/charts/NextHoursChart";

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
              Good Morning, {user?.name || "Doctor"}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Here's your live attendance tracker and today's schedule
            </p>
          </div>
          {/* Check-in/Check-out Card */}
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-4 min-w-[200px]">
                <div className={`p-2 rounded-md ${
                  isCheckedIn 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <Timer className={`h-4 w-4 ${
                    isCheckedIn 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">
                    {isCheckedIn ? "Working" : "Status"}
                  </p>
                  <p className={`text-lg font-semibold ${
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
                {isCheckedIn ? (
                  <Button
                    onClick={handleCheckOut}
                    className="bg-red-600 hover:bg-red-700 text-white h-9 px-4 text-sm font-medium rounded-md"
                  >
                    <LogOut className="h-4 w-4 mr-1.5" />
                    Check Out
                  </Button>
                ) : (
                  <Button
                    onClick={handleCheckIn}
                    className="bg-green-600 hover:bg-green-700 text-white h-9 px-4 text-sm font-medium rounded-md"
                  >
                    <LogIn className="h-4 w-4 mr-1.5" />
                    Check In
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cancellations Today */}
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UserX className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                Cancellations Today
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-4xl font-semibold text-gray-900 dark:text-white mb-1">
                  {loading ? (
                    <span className="text-2xl">...</span>
                  ) : (
                    todaysData?.stats?.cancelled || 0
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {loading ? "Loading..." : "Appointments cancelled"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Completed */}
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-4xl font-semibold text-gray-900 dark:text-white mb-1">
                  {loading ? (
                    <span className="text-2xl">...</span>
                  ) : (
                    todaysData?.stats?.completed || 0
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Appointments completed
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pending */}
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-4xl font-semibold text-gray-900 dark:text-white mb-1">
                  {loading ? (
                    <span className="text-2xl">...</span>
                  ) : (
                    todaysData?.stats?.pending || 0
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Appointments pending
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Section - Full Width */}
        <div className="grid grid-cols-1 gap-6">
          <NextHoursChart userId={user?.id} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Appointments */}
          <div className="lg:col-span-1">
            <DoctorAppointments
              appointments={todaysData?.appointments || []}
              loading={loading}
            />
          </div>

          {/* Today's Schedule */}
          <div className="lg:col-span-1">
            <TodaysSchedule
              appointments={todaysData?.appointments || []}
              loading={loading}
            />
          </div>

          {/* Upcoming Appointments */}
          <div className="lg:col-span-1">
            <Card className="border border-gray-200 dark:border-gray-700 h-full">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  Upcoming Appointments
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {loadingUpcoming ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
                  </div>
                ) : upcomingData && upcomingData.appointments?.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {upcomingData.appointments.map((apt) => {
                      const statusColors = {
                        booked: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
                        cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
                        pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
                      };
                      return (
                        <div
                          key={apt.id}
                          className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 dark:text-white truncate mb-0.5">
                                {apt.patient_name || 'Unknown Patient'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDateTime(apt.appointment_date, apt.appointment_time)}
                              </p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
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
                    <CalendarDays className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming appointments</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
