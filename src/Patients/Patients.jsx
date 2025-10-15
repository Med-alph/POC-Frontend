import React, { useState, useEffect } from "react"
import { patientsAPI } from "../API/PatientsAPI"
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
import { Search, FileText, Calendar, Plus, Filter, Phone, Mail, MapPin } from "lucide-react"
import Navbar from "../Dashboard/Navbar"
import { Breadcrumb } from "@/components/ui/breadcrumb"

export default function Patients() {
    const [patients, setPatients] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [ageGroupFilter, setAgeGroupFilter] = useState("all")

    const fetchPatients = async () => {
        try {
            setLoading(true)
            const params = {}
            if (searchTerm) params.q = searchTerm
            if (statusFilter !== "all") params.status = statusFilter
            if (ageGroupFilter !== "all") params.ageGroup = ageGroupFilter

            const result = await patientsAPI.getAll(params)
            setPatients(Array.isArray(result.data) ? result.data : [])
        } catch (err) {
            console.error("Error fetching patients:", err)
            toast.error("Failed to load patients. Please try again.")
            setPatients([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPatients()
    }, [searchTerm, statusFilter, ageGroupFilter])

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">


            {/* Main content */}
            <main className="flex-1 px-4 sm:px-6 md:px-10 lg:px-20 py-6">
                <Toaster position="top-right" />
                {/* Breadcrumbs */}
                <Breadcrumb items={[{ label: "Patients" }]} />

                {/* Header Row */}
                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                    <div>
                        <h1 className="text-lg sm:text-2xl font-bold">Patients</h1>
                        <p className="text-gray-600 mt-1 text-xs sm:text-base">
                            Manage and view all patient information
                        </p>
                    </div>

                    <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add New Patient
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
                                placeholder="Search patients..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Status Filter */}
                        <Select
                            className="w-full sm:w-40 md:w-40 lg:w-48"
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                        >
                            <SelectTrigger className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                                <SelectValue placeholder="All status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Age Group Filter */}
                        <Select
                            className="w-full sm:w-40 md:w-40 lg:w-48"
                            value={ageGroupFilter}
                            onValueChange={setAgeGroupFilter}
                        >
                            <SelectTrigger className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                <SelectValue placeholder="All ages" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All ages</SelectItem>
                                <SelectItem value="pediatric">Pediatric (0-17)</SelectItem>
                                <SelectItem value="adult">Adult (18-64)</SelectItem>
                                <SelectItem value="senior">Senior (65+)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Right side: Filter + Count */}
                    <div className="flex items-center gap-2 text-gray-600 text-sm whitespace-nowrap mt-2 md:mt-0">
                        <Filter className="h-4 w-4" />
                        <span>{patients.length} of {patients.length} patients</span>
                    </div>
                </div>

                {/* Table Section */}
                <div className="mt-6 bg-white shadow rounded-lg p-4 sm:p-5 overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="text-gray-500">Loading patients...</div>
                        </div>
                    ) : (
                        <Table className="min-w-[700px] md:min-w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Patient Name</TableHead>
                                    <TableHead>DOB / Age</TableHead>
                                    <TableHead>Contact Info</TableHead>
                                    <TableHead>Insurance Provider</TableHead>
                                    <TableHead>Last Visit</TableHead>
                                    <TableHead>Next Appointment</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {patients.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                            No patients found
                                        </TableCell>
                                    </TableRow>
                                ) : patients.map((patient) => (
                                    <TableRow key={patient.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>{patient.initials}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{patient.name}</p>
                                                    <p className="text-xs text-gray-500">ID: {patient.id}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{patient.dob}</span>
                                                <span className="text-xs text-gray-500">{patient.age} years old</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-3 w-3 text-gray-500" />
                                                    <span className="text-sm">{patient.phone}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3 w-3 text-gray-500" />
                                                    <span className="text-xs text-gray-500">{patient.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="bg-blue-100 text-blue-600">{patient.insurance}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{patient.lastVisit}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm">{patient.nextAppointment}</span>
                                                {patient.nextAppointment !== "Pending" && (
                                                    <span className="text-xs text-gray-500">In 2 weeks</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={patient.statusColor}>
                                                {patient.status}
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
                    )}

                    {/* Filter Container (again) */}
                    <div className="mt-6 bg-white shadow rounded-lg pt-6 sm:pt-8 pb-4 px-4 sm:px-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
                        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 w-full md:w-auto flex-wrap">
                            <div className="relative w-full sm:w-64 md:w-80 lg:w-96">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                                <Input
                                    type="text"
                                    placeholder="Search patients..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
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
                            <span>{patients.length} of {patients.length} patients</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
