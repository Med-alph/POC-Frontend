import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle, Clock, FileText, TrendingUp, RefreshCw } from "lucide-react";
import DoctorAttendanceCalendar from "./CalendarComp";
import attendanceAPI from "../../api/attendanceapi";
import toast from 'react-hot-toast';

export default function DoctorAttendancePage() {
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [monthlySummary, setMonthlySummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    
    const user = useSelector((state) => state.auth.user);

    const fetchAttendanceData = async () => {
        if (!user?.id) return;
        
        try {
            setLoading(true);
            
            // Fetch history
            const historyResponse = await attendanceAPI.getHistory(
                user.id, 
                { month: selectedMonth, year: selectedYear }
            );
            
            if (historyResponse.success) {
                setAttendanceHistory(historyResponse.data || []);
            }
            
            // Fetch monthly summary
            const summaryResponse = await attendanceAPI.getMonthlySummary(
                user.id,
                selectedMonth,
                selectedYear
            );
            
            if (summaryResponse.success) {
                setMonthlySummary(summaryResponse.data);
            }
        } catch (error) {
            console.error('Failed to fetch attendance data:', error);
            toast.error('Failed to load attendance data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendanceData();
        
        // Auto-refresh every 30 seconds to catch new check-ins
        const refreshInterval = setInterval(() => {
            fetchAttendanceData();
        }, 30000); // 30 seconds
        
        return () => clearInterval(refreshInterval);
    }, [user?.id, selectedMonth, selectedYear]);

    // Calculate stats from history
    const totalPresent = attendanceHistory.filter((r) => r.status === "checked_out").length;
    const totalOnTime = attendanceHistory.filter((r) => r.attendance_status === "on_time").length;
    const totalLate = attendanceHistory.filter((r) => r.attendance_status === "late" || r.attendance_status === "very_late").length;
    const totalEarly = attendanceHistory.filter((r) => r.attendance_status === "early").length;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                            Attendance Tracker
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Track your attendance records and view detailed history
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

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {/* Present Card */}
                    <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                Present Days
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="text-center">
                                <p className="text-4xl font-semibold text-gray-900 dark:text-white mb-1">
                                    {loading ? "..." : totalPresent}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Days attended
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* On Time Card */}
                    <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                On Time
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="text-center">
                                <p className="text-4xl font-semibold text-green-600 dark:text-green-400 mb-1">
                                    {loading ? "..." : totalOnTime}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Punctual arrivals
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Late Card */}
                    <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                Late Arrivals
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="text-center">
                                <p className="text-4xl font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
                                    {loading ? "..." : totalLate}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Late check-ins
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Hours Card */}
                    <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                Total Hours
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="text-center">
                                <p className="text-4xl font-semibold text-blue-600 dark:text-blue-400 mb-1">
                                    {loading ? "..." : monthlySummary?.total_hours_worked?.toFixed(1) || "0"}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Hours worked
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        className="bg-red-600 hover:bg-red-700 text-white h-9 px-4 text-sm font-medium rounded-md flex items-center gap-2"
                    >
                        <FileText className="h-4 w-4" />
                        Apply Leave
                    </Button>
                    <Button
                        variant="outline"
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 h-9 px-4 text-sm font-medium rounded-md flex items-center gap-2"
                    >
                        <Clock className="h-4 w-4" />
                        Adjust Attendance
                    </Button>
                </div>

                {/* Calendar */}
                <DoctorAttendanceCalendar 
                    attendanceHistory={attendanceHistory}
                    loading={loading}
                />

                {/* Detailed History Table */}
                <Card className="border border-gray-200 dark:border-gray-700 mt-6">
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
                                                        {record.total_hours ? `${record.total_hours.toFixed(2)}h` : '-'}
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
            </div>
        </div>
    );
}