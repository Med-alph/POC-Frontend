import React, { useState } from "react"
import { Clock, Calendar, ChevronRight } from "lucide-react"
import { todaysAppointments } from "../doctorAppointmentsData"

const getTimeSlots = (startHour = 8, endHour = 17) => {
    const slots = []
    for (let h = startHour; h < endHour; h++) {
        const hour = h % 12 === 0 ? 12 : h % 12
        const ampm = h < 12 ? "AM" : "PM"
        slots.push(`${hour}:00 ${ampm}`)
    }
    return slots
}

const TodaysSchedule = () => {
    const [showModal, setShowModal] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    React.useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 300)
        return () => clearTimeout(timer)
    }, [])

    const allSlots = getTimeSlots(8, 18)
    const now = new Date()
    const currentHour = now.getHours()
    const currentIndex = allSlots.findIndex(slot => {
        const [time, ampm] = slot.split(" ")
        let hour = parseInt(time.split(":")[0])
        if (ampm === "PM" && hour !== 12) hour += 12
        if (ampm === "AM" && hour === 12) hour = 0
        return hour === currentHour
    })
    const startIndex = currentIndex === -1 ? 0 : currentIndex
    const upcomingView = allSlots.slice(startIndex, startIndex + 5)


    // Map appointments by time for easy lookup
    const appointmentsByTime = todaysAppointments.reduce((acc, appt) => {
        acc[appt.time] = appt
        return acc
    }, {})

    return (
        <>
            <div
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-0 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${isLoaded
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                    }`}
            >
                <div className="bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-white p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-bold flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Clock className="h-6 w-6" />
                            </div>
                            Next Few Hours
                        </h2>
                        <button
                            onClick={() => setShowModal(true)}
                            className="text-white text-sm font-semibold flex items-center gap-2 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all"
                        >
                            View More <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                    <p className="text-yellow-100 text-sm">Upcoming appointments schedule</p>
                </div>
                <div className="p-6">

                    <div className="space-y-3">
                        {upcomingView.map((time) => {
                            const appt = appointmentsByTime[time]
                            return (
                                <div
                                    key={time}
                                    className={`flex justify-between items-center p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                                        appt
                                            ? "border-blue-300 dark:border-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
                                            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
                                    }`}
                                >
                                    <span className="font-bold text-base text-gray-900 dark:text-white">{time}</span>
                                    {appt ? (
                                        <div className="text-sm text-right">
                                            <p className="font-bold text-gray-900 dark:text-white">{appt.patientName}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">{appt.reason}</p>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">No appointment</span>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* 🔹 Full-Day Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    />
                    <div className="relative z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 animate-in fade-in-0 zoom-in-95">
                        <div className="bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-white p-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <Calendar className="h-6 w-6" />
                                    </div>
                                    Full Day Schedule
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                                    aria-label="Close"
                                >
                                    ✖
                                </button>
                            </div>
                        </div>
                        <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
                            <div className="space-y-3">
                                {allSlots.map((time) => {
                                    const appt = appointmentsByTime[time]
                                    return (
                                        <div
                                            key={time}
                                            className={`flex justify-between items-center p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                                                appt
                                                    ? "border-blue-300 dark:border-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
                                                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
                                            }`}
                                        >
                                            <span className="font-bold text-base text-gray-900 dark:text-white">{time}</span>
                                            {appt ? (
                                                <div className="text-sm text-right">
                                                    <p className="font-bold text-gray-900 dark:text-white">{appt.patientName}</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">{appt.reason}</p>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 dark:text-gray-500 italic">No appointment</span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default TodaysSchedule
