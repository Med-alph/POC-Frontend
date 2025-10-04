import React from "react"

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
import { Search, FileText, Calendar, Plus, Filter, Clock, User, Stethoscope } from "lucide-react"
import Navbar from "../Dashboard/Navbar"
import { Breadcrumb } from "@/components/ui/breadcrumb"

export default function Appointments() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Navbar */}
            <Navbar />

            {/* Main content */}
            <main className="flex-1 px-4 sm:px-6 md:px-10 lg:px-20 py-6">
                {/* Breadcrumbs */}
                <Breadcrumb items={[{ label: "Appointments" }]} />
                
                {/* Header Row */}
                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                    <div>
                        <h1 className="text-lg sm:text-2xl font-bold">Appointments</h1>
                        <p className="text-gray-600 mt-1 text-xs sm:text-base">
                            Manage and view all Appointments information
                        </p>
                    </div>

                    <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add New Appointment
                    </Button>
                </div>

                {/* Filters container */}
                <div className="bg-white shadow rounded-lg pt-6 sm:pt-8 pb-4 px-4 sm:px-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
                    {/* Left side: Search + Dropdowns */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 w-full md:w-auto flex-wrap">
                        {/* Search */}
                        <div className="relative w-full sm:w-64 md:w-80 lg:w-96">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                            <Input
                                type="text"
                                placeholder="Search Appointments..."
                                className="pl-9"
                            />
                        </div>

                        {/* Status Filter */}
                        <Select className="w-full sm:w-40 md:w-40 lg:w-48">
                            <SelectTrigger className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                                <SelectValue placeholder="All status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All status</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                <SelectItem value="rescheduled">Rescheduled</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Date Range Filter */}
                        <Select className="w-full sm:w-40 md:w-40 lg:w-48">
                            <SelectTrigger className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                <SelectValue placeholder="All dates" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All dates</SelectItem>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="week">This week</SelectItem>
                                <SelectItem value="month">This month</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Right side: Filter + Count */}
                    <div className="flex items-center gap-2 text-gray-600 text-sm whitespace-nowrap mt-2 md:mt-0">
                        <Filter className="h-4 w-4" />
                        <span>8 of 8 appointments</span>
                    </div>
                </div>

                {/* Table Section */}
                <div className="mt-6 bg-white shadow rounded-lg p-4 sm:p-5 overflow-x-auto">
                    <Table className="min-w-[700px] md:min-w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Patient</TableHead>
                                <TableHead>Doctor</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[
                                {
                                    id: "A001",
                                    patient: "Sarah Johnson",
                                    patientInitials: "SJ",
                                    doctor: "Dr. Emily Watson",
                                    doctorInitials: "EW",
                                    specialty: "Cardiology",
                                    date: "Jan 20, 2025",
                                    time: "10:00 AM",
                                    type: "Follow-up",
                                    duration: "30 min",
                                    status: "Scheduled",
                                    statusColor: "bg-blue-100 text-blue-600"
                                },
                                {
                                    id: "A002",
                                    patient: "Michael Chen",
                                    patientInitials: "MC",
                                    doctor: "Dr. Robert Martinez",
                                    doctorInitials: "RM",
                                    specialty: "Internal Medicine",
                                    date: "Jan 18, 2025",
                                    time: "2:30 PM",
                                    type: "Annual Checkup",
                                    duration: "45 min",
                                    status: "Completed",
                                    statusColor: "bg-green-100 text-green-600"
                                },
                                {
                                    id: "A003",
                                    patient: "Emily Rodriguez",
                                    patientInitials: "ER",
                                    doctor: "Dr. Lisa Thompson",
                                    doctorInitials: "LT",
                                    specialty: "Dermatology",
                                    date: "Jan 22, 2025",
                                    time: "9:15 AM",
                                    type: "Consultation",
                                    duration: "20 min",
                                    status: "Scheduled",
                                    statusColor: "bg-blue-100 text-blue-600"
                                },
                                {
                                    id: "A004",
                                    patient: "Robert Williams",
                                    patientInitials: "RW",
                                    doctor: "Dr. James Wilson",
                                    doctorInitials: "JW",
                                    specialty: "Orthopedics",
                                    date: "Jan 15, 2025",
                                    time: "11:00 AM",
                                    type: "Physical Therapy",
                                    duration: "60 min",
                                    status: "In Progress",
                                    statusColor: "bg-yellow-100 text-yellow-600"
                                },
                                {
                                    id: "A005",
                                    patient: "Lisa Thompson",
                                    patientInitials: "LT",
                                    doctor: "Dr. Maria Garcia",
                                    doctorInitials: "MG",
                                    specialty: "Pediatrics",
                                    date: "Jan 25, 2025",
                                    time: "3:45 PM",
                                    type: "Vaccination",
                                    duration: "15 min",
                                    status: "Scheduled",
                                    statusColor: "bg-blue-100 text-blue-600"
                                },
                                {
                                    id: "A006",
                                    patient: "David Kim",
                                    patientInitials: "DK",
                                    doctor: "Dr. Sarah Lee",
                                    doctorInitials: "SL",
                                    specialty: "Neurology",
                                    date: "Jan 12, 2025",
                                    time: "1:30 PM",
                                    type: "Consultation",
                                    duration: "40 min",
                                    status: "Cancelled",
                                    statusColor: "bg-red-100 text-red-600"
                                },
                                {
                                    id: "A007",
                                    patient: "Jennifer Brown",
                                    patientInitials: "JB",
                                    doctor: "Dr. Michael Davis",
                                    doctorInitials: "MD",
                                    specialty: "Gynecology",
                                    date: "Jan 28, 2025",
                                    time: "4:00 PM",
                                    type: "Annual Exam",
                                    duration: "30 min",
                                    status: "Scheduled",
                                    statusColor: "bg-blue-100 text-blue-600"
                                },
                                {
                                    id: "A008",
                                    patient: "Thomas Anderson",
                                    patientInitials: "TA",
                                    doctor: "Dr. Patricia White",
                                    doctorInitials: "PW",
                                    specialty: "Ophthalmology",
                                    date: "Jan 16, 2025",
                                    time: "8:30 AM",
                                    type: "Eye Exam",
                                    duration: "25 min",
                                    status: "Rescheduled",
                                    statusColor: "bg-orange-100 text-orange-600"
                                }
                            ].map((appointment) => (
                                <TableRow key={appointment.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{appointment.patientInitials}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{appointment.patient}</p>
                                                <p className="text-xs text-gray-500">ID: {appointment.id}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{appointment.doctorInitials}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{appointment.doctor}</p>
                                                <p className="text-xs text-gray-500">{appointment.specialty}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-500" />
                                                <span className="font-medium">{appointment.date}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm text-gray-600">{appointment.time}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className="bg-purple-100 text-purple-600">
                                            {appointment.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-gray-500" />
                                            <span>{appointment.duration}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={appointment.statusColor}>
                                            {appointment.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-blue-600 cursor-pointer">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                            <span className="text-sm">View</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {/* Filter Container (again) */}
                    <div className="mt-6 bg-white shadow rounded-lg pt-6 sm:pt-8 pb-4 px-4 sm:px-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
                        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 w-full md:w-auto flex-wrap">
                            <div className="relative w-full sm:w-64 md:w-80 lg:w-96">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                                <Input
                                    type="text"
                                    placeholder="Search Appointments..."
                                    className="pl-9"
                                />
                            </div>
                            <Select className="w-full sm:w-40 md:w-40 lg:w-48">
                                <SelectTrigger className="flex items-center">
                                    <FileText className="h-4 w-4 mr-2 text-gray-500" />
                                    <SelectValue placeholder="All insurance type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All insurance type</SelectItem>
                                    <SelectItem value="private">Private</SelectItem>
                                    <SelectItem value="public">Public</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select className="w-full sm:w-40 md:w-40 lg:w-48">
                                <SelectTrigger className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                    <SelectValue placeholder="All appointments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All appointments</SelectItem>
                                    <SelectItem value="upcoming">Upcoming</SelectItem>
                                    <SelectItem value="past">Past</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 text-sm whitespace-nowrap mt-2 md:mt-0">
                            <Filter className="h-4 w-4" />
                            <span>8 of 8 appointments</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
