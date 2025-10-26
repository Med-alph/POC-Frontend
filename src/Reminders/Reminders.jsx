import React, { useState, useEffect } from "react"
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
  CheckCircle, Edit, Trash2, MoreHorizontal, Eye  // add Eye here
} from "lucide-react"

import ViewModal from "@/components/ui/view-modal"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Reminders() {
    const [reminders, setReminders] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [priorityFilter, setPriorityFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [viewModalOpen, setViewModalOpen] = useState(false)
    const [selectedReminder, setSelectedReminder] = useState(null)

    // Hardcoded sample reminder data for UI display
    const hardcodedReminders = [
  {
    id: '1',
    patientInitials: 'RK',
    patient: "Robert King",
    type: "Multidisciplinary Team (MDT) Meeting",
    description: "Discuss patient treatment plan with oncology, surgery, and radiology teams.",
    dueDate: "2025-11-10",
    dueTime: "10:00 AM",
    priority: "High",
    priorityColor: "bg-red-100 text-red-700",
    status: "Pending",
    statusColor: "bg-yellow-100 text-yellow-700",
    assignedInitials: "MD",
    assignedTo: "Dr. Mary Doe"
  },
  {
    id: '2',
    patientInitials: 'SL',
    patient: "Susan Lee",
    type: "Discharge Planning Meeting",
    description: "Coordinate home care and rehabilitation prior to discharge.",
    dueDate: "2025-11-12",
    dueTime: "02:00 PM",
    priority: "Medium",
    priorityColor: "bg-yellow-100 text-yellow-700",
    status: "Scheduled",
    statusColor: "bg-blue-100 text-blue-700",
    assignedInitials: "JS",
    assignedTo: "John Smith"
  },
  {
    id: '3',
    patientInitials: 'JM',
    patient: "Jessica Mead",
    type: "Clinical Governance Meeting",
    description: "Review patient safety incidents and quality improvement strategies.",
    dueDate: "2025-11-15",
    dueTime: "09:00 AM",
    priority: "High",
    priorityColor: "bg-red-100 text-red-700",
    status: "Upcoming",
    statusColor: "bg-gray-100 text-gray-700",
    assignedInitials: "MK",
    assignedTo: "Mark Kim"
  },
  {
    id: '4',
    patientInitials: 'DT',
    patient: "David Tennant",
    type: "Case Review Meeting",
    description: "Discuss complex cardiology patient cases and treatment revisions.",
    dueDate: "2025-11-18",
    dueTime: "11:30 AM",
    priority: "Low",
    priorityColor: "bg-green-100 text-green-700",
    status: "Completed",
    statusColor: "bg-green-100 text-green-700",
    assignedInitials: "LM",
    assignedTo: "Laura Miles"
  }
]

    const fetchReminders = async () => {
        setLoading(true)
        try {
            // For now, use hardcoded data instead of API call
            setReminders(hardcodedReminders)
        } catch (err) {
            console.error("Error fetching reminders:", err)
            toast.error("Failed to load reminders. Please try again.")
            setReminders([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReminders()
    }, [searchTerm, priorityFilter, statusFilter])

    const handleViewReminder = (reminder) => {
        setSelectedReminder(reminder)
        setViewModalOpen(true)
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* <Navbar /> */}

            <main className="flex-1 px-4 sm:px-6 md:px-10 lg:px-20 py-6">
                <Toaster position="top-right" />
                <h1 className="text-lg sm:text-2xl font-bold mb-2">Reminders</h1>
                <p className="text-gray-600 mt-0 mb-6 text-xs sm:text-base">
                    Manage and view all Reminders information
                </p>

                <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 mb-6">
                    <Plus className="h-4 w-4" />
                    Add New Reminder
                </Button>

                {/* Filters */}
                <div className="bg-white shadow rounded-lg pt-6 sm:pt-8 pb-4 px-4 sm:px-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0 mb-6">
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
                <div className="bg-white shadow rounded-lg p-4 sm:p-5 overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="text-gray-500">Loading reminders...</div>
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
                                ) : reminders.map((reminder) => (
                                    <TableRow key={reminder.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>{reminder.patientInitials}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{reminder.patient}</p>
                                                    <p className="text-xs text-gray-500">ID: {reminder.id}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{reminder.type}</span>
                                                <span className="text-xs text-gray-500">{reminder.description}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-gray-500" />
                                                    <span className="font-medium">{reminder.dueDate}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-gray-500" />
                                                    <span className="text-sm text-gray-600">{reminder.dueTime}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={reminder.priorityColor}>
                                                {reminder.priority}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={reminder.statusColor}>
                                                {reminder.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarFallback className="text-xs">{reminder.assignedInitials}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm">{reminder.assignedTo}</span>
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
                                                    onClick={() => toast.success(`Editing reminder ${reminder.id}`)}
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
                                                        <DropdownMenuItem>
                                                            <CheckCircle className="h-4 w-4 mr-2" />
                                                            Mark Complete
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Clock className="h-4 w-4 mr-2" />
                                                            Reschedule
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600">
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete Reminder
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
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
            </main>
        </div>
    )
}
