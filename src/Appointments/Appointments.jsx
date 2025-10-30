import React, { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import toast, { Toaster } from 'react-hot-toast'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, Calendar, Plus, Filter, Clock, User, Stethoscope, Loader2, Eye, Edit, Trash2, MoreHorizontal } from "lucide-react"
import Navbar from "../Dashboard/Navbar"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { appointmentsAPI } from "../api/AppointmentsAPI"
import { patientsAPI } from "../api/PatientsAPI"
import ViewModal from "@/components/ui/view-modal"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Appointments() {
  const user = useSelector((state) => state.auth.user)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [patients, setPatients] = useState([])
  const [patientSearch, setPatientSearch] = useState("")
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [formData, setFormData] = useState({
    hospital_id: "",
    patient_id: "",
    staff_id: "",
    appointment_type: "",
    appointment_date: "",
    appointment_time: "",
    duration: 30,
    reason: "",
    notes: "",
  })

  const fetchAppointments = async () => {
  try {
    setLoading(true);

    const hospitalId = "550e8400-e29b-41d4-a716-446655440001"; // hardcoded hospital ID for now

    const result = await appointmentsAPI.getAll({ hospital_id: hospitalId });

    setAppointments(Array.isArray(result.data) ? result.data : []);
  } catch (err) {
    console.error("Error fetching appointments:", err);
    setAppointments([]);
    toast.error("Failed to load appointments. Please try again.");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchAppointments()
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
  try {
    const hospitalId = "550e8400-e29b-41d4-a716-446655440001"; // hardcoded hospital ID for now

    const result = await patientsAPI.getAll({ hospital_id: hospitalId });

    setPatients(Array.isArray(result.data) ? result.data : []);
  } catch (err) {
    console.error("Error fetching patients:", err);
    setPatients([]);
  }
};
  // Filter patients based on search
  const filteredPatients = patients.filter(patient =>
    patient.patient_name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    patient.contact_info?.includes(patientSearch)
  )

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that a patient is selected
    if (!selectedPatient) {
      toast.error("Please select a patient");
      return;
    }
    
    setFormLoading(true);

    try {
      const data = await appointmentsAPI.create({
        ...formData,
        hospital_id: user?.hospital_id, // Use logged-in user's hospital_id
        staff_id: user?.id, // Use logged-in user's staff_id
        patient_id: selectedPatient?.id, // Use selected patient's ID
      });
      console.log("Created appointment:", data);

      await fetchAppointments();
      setFormData({
        hospital_id: "",
        patient_id: "",
        staff_id: "",
        appointment_type: "",
        appointment_date: "",
        appointment_time: "",
        duration: 30,
        reason: "",
        notes: "",
      });
      setSelectedPatient(null);
      setPatientSearch("");

      toast.success("Appointment created successfully");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to create appointment. Please try again.");
    } finally {
      setFormLoading(false);
    }
  }


  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':')
    const date = new Date()
    date.setHours(parseInt(hours, 10))
    date.setMinutes(parseInt(minutes, 10))
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleViewAppointment = (appointment) => {
    setSelectedAppointment(appointment)
    setViewModalOpen(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">


      <main className="flex-1 px-4 sm:px-6 md:px-10 lg:px-20 py-6">
        <Toaster position="top-right" />

        <Breadcrumb items={[{ label: "Appointments" }]} />

        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold">Appointments</h1>
            <p className="text-gray-600 mt-1 text-xs sm:text-base">
              Manage and view all Appointments information
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Appointment
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Appointment</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                {/* Patient Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Select Patient</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                    <Input
                      placeholder="Search patients by name or contact..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Patient Selection */}
                  {patientSearch && (
                    <div className="max-h-40 overflow-y-auto border rounded-md bg-white shadow-lg">
                      {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => (
                          <div
                            key={patient.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => {
                              setSelectedPatient(patient)
                              setPatientSearch(patient.patient_name)
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {patient.patient_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{patient.patient_name}</p>
                                <p className="text-sm text-gray-500">{patient.contact_info}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-gray-500 text-center">No patients found</div>
                      )}
                    </div>
                  )}
                  
                  {/* Selected Patient Display */}
                  {selectedPatient && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {selectedPatient.patient_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-blue-900">{selectedPatient.patient_name}</p>
                          <p className="text-sm text-blue-600">{selectedPatient.contact_info}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPatient(null)
                            setPatientSearch("")
                          }}
                          className="ml-auto"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Staff Information Display */}
                <div className="p-3 bg-gray-50 border rounded-md">
                  <label className="text-sm font-medium text-gray-700">Staff Information</label>
                  <div className="flex items-center gap-3 mt-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{user?.name || 'Staff Member'}</p>
                      <p className="text-sm text-gray-500">{user?.role || 'Staff'} • Hospital ID: {user?.hospital_id?.slice(0, 8)}...</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    name="appointment_type"
                    placeholder="Appointment Type"
                    value={formData.appointment_type}
                    onChange={handleChange}
                  />
                  <Input
                    type="date"
                    name="appointment_date"
                    value={formData.appointment_date}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    type="time"
                    name="appointment_time"
                    value={formData.appointment_time}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    type="number"
                    name="duration"
                    placeholder="Duration (min)"
                    value={formData.duration}
                    onChange={handleChange}
                  />
                  <Input
                    name="reason"
                    placeholder="Reason"
                    value={formData.reason}
                    onChange={handleChange}
                  />
                  <Input
                    name="notes"
                    placeholder="Notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="col-span-2"
                  />
                </div>

                <div className="flex justify-end">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="mr-2"
                      disabled={formLoading}
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={formLoading}
                  >
                    {formLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : "Save Appointment"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-6 bg-white shadow rounded-lg p-4 sm:p-5 overflow-x-auto">
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
                {appointments.map((a) => (
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
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{formatDate(a.appointment_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{formatTime(a.appointment_time)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-purple-100 text-purple-600">
                        {a.appointment_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{a.duration} min</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        a.status === 'Scheduled' || a.status === 'booked' ? 'bg-blue-100 text-blue-600' :
                          a.status === 'Completed' ? 'bg-green-100 text-green-600' :
                            a.status === 'Cancelled' || a.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                              a.status === 'Rescheduled' ? 'bg-orange-100 text-orange-600' :
                                'bg-yellow-100 text-yellow-600'
                      }>
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleViewAppointment(a)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toast.success(`Editing appointment ${a.id}`)}
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
                              <Calendar className="h-4 w-4 mr-2" />
                              Reschedule
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Clock className="h-4 w-4 mr-2" />
                              Mark Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Cancel Appointment
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
          data={selectedAppointment}
          type="appointment"
        />
      </main>
    </div>
  )
}
