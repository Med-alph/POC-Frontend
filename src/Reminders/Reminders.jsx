import React, { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import toast, { Toaster } from 'react-hot-toast'

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Search, FileText, Calendar, Plus, Filter, Bell, Clock, 
  CheckCircle, Edit, Trash2, MoreHorizontal, Eye, Loader2
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

import ViewModal from "@/components/ui/view-modal"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { remindersAPI } from "../api/remindersapi"
import { patientsAPI } from "../api/patientsapi"
import { staffApi } from "../api/staffapi"

export default function Reminders() {
    const user = useSelector((state) => state.auth.user)
    const HOSPITAL_ID = user?.hospital_id || "550e8400-e29b-41d4-a716-446655440001"

    const [reminders, setReminders] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [priorityFilter, setPriorityFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [viewModalOpen, setViewModalOpen] = useState(false)
    const [selectedReminder, setSelectedReminder] = useState(null)
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [completeModalOpen, setCompleteModalOpen] = useState(false)
    const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false)
    
    // Form states
    const [formData, setFormData] = useState({
        patient_id: "",
        reminder_type: "",
        due_date: "",
        due_time: "",
        priority: "medium",
        assigned_to_id: "",
        message: ""
    })
    const [patients, setPatients] = useState([])
    const [staffList, setStaffList] = useState([])
    const [formLoading, setFormLoading] = useState(false)
    const [completeNotes, setCompleteNotes] = useState("")

    const fetchReminders = async () => {
        setLoading(true)
        try {
            const params = {
                hospital_id: HOSPITAL_ID,
                limit: 100,
                offset: 0,
            }
            
            if (searchTerm) {
                params.search = searchTerm
            }
            
            if (priorityFilter !== "all") {
                params.priority = priorityFilter
            }
            
            if (statusFilter !== "all") {
                params.status = statusFilter === "overdue" ? "pending" : statusFilter
            }
            
            const result = await remindersAPI.getAll(params)
            
            let remindersData = Array.isArray(result.data) ? result.data : []
            
            // Filter overdue reminders if status filter is "overdue"
            if (statusFilter === "overdue") {
                const now = new Date()
                remindersData = remindersData.filter(r => {
                    const dueDate = new Date(r.due_date)
                    return dueDate < now && r.status !== "completed"
                })
            }
            
            setReminders(remindersData)
        } catch (err) {
            console.error("Error fetching reminders:", err)
            toast.error("Failed to load reminders. Please try again.")
            setReminders([])
        } finally {
            setLoading(false)
        }
    }

    const fetchPatients = async () => {
        try {
            const result = await patientsAPI.getAll({ hospital_id: HOSPITAL_ID, limit: 1000 })
            setPatients(Array.isArray(result.data) ? result.data : [])
        } catch (err) {
            console.error("Error fetching patients:", err)
        }
    }

    const fetchStaff = async () => {
        try {
            const result = await staffApi.getAll({ hospital_id: HOSPITAL_ID, limit: 1000 })
            const activeStaff = (Array.isArray(result.data) ? result.data : []).filter(
                s => s.status?.toLowerCase() === "active" && !s.is_archived
            )
            setStaffList(activeStaff)
        } catch (err) {
            console.error("Error fetching staff:", err)
        }
    }

    useEffect(() => {
        fetchReminders()
        fetchPatients()
        fetchStaff()
    }, [])

    useEffect(() => {
        fetchReminders()
    }, [searchTerm, priorityFilter, statusFilter])

    const handleViewReminder = (reminder) => {
        setSelectedReminder(reminder)
        setViewModalOpen(true)
    }

    const handleCreateReminder = () => {
        setFormData({
            patient_id: "",
            reminder_type: "",
            due_date: "",
            due_time: "",
            priority: "medium",
            assigned_to_id: "",
            message: ""
        })
        setCreateModalOpen(true)
    }

    const handleEditReminder = (reminder) => {
        const dueDate = new Date(reminder.due_date)
        const dateStr = dueDate.toISOString().split('T')[0]
        const timeStr = dueDate.toTimeString().slice(0, 5)
        
        setFormData({
            patient_id: reminder.patient_id || "",
            reminder_type: reminder.reminder_type || "",
            due_date: dateStr,
            due_time: timeStr,
            priority: reminder.priority || "medium",
            assigned_to_id: reminder.assigned_to_id || "",
            message: reminder.message || ""
        })
        setSelectedReminder(reminder)
        setEditModalOpen(true)
    }

    const handleDeleteReminder = (reminder) => {
        setSelectedReminder(reminder)
        setDeleteModalOpen(true)
    }

    const handleMarkComplete = (reminder) => {
        setSelectedReminder(reminder)
        setCompleteNotes("")
        setCompleteModalOpen(true)
    }

    const handleReschedule = (reminder) => {
        const dueDate = new Date(reminder.due_date)
        const dateStr = dueDate.toISOString().split('T')[0]
        const timeStr = dueDate.toTimeString().slice(0, 5)
        
        setFormData({
            patient_id: reminder.patient_id || "",
            reminder_type: reminder.reminder_type || "",
            due_date: dateStr,
            due_time: timeStr,
            priority: reminder.priority || "medium",
            assigned_to_id: reminder.assigned_to_id || "",
            message: reminder.message || ""
        })
        setSelectedReminder(reminder)
        setRescheduleModalOpen(true)
    }

    const submitCreateReminder = async () => {
        if (!formData.patient_id || !formData.reminder_type || !formData.due_date || !formData.due_time) {
            toast.error("Please fill in all required fields")
            return
        }

        setFormLoading(true)
        try {
            // Validate and create date
            if (!formData.due_date || !formData.due_time) {
                toast.error("Please select both date and time")
                setFormLoading(false)
                return
            }
            
            // Ensure time format includes seconds if needed
            const timeStr = formData.due_time.includes(':') && formData.due_time.split(':').length === 2 
                ? `${formData.due_time}:00` 
                : formData.due_time
            
            const dateTimeString = `${formData.due_date}T${timeStr}`
            const dueDateTime = new Date(dateTimeString)
            
            if (isNaN(dueDateTime.getTime())) {
                console.error("Invalid date created:", { dateTimeString, due_date: formData.due_date, due_time: formData.due_time })
                toast.error("Invalid date or time. Please check your input.")
                setFormLoading(false)
                return
            }
            
            const isoDateString = dueDateTime.toISOString()
            console.log("Sending reminder with date:", isoDateString)
            
            await remindersAPI.create({
                hospital_id: HOSPITAL_ID,
                patient_id: formData.patient_id,
                reminder_type: formData.reminder_type,
                due_date: isoDateString,
                priority: formData.priority,
                assigned_to_id: formData.assigned_to_id || undefined,
                message: formData.message || undefined,
            })
            
            toast.success("Reminder created successfully")
            setCreateModalOpen(false)
            fetchReminders()
        } catch (err) {
            console.error("Error creating reminder:", err)
            toast.error(err.message || "Failed to create reminder")
        } finally {
            setFormLoading(false)
        }
    }

    const submitEditReminder = async () => {
        if (!formData.patient_id || !formData.reminder_type || !formData.due_date || !formData.due_time) {
            toast.error("Please fill in all required fields")
            return
        }

        setFormLoading(true)
        try {
            // Validate and create date
            const dateTimeString = `${formData.due_date}T${formData.due_time}`
            const dueDateTime = new Date(dateTimeString)
            
            if (isNaN(dueDateTime.getTime())) {
                toast.error("Invalid date or time. Please check your input.")
                setFormLoading(false)
                return
            }
            
            await remindersAPI.update(selectedReminder.id, {
                patient_id: formData.patient_id,
                reminder_type: formData.reminder_type,
                due_date: dueDateTime.toISOString(),
                priority: formData.priority,
                assigned_to_id: formData.assigned_to_id || undefined,
                message: formData.message || undefined,
            })
            
            toast.success("Reminder updated successfully")
            setEditModalOpen(false)
            fetchReminders()
        } catch (err) {
            console.error("Error updating reminder:", err)
            toast.error(err.message || "Failed to update reminder")
        } finally {
            setFormLoading(false)
        }
    }

    const submitDeleteReminder = async () => {
        setFormLoading(true)
        try {
            await remindersAPI.delete(selectedReminder.id)
            toast.success("Reminder deleted successfully")
            setDeleteModalOpen(false)
            fetchReminders()
        } catch (err) {
            console.error("Error deleting reminder:", err)
            toast.error(err.message || "Failed to delete reminder")
        } finally {
            setFormLoading(false)
        }
    }

    const submitMarkComplete = async () => {
        setFormLoading(true)
        try {
            await remindersAPI.markCompleted(selectedReminder.id, completeNotes)
            toast.success("Reminder marked as completed")
            setCompleteModalOpen(false)
            fetchReminders()
        } catch (err) {
            console.error("Error marking reminder complete:", err)
            toast.error(err.message || "Failed to mark reminder as complete")
        } finally {
            setFormLoading(false)
        }
    }

    const submitReschedule = async () => {
        if (!formData.due_date || !formData.due_time) {
            toast.error("Please select a new date and time")
            return
        }

        setFormLoading(true)
        try {
            // Validate and create date
            const dateTimeString = `${formData.due_date}T${formData.due_time}`
            const dueDateTime = new Date(dateTimeString)
            
            if (isNaN(dueDateTime.getTime())) {
                toast.error("Invalid date or time. Please check your input.")
                setFormLoading(false)
                return
            }
            
            await remindersAPI.update(selectedReminder.id, {
                due_date: dueDateTime.toISOString(),
            })
            
            toast.success("Reminder rescheduled successfully")
            setRescheduleModalOpen(false)
            fetchReminders()
        } catch (err) {
            console.error("Error rescheduling reminder:", err)
            toast.error(err.message || "Failed to reschedule reminder")
        } finally {
            setFormLoading(false)
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return "N/A"
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    }

    const formatTime = (dateString) => {
        if (!dateString) return "N/A"
        const date = new Date(dateString)
        return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    }

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case "high": return "bg-red-100 text-red-700"
            case "medium": return "bg-yellow-100 text-yellow-700"
            case "low": return "bg-green-100 text-green-700"
            default: return "bg-gray-100 text-gray-700"
        }
    }

    const getStatusColor = (status, dueDate) => {
        const now = new Date()
        const due = new Date(dueDate)
        
        if (status === "completed") return "bg-green-100 text-green-700"
        if (due < now && status !== "completed") return "bg-red-100 text-red-700"
        if (status === "pending") return "bg-yellow-100 text-yellow-700"
        return "bg-blue-100 text-blue-700"
    }

    const getStatusLabel = (status, dueDate) => {
        const now = new Date()
        const due = new Date(dueDate)
        
        if (status === "completed") return "Completed"
        if (due < now && status !== "completed") return "Overdue"
        if (status === "pending") return "Pending"
        return status || "Pending"
    }

    const getInitials = (name) => {
        if (!name) return "?"
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <main className="flex-1 p-6 lg:p-8">
                <Toaster position="top-right" />
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">Reminders</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Manage and view all Reminders information
                    </p>
                </div>

                <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 text-sm font-medium rounded-md flex items-center gap-2 mb-6"
                    onClick={handleCreateReminder}
                >
                    <Plus className="h-4 w-4" />
                    Add New Reminder
                </Button>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 w-full md:w-auto flex-wrap">
                        <div className="relative w-full sm:w-64 md:w-80 lg:w-96">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                            <Input
                                type="text"
                                placeholder="Search Reminders..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <Select
                            className="w-full sm:w-40 md:w-40 lg:w-48"
                            value={priorityFilter}
                            onValueChange={setPriorityFilter}
                        >
                            <SelectTrigger className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                                <SelectValue placeholder="All priorities" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All priorities</SelectItem>
                                <SelectItem value="high">High Priority</SelectItem>
                                <SelectItem value="medium">Medium Priority</SelectItem>
                                <SelectItem value="low">Low Priority</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            className="w-full sm:w-40 md:w-40 lg:w-48"
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                        >
                            <SelectTrigger className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                <SelectValue placeholder="All status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="overdue">Overdue</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 text-sm whitespace-nowrap mt-2 md:mt-0">
                        <Filter className="h-4 w-4" />
                        <span>{reminders.length} of {reminders.length} reminders</span>
                    </div>
                </div>

                {/* Reminders Table */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                            <span className="ml-2 text-gray-500">Loading reminders...</span>
                        </div>
                    ) : (
                        <Table className="min-w-[700px] md:min-w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Reminder Type</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Assigned To</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reminders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                            No reminders found
                                        </TableCell>
                                    </TableRow>
                                ) : reminders.map((reminder) => {
                                    const patient = reminder.patient || {}
                                    const assignedTo = reminder.assigned_to || {}
                                    const patientName = patient.patient_name || "Unknown Patient"
                                    const assignedToName = assignedTo.name || assignedTo.staff_name || "Unassigned"
                                    
                                    return (
                                        <TableRow key={reminder.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback>{getInitials(patientName)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{patientName}</p>
                                                        <p className="text-xs text-gray-500">ID: {reminder.id?.slice(0, 8)}...</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{reminder.reminder_type}</span>
                                                    {reminder.message && (
                                                        <span className="text-xs text-gray-500">{reminder.message}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-gray-500" />
                                                        <span className="font-medium">{formatDate(reminder.due_date)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-gray-500" />
                                                        <span className="text-sm text-gray-600">{formatTime(reminder.due_date)}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${getPriorityColor(reminder.priority)} border`}>
                                                    {reminder.priority || "Medium"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${getStatusColor(reminder.status, reminder.due_date)} border`}>
                                                    {getStatusLabel(reminder.status, reminder.due_date)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarFallback className="text-xs">{getInitials(assignedToName)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm">{assignedToName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => handleViewReminder(reminder)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => handleEditReminder(reminder)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleMarkComplete(reminder)}>
                                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                                Mark Complete
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleReschedule(reminder)}>
                                                                <Clock className="h-4 w-4 mr-2" />
                                                                Reschedule
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                className="text-red-600"
                                                                onClick={() => handleDeleteReminder(reminder)}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete Reminder
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* View Modal */}
                <ViewModal
                    isOpen={viewModalOpen}
                    onClose={() => setViewModalOpen(false)}
                    data={selectedReminder}
                    type="reminder"
                />

                {/* Create Reminder Modal */}
                <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create New Reminder</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Patient *</Label>
                                <Select value={formData.patient_id} onValueChange={(value) => setFormData({...formData, patient_id: value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select patient" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {patients.map(patient => (
                                            <SelectItem key={patient.id} value={patient.id}>
                                                {patient.patient_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Reminder Type *</Label>
                                <Input
                                    value={formData.reminder_type}
                                    onChange={(e) => setFormData({...formData, reminder_type: e.target.value})}
                                    placeholder="e.g., Multidisciplinary Team Meeting, Discharge Planning"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Due Date *</Label>
                                    <Input
                                        type="date"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label>Due Time *</Label>
                                    <Input
                                        type="time"
                                        value={formData.due_time}
                                        onChange={(e) => setFormData({...formData, due_time: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Priority</Label>
                                    <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Assigned To</Label>
                                    <Select 
                                        value={formData.assigned_to_id ? formData.assigned_to_id : "unassigned"} 
                                        onValueChange={(value) => setFormData({...formData, assigned_to_id: value === "unassigned" ? "" : value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select staff" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                            {staffList.map(staff => (
                                                <SelectItem key={staff.id} value={staff.id}>
                                                    {staff.staff_name || staff.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label>Message/Description</Label>
                                <Textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                    placeholder="Additional notes or description"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
                            <Button onClick={submitCreateReminder} disabled={formLoading}>
                                {formLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Create
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Reminder Modal */}
                <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Reminder</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Patient *</Label>
                                <Select value={formData.patient_id} onValueChange={(value) => setFormData({...formData, patient_id: value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select patient" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {patients.map(patient => (
                                            <SelectItem key={patient.id} value={patient.id}>
                                                {patient.patient_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Reminder Type *</Label>
                                <Input
                                    value={formData.reminder_type}
                                    onChange={(e) => setFormData({...formData, reminder_type: e.target.value})}
                                    placeholder="e.g., Multidisciplinary Team Meeting"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Due Date *</Label>
                                    <Input
                                        type="date"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label>Due Time *</Label>
                                    <Input
                                        type="time"
                                        value={formData.due_time}
                                        onChange={(e) => setFormData({...formData, due_time: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Priority</Label>
                                    <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Assigned To</Label>
                                    <Select 
                                        value={formData.assigned_to_id ? formData.assigned_to_id : "unassigned"} 
                                        onValueChange={(value) => setFormData({...formData, assigned_to_id: value === "unassigned" ? "" : value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select staff" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                            {staffList.map(staff => (
                                                <SelectItem key={staff.id} value={staff.id}>
                                                    {staff.staff_name || staff.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label>Message/Description</Label>
                                <Textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                    placeholder="Additional notes or description"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
                            <Button onClick={submitEditReminder} disabled={formLoading}>
                                {formLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Update
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Reminder</DialogTitle>
                        </DialogHeader>
                        <p>Are you sure you want to delete this reminder? This action cannot be undone.</p>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={submitDeleteReminder} disabled={formLoading}>
                                {formLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Mark Complete Modal */}
                <Dialog open={completeModalOpen} onOpenChange={setCompleteModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Mark Reminder as Completed</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Completion Notes (Optional)</Label>
                                <Textarea
                                    value={completeNotes}
                                    onChange={(e) => setCompleteNotes(e.target.value)}
                                    placeholder="Add any notes about the completion"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCompleteModalOpen(false)}>Cancel</Button>
                            <Button onClick={submitMarkComplete} disabled={formLoading}>
                                {formLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Mark Complete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Reschedule Modal */}
                <Dialog open={rescheduleModalOpen} onOpenChange={setRescheduleModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reschedule Reminder</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>New Due Date *</Label>
                                    <Input
                                        type="date"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label>New Due Time *</Label>
                                    <Input
                                        type="time"
                                        value={formData.due_time}
                                        onChange={(e) => setFormData({...formData, due_time: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setRescheduleModalOpen(false)}>Cancel</Button>
                            <Button onClick={submitReschedule} disabled={formLoading}>
                                {formLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Reschedule
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    )
}
