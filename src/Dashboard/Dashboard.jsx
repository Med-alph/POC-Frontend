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
import appointmentsAPI from "../api/AppointmentsAPI";
import patientsAPI from "../api/PatientsAPI"; // Assume you have this API file


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
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-4 relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold mb-2">{title}</h2>
        <div className="max-h-96 overflow-auto">
          {appointments.length === 0 && (
            <div className="text-gray-500 text-center py-6">No records found.</div>
          )}
          {appointments.map(appt => (
            <div key={appt.id} className="p-2 border-b last:border-b-0 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
              <div>
                <span className="text-blue-600 font-semibold">
                  {appt.appointment_time ? appt.appointment_time.slice(0, 5) : "--"}
                </span>
                &nbsp;–&nbsp;
                <span className="font-semibold">{appt.patient_name ?? "Unnamed Patient"}</span>
                &nbsp;with&nbsp;
                <span className="font-semibold">{appt.staff_name ?? "Unknown Doctor"}</span>
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0">
                {appt.appointment_type ?? "N/A"}
                {appt.reason ? ` (${appt.reason})` : ""}
                {appt.cancellation_reason ? ` | Reason: ${appt.cancellation_reason}` : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  const [animatedValues, setAnimatedValues] = useState({
    appointments: 0,
    newPatients: 0,
    cancellations: 0,
    availableDoctors: 0,
  });

  const [todaysAppointments, setTodaysAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);

  const [cancelledAppointments, setCancelledAppointments] = useState([]);
  const [loadingCancellations, setLoadingCancellations] = useState(false);
  const [showCancelledModal, setShowCancelledModal] = useState(false);

  const [newPatientsToday, setNewPatientsToday] = useState([]);
  const [loadingNewPatients, setLoadingNewPatients] = useState(false);

  // Fetch all data concurrently
  useEffect(() => {
    setIsLoaded(true);

    const hospitalId = "550e8400-e29b-41d4-a716-446655440001";
    const today = todayStr();

    const fetchAll = async () => {
      setLoadingAppointments(true);
      setLoadingCancellations(true);
      setLoadingNewPatients(true);

      try {
        const [apptRes, cancelRes, patientsRes] = await Promise.all([
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
            limit: 10
          }),
          patientsAPI.getAll({
            hospital_id: hospitalId,
            fromDate: today,
            toDate: today,
            limit: 10,
          }),
        ]);

        const appointments = Array.isArray(apptRes.data) ? apptRes.data : [];
        const cancelled = Array.isArray(cancelRes.data) ? cancelRes.data : [];
        const newPatients = Array.isArray(patientsRes.data) ? patientsRes.data : [];

        setTodaysAppointments(appointments);
        setCancelledAppointments(cancelled);
        setNewPatientsToday(newPatients);

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
        setLoadingAppointments(false);
        setLoadingCancellations(false);
        setLoadingNewPatients(false);
      }
    };

    fetchAll();
  }, []);

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

  const weeklyVisitsData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Patient Visits",
        data: [12, 19, 14, 18, 20, 17, 22],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        tension: 0.4,
      },
    ],
  };
  const weeklyVisitsOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    maintainAspectRatio: false,
    animation: {
      duration: 2000,
      easing: 'easeOutCubic',
      delay: (context) => context.dataIndex * 200
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 5 } },
    },
  };

  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* <Navbar /> */}
      <main className="flex-1 p-2 sm:p-6">
        <Toaster position="top-right" />
        <div className={`mb-4 sm:mb-6 px-2 sm:px-6 transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-lg sm:text-2xl font-bold">Good Morning, Care Coordinator</h1>
          <p className="text-gray-600 mt-1 text-xs sm:text-base">
            Here's your clinic overview for today
          </p>
        </div>
        <div className="mt-2 sm:mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 px-1 sm:px-6 lg:grid-cols-4">
          {/* Card 1 - Today's Appointments */}
          <div className={`col-span-1 lg:col-span-2 bg-white rounded-lg shadow p-3 sm:p-5 border-l-4 border-blue-500 transition-all duration-700 delay-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xs sm:text-base font-semibold text-gray-700">Today's Appointments</h2>
              <CalendarDays className="h-4 w-4 sm:h-6 sm:w-6 text-blue-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-3">
              {animatedValues.appointments}
            </p>
            <div className="mt-2 sm:mt-4 space-y-2 sm:space-y-3 text-xs sm:text-sm">
              {todaysAppointments.slice(0, 3).map((appt, idx) => (
                <div key={appt.id || idx} className="flex flex-col sm:flex-row sm:justify-between bg-blue-50 rounded p-1 sm:p-2">
                  <div>
                    <span className="text-blue-600 font-semibold">
                      {appt.appointment_time ? appt.appointment_time.slice(0, 5) : "--"}
                    </span>
                    &nbsp;–&nbsp;
                    <span className="font-bold">{appt.patient_name ?? "Unnamed Patient"}</span>
                    &nbsp;with&nbsp;
                    <span className="font-bold">{appt.staff_name ?? "Unknown Doctor"}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 sm:mt-0">
                    {appt.appointment_type ?? "N/A"}
                    {appt.reason ? ` (${appt.reason})` : ""}
                  </div>
                </div>
              ))}
            </div>
            {todaysAppointments.length > 3 && (
              <button
                className="mt-2 sm:mt-3 text-blue-500 text-xs sm:text-sm font-medium hover:underline"
                onClick={() => setShowAllModal(true)}
              >
                +{todaysAppointments.length - 3} more
              </button>
            )}
          </div>
          {/* Card 2 - New Patients Today */}
         <div className={`bg-white rounded-lg shadow p-3 sm:p-5 border-l-4 border-green-500 transition-all duration-700 delay-400 hover:shadow-xl hover:scale-105 hover:-translate-y-1 cursor-pointer ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
  onClick={() => navigate("/patients")}
>
  <div className="flex items-center justify-between mb-4 sm:mb-6">
    <h2 className="text-xs sm:text-base font-semibold text-gray-700">New Patients Today</h2>
    <Users className="h-4 w-4 sm:h-6 sm:w-6 text-green-500" />
  </div>
  <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-3">{animatedValues.newPatients}</p>
  
  <div className="mt-3 space-y-1 text-xs sm:text-sm text-gray-700 max-h-24 overflow-auto">
    {newPatientsToday.slice(0, 3).map((patient) => (
      <div key={patient.id} className="flex justify-between">
        <span>{patient.patient_name}</span>
        <span>{patient.contact_info}</span>
      </div>
    ))}
    {newPatientsToday.length > 3 && (
      <div className="text-xs text-green-600 font-medium mt-1">
        +{newPatientsToday.length - 3} more
      </div>
    )}
  </div>
</div>

          {/* Card 3 - Cancellations Today */}
          <div className={`bg-white rounded-lg shadow p-3 sm:p-5 border-l-4 border-red-500 transition-all duration-700 delay-500 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xs sm:text-base font-semibold text-gray-700">Cancellations Today</h2>
              <UserX className="h-4 w-4 sm:h-6 sm:w-6 text-red-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-3">{animatedValues.cancellations}</p>
            <div className="mt-2 sm:mt-4 space-y-2 sm:space-y-3 text-xs sm:text-sm">
              {cancelledAppointments.slice(0, 3).map((appt, idx) => (
                <div key={appt.id || idx} className="flex flex-col sm:flex-row sm:justify-between bg-red-50 rounded p-1 sm:p-2">
                  <div>
                    <span className="text-red-600 font-semibold">
                      {appt.appointment_time ? appt.appointment_time.slice(0, 5) : "--"}
                    </span>
                    &nbsp;–&nbsp;
                    <span className="font-bold">{appt.patient_name ?? "Unnamed Patient"}</span>
                    &nbsp;with&nbsp;
                    <span className="font-bold">{appt.staff_name ?? "Unknown Doctor"}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 sm:mt-0">
                    {appt.appointment_type ?? "N/A"}
                    {appt.cancellation_reason ? ` (${appt.cancellation_reason})` : ""}
                  </div>
                </div>
              ))}
            </div>
            {cancelledAppointments.length > 3 && (
              <button
                className="mt-2 sm:mt-3 text-red-500 text-xs sm:text-sm font-medium hover:underline"
                onClick={() => setShowCancelledModal(true)}
              >
                +{cancelledAppointments.length - 3} more
              </button>
            )}
          </div>
          {/* Card 4 - Available Doctors now */}
          {/* <div className={`bg-white rounded-lg shadow p-3 sm:p-5 border-l-4 border-purple-500 transition-all duration-700 delay-600 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xs sm:text-base font-semibold text-gray-700">Available Doctors Now</h2>
              <Stethoscope className="h-4 w-4 sm:h-6 sm:w-6 text-purple-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-3">{animatedValues.availableDoctors}</p>
            <p className="text-xs sm:text-sm font-medium text-purple-500 mt-1">out of 15 total</p>
          </div> */}
        </div>
        <div className="mt-4 sm:mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 px-1 sm:px-6">
          <div className={`bg-white rounded-lg shadow p-3 sm:p-6 h-64 sm:h-80 flex flex-col transition-all duration-700 delay-700 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center mb-1 sm:mb-3">
              <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-blue-500 mr-2" />
              <h3 className="text-xs sm:text-lg font-semibold text-gray-700">Weekly Patient Visits</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-4">Patient visits over the last 7 days</p>
            <div className="flex-1">
              <Line data={weeklyVisitsData} options={weeklyVisitsOptions} />
            </div>
          </div>
          <div className={`bg-white rounded-lg shadow p-3 sm:p-6 h-64 sm:h-80 flex flex-col transition-all duration-700 delay-800 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center mb-1 sm:mb-3">
              <BarChart2 className="h-4 w-4 sm:h-6 sm:w-6 text-green-500 mr-2" />
              <h3 className="text-xs sm:text-lg font-semibold text-gray-700">Appointments per Department</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-4">Today's appointments by department</p>
            <div className="flex-1 bg-gray-100 rounded-md p-2">
              <div className="text-gray-600 text-xs sm:text-sm mb-1 flex justify-between">
                <span>Cardiology</span>
                <span>8</span>
              </div>
              <div className="text-gray-600 text-xs sm:text-sm mb-1 flex justify-between">
                <span>Neurology</span>
                <span>5</span>
              </div>
              <div className="text-gray-600 text-xs sm:text-sm mb-1 flex justify-between">
                <span>Pediatrics</span>
                <span>7</span>
              </div>
              <div className="text-gray-600 text-xs sm:text-sm flex justify-between">
                <span>Orthopedics</span>
                <span>4</span>
              </div>
            </div>
          </div>
          <div className={`bg-white rounded-lg shadow p-3 sm:p-6 h-64 sm:h-80 flex flex-col items-center justify-start transition-all duration-700 delay-900 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="w-full mb-2 sm:mb-4">
              <div className="flex items-center">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-purple-500 mr-2" />
                <h3 className="text-xs sm:text-lg font-semibold text-gray-700">Appointment Status</h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Status breakdown for this week</p>
            </div>
            <div className="flex flex-col items-center justify-center h-24 sm:h-32 w-full mt-4 sm:mt-10">
              <Doughnut
                data={{
                  labels: ["Completed", "Pending", "Cancelled"],
                  datasets: [
                    {
                      data: [12, 5, 3],
                      backgroundColor: ["#34D399", "#FBBF24", "#F87171"],
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
                    delay: 1000
                  }
                }}
                className="w-24 sm:w-32 h-24 sm:h-32"
              />
              <div className="flex gap-2 sm:gap-4 text-xs sm:text-sm mt-3 sm:mt-8">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full"></span>
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-500 rounded-full"></span>
                  <span>Pending</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full"></span>
                  <span>Cancelled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Modal for All Today's Appointments */}
      {showAllModal && (
        <AppointmentsModal
          title="All Today's Appointments"
          appointments={todaysAppointments}
          onClose={() => setShowAllModal(false)}
        />
      )}
      {/* Modal for All Today's Cancellations */}
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
