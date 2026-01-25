import React, { useEffect, useState, useMemo } from "react"
import { useSelector } from "react-redux"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import toast, { Toaster } from "react-hot-toast"
import {
  Loader2, Search, CheckCircleIcon, XCircleIcon, Stethoscope, Plus, Edit as EditIcon,
  ChevronDown, ChevronRight, Calendar, Filter, Download as DownloadIcon, RefreshCw, Eye, MoreHorizontal,
  Clock, CheckCircle2, AlertCircle, Ban, Users
} from "lucide-react"
import { appointmentsAPI } from "../api/appointmentsapi"
import { patientsAPI } from "../api/patientsapi"
import { staffApi } from "../api/staffapi"
import AddPatientDialog from "../Patients/AddPatient"
import EditPatientDialog from "../Patients/EditPatient"
import ViewModal from "@/components/ui/view-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { useHospital } from "@/contexts/HospitalContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function Appointments() {
  const { hospitalInfo } = useHospital()
  const user = useSelector((state) => state.auth.user)
  const HOSPITAL_ID = user?.hospital_id || hospitalInfo?.hospital_id

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)

  // Add/Edit Modals state
  const [open, setOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)

  // Multi-step form state
  const [step, setStep] = useState(1)
  const [patients, setPatients] = useState([])
  const [patientSearch, setPatientSearch] = useState("")
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showAddPatientDialog, setShowAddPatientDialog] = useState(false)

  const [staffList, setStaffList] = useState([])
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [loadingDoctors, setLoadingDoctors] = useState(false)

  const [selectedDate, setSelectedDate] = useState("")
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState("")
  const [appointmentType, setAppointmentType] = useState("consultation")
  const [reason, setReason] = useState("")
  const [formLoading, setFormLoading] = useState(false)

  // Edit states
  const [editDoctor, setEditDoctor] = useState(null)
  const [editDate, setEditDate] = useState("")
  const [editSlots, setEditSlots] = useState([])
  const [editSelectedSlot, setEditSelectedSlot] = useState("")
  const [editLoading, setEditLoading] = useState(false)
  const [loadingEditSlots, setLoadingEditSlots] = useState(false)

  // Cancellation state
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [appointmentToCancel, setAppointmentToCancel] = useState(null)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelLoading, setCancelLoading] = useState(false)

  // Custom Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    booked: 0,
    fulfilled: 0,
    cancelled: 0,
    pending: 0
  })

  // Grouping state
  const [expandedDoctors, setExpandedDoctors] = useState(new Set())

  useEffect(() => {
    fetchAppointments()
    fetchPatients()
  }, [HOSPITAL_ID])



  async function fetchAppointments() {
    if (!HOSPITAL_ID) return
    setLoading(true);
    try {
      const result = await appointmentsAPI.getAll({
        hospital_id: HOSPITAL_ID,
        limit: 1000,
        orderBy: 'appointment_date',
        sort: 'DESC'
      })
      const data = Array.isArray(result.data) ? result.data : []
      setAppointments(data)

      // Calculate stats locally from the full list so they match the table 100%
      const newStats = { total: data.length, booked: 0, pending: 0, fulfilled: 0, cancelled: 0 };
      data.forEach(appt => {
        const s = appt.status?.toLowerCase();
        if (s === 'booked') newStats.booked++;
        else if (s === 'pending') newStats.pending++;
        else if (s === 'fulfilled' || s === 'completed') newStats.fulfilled++;
        else if (s === 'cancelled') newStats.cancelled++;
      });
      setStats(newStats);

      // Auto-expand doctors who have appointments
      const doctorIds = new Set(data.map(a => a.staff_id || 'unassigned'))
      setExpandedDoctors(doctorIds)
    } catch {
      toast.error("Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPatients() {
    if (!HOSPITAL_ID) return
    try {
      const result = await patientsAPI.getAll({ hospital_id: HOSPITAL_ID, limit: 1000 })
      setPatients(Array.isArray(result.data) ? result.data : [])
    } catch {
      toast.error("Failed to load patients.")
    }
  }

  async function fetchStaff() {
    if (!HOSPITAL_ID) return
    setLoadingDoctors(true)
    try {
      const result = await staffApi.getAll({ hospital_id: HOSPITAL_ID, limit: 1000 })
      const activeStaff = (Array.isArray(result.data) ? result.data : []).filter(
        doc => doc.status?.toLowerCase() === "active" && !doc.is_archived)
      setStaffList(activeStaff)
    } catch {
      toast.error("Failed to load doctors")
    } finally {
      setLoadingDoctors(false)
    }
  }

  const toggleDoctor = (doctorId) => {
    const next = new Set(expandedDoctors)
    if (next.has(doctorId)) next.delete(doctorId)
    else next.add(doctorId)
    setExpandedDoctors(next)
  }

  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      const matchesSearch = !searchTerm ||
        (a.patient_name || a.patient?.patient_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.appointment_code || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || a.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    })
  }, [appointments, searchTerm, statusFilter])

  const groupedAppointments = useMemo(() => {
    const groups = {}
    filteredAppointments.forEach(appt => {
      const doctorId = appt.staff_id || 'unassigned'
      if (!groups[doctorId]) {
        groups[doctorId] = {
          name: appt.staff_name || appt.staff?.staff_name || "Unassigned / General",
          id: doctorId,
          appointments: []
        }
      }
      groups[doctorId].appointments.push(appt)
    })
    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name))
  }, [filteredAppointments])

  const renderStatusBadge = (status) => {
    const s = status?.toLowerCase()
    if (s === "pending") return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>
    if (s === "fulfilled" || s === "completed") return <Badge className="bg-green-100 text-green-700 border-green-200">Completed</Badge>
    if (s === "cancelled") return <Badge className="bg-red-100 text-red-700 border-red-200">Cancelled</Badge>
    if (s === "booked") return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Booked</Badge>
    return <Badge variant="outline">{status}</Badge>
  }

  const renderPaymentBadge = (orders = []) => {
    const isPaid = orders.some(o => o.status?.toLowerCase() === 'paid');
    return isPaid ? (
      <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">Paid</Badge>
    ) : (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">Unpaid</Badge>
    );
  };

  const isAppointmentTodayOrFuture = (date) => {
    if (!date) return false;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today;
  }

  const handleOpenChange = (v) => {
    if (!v) resetModal()
    else if (step === 2 && staffList.length === 0) fetchStaff()
    setOpen(v)
  }

  useEffect(() => {
    if (open && step === 2 && staffList.length === 0) fetchStaff()
  }, [open, step])

  const resetModal = () => {
    setStep(1)
    setSelectedPatient(null)
    setSelectedStaff(null)
    setSelectedDate("")
    setSelectedSlot("")
    setReason("")
    setPatientSearch("")
    setIsEditing(false)
  }

  const openViewModal = (appt) => {
    setSelectedAppointment(appt)
    setViewModalOpen(true)
  }

  const handleEditClick = (appt) => {
    setSelectedAppointment(appt)
    setIsEditing(true)
    setEditDoctor({ id: appt.staff_id, staff_name: appt.staff_name })
    setEditDate(appt.appointment_date)
    setEditSelectedSlot(appt.appointment_time)
    setOpen(true)
    fetchStaff()
  }

  const handleCancelClick = (appt) => {
    setAppointmentToCancel(appt)
    setCancelReason("")
    setCancelModalOpen(true)
  }

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) return toast.error("Please enter a reason")
    setCancelLoading(true)
    try {
      await appointmentsAPI.cancel(appointmentToCancel.id, { cancellation_reason: cancelReason, cancelled_by: user?.id })
      toast.success("Appointment cancelled")
      setCancelModalOpen(false)
      fetchAppointments()
      fetchStats()
    } catch {
      toast.error("Failed to cancel appointment")
    } finally {
      setCancelLoading(false)
    }
  }

  const handleCreateConfirm = async () => {
    setFormLoading(true)
    try {
      await appointmentsAPI.create({
        hospital_id: HOSPITAL_ID,
        patient_id: selectedPatient.id,
        staff_id: selectedStaff.id,
        appointment_date: selectedDate,
        appointment_time: selectedSlot,
        appointment_type: appointmentType,
        reason: reason.trim(),
        status: "pending",
        updated_by: user?.id,
      });
      toast.success("Appointment created!")
      setOpen(false)
      fetchAppointments()
      fetchStats()
    } catch {
      toast.error("Failed to book appointment")
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateConfirm = async () => {
    setEditLoading(true)
    try {
      await appointmentsAPI.update(selectedAppointment.id, {
        staff_id: editDoctor.id,
        appointment_date: editDate,
        appointment_time: editSelectedSlot,
        updated_by: user?.id
      })
      toast.success("Appointment updated!")
      setOpen(false)
      fetchAppointments()
    } catch {
      toast.error("Failed to update")
    } finally {
      setEditLoading(false)
    }
  }

  // Load slots effect
  useEffect(() => {
    if (selectedStaff && selectedDate && step === 3) {
      const load = async () => {
        setLoadingSlots(true)
        try {
          const res = await appointmentsAPI.getAvailableSlots(selectedStaff.id, selectedDate)
          setSlots(res.slots || [])
        } catch { toast.error("Failed to load slots") }
        finally { setLoadingSlots(false) }
      }
      load()
    }
  }, [selectedStaff, selectedDate, step])

  useEffect(() => {
    if (isEditing && editDoctor && editDate) {
      const load = async () => {
        setLoadingEditSlots(true)
        try {
          const res = await appointmentsAPI.getAvailableSlots(editDoctor.id, editDate)
          setEditSlots(res.slots || [])
        } catch { toast.error("Failed to load slots") }
        finally { setLoadingEditSlots(false) }
      }
      load()
    }
  }, [isEditing, editDoctor, editDate])

  const handleExport = () => {
    const csv = [
      ['ID', 'Patient', 'Doctor', 'Date', 'Time', 'Type', 'Status'],
      ...filteredAppointments.map(a => [
        a.appointment_code || a.id.slice(0, 8),
        a.patient_name || a.patient?.patient_name,
        a.staff_name || a.staff?.staff_name,
        a.appointment_date,
        a.appointment_time,
        a.appointment_type,
        a.status
      ])
    ].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `appointments_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 p-6 lg:p-8">
        <Toaster position="top-right" />

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Appointments</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage medical schedules and patient visits</p>
          </div>
          <Dialog open={open && !isEditing} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 h-10">
                <Plus className="h-4 w-4 mr-2" /> Book Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Step {step}: {step === 1 ? "Select Patient" : step === 2 ? "Select Doctor" : step === 3 ? "Select Slot" : "Final Details"}</DialogTitle>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${step >= i ? "bg-blue-500" : "bg-gray-200"}`} />)}
                </div>
              </DialogHeader>

              {step === 1 && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search patient..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} className="pl-10 h-10" />
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {patients.filter(p => !patientSearch || p.patient_name?.toLowerCase().includes(patientSearch.toLowerCase())).map(p => (
                      <div key={p.id} onClick={() => setSelectedPatient(p)} className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between ${selectedPatient?.id === p.id ? "bg-blue-50 border-blue-500" : "hover:bg-gray-50 border-gray-200"}`}>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10"><AvatarFallback>{p.patient_name?.[0]}</AvatarFallback></Avatar>
                          <div><p className="text-sm font-medium">{p.patient_name}</p><p className="text-xs text-gray-500">{p.contact_info}</p></div>
                        </div>
                        {selectedPatient?.id === p.id && <CheckCircleIcon className="h-4 w-4 text-blue-600" />}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowAddPatientDialog(true)}><Plus className="h-4 w-4 mr-2" /> New Patient</Button>
                    <Button className="flex-1" disabled={!selectedPatient} onClick={() => setStep(2)}>Next</Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2">
                    {loadingDoctors ? <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" /> :
                      staffList.map(s => (
                        <div key={s.id} onClick={() => setSelectedStaff(s)} className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between ${selectedStaff?.id === s.id ? "bg-blue-50 border-blue-500" : "hover:bg-gray-50 border-gray-200"}`}>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10"><AvatarFallback>{s.staff_name?.[0]}</AvatarFallback></Avatar>
                            <div><p className="text-sm font-medium">{s.staff_name}</p><p className="text-xs text-gray-500">{s.department}</p></div>
                          </div>
                          {selectedStaff?.id === s.id && <CheckCircleIcon className="h-4 w-4 text-blue-600" />}
                        </div>
                      ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                    <Button className="flex-1" disabled={!selectedStaff} onClick={() => setStep(3)}>Next</Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <Input type="date" value={selectedDate} min={new Date().toISOString().split('T')[0]} onChange={e => setSelectedDate(e.target.value)} className="h-10" />
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {loadingSlots ? <Loader2 className="h-5 w-5 animate-spin mx-auto" colSpan={3} /> :
                      slots.map(s => (
                        <Button key={s.time} variant={selectedSlot === s.time ? "default" : "outline"} disabled={s.status !== 'available'} size="sm" onClick={() => setSelectedSlot(s.time)}>{s.display_time}</Button>
                      ))}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                    <Button className="flex-1" disabled={!selectedSlot} onClick={() => setStep(4)}>Next</Button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Appointment Type</label>
                    <select className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm" value={appointmentType} onChange={e => setAppointmentType(e.target.value)}>
                      <option value="consultation">Consultation</option>
                      <option value="follow-up">Follow-up</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Reason</label>
                    <textarea className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm min-h-[80px]" value={reason} onChange={e => setReason(e.target.value)} placeholder="Enter visit reason..." />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                    <Button className="flex-1" disabled={formLoading} onClick={handleCreateConfirm}>{formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Booking"}</Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Appointments</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <Users className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
                </div>
                <Clock className="h-6 w-6 text-yellow-400 dark:text-yellow-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{stats.fulfilled}</p>
                </div>
                <CheckCircle2 className="h-6 w-6 text-green-400 dark:text-green-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Cancelled</p>
                  <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{stats.cancelled}</p>
                </div>
                <Ban className="h-6 w-6 text-red-400 dark:text-red-500" />
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
                  placeholder="Search by ID or Patient name..."
                  className="pl-10 h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full sm:w-40 md:w-40 lg:w-48 h-10">
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <SelectValue placeholder="All Status" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="fulfilled">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button
                variant="outline"
                onClick={fetchAppointments}
                disabled={loading}
                className="h-10 flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                className="h-10 flex items-center gap-2"
              >
                <DownloadIcon className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Grouped Table */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <TableHead className="w-10"></TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-white py-4">ID</TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-white py-4">Patient</TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-white py-4">Schedule</TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-white py-4">Payment</TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-white py-4">Status</TableHead>
                <TableHead className="text-right font-semibold text-gray-900 dark:text-white py-4 w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-60 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-2" />
                    <p className="text-gray-500">Loading schedule...</p>
                  </TableCell>
                </TableRow>
              ) : groupedAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-60 text-center">
                    <AlertCircle className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 font-medium">No appointments found.</p>
                  </TableCell>
                </TableRow>
              ) : groupedAppointments.map(group => (
                <React.Fragment key={group.id}>
                  <TableRow className="bg-blue-50/20 dark:bg-blue-900/5 cursor-pointer hover:bg-blue-50/40 transition-colors border-y border-gray-100 dark:border-gray-800" onClick={() => toggleDoctor(group.id)}>
                    <TableCell className="py-4">
                      {expandedDoctors.has(group.id) ? <ChevronDown className="h-5 w-5 text-blue-600" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
                    </TableCell>
                    <TableCell colSpan={6} className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                          <Stethoscope className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="font-bold text-lg text-gray-900 dark:text-gray-100">Dr. {group.name}</span>
                        <Badge variant="secondary" className="bg-white dark:bg-gray-800 text-xs h-6 px-3 border-none shadow-sm">{group.appointments.length} Appointments</Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedDoctors.has(group.id) && group.appointments.map(appt => (
                    <TableRow key={appt.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors border-b border-gray-100 dark:border-gray-800/50">
                      <TableCell className="py-5" />
                      <TableCell className="py-5">
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md border border-blue-100 dark:border-blue-800">
                          {appt.appointment_code || appt.id.slice(0, 8).toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="py-5 text-center">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-700 shadow-md">
                            <AvatarFallback className="text-base font-bold bg-blue-100 text-blue-700">{(appt.patient_name || appt.patient?.patient_name)?.[0] || 'P'}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col text-left">
                            <span className="text-base font-bold text-gray-900 dark:text-gray-100 mb-0.5">{appt.patient_name || appt.patient?.patient_name}</span>
                            {appt.patient?.patient_code && <span className="text-xs text-gray-500 font-medium tracking-tight">{appt.patient.patient_code}</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{new Date(appt.appointment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1.5 font-bold"><Clock className="h-4 w-4 text-blue-500" /> {appt.appointment_time}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="scale-110 origin-left">
                          {renderPaymentBadge(appt.orders)}
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="scale-110 origin-left">
                          {renderStatusBadge(appt.status)}
                        </div>
                      </TableCell>
                      <TableCell className="py-5 text-right">
                        <div className="flex justify-end gap-2 pr-2">
                          <Button variant="ghost" size="sm" className="h-10 w-10 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full" onClick={() => openViewModal(appt)}>
                            <Eye className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                                <MoreHorizontal className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 p-1.5 shadow-2xl border-gray-200">
                              <DropdownMenuItem className="text-sm font-medium py-2.5 px-3 rounded-md cursor-pointer" onClick={() => handleEditClick(appt)}>
                                <EditIcon className="h-4 w-4 mr-2.5 text-blue-500" /> Edit Timing
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-sm font-medium py-2.5 px-3 rounded-md cursor-pointer" onClick={() => window.location.href = `/billing/${appt.id}`} disabled={!['fulfilled', 'completed'].includes(appt.status?.toLowerCase())}>
                                <Clock className="h-4 w-4 mr-2.5 text-green-500" /> Open Billing
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-sm font-medium py-2.5 px-3 rounded-md text-red-500 focus:text-white focus:bg-red-600 cursor-pointer" onClick={() => handleCancelClick(appt)}>
                                <Ban className="h-4 w-4 mr-2.5" /> Cancel Visit
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Create/Edit Modal */}
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit Appointment Details" : `Step ${step}: ${step === 1 ? "Select Patient" : step === 2 ? "Select Doctor" : step === 3 ? "Select Slot" : "Final Details"}`}
              </DialogTitle>
              {!isEditing && (
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${step >= i ? "bg-blue-500" : "bg-gray-200"}`} />)}
                </div>
              )}
            </DialogHeader>

            {isEditing ? (
              <div className="space-y-5 py-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Doctor</label>
                  <Select
                    value={editDoctor?.id}
                    onValueChange={(val) => setEditDoctor(staffList.find(s => s.id === val))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select Doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.staff_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date</label>
                  <Input type="date" value={editDate} min={new Date().toISOString().split('T')[0]} onChange={e => setEditDate(e.target.value)} className="h-11" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Available Slots</label>
                  <div className="grid grid-cols-3 gap-2">
                    {loadingEditSlots ? <div className="col-span-3 py-4 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" /></div> :
                      editSlots.length > 0 ? editSlots.map(s => (
                        <Button key={s.time} variant={editSelectedSlot === s.time ? "default" : "outline"} disabled={s.status !== 'available'} size="sm" onClick={() => setEditSelectedSlot(s.time)} className="h-9">{s.display_time}</Button>
                      )) : <p className="col-span-3 text-center text-sm text-gray-500 py-2">No slots available</p>
                    }
                  </div>
                </div>
                <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700" disabled={editLoading || !editSelectedSlot} onClick={handleUpdateConfirm}>
                  {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            ) : (
              <div>
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input placeholder="Search patient..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} className="pl-10 h-11" />
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                      {patients.filter(p => !patientSearch || p.patient_name?.toLowerCase().includes(patientSearch.toLowerCase())).map(p => (
                        <div key={p.id} onClick={() => setSelectedPatient(p)} className={`p-4 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${selectedPatient?.id === p.id ? "bg-blue-50 border-blue-500 shadow-sm" : "hover:bg-gray-50 border-gray-100"}`}>
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10"><AvatarFallback>{p.patient_name?.[0]}</AvatarFallback></Avatar>
                            <div><p className="text-sm font-bold text-gray-900">{p.patient_name}</p><p className="text-xs text-gray-500">{p.contact_info}</p></div>
                          </div>
                          {selectedPatient?.id === p.id && <CheckCircleIcon className="h-5 w-5 text-blue-600" />}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 h-11" onClick={() => setShowAddPatientDialog(true)}><Plus className="h-4 w-4 mr-2" /> New Patient</Button>
                      <Button className="flex-1 h-11" disabled={!selectedPatient} onClick={() => setStep(2)}>Next</Button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2">
                      {loadingDoctors ? <div className="py-10 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" /></div> :
                        staffList.map(s => (
                          <div key={s.id} onClick={() => setSelectedStaff(s)} className={`p-4 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${selectedStaff?.id === s.id ? "bg-blue-50 border-blue-500 shadow-sm" : "hover:bg-gray-50 border-gray-100"}`}>
                            <div className="flex items-center gap-4">
                              <Avatar className="h-10 w-10"><AvatarFallback>{s.staff_name?.[0]}</AvatarFallback></Avatar>
                              <div><p className="text-sm font-bold text-gray-900">{s.staff_name}</p><p className="text-xs text-gray-500">{s.department}</p></div>
                            </div>
                            {selectedStaff?.id === s.id && <CheckCircleIcon className="h-5 w-5 text-blue-600" />}
                          </div>
                        ))}
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="h-11 px-6" onClick={() => setStep(1)}>Back</Button>
                      <Button className="flex-1 h-11" disabled={!selectedStaff} onClick={() => setStep(3)}>Next</Button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <Input type="date" value={selectedDate} min={new Date().toISOString().split('T')[0]} onChange={e => setSelectedDate(e.target.value)} className="h-11" />
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {loadingSlots ? <div className="col-span-3 py-10 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" /></div> :
                        slots.length > 0 ? slots.map(s => (
                          <Button key={s.time} variant={selectedSlot === s.time ? "default" : "outline"} disabled={s.status !== 'available'} onClick={() => setSelectedSlot(s.time)} className="h-10">{s.display_time}</Button>
                        )) : <p className="col-span-3 text-center text-sm text-gray-500 py-10">No slots available for this date</p>
                      }
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" className="h-11 px-6" onClick={() => setStep(2)}>Back</Button>
                      <Button className="flex-1 h-11" disabled={!selectedSlot} onClick={() => setStep(4)}>Next</Button>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Type</label>
                      <select className="w-full h-11 border rounded-lg bg-gray-50 text-sm px-3" value={appointmentType} onChange={e => setAppointmentType(e.target.value)}>
                        <option value="consultation">Consultation</option>
                        <option value="follow-up">Follow-up</option>
                        <option value="emergency">Emergency</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Reason</label>
                      <textarea className="w-full p-3 border rounded-lg bg-gray-50 text-sm min-h-[100px] resize-none" value={reason} onChange={e => setReason(e.target.value)} placeholder="Please enter the reason for this visit..." />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" className="h-11 px-6" onClick={() => setStep(3)}>Back</Button>
                      <Button className="flex-1 h-11 bg-blue-600 hover:bg-blue-700" disabled={formLoading} onClick={handleCreateConfirm}>{formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Booking"}</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Cancellation Modal */}
        <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Cancel Appointment</DialogTitle></DialogHeader>
            <div className="space-y-5 pt-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">Are you sure you want to cancel the visit for <strong>{appointmentToCancel?.patient_name || "this patient"}</strong>?</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Cancellation Reason</label>
                <textarea className="w-full p-4 border rounded-xl text-sm min-h-[120px] bg-gray-50/50 resize-none focus:ring-2 focus:ring-blue-500" placeholder="Please specify the reason for cancellation..." value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" className="h-11 px-6" onClick={() => setCancelModalOpen(false)}>Go Back</Button>
                <Button variant="destructive" className="h-11 px-6" disabled={cancelLoading} onClick={handleConfirmCancel}>{cancelLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Cancellation"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Patient Register Dialog */}
        <AddPatientDialog open={showAddPatientDialog} setOpen={setShowAddPatientDialog} onComplete={fetchPatients} />

        {/* Appointment View Modal */}
        <ViewModal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} data={selectedAppointment} type="appointment" />
      </main>
    </div>
  )
}
