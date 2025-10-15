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
                className={`bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500 transition-all duration-700 delay-500 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${isLoaded
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                    }`}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm sm:text-base font-semibold text-gray-700 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        Next Few Hours
                    </h2>
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-blue-500 text-xs flex items-center hover:underline"
                    >
                        View More <ChevronRight className="h-3 w-3 ml-1" />
                    </button>
                </div>

                <div className="space-y-3">
                    {upcomingView.map((time) => {
                        const appt = appointmentsByTime[time]
                        return (
                            <div
                                key={time}
                                className={`flex justify-between items-center p-2 rounded-md border ${appt
                                    ? "border-blue-300 bg-blue-50"
                                    : "border-gray-200 bg-gray-50"
                                    }`}
                            >
                                <span className="font-medium text-sm text-gray-700">{time}</span>
                                {appt ? (
                                    <div className="text-xs text-gray-600">
                                        <p className="font-semibold text-gray-800">{appt.patientName}</p>
                                        <p>{appt.reason}</p>
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-400 italic">No appointment</span>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* 🔹 Full-Day Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-2xl p-6 max-h-[80vh] overflow-y-auto relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-3 right-4 text-gray-500 hover:text-black"
                        >
                            ✖
                        </button>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-500" /> Full Day Schedule
                        </h3>
                        <div className="space-y-3">
                            {allSlots.map((time) => {
                                const appt = appointmentsByTime[time]
                                return (
                                    <div
                                        key={time}
                                        className={`flex justify-between items-center p-3 rounded-md border ${appt
                                            ? "border-blue-300 bg-blue-50"
                                            : "border-gray-100"
                                            }`}
                                    >
                                        <span className="font-medium text-sm text-gray-700">{time}</span>
                                        {appt ? (
                                            <div className="text-sm text-gray-700">
                                                <p className="font-semibold">{appt.patientName}</p>
                                                <p className="text-xs">{appt.reason}</p>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">No appointment</span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default TodaysSchedule
