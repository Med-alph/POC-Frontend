import React, { useState } from "react";
import DoctorAppointments from "./DoctorAppointments";
import { CalendarDays, Users, UserX, Stethoscope, TrendingUp, BarChart2, Clock } from "lucide-react"
import TodaysSchedule from "./comps/TodaysSchedule";

const DoctorDashboard = () => {

    const [isLoaded, setIsLoaded] = useState(true)
    const [animatedValues, setAnimatedValues] = useState({
        appointments: 0,
        newPatients: 0,
        cancellations: 0,
        availableDoctors: 0
    })


    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 transition-all">
            <div className="mb-4">
                <h1 className="text-2xl font-bold">Good Morning, Dr. Smith</h1>
                <p className="text-gray-600">Here’s your schedule for today</p>
            </div>

            {/* Grid layout for cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="col-span-1 lg:col-span-1">
                    <DoctorAppointments />
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

                <div className={`bg-white rounded-lg shadow p-3 sm:p-5 border-l-4 border-green-500 transition-all duration-700 delay-500 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}>

                    <h3 className="font-semibold text-gray-700 mb-2">Quick Stats</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li>✔️ Completed: 12</li>
                        <li>⏳ Pending: 5</li>
                        <li>❌ Cancelled: 3</li>
                    </ul>

                </div>


                <div className="col-span-1 lg:col-span-1">
                    <TodaysSchedule />
                    {/* Other dashboard widgets here */}
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;
