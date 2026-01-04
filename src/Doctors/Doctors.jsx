import React, { useState, useEffect, useMemo } from "react"
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
    Search,
    FileText,
    Calendar,
    Plus,
    Filter,
    Phone,
    Mail,
    MapPin,
    Award,
    Clock,
    Users,
    UserPlus,
    Download,
    RefreshCw,
    Eye,
    Edit,
    Trash2,
    MoreHorizontal,
    Stethoscope,
    UserCheck,
    Activity
} from "lucide-react"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import CreateStaffDialog from "../Staff/AddStaff"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ViewModal from "@/components/ui/view-modal"
import staffApi from "../api/staffapi"
import FilterDialog from "./FilterDialog"

export default function Doctors() {
    const [doctors, setDoctors] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [departmentFilter, setDepartmentFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [experienceFilter, setExperienceFilter] = useState("all")
    const [sortBy, setSortBy] = useState("name")
    const [sortOrder, setSortOrder] = useState("asc")
    const [selectedDoctors, setSelectedDoctors] = useState([])
    const [viewMode, setViewMode] = useState("table")
    const [showFilters, setShowFilters] = useState(false)
    const [openDialog, setOpenDialog] = useState(false)
    const [viewModalOpen, setViewModalOpen] = useState(false)
    const [selectedDoctor, setSelectedDoctor] = useState(null)
    const [filterDialogOpen, setFilterDialogOpen] = useState(false)
    const [editDoctor, setEditDoctor] = useState(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)

    // Get hospital ID from user data
    const user = useSelector((state) => state.auth.user);
    const hospitalId = user?.hospital_id;

    // Computed values
    const filteredAndSortedDoctors = useMemo(() => {
        let filtered = doctors.filter(doctor => {
            const matchesSearch = !searchTerm ||
                doctor.staff_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doctor.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doctor.contact_info?.includes(searchTerm) ||
                doctor.email?.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesDepartment = departmentFilter === "all" || doctor.department === departmentFilter
            const matchesStatus = statusFilter === "all" || doctor.status === statusFilter

            const matchesExperience = experienceFilter === "all" ||
                (experienceFilter === "0-5" && doctor.experience <= 5) ||
                (experienceFilter === "6-10" && doctor.experience >= 6 && doctor.experience <= 10) ||
                (experienceFilter === "11-15" && doctor.experience >= 11 && doctor.experience <= 15) ||
                (experienceFilter === "15+" && doctor.experience > 15)

            return matchesSearch && matchesDepartment && matchesStatus && matchesExperience
        })

        // Sort doctors
        filtered.sort((a, b) => {
            let aValue, bValue

            switch (sortBy) {
                case "name":
                    aValue = a.staff_name || ""
                    bValue = b.staff_name || ""
                    break
                case "experience":
                    aValue = a.experience || 0
                    bValue = b.experience || 0
                    break
                case "department":
                    aValue = a.department || ""
                    bValue = b.department || ""
                    break
                case "status":
                    aValue = a.status || ""
                    bValue = b.status || ""
                    break
                default:
                    aValue = a.staff_name || ""
                    bValue = b.staff_name || ""
            }

            if (sortOrder === "asc") {
                return aValue > bValue ? 1 : -1
            } else {
                return aValue < bValue ? 1 : -1
            }
        })

        return filtered
    }, [doctors, searchTerm, departmentFilter, statusFilter, experienceFilter, sortBy, sortOrder])

    // Statistics
    const stats = useMemo(() => {
        const total = doctors.length
        const active = doctors.filter(d => d.status === 'active').length
        const inactive = doctors.filter(d => d.status === 'inactive').length
        const senior = doctors.filter(d => d.experience >= 10).length

        return { total, active, inactive, senior }
    }, [doctors])

    const fetchDoctors = async () => {
  try {
    setLoading(true);

    const params = {
      hospital_id: hospitalId,
    };

    if (searchTerm) params.search = searchTerm;
    if (departmentFilter !== "all") params.department = departmentFilter;
    if (statusFilter !== "all") params.status = statusFilter;

    const result = await staffApi.getAll(params);
    setDoctors(Array.isArray(result.data) ? result.data : []);
  } catch (err) {
    console.error("Error fetching doctors:", err);
    toast.error("Failed to load doctors. Please try again.");
    setDoctors([]);
  } finally {
    setLoading(false);
  }
};


    useEffect(() => {
        fetchDoctors()
    }, [searchTerm, departmentFilter, statusFilter])

    // Utility functions
    const handleRefresh = () => {
        fetchDoctors()
        toast.success("Doctors data refreshed")
    }

    const handleExport = () => {
        const csvContent = [
            ['Name', 'Department', 'Experience', 'Contact', 'Email', 'Status', 'Created'],
            ...filteredAndSortedDoctors.map(doctor => [
                doctor.staff_name,
                doctor.department,
                doctor.experience,
                doctor.contact_info,
                doctor.email,
                doctor.status,
                new Date(doctor.created_at).toLocaleDateString()
            ])
        ].map(row => row.join(',')).join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'doctors.csv'
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success("Doctors data exported")
    }

    const handleSelectDoctor = (doctorId) => {
        setSelectedDoctors(prev =>
            prev.includes(doctorId)
                ? prev.filter(id => id !== doctorId)
                : [...prev, doctorId]
        )
    }

    const handleSelectAll = () => {
        if (selectedDoctors.length === filteredAndSortedDoctors.length) {
            setSelectedDoctors([])
        } else {
            setSelectedDoctors(filteredAndSortedDoctors.map(d => d.id))
        }
    }

    const handleViewDoctor = (doctor) => {
        setSelectedDoctor(doctor)
        setViewModalOpen(true)
    }

    const handleEditDoctor = (doctor) => {
        setEditDoctor(doctor)
        setEditDialogOpen(true)
    }

    const handleUpdateDoctor = async (updatedStaff) => {
        try {
            // The CreateStaffDialog already calls the API, so we just need to update local state
            const updated = updatedStaff?.data ?? updatedStaff
            
            if (updated && updated.id) {
                setDoctors(prev => prev.map(d => d.id === updated.id ? updated : d))
                toast.success(`Doctor "${updated.staff_name || updatedStaff.staff_name}" updated successfully!`)
            } else {
                // If response format is different, refetch
                fetchDoctors()
                toast.success("Doctor updated successfully!")
            }
            setEditDialogOpen(false)
            setEditDoctor(null)
        } catch (error) {
            console.error("Update doctor error:", error)
            toast.error("Failed to update doctor. Please try again.")
        }
    }

    const handleApplyFilters = (filters) => {
        setSearchTerm(filters.searchTerm)
        setDepartmentFilter(filters.departmentFilter)
        setStatusFilter(filters.statusFilter)
        setExperienceFilter(filters.experienceFilter)
        setSortBy(filters.sortBy)
        setSortOrder(filters.sortOrder)
    }

    const handleResetFilters = (resetFilters) => {
        setSearchTerm(resetFilters.searchTerm)
        setDepartmentFilter(resetFilters.departmentFilter)
        setStatusFilter(resetFilters.statusFilter)
        setExperienceFilter(resetFilters.experienceFilter)
        setSortBy(resetFilters.sortBy)
        setSortOrder(resetFilters.sortOrder)
    }

    const getCurrentFilters = () => ({
        searchTerm,
        departmentFilter,
        statusFilter,
        experienceFilter,
        sortBy,
        sortOrder
    })

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Main Content */}
            <main className="flex-1 p-6 lg:p-8">
                <Toaster position="top-right" />

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">Doctors</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage doctor and staff information</p>
                </div>

                {/* Statistics Cards */}
                <div className="mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Doctors</p>
                                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
                                </div>
                                <Stethoscope className="h-6 w-6 text-gray-400 dark:text-gray-500" />
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
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Senior Staff</p>
                                    <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{stats.senior}</p>
                                </div>
                                <Award className="h-6 w-6 text-gray-400 dark:text-gray-500" />
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

                {/* Filters and Actions container */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Left side: Search */}
                        <div className="flex flex-col sm:flex-row gap-3 flex-1">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                                <Input
                                    type="text"
                                    placeholder="Search Staffs, department, contact..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Right side: Actions and Count */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="flex items-center gap-2 text-gray-600 text-sm">
                                <Filter className="h-4 w-4" />
                                <span>{filteredAndSortedDoctors.length} of {doctors.length} doctors</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setFilterDialogOpen(true)}
                                    className="flex items-center gap-2"
                                >
                                    <Filter className="h-4 w-4" />
                                    Filters
                                </Button>
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
                                    className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 text-sm font-medium rounded-md"
                                    onClick={() => setOpenDialog(true)}
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Add Staff
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="text-gray-500">Loading doctors...</div>
                        </div>
                    ) : (
                        <Table className="min-w-[700px] md:min-w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Doctor Name</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Contact Info</TableHead>
                                    <TableHead>Experience</TableHead>
                                    <TableHead>Availability</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedDoctors.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                            {doctors.length === 0 ? 'No doctors found' : 'No doctors match your filters'}
                                        </TableCell>
                                    </TableRow>
                                ) : filteredAndSortedDoctors.map((doctor) => {
                                    // Generate initials from staff_name
                                    const initials = doctor.staff_name
                                        ?.split(' ')
                                        .map(name => name.charAt(0))
                                        .join('')
                                        .toUpperCase() || 'D'

                                    // Parse availability JSON
                                    const availability = doctor.availability ?
                                        (typeof doctor.availability === 'string' ?
                                            JSON.parse(doctor.availability) :
                                            doctor.availability) : {}

                                    // Status color mapping
                                    const getStatusColor = (status) => {
                                        switch (status) {
                                            case 'active':
                                                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
                                            case 'inactive':
                                                return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                                            default:
                                                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                        }
                                    }

                                    return (
                                        <TableRow key={doctor.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback>{initials}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{doctor.staff_name}</p>
                                                        <p className="text-xs text-gray-500">{doctor.staff_code || doctor.id.slice(0, 8) + '...'}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                                    {doctor.department}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-3 w-3 text-gray-500" />
                                                        <span className="text-sm">{doctor.contact_info}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-3 w-3 text-gray-500" />
                                                        <span className="text-xs text-gray-500">{doctor.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{doctor.experience} years</span>
                                                    <span className="text-xs text-gray-500">
                                                        {doctor.experience >= 10 ? 'Senior' : doctor.experience >= 5 ? 'Experienced' : 'Junior'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    {Object.keys(availability).length > 0 ? (
                                                        <div className="text-sm">
                                                            {Object.entries(availability).slice(0, 2).map(([day, time]) => (
                                                                <div key={day} className="text-xs text-gray-600">
                                                                    {day}: {time}
                                                                </div>
                                                            ))}
                                                            {Object.keys(availability).length > 2 && (
                                                                <div className="text-xs text-gray-500">+{Object.keys(availability).length - 2} more</div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-500">Not set</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(doctor.status)}>
                                                    {doctor.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => handleViewDoctor(doctor)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => handleEditDoctor(doctor)}
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
                                                                Call Doctor
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem>
                                                                <Mail className="h-4 w-4 mr-2" />
                                                                Send Message
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem>
                                                                <Calendar className="h-4 w-4 mr-2" />
                                                                View Schedule
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-red-600">
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Archive Doctor
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

                    {/* Footer with pagination and summary */}
                    <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="text-sm text-gray-600">
                                Showing {filteredAndSortedDoctors.length} of {doctors.length} doctors
                                {searchTerm && (
                                    <span className="ml-2 text-blue-600">
                                        • Filtered by "{searchTerm}"
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" disabled>
                                    Previous
                                </Button>
                                <span className="text-sm text-gray-600">Page 1 of 1</span>
                                <Button variant="outline" size="sm" disabled>
                                    Next
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Dialog */}
                <FilterDialog
                    open={filterDialogOpen}
                    onOpenChange={setFilterDialogOpen}
                    filters={getCurrentFilters()}
                    onApplyFilters={handleApplyFilters}
                    onReset={handleResetFilters}
                />

                {/* Add Staff Dialog */}
                <CreateStaffDialog
                    hospitalId={hospitalId}
                    onAdd={(newStaff) => {
                        setDoctors(prev => [...prev, newStaff])
                        toast.success(`Doctor "${newStaff.staff_name}" added!`)
                    }}
                    open={openDialog}
                    setOpen={setOpenDialog}
                />

                {/* Edit Staff Dialog */}
                <CreateStaffDialog
                    hospitalId={hospitalId}
                    editStaff={editDoctor}
                    onAdd={handleUpdateDoctor}
                    open={editDialogOpen}
                    setOpen={setEditDialogOpen}
                />

                {/* View Modal */}
                <ViewModal
                    isOpen={viewModalOpen}
                    onClose={() => setViewModalOpen(false)}
                    data={selectedDoctor}
                    type="doctor"
                />
            </main>
        </div>
    )
}