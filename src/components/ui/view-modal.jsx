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
    Trash2,
    Bell,
    MessageCircle,
    Lock
} from "lucide-react"

export default function ViewModal({
    isOpen,
    onClose,
    data,
    type = "patient", // patient, doctor, appointment, reminder
    onEdit,
    onDelete
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
                            {data.insurance_provider || 'N/A'}
                        </Badge>
                    </div>
                    {data.insurance_number && (
                        <div>
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                                Insurance Number
                                <Lock className="h-3 w-3 text-blue-500" />
                            </label>
                            <p className="text-lg font-mono">{data.insurance_number}</p>
                        </div>
                    )}
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

            {/* Status & Credit */}
            <div className="pt-4 border-t space-y-4">
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

                {(() => {
                    try {
                        const user = JSON.parse(localStorage.getItem('user') || '{}');
                        const isAdmin = user.role === 'hospital_admin' || user.role === 'super_admin' || user.role === 'admin';
                        if (isAdmin) {
                            return (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-500">Credit Eligible</span>
                                        <Badge className={data.is_credit_eligible === 'yes' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}>
                                            {data.is_credit_eligible === 'yes' ? 'Yes' : 'No'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-500">Remaining Credit</span>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-green-600">₹{(parseFloat(data.credit_amount || 0) - parseFloat(data.current_credit_balance || 0)).toFixed(2)}</p>
                                            <p className="text-[10px] text-gray-400">Limit: ₹{parseFloat(data.credit_amount || 0).toFixed(2)}</p>
                                        </div>
                                    </div>
                                </>
                            );
                        }
                    } catch (e) { }
                    return null;
                })()}
            </div>
        </div>
    )

    const renderDoctorDetails = () => (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b">
                <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                        {data.staff_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'D'}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{data.staff_name}</h2>
                    <p className="text-gray-600">Staff ID: {data.id?.slice(0, 8)}...</p>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-500">Department</label>
                        <Badge className="bg-blue-100 text-blue-600 mt-1">
                            {data.department}
                        </Badge>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Experience</label>
                        <p className="text-lg">{data.experience} years</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Contact Information</label>
                        <div className="space-y-2 mt-1">
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <span>{data.contact_info}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span>{data.email}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-500">Availability</label>
                        <div className="mt-1">
                            {data.availability ? (
                                <div className="space-y-1">
                                    {Object.entries(
                                        typeof data.availability === 'string'
                                            ? JSON.parse(data.availability)
                                            : data.availability
                                    ).map(([day, time]) => (
                                        <div key={day} className="text-sm">
                                            <span className="font-medium capitalize">{day}:</span> {time}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500">Not set</p>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Assigned To</label>
                        <p className="text-lg">{data.assigned_to?.name || data.assigned_to?.staff_name || data.assignedTo || "Not assigned"}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Reminder Channels</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {(data.reminder_channels || []).map((channel) => (
                                <Badge key={channel} className="bg-gray-100 text-gray-600 capitalize">
                                    {channel}
                                </Badge>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Created</label>
                        <p className="text-lg">
                            {data.created_at ? new Date(data.created_at).toLocaleDateString() : 'N/A'}
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
        const channels = data.reminder_channels || []
        const sentChannels = data.sent_channels || {}
        const sentAt = data.sent_at || {}

        const getChannelIcon = (channel) => {
            switch (channel) {
                case 'inapp': return <Bell className="h-4 w-4" />
                case 'email': return <Mail className="h-4 w-4" />
                case 'whatsapp': return <MessageCircle className="h-4 w-4" />
                case 'call': return <Phone className="h-4 w-4" />
                default: return null
            }
        }

        const getChannelName = (channel) => {
            switch (channel) {
                case 'inapp': return 'In-App Notification'
                case 'email': return 'Email'
                case 'whatsapp': return 'WhatsApp'
                case 'call': return 'Phone Call'
                default: return channel
            }
        }

        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 pb-4 border-b">
                    <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{data.title || data.reminder_type || 'Reminder Details'}</h2>
                        <p className="text-gray-600">Reminder ID: {data.id?.slice(0, 8)}...</p>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Reminder Type</label>
                            <p className="text-lg font-semibold">{data.reminder_type || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Patient</label>
                            <div className="flex items-center gap-2 mt-1">
                                <User className="h-4 w-4 text-gray-500" />
                                <p className="text-lg">{patient.patient_name || 'N/A'}</p>
                            </div>
                            {patient.email && (
                                <div className="flex items-center gap-2 mt-1">
                                    <Mail className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm text-gray-600">{patient.email}</span>
                                </div>
                            )}
                            {patient.contact_info && (
                                <div className="flex items-center gap-2 mt-1">
                                    <Phone className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm text-gray-600">{patient.contact_info}</span>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Message</label>
                            <p className="text-lg mt-1 bg-gray-50 p-3 rounded-md">{data.message || 'No message provided'}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Due Date</label>
                            <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-lg">{data.due_date ? new Date(data.due_date).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                        {data.reminder_time && (
                            <div>
                                <label className="text-sm font-medium text-gray-500">Reminder Time</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    <span className="text-lg">{new Date(data.reminder_time).toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="text-sm font-medium text-gray-500">Priority</label>
                            <div className="mt-1">
                                <Badge className={
                                    data.priority === 'high' ? 'bg-red-100 text-red-600' :
                                        data.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                            'bg-green-100 text-green-600'
                                }>
                                    {data.priority || 'medium'}
                                </Badge>
                            </div>
                        </div>
                        {assignedTo.name || assignedTo.staff_name ? (
                            <div>
                                <label className="text-sm font-medium text-gray-500">Assigned To</label>
                                <p className="text-lg mt-1">{assignedTo.name || assignedTo.staff_name}</p>
                            </div>
                        ) : null}
                        <div>
                            <label className="text-sm font-medium text-gray-500">Created</label>
                            <p className="text-lg mt-1">
                                {data.created_at ? new Date(data.created_at).toLocaleString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Reminder Channels */}
                {channels.length > 0 && (
                    <div className="pt-4 border-t">
                        <label className="text-sm font-medium text-gray-500 mb-3 block">Notification Channels</label>
                        <div className="grid grid-cols-2 gap-3">
                            {channels.map((channel) => (
                                <div key={channel} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                    <div className="flex items-center gap-2">
                                        {getChannelIcon(channel)}
                                        <span className="text-sm font-medium">{getChannelName(channel)}</span>
                                    </div>
                                    {sentChannels[channel] ? (
                                        <Badge className="bg-green-100 text-green-600 text-xs">
                                            Sent {sentAt[channel] ? new Date(sentAt[channel]).toLocaleString() : ''}
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-yellow-100 text-yellow-600 text-xs">Pending</Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Status */}
                <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Status</span>
                        <Badge className={
                            data.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                                data.status === 'done' ? 'bg-green-100 text-green-600' :
                                    data.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                                        'bg-gray-100 text-gray-600'
                        }>
                            {data.status || 'pending'}
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
                    {onEdit && (
                        <Button onClick={() => { onEdit(data); onClose(); }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                    )}
                    {onDelete && (
                        <Button variant="destructive" onClick={() => { onDelete(data); onClose(); }}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
