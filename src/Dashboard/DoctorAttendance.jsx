import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Calendar, Clock, TrendingUp, FileText, Plus, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import attendanceAPI from "../api/attendanceapi";
import toast, { Toaster } from "react-hot-toast";

console.log('🔵 DoctorAttendance.jsx file loaded');

const DoctorAttendance = () => {
  console.log('🟢 DoctorAttendance component rendering...');
  
  const user = useSelector((state) => state.auth.user);
  
  console.log('🟡 DoctorAttendance mounted, user:', user);
  
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Leave management state
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveList, setLeaveList] = useState([]);
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'sick',
    start_date: '',
    end_date: '',
    reason: ''
  });
  
  // Permission management state
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionList, setPermissionList] = useState([]);
  const [permissionForm, setPermissionForm] = useState({
    permission_date: '',
    start_time: '',
    end_time: '',
    reason: ''
  });

  useEffect(() => {
    console.log('useEffect triggered, user:', user, 'month:', currentMonth, 'year:', currentYear);
    if (user?.id) {
      console.log('Calling fetchAttendanceData...');
      fetchAttendanceData();
    } else {
      console.log('User ID not available, skipping fetch');
    }
  }, [user?.id, currentMonth, currentYear]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      console.log('Fetching attendance data for:', user.id, currentMonth, currentYear);
      
      const [historyRes, summaryRes, balanceRes, leaveRes] = await Promise.all([
        attendanceAPI.getHistory(user.id, { month: currentMonth, year: currentYear }),
        attendanceAPI.getMonthlySummary(user.id, currentMonth, currentYear),
        attendanceAPI.getLeaveBalance(user.id, currentYear),
        attendanceAPI.getLeaveList(user.id, { limit: 100 }),
      ]);

      console.log('History response:', historyRes);
      console.log('Summary response:', summaryRes);
      console.log('Balance response:', balanceRes);
      console.log('Leave response:', leaveRes);

      if (historyRes.success) {
        setAttendanceHistory(historyRes.data || []);
      }
      if (summaryRes.success) {
        setMonthlySummary(summaryRes.data);
      }
      if (balanceRes.success) {
        setLeaveBalance(balanceRes.data);
      }
      if (leaveRes.success) {
        setLeaveList(leaveRes.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch attendance data:", error);
      toast.error(error.message || "Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveList = async () => {
    try {
      const response = await attendanceAPI.getLeaveList(user.id, { limit: 50 });
      if (response.success) {
        setLeaveList(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch leave list:", error);
    }
  };

  const fetchPermissionList = async () => {
    try {
      const response = await attendanceAPI.getPermissionList(user.id, { limit: 50 });
      if (response.success) {
        setPermissionList(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch permission list:", error);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await attendanceAPI.applyLeave({
        staff_id: user.id,
        hospital_id: user.hospital_id,
        ...leaveForm
      });
      
      if (response.success) {
        toast.success('Leave application submitted successfully!');
        setShowLeaveModal(false);
        setLeaveForm({ leave_type: 'sick', start_date: '', end_date: '', reason: '' });
        fetchLeaveList();
        fetchAttendanceData(); // Refresh balance
      }
    } catch (error) {
      toast.error(error.message || 'Failed to apply leave');
    }
  };

  const handlePermissionSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await attendanceAPI.requestPermission({
        staff_id: user.id,
        hospital_id: user.hospital_id,
        ...permissionForm
      });
      
      if (response.success) {
        toast.success('Permission request submitted successfully!');
        setShowPermissionModal(false);
        setPermissionForm({ permission_date: '', start_time: '', end_time: '', reason: '' });
        fetchPermissionList();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to request permission');
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    const date = new Date(timeString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      checked_in: "bg-blue-100 text-blue-700",
      checked_out: "bg-green-100 text-green-700",
      incomplete: "bg-yellow-100 text-yellow-700",
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || "bg-gray-100 text-gray-700"}`}>
        {status?.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  const [activeTab, setActiveTab] = useState('attendance');

  useEffect(() => {
    if (activeTab === 'leave') {
      fetchLeaveList();
    } else if (activeTab === 'permission') {
      fetchPermissionList();
    }
  }, [activeTab]);

  console.log('🔴 Rendering DoctorAttendance component');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance & Leave Management</h1>
          <div className="flex gap-2">
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              className="px-3 py-2 border rounded-lg"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2025, i).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className="px-3 py-2 border rounded-lg"
            >
              {[2024, 2025, 2026].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 font-medium ${activeTab === 'attendance' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Attendance
          </button>
          <button
            onClick={() => setActiveTab('leave')}
            className={`px-4 py-2 font-medium ${activeTab === 'leave' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Leave Management
          </button>
          {/* TODO: Uncomment for future use - Permission Requests Tab */}
          {/* <button
            onClick={() => setActiveTab('permission')}
            className={`px-4 py-2 font-medium ${activeTab === 'permission' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Permission Requests
          </button> */}
        </div>

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Present Days</p>
                  <p className="text-2xl font-bold">{monthlySummary?.present_days || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">This month</p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Today's Hours</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {(() => {
                      const today = new Date().toISOString().split('T')[0];
                      const todayRecords = attendanceHistory.filter(r => r.date === today);
                      const todayHours = todayRecords.reduce((sum, r) => sum + (Number(r.total_hours) || 0), 0);
                      return todayHours.toFixed(1);
                    })()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Monthly Hours</p>
                  <p className="text-2xl font-bold">{monthlySummary?.total_hours_worked ? Number(monthlySummary.total_hours_worked).toFixed(1) : 0}</p>
                  <p className="text-xs text-gray-400 mt-1">Total this month</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg Hours/Day</p>
                  <p className="text-2xl font-bold">{monthlySummary?.average_hours_per_day ? Number(monthlySummary.average_hours_per_day).toFixed(1) : 0}</p>
                  <p className="text-xs text-gray-400 mt-1">This month</p>
                </div>
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leave Balance */}
        {leaveBalance && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Leave Balance {currentYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Sick Leave</p>
                  <p className="text-xl font-bold text-blue-600">
                    {leaveBalance.sick_leave?.remaining || 0} / {leaveBalance.sick_leave?.total || 0}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Casual Leave</p>
                  <p className="text-xl font-bold text-green-600">
                    {leaveBalance.casual_leave?.remaining || 0} / {leaveBalance.casual_leave?.total || 0}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Earned Leave</p>
                  <p className="text-xl font-bold text-purple-600">
                    {leaveBalance.earned_leave?.remaining || 0} / {leaveBalance.earned_leave?.total || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calendar View with Day Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button
                  onClick={() => {
                    if (currentMonth === 1) {
                      setCurrentMonth(12);
                      setCurrentYear(currentYear - 1);
                    } else {
                      setCurrentMonth(currentMonth - 1);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-lg">
                  {new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </CardTitle>
                <Button
                  onClick={() => {
                    if (currentMonth === 12) {
                      setCurrentMonth(1);
                      setCurrentYear(currentYear + 1);
                    } else {
                      setCurrentMonth(currentMonth + 1);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
                const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
                const days = [];
                
                // Empty cells for days before month starts
                for (let i = 0; i < firstDay; i++) {
                  days.push(<div key={`empty-${i}`} className="h-16"></div>);
                }
                
                // Helper function to check if date has approved leave
                const getApprovedLeaveForDate = (dateStr) => {
                  return leaveList.find(leave => {
                    if (leave.status !== 'approved') return false;
                    const leaveStart = new Date(leave.start_date).toISOString().split('T')[0];
                    const leaveEnd = new Date(leave.end_date).toISOString().split('T')[0];
                    return dateStr >= leaveStart && dateStr <= leaveEnd;
                  });
                };
                
                // Days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayRecords = attendanceHistory.filter(r => r.date === dateStr);
                  const totalHours = dayRecords.reduce((sum, r) => sum + (Number(r.total_hours) || 0), 0);
                  const approvedLeave = getApprovedLeaveForDate(dateStr);
                  const isPresent = dayRecords.length > 0;
                  const isOnLeave = !!approvedLeave;
                  const isSelected = selectedDate === dateStr;
                  const isToday = dateStr === new Date().toISOString().split('T')[0];
                  
                  days.push(
                    <button
                      key={day}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`h-16 p-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                          : isToday
                            ? 'border-blue-300 dark:border-blue-700'
                            : 'border-gray-200 dark:border-gray-700'
                      } ${
                        isOnLeave
                          ? 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-800'
                          : isPresent 
                            ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30' 
                            : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{day}</div>
                      {isOnLeave && (
                        <div className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-0.5">
                          Leave
                        </div>
                      )}
                      {isPresent && !isOnLeave && (
                        <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-0.5">
                          {totalHours.toFixed(1)}h
                        </div>
                      )}
                      {isToday && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">Today</div>
                      )}
                    </button>
                  );
                }
                
                return (
                  <div>
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2">
                          {day}
                        </div>
                      ))}
                    </div>
                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-2">
                      {days}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Selected Day Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {new Date(selectedDate).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const dayRecords = attendanceHistory.filter(r => r.date === selectedDate);
                // Sort by check-in time (earliest first)
                const sortedRecords = [...dayRecords].sort((a, b) => {
                  const timeA = new Date(a.check_in_time).getTime();
                  const timeB = new Date(b.check_in_time).getTime();
                  return timeA - timeB;
                });
                const totalHours = dayRecords.reduce((sum, r) => sum + (Number(r.total_hours) || 0), 0);
                
                // Check for approved leave on this date
                const approvedLeave = leaveList.find(leave => {
                  if (leave.status !== 'approved') return false;
                  const leaveStart = new Date(leave.start_date).toISOString().split('T')[0];
                  const leaveEnd = new Date(leave.end_date).toISOString().split('T')[0];
                  return selectedDate >= leaveStart && selectedDate <= leaveEnd;
                });
                
                if (dayRecords.length === 0 && !approvedLeave) {
                  return (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No attendance record</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Absent on this day</p>
                    </div>
                  );
                }
                
                // Show leave information if on approved leave
                if (approvedLeave) {
                  return (
                    <div className="space-y-4">
                      {/* Leave Status */}
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                          <p className="text-sm font-semibold text-orange-900 dark:text-orange-300">On Approved Leave</p>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Leave Type:</span>
                            <span className="font-medium text-gray-900 dark:text-white capitalize">
                              {approvedLeave.leave_type}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {new Date(approvedLeave.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              {approvedLeave.start_date !== approvedLeave.end_date && 
                                ` - ${new Date(approvedLeave.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Total Days:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {approvedLeave.total_days} {approvedLeave.total_days === 1 ? 'day' : 'days'}
                            </span>
                          </div>
                          {approvedLeave.reason && (
                            <div className="pt-2 border-t border-orange-200 dark:border-orange-800">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reason:</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{approvedLeave.reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Show attendance records if any (in case doctor worked despite leave) */}
                      {dayRecords.length > 0 && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
                          <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium mb-1">
                            ⚠️ Note: Attendance recorded despite approved leave
                          </p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-400">
                            {totalHours.toFixed(1)} hours worked on this leave day
                          </p>
                        </div>
                      )}
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-4">
                    {/* Total Hours Summary */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Hours</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalHours.toFixed(1)}h</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {sortedRecords.length} {sortedRecords.length === 1 ? 'session' : 'sessions'}
                      </p>
                    </div>
                    
                    {/* Sessions List */}
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sessions</p>
                      {sortedRecords.map((record, idx) => (
                        <div key={record.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Session {idx + 1}
                            </span>
                            {record.attendance_status && (
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                record.attendance_status === 'on_time' 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : record.attendance_status === 'late'
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    : record.attendance_status === 'very_late'
                                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}>
                                {record.attendance_status.replace('_', ' ').toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Check In:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {record.check_in_time 
                                  ? new Date(record.check_in_time).toLocaleTimeString('en-US', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })
                                  : '-'
                                }
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Check Out:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {record.check_out_time 
                                  ? new Date(record.check_out_time).toLocaleTimeString('en-US', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })
                                  : record.status === 'checked_in'
                                    ? <span className="text-green-600 dark:text-green-400">Active</span>
                                    : '-'
                                }
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                              <span className="font-bold text-blue-600 dark:text-blue-400">
                                {record.total_hours ? `${Number(record.total_hours).toFixed(2)}h` : '-'}
                              </span>
                            </div>
                            {record.scheduled_start_time && record.scheduled_end_time && (
                              <div className="flex justify-between text-xs mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span className="text-gray-500 dark:text-gray-400">Scheduled:</span>
                                <span className="text-gray-600 dark:text-gray-300">
                                  {record.scheduled_start_time} - {record.scheduled_end_time}
                                </span>
                              </div>
                            )}
                            {record.late_by_minutes && (record.attendance_status === 'late' || record.attendance_status === 'very_late') && (
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500 dark:text-gray-400">Late by:</span>
                                <span className="text-red-600 dark:text-red-400 font-medium">
                                  {record.late_by_minutes} mins
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Attendance History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Attendance History</CardTitle>
              <Button
                onClick={fetchAttendanceData}
                variant="outline"
                size="sm"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 h-8 px-3 text-xs font-medium rounded-md flex items-center gap-1.5"
                disabled={loading}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8">Loading...</p>
            ) : attendanceHistory.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No attendance records found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-semibold">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Check In</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Check Out</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Total Hours</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceHistory.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{formatDate(record.date)}</td>
                        <td className="py-3 px-4">{formatTime(record.check_in_time)}</td>
                        <td className="py-3 px-4">{formatTime(record.check_out_time)}</td>
                        <td className="py-3 px-4">{record.total_hours ? Number(record.total_hours).toFixed(2) : "-"}</td>
                        <td className="py-3 px-4">{getStatusBadge(record.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        </>
        )}

        {/* Leave Management Tab */}
        {activeTab === 'leave' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Leave Management</h2>
              <Button onClick={() => setShowLeaveModal(true)} className="bg-blue-600">
                <Plus className="h-4 w-4 mr-2" />
                Apply Leave
              </Button>
            </div>

            {/* Leave Balance */}
            {leaveBalance && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Leave Balance {currentYear}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Sick Leave</p>
                      <p className="text-xl font-bold text-blue-600">
                        {leaveBalance.sick_leave?.remaining || 0} / {leaveBalance.sick_leave?.total || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Casual Leave</p>
                      <p className="text-xl font-bold text-green-600">
                        {leaveBalance.casual_leave?.remaining || 0} / {leaveBalance.casual_leave?.total || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Earned Leave</p>
                      <p className="text-xl font-bold text-purple-600">
                        {leaveBalance.earned_leave?.remaining || 0} / {leaveBalance.earned_leave?.total || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Leave History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Leave History</CardTitle>
              </CardHeader>
              <CardContent>
                {leaveList.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No leave requests found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-semibold">Type</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold">Start Date</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold">End Date</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold">Days</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold">Reason</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaveList.map((leave) => (
                          <tr key={leave.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 capitalize">{leave.leave_type}</td>
                            <td className="py-3 px-4">{formatDate(leave.start_date)}</td>
                            <td className="py-3 px-4">{formatDate(leave.end_date)}</td>
                            <td className="py-3 px-4">{leave.total_days}</td>
                            <td className="py-3 px-4">{leave.reason}</td>
                            <td className="py-3 px-4">{getStatusBadge(leave.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TODO: Uncomment for future use - Permission Requests Tab Content */}
        {/* {activeTab === 'permission' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Permission Requests</h2>
              <Button onClick={() => setShowPermissionModal(true)} className="bg-blue-600">
                <Plus className="h-4 w-4 mr-2" />
                Request Permission
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Permission History</CardTitle>
              </CardHeader>
              <CardContent>
                {permissionList.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No permission requests found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-semibold">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold">Start Time</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold">End Time</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold">Duration</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold">Reason</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {permissionList.map((permission) => (
                          <tr key={permission.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{formatDate(permission.permission_date)}</td>
                            <td className="py-3 px-4">{permission.start_time}</td>
                            <td className="py-3 px-4">{permission.end_time}</td>
                            <td className="py-3 px-4">{permission.duration_hours}h</td>
                            <td className="py-3 px-4">{permission.reason}</td>
                            <td className="py-3 px-4">{getStatusBadge(permission.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )} */}

        {/* Leave Application Modal */}
        {showLeaveModal && (
          <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Apply for Leave</h3>
              <form onSubmit={handleLeaveSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Leave Type</label>
                  <select
                    value={leaveForm.leave_type}
                    onChange={(e) => setLeaveForm({...leaveForm, leave_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="sick">Sick Leave</option>
                    <option value="casual">Casual Leave</option>
                    <option value="earned">Earned Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                    <option value="emergency">Emergency Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Start Date</label>
                  <input
                    type="date"
                    value={leaveForm.start_date}
                    onChange={(e) => setLeaveForm({...leaveForm, start_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">End Date</label>
                  <input
                    type="date"
                    value={leaveForm.end_date}
                    onChange={(e) => setLeaveForm({...leaveForm, end_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Reason</label>
                  <textarea
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">Submit</Button>
                  <Button type="button" onClick={() => setShowLeaveModal(false)} className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Cancel</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TODO: Uncomment for future use - Permission Request Modal */}
        {/* {showPermissionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Request Permission</h3>
              <form onSubmit={handlePermissionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={permissionForm.permission_date}
                    onChange={(e) => setPermissionForm({...permissionForm, permission_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    value={permissionForm.start_time}
                    onChange={(e) => setPermissionForm({...permissionForm, start_time: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    type="time"
                    value={permissionForm.end_time}
                    onChange={(e) => setPermissionForm({...permissionForm, end_time: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Reason</label>
                  <textarea
                    value={permissionForm.reason}
                    onChange={(e) => setPermissionForm({...permissionForm, reason: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-blue-600">Submit</Button>
                  <Button type="button" onClick={() => setShowPermissionModal(false)} className="flex-1 bg-gray-300">Cancel</Button>
                </div>
              </form>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default DoctorAttendance;
