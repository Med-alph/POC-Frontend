import { useState, useEffect, useRef } from "react";
import DoctorAppointments from "./DoctorAppointments";
import { CalendarDays, UserX, Clock, CheckCircle2, Timer, LogIn, LogOut } from "lucide-react";
// import TodaysSchedule from "./comps/TodaysSchedule"; // Commented out - using NextHoursChart instead
import { useSelector } from "react-redux";
import appointmentsAPI from "../api/appointmentsapi";
import attendanceAPI from "../api/attendanceapi";
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
  const [scheduledHours, setScheduledHours] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [lateByMinutes, setLateByMinutes] = useState(null);
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

  // Check-in/out logic with backend integration
  useEffect(() => {
    const fetchTodayStatus = async () => {
      if (!user?.id) return;
      
      try {
        console.log('🔍 Fetching today status for user:', user.id);
        const response = await attendanceAPI.getTodayStatus(user.id);
        console.log('📊 Today status response:', response);
        
        if (response.success && response.data) {
          const { 
            id, 
            check_in_time, 
            check_out_time, 
            elapsed_seconds, 
            total_hours,
            scheduled_start_time,
            scheduled_end_time,
            attendance_status,
            late_by_minutes
          } = response.data;
          console.log('✅ Attendance data:', { 
            id, check_in_time, check_out_time, elapsed_seconds, total_hours,
            scheduled_start_time, scheduled_end_time, attendance_status, late_by_minutes
          });
          
          // Set scheduled hours and status
          if (scheduled_start_time && scheduled_end_time) {
            setScheduledHours(`${scheduled_start_time} - ${scheduled_end_time}`);
          }
          setAttendanceStatus(attendance_status);
          setLateByMinutes(late_by_minutes);
          
          if (check_in_time && !check_out_time) {
            // Currently checked in - active session
            console.log('✅ User is checked in, starting timer');
            localStorage.setItem("attendanceId", id);
            localStorage.setItem("checkInTime", new Date(check_in_time).getTime().toString());
            setIsCheckedIn(true);
            setElapsedTime(elapsed_seconds || 0);
            
            // Start timer
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            intervalRef.current = setInterval(() => {
              setElapsedTime((prev) => prev + 1);
            }, 1000);
          } else if (check_out_time) {
            // Already checked out - show completed session info
            console.log('✅ Session completed, total hours:', total_hours);
            setIsCheckedIn(false);
            // Show total hours worked today instead of 0
            setElapsedTime(total_hours ? Math.floor(total_hours * 3600) : 0);
            localStorage.removeItem("attendanceId");
            localStorage.removeItem("checkInTime");
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
          } else {
            // No check-in yet today
            console.log('⚠️ No check-in yet today');
            setIsCheckedIn(false);
            setElapsedTime(0);
            localStorage.removeItem("attendanceId");
            localStorage.removeItem("checkInTime");
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
          }
        } else {
          // No attendance record for today
          console.log('⚠️ No attendance record for today');
          setIsCheckedIn(false);
          setElapsedTime(0);
          localStorage.removeItem("attendanceId");
          localStorage.removeItem("checkInTime");
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      } catch (error) {
        console.error('❌ Failed to fetch today status:', error);
        // Don't reset state on error - keep existing state
      }
    };

    fetchTodayStatus();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user?.id]);

  const handleCheckIn = async () => {
    if (!user?.id || !user?.hospital_id) {
      toast.error('User information not available');
      return;
    }

    try {
      const response = await attendanceAPI.checkIn({
        staff_id: user.id,
        hospital_id: user.hospital_id,
      });

      if (response.success) {
        const { 
          id, 
          check_in_time, 
          scheduled_start_time, 
          scheduled_end_time, 
          attendance_status, 
          late_by_minutes 
        } = response.data;
        
        localStorage.setItem("attendanceId", id);
        localStorage.setItem("checkInTime", new Date(check_in_time).getTime().toString());
        setIsCheckedIn(true);
        setElapsedTime(0);
        
        // Set scheduled hours and status
        if (scheduled_start_time && scheduled_end_time) {
          setScheduledHours(`${scheduled_start_time} - ${scheduled_end_time}`);
        }
        setAttendanceStatus(attendance_status);
        setLateByMinutes(late_by_minutes);
        
        intervalRef.current = setInterval(() => {
          setElapsedTime((prev) => prev + 1);
        }, 1000);

        // Show status-specific message
        let message = 'Checked in successfully!';
        if (attendance_status === 'late' && late_by_minutes) {
          message = `Checked in (Late by ${late_by_minutes} mins)`;
        } else if (attendance_status === 'very_late' && late_by_minutes) {
          message = `Checked in (Very Late - ${late_by_minutes} mins)`;
        } else if (attendance_status === 'early') {
          message = 'Checked in (Early arrival)';
        } else if (attendance_status === 'on_time') {
          message = 'Checked in (On Time)';
        }
        toast.success(message);
      }
    } catch (error) {
      console.error('Check-in failed:', error);
      toast.error(error.message || 'Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    const attendanceId = localStorage.getItem("attendanceId");
    
    if (!attendanceId) {
      toast.error('No active check-in found');
      return;
    }

    try {
      const response = await attendanceAPI.checkOut(attendanceId);

      if (response.success) {
        setIsCheckedIn(false);
        clearInterval(intervalRef.current);
        localStorage.removeItem("attendanceId");
        localStorage.removeItem("checkInTime");

        const hours = response.data.total_hours || 0;
        toast.success(`Checked out successfully! Session hours: ${hours.toFixed(2)}`);

        // Fetch updated today's status to show cumulative total
        try {
          const statusResponse = await attendanceAPI.getTodayStatus(user.id);
          console.log('📊 Updated status after checkout:', statusResponse);
          
          if (statusResponse.success && statusResponse.data) {
            const { total_hours } = statusResponse.data;
            // Show cumulative total hours for all sessions today
            if (total_hours) {
              setElapsedTime(Math.floor(total_hours * 3600));
              console.log('✅ Updated total hours:', total_hours);
            } else {
              setElapsedTime(0);
            }
          } else {
            setElapsedTime(0);
          }
        } catch (error) {
          console.error('Failed to fetch updated status:', error);
          setElapsedTime(0);
        }
      }
    } catch (error) {
      console.error('Check-out failed:', error);
      toast.error(error.message || 'Failed to check out');
    }
  };

  const formatTime = (seconds) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      on_time: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800',
        label: 'On Time',
        icon: '🟢'
      },
      early: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
        label: 'Early',
        icon: '🔵'
      },
      late: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-400',
        border: 'border-yellow-200 dark:border-yellow-800',
        label: 'Late',
        icon: '🟡'
      },
      very_late: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
        label: 'Very Late',
        icon: '🔴'
      }
    };
    return badges[status] || null;
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
              <div className="flex items-center gap-4 min-w-[280px]">
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
                  {/* Scheduled Hours - Always show if available */}
                  {scheduledHours && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Scheduled: {scheduledHours}
                    </p>
                  )}
                  
                  {/* Status Badge - Only show when checked in */}
                  {attendanceStatus && isCheckedIn && (
                    <div className="mb-1">
                      {(() => {
                        const badge = getStatusBadge(attendanceStatus);
                        return badge ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
                            <span>{badge.icon}</span>
                            {badge.label}
                            {lateByMinutes && (attendanceStatus === 'late' || attendanceStatus === 'very_late') && (
                              <span className="ml-1">({lateByMinutes} mins)</span>
                            )}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">
                    {isCheckedIn ? "Current Session" : elapsedTime > 0 ? "Today's Total" : "Status"}
                  </p>
                  <p className={`text-lg font-semibold ${
                    isCheckedIn 
                      ? 'text-green-600 dark:text-green-400' 
                      : elapsedTime > 0
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {formatTime(elapsedTime)}
                  </p>
                  {!isCheckedIn && elapsedTime > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Completed
                    </p>
                  )}
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
                    {elapsedTime > 0 ? "New Session" : "Check In"}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Appointments */}
          <div className="lg:col-span-1">
            <DoctorAppointments
              appointments={todaysData?.appointments || []}
              loading={loading}
            />
          </div>

          {/* Today's Schedule - COMMENTED OUT: Using NextHoursChart instead which shows proper timing */}
          {/* <div className="lg:col-span-1">
            <TodaysSchedule
              appointments={todaysData?.appointments || []}
              loading={loading}
            />
          </div> */}

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
                        pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
                        cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
                        confirmed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
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
                              statusColors[apt.status?.toLowerCase()] || statusColors.pending
                            }`}>
                              {apt.status?.toUpperCase() || 'PENDING'}
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
