import React, { useEffect, useState } from "react"
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
import { Search, FileText, Calendar, Plus, Filter, Clock, User, Stethoscope, Loader2 } from "lucide-react"
import Navbar from "../Dashboard/Navbar"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { baseUrl } from "../constants/Constant"

export default function Appointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [open, setOpen] = useState(false)
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
      setLoading(true)
      const res = await fetch(`${baseUrl}/appointments`)
      const result = await res.json()
      
      setAppointments(Array.isArray(result.data) ? result.data : [])
    } catch (err) {
      console.error("Error fetching appointments:", err)
      setAppointments([])
      toast.error("Failed to load appointments. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

 const handleSubmit = async (e) => {
  e.preventDefault();
  setFormLoading(true);

  try {
    const res = await fetch(`${baseUrl}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    let data = null;
    if (!res.ok) {
      // Try to get error message from response body
      try {
        data = await res.json();
        // Show the error message from the API if available
        toast.error(data.message || "Failed to create appointment. Please try again.");  
      } catch {
        toast.error("Failed to create appointment. Please try again.");
      }
      throw new Error(data?.message || "Failed to create appointment");
    }

    try {
      data = await res.json();
      console.log("Created appointment:", data);
    } catch {
      console.warn("No JSON body returned, continuing anyway");
    }

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

    toast.success("Appointment created successfully");
    setOpen(false);
  } catch (err) {
    // Errors already handled above, so this is mostly for unexpected errors
    console.error(err);
    // Optionally: toast.error(err.message);
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

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
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    name="hospital_id"
                    placeholder="Hospital ID"
                    value={formData.hospital_id}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    name="patient_id"
                    placeholder="Patient ID"
                    value={formData.patient_id}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    name="staff_id"
                    placeholder="Staff ID"
                    value={formData.staff_id}
                    onChange={handleChange}
                  />
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
        </div>
      </main>
    </div>
  )
}
