import React, { useState, useEffect } from "react"
import toast, { Toaster } from 'react-hot-toast'
import { useHospital } from "../contexts/HospitalContext";

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
    CheckCircle, Edit, Trash2, MoreHorizontal, Eye
} from "lucide-react"

import ViewModal from "@/components/ui/view-modal"
import AddReminderDialog from "./AddReminderDialog"
import RescheduleReminderDialog from "./RescheduleReminderDialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { remindersAPI } from "@/api/remindersapi"

export default function Reminders() {
    const [reminders, setReminders] = useState([])
    const [totalReminders, setTotalReminders] = useState(0)
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [priorityFilter, setPriorityFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [viewModalOpen, setViewModalOpen] = useState(false)
    const [addModalOpen, setAddModalOpen] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false)
    const [selectedReminder, setSelectedReminder] = useState(null)
    const { hospitalInfo } = useHospital();
    const [hospitalId, setHospitalId] = useState("")

    useEffect(() => {
        // Get hospital_id from localStorage
        const userJson = localStorage.getItem('user');
        if (userJson) {
            try {
                const user = JSON.parse(userJson);
                const id = user.hospital_id || hospitalInfo?.hospital_id;
                setHospitalId(id);
            } catch (e) {
                console.error("Failed to parse user JSON:", e);
                setHospitalId(hospitalInfo?.hospital_id);
            }
        } else {
            setHospitalId(hospitalInfo?.hospital_id);
        }
    }, []);

    useEffect(() => {
        if (hospitalId) {
            fetchReminders();
        }
    }, [hospitalId, searchTerm, priorityFilter, statusFilter]);

    const fetchReminders = async () => {
        setLoading(true);
        try {
            const params = {
                hospital_id: hospitalId,
                limit: 100,
                offset: 0,
            };

            if (searchTerm) {
                params.search = searchTerm;
            }
            if (priorityFilter !== "all") {
                params.priority = priorityFilter;
            }
            if (statusFilter !== "all") {
                params.status = statusFilter === "completed" ? "done" : statusFilter;
            }

            const result = await remindersAPI.getAll(params);
            const remindersList = Array.isArray(result?.data) ? result.data : [];
            setReminders(remindersList);
            setTotalReminders(result?.total || remindersList.length);
        } catch (err) {
            console.error("Error fetching reminders:", err);
            toast.error("Failed to load reminders. Please try again.");
            setReminders([]);
            setTotalReminders(0);
        } finally {
            setLoading(false);
        }
    };

    const handleViewReminder = async (reminder) => {
        try {
            // Fetch full reminder details
            const fullReminder = await remindersAPI.getById(reminder.id);
            setSelectedReminder(fullReminder);
            setViewModalOpen(true);
        } catch (error) {
            console.error("Error fetching reminder details:", error);
            toast.error("Failed to load reminder details");
        }
    };

    const handleEditReminder = (reminder) => {
        setSelectedReminder(reminder);
        setEditModalOpen(true);
    };

    const handleDeleteReminder = async (reminder) => {
        if (!window.confirm(`Are you sure you want to delete this reminder?`)) {
            return;
        }

        try {
            await remindersAPI.delete(reminder.id);
            toast.success("Reminder deleted successfully");
            fetchReminders();
        } catch (error) {
            console.error("Error deleting reminder:", error);
            toast.error(error.message || "Failed to delete reminder");
        }
    };

    const handleMarkComplete = async (reminder) => {
        try {
            await remindersAPI.markCompleted(reminder.id);
            toast.success("Reminder marked as complete");
            fetchReminders();
        } catch (error) {
            console.error("Error marking reminder as complete:", error);
            toast.error(error.message || "Failed to mark reminder as complete");
        }
    };

    const handleRescheduleReminder = (reminder) => {
        setSelectedReminder(reminder);
        setRescheduleModalOpen(true);
    };

    const formatReminderData = (reminder) => {
        const patientName = reminder.patient?.patient_name || "Unknown Patient";
        const patientInitials = patientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const assignedToName = reminder.assigned_to?.name || reminder.assigned_to?.staff_name || "Not assigned";
        const assignedInitials = assignedToName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

        const dueDate = reminder.due_date
            ? new Date(reminder.due_date).toLocaleDateString()
            : "N/A";
        const dueTime = reminder.due_date
            ? new Date(reminder.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : reminder.reminder_time
                ? new Date(reminder.reminder_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : "";

        const priorityColors = {
            high: "bg-red-100 text-red-700",
            medium: "bg-yellow-100 text-yellow-700",
            low: "bg-green-100 text-green-700",
        };

        const statusColors = {
            pending: "bg-yellow-100 text-yellow-700",
            done: "bg-green-100 text-green-700",
            completed: "bg-green-100 text-green-700",
            cancelled: "bg-red-100 text-red-700",
        };

        return {
            ...reminder,
            patient: patientName,
            patientInitials,
            assignedTo: assignedToName,
            assignedInitials,
            dueDate,
            dueTime,
            priorityColor: priorityColors[reminder.priority] || priorityColors.medium,
            statusColor: statusColors[reminder.status] || statusColors.pending,
            type: reminder.reminder_type || reminder.type || "Reminder",
            description: reminder.message || reminder.description || "",
        };
    };

    const formattedReminders = reminders.map(formatReminderData);

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
                    onClick={() => setAddModalOpen(true)}
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
                                <SelectItem value="done">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 text-sm whitespace-nowrap mt-2 md:mt-0">
                        <Filter className="h-4 w-4" />
                        <span>{reminders.length} of {totalReminders} reminders</span>
                    </div>
                </div>

                {/* Reminders Table */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 overflow-x-auto">
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
                                {formattedReminders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                            No reminders found
                                        </TableCell>
                                    </TableRow>
                                ) : formattedReminders.map((reminder) => (
                                    <TableRow key={reminder.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>{reminder.patientInitials}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{reminder.patient}</p>
                                                    <p className="text-xs text-gray-500">ID: {reminder.id.slice(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{reminder.type}</span>
                                                {reminder.description && (
                                                    <span className="text-xs text-gray-500 line-clamp-1">
                                                        {reminder.description}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-gray-500" />
                                                    <span className="font-medium">{reminder.dueDate}</span>
                                                </div>
                                                {reminder.dueTime && (
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-gray-500" />
                                                        <span className="text-sm text-gray-600">{reminder.dueTime}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${reminder.priorityColor} border capitalize`}>
                                                {reminder.priority}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${reminder.statusColor} border capitalize`}>
                                                {reminder.status === 'done' ? 'completed' : reminder.status}
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
                                                {/* Mark Complete Button (outside card) */}
                                                {reminder.status !== 'done' && reminder.status !== 'completed' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => handleMarkComplete(reminder)}
                                                        title="Mark as Complete"
                                                    >
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => handleViewReminder(reminder)}
                                                    title="View"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => handleEditReminder(reminder)}
                                                    title="Edit"
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
                                                        {reminder.status !== 'done' && reminder.status !== 'completed' && (
                                                            <DropdownMenuItem onClick={() => handleMarkComplete(reminder)}>
                                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                                Mark Complete
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={() => handleRescheduleReminder(reminder)}>
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
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* View Modal */}
                <ViewModal
                    isOpen={viewModalOpen}
                    onClose={() => {
                        setViewModalOpen(false);
                        setSelectedReminder(null);
                    }}
                    data={selectedReminder}
                    type="reminder"
                />

                {/* Add Reminder Dialog */}
                <AddReminderDialog
                    open={addModalOpen}
                    setOpen={setAddModalOpen}
                    onSuccess={() => {
                        fetchReminders();
                        setAddModalOpen(false);
                    }}
                />

                {/* Edit Reminder Dialog */}
                <AddReminderDialog
                    open={editModalOpen}
                    setOpen={setEditModalOpen}
                    editReminder={selectedReminder}
                    onSuccess={() => {
                        fetchReminders();
                        setEditModalOpen(false);
                        setSelectedReminder(null);
                    }}
                />

                {/* Reschedule Reminder Dialog */}
                <RescheduleReminderDialog
                    open={rescheduleModalOpen}
                    setOpen={setRescheduleModalOpen}
                    reminder={selectedReminder}
                    onSuccess={() => {
                        fetchReminders();
                        setRescheduleModalOpen(false);
                        setSelectedReminder(null);
                    }}
                />
            </main>
        </div>
    )
}
