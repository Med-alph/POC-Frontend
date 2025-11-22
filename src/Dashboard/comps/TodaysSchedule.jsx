import React, { useState } from "react"
import { Clock, Calendar, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
            <Card className="border border-gray-200 dark:border-gray-700">
                <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            Next Few Hours
                        </CardTitle>
                        <button
                            onClick={() => setShowModal(true)}
                            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                        >
                            View More <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="space-y-2">
                        {upcomingView.map((time) => {
                            const appt = appointmentsByTime[time]
                            return (
                                <div
                                    key={time}
                                    className={`flex justify-between items-center p-3 rounded-md border transition-colors ${
                                        appt
                                            ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
                                            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                                    }`}
                                >
                                    <span className="font-medium text-sm text-gray-900 dark:text-white">{time}</span>
                                    {appt ? (
                                        <div className="text-right">
                                            <p className="font-medium text-sm text-gray-900 dark:text-white">{appt.patientName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{appt.reason}</p>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">No appointment</span>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Full-Day Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div 
                        className="fixed inset-0 bg-black/50"
                        onClick={() => setShowModal(false)}
                    />
                    <div className="relative z-50 bg-white dark:bg-gray-800 rounded-md shadow-lg w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                    Full Day Schedule
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                                    aria-label="Close"
                                >
                                    ✖
                                </button>
                            </div>
                        </div>
                        <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
                            <div className="space-y-2">
                                {allSlots.map((time) => {
                                    const appt = appointmentsByTime[time]
                                    return (
                                        <div
                                            key={time}
                                            className={`flex justify-between items-center p-3 rounded-md border transition-colors ${
                                                appt
                                                    ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
                                                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                                            }`}
                                        >
                                            <span className="font-medium text-sm text-gray-900 dark:text-white">{time}</span>
                                            {appt ? (
                                                <div className="text-right">
                                                    <p className="font-medium text-sm text-gray-900 dark:text-white">{appt.patientName}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{appt.reason}</p>
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
