import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CalendarDays, UserCircle2, Plus, Loader2, ChevronLeft, ChevronRight,
  ArrowLeft, Phone, Image, RefreshCw, Mail, MapPin, Shield, Heart,
  Clock, PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, Download,
  AlertCircle, Droplet, FileText, Users
} from "lucide-react";
import PatientNavbar from "./PatientNavbar";
import appointmentsAPI from "@/api/appointmentsapi";
import { patientsAPI } from "@/api/patientsapi";
import staffApi from "@/api/staffapi";
import { toast } from "sonner";

const HOSPITAL_ID = "550e8400-e29b-41d4-a716-446655440001";
const PAGE_SIZE = 10;

const TABS = [
  { key: "appointments", label: "Appointments", icon: CalendarDays },
  { key: "calls", label: "Calls", icon: Phone },
  { key: "images", label: "Images", icon: Image },
  { key: "profile", label: "Profile", icon: UserCircle2 },
];

// Dummy data for Calls tab
const DUMMY_CALLS = [
  { id: 1, type: "incoming", doctor: "Dr. Sarah Wilson", department: "Cardiology", date: "2025-01-15", time: "10:30 AM", duration: "5 mins", status: "answered" },
  { id: 2, type: "outgoing", doctor: "Dr. John Smith", department: "General Medicine", date: "2025-01-14", time: "2:15 PM", duration: "3 mins", status: "answered" },
  { id: 3, type: "missed", doctor: "Dr. Emily Brown", department: "Dermatology", date: "2025-01-13", time: "11:00 AM", duration: "-", status: "missed" },
  { id: 4, type: "incoming", doctor: "Dr. Sarah Wilson", department: "Cardiology", date: "2025-01-12", time: "4:45 PM", duration: "8 mins", status: "answered" },
  { id: 5, type: "outgoing", doctor: "Dr. Michael Lee", department: "Orthopedics", date: "2025-01-10", time: "9:00 AM", duration: "2 mins", status: "answered" },
];

// Dummy data for Images tab
const DUMMY_IMAGES = [
  { id: 1, name: "Chest X-Ray", type: "X-Ray", date: "2025-01-10", doctor: "Dr. Sarah Wilson", size: "2.4 MB", thumbnail: "https://placehold.co/150x150/e2e8f0/64748b?text=X-Ray" },
  { id: 2, name: "Blood Test Report", type: "Lab Report", date: "2025-01-08", doctor: "Dr. John Smith", size: "1.1 MB", thumbnail: "https://placehold.co/150x150/dbeafe/3b82f6?text=Report" },
  { id: 3, name: "MRI Scan - Knee", type: "MRI", date: "2024-12-20", doctor: "Dr. Michael Lee", size: "5.8 MB", thumbnail: "https://placehold.co/150x150/f0fdf4/22c55e?text=MRI" },
  { id: 4, name: "ECG Report", type: "ECG", date: "2024-12-15", doctor: "Dr. Sarah Wilson", size: "0.8 MB", thumbnail: "https://placehold.co/150x150/fef3c7/f59e0b?text=ECG" },
  { id: 5, name: "Ultrasound - Abdomen", type: "Ultrasound", date: "2024-12-01", doctor: "Dr. Emily Brown", size: "3.2 MB", thumbnail: "https://placehold.co/150x150/fce7f3/ec4899?text=USG" },
  { id: 6, name: "Prescription", type: "Document", date: "2024-11-28", doctor: "Dr. John Smith", size: "0.5 MB", thumbnail: "https://placehold.co/150x150/e0e7ff/6366f1?text=Rx" },
];

