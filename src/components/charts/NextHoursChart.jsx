import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useChartData } from '@/hooks/useChartData';

/**
 * Doctor - NextHoursChart (Gantt Chart)
 * Shows appointments as a Gantt chart with horizontal bars representing appointment duration.
 * Expects API response:
 *  {
 *    gantt: [
 *      {
 *        id: "...",
 *        text: "Patient - Type",
 *        start_date: "2025-11-29T10:30:00.000Z",
 *        end_date: "2025-11-29T11:00:00.000Z",
 *        startTimestamp: 1732870200000,
 *        endTimestamp: 1732872000000,
 *        duration_minutes: 30,
 *        patient_name: "Patient Name",
 *        appointment_type: "consultation",
 *        color: "#4CAF50",
 *        status: "booked",
 *        ...
 *      },
 *      ...
 *    ],
 *    meta: {
 *      gantt_range: { start: "...", end: "..." }
 *    },
 *    stats: { total, completed, pending, cancelled }
 *  }
 */
const NextHoursChart = ({ userId, hours = 8 }) => {
  const [hoveredTask, setHoveredTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  
  const endpoint = useMemo(() => {
    if (!userId) return null;
    return `/charts/doctor/${userId}/next-hours?hours=${hours}`;
  }, [userId, hours]);

  const { data, loading, error } = useChartData(endpoint, {
    socketEvent: 'chart:update',
    socketRoom: 'doctor:next-hours',
    userId,
  });

  // Calculate Gantt chart dimensions and positions with hour columns
  const ganttData = useMemo(() => {
    if (!data || !data.gantt || data.gantt.length === 0) {
      return {
        tasks: [],
        hourColumns: [],
        timeRange: { start: null, end: null },
      };
    }

    const tasks = data.gantt || [];
    
    // WORKAROUND: Parse appointment_date and appointment_time as local time
    // Backend is incorrectly treating local times as UTC
    const tasksWithLocalTimestamps = tasks.map(task => {
      // Get the appointment from the appointments array if available
      const appointment = data.appointments?.find(apt => apt.id === task.id);
      
      if (appointment?.appointment_date && appointment?.appointment_time) {
        // Parse as local time by creating date string without 'Z' suffix
        const dateStr = appointment.appointment_date; // "2025-12-04"
        const timeStr = appointment.appointment_time; // "20:00:00"
        
        // Create local date by parsing without timezone
        const localStartDate = new Date(`${dateStr}T${timeStr}`);
        const localEndDate = new Date(localStartDate.getTime() + (task.duration_minutes || 30) * 60 * 1000);
        
        return {
          ...task,
          startTimestamp: localStartDate.getTime(),
          endTimestamp: localEndDate.getTime(),
        };
      }
      
      return task;
    });
    
    const range = data.meta?.gantt_range || {};
    const numHours = data.hours || hours;
    
    // Get the start time (round down to the hour)
    const rangeStart = range.start 
      ? new Date(range.start).getTime()
      : Math.min(...tasksWithLocalTimestamps.map(t => t.startTimestamp));
    
    const startDate = new Date(rangeStart);
    startDate.setMinutes(0, 0, 0); // Round down to the hour
    const startTime = startDate.getTime();
    
    // Calculate end time (start + numHours)
    const endTime = startTime + (numHours * 60 * 60 * 1000);

    // Generate hour columns
    const hourColumns = [];
    for (let i = 0; i < numHours; i++) {
      const hourStart = startTime + (i * 60 * 60 * 1000);
      const hourEnd = hourStart + (60 * 60 * 1000);
      const hourDate = new Date(hourStart);
      
      hourColumns.push({
        index: i,
        start: hourStart,
        end: hourEnd,
        label: hourDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        widthPercent: 100 / numHours,
        leftPercent: (i / numHours) * 100,
      });
    }

    // Group tasks by hour and calculate positions within each hour column
    const processedTasks = tasksWithLocalTimestamps.map((task) => {
      const taskStart = task.startTimestamp;
      const taskEnd = task.endTimestamp;
      
      // Find which hour column(s) this task belongs to
      const startHourIndex = Math.floor((taskStart - startTime) / (60 * 60 * 1000));
      const endHourIndex = Math.floor((taskEnd - startTime) / (60 * 60 * 1000));
      
      // Calculate position within the hour column
      const hourStart = startTime + (startHourIndex * 60 * 60 * 1000);
      const hourDuration = 60 * 60 * 1000; // 1 hour in milliseconds
      
      const leftInHour = ((taskStart - hourStart) / hourDuration) * 100;
      const widthInHour = ((taskEnd - taskStart) / hourDuration) * 100;
      
      // Calculate absolute position
      const columnLeft = (startHourIndex / numHours) * 100;
      const leftPercent = columnLeft + (leftInHour * (1 / numHours));
      const widthPercent = (widthInHour / numHours);
      
      return {
        ...task,
        leftPercent: Math.max(0, Math.min(100, leftPercent)),
        widthPercent: Math.max(0.5, Math.min(100, widthPercent)), // Min 0.5% width for visibility
        hourIndex: startHourIndex,
        row: 0, // Will be calculated based on overlapping
      };
    });

    // Sort tasks by start time and assign rows to avoid overlapping
    processedTasks.sort((a, b) => a.startTimestamp - b.startTimestamp);
    
    // Simple row assignment - group by hour and assign rows within each hour
    const tasksByHour = {};
    processedTasks.forEach((task) => {
      if (!tasksByHour[task.hourIndex]) {
        tasksByHour[task.hourIndex] = [];
      }
      tasksByHour[task.hourIndex].push(task);
    });

    // Assign rows within each hour
    Object.keys(tasksByHour).forEach((hourKey) => {
      const hourTasks = tasksByHour[hourKey];
      hourTasks.sort((a, b) => a.startTimestamp - b.startTimestamp);
      
      // Simple overlap detection
      const rows = [];
      hourTasks.forEach((task) => {
        let assignedRow = 0;
        for (let row = 0; row < rows.length; row++) {
          const lastTaskInRow = rows[row][rows[row].length - 1];
          if (lastTaskInRow.endTimestamp <= task.startTimestamp) {
            assignedRow = row;
            break;
          }
          assignedRow = row + 1;
        }
        
        if (!rows[assignedRow]) {
          rows[assignedRow] = [];
        }
        rows[assignedRow].push(task);
        task.row = assignedRow;
      });
    });

    return {
      tasks: processedTasks,
      hourColumns,
      timeRange: { start: startTime, end: endTime },
    };
  }, [data, hours]);

  return (
    <Card className="border border-gray-200 dark:border-gray-700 h-full">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">
          Next few hours 
        </CardTitle>
        {data && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
            {data.stats && (
              <p>
                {data.stats.total || 0} appointment{(data.stats.total || 0) !== 1 ? 's' : ''} in the next {data.hours || hours} hours
                {data.stats.pending > 0 && ` • ${data.stats.pending} pending`}
                {data.stats.completed > 0 && ` • ${data.stats.completed} completed`}
              </p>
            )}
            {data.meta?.gantt_range && (
              <p className="text-xs">
                From {new Date(data.meta.gantt_range.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} to {new Date(data.meta.gantt_range.end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4">
        {!userId && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Doctor information is not available.
            </p>
          </div>
        )}
        {userId && loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading chart...</p>
          </div>
        )}
        {userId && error && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-red-500 dark:text-red-400 mb-1">
              Failed to load chart data
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Please try refreshing the page
            </p>
          </div>
        )}
        {userId && !loading && !error && (
          <div className="h-96 overflow-x-auto">
            {ganttData.tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No appointments in the next few hours
                </p>
              </div>
            ) : (
              <div className="relative w-full">
                {/* Hour column headers */}
                <div className="relative h-10 mb-2 border-b-2 border-gray-300 dark:border-gray-600">
                  {ganttData.hourColumns.map((column) => (
                    <div
                      key={column.index}
                      className="absolute top-0 h-full border-l border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                      style={{
                        left: `${column.leftPercent}%`,
                        width: `${column.widthPercent}%`,
                      }}
                    >
                      <div className="h-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {column.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gantt bars area */}
                <div className="relative" style={{ minHeight: '300px' }}>
                  {/* Hour column backgrounds */}
                  {ganttData.hourColumns.map((column) => (
                    <div
                      key={`bg-${column.index}`}
                      className="absolute top-0 bottom-0 border-l border-r border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20"
                      style={{
                        left: `${column.leftPercent}%`,
                        width: `${column.widthPercent}%`,
                      }}
                    />
                  ))}

                  {/* Gantt bars - only show tasks within their hour columns */}
                  {ganttData.tasks.map((task) => {
                    // Use timestamps directly to avoid timezone conversion issues
                    const startTime = new Date(task.startTimestamp);
                    const endTime = new Date(task.endTimestamp);
                    const duration = task.duration_minutes || 30;
                    const maxRow = Math.max(...ganttData.tasks.map(t => t.row || 0));
                    const rowHeight = 50;
                    
                    // Only render if task is within the visible hour range
                    if (task.hourIndex < 0 || task.hourIndex >= ganttData.hourColumns.length) {
                      return null;
                    }
                    
                    return (
                      <div
                        key={task.id}
                        className="absolute"
                        style={{
                          top: `${(task.row || 0) * rowHeight}px`,
                          left: `${task.leftPercent}%`,
                          width: `${task.widthPercent}%`,
                          height: `${rowHeight - 8}px`,
                          minWidth: '20px', // Ensure minimum visibility
                        }}
                        onMouseEnter={() => setHoveredTask(task.id)}
                        onMouseLeave={() => setHoveredTask(null)}
                        onClick={() => setSelectedTask(task)}
                      >
                        <div
                          className="h-full rounded-md border-2 border-white dark:border-gray-800 shadow-md transition-all duration-200 cursor-pointer"
                          style={{
                            backgroundColor: task.color || '#3b82f6',
                            opacity: hoveredTask === task.id ? 0.9 : 1,
                            transform: hoveredTask === task.id ? 'scale(1.05)' : 'scale(1)',
                            zIndex: hoveredTask === task.id ? 10 : 1,
                          }}
                          title={`${task.patient_name} - ${task.appointment_type} (${duration} min)`}
                        >
                          <div className="h-full flex items-center px-2 text-xs text-white font-medium">
                            <div className="flex flex-col justify-center min-w-0 w-full">
                              <span className="truncate font-semibold">{task.patient_name || task.text}</span>
                              <span className="text-xs opacity-90 truncate">
                                {startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tooltip */}
                {hoveredTask && (() => {
                  const task = ganttData.tasks.find(t => t.id === hoveredTask);
                  if (!task) return null;
                  const rowHeight = 50;
                  // Use timestamps directly to avoid timezone conversion issues
                  const startTime = new Date(task.startTimestamp);
                  const endTime = new Date(task.endTimestamp);
                  return (
                    <div 
                      className="absolute z-20 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-md p-3 shadow-xl pointer-events-none border border-gray-700"
                      style={{
                        left: `${Math.min(task.leftPercent + 5, 80)}%`,
                        top: `${((task.row || 0) * rowHeight) + 55}px`,
                        transform: 'translateX(-50%)',
                      }}
                    >
                      <div className="font-semibold mb-1">{task.patient_name}</div>
                      <div className="text-gray-300 mb-1">{task.appointment_type}</div>
                      <div className="text-gray-300 mb-1">
                        {startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-gray-300">Duration: {task.duration_minutes} min</div>
                      {task.reason && <div className="text-gray-300 mt-1">Reason: {task.reason}</div>}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Appointment Details Modal */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  Appointment Details
                </DialogTitle>
                <DialogDescription>
                  Complete information about the appointment
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Patient Information */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Patient Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Patient Name</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedTask.patient_name || 'N/A'}
                      </p>
                    </div>
                    {selectedTask.patient_contact && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Contact</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedTask.patient_contact}
                        </p>
                      </div>
                    )}
                    {selectedTask.patient_age !== null && selectedTask.patient_age !== undefined && selectedTask.patient_age >= 0 && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Age</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedTask.patient_age} years
                        </p>
                      </div>
                    )}
                    {selectedTask.patient_dob && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date of Birth</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(selectedTask.patient_dob).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Appointment Information */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Appointment Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Appointment Type</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {selectedTask.appointment_type || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        selectedTask.status === 'booked' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : selectedTask.status === 'completed'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : selectedTask.status === 'cancelled'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {selectedTask.status?.toUpperCase() || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(selectedTask.startTimestamp).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Time</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(selectedTask.startTimestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })} - {new Date(selectedTask.endTimestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Duration</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedTask.duration_minutes || selectedTask.duration || 30} minutes
                      </p>
                    </div>
                    {selectedTask.resource && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Doctor</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedTask.resource}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Details */}
                {selectedTask.reason && (
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Reason
                    </h3>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedTask.reason}
                    </p>
                  </div>
                )}

                {/* Appointment ID */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Appointment ID</p>
                  <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                    {selectedTask.id}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default NextHoursChart;


