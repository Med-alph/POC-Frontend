import React, { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import toast, { Toaster } from "react-hot-toast"
import {
  Loader2, Search, ArrowLeft, CheckCircleIcon, XCircleIcon, Stethoscope, Plus, Edit as EditIcon,
} from "lucide-react"
import { appointmentsAPI } from "../api/AppointmentsAPI"
import { patientsAPI } from "../api/PatientsAPI"
import { staffApi } from "../api/staffApi"
import AddPatientDialog from "../Patients/AddPatient"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function Appointments() {
  const user = useSelector((state) => state.auth.user)
  const HOSPITAL_ID = user?.hospital_id || "550e8400-e29b-41d4-a716-446655440001"

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editDoctor, setEditDoctor] = useState(null)
  const [editDate, setEditDate] = useState("")
  const [editSlots, setEditSlots] = useState([])
  const [loadingEditSlots, setLoadingEditSlots] = useState(false)
  const [editSelectedSlot, setEditSelectedSlot] = useState("")
  const [editLoading, setEditLoading] = useState(false)
  const [editAppointmentType, setEditAppointmentType] = useState("")
  const [editStaffList, setEditStaffList] = useState([])

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

  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [appointmentToCancel, setAppointmentToCancel] = useState(null)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelLoading, setCancelLoading] = useState(false)
  const [page, setPage] = useState(1);
  const limit = 10;  // fixed page size
  const [total, setTotal] = useState(0)



  useEffect(() => {
    fetchAppointments()
    fetchPatients()
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [page])




  async function fetchAppointments() {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const result = await appointmentsAPI.getAll({ hospital_id: HOSPITAL_ID, limit, offset })
      setAppointments(Array.isArray(result.data) ? result.data : [])
      setTotal(result.total || 0)

      // Optionally also track total from API result if available
    } catch {
      toast.error("Failed to load appointments.");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }



  async function fetchPatients() {
    try {
      const result = await patientsAPI.getAll({ hospital_id: HOSPITAL_ID })
      setPatients(Array.isArray(result.data) ? result.data : [])
    } catch {
      toast.error("Failed to load patients.")
    }
  }


  useEffect(() => {
    if (open && step === 2) fetchStaff()
  }, [open, step])


  async function fetchStaff() {
    setLoadingDoctors(true)
    try {
      const result = await staffApi.getAll({ hospital_id: HOSPITAL_ID })
      const activeStaff = (Array.isArray(result.data) ? result.data : []).filter(
        doc => doc.status?.toLowerCase() === "active" && !doc.is_archived)
      setStaffList(activeStaff)
    } catch {
      toast.error("Failed to load doctors")
    } finally {
      setLoadingDoctors(false)
    }
  }


  async function fetchEditStaffList() {
    try {
      const result = await staffApi.getAll({ hospital_id: HOSPITAL_ID })
      setEditStaffList((Array.isArray(result.data) ? result.data : []).filter(
        doc => doc.status?.toLowerCase() === "active" && !doc.is_archived
      ))
    } catch {
      setEditStaffList([])
      toast.error("Failed to load doctors")
    }
  }


  useEffect(() => {
    if (isEditing && editDoctor && editDate) {
      loadEditSlots(editDoctor.id, editDate)
    }
  }, [isEditing, editDoctor, editDate])


  async function loadEditSlots(staffId, date) {
    if (!staffId || !date) {
      setEditSlots([])
      return
    }
    setLoadingEditSlots(true)
    try {
      const response = await appointmentsAPI.getAvailableSlots(staffId, date)
      setEditSlots(response.slots || [])
    } catch {
      toast.error("Failed to fetch slots")
      setEditSlots([])
    } finally {
      setLoadingEditSlots(false)
    }
  }


  useEffect(() => {
    if (open && step === 3 && selectedStaff && selectedDate) loadAvailableSlots()
  }, [open, step, selectedStaff, selectedDate])


  async function loadAvailableSlots() {
    if (!selectedStaff || !selectedDate) return
    setLoadingSlots(true)
    try {
      const response = await appointmentsAPI.getAvailableSlots(selectedStaff.id, selectedDate)
      setSlots(response.slots || [])
    } catch {
      toast.error("Failed to fetch slots")
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }


  const filteredPatients = patients.filter(patient =>
    patient.patient_name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    (patient.contact_info && patient.contact_info.includes(patientSearch))
  )


  async function handleConfirm() {
    if (!selectedPatient) return toast.error("Select patient")
    if (!selectedStaff) return toast.error("Select doctor")
    if (!selectedDate) return toast.error("Select date")
    if (!selectedSlot) return toast.error("Select time slot")
    if (!reason.trim()) return toast.error("Enter reason")
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
        status: "booked",
      })
      toast.success("Appointment booked!")
      setOpen(false)
      resetModal()
      fetchAppointments()
    } catch {
      toast.error("Failed to book appointment")
    } finally {
      setFormLoading(false)
    }
  }


  function resetModal() {
    setStep(1)
    setSelectedPatient(null)
    setPatientSearch("")
    setSelectedStaff(null)
    setSelectedDate("")
    setSlots([])
    setSelectedSlot("")
    setAppointmentType("consultation")
    setReason("")
  }


  function handleOpenChange(value) {
    setOpen(value)
    if (!value) resetModal()
  }


  function openCancelModal(appointment) {
    setAppointmentToCancel(appointment)
    setCancelReason("")
    setCancelModalOpen(true)
  }


  async function handleCancelConfirm() {
    if (!cancelReason.trim()) {
      toast.error("Cancellation reason required.")
      return
    }
    if (!appointmentToCancel) return
    setCancelLoading(true)
    try {
      await appointmentsAPI.cancel(appointmentToCancel.id, {
        cancelled_by: user?.id,
        reason: cancelReason.trim(),
      })
      toast.success("Appointment cancelled")
      setCancelModalOpen(false)
      setAppointmentToCancel(null)
      fetchAppointments()
    } catch {
      toast.error("Failed to cancel appointment")
    } finally {
      setCancelLoading(false)
    }
  }


  function openViewModalWithAppointment(appointment) {
    setSelectedAppointment(appointment)
    setViewModalOpen(true)
    setIsEditing(false)
    setEditDoctor({
      id: appointment.staff_id,
      staff_name: appointment.staff_name,
      department: appointment.department,
    })
    setEditDate(appointment.appointment_date || "")
    setEditSelectedSlot(appointment.appointment_time || "")
    setEditAppointmentType(appointment.appointment_type || "consultation")
    setEditSlots([])
    fetchEditStaffList()
  }


  async function handleSaveEdit() {
    if (!editDoctor || !editDoctor.id) {
      toast.error("Please select a doctor")
      return
    }
    if (!editDate) {
      toast.error("Please select a date")
      return
    }
    if (!editSelectedSlot) {
      toast.error("Please select a time slot")
      return
    }
    setEditLoading(true)
    try {
      await appointmentsAPI.update(selectedAppointment.id, {
        staff_id: editDoctor.id,
        appointment_date: editDate,
        appointment_time: editSelectedSlot,
        appointment_type: editAppointmentType,
      })
      toast.success("Appointment updated")
      setViewModalOpen(false)
      setIsEditing(false)
      fetchAppointments()
    } catch {
      toast.error("Failed to update appointment")
    } finally {
      setEditLoading(false)
    }
  }


  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric", month: "long", day: "numeric",
      })
    } catch { return "N/A" }
  }


  const formatTime = (timeString) => {
    try {
      const [hour, minute] = timeString.split(":")
      const date = new Date()
      date.setHours(parseInt(hour, 10))
      date.setMinutes(parseInt(minute, 10))
      return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true })
    } catch { return timeString || "N/A" }
  }


  function renderStatusBadge(status) {
    const base = "inline-block px-2 py-1 rounded text-xs font-semibold"
    switch ((status || "").toLowerCase()) {
      case "booked": return <span className={`${base} bg-blue-100 text-blue-800`}>Booked</span>
      case "cancelled": return <span className={`${base} bg-red-100 text-red-800`}>Cancelled</span>
      case "fulfilled":
      case "completed": return <span className={`${base} bg-green-100 text-green-800`}>Completed</span>
      default: return <span className={`${base} bg-gray-100 text-gray-700`}>{status || "Unknown"}</span>
    }
  }


  function renderViewModalContent() {
    if (!selectedAppointment) return null


    if (isEditing) {
      return (
        <>
          <div className="mb-2 font-semibold text-lg">Edit Appointment</div>
          <div className="mb-2">{renderStatusBadge(selectedAppointment.status)}</div>


          <label className="block mb-1 font-medium">Doctor</label>
          <select
            className="w-full border rounded mb-4 p-2"
            value={editDoctor?.id || ""}
            onChange={e => {
              const doc = editStaffList.find(d => d.id === e.target.value)
              setEditDoctor(doc)
              setEditSelectedSlot("")
              setEditSlots([])
              setEditDate(editDate)
            }}
          >
            <option value="" disabled>Select doctor</option>
            {editStaffList.map(doc => (
              <option key={doc.id} value={doc.id}>{doc.staff_name} {doc.department ? " - " + doc.department : ""}</option>
            ))}
          </select>


          <label className="block font-medium mb-1">Date</label>
          <Input
            type="date"
            value={editDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={e => {
              setEditDate(e.target.value)
              setEditSelectedSlot("")
              if (editDoctor) loadEditSlots(editDoctor.id, e.target.value)
            }}
            className="mb-4"
          />


          <label className="block font-medium mb-1">Time Slot</label>
          {loadingEditSlots ? (
            <Loader2 className="animate-spin text-blue-500 mb-4" />
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto mb-4">
              {editSlots.map((slot, idx) => {
                const disabled = slot.status === "unavailable"
                const selected = slot.time === editSelectedSlot
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={disabled}
                    onClick={() => setEditSelectedSlot(slot.time)}
                    className={`rounded-md py-2 px-2 text-sm border ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : selected ? "bg-blue-600 text-white border-blue-700" : "bg-white text-gray-900 hover:bg-blue-50"}`}
                    title={slot.reason === "booked" ? "Already booked" : slot.reason === "past" ? "Time passed" : ""}
                  >
                    {slot.display_time}
                  </button>
                )
              })}
              {editSlots.length === 0 && <div className="col-span-2 text-gray-500">No slots available</div>}
            </div>
          )}


          <label className="block font-medium mb-1">Appointment Type</label>
          <select className="w-full mb-4 rounded border p-2" value={editAppointmentType} onChange={e => setEditAppointmentType(e.target.value)}>
            <option value="consultation">Consultation</option>
            <option value="follow-up">Follow-up</option>
            <option value="emergency">Emergency</option>
            <option value="vaccination">Vaccination</option>
            <option value="checkup">Checkup</option>
          </select>


          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={editLoading} onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button disabled={editLoading} onClick={handleSaveEdit}>
              {editLoading ? <><Loader2 className="inline h-4 w-4 animate-spin mr-2" />Saving...</> : "Save"}
            </Button>
          </div>
        </>
      )
    }


    return (
      <>
        <div className="mb-2">{renderStatusBadge(selectedAppointment.status)}</div>
        <div className="mb-2"><strong>Patient:</strong> {selectedAppointment.patient_name || "Unknown"}</div>
        <div className="mb-2"><strong>Doctor:</strong> {selectedAppointment.staff_name || "Unknown"}</div>
        <div className="mb-2"><strong>Date:</strong> {formatDate(selectedAppointment.appointment_date)}</div>
        <div className="mb-2"><strong>Time:</strong> {formatTime(selectedAppointment.appointment_time)}</div>
        <div className="mb-2"><strong>Type:</strong> {selectedAppointment.appointment_type}</div>
        <div className="mb-2"><strong>Reason:</strong> {selectedAppointment.reason || "-"}</div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setViewModalOpen(false)}>Close</Button>
          {selectedAppointment.status?.toLowerCase() === "booked" && (
            <Button variant="default" onClick={() => setIsEditing(true)}>
              <EditIcon className="inline h-4 w-4 mr-1" /> Edit
            </Button>
          )}
        </div>
      </>
    )
  }


  function renderStep() {
    switch (step) {
      case 1:
        return (
          <>
            <label className="font-medium text-gray-700 block mb-1 flex items-center justify-between">
              <span>Search and select patient</span>
              <Button
                variant="link"
                size="sm"
                className="text-blue-600"
                onClick={() => setShowAddPatientDialog(true)}
              >
                Add New Patient
              </Button>
            </label>

            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
              <Input
                className="pl-10"
                placeholder="Search patients by name or contact"
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
              />
            </div>
            {patientSearch && (
              <div className="max-h-40 overflow-y-auto border rounded-md bg-white shadow-lg mb-2">
                {filteredPatients.length ? filteredPatients.map(p => (
                  <div
                    key={p.id}
                    className="p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3"
                    onClick={() => { setSelectedPatient(p); setPatientSearch(p.patient_name) }}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{p.patient_name?.split(" ").map(n => n[0]).join("").toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{p.patient_name}</p>
                      <p className="text-xs text-gray-500">{p.contact_info}</p>
                    </div>
                  </div>
                )) : <div className="p-3 text-gray-500 text-center">No patients found</div>}
              </div>
            )}
            {selectedPatient && (
              <div className="p-3 mt-2 border rounded-md bg-blue-50 flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{selectedPatient.patient_name?.split(" ").map(n => n[0]).join("").toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-blue-900">{selectedPatient.patient_name}</p>
                  <p className="text-sm text-blue-700">{selectedPatient.contact_info}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedPatient(null); setPatientSearch("") }} className="ml-auto">×</Button>
              </div>
            )}
            <div className="flex justify-end">
              <Button className="mt-4" disabled={!selectedPatient} onClick={() => setStep(2)}>Continue</Button>
            </div>
          </>
        )
      case 2:
        return (
          <>
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="icon" onClick={() => setStep(1)} aria-label="Go Back">
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h2 className="text-xl font-semibold">Select Doctor</h2>
            </div>
            {loadingDoctors ? (
              <Loader2 className="animate-spin mx-auto text-blue-500" />
            ) : staffList.length === 0 ? (
              <p className="text-center text-gray-500">No doctors available</p>
            ) : (
              <div className="grid gap-3 mb-4">
                {staffList.map(doc => (
                  <div
                    key={doc.id}
                    className={`border rounded-md p-3 cursor-pointer transition-colors ${selectedStaff?.id === doc.id ? "border-blue-600 bg-blue-50" : "hover:border-blue-300"}`}
                    onClick={() => setSelectedStaff(doc)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">{doc.staff_name}</div>
                        <div className="text-xs text-gray-600">{doc.department || "General"}</div>
                      </div>
                      <Button size="sm" variant={selectedStaff?.id === doc.id ? "default" : "outline"}>
                        {selectedStaff?.id === doc.id ? "Selected" : "Select"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <Button disabled={!selectedStaff} onClick={() => setStep(3)}>Continue</Button>
            </div>
          </>
        )
      case 3:
        return (
          <>
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="icon" onClick={() => setStep(2)} aria-label="Go Back">
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h2 className="text-xl font-semibold">Select Date & Time Slot</h2>
            </div>
            <Input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={e => setSelectedDate(e.target.value)}
              className="mb-3"
            />
            <Button onClick={loadAvailableSlots} disabled={!selectedDate || loadingSlots} className="w-full mb-4">
              {loadingSlots ? (<><Loader2 className="h-4 w-4 animate-spin mr-2 inline" />Loading Slots...</>) : "Load Available Slots"}
            </Button>
            {slots.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {slots.map((slot, idx) => (
                  <Button
                    key={idx}
                    variant={selectedSlot === slot.time ? "default" : "outline"}
                    className={`flex justify-between items-center ${slot.status === "unavailable" ? "cursor-not-allowed opacity-50 bg-red-50 border-red-300" : "hover:bg-green-50 hover:border-green-300"
                      }`}
                    onClick={() => slot.status !== "unavailable" && setSelectedSlot(slot.time)}
                    disabled={slot.status === "unavailable"}
                    title={slot.reason === "booked" ? "Already booked" : slot.reason === "past" ? "Time has passed" : ""}
                  >
                    <span>{slot.display_time}</span>
                    {slot.status === "available" ? <CheckCircleIcon className="text-green-500 w-4 h-4" /> : <XCircleIcon className="text-red-500 w-4 h-4" />}
                  </Button>
                ))}
              </div>
            ) : <p>No slots available</p>}
            <div className="flex justify-end mt-4"><Button disabled={!selectedSlot} onClick={() => setStep(4)}>Continue</Button></div>
          </>
        )
      case 4:
        return (
          <>
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="icon" onClick={() => setStep(3)} aria-label="Go Back">
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h2 className="text-xl font-semibold">Appointment Details</h2>
            </div>
            <select className="w-full mb-3 border p-2 rounded-md" value={appointmentType} onChange={e => setAppointmentType(e.target.value)}>
              <option value="consultation">Consultation</option>
              <option value="follow-up">Follow-up</option>
              <option value="emergency">Emergency</option>
              <option value="vaccination">Vaccination</option>
              <option value="checkup">Checkup</option>
            </select>
            <textarea className="w-full mb-2 border p-2 rounded-md resize-none focus:ring-2 focus:ring-blue-500" rows={3}
              placeholder="Please describe your reason for visit..." value={reason} onChange={e => setReason(e.target.value)} />
            {reason.trim().length > 0 && <p className="text-xs text-gray-500 mb-3">{reason.trim().length} characters</p>}
            <Button className="w-full" disabled={formLoading || !reason.trim()} onClick={handleConfirm}>
              {formLoading ? (<><Loader2 className="h-4 w-4 animate-spin mr-2 inline" />Booking Appointment...</>) : "Confirm Appointment"}
            </Button>
          </>
        )
      default:
        return null
    }
  }


  return (
    <div className="min-h-screen flex flex-col bg-gray-50 px-4 py-6 sm:px-6 md:px-10 lg:px-20">
      <Toaster position="top-right" />
      <Breadcrumb items={[{ label: "Appointments" }]} />


      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-blue-700">Appointments</h1>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Book an Appointment</DialogTitle>
              <div className="grid grid-cols-4 gap-2 mt-4 mb-2">
                {[1, 2, 3, 4].map(s => <div key={s} className={`h-2 rounded ${step >= s ? "bg-blue-500" : "bg-gray-300"}`} />)}
              </div>
              <div className="flex justify-between text-xs text-gray-600 mb-2">
                <span>Patient</span>
                <span className="flex items-center justify-center">Doctor</span>
                <span>Slot</span>
                <span>Details</span>
              </div>
            </DialogHeader>
            {renderStep()}
            <AddPatientDialog
              open={showAddPatientDialog}
              setOpen={setShowAddPatientDialog}
              onAdd={async (newPatient) => {
                console.log('handleAddPatient called with:', newPatient)
                try {
                  const response = await patientsAPI.create(newPatient)
                  const createdPatient = response?.data ?? response
                  console.log('Patient created:', createdPatient)
                  if (!createdPatient?.id) throw new Error("Created patient data invalid")
                  setPatients(prev => [...prev.filter(p => p.id !== createdPatient.id), createdPatient])
                  toast.success(`Patient "${createdPatient.patient_name}" added!`)
                  setShowAddPatientDialog(false)
                } catch (error) {
                  console.error("Add patient error:", error)
                  toast.error("Failed to add patient, please try again.")
                }
              }}
            />
          </DialogContent>
        </Dialog>
      </div>


      <div className="mt-2 bg-white shadow rounded-lg p-4 sm:p-5 overflow-x-auto">
        {loading ? (
          <p className="text-center text-gray-500">Loading appointments...</p>
        ) : (
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
              {appointments.map(a => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{a.patient_id?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{a.patient_name || a.patient_id}</p>
                        <p className="text-xs text-gray-500">ID: {a.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{a.staff_id?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{a.staff_name || a.staff_id}</p>
                        <p className="text-xs text-gray-500">{a.specialty || "Unknown"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{formatDate(a.appointment_date)}</span>
                      <span className="text-sm text-gray-600">{formatTime(a.appointment_time)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{a.appointment_type}</TableCell>
                  <TableCell><span>{a.duration} min</span></TableCell>
                  <TableCell>{renderStatusBadge(a.status)}</TableCell>
                  <TableCell className="flex gap-2 items-center">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openViewModalWithAppointment(a)} >
                      View
                    </Button>
                    {(a.status?.toLowerCase() !== "cancelled" && a.status?.toLowerCase() !== "fulfilled" && a.status?.toLowerCase() !== "completed") && (
                      <Button variant="destructive" size="sm" className="h-8 w-auto px-2 py-1" onClick={() => openCancelModal(a)}>
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>


        )}
        <div className="mt-6 bg-white shadow rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-600">
              Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total} appointments
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</Button>
              <span className="text-sm text-gray-600">Page {page} of {Math.ceil(total / limit) || 1}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page * limit >= total}>Next</Button>
            </div>
          </div>
        </div>


      </div>



      <Dialog open={viewModalOpen} onOpenChange={() => {
        setViewModalOpen(false)
        setIsEditing(false)
      }}>
        <DialogContent className="max-w-md max-h-[600px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {renderViewModalContent()}
        </DialogContent>
      </Dialog>

      {cancelModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
          className="fixed inset-0 flex items-center justify-center z-50"
        >
          <div className="fixed inset-0 bg-black opacity-30" onClick={() => !cancelLoading && setCancelModalOpen(false)} />
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full z-60 p-6 relative">
            <h3 id="cancel-dialog-title" className="text-lg font-semibold mb-4">Confirm Cancellation</h3>
            <p className="mb-2 text-sm">Please provide a reason for cancellation:</p>
            <Input type="text" value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Reason for cancellation" disabled={cancelLoading} className="mb-4" />
            <div className="flex justify-end gap-3">
              <Button variant="outline" disabled={cancelLoading} onClick={() => setCancelModalOpen(false)}>Close</Button>
              <Button variant="destructive" disabled={cancelLoading || !cancelReason.trim()} onClick={handleCancelConfirm}>
                {cancelLoading ? <><Loader2 className="inline h-4 w-4 animate-spin mr-2" />Cancelling...</> : "Confirm Cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
