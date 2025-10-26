import React, { useState, useEffect } from "react"
import Navbar from "./Navbar"
import toast, { Toaster } from 'react-hot-toast'
import { CalendarDays, Users, UserX, Stethoscope, TrendingUp, BarChart2, Clock } from "lucide-react"
import { Line, Doughnut } from "react-chartjs-2"
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
} from "chart.js"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
)
import { useNavigate } from "react-router-dom"

export default function Dashboard() {
  const navigate = useNavigate()
  const [isLoaded, setIsLoaded] = useState(false)
  const [animatedValues, setAnimatedValues] = useState({
    appointments: 0,
    newPatients: 0,
    cancellations: 0,
    availableDoctors: 0
  })


  // Animation for counters
  useEffect(() => {
    setIsLoaded(true)

    const animateCounters = () => {
      const targetValues = {
        appointments: 24,
        newPatients: 8,
        cancellations: 3,
        availableDoctors: 12
      }

      const duration = 2000 // 2 seconds
      const steps = 60
      const stepDuration = duration / steps

      let step = 0
      const timer = setInterval(() => {
        step++
        const progress = step / steps
        const easeOutCubic = 1 - Math.pow(1 - progress, 3)

        setAnimatedValues({
          appointments: Math.round(targetValues.appointments * easeOutCubic),
          newPatients: Math.round(targetValues.newPatients * easeOutCubic),
          cancellations: Math.round(targetValues.cancellations * easeOutCubic),
          availableDoctors: Math.round(targetValues.availableDoctors * easeOutCubic)
        })

        if (step >= steps) {
          clearInterval(timer)
          setAnimatedValues(targetValues)
        }
      }, stepDuration)
    }

    const timer = setTimeout(animateCounters, 300) // Start after page loads
    return () => clearTimeout(timer)
  }, [])

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
  }

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
  }

  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>


      {/* Main content */}
      <main className="flex-1 p-2 sm:p-6">
        <Toaster position="top-right" />
        {/* Header */}
        <div className={`mb-4 sm:mb-6 px-2 sm:px-6 transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
          <h1 className="text-lg sm:text-2xl font-bold">Good Morning, Care Coordinator</h1>
          <p className="text-gray-600 mt-1 text-xs sm:text-base">
            Here's your clinic overview for today
          </p>
        </div>

        {/* Dashboard cards */}
        <div className="mt-2 sm:mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 px-1 sm:px-6">
          {/* Card 1 - Today's Appointments */}
          <div className={`bg-white rounded-lg shadow p-3 sm:p-5 border-l-4 border-blue-500 transition-all duration-700 delay-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xs sm:text-base font-semibold text-gray-700">Today's Appointments</h2>
              <CalendarDays className="h-4 w-4 sm:h-6 sm:w-6 text-blue-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-3">{animatedValues.appointments}</p>
            <div className="mt-2 sm:mt-4 space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-gray-600">
                <span>09:00 AM</span>
                <span className="font-bold">John Doe</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>10:30 AM</span>
                <span className="font-bold">Jane Smith</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>11:15 AM</span>
                <span className="font-bold">David Johnson</span>
              </div>
            </div>
            <button className="mt-1 sm:mt-3 text-blue-500 text-xs sm:text-sm font-medium hover:underline">
              +1 more
            </button>
          </div>

          {/* Card 2 - New Patients Today */}
          <div className={`bg-white rounded-lg shadow p-3 sm:p-5 border-l-4 border-green-500 transition-all duration-700 delay-400 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/patients")}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xs sm:text-base font-semibold text-gray-700">New Patients Today</h2>
              <Users className="h-4 w-4 sm:h-6 sm:w-6 text-green-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-3">{animatedValues.newPatients}</p>
            <p className="text-xs sm:text-sm font-medium text-green-500 mt-1">+15% from yesterday</p>
          </div>

          {/* Card 3 - Cancellations */}
          <div className={`bg-white rounded-lg shadow p-3 sm:p-5 border-l-4 border-red-500 transition-all duration-700 delay-500 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xs sm:text-base font-semibold text-gray-700">Cancellations Today</h2>
              <UserX className="h-4 w-4 sm:h-6 sm:w-6 text-red-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-3">{animatedValues.cancellations}</p>
            <p className="text-xs sm:text-sm font-medium text-red-500 mt-1">2 resheduled</p>
          </div>

          {/* Card 4 - Available Doctors now */}
          {/* <div className={`bg-white rounded-lg shadow p-3 sm:p-5 border-l-4 border-purple-500 transition-all duration-700 delay-600 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xs sm:text-base font-semibold text-gray-700">Available Doctors Now</h2>
              <Stethoscope className="h-4 w-4 sm:h-6 sm:w-6 text-purple-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-3">{animatedValues.availableDoctors}</p>
            <p className="text-xs sm:text-sm font-medium text-purple-500 mt-1">out of 15 total</p>
          </div> */}
        </div>

        {/* Additional larger cards */}
        <div className="mt-4 sm:mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 px-1 sm:px-6">
          {/* Card 1 - Weekly Patient Visits */}
          <div className={`bg-white rounded-lg shadow p-3 sm:p-6 h-64 sm:h-80 flex flex-col transition-all duration-700 delay-700 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
            <div className="flex items-center mb-1 sm:mb-3">
              <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-blue-500 mr-2" />
              <h3 className="text-xs sm:text-lg font-semibold text-gray-700">Weekly Patient Visits</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-4">Patient visits over the last 7 days</p>
            <div className="flex-1">
              <Line data={weeklyVisitsData} options={weeklyVisitsOptions} />
            </div>
          </div>

          {/* Card 2 - Appointments Per Department */}
          <div className={`bg-white rounded-lg shadow p-3 sm:p-6 h-64 sm:h-80 flex flex-col transition-all duration-700 delay-800 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
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

          {/* Card 3 - Appointment Status */}
          <div className={`bg-white rounded-lg shadow p-3 sm:p-6 h-64 sm:h-80 flex flex-col items-center justify-start transition-all duration-700 delay-900 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
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

              {/* Legend */}
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
    </div>
  )
}
