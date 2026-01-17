import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle, XCircle, Clock, Calendar, User, ChevronDown,
  RefreshCw, TrendingUp, AlertCircle, FileText, AlertTriangle
} from "lucide-react";
import AdminAttendanceCalendar from "./AdminAttendanceCalendar";
import attendanceAPI from "../api/attendanceapi";
import staffApi from "../api/staffapi";
import { useHospital } from "../contexts/HospitalContext";
import toast from 'react-hot-toast';

export default function AdminAttendanceManagement() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  const { hospitalInfo } = useHospital();
  const user = useSelector((state) => state.auth.user);
  const HOSPITAL_ID = user?.hospital_id || hospitalInfo?.hospital_id;

  // Fetch all doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const response = await staffApi.getByHospital(HOSPITAL_ID, { limit: 100, offset: 0 });
        const activeDoctors = response.data.filter(
          (doc) => doc.status?.toLowerCase() === "active" && !doc.is_archived
        );
        setDoctors(activeDoctors);

        // Auto-select first doctor
        if (activeDoctors.length > 0 && !selectedDoctor) {
          setSelectedDoctor(activeDoctors[0]);
        }
      } catch (error) {
        console.error('Failed to fetch doctors:', error);
        toast.error('Failed to load doctors');
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, [HOSPITAL_ID]);

  // Fetch attendance data for selected doctor
  const fetchAttendanceData = async () => {
    if (!selectedDoctor?.id) return;

    try {
      setLoading(true);

      // Fetch history
      const historyResponse = await attendanceAPI.getHistory(
        selectedDoctor.id,
        { month: selectedMonth, year: selectedYear }
      );

      if (historyResponse.success) {
        setAttendanceHistory(historyResponse.data || []);
      }

      // Fetch monthly summary
      const summaryResponse = await attendanceAPI.getMonthlySummary(
        selectedDoctor.id,
        selectedMonth,
        selectedYear
      );

      if (summaryResponse.success) {
        setMonthlySummary(summaryResponse.data);
      }

      // Fetch leave data for the doctor (all approved leaves)
      const leaveResponse = await attendanceAPI.getLeaveList(
        selectedDoctor.id,
        { status: 'approved', limit: 100 }
      );

      if (leaveResponse.success) {
        setLeaves(leaveResponse.data || []);
      }

      // Fetch leave balance
      const balanceResponse = await attendanceAPI.getLeaveBalance(
        selectedDoctor.id,
        selectedYear
      );

      if (balanceResponse.success) {
        setLeaveBalance(balanceResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDoctor) {
      fetchAttendanceData();
    }
  }, [selectedDoctor?.id, selectedMonth, selectedYear]);

  // Calculate stats from history
  const totalPresent = attendanceHistory.filter((r) => r.status === "checked_out").length;
  const totalOnTime = attendanceHistory.filter((r) => r.attendance_status === "on_time").length;
  const totalLate = attendanceHistory.filter((r) => r.attendance_status === "late" || r.attendance_status === "very_late").length;

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      on_time: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800', label: 'On Time' },
      late: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800', label: 'Late' },
      very_late: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800', label: 'Very Late' },
      early: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', label: 'Early' },
      on_leave: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800', label: 'On Leave' },
    };
    const badge = badges[status] || { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700', label: status };
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
              Attendance Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View and monitor attendance records for all doctors
            </p>
          </div>
          <Button
            onClick={fetchAttendanceData}
            variant="outline"
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 h-9 px-4 text-sm font-medium rounded-md flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Doctor Selection */}
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              Select Doctor
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {loadingDoctors ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowDoctorDropdown(!showDoctorDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedDoctor?.staff_name || 'Select a doctor'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedDoctor?.department || 'No department'} • {selectedDoctor?.staff_code || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showDoctorDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showDoctorDropdown && (
                  <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {doctors.map((doctor) => (
                      <button
                        key={doctor.id}
                        onClick={() => {
                          setSelectedDoctor(doctor);
                          setShowDoctorDropdown(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${selectedDoctor?.id === doctor.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                      >
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                          <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {doctor.staff_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {doctor.department || 'No department'} • {doctor.staff_code || 'N/A'}
                          </p>
                        </div>
                        {selectedDoctor?.id === doctor.id && (
                          <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedDoctor && (
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
                  <CardTitle className="text-lg">Leave Balance {selectedYear}</CardTitle>
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
            <AdminAttendanceCalendar
              attendanceHistory={attendanceHistory}
              loading={loading}
              leaves={leaves}
              currentMonth={selectedMonth}
              currentYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
            />

            {/* Attendance History Table */}
            <Card className="border border-gray-200 dark:border-gray-700">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                  Attendance History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
                  </div>
                ) : attendanceHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Scheduled
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Check In
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Check Out
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Hours
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {attendanceHistory.map((record) => {
                          const statusBadges = {
                            on_time: {
                              bg: 'bg-green-100 dark:bg-green-900/30',
                              text: 'text-green-700 dark:text-green-400',
                              border: 'border-green-200 dark:border-green-800',
                              label: '🟢 On Time'
                            },
                            early: {
                              bg: 'bg-blue-100 dark:bg-blue-900/30',
                              text: 'text-blue-700 dark:text-blue-400',
                              border: 'border-blue-200 dark:border-blue-800',
                              label: '🔵 Early'
                            },
                            late: {
                              bg: 'bg-yellow-100 dark:bg-yellow-900/30',
                              text: 'text-yellow-700 dark:text-yellow-400',
                              border: 'border-yellow-200 dark:border-yellow-800',
                              label: '🟡 Late'
                            },
                            very_late: {
                              bg: 'bg-red-100 dark:bg-red-900/30',
                              text: 'text-red-700 dark:text-red-400',
                              border: 'border-red-200 dark:border-red-800',
                              label: '🔴 Very Late'
                            }
                          };

                          const badge = statusBadges[record.attendance_status] || {
                            bg: 'bg-gray-100 dark:bg-gray-800',
                            text: 'text-gray-700 dark:text-gray-400',
                            border: 'border-gray-200 dark:border-gray-700',
                            label: '-'
                          };

                          return (
                            <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {new Date(record.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                {record.scheduled_start_time && record.scheduled_end_time
                                  ? `${record.scheduled_start_time} - ${record.scheduled_end_time}`
                                  : '-'
                                }
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                {record.check_in_time
                                  ? new Date(record.check_in_time).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                  : '-'
                                }
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                {record.check_out_time
                                  ? new Date(record.check_out_time).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                  : record.status === 'checked_in'
                                    ? <span className="text-green-600 dark:text-green-400">Active</span>
                                    : '-'
                                }
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
                                    {badge.label}
                                  </span>
                                  {record.late_by_minutes && (record.attendance_status === 'late' || record.attendance_status === 'very_late') && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      +{record.late_by_minutes} mins
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {record.total_hours ? `${Number(record.total_hours).toFixed(2)}h` : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No attendance records found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
