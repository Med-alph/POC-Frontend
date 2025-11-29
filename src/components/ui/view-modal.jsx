import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { 
    Phone, 
    Mail, 
    MapPin, 
    Calendar, 
    Clock, 
    User, 
    Stethoscope,
    Award,
    Activity,
    Edit,
    Trash2
} from "lucide-react"

export default function ViewModal({ 
    isOpen, 
    onClose, 
    data, 
    type = "patient" // patient, doctor, appointment, reminder
}) {
    if (!data) return null

    const renderPatientDetails = () => (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b">
                <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                        {data.patient_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P'}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{data.patient_name}</h2>
                    <p className="text-gray-600">Patient ID: {data.id?.slice(0, 8)}...</p>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                        <p className="text-lg">{data.dob ? new Date(data.dob).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Age</label>
                        <p className="text-lg">{data.age} years old</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Contact Information</label>
                        <div className="flex items-center gap-2 mt-1">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span>{data.contact_info}</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-500">Insurance Provider</label>
                        <Badge className="bg-blue-100 text-blue-600 mt-1">
                            {data.insurance_provider}
                        </Badge>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Last Visit</label>
                        <p className="text-lg">
                            {data.last_visit ? new Date(data.last_visit).toLocaleDateString() : 'No visits yet'}
                        </p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Next Appointment</label>
                        <p className="text-lg">
                            {data.next_appointment ? new Date(data.next_appointment).toLocaleDateString() : 'No upcoming appointments'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Status */}
            <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Status</span>
                    <Badge className={
                        data.status === 'active' ? 'bg-green-100 text-green-600' : 
                        data.status === 'inactive' ? 'bg-gray-100 text-gray-600' : 
                        'bg-blue-100 text-blue-600'
                    }>
                        {data.status}
                    </Badge>
                </div>
            </div>
        </div>
    )

    const renderDoctorDetails = () => {
        // Parse availability
        let availabilityObj = {};
        try {
            if (data.availability) {
                availabilityObj = typeof data.availability === 'string' 
                    ? JSON.parse(data.availability) 
                    : data.availability;
            }
        } catch (e) {
            availabilityObj = {};
        }

        const initials = data.staff_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'D';

        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 pb-4 border-b">
                    <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{data.staff_name}</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Staff ID: {data.id?.slice(0, 8)}...</p>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</label>
                            <p className="text-lg text-gray-900 dark:text-white">{data.department || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Experience</label>
                            <p className="text-lg text-gray-900 dark:text-white">{data.experience || 0} years</p>
                        </div>
                        {data.designation && (
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Designation</label>
                                <p className="text-lg text-gray-900 dark:text-white">
                                    {typeof data.designation === 'object' ? data.designation.name : data.designation}
                                </p>
                            </div>
                        )}
                        <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Information</label>
                            <div className="space-y-2 mt-1">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-500" />
                                    <span className="text-gray-900 dark:text-white">{data.contact_info || 'N/A'}</span>
                                </div>
                                {data.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-gray-500" />
                                        <span className="text-gray-900 dark:text-white">{data.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Availability</label>
                            <div className="mt-1">
                                {Object.keys(availabilityObj).length > 0 ? (
                                    <div className="space-y-1">
                                        {Object.entries(availabilityObj).map(([day, time]) => (
                                            <div key={day} className="text-sm">
                                                <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{day}:</span>
                                                <span className="ml-2 text-gray-600 dark:text-gray-400">{time}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400">Not set</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                            <Badge className={
                                data.status === 'active' 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 mt-1' 
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700 mt-1'
                            }>
                                {data.status || 'N/A'}
                            </Badge>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                            <p className="text-lg text-gray-900 dark:text-white">
                                {data.created_at ? new Date(data.created_at).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const renderAppointmentDetails = () => (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Appointment Details</h2>
                    <p className="text-gray-600">Appointment ID: {data.id?.slice(0, 8)}...</p>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-500">Patient</label>
                        <p className="text-lg">{data.patient_name}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Doctor</label>
                        <p className="text-lg">{data.doctor_name}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Date & Time</label>
                        <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>{new Date(data.appointment_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span>{data.appointment_time}</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-500">Type</label>
                        <Badge className="bg-blue-100 text-blue-600 mt-1">
                            {data.appointment_type}
                        </Badge>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Duration</label>
                        <p className="text-lg">{data.duration} minutes</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Notes</label>
                        <p className="text-lg">{data.notes || 'No notes available'}</p>
                    </div>
                </div>
            </div>

            {/* Status */}
            <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Status</span>
                    <Badge className={
                        data.status === 'scheduled' ? 'bg-blue-100 text-blue-600' : 
                        data.status === 'completed' ? 'bg-green-100 text-green-600' : 
                        data.status === 'cancelled' ? 'bg-red-100 text-red-600' : 
                        'bg-gray-100 text-gray-600'
                    }>
                        {data.status}
                    </Badge>
                </div>
            </div>
        </div>
    )

    const renderReminderDetails = () => {
        const patient = data.patient || {}
        const assignedTo = data.assigned_to || {}
        const patientName = patient.patient_name || "Unknown Patient"
        const assignedToName = assignedTo.name || assignedTo.staff_name || "Unassigned"
        const dueDate = data.due_date ? new Date(data.due_date) : null
        const isOverdue = dueDate && dueDate < new Date() && data.status !== 'completed'
        
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 pb-4 border-b">
                    <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Reminder Details</h2>
                        <p className="text-gray-600">Reminder ID: {data.id?.slice(0, 8)}...</p>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Reminder Type</label>
                            <p className="text-lg">{data.reminder_type || "N/A"}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Message/Description</label>
                            <p className="text-lg">{data.message || "No description provided"}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Patient</label>
                            <div className="flex items-center gap-2 mt-1">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                        {patientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                <p className="text-lg">{patientName}</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Assigned To</label>
                            <div className="flex items-center gap-2 mt-1">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                        {assignedToName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                <p className="text-lg">{assignedToName}</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Due Date & Time</label>
                            {dueDate ? (
                                <>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                        <span>{dueDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Clock className="h-4 w-4 text-gray-500" />
                                        <span>{dueDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                                    </div>
                                </>
                            ) : (
                                <p className="text-lg">N/A</p>
                            )}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Priority</label>
                            <Badge className={
                                data.priority === 'high' ? 'bg-red-100 text-red-600' : 
                                data.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 
                                'bg-green-100 text-green-600'
                            }>
                                {data.priority || "Medium"}
                            </Badge>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Created</label>
                            <p className="text-lg">
                                {data.created_at ? new Date(data.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A"}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Last Updated</label>
                            <p className="text-lg">
                                {data.updated_at ? new Date(data.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status */}
                <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Status</span>
                        <Badge className={
                            data.status === 'completed' ? 'bg-green-100 text-green-600' : 
                            isOverdue ? 'bg-red-100 text-red-600' : 
                            data.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 
                            'bg-gray-100 text-gray-600'
                        }>
                            {isOverdue ? 'Overdue' : (data.status || 'Pending')}
                        </Badge>
                    </div>
                </div>
            </div>
        )
    }

    const getTitle = () => {
        switch (type) {
            case 'patient': return 'Patient Details'
            case 'doctor': return 'Doctor Details'
            case 'appointment': return 'Appointment Details'
            case 'reminder': return 'Reminder Details'
            default: return 'Details'
        }
    }

    const renderContent = () => {
        switch (type) {
            case 'patient': return renderPatientDetails()
            case 'doctor': return renderDoctorDetails()
            case 'appointment': return renderAppointmentDetails()
            case 'reminder': return renderReminderDetails()
            default: return renderPatientDetails()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[85vh] sm:h-[90vh] flex flex-col modal-content">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="text-xl font-semibold">
                        {getTitle()}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto mt-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {renderContent()}
                </div>
                <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t mt-4">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
