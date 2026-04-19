import React, { useState, useEffect, useMemo } from "react"
import { useDebounce } from "../hooks/useDebounce"
import { useNavigate } from "react-router-dom"
import { useSubscription } from "../hooks/useSubscription"

import { patientsAPI } from "../api/patientsapi"
import { appointmentsAPI } from "../api/appointmentsapi"
import toast, { Toaster } from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
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
    MoreHorizontal,
    Stethoscope
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
import EditPatientDialog from "./EditPatient"
import ConsentStatusIndicator from "@/components/compliance/ConsentStatusIndicator"
import ComplianceFooter from "@/components/compliance/ComplianceFooter"
import ConfirmationModal from "@/components/ui/confirmation-modal"
import { ReadOnlyTooltip } from "@/components/ui/read-only-tooltip"

export default function Patients() {
    const [patients, setPatients] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const debouncedSearchTerm = useDebounce(searchTerm, 300)
    const [statusFilter, setStatusFilter] = useState("all")
    const navigate = useNavigate()

    const [ageGroupFilter, setAgeGroupFilter] = useState("all")
    const [appointmentTypeFilter, setAppointmentTypeFilter] = useState("all")
    const [sortBy, setSortBy] = useState("name")
    const [sortOrder, setSortOrder] = useState("asc")
    const [selectedPatients, setSelectedPatients] = useState([])
    const [viewMode, setViewMode] = useState("table")
    const [viewModalOpen, setViewModalOpen] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState(null)
    const [openDialog, setOpenDialog] = useState(false)
    const [openEditDialog, setOpenEditDialog] = useState(false)
    const [editPatient, setEditPatient] = useState(null)
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        withAppointments: 0
    })

    // Archive state
    const [archiveModalOpen, setArchiveModalOpen] = useState(false)
    const [patientToArchive, setPatientToArchive] = useState(null)
    const [archiving, setArchiving] = useState(false)

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const PAGE_SIZE = 10
    const { isReadOnly } = useSubscription()

    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const role = user.role?.toLowerCase();
            const designation = user.designation_group?.toLowerCase();
            setIsAdmin(role === 'hospital_admin' || role === 'super_admin' || role === 'admin' || designation === 'admin');
        } catch (e) {
            setIsAdmin(false);
        }
    }, []);

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
                    (String(patient.insurance_provider || '').toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (String(patient.insurance_number || '').toLowerCase().includes(searchTerm.toLowerCase()))
                ) &&
                (
                    statusFilter === "all" || patient.status === statusFilter
                ) &&
                (
                    appointmentTypeFilter === "all" ||
                    (patient.appointment_type && patient.appointment_type.toLowerCase() === appointmentTypeFilter.toLowerCase())
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
    }, [patients, searchTerm, statusFilter, appointmentTypeFilter, sortBy, sortOrder])

    // Stats are now fetched from API instead of being derived from paginated data

    const fetchPatients = async () => {
        try {
            setLoading(true)
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const hospitalId = user.hospital_id;
            const offset = (currentPage - 1) * PAGE_SIZE
            const params = {
                hospital_id: hospitalId,
                limit: PAGE_SIZE,
                offset: offset
            }
            if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
                params.search = debouncedSearchTerm
            }
            if (statusFilter !== "all") params.status = statusFilter

            if (appointmentTypeFilter !== "all") params.appointment_type = appointmentTypeFilter
            const result = await patientsAPI.getAll(params)
            const rawPatients = Array.isArray(result?.data) ? result.data : []
            const cleanPatients = rawPatients.filter(isValidPatient)
            setPatients(cleanPatients)
            // Fetch global stats
            const statsResult = await patientsAPI.getStats({ hospital_id: hospitalId })
            console.log('Patient Stats Result:', statsResult)

            // Fetch pending appointments count to populate the "With Appointments" stat
            let pendingAptCount = 0
            try {
                const appointmentsResult = await appointmentsAPI.getAll({
                    hospital_id: hospitalId,
                    status: 'pending',
                    limit: 1
                })
                pendingAptCount = appointmentsResult?.total || 0
            } catch (aptErr) {
                console.error("Error fetching pending appointments count:", aptErr)
            }

            const total = statsResult?.total || result?.total || 0
            setTotalCount(total)

            if (statsResult) {
                setStats({
                    total: total,
                    active: statsResult.active || 0,
                    inactive: statsResult.inactive || 0,
                    withAppointments: pendingAptCount ||
                        statsResult.withAppointments ||
                        statsResult.with_appointments ||
                        statsResult.patientsWithAppointments ||
                        statsResult.scheduled || 0
                })
            } else {
                setStats(prev => ({
                    ...prev,
                    total: total,
                    withAppointments: pendingAptCount
                }))
            }

        } catch (err) {
            console.error("Error fetching patients:", err)
            toast.error("Failed to load patients. Please try again.")
            setPatients([])
            setTotalCount(0)
        } finally {
            setLoading(false)
        }
    }


    useEffect(() => {
        // Only fetch if search is empty (auto-refresh/clear) or >= 3 chars
        if (searchTerm.length > 0 && searchTerm.length < 3) {
            return
        }
        fetchPatients()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchTerm, statusFilter, ageGroupFilter, currentPage, appointmentTypeFilter])


    const handleRefresh = () => {
        fetchPatients()
        toast.success("Patients data refreshed")
    }

    const handleExport = async () => {
        try {
            setLoading(true)
            toast.loading("Preparing all patient records for export...", { id: "export-loading" })

            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const hospitalId = user.hospital_id;

            // Fetch ALL patients specifically for export
            // We use a high limit to ensure we get all records as requested
            const params = {
                hospital_id: hospitalId,
                limit: stats.total > 0 ? stats.total : 1000,
                offset: 0
            }

            // If there's an active search or filter, keep it for the export too? 
            // User said "export that page 10 data or the entire patient record" 
            // usually export means all records.
            const result = await patientsAPI.getAll(params)
            const allPatients = Array.isArray(result?.data) ? result.data : []

            if (allPatients.length === 0) {
                toast.dismiss("export-loading")
                toast.error("No data found to export")
                return
            }

            const dataToExport = allPatients.map(p => {
                // Helper to format consent status logic similar to ConsentStatusIndicator
                const getConsentString = (status) => {
                    if (!status) return 'No Consent';
                    const consents = status.consents || status;
                    const hasMedical = consents?.medical_data?.status === 'granted';
                    const hasComm = consents?.communication?.status === 'granted';
                    const hasNpp = consents?.npp_acknowledged?.status === 'granted';

                    if (hasMedical && hasComm && hasNpp) return 'Full Consent';
                    if (hasMedical) {
                        let partial = 'Granted (Medical';
                        if (hasComm) partial += ', Comm';
                        if (hasNpp) partial += ', NPP';
                        return partial + ')';
                    }
                    return 'No Consent';
                };

                return {
                    "Patient Name": p.patient_name || 'N/A',
                    "Patient Code": p.patient_code || 'N/A',
                    "Age": p.age || 'N/A',
                    "DOB": p.dob ? format(new Date(p.dob), "dd MMM yyyy") : 'N/A',
                    "Contact": p.contact_info || 'N/A',
                    "Email": p.email || 'N/A',
                    "Insurance": p.insurance_provider || 'N/A',
                    "Insurance #": p.insurance_number || 'N/A',
                    "Consent Status": getConsentString(p.consent_status),
                    "Status": p.status || 'N/A',
                    "Last Visit": p.last_visit ? format(new Date(p.last_visit), "dd MMM yyyy") : 'N/A',
                    "Next Appointment": (p.next_appointment || p.nextAppointment) ? format(new Date(p.next_appointment || p.nextAppointment), "dd MMM yyyy") : 'N/A',
                    "Credit Eligible": p.is_credit_eligible === 'yes' ? 'Yes' : 'No',
                    "Credit Amount": p.credit_amount || '0',
                    "Remaining Credit": (parseFloat(p.credit_amount || 0) - parseFloat(p.current_credit_balance || 0)).toFixed(2)
                };
            })

            const worksheet = XLSX.utils.json_to_sheet(dataToExport)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, "Patients")

            // Auto-size columns (rough approximation)
            const maxWidths = {}
            dataToExport.forEach(row => {
                Object.keys(row).forEach(key => {
                    const val = String(row[key] || "")
                    maxWidths[key] = Math.max(maxWidths[key] || 0, val.length, key.length)
                })
            })
            worksheet["!cols"] = Object.keys(maxWidths).map(key => ({ wch: maxWidths[key] + 2 }))

            // Generate filename
            const filename = `Patients_Export_${format(new Date(), "yyyy-MM-dd")}.xlsx`
            
            // Download the file
            XLSX.writeFile(workbook, filename)

            // Delayed success toast as requested (2 seconds)
            setTimeout(() => {
                toast.dismiss("export-loading")
                toast.success(`Successfully exported ${allPatients.length} patient records`)
            }, 2000)

        } catch (err) {
            console.error("Export error:", err)
            toast.dismiss("export-loading")
            toast.error("Failed to export patients. Please try again.")
        } finally {
            setLoading(false)
        }
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
            console.log("API Response:", response)

            // Handle the response structure - API returns { patient: {...}, token: "..." }
            const createdPatient = response?.patient ?? response?.data ?? response

            console.log("Created patient object:", createdPatient)

            if (!isValidPatient(createdPatient)) {
                throw new Error("Created patient data invalid")
            }

            // Add the new patient to the list and refresh the table
            setPatients(prev => [...prev.filter(p => p.id !== createdPatient.id), createdPatient])
            
            // Refresh the patient list to ensure we have the latest data
            fetchPatients()
            return createdPatient
        } catch (error) {
            console.error("Add patient error:", error)
            throw error // Re-throw so AddPatient component knows it failed
        }
    }

    const handleEditPatient = (patient) => {
        setEditPatient(patient)
        setOpenEditDialog(true)
    }

    const handleUpdatePatient = async (patientId, updatedData) => {
        try {
            const response = await patientsAPI.update(patientId, updatedData)
            const updatedPatient = response?.data ?? response

            console.log("Updated patient object:", updatedPatient)

            if (!isValidPatient(updatedPatient)) {
                throw new Error("Updated patient data invalid")
            }

            setPatients(prev => prev.map(p => p.id === patientId ? updatedPatient : p))
            toast.success(`Patient "${updatedPatient.patient_name}" updated successfully!`)
            setOpenEditDialog(false)
            setEditPatient(null)
        } catch (error) {
            console.error("Update patient error:", error)
            toast.error("Failed to update patient. Please try again.")
            throw error
        }
    }

    const handleOpenArchiveModal = (patient) => {
        setPatientToArchive(patient)
        setArchiveModalOpen(true)
    }

    const handleConfirmArchive = async () => {
        if (!patientToArchive) return
        try {
            setArchiving(true)
            await patientsAPI.delete(patientToArchive.id)
            toast.success(`Patient "${patientToArchive.patient_name}" archived successfully`)
            setArchiveModalOpen(false)
            setPatientToArchive(null)
            fetchPatients() // Refresh the list
        } catch (error) {
            console.error("Archive patient error:", error)
            toast.error("Failed to archive patient. Please try again.")
        } finally {
            setArchiving(false)
        }
    }



    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <main className="flex-1 p-6 lg:p-8">
                <Toaster position="top-right" />

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">Patients</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage patient records and information</p>
                </div>

                {/* Statistics Cards */}
                <div className="mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Patients</p>
                                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
                                </div>
                                <Users className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Active</p>
                                    <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{stats.active}</p>
                                </div>
                                <div className="h-6 w-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                    <div className="h-2 w-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">With Appointments</p>
                                    <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{stats.withAppointments}</p>
                                </div>
                                <Calendar className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Inactive</p>
                                    <p className="text-2xl font-semibold text-gray-600 dark:text-gray-400">{stats.inactive}</p>
                                </div>
                                <div className="h-6 w-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                    <div className="h-2 w-2 bg-gray-600 dark:text-gray-400 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Actions */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex flex-col sm:flex-row gap-3 flex-1">
                            <div className="relative w-full sm:w-64 md:w-80 lg:w-96">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                                <Input
                                    type="text"
                                    placeholder="Search by name, contact, or insurance #..."
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
                                value={appointmentTypeFilter}
                                onValueChange={setAppointmentTypeFilter}
                            >
                                {/* <SelectTrigger className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                    <SelectValue placeholder="All types" />
                                </SelectTrigger> */}
                                <SelectContent>
                                    <SelectItem value="all">All types</SelectItem>
                                    <SelectItem value="consultation">Consultation</SelectItem>
                                    <SelectItem value="follow-up">Follow-up</SelectItem>
                                    <SelectItem value="emergency">Emergency</SelectItem>
                                    <SelectItem value="vaccination">Vaccination</SelectItem>
                                    <SelectItem value="checkup">Checkup</SelectItem>
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
                                <ReadOnlyTooltip>
                                    <Button
                                        className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 text-sm font-medium rounded-md"
                                        onClick={() => setOpenDialog(true)}
                                        disabled={isReadOnly}
                                    >
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Add Patient
                                    </Button>
                                </ReadOnlyTooltip>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Loading patients...</div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="min-w-[1000px]">
                                <TableHeader>
                                    <TableRow className="bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                        <TableHead className="font-semibold text-gray-900 dark:text-white">Patient Name</TableHead>
                                        <TableHead className="font-semibold text-gray-900 dark:text-white">DOB / Age</TableHead>
                                        <TableHead className="font-semibold text-gray-900 dark:text-white">Contact Info</TableHead>
                                        <TableHead className="font-semibold text-gray-900 dark:text-white">Insurance Provider</TableHead>
                                        <TableHead className="font-semibold text-gray-900 dark:text-white">Consent Status</TableHead>
                                        <TableHead className="font-semibold text-gray-900 dark:text-white">Last Visit</TableHead>
                                        <TableHead className="font-semibold text-gray-900 dark:text-white">Next Appointment</TableHead>
                                        <TableHead className="font-semibold text-gray-900 dark:text-white">Status</TableHead>
                                        {isAdmin && (
                                            <>
                                                <TableHead className="font-semibold text-gray-900 dark:text-white">Credit Eligible</TableHead>
                                                <TableHead className="font-semibold text-gray-900 dark:text-white">Credit Amount</TableHead>
                                            </>
                                        )}
                                        <TableHead className="font-semibold text-gray-900 dark:text-white text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAndSortedPatients.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={isAdmin ? 11 : 9} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                        {patients.length === 0 ? 'No patients found' : 'No patients match your filters'}
                                                    </p>
                                                    {patients.length === 0 && (
                                                        <ReadOnlyTooltip>
                                                            <Button
                                                                variant="outline"
                                                                className="mt-4"
                                                                onClick={() => setOpenDialog(true)}
                                                                disabled={isReadOnly}
                                                            >
                                                                <UserPlus className="h-4 w-4 mr-2" />
                                                                Add First Patient
                                                            </Button>
                                                        </ReadOnlyTooltip>
                                                    )}
                                                </div>
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
                                            if (!status) return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                                            switch (status) {
                                                case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
                                                case 'inactive': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                                                case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
                                                default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                            }
                                        }

                                        return (
                                            <TableRow
                                                key={patient.id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                                            >
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10 border-2 border-gray-200 dark:border-gray-700">
                                                            <AvatarFallback className="text-sm font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                                                {initials}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">{patient.patient_name}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{patient.patient_code || patient.id.slice(0, 8) + '...'}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-gray-900 dark:text-white font-medium">{formatDate(patient.dob)}</span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">{patient.age || 'N/A'} years old</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col space-y-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                                                            <span className="text-sm text-gray-900 dark:text-white">{patient.contact_info || 'N/A'}</span>
                                                        </div>
                                                        {patient.email && (
                                                            <div className="flex items-center gap-2">
                                                                <Mail className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                                                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{patient.email}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    {patient.insurance_provider ? (
                                                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-medium">
                                                            {patient.insurance_provider}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-sm text-gray-400 dark:text-gray-500">N/A</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <ConsentStatusIndicator
                                                        consentStatus={patient.consent_status}
                                                        showDetails={true}
                                                    />
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <span className="text-sm text-gray-900 dark:text-white">
                                                        {patient.last_visit ? formatDate(patient.last_visit) : <span className="text-gray-400 dark:text-gray-500">No visits yet</span>}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-gray-900 dark:text-white">
                                                            {(patient.next_appointment || patient.nextAppointment) ? formatDate(patient.next_appointment || patient.nextAppointment) : <span className="text-gray-400 dark:text-gray-500">No upcoming</span>}
                                                        </span>
                                                        {(patient.next_appointment || patient.nextAppointment) && (
                                                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Scheduled</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Badge className={`${getStatusColor(patient.status)} font-medium capitalize`}>
                                                        {patient.status || 'N/A'}
                                                    </Badge>
                                                </TableCell>
                                                {isAdmin && (
                                                    <>
                                                        <TableCell className="py-4">
                                                            <Badge className={patient.is_credit_eligible === 'yes' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                                                                {patient.is_credit_eligible === 'yes' ? 'Yes' : 'No'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="py-4 text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className="font-bold text-gray-900 dark:text-white">
                                                                    ₹{(parseFloat(patient.credit_amount || 0) - parseFloat(patient.current_credit_balance || 0)).toFixed(2)}
                                                                </span>
                                                                <span className="text-[10px] text-gray-500 uppercase font-medium">
                                                                    Remaining Credit
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                    </>
                                                )}
                                                <TableCell className="py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                            onClick={() => handleViewPatient(patient)}
                                                            title="View patient details"
                                                        >
                                                            <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                        </Button>
                                                        <ReadOnlyTooltip>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
                                                                onClick={() => handleEditPatient(patient)}
                                                                disabled={isReadOnly}
                                                            >
                                                                <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                            </Button>
                                                        </ReadOnlyTooltip>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                    title="More options"
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                <ReadOnlyTooltip className="w-full">
                                                                    <DropdownMenuItem className="cursor-pointer disabled:opacity-30" disabled={isReadOnly}>
                                                                        <Phone className="h-4 w-4 mr-2" />
                                                                        Call Patient
                                                                    </DropdownMenuItem>
                                                                </ReadOnlyTooltip>
                                                                <ReadOnlyTooltip className="w-full">
                                                                    <DropdownMenuItem className="cursor-pointer disabled:opacity-30" disabled={isReadOnly}>
                                                                        <Mail className="h-4 w-4 mr-2" />
                                                                        Send Message
                                                                    </DropdownMenuItem>
                                                                </ReadOnlyTooltip>
                                                                <DropdownMenuItem
                                                                    className="cursor-pointer font-bold text-blue-600 focus:text-blue-700"
                                                                    onClick={() => navigate(`/doctor-patient-record/${patient.id}`)}
                                                                >
                                                                    <Stethoscope className="h-4 w-4 mr-2" />
                                                                    View Full History
                                                                </DropdownMenuItem>
                                                                <ReadOnlyTooltip className="w-full">
                                                                    <DropdownMenuItem
                                                                        className="cursor-pointer disabled:opacity-30"
                                                                        onClick={() => navigate('/appointments', { state: { autoBook: true, patient } })}
                                                                        disabled={isReadOnly}
                                                                    >
                                                                        <Calendar className="h-4 w-4 mr-2" />
                                                                        Schedule Appointment
                                                                    </DropdownMenuItem>
                                                                </ReadOnlyTooltip>
                                                                <ReadOnlyTooltip className="w-full">
                                                                    <DropdownMenuItem
                                                                        className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 font-medium p-2 disabled:opacity-30 disabled:cursor-not-allowed"
                                                                        onClick={() => handleOpenArchiveModal(patient)}
                                                                        disabled={isReadOnly}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" /> Archive Patient
                                                                    </DropdownMenuItem>
                                                                </ReadOnlyTooltip>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="text-sm text-gray-600">
                            Showing {filteredAndSortedPatients.length} of {totalCount} patients
                            {searchTerm && (
                                <span className="ml-2 text-blue-600">• Filtered by "{searchTerm}"</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-gray-600">
                                Page {currentPage} of {Math.ceil(totalCount / PAGE_SIZE) || 1}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage >= Math.ceil(totalCount / PAGE_SIZE)}
                                onClick={() => setCurrentPage(p => p + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Add Patient Dialog */}
                <AddPatientDialog
                    open={openDialog}
                    setOpen={setOpenDialog}
                    onAdd={handleAddPatient}
                    onComplete={fetchPatients}
                />

                {/* Edit Patient Dialog */}
                <EditPatientDialog
                    open={openEditDialog}
                    setOpen={setOpenEditDialog}
                    onUpdate={handleUpdatePatient}
                    editPatient={editPatient}
                />

                {/* View Modal */}
                <ViewModal
                    isOpen={viewModalOpen}
                    onClose={() => setViewModalOpen(false)}
                    data={selectedPatient}
                    type="patient"
                />

                {/* Archive Confirmation Modal */}
                <ConfirmationModal
                    isOpen={archiveModalOpen}
                    onClose={() => setArchiveModalOpen(false)}
                    onConfirm={handleConfirmArchive}
                    title="Archive Patient"
                    description={`Are you sure you want to archive "${patientToArchive?.patient_name}"? This will hide the patient from all active lists.`}
                    confirmText="Archive Patient"
                    variant="destructive"
                    loading={archiving}
                />

                {/* Compliance Footer */}
                <ComplianceFooter showWarning={true} />
            </main>
        </div>
    )
}
