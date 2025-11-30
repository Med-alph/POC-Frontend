import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, FileText, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminAttendanceCalendar({ 
  attendanceHistory = [], 
  loading = false, 
  leaves = [],
  currentMonth,
  currentYear,
  onMonthChange,
  onYearChange
}) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const handlePreviousMonth = () => {
    if (currentMonth === 1) {
      onMonthChange(12);
      onYearChange(currentYear - 1);
    } else {
      onMonthChange(currentMonth - 1);
    }
  };
  
  const handleNextMonth = () => {
    if (currentMonth === 12) {
      onMonthChange(1);
      onYearChange(currentYear + 1);
    } else {
      onMonthChange(currentMonth + 1);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      {/* Calendar */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              onClick={handlePreviousMonth}
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
              onClick={handleNextMonth}
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
              return leaves.find(leave => {
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
            const approvedLeave = leaves.find(leave => {
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
  );
}
