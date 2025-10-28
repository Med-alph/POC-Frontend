import React, { useState, useEffect, useMemo } from "react"
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
import {
    Search,
    FileText,
    Calendar,
    Plus,
    Filter,
    Phone,
    Mail,
    Users,
    UserPlus,
    Download,
    RefreshCw,
    Eye,
    Edit,
    Trash2,
    MoreHorizontal
} from "lucide-react"
import Navbar from "../Dashboard/Navbar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ViewModal from "@/components/ui/view-modal"
import AddPatientDialog from "./AddPatient"

export default function Patients() {
    const [patients, setPatients] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [ageGroupFilter, setAgeGroupFilter] = useState("all")
    const [sortBy, setSortBy] = useState("name")
    const [sortOrder, setSortOrder] = useState("asc")
    const [selectedPatients, setSelectedPatients] = useState([])
    const [viewMode, setViewMode] = useState("table")
    const [viewModalOpen, setViewModalOpen] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState(null)
    const [openDialog, setOpenDialog] = useState(false)

    // Defensive patient validity check
    const isValidPatient = (patient) => {
        if (patient === undefined || patient === null || typeof patient !== "object") {
            console.warn("Invalid patient object:", patient)
            return false
        }
        if (typeof patient.status !== "string") {
            console.warn("Patient missing or invalid status:", patient)
            return false
        }
        if (!patient.patient_name || typeof patient.patient_name !== "string") {
            console.warn("Patient missing or invalid patient_name:", patient)
            return false
        }
        if (!patient.id || typeof patient.id !== "string") {
            console.warn("Patient missing or invalid id:", patient)
            return false
        }
        return true
    }

    const filteredAndSortedPatients = useMemo(() => {
        const filtered = patients.filter(patient => {
            return isValidPatient(patient) &&
                (
                    !searchTerm ||
                    (patient.patient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (patient.contact_info?.includes(searchTerm)) ||
                    (patient.insurance_provider?.toLowerCase().includes(searchTerm.toLowerCase()))
                ) &&
                (
                    statusFilter === "all" || patient.status === statusFilter
                ) &&
                (
                    ageGroupFilter === "all" ||
                    (ageGroupFilter === "0-18" && patient.age !== undefined && patient.age <= 18) ||
                    (ageGroupFilter === "19-35" && patient.age !== undefined && patient.age >= 19 && patient.age <= 35) ||
                    (ageGroupFilter === "36-50" && patient.age !== undefined && patient.age >= 36 && patient.age <= 50) ||
                    (ageGroupFilter === "50+" && patient.age !== undefined && patient.age > 50)
                )
        })

        filtered.sort((a, b) => {
            let aValue, bValue
            switch (sortBy) {
                case "name":
                    aValue = a.patient_name
                    bValue = b.patient_name
                    break
                case "age":
                    aValue = a.age ?? 0
                    bValue = b.age ?? 0
                    break
                case "status":
                    aValue = a.status
                    bValue = b.status
                    break
                case "lastVisit":
                    aValue = new Date(a.last_visit || 0)
                    bValue = new Date(b.last_visit || 0)
                    break
                default:
                    aValue = a.patient_name
                    bValue = b.patient_name
            }
            if (sortOrder === "asc") {
                return aValue > bValue ? 1 : -1
            } else {
                return aValue < bValue ? 1 : -1
            }
        })
        return filtered
    }, [patients, searchTerm, statusFilter, ageGroupFilter, sortBy, sortOrder])

    const stats = useMemo(() => {
        const total = patients.length
        const active = patients.filter(p => p.status === 'active').length
        const inactive = patients.filter(p => p.status === 'inactive').length
        const withAppointments = patients.filter(p => p.next_appointment).length
        return { total, active, inactive, withAppointments }
    }, [patients])

    const fetchPatients = async () => {
        try {
            setLoading(true)
            const hospitalId = "550e8400-e29b-41d4-a716-446655440001"
            const params = { hospital_id: hospitalId }
            if (searchTerm) params.search = searchTerm
            if (statusFilter !== "all") params.status = statusFilter
            if (ageGroupFilter !== "all") params.age_group = ageGroupFilter
            const result = await patientsAPI.getAll(params)
            const rawPatients = Array.isArray(result?.data) ? result.data : []
            const cleanPatients = rawPatients.filter(isValidPatient)
            setPatients(cleanPatients)
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, statusFilter, ageGroupFilter])

    const handleRefresh = () => {
        fetchPatients()
        toast.success("Patients data refreshed")
    }

    const handleExport = () => {
        const csvContent = [
            ['Name', 'Age', 'Contact', 'Insurance', 'Status', 'Last Visit', 'Next Appointment'],
            ...filteredAndSortedPatients.map(p => [
                p.patient_name,
                p.age,
                p.contact_info,
                p.insurance_provider,
                p.status,
                p.last_visit || 'N/A',
                p.next_appointment || 'N/A'
            ])
        ].map(row => row.join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'patients.csv'
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success("Patients data exported")
    }

    const handleSelectPatient = (patientId) => {
        setSelectedPatients(prev =>
            prev.includes(patientId)
                ? prev.filter(id => id !== patientId)
                : [...prev, patientId]
        )
    }

    const handleSelectAll = () => {
        if (selectedPatients.length === filteredAndSortedPatients.length) {
            setSelectedPatients([])
        } else {
            setSelectedPatients(filteredAndSortedPatients.map(p => p.id))
        }
    }

    const handleViewPatient = (patient) => {
        setSelectedPatient(patient)
        setViewModalOpen(true)
    }

   const handleAddPatient = async (newPatient) => {
  try {
    const response = await patientsAPI.create(newPatient)
    const createdPatient = response?.data ?? response  // <-- key fix here

    console.log("Created patient object:", createdPatient)

    if (!isValidPatient(createdPatient)) {
      throw new Error("Created patient data invalid")
    }

    setPatients(prev => [...prev.filter(p => p.id !== createdPatient.id), createdPatient])
    toast.success(`Patient "${createdPatient.patient_name}" added!`)
    setOpenDialog(false)
  } catch (error) {
    console.error("Add patient error:", error)
    toast.error("Failed to add patient, please try again.")
  }
}



    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-1 p-2 sm:p-6">
                <Toaster position="top-right" />

                {/* Statistics Cards */}
                <div className="mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Patients</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                                <Users className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Active</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                                </div>
                                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <div className="h-3 w-3 bg-green-600 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">With Appointments</p>
                                    <p className="text-2xl font-bold text-blue-600">{stats.withAppointments}</p>
                                </div>
                                <Calendar className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Inactive</p>
                                    <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
                                </div>
                                <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                                    <div className="h-3 w-3 bg-gray-600 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Actions */}
                <div className="bg-white shadow rounded-lg p-4 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex flex-col sm:flex-row gap-3 flex-1">
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

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="flex items-center gap-2 text-gray-600 text-sm">
                                <Filter className="h-4 w-4" />
                                <span>{filteredAndSortedPatients.length} of {patients.length} patients</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleRefresh}
                                    disabled={loading}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleExport}
                                    className="flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Export
                                </Button>
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => setOpenDialog(true)}
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Add Patient
                                </Button>
                            </div>
                        </div>
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
                                {filteredAndSortedPatients.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                            {patients.length === 0 ? 'No patients found' : 'No patients match your filters'}
                                        </TableCell>
                                    </TableRow>
                                ) : filteredAndSortedPatients.map(patient => {
                                    const initials = patient.patient_name
                                        ?.split(' ')
                                        .map(name => name.charAt(0))
                                        .join('')
                                        .toUpperCase() || 'P'

                                    const formatDate = (dateString) => {
                                        if (!dateString) return 'N/A'
                                        const date = new Date(dateString)
                                        return date.toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })
                                    }

                                    const getStatusColor = (status) => {
                                        if (!status) return 'bg-gray-100 text-gray-600'
                                        switch (status) {
                                            case 'active': return 'bg-green-100 text-green-600'
                                            case 'inactive': return 'bg-gray-100 text-gray-600'
                                            case 'pending': return 'bg-yellow-100 text-yellow-600'
                                            default: return 'bg-blue-100 text-blue-600'
                                        }
                                    }

                                    return (
                                        <TableRow key={patient.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback>{initials}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{patient.patient_name}</p>
                                                        <p className="text-xs text-gray-500">ID: {patient.id.slice(0, 8)}...</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{formatDate(patient.dob)}</span>
                                                    <span className="text-xs text-gray-500">{patient.age} years old</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-3 w-3 text-gray-500" />
                                                        <span className="text-sm">{patient.contact_info}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-3 w-3 text-gray-500" />
                                                        <span className="text-xs text-gray-500">{patient.email || 'No email provided'}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="bg-blue-100 text-blue-600">
                                                    {patient.insurance_provider}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{patient.last_visit ? formatDate(patient.last_visit) : 'No visits yet'}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm">{patient.next_appointment ? formatDate(patient.next_appointment) : 'No upcoming'}</span>
                                                    {patient.next_appointment && (
                                                        <span className="text-xs text-gray-500">Scheduled</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(patient.status)}>
                                                    {patient.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => handleViewPatient(patient)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => toast.success(`Editing ${patient.patient_name}`)}
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
                                                                <Phone className="h-4 w-4 mr-2" />
                                                                Call Patient
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem>
                                                                <Mail className="h-4 w-4 mr-2" />
                                                                Send Message
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem>
                                                                <Calendar className="h-4 w-4 mr-2" />
                                                                Schedule Appointment
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-red-600">
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Archive Patient
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

                {/* Footer */}
                <div className="mt-6 bg-white shadow rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="text-sm text-gray-600">
                            Showing {filteredAndSortedPatients.length} of {patients.length} patients
                            {searchTerm && (
                                <span className="ml-2 text-blue-600">• Filtered by "{searchTerm}"</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" disabled>Previous</Button>
                            <span className="text-sm text-gray-600">Page 1 of 1</span>
                            <Button variant="outline" size="sm" disabled>Next</Button>
                        </div>
                    </div>
                </div>

                {/* Add Patient Dialog */}
                <AddPatientDialog
                    open={openDialog}
                    setOpen={setOpenDialog}
                    onAdd={handleAddPatient}
                />

                {/* View Modal */}
                <ViewModal
                    isOpen={viewModalOpen}
                    onClose={() => setViewModalOpen(false)}
                    data={selectedPatient}
                    type="patient"
                />
            </main>
        </div>
    )
}