export default function PatientDashboard() {
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("appointments");
  const [view, setView] = useState("list");
  
  // Appointments
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Booking flow
  const [bookingStep, setBookingStep] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [appointmentType, setAppointmentType] = useState("consultation");
  const [reason, setReason] = useState("");
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Modals
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Profile data
  const [patientDetails, setPatientDetails] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    const jwt = localStorage.getItem("auth_token");
    if (!jwt) navigate("/landing", { replace: true });
  }, [navigate]);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch("http://localhost:9009/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status !== 200) throw new Error("Unauthorized");
        setPatient(await res.json());
      } catch {
        localStorage.removeItem("auth_token");
        navigate("/landing", { replace: true });
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    if (!patient?.id) return;
    fetchAppointments();
  }, [patient?.id, currentPage]);

  // Fetch patient details when profile tab is active
  useEffect(() => {
    if (activeTab !== "profile" || !patient?.id) return;
    fetchPatientDetails();
  }, [activeTab, patient?.id]);

  const fetchPatientDetails = async () => {
    setLoadingProfile(true);
    try {
      const response = await patientsAPI.getById(patient.id);
      setPatientDetails(response);
    } catch {
      toast.error("Failed to load patient details");
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchAppointments = async () => {
    if (!patient?.id) return;
    setLoadingAppointments(true);
    try {
      const token = localStorage.getItem("auth_token");
      const offset = (currentPage - 1) * PAGE_SIZE;
      // Use orderBy=created_at and sort=DESC to get newest bookings first
      const res = await fetch(
        `http://localhost:9009/appointments?limit=${PAGE_SIZE}&offset=${offset}&patient_id=${patient.id}&orderBy=created_at&sort=DESC`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await res.json();
      setAppointments(result.data || []);
      setTotalCount(result.total || 0);
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    if (view !== "booking") return;
    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const response = await staffApi.getByHospital(HOSPITAL_ID, { limit: 50, offset: 0 });
        setDoctors(response.data.filter(d => d.status?.toLowerCase() === "active" && !d.is_archived));
      } catch {
        toast.error("Failed to load doctors");
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, [view]);

  const formatDate = (str) => str ? new Date(str).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A";
  const formatTime = (str) => {
    if (!str) return "N/A";
    const [h, m] = str.split(":");
    const hour = parseInt(h, 10);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  };
  const isDateFutureOrToday = (dateStr) => {
    if (!dateStr) return false;
    const aptDate = new Date(dateStr); aptDate.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    return aptDate >= today;
  };
  const canModifyAppointment = (apt) => apt.status !== "fulfilled" && apt.status !== "cancelled" && isDateFutureOrToday(apt.appointment_date);
  const getStatusBadge = (status) => {
    const styles = { booked: "bg-blue-100 text-blue-700", confirmed: "bg-green-100 text-green-700", fulfilled: "bg-gray-100 text-gray-600", cancelled: "bg-red-100 text-red-700" };
    return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles[status?.toLowerCase()] || styles.booked}`}>{status || "Booked"}</span>;
  };

  const handleLoadSlots = async () => {
    if (!selectedDoctor || !selectedDate) return;
    setLoadingSlots(true);
    try {
      const response = await appointmentsAPI.getAvailableSlots(selectedDoctor.id, selectedDate);
      setSlots(response.slots?.length ? response.slots : []);
      if (!response.slots?.length) toast.error("No slots available");
    } catch { toast.error("Failed to fetch slots"); setSlots([]); } finally { setLoadingSlots(false); }
  };

  const handleConfirmBooking = async () => {
    if (!reason.trim()) return toast.error("Enter reason for visit");
    setBookingLoading(true);
    try {
      await appointmentsAPI.create({
        hospital_id: HOSPITAL_ID, patient_id: patient.id, patientPhone: patient.phone || patient.contact_info,
        staff_id: selectedDoctor.id, appointment_date: selectedDate, appointment_time: selectedSlot,
        reason: reason.trim(), appointment_type: appointmentType, status: "booked",
      });
      toast.success("Appointment booked successfully!");
      resetBookingForm(); setView("list"); setCurrentPage(1); fetchAppointments();
    } catch { toast.error("Failed to create appointment"); } finally { setBookingLoading(false); }
  };

  const resetBookingForm = () => { setBookingStep(1); setSelectedDoctor(null); setSelectedDate(""); setSlots([]); setSelectedSlot(""); setAppointmentType("consultation"); setReason(""); };

  const openCancelModal = (apt) => { setAppointmentToCancel(apt); setCancelReason(""); setCancelModalOpen(true); };
  const handleCancelConfirm = async () => {
    if (!cancelReason.trim()) return toast.error("Cancellation reason required");
    setCancelling(true);
    try { await appointmentsAPI.cancel(appointmentToCancel.id, { cancelled_by: patient.id, reason: cancelReason.trim() }); toast.success("Appointment cancelled"); setCancelModalOpen(false); fetchAppointments(); }
    catch { toast.error("Failed to cancel"); } finally { setCancelling(false); }
  };

  const openRescheduleModal = (apt) => { setAppointmentToReschedule(apt); setRescheduleDate(apt.appointment_date); setRescheduleSlot(""); setRescheduleSlots([]); setRescheduleModalOpen(true); fetchRescheduleSlots(apt.staff_id, apt.appointment_date); };
  const fetchRescheduleSlots = async (staffId, date) => {
    if (!staffId || !date) return;
    setLoadingRescheduleSlots(true);
    try { const response = await appointmentsAPI.getAvailableSlots(staffId, date); setRescheduleSlots(response.slots || []); }
    catch { setRescheduleSlots([]); } finally { setLoadingRescheduleSlots(false); }
  };
  const handleRescheduleConfirm = async () => {
    if (!rescheduleDate || !rescheduleSlot) return toast.error("Select date and time");
    setRescheduleLoading(true);
    try { await appointmentsAPI.update(appointmentToReschedule.id, { appointment_date: rescheduleDate, appointment_time: rescheduleSlot }); toast.success("Appointment rescheduled"); setRescheduleModalOpen(false); fetchAppointments(); }
    catch { toast.error("Failed to reschedule"); } finally { setRescheduleLoading(false); }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  // ========== TAB RENDERERS ==========

  const renderAppointmentsTab = () => {
    if (view === "booking") return renderBookingFlow();
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Your Appointments</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchAppointments}><RefreshCw className="w-4 h-4" /></Button>
            <Button onClick={() => setView("booking")} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />New Appointment</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingAppointments ? <div className="flex justify-center py-16"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>
          : appointments.length === 0 ? (
            <div className="text-center py-16">
              <CalendarDays className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">No appointments found</p>
              <Button onClick={() => setView("booking")} className="bg-blue-600"><Plus className="w-4 h-4 mr-2" />Book Your First Appointment</Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b bg-gray-50 dark:bg-gray-800">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Time</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Doctor</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Type</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr></thead>
                  <tbody>
                    {appointments.map((apt) => (
                      <tr key={apt.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-4 px-4 font-medium">{formatDate(apt.appointment_date)}</td>
                        <td className="py-4 px-4">{formatTime(apt.appointment_time)}</td>
                        <td className="py-4 px-4"><p className="font-medium">{apt.staff_name || apt.staff?.staff_name || "N/A"}</p><p className="text-xs text-gray-500">{apt.staff?.department || "General"}</p></td>
                        <td className="py-4 px-4 capitalize">{apt.appointment_type || "Consultation"}</td>
                        <td className="py-4 px-4">{getStatusBadge(apt.status)}</td>
                        <td className="py-4 px-4">{canModifyAppointment(apt) ? <div className="flex gap-2"><Button size="sm" variant="outline" className="text-blue-600 border-blue-600" onClick={() => openRescheduleModal(apt)}>Reschedule</Button><Button size="sm" variant="destructive" onClick={() => openCancelModal(apt)}>Cancel</Button></div> : <span className="text-gray-400 text-sm">-</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && <div className="flex items-center justify-between px-4 py-4 border-t"><p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button><Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button></div></div>}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderBookingFlow = () => (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { 
              if (bookingStep === 1) { 
                setView("list"); 
                resetBookingForm(); 
              } else { 
                if (bookingStep === 3) setSelectedSlot(""); 
                setBookingStep(bookingStep - 1); 
              }
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {bookingStep === 1 ? "Back to Appointments" : "Back"}
          </Button>
        </div>
        <div className="mt-4">
          <CardTitle className="text-lg mb-3">Book New Appointment</CardTitle>
          <div className="flex gap-1">{[1, 2, 3].map((s) => <div key={s} className={`h-1.5 flex-1 rounded ${bookingStep >= s ? "bg-blue-600" : "bg-gray-200"}`} />)}</div>
          <div className="flex justify-between text-xs text-gray-500 mt-1"><span>Doctor</span><span>Date & Time</span><span>Details</span></div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {bookingStep === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Select Doctor</h3>
            {loadingDoctors ? <div className="flex justify-center py-8"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>
            : doctors.length === 0 ? <p className="text-center py-8 text-gray-500">No doctors available</p>
            : <div className="space-y-3 max-h-80 overflow-y-auto">{doctors.map((doc) => (
              <div key={doc.id} className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${selectedDoctor?.id === doc.id ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-blue-400"}`} onClick={() => { setSelectedDoctor(doc); setBookingStep(2); }}>
                <p className="font-semibold">{doc.staff_name}</p><p className="text-sm text-gray-500">{doc.department || "General Medicine"}</p>
              </div>
            ))}</div>}
          </div>
        )}
        {bookingStep === 2 && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg"><p className="text-sm">Doctor: <span className="font-semibold">{selectedDoctor?.staff_name}</span></p></div>
            <div><label className="block text-sm font-medium mb-2">Select Date</label><Input type="date" value={selectedDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setSelectedDate(e.target.value)} className="h-11" /></div>
            <Button onClick={handleLoadSlots} disabled={!selectedDate || loadingSlots} className="w-full bg-blue-600 hover:bg-blue-700 h-11">{loadingSlots ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Loading...</> : "Load Available Slots"}</Button>
            {slots.length > 0 && <div><label className="block text-sm font-medium mb-2">Available Slots</label><div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">{slots.map((slot, i) => <Button key={i} variant={selectedSlot === slot.time ? "default" : "outline"} size="sm" disabled={slot.status === "unavailable"} className={`${slot.status === "unavailable" ? "opacity-50" : ""} ${selectedSlot === slot.time ? "bg-blue-600" : ""}`} onClick={() => { if (slot.status !== "unavailable") { setSelectedSlot(slot.time); setBookingStep(3); }}}>{slot.display_time}</Button>)}</div></div>}
          </div>
        )}
        {bookingStep === 3 && (
          <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-2">Appointment Type</label><select className="w-full h-11 border rounded-lg px-3 bg-white dark:bg-gray-800" value={appointmentType} onChange={(e) => setAppointmentType(e.target.value)}><option value="consultation">Consultation</option><option value="follow-up">Follow-up</option><option value="emergency">Emergency</option><option value="vaccination">Vaccination</option><option value="checkup">Checkup</option></select></div>
            <div><label className="block text-sm font-medium mb-2">Reason for Visit *</label><textarea className="w-full h-24 border rounded-lg p-3 resize-none" placeholder="Describe your reason..." value={reason} onChange={(e) => setReason(e.target.value)} /></div>
            <div className="bg-gray-50 rounded-lg p-3 text-sm"><p><span className="text-gray-500">Doctor:</span> {selectedDoctor?.staff_name}</p><p><span className="text-gray-500">Date:</span> {formatDate(selectedDate)}</p><p><span className="text-gray-500">Time:</span> {selectedSlot}</p></div>
            <Button onClick={handleConfirmBooking} disabled={bookingLoading || !reason.trim()} className="w-full bg-green-600 hover:bg-green-700 h-11">{bookingLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Booking...</> : "Confirm Appointment"}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderCallsTab = () => (
    <Card>
      <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Phone className="w-5 h-5" />Call History</CardTitle></CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {DUMMY_CALLS.map((call) => (
            <div key={call.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${call.type === "incoming" ? "bg-green-100" : call.type === "outgoing" ? "bg-blue-100" : "bg-red-100"}`}>
                  {call.type === "incoming" ? <PhoneIncoming className="w-5 h-5 text-green-600" /> : call.type === "outgoing" ? <PhoneOutgoing className="w-5 h-5 text-blue-600" /> : <PhoneMissed className="w-5 h-5 text-red-600" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{call.doctor}</p>
                  <p className="text-sm text-gray-500">{call.department}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{call.date}</p>
                <p className="text-xs text-gray-500">{call.time} • {call.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderImagesTab = () => (
    <Card>
      <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Image className="w-5 h-5" />Medical Images & Reports</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DUMMY_IMAGES.map((img) => (
            <div key={img.id} className="border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                <img src={img.thumbnail} alt={img.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <p className="font-medium text-gray-900 truncate">{img.name}</p>
                <p className="text-xs text-gray-500">{img.type} • {img.date}</p>
                <p className="text-xs text-gray-400 mt-1">{img.doctor}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">{img.size}</span>
                  <Button size="sm" variant="outline" className="h-8"><Download className="w-3 h-3 mr-1" />Download</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderProfileTab = () => {
    if (loadingProfile) {
      return (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        </div>
      );
    }

    const p = patientDetails || patient; // Fallback to basic profile if API fails

    return (
      <div className="space-y-6">
        {/* Header Card */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-500 text-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                {(p?.patient_name || p?.name || "P").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{p?.patient_name || p?.name || "Patient"}</h2>
                <p className="text-blue-100">Patient ID: {p?.patient_code || p?.id?.slice(0, 8) || "N/A"}</p>
                <div className="flex gap-3 mt-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${p?.status === 'active' ? 'bg-green-400/20 text-green-100' : 'bg-gray-400/20 text-gray-100'}`}>
                    {p?.status || "Active"}
                  </span>
                  {p?.blood_type && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-red-400/20 text-red-100 flex items-center gap-1">
                      <Droplet className="w-3 h-3" />{p.blood_type}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact Information */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" />Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium">{p?.contact_info || p?.phone || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium">{p?.email || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="font-medium">{p?.address || "Not provided"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCircle2 className="w-4 h-4 text-blue-600" />Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CalendarDays className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs text-gray-500">Date of Birth</p>
                  <p className="font-medium">{formatDate(p?.dob) || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserCircle2 className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs text-gray-500">Age</p>
                  <p className="font-medium">{p?.age && p.age > 0 ? `${p.age} years` : "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Heart className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs text-gray-500">Blood Type</p>
                  <p className="font-medium">{p?.blood_type || "Not recorded"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insurance Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />Insurance Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-gray-500">Provider</p>
                <p className="font-medium">{p?.insurance_provider || "Not provided"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Insurance Number</p>
                <p className="font-medium">{p?.insurance_number || "N/A"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <Phone className="w-5 h-5 text-red-500" />
                <p className="font-medium text-red-700 dark:text-red-400">{p?.emergency_contact || "Not provided"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Medical Information - Full Width */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />Medical Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-2">Medical History</p>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm">{p?.medical_history || "No medical history recorded"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Allergies</p>
              <div className={`p-4 rounded-lg ${p?.allergies ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20'}`}>
                <div className="flex items-center gap-2">
                  {p?.allergies ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <p className="text-sm text-red-700 dark:text-red-400 font-medium">{p.allergies}</p>
                    </>
                  ) : (
                    <p className="text-sm text-green-700 dark:text-green-400">No known allergies</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Visit & Next Appointment */}
        {(p?.last_visit || p?.next_appointment) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {p?.last_visit && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 mb-1">Last Visit</p>
                  <p className="font-semibold text-lg">{formatDate(p.last_visit)}</p>
                </CardContent>
              </Card>
            )}
            {p?.next_appointment && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="p-4">
                  <p className="text-xs text-blue-600 mb-1">Next Appointment</p>
                  <p className="font-semibold text-lg text-blue-700">{formatDate(p.next_appointment)}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Account Info */}
        <Card className="bg-gray-50 dark:bg-gray-800/50">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-6 text-sm text-gray-500">
              <div>
                <span className="text-xs">Created:</span>
                <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">{formatDate(p?.created_at)}</span>
              </div>
              <div>
                <span className="text-xs">Last Updated:</span>
                <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">{formatDate(p?.updated_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCancelModal = () => cancelModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={() => setCancelModalOpen(false)} />
      <div className="relative z-50 w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-2">Cancel Appointment?</h3>
        <p className="text-sm text-gray-500 mb-4">Please provide a reason:</p>
        <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason..." className="mb-4" />
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setCancelModalOpen(false)}>Close</Button>
          <Button variant="destructive" onClick={handleCancelConfirm} disabled={cancelling || !cancelReason.trim()}>{cancelling && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Confirm</Button>
        </div>
      </div>
    </div>
  );

  const renderRescheduleModal = () => rescheduleModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={() => setRescheduleModalOpen(false)} />
      <div className="relative z-50 w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Reschedule Appointment</h3>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium mb-2">Select Date</label><Input type="date" value={rescheduleDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => { setRescheduleDate(e.target.value); fetchRescheduleSlots(appointmentToReschedule.staff_id, e.target.value); setRescheduleSlot(""); }} /></div>
          {loadingRescheduleSlots ? <div className="flex justify-center py-4"><Loader2 className="animate-spin h-6 w-6 text-blue-600" /></div>
          : rescheduleSlots.length > 0 ? <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">{rescheduleSlots.map((slot, i) => <Button key={i} variant={rescheduleSlot === slot.time ? "default" : "outline"} size="sm" disabled={slot.status === "unavailable"} className={rescheduleSlot === slot.time ? "bg-blue-600" : ""} onClick={() => setRescheduleSlot(slot.time)}>{slot.display_time}</Button>)}</div>
          : rescheduleDate && <p className="text-center text-gray-500">No slots available</p>}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setRescheduleModalOpen(false)}>Close</Button>
          <Button className="bg-blue-600" onClick={handleRescheduleConfirm} disabled={rescheduleLoading || !rescheduleSlot}>{rescheduleLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save</Button>
        </div>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case "appointments": return renderAppointmentsTab();
      case "calls": return renderCallsTab();
      case "images": return renderImagesTab();
      case "profile": return renderProfileTab();
      default: return renderAppointmentsTab();
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-blue-50 dark:bg-gray-900"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PatientNavbar patientName={patient?.name || patient?.patient_name} patientRole="Patient" />
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <Button key={tab.key} variant={activeTab === tab.key ? "default" : "outline"}
              className={`flex-shrink-0 ${activeTab === tab.key ? "bg-blue-600 text-white" : "bg-white"}`}
              onClick={() => { setActiveTab(tab.key); if (tab.key !== "appointments") setView("list"); }}>
              <tab.icon className="w-4 h-4 mr-2" />{tab.label}
            </Button>
          ))}
        </div>
        {renderActiveTab()}
      </div>
      {renderCancelModal()}
      {renderRescheduleModal()}
    </div>
  );
}