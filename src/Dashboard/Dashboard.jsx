import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import toast, { Toaster } from 'react-hot-toast';
import { CalendarDays, Users, UserX, Stethoscope, TrendingUp, BarChart2, Clock, X } from "lucide-react";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { useNavigate } from "react-router-dom";
import appointmentsAPI from "../api/appointmentsapi";
import patientsAPI from "../api/patientsapi"; // Assume you have this API file
import LiveAppointmentList from "./comps/LiveAppoinment";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
);

const todayStr = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

function AppointmentsModal({ title, appointments, onClose }) {
  const isCancelled = title.toLowerCase().includes("cancellation");
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative z-50 bg-white dark:bg-gray-800 rounded-md shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className={`border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${isCancelled ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'} px-6 py-4`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {appointments.length} {appointments.length === 1 ? 'appointment' : 'appointments'} found
          </p>
        </div>
        <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-4">
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-300 dark:text-gray-600 text-4xl mb-3">📋</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">No records found.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {appointments.map((appt, idx) => (
                <div 
                  key={appt.id || idx} 
                  className={`p-3 rounded-md border transition-colors ${
                    isCancelled 
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold text-sm ${isCancelled ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                          {appt.appointment_time ? appt.appointment_time.slice(0, 5) : "--"}
                        </span>
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          {appt.patient_name ?? "Unnamed Patient"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        with <span className="font-medium">{appt.staff_name ?? "Unknown Doctor"}</span>
                      </div>
                    </div>
                    <div className="text-xs">
                      <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        isCancelled 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800' 
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                      }`}>
                        {appt.appointment_type ?? "N/A"}
                      </div>
                      {appt.reason && (
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs">
                          {appt.reason}
                        </p>
                      )}
                      {appt.cancellation_reason && (
                        <p className="text-red-600 dark:text-red-400 mt-1 text-xs font-medium">
                          Reason: {appt.cancellation_reason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [appointmentsPerDept, setAppointmentsPerDept] = useState({});



  const [loading, setLoading] = useState(true);
  const [animatedValues, setAnimatedValues] = useState({
    appointments: 0,
    newPatients: 0,
    cancellations: 0,
    availableDoctors: 12,
  });

  const [todaysAppointments, setTodaysAppointments] = useState([]);
  const [cancelledAppointments, setCancelledAppointments] = useState([]);
  const [newPatientsToday, setNewPatientsToday] = useState([]);
  const [appointmentStatusCounts, setAppointmentStatusCounts] = useState({
    fulfilled: 0,
    pending: 0,
    cancelled: 0,
  });

  const [showAllModal, setShowAllModal] = useState(false);
  const [showCancelledModal, setShowCancelledModal] = useState(false);

  // Weekly Visits Chart State & Option State
  const [weeklyVisitsData, setWeeklyVisitsData] = useState({
    labels: [],
    datasets: [
      {
        label: "Patient Visits",
        data: [],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        tension: 0.4,
      },
    ],
  });

  const [weeklyVisitsOptions, setWeeklyVisitsOptions] = useState({
    responsive: true,
    plugins: { legend: { display: false } },
    maintainAspectRatio: false,
    animation: {
      duration: 2000,
      easing: 'easeOutCubic',
      delay: (context) => context.dataIndex * 200,
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: 6, // Default; will auto-update below
        ticks: { stepSize: 1 }
      },
    },
  });

  useEffect(() => {
    const hospitalId = "550e8400-e29b-41d4-a716-446655440001";

    const fetchDepartmentData = async () => {
      try {
        const res = await appointmentsAPI.getAppointmentsPerDepartment(hospitalId);
        console.log("API response for appointments per dept:", res);
        // If res is the direct object
        if (res && Object.keys(res).length > 0) {
          console.log("Setting appointmentsPerDept state with:", res);
          setAppointmentsPerDept(res);
        } else {
          console.warn("API response is empty or invalid:", res);
        }
      } catch (error) {
        console.error("Failed to fetch appointments per department", error);
      }

    };

    fetchDepartmentData();
  }, []);

  useEffect(() => {
    const hospitalId = "550e8400-e29b-41d4-a716-446655440001";

    const fetchStatusCounts = async () => {
      try {
        const res = await appointmentsAPI.getAppointmentStatusCounts(hospitalId);
        if (res) {
          setAppointmentStatusCounts(res);
        } else {
          console.warn("Received empty status counts data from API");
        }
      } catch (error) {
        console.error("Failed to fetch appointment status counts", error);
      }
    };

    fetchStatusCounts();
  }, []);



  // Animate counters
  const animateCounters = (overrideVals = {}) => {
    const targetValues = {
      appointments: overrideVals.appointments !== undefined ? overrideVals.appointments : 0,
      newPatients: overrideVals.newPatients !== undefined ? overrideVals.newPatients : 0,
      cancellations: overrideVals.cancellations !== undefined ? overrideVals.cancellations : 0,
      availableDoctors: 12,
    };
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      setAnimatedValues({
        appointments: Math.round(targetValues.appointments * easeOutCubic),
        newPatients: Math.round(targetValues.newPatients * easeOutCubic),
        cancellations: Math.round(targetValues.cancellations * easeOutCubic),
        availableDoctors: Math.round(targetValues.availableDoctors * easeOutCubic),
      });
      if (step >= steps) {
        clearInterval(timer);
        setAnimatedValues(targetValues);
      }
    }, stepDuration);
  };

  useEffect(() => {
    setIsLoaded(true);
    const hospitalId = "550e8400-e29b-41d4-a716-446655440001";
    const today = todayStr();

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [apptRes, cancelRes, patientsRes, weeklyVisitsRes] = await Promise.all([
          appointmentsAPI.getAll({
            hospital_id: hospitalId,
            fromDate: today,
            toDate: today,
            limit: 10,
          }),
          appointmentsAPI.getAll({
            hospital_id: hospitalId,
            fromDate: today,
            toDate: today,
            status: "cancelled",
            limit: 10,
          }),
          patientsAPI.getAll({
            hospital_id: hospitalId,
            fromDate: today,
            toDate: today,
            limit: 10,
          }),
          appointmentsAPI.getWeeklyVisits(hospitalId),
        ]);

        const appointments = Array.isArray(apptRes.data) ? apptRes.data : [];
        const cancelled = Array.isArray(cancelRes.data) ? cancelRes.data : [];
        const newPatients = Array.isArray(patientsRes.data) ? patientsRes.data : [];
        const weeklyVisits = weeklyVisitsRes;

        // --- DEBUG LOGS ---
        console.log("WEEKLY VISITS API RAW RESULT:", weeklyVisitsRes);
        console.log("WEEKLY VISITS FINAL:", weeklyVisits);
        // ------------------

        setTodaysAppointments(appointments);
        setCancelledAppointments(cancelled);
        setNewPatientsToday(newPatients);

        // Chart data update
        if (
          weeklyVisits &&
          Array.isArray(weeklyVisits.labels) &&
          Array.isArray(weeklyVisits.data) &&
          weeklyVisits.labels.length === weeklyVisits.data.length
        ) {
          console.log("Updating chart data with:", weeklyVisits.labels, weeklyVisits.data);
          setWeeklyVisitsData((prev) => ({
            ...prev,
            labels: weeklyVisits.labels,
            datasets: [
              {
                ...prev.datasets[0],
                data: weeklyVisits.data,
              },
            ],
          }));
        } else {
          console.warn("Weekly chart API invalid! Got:", weeklyVisits);
          setWeeklyVisitsData((prev) => ({
            ...prev,
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [
              {
                ...prev.datasets[0],
                data: [0, 0, 0, 0, 0, 0, 0],
              },
            ],
          }));
        }


        animateCounters({
          appointments: appointments.length,
          cancellations: cancelled.length,
          newPatients: newPatients.length,
        });
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
        toast.error("Failed to load dashboard data.");
        setTodaysAppointments([]);
        setCancelledAppointments([]);
        setNewPatientsToday([]);
        animateCounters({ appointments: 0, cancellations: 0, newPatients: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    // eslint-disable-next-line
  }, []);

  // Dynamically fix chart y-max after weeklyVisitsData changes
  useEffect(() => {
    if (weeklyVisitsData && weeklyVisitsData.datasets && weeklyVisitsData.datasets[0]) {
      const vals = weeklyVisitsData.datasets[0].data;
      // --- DEBUG LOGS ---
      console.log("weeklyVisitsData for chart:", weeklyVisitsData);
      console.log("weeklyVisitsData.datasets[0].data:", vals);

      const maxYData = Math.max(...vals, 0);
      // Ensure at least 6 for empty or small data, add headroom for real data
      const chartMax = maxYData < 6 ? 6 : maxYData + 1;
      // --- DEBUG LOGS ---
      console.log("Setting chart y-axis max to", chartMax);

      setWeeklyVisitsOptions(prev => ({
        ...prev,
        scales: {
          ...prev.scales,
          y: {
            ...prev.scales.y,
            max: chartMax,
            min: 0,
            ticks: { stepSize: 1 }
          }
        }
      }));
    } else {
      console.warn("weeklyVisitsData missing datasets for chart LOGIC");
    }
  }, [weeklyVisitsData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto mb-3"></div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Loading dashboard data...</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* <Navbar /> */}
      <main className="flex-1 p-6 lg:p-8">
        <Toaster position="top-right" />
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            Good Morning, Care Coordinator
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Here's your clinic overview for today
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {/* Card 1 - Today's Appointments */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  Today's Appointments
                </h2>
              </div>
              <p className="text-4xl font-semibold text-gray-900 dark:text-white mb-1">
                {animatedValues.appointments}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Scheduled for today</p>
            </div>
            <div className="p-4">
              <div className="space-y-2 mb-3">
                {todaysAppointments.slice(0, 3).map((appt, idx) => (
                  <div 
                    key={appt.id || idx} 
                    className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-3 border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-12 text-center">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                          {appt.appointment_time ? appt.appointment_time.slice(0, 5) : "--"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {appt.patient_name ?? "Unnamed Patient"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          with {appt.staff_name ?? "Unknown Doctor"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {todaysAppointments.length > 3 && (
                <button
                  className="w-full py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 font-medium rounded-md transition-colors text-xs"
                  onClick={() => setShowAllModal(true)}
                >
                  View {todaysAppointments.length - 3} more appointments →
                </button>
              )}
            </div>
          </div>
          {/* Card 2 - New Patients Today */}
          <div 
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            onClick={() => navigate("/patients")}
          >
            <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  New Patients
                </h2>
              </div>
              <p className="text-4xl font-semibold text-gray-900 dark:text-white mb-1">{animatedValues.newPatients}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Registered today</p>
            </div>
            <div className="p-4">
              <div className="space-y-2 mb-3">
                {newPatientsToday.slice(0, 3).map((patient) => (
                  <div 
                    key={patient.id} 
                    className="bg-green-50 dark:bg-green-900/20 rounded-md p-2 border border-green-200 dark:border-green-800"
                  >
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {patient.patient_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {patient.contact_info}
                    </p>
                  </div>
                ))}
              </div>
              {newPatientsToday.length > 3 && (
                <div className="text-center">
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    +{newPatientsToday.length - 3} more
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Card 3 - Cancellations Today */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <UserX className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  Cancellations
                </h2>
              </div>
              <p className="text-4xl font-semibold text-gray-900 dark:text-white mb-1">{animatedValues.cancellations}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Cancelled today</p>
            </div>
            <div className="p-4">
              <div className="space-y-2 mb-3">
                {cancelledAppointments.slice(0, 3).map((appt, idx) => (
                  <div 
                    key={appt.id || idx} 
                    className="bg-red-50 dark:bg-red-900/20 rounded-md p-2 border border-red-200 dark:border-red-800"
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-red-600 dark:text-red-400 font-semibold text-xs">
                        {appt.appointment_time ? appt.appointment_time.slice(0, 5) : "--"}
                      </span>
                      <span className="font-medium text-xs text-gray-900 dark:text-white truncate">
                        {appt.patient_name ?? "Unnamed Patient"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      with {appt.staff_name ?? "Unknown Doctor"}
                    </p>
                    {appt.cancellation_reason && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 truncate">
                        {appt.cancellation_reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {cancelledAppointments.length > 3 && (
                <button
                  className="w-full py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 font-medium rounded-md transition-colors text-xs"
                  onClick={() => setShowCancelledModal(true)}
                >
                  View {cancelledAppointments.length - 3} more cancellations →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Charts section */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-6">
          <LiveAppointmentList />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Weekly Patient Visits Chart */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden p-4 h-80 flex flex-col">
            <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 -mx-4 mb-3 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Weekly Patient Visits</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Patient visits over the last 7 days</p>
            </div>
            <div className="flex-1">
              <Line data={weeklyVisitsData} options={weeklyVisitsOptions} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden p-4 h-80 flex flex-col">
            <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 -mx-4 mb-3 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Appointments per Department</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Today's appointments by department</p>
            </div>
            <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-md p-3 max-h-64 overflow-auto">
              {Object.keys(appointmentsPerDept).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-gray-500 dark:text-gray-400">No appointment data available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(appointmentsPerDept).map(([dept, count]) => (
                    <div 
                      key={dept} 
                      className="bg-white dark:bg-gray-700 rounded-md p-3 border border-gray-200 dark:border-gray-600 flex items-center justify-between"
                    >
                      <span className="font-medium text-sm text-gray-900 dark:text-white">{dept}</span>
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold rounded text-xs border border-green-200 dark:border-green-800">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden p-4 h-80 flex flex-col items-center justify-start">
            <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 -mx-4 mb-3 px-4 py-3 w-full">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Appointment Status</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Status breakdown for this week</p>
            </div>
            <div className="flex flex-col items-center justify-center flex-1 w-full">
              <div className="mb-4">
                <Doughnut
                  data={{
                    labels: ["Completed", "Pending", "Cancelled"],
                    datasets: [
                      {
                        data: [
                          appointmentStatusCounts.fulfilled || 0,
                          appointmentStatusCounts.pending || 0,
                          appointmentStatusCounts.cancelled || 0,
                        ],
                        backgroundColor: ["#16a34a", "#F59E0B", "#dc2626"],
                        borderWidth: 0,
                      },
                    ],
                  }}
                  options={{
                    plugins: { legend: { display: false } },
                    maintainAspectRatio: false,
                    animation: {
                      duration: 2000,
                      easing: 'easeOutCubic',
                      delay: 1000,
                    },
                  }}
                  className="w-32 h-32"
                />
              </div>
              <div className="flex flex-wrap justify-center gap-2 text-xs">
                <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md border border-green-200 dark:border-green-800">
                  <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                  <span className="font-medium text-gray-900 dark:text-white">Completed</span>
                </div>
                <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md border border-yellow-200 dark:border-yellow-800">
                  <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
                  <span className="font-medium text-gray-900 dark:text-white">Pending</span>
                </div>
                <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md border border-red-200 dark:border-red-800">
                  <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                  <span className="font-medium text-gray-900 dark:text-white">Cancelled</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Modals */}
      {showAllModal && (
        <AppointmentsModal
          title="All Today's Appointments"
          appointments={todaysAppointments}
          onClose={() => setShowAllModal(false)}
        />
      )}
      {showCancelledModal && (
        <AppointmentsModal
          title="All Today's Cancellations"
          appointments={cancelledAppointments}
          onClose={() => setShowCancelledModal(false)}
        />
      )}
    </div>
  );
}
