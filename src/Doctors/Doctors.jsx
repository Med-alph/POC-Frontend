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
import { Search, FileText, Calendar, Plus, Filter, Phone, Mail, MapPin, Award, Clock } from "lucide-react"
import Navbar from "../Dashboard/Navbar"
import { Breadcrumb } from "@/components/ui/breadcrumb"

export default function Doctors() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Navbar */}
            <Navbar/>

            {/* Main content */}
            <main className="flex-1 px-4 sm:px-6 md:px-10 lg:px-20 py-6">
                {/* Breadcrumbs */}
                <Breadcrumb items={[{ label: "Doctors" }]} />
                
                {/* Header Row */}
                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                    <div>
                        <h1 className="text-lg sm:text-2xl font-bold">Doctors</h1>
                        <p className="text-gray-600 mt-1 text-xs sm:text-base">
                            Manage and view all Doctors information
                        </p>
                    </div>

                    <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add New Doctor
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
                                placeholder="Search Doctors..."
                                className="pl-9"
                            />
                        </div>

                        {/* Specialty Filter */}
                        <Select className="w-full sm:w-40 md:w-40 lg:w-48">
                            <SelectTrigger className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                                <SelectValue placeholder="All specialties" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All specialties</SelectItem>
                                <SelectItem value="cardiology">Cardiology</SelectItem>
                                <SelectItem value="neurology">Neurology</SelectItem>
                                <SelectItem value="orthopedics">Orthopedics</SelectItem>
                                <SelectItem value="pediatrics">Pediatrics</SelectItem>
                                <SelectItem value="dermatology">Dermatology</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Availability Filter */}
                        <Select className="w-full sm:w-40 md:w-40 lg:w-48">
                            <SelectTrigger className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                <SelectValue placeholder="All availability" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All availability</SelectItem>
                                <SelectItem value="available">Available now</SelectItem>
                                <SelectItem value="busy">Currently busy</SelectItem>
                                <SelectItem value="offline">Offline</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Right side: Filter + Count */}
                    <div className="flex items-center gap-2 text-gray-600 text-sm whitespace-nowrap mt-2 md:mt-0">
                        <Filter className="h-4 w-4" />
                        <span>6 of 6 doctors</span>
                    </div>
                </div>

                {/* Table Section */}
                <div className="mt-6 bg-white shadow rounded-lg p-4 sm:p-5 overflow-x-auto">
                    <Table className="min-w-[700px] md:min-w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Doctor</TableHead>
                                <TableHead>Specialty</TableHead>
                                <TableHead>Contact Info</TableHead>
                                <TableHead>Experience</TableHead>
                                <TableHead>Availability</TableHead>
                                <TableHead>Next Available</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[
                                {
                                    id: "D001",
                                    name: "Dr. Emily Watson",
                                    initials: "EW",
                                    specialty: "Cardiology",
                                    experience: "12 years",
                                    phone: "(555) 234-5678",
                                    email: "e.watson@clinic360.com",
                                    availability: "Available",
                                    nextAvailable: "Today 2:00 PM",
                                    status: "Online",
                                    statusColor: "bg-green-100 text-green-600",
                                    credentials: "MD, FACC"
                                },
                                {
                                    id: "D002",
                                    name: "Dr. Robert Martinez",
                                    initials: "RM",
                                    specialty: "Internal Medicine",
                                    experience: "8 years",
                                    phone: "(555) 345-6789",
                                    email: "r.martinez@clinic360.com",
                                    availability: "Busy",
                                    nextAvailable: "Tomorrow 9:00 AM",
                                    status: "In Session",
                                    statusColor: "bg-yellow-100 text-yellow-600",
                                    credentials: "MD, FACP"
                                },
                                {
                                    id: "D003",
                                    name: "Dr. Lisa Thompson",
                                    initials: "LT",
                                    specialty: "Dermatology",
                                    experience: "15 years",
                                    phone: "(555) 456-7890",
                                    email: "l.thompson@clinic360.com",
                                    availability: "Available",
                                    nextAvailable: "Today 3:30 PM",
                                    status: "Online",
                                    statusColor: "bg-green-100 text-green-600",
                                    credentials: "MD, FAAD"
                                },
                                {
                                    id: "D004",
                                    name: "Dr. James Wilson",
                                    initials: "JW",
                                    specialty: "Orthopedics",
                                    experience: "20 years",
                                    phone: "(555) 567-8901",
                                    email: "j.wilson@clinic360.com",
                                    availability: "Available",
                                    nextAvailable: "Today 4:15 PM",
                                    status: "Online",
                                    statusColor: "bg-green-100 text-green-600",
                                    credentials: "MD, FAAOS"
                                },
                                {
                                    id: "D005",
                                    name: "Dr. Maria Garcia",
                                    initials: "MG",
                                    specialty: "Pediatrics",
                                    experience: "10 years",
                                    phone: "(555) 678-9012",
                                    email: "m.garcia@clinic360.com",
                                    availability: "Busy",
                                    nextAvailable: "Jan 22, 2025 10:00 AM",
                                    status: "In Session",
                                    statusColor: "bg-yellow-100 text-yellow-600",
                                    credentials: "MD, FAAP"
                                },
                                {
                                    id: "D006",
                                    name: "Dr. Sarah Lee",
                                    initials: "SL",
                                    specialty: "Neurology",
                                    experience: "18 years",
                                    phone: "(555) 789-0123",
                                    email: "s.lee@clinic360.com",
                                    availability: "Offline",
                                    nextAvailable: "Jan 23, 2025 8:00 AM",
                                    status: "Offline",
                                    statusColor: "bg-gray-100 text-gray-600",
                                    credentials: "MD, FAAN"
                                }
                            ].map((doctor) => (
                                <TableRow key={doctor.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{doctor.initials}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{doctor.name}</p>
                                                <p className="text-xs text-gray-500">{doctor.credentials}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className="bg-blue-100 text-blue-600">
                                            {doctor.specialty}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-3 w-3 text-gray-500" />
                                                <span className="text-sm">{doctor.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-3 w-3 text-gray-500" />
                                                <span className="text-xs text-gray-500">{doctor.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Award className="h-4 w-4 text-gray-500" />
                                            <span>{doctor.experience}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{doctor.availability}</span>
                                            <span className="text-xs text-gray-500">{doctor.nextAvailable}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm">{doctor.nextAvailable}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={doctor.statusColor}>
                                            {doctor.status}
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
                                    placeholder="Search Doctors..."
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
                            <span>6 of 6 doctors</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
