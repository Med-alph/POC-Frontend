import { useState, useEffect, useRef } from "react";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ReceiptTemplate from "../Billing/ReceiptTemplate";
import { useNavigate, useLocation } from "react-router-dom";
import { useHospital } from "@/contexts/HospitalContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CalendarDays, UserCircle2, Plus, Loader2, ChevronLeft, ChevronRight,
  ArrowLeft, Phone, Image, RefreshCw, Mail, MapPin, Shield, Heart,
  Clock, PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, Download,
  AlertCircle, Droplet, FileText, Users, X, Bell, CheckCircle, Camera, Utensils,
  Stethoscope, Activity, Pill, FlaskConical, GalleryThumbnails, CreditCard, Receipt, History, Upload
} from "lucide-react";
import { getUserData } from "@/utils/auth";
import PatientNavbar from "./PatientNavbar";
import PatientSidebar from "./PatientSidebar";
import NewAppointmentFlow from "./NewAppointmentFlow";
import appointmentsAPI from "@/api/appointmentsapi";
import { patientsAPI } from "@/api/patientsapi";
import consultationsAPI from "@/api/consultationsapi";
import labOrdersAPI from "@/api/labordersapi";
import proceduresAPI from "@/api/proceduresapi";
import dietAPI from "@/api/dietapi";
import staffApi from "@/api/staffapi";
import authAPI from "@/api/authapi";
import { remindersAPI } from "@/api/remindersapi";
import notificationsAPI from "@/api/notifications";
import imagesAPI from "@/api/imagesapi";
import paymentsAPI from "@/api/paymentsapi";
import toast, { Toaster } from "react-hot-toast";
import CallNotification from "@/components/CallNotification";
import JitsiMeeting from "@/components/JitsiMeeting";
import UploadSessionModal from "@/components/UploadSessionModal";
import SessionTimeline from "@/components/SessionTimeline";
import ImageViewer from "@/components/ImageViewer";
import socketService from "@/services/socketService";
import { videoCallAPI } from "@/api/videocallapi";
import { generateRoomName } from "@/utils/callUtils";

const user = getUserData() || {};
const PAGE_SIZE = 10;

const TABS = [
  { key: "appointments", label: "Appointments", icon: CalendarDays },
  { key: "records", label: "My Records", icon: FileText },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "reminders", label: "Reminders", icon: Bell },
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
  const { hospitalInfo } = useHospital();
  const HOSPITAL_ID = hospitalInfo?.hospital_id;

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
  const [doctorPreference, setDoctorPreference] = useState(""); // "yes" or "no"
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotInfo, setSlotInfo] = useState(null); // Store full slot response including leave info
  const [appointmentType, setAppointmentType] = useState("consultation");
  const [reason, setReason] = useState("");
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Receipt Generation
  const [receiptData, setReceiptData] = useState(null);
  const receiptRef = useRef(null);

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

  // Reminders
  const [reminders, setReminders] = useState([]);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Video call state
  const [incomingCall, setIncomingCall] = useState(null);
  const [showCallNotification, setShowCallNotification] = useState(false);
  const [showJitsi, setShowJitsi] = useState(false);
  const [activeCallId, setActiveCallId] = useState(null);
  const [activeRoomName, setActiveRoomName] = useState(null);
  const [showRejoinBanner, setShowRejoinBanner] = useState(false);
  const [isJoiningCall, setIsJoiningCall] = useState(false);

  // Call history
  const [callHistory, setCallHistory] = useState([]);

  // Images
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loadingCallHistory, setLoadingCallHistory] = useState(false);
  const [callsCurrentPage, setCallsCurrentPage] = useState(1);
  const [callsTotalCount, setCallsTotalCount] = useState(0);
  const CALLS_PAGE_SIZE = 10;

  // Sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Records
  const [consultationHistory, setConsultationHistory] = useState([]);
  const [dietPlanHistory, setDietPlanHistory] = useState([]);
  const [proceduresHistory, setProceduresHistory] = useState([]);
  const [labOrders, setLabOrders] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [uploadingLabId, setUploadingLabId] = useState(null);
  const [activeRecordTab, setActiveRecordTab] = useState("SOAP Notes");

  // Payments / Billing
  const [bills, setBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [viewingBillModal, setViewingBillModal] = useState(false);
  const [selectedBillDetails, setSelectedBillDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const recordTabs = ["SOAP Notes", "Procedures", "Medications", "Diet Plans", "Lab Results", "Allergies & Notes"];

  useEffect(() => {
    // SOC 2: Check isAuthenticated flag, actual auth is via httpOnly cookie
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/landing", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        // Use the new Self-Identification endpoint
        // This handles both the 'incomplete' and 'full' states automatically
        const profile = await patientsAPI.getMe();

        if (profile?.is_incomplete) {
          console.log('[Dashboard] Patient registration incomplete, staying in restricted state');
          // You could optionally redirect to registration here if not already handled
        }

        setPatient(profile);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        // Clear auth state and redirect to landing
        localStorage.removeItem("isAuthenticated");
        navigate("/landing", { replace: true });
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [navigate]);

  // Initialize Socket.IO connection for incoming calls
  useEffect(() => {
    if (patient?.id) {
      console.log('Initializing Socket.IO for patient:', patient.id);
      socketService.connect(patient.id);

      // The socket service will now automatically handle reconnections in the background
      // without bothering the user with error toasts for initial handshake delays.
      socketService.on('connect', () => {
        console.log('Patient Socket.IO connected');
        toast.success('Call service ready', { id: 'socket-status' });
      });

      socketService.on('connect_error', (error) => {
        console.warn('Socket connection retry...', error.message);
      });

      // Listen for incoming call events
      socketService.onIncomingCall((callData) => {
        console.log('🔔 RAW CALL DATA FROM BACKEND:', callData);
        console.log('🔔 Call received - Full data:', JSON.stringify(callData, null, 2));
        console.log('🔔 Doctor Name:', callData.doctorName);
        console.log('🔔 Doctor Object:', callData.doctor);

        // Try to get doctor name from multiple possible locations
        let doctorName = callData.doctorName ||
          callData.doctor?.staff_name ||
          callData.doctor?.name;

        // WORKAROUND: If backend sent "Doctor", try to extract from meetingUrl
        if (!doctorName || doctorName === 'Doctor') {
          try {
            const urlMatch = callData.meetingUrl?.match(/displayName=\"([^\"]+)\"/);
            if (urlMatch && urlMatch[1]) {
              doctorName = decodeURIComponent(urlMatch[1]);
              console.log('🔔 Extracted doctor name from URL:', doctorName);
            }
          } catch (e) {
            console.warn('Failed to extract doctor name from URL:', e);
          }
        }

        // Final fallback
        if (!doctorName) {
          doctorName = 'Doctor';
        }

        console.log('🔔 Using doctor name:', doctorName);

        // Log warning if doctorName is missing from all sources
        if (!callData.doctorName && !callData.doctor) {
          console.warn('⚠️ doctorName is missing from call data. Backend should include it.');
        }

        setIncomingCall({
          ...callData,
          doctorName: doctorName // Ensure doctorName is set
        });
        setShowCallNotification(true);

        toast(`${doctorName} started the call`);
      });

      // Listen for call ended events
      socketService.onCallEnded((data) => {
        console.log('Call ended:', data);
        setShowJitsi(false);
        setShowCallNotification(false);
        setIncomingCall(null);
        setActiveCallId(null);
        setActiveRoomName(null);
        setShowRejoinBanner(false);
        toast('Call ended');
        if (activeTab === 'calls') {
          fetchCallHistory();
        }
      });

      return () => {
        // Cleanup listeners on unmount
        socketService.offPatientEvents();
        socketService.offCallEnded();
      };
    }
  }, [patient]);

  useEffect(() => {
    if (!patient?.id) return;
    fetchAppointments();
  }, [patient?.id, currentPage]);

  // Fetch patient details when profile tab is active
  useEffect(() => {
    if (activeTab !== "profile" || !patient?.id) return;
    fetchPatientDetails();
  }, [activeTab, patient?.id]);

  // Fetch call history when calls tab is active or page changes
  useEffect(() => {
    if (activeTab !== "calls" || !patient?.id) return;
    fetchCallHistory(callsCurrentPage);
  }, [activeTab, patient?.id, callsCurrentPage]);

  // Fetch reminders when reminders tab is active
  useEffect(() => {
    if (activeTab !== "reminders" || !patient?.id) return;
    fetchReminders();
  }, [activeTab, patient?.id]);

  // Fetch sessions when images tab is active
  useEffect(() => {
    if (activeTab !== "images" || !patient?.id) return;
    fetchSessions();
  }, [activeTab, patient?.id]);

  // Fetch records when records tab is active
  useEffect(() => {
    if (activeTab !== "records" || !patient?.id) return;
    fetchPatientRecords();
  }, [activeTab, patient?.id]);

  // Fetch bills when payments tab is active
  useEffect(() => {
    if (activeTab !== "payments" || !patient?.id) return;
    fetchBills();
  }, [activeTab, patient?.id]);

  const fetchPatientRecords = async () => {
    if (!patient?.id) return;
    setLoadingRecords(true);
    try {
      // Fetch Lab Orders (Independent of consultations)
      const labResponse = await labOrdersAPI.getByPatient(patient.id);
      setLabOrders(labResponse || []);

      // Fetch Consultations (SOAP Notes, etc)
      const consResponse = await consultationsAPI.getByPatient(patient.id);
      setConsultationHistory(consResponse?.consultations || []);

      // Fetch Diet Plans
      const dietResponse = await dietAPI.getPatientPlans(patient.id);
      const dietData = Array.isArray(dietResponse) ? dietResponse : (dietResponse.data || []);
      setDietPlanHistory(dietData);

      // Fetch Procedures logic
      const collectedProcs = (consResponse?.consultations || []).reduce((acc, curr) => {
        if (curr.procedures && Array.isArray(curr.procedures)) {
          const procsWithContext = curr.procedures.map(p => ({
            ...p,
            consultation_date: curr.consultation_date,
            doctor_name: curr.staff?.staff_name
          }));
          return [...acc, ...procsWithContext];
        }
        return acc;
      }, []);
      setProceduresHistory(collectedProcs);
    } catch (error) {
      console.error('Failed to load patient records:', error);
      toast.error("Failed to load clinical records");
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleViewReport = (url) => {
    if (!url) return;
    window.open(url, '_blank');
  };

  const handleLabUpload = async (labId, file) => {
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, JPEG, and PNG files are allowed');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must not exceed 10MB');
      return;
    }

    setUploadingLabId(labId);
    try {
      const result = await labOrdersAPI.uploadReport(labId, file);
      toast.success("Report uploaded successfully");
      
      // Update local state to show COMPLETED status
      setLabOrders(prev => prev.map(l => 
        l.id === labId ? { ...l, status: 'completed', report_file_url: result.report_file_url } : l
      ));
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error.message || "Failed to upload report");
    } finally {
      setUploadingLabId(null);
    }
  };

  const fetchBills = async () => {
    if (!patient?.id) return;
    setLoadingBills(true);
    try {
      const response = await paymentsAPI.getPatientOrders(patient.id);
      setBills(response.data || response || []);
    } catch (error) {
      console.error('Failed to load bills:', error);
      toast.error("Failed to load billing history");
    } finally {
      setLoadingBills(false);
    }
  };

  const fetchInvoiceDetails = async (billId) => {
    setLoadingDetails(true);
    setViewingBillModal(true);
    try {
      const details = await paymentsAPI.getInvoiceDetails(billId);
      setSelectedBillDetails(details);
    } catch (error) {
      toast.error("Failed to load invoice details");
      setViewingBillModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const loadRazorpay = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleOnlinePayment = async (bill) => {
    setPaymentLoading(true);
    try {
      // 1. Initiate order on backend
      const orderResponse = await paymentsAPI.initiateOrder({
        id: bill.id, // Pass existing order ID to prevent duplicates
        amount: Math.round(bill.total_amount || bill.amount || 0), 
        receipt: `rcpt_${bill.id}_${Date.now()}`,
        patientId: patient.id,
        appointmentId: bill.appointment_id,
        paymentModeCategory: 'digital'
      });

      const orderId = orderResponse.razorpayOrderId || orderResponse.orderNumber;

      // 2. Load Razorpay SDK
      const res = await loadRazorpay("https://checkout.razorpay.com/v1/checkout.js");
      if (!res) {
        toast.error("Razorpay SDK failed to load. Check your internet connection.");
        return;
      }

      // 3. Open Razorpay options
      const options = {
        key: bill.razorpay_key_id || bill.hospital?.public_key || bill.hospital_public_key || hospitalInfo?.razorpay_key_id,
        amount: Math.round(bill.total_amount || bill.amount || 0), // Already in paise
        currency: "INR",
        name: bill.hospital?.name || hospitalInfo?.name || "Hospital Management",
        description: `Payment for Invoice #${bill.invoice_number || bill.id.slice(0, 8)}`,
        image: bill.hospital?.logo || hospitalInfo?.logo || "https://razorpay.com/favicon.png",
        order_id: orderId,
        handler: async function (response) {
          try {
            await paymentsAPI.verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              paymentMethod: 'online',
            });
            toast.success("Payment successful!");
            fetchBills(); // Refresh list
          } catch (error) {
            toast.error("Payment verification failed. Please contact reception.");
            console.error(error);
          }
        },
        prefill: {
          name: patient?.patient_name || patient?.name,
          email: patient?.email || "",
          contact: patient?.phone || patient?.contact_info,
        },
        theme: { color: "#2563eb" },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error("Payment initiation failed:", error);
      toast.error(error.message || "Failed to initiate payment");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDownloadReceipt = async (billId) => {
    try {
      toast.loading("Fetching receipt details...", { id: 'download' });
      const details = await paymentsAPI.getInvoiceDetails(billId);
      
      toast.loading("Generating PDF...", { id: 'download' });

      // Create PDF directly from data (No screenshot needed - avoids all CSS/oklch errors)
      const doc = new jsPDF();
      const hospitalName = details.hospital?.name || "Clinic";
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(40);
      doc.text(hospitalName.toUpperCase(), 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(details.hospital?.address || "", 14, 30);
      doc.text(`Phone: ${details.hospital?.phone || ""}`, 14, 35);
      if (details.hospital?.gstin && details.hospital.gstin !== 'N/A') {
        doc.setFont(undefined, 'bold');
        doc.text(`GSTIN: ${details.hospital.gstin}`, 14, 40);
        doc.setFont(undefined, 'normal');
      }

      // Receipt Info (Right side)
      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.text("MEDICAL RECEIPT", 140, 22);
      doc.setFontSize(9);
      const displayId = details.receiptNumber?.includes('receipt') 
        ? `No: ${details.receiptNumber.split('_').pop()?.substring(0, 10) || details.receiptNumber.substring(0, 10)}` 
        : `No: ${details.receiptNumber}`;
      doc.text(displayId, 140, 30);
      const dateStr = new Date(details.transactionDate).toLocaleDateString('en-GB');
      doc.text(`Date: ${dateStr}`, 140, 35);
      doc.text(`Method: ${details.paymentMethod || 'N/A'}`, 140, 40);
      if (details.transactionId && details.transactionId !== 'N/A') {
        doc.setFontSize(8);
        doc.text(`Txn ID: ${details.transactionId}`, 140, 44);
        doc.setFontSize(9);
      }

      // Patient Info ...
      doc.setDrawColor(200);
      doc.line(14, 46, 196, 46); // Line
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text("BILL TO:", 14, 55);
      doc.setFont(undefined, 'normal');
      doc.text(details.patient?.name || "", 14, 60);
      doc.text(`UHID: ${details.patient?.uhid || ""}`, 14, 65);
      doc.text(`Phone: ${details.patient?.phone || ""}`, 14, 70);
      
      // Table
      const tableData = details.items.map(item => [
        item.name,
        item.qty,
        `Rs. ${parseFloat(item.unitPrice).toFixed(2)}`,
        `Rs. ${parseFloat(item.total).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: 80,
        head: [['Description', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: { 3: { halign: 'right' }, 2: { halign: 'right' }, 1: { halign: 'center' } }
      });

      // Summary
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      const totalText = `Total Payable: Rs. ${parseFloat(details.summary?.totalAmount || 0).toFixed(2)}`;
      doc.text(totalText, 196 - doc.getTextWidth(totalText), finalY + 10);

      // Footer
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(150);
      doc.text("This is a computer generated document.", 105, 280, { align: 'center' });
      doc.text("Thank you for choosing us.", 105, 285, { align: 'center' });

      // Professional Filename (Date Based)
      const downloadDate = dateStr.replaceAll('/', '_');
      doc.save(`Receipt_${downloadDate}.pdf`);
      toast.success("Receipt downloaded!", { id: 'download' });

    } catch (error) {
      console.error("Download failed:", error);
      toast.error(error.message || "Failed to generate receipt.", { id: 'download' });
    }
  };

  // Fetch notification count on mount and periodically
  useEffect(() => {
    if (!patient?.id) return;

    const fetchNotificationCount = async () => {
      try {
        const counts = await notificationsAPI.getCounts();
        setNotificationCount(counts?.unread || 0);
      } catch (error) {
        console.error("Error fetching notification count:", error);
      }
    };

    fetchNotificationCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);

    return () => clearInterval(interval);
  }, [patient?.id]);

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

  const fetchCallHistory = async (page = 1) => {
    if (!patient?.id) return;
    setLoadingCallHistory(true);
    try {
      console.log('Fetching call history for patient:', patient.id, 'page:', page);
      const calls = await videoCallAPI.getPatientCallHistory(patient.id);
      console.log('Call history received:', calls);

      if (!calls || !Array.isArray(calls)) {
        console.warn('Invalid call history data:', calls);
        setCallHistory([]);
        setCallsTotalCount(0);
        return;
      }

      // Sort by most recent first
      const sortedCalls = calls.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setCallsTotalCount(sortedCalls.length);
      console.log('Total calls:', sortedCalls.length);

      // Paginate the results
      const startIndex = (page - 1) * CALLS_PAGE_SIZE;
      const endIndex = startIndex + CALLS_PAGE_SIZE;
      const paginatedCalls = sortedCalls.slice(startIndex, endIndex);
      console.log('Paginated calls for page', page, ':', paginatedCalls.length, 'calls');

      setCallHistory(paginatedCalls);
      setCallsCurrentPage(page);
    } catch (error) {
      console.error('Failed to load call history:', error);
      toast.error("Failed to load call history");
      setCallHistory([]);
      setCallsTotalCount(0);
    } finally {
      setLoadingCallHistory(false);
    }
  };

  const fetchReminders = async () => {
    if (!patient?.id) return;
    setLoadingReminders(true);
    try {
      const result = await remindersAPI.getAll({
        patient_id: patient.id,
        hospital_id: HOSPITAL_ID,
        limit: 100,
        status: 'pending',
      });
      const remindersList = Array.isArray(result?.data) ? result.data : [];
      setReminders(remindersList);
    } catch (error) {
      console.error('Failed to load reminders:', error);
      toast.error("Failed to load reminders");
      setReminders([]);
    } finally {
      setLoadingReminders(false);
    }
  };

  const handleMarkReminderComplete = async (reminderId) => {
    try {
      await remindersAPI.markCompleted(reminderId);
      toast.success("Reminder marked as complete");
      fetchReminders();
    } catch (error) {
      console.error('Failed to mark reminder as complete:', error);
      toast.error("Failed to mark reminder as complete");
    }
  };

  const fetchSessions = async () => {
    if (!patient?.id) return;
    setLoadingSessions(true);
    try {
      const result = await imagesAPI.getPatientSessions(patient.id);
      setSessions(result || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast.error("Failed to load images");
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleUploadSuccess = () => {
    fetchSessions();
    toast.success("Images uploaded successfully!");
  };

  const handleViewImages = (session) => {
    setSelectedSession(session);
    setShowImageViewer(true);
  };

  const handleSetBaseline = (sessionId) => {
    setSessions(prev => prev.map(s => ({
      ...s,
      is_baseline: s.id === sessionId
    })));
  };

  const handleDeleteSession = (sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleUpdateNotes = (sessionId, notes) => {
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, notes } : s
    ));
  };

  const fetchAppointments = async () => {
    if (!patient?.id) return;
    setLoadingAppointments(true);
    try {
      const offset = (currentPage - 1) * PAGE_SIZE;
      // Use generic getAll but remove hospital_id to show all appointments across hospitals for this patient
      const result = await appointmentsAPI.getAll({
        patient_id: patient.id,
        limit: PAGE_SIZE, 
        offset: offset,
        orderBy: 'appointment_date',
        sort: 'DESC',
        fromDate: '1000-01-01',
        toDate: '9999-12-31'
      });
      
      const appointmentsData = result.data || (Array.isArray(result) ? result : []);
      const total = result.total || appointmentsData.length;
      
      setAppointments(appointmentsData);
      setTotalCount(total);
    } catch (error) {
      console.error('Failed to load appointments:', error);
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

  const formatDate = (str) => str ? new Date(str).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Kolkata" }) : "N/A";
  const formatTime = (str) => {
    if (!str) return "N/A";
    const [h, m] = str.split(":");
    const hour = parseInt(h, 10);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  };
  const isDateFutureOrToday = (dateStr) => {
    if (!dateStr) return false;
    const aptDate = new Date(dateStr); aptDate.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return aptDate >= today;
  };
  const canModifyAppointment = (apt) => apt.status !== "fulfilled" && apt.status !== "cancelled" && isDateFutureOrToday(apt.appointment_date);
  const getStatusBadge = (status) => {
    const styles = { pending: "bg-yellow-100 text-yellow-700", confirmed: "bg-green-100 text-green-700", fulfilled: "bg-gray-100 text-gray-600", cancelled: "bg-red-100 text-red-700" };
    return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles[status?.toLowerCase()] || styles.pending}`}>{status || "Pending"}</span>;
  };

  const getVisitTypeBadge = (category) => {
    if (category === "Follow-up") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-tight">
          <RefreshCw className="w-3 h-3" /> Follow-up
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-tight">
        Fresh Visit
      </span>
    );
  };


  const handleLoadSlots = async () => {
    if (!selectedDoctor || !selectedDate) return;
    setLoadingSlots(true);
    try {
      const response = await appointmentsAPI.getAvailableSlots(selectedDoctor.id, selectedDate);
      console.log("📦 Slot API Response:", response);
      setSlotInfo(response); // Store full response including leave info
      setSlots(response.slots?.length ? response.slots : []);
      if (!response.slots?.length) toast.error("No slots available");
      if (response.on_leave) {
        toast.error(`Dr. ${selectedDoctor.staff_name} is on ${response.leave_type || ''} leave on this date`);
      }
    } catch { toast.error("Failed to fetch slots"); setSlots([]); setSlotInfo(null); } finally { setLoadingSlots(false); }
  };

  const handleConfirmBooking = async () => {
    if (bookingLoading) return;
    if (!reason.trim()) return toast.error("Enter reason for visit");
    setBookingLoading(true);
    try {
      await appointmentsAPI.create({
        hospital_id: HOSPITAL_ID, patient_id: patient.id, patientPhone: patient.phone || patient.contact_info,
        staff_id: selectedDoctor.id, appointment_date: selectedDate, appointment_time: selectedSlot,
        reason: reason.trim(), appointment_type: appointmentType, status: "pending",
      });
      toast.success("Appointment created successfully!");
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
    try {
      const response = await appointmentsAPI.getAvailableSlots(staffId, date);
      let slots = response.slots || [];

      // If rescheduling for the same date, exclude the current appointment time
      if (appointmentToReschedule && date === appointmentToReschedule.appointment_date) {
        slots = slots.filter(slot => slot.time !== appointmentToReschedule.appointment_time);
      }

      setRescheduleSlots(slots);
    }
    catch { setRescheduleSlots([]); } finally { setLoadingRescheduleSlots(false); }
  };
  const handleRescheduleConfirm = async () => {
    if (!rescheduleDate || !rescheduleSlot) return toast.error("Select date and time");
    setRescheduleLoading(true);
    try { await appointmentsAPI.update(appointmentToReschedule.id, { appointment_date: rescheduleDate, appointment_time: rescheduleSlot }); toast.success("Appointment rescheduled"); setRescheduleModalOpen(false); fetchAppointments(); }
    catch { toast.error("Failed to reschedule"); } finally { setRescheduleLoading(false); }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  // Handle accepting incoming call
  const handleAcceptCall = async (callData) => {
    try {
      console.log('Accepting call:', callData);
      setIsJoiningCall(true);

      // Emit Socket.IO event to accept call
      await socketService.acceptCall(callData.callId);

      // Update call status in backend
      await videoCallAPI.updateCallStatus(callData.callId, 'active');

      // Open Jitsi meeting
      setActiveCallId(callData.callId);
      setActiveRoomName(callData.roomName);
      setShowCallNotification(false);

      // Small delay to ensure everything is set before showing Jitsi
      setTimeout(() => {
        setShowJitsi(true);
        setIsJoiningCall(false);
        toast.success('Joined the call');
      }, 500);

    } catch (error) {
      console.error('Failed to accept call:', error);
      setIsJoiningCall(false);
      toast.error('Failed to join call. Please try again.');
    }
  };

  // Handle call timeout (patient didn't answer)
  const handleCallTimeout = async (callId) => {
    try {
      console.log('Call timed out:', callId);

      // Update call status to missed
      await videoCallAPI.updateCallStatus(callId, 'missed');

      setShowCallNotification(false);
      setIncomingCall(null);

      toast.error('Call missed');
    } catch (error) {
      console.error('Failed to handle call timeout:', error);
    }
  };

  // Handle ending call
  const handleEndCall = async (callId) => {
    if (!callId) {
      console.warn('No call ID provided for ending call');
      return;
    }

    try {
      console.log('Ending call:', callId);

      // Emit Socket.IO event to end call
      await socketService.endCall(callId);

      // Update call status in backend
      await videoCallAPI.updateCallStatus(callId, 'ended');

      setShowJitsi(false);
      setActiveCallId(null);
      setActiveRoomName(null);
      setShowRejoinBanner(false);

      toast.success('Call ended');

      // Refresh call history if on calls tab
      if (activeTab === 'calls') {
        fetchCallHistory();
      }
    } catch (error) {
      console.error('Failed to end call:', error);
      toast.error('Failed to end call properly');
    }
  };

  // Handle closing Jitsi without ending call
  const handleCloseJitsi = () => {
    setShowJitsi(false);
    // Show rejoin banner if call is still active
    if (activeCallId && activeRoomName) {
      setShowRejoinBanner(true);
      toast('You can rejoin the call anytime');
    }
  };

  // Handle rejoin call
  const handleRejoinCall = () => {
    if (activeCallId && activeRoomName) {
      setIsJoiningCall(true);
      setShowRejoinBanner(false);

      // Small delay for smooth transition
      setTimeout(() => {
        setShowJitsi(true);
        setIsJoiningCall(false);
        toast.success('Rejoined call');
      }, 500);
    }
  };

  // ========== TAB RENDERERS ==========

  const renderAppointmentsTab = () => {
    if (view === "booking") {
      // Use the new appointment flow with proper styling
      return (
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView("list")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Appointments
              </Button>
              <CardTitle className="text-lg">Book New Appointment</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <NewAppointmentFlow
              registeredPatient={patient}
              phone={patient?.phone}
              onSuccess={(appointment) => {
                // Go back to appointments list and refresh
                setView("list");
                if (appointment) {
                  // Appointment was successfully booked
                  fetchAppointments();
                }
                // If appointment is null, user just went back
              }}
            />
          </CardContent>
        </Card>
      );
    }
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
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full min-w-[800px]">
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
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1">
                              <span className="capitalize">{apt.appointment_type || "Consultation"}</span>
                              {getVisitTypeBadge(apt.visit_category)}
                            </div>
                          </td>

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
      <CardHeader className="space-y-4">
        {/* Back Button - Prominent at the top */}
        <Button
          variant="outline"
          onClick={() => {
            if (bookingStep === 1) {
              setView("list");
              resetBookingForm();
            } else {
              if (bookingStep === 3) setSelectedSlot("");
              if (bookingStep === 2) {
                setSelectedDate("");
                setSlots([]);
                setSelectedSlot("");
              }
              setBookingStep(bookingStep - 1);
            }
          }}
          className="w-fit flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{bookingStep === 1 ? "Back to Appointments" : "Previous Step"}</span>
        </Button>

        {/* Title and Progress Bar */}
        <div>
          <CardTitle className="text-xl font-bold mb-4">Book New Appointment</CardTitle>
          <div className="flex gap-1 mb-2">{[1, 2, 3].map((s) => <div key={s} className={`h-2 flex-1 rounded-full transition-all ${bookingStep >= s ? "bg-blue-600" : "bg-gray-200"}`} />)}</div>
          <div className="flex justify-between text-xs font-medium text-gray-500">
            <span className={bookingStep === 1 ? "text-blue-600" : ""}>Doctor</span>
            <span className={bookingStep === 2 ? "text-blue-600" : ""}>Date & Time</span>
            <span className={bookingStep === 3 ? "text-blue-600" : ""}>Details</span>
          </div>
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
            {slots.length > 0 && (
              <div>
                {slotInfo?.on_leave && (
                  <div className="bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 dark:border-amber-600 rounded-xl p-4 flex items-start gap-3 shadow-md mb-4">
                    <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-base font-bold text-amber-900 dark:text-amber-100 mb-1">
                        ⚠️ Doctor on Leave
                      </p>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        Dr. {selectedDoctor?.staff_name} is on {slotInfo.leave_type ? `${slotInfo.leave_type} ` : ''}leave on this date. All time slots are unavailable. Please select a different date.
                      </p>
                    </div>
                  </div>
                )}
                <label className="block text-sm font-medium mb-2">
                  {slotInfo?.on_leave ? 'Time Slots (Unavailable - Doctor on Leave)' : 'Available Slots'}
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {slots.map((slot, i) => {
                    const isOnLeave = slot.reason === "on_leave";
                    return (
                      <Button
                        key={i}
                        variant={selectedSlot === slot.time ? "default" : "outline"}
                        size="sm"
                        disabled={slot.status === "unavailable"}
                        className={`h-auto py-2 flex flex-col gap-1 ${slot.status === "unavailable"
                          ? isOnLeave
                            ? "opacity-60 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
                            : "opacity-50"
                          : ""
                          } ${selectedSlot === slot.time ? "bg-blue-600" : ""}`}
                        onClick={() => {
                          if (slot.status !== "unavailable") {
                            setSelectedSlot(slot.time);
                            setBookingStep(3);
                          }
                        }}
                        title={isOnLeave ? `Doctor on ${slotInfo?.leave_type || ''} leave` : slot.reason === "booked" ? "Already booked" : ""}
                      >
                        <span className={isOnLeave ? "text-amber-700 dark:text-amber-400" : ""}>{slot.display_time}</span>
                        {isOnLeave && <span className="text-[10px] text-amber-600 dark:text-amber-400">On Leave</span>}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
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

  const renderCallsTab = () => {
    const getCallIcon = (status) => {
      switch (status) {
        case 'active':
        case 'ended':
          return { icon: PhoneIncoming, color: 'bg-green-100', iconColor: 'text-green-600' };
        case 'missed':
          return { icon: PhoneMissed, color: 'bg-red-100', iconColor: 'text-red-600' };
        case 'rejected':
          return { icon: PhoneMissed, color: 'bg-orange-100', iconColor: 'text-orange-600' };
        default:
          return { icon: Phone, color: 'bg-blue-100', iconColor: 'text-blue-600' };
      }
    };

    const getCallDuration = (call) => {
      if (!call.acceptedAt || !call.endedAt) return '-';
      const start = new Date(call.acceptedAt);
      const end = new Date(call.endedAt);
      const durationMs = end - start;
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);
      return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    };

    const formatCallTime = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);

      // Format in IST timezone explicitly
      const options = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata' // IST timezone
      };

      return date.toLocaleTimeString('en-US', options);
    };

    const callsTotalPages = Math.ceil(callsTotalCount / CALLS_PAGE_SIZE) || 1;

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Phone className="w-5 h-5" />Call History
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchCallHistory}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loadingCallHistory ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
          ) : callHistory.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No call history found</p>
            </div>
          ) : (
            <div className="divide-y">
              {callHistory.map((call) => {
                const { icon: Icon, color, iconColor } = getCallIcon(call.status);
                const isActiveCall = call.status === 'active' && call.id === activeCallId;
                const canRejoin = call.status === 'active' && call.roomName;

                return (
                  <div key={call.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color} ${isActiveCall ? 'animate-pulse' : ''}`}>
                        <Icon className={`w-5 h-5 ${iconColor}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {call.doctorName || 'Doctor'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {call.status}
                          {isActiveCall && <span className="ml-2 text-green-600 font-semibold">• In Progress</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(call.createdAt)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatCallTime(call.createdAt)} • {getCallDuration(call)}
                        </p>
                      </div>
                      {canRejoin && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setActiveCallId(call.id);
                            setActiveRoomName(call.roomName);
                            setShowJitsi(true);
                            setShowRejoinBanner(false);
                            toast.success('Rejoining call...');
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <PhoneCall className="w-4 h-4 mr-1" />
                          Rejoin
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loadingCallHistory && callHistory.length > 0 && callsTotalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {callsCurrentPage} of {callsTotalPages} ({callsTotalCount} total calls)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCallsCurrentPage(p => Math.max(1, p - 1))}
                  disabled={callsCurrentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCallsCurrentPage(p => Math.min(callsTotalPages, p + 1))}
                  disabled={callsCurrentPage === callsTotalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderRemindersTab = () => {
    const getPriorityColor = (priority) => {
      switch (priority?.toLowerCase()) {
        case 'high': return 'bg-red-100 text-red-700 border-red-200';
        case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case 'low': return 'bg-green-100 text-green-700 border-green-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
      }
    };

    const formatReminderDate = (reminder) => {
      const dateString = reminder.reminder_time || reminder.due_date;
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5" />
              My Reminders
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchReminders}
              disabled={loadingReminders}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingReminders ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingReminders ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
          ) : reminders.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No reminders found</p>
              <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {reminder.title || `${reminder.reminder_type || 'Reminder'} Reminder`}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getPriorityColor(reminder.priority)}`}>
                          {reminder.priority || 'medium'}
                        </span>
                      </div>
                      {reminder.message && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          {reminder.message}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Due: {formatReminderDate(reminder)}</span>
                        </div>
                        {reminder.reminder_type && (
                          <span className="capitalize bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">
                            Type: {reminder.reminder_type}
                          </span>
                        )}
                        {(reminder.assigned_staff || reminder.assigned_to?.staff_name || reminder.assigned_to?.name) && (
                          <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                            <UserCircle2 className="w-4 h-4" />
                            <span>Assigned: {reminder.assigned_staff || reminder.assigned_to?.staff_name || reminder.assigned_to?.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkReminderComplete(reminder.id)}
                      className="flex-shrink-0"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Mark Complete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderImagesTab = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Camera className="w-5 h-5" />
          My Images
        </CardTitle>
        <Button
          onClick={() => setShowUploadModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Camera className="w-4 h-4 mr-2" />
          Upload Images
        </Button>
      </CardHeader>
      <CardContent>
        {loadingSessions ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          </div>
        ) : (
          <SessionTimeline
            sessions={sessions}
            onViewImages={handleViewImages}
            onDelete={handleDeleteSession}
            onUpdateNotes={handleUpdateNotes}
            onSetBaseline={handleSetBaseline}
            canManage={false}
          />
        )}
      </CardContent>
    </Card>
  );

  const renderRecordsTab = () => {
    const tabIcons = {
      "SOAP Notes": FileText,
      "Procedures": Activity,
      "Medications": Pill,
      "Diet Plans": Utensils,
      "Lab Results": FlaskConical,
      "Allergies & Notes": AlertCircle,
    };

    return (
      <div className="space-y-6">
        {/* Sub-navigation matching Doctor View */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-2 shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 min-w-max">
            {recordTabs.map((tab) => {
              const Icon = tabIcons[tab] || FileText;
              const isActive = activeRecordTab === tab;
              return (
                <Button
                  key={tab}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => setActiveRecordTab(tab)}
                  className={`h-10 px-4 rounded-lg flex items-center gap-2 transition-all ${
                    isActive 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none" 
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span className="text-sm font-semibold">{tab}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {loadingRecords ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {activeRecordTab === "SOAP Notes" && (
                <div className="space-y-6">
                  {consultationHistory.length > 0 ? (
                    consultationHistory.map((cons) => (
                      <Card key={cons.id} className="overflow-hidden border-0 shadow-lg bg-white dark:bg-gray-800">
                        <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 py-4 px-6 border-b border-gray-100 dark:border-gray-800">
                          <div className="flex justify-between items-center">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                                <FileText className="h-5 w-5" />
                                <CardTitle className="text-lg font-bold">
                                  {formatDate(cons.consultation_date)} - Dr. {cons.staff?.staff_name}
                                </CardTitle>
                              </div>
                              <p className="text-xs text-gray-500 font-medium">Duration: {cons.duration_minutes || 0} minutes</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          {[
                            { label: 'Subjective', val: cons.subjective, color: 'blue' },
                            { label: 'Objective', val: cons.objective, color: 'emerald' },
                            { label: 'Assessment', val: cons.assessment, color: 'amber' },
                            { label: 'Plan', val: cons.plan, color: 'purple' }
                          ].map((section, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border transition-all duration-300 ${
                              section.color === 'blue' ? 'bg-blue-50/30 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/20' :
                              section.color === 'emerald' ? 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/20' :
                              section.color === 'amber' ? 'bg-amber-50/30 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/20' :
                              'bg-purple-50/30 border-purple-100 dark:bg-purple-900/10 dark:border-purple-900/20'
                            }`}>
                              <p className={`text-sm font-black mb-2 ${
                                section.color === 'blue' ? 'text-blue-700 dark:text-blue-400' :
                                section.color === 'emerald' ? 'text-emerald-700 dark:text-emerald-400' :
                                section.color === 'amber' ? 'text-amber-700 dark:text-amber-400' :
                                'text-purple-700 dark:text-purple-400'
                              }`}>
                                {section.label}:
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {section.val || 'No details recorded.'}
                              </p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800">
                      <FileText className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium font-lg">No visit history found</p>
                    </div>
                  )}
                </div>
              )}

              {activeRecordTab === "Procedures" && (
                <div className="space-y-4">
                  {proceduresHistory.length > 0 ? (
                    proceduresHistory.map((proc, i) => (
                      <Card key={i} className="group border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden bg-white dark:bg-gray-800">
                        <CardContent className="p-0">
                          <div className="flex items-center p-5 gap-5">
                            <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                              <Activity className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-md font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                    {proc.procedure?.name || proc.procedure_name || proc.name || 'Clinical Procedure'}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-md uppercase tracking-tighter">
                                      {proc.procedure?.category || proc.category || 'Consultation Procedure'}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-black text-blue-600 dark:text-blue-400">
                                    ₹{proc.actual_price_charged || proc.cost || '0.00'}
                                  </p>
                                </div>
                              </div>
                              <p className="text-[11px] text-gray-500 mt-2 font-medium">
                                Performed on {formatDate(proc.consultation_date || proc.created_at)} by Dr. {proc.doctor_name || 'Medical Staff'}
                              </p>
                              {proc.doctor_notes && (
                                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg text-[11px] italic text-gray-600 border border-gray-100">
                                  " {proc.doctor_notes} "
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800">
                      <Activity className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium font-lg">No procedure records found</p>
                    </div>
                  )}
                </div>
              )}

              {activeRecordTab === "Diet Plans" && (
                <div className="space-y-6">
                  {dietPlanHistory.length > 0 ? (
                    dietPlanHistory.map((plan, i) => (
                      <Card key={i} className="border-0 shadow-lg overflow-hidden bg-white dark:bg-gray-800">
                        <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <CardTitle className="text-md font-bold flex items-center gap-2">
                                <Utensils className="h-4 w-4" />
                                Diet Plan - {formatDate(plan.consultation?.consultation_date || plan.created_at)}
                              </CardTitle>
                              <p className="text-[10px] opacity-90 mt-0.5">Prescribed by {plan.assigner?.staff_name}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                            {[
                              { label: 'Morning', icon: '🌅', val: plan.plan_data?.morning },
                              { label: 'Breakfast', icon: '🍳', val: plan.plan_data?.breakfast },
                              { label: 'Lunch', icon: '🍱', val: plan.plan_data?.lunch },
                              { label: 'Evening', icon: '☕', val: plan.plan_data?.snack },
                              { label: 'Dinner', icon: '🌙', val: plan.plan_data?.dinner }
                            ].map((item, idx) => (
                              <div key={idx} className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                                <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1">
                                  <span>{item.icon}</span> {item.label}
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed min-h-[40px]">
                                  {item.val || 'Not specified'}
                                </p>
                              </div>
                            ))}
                          </div>
                          {plan.plan_data?.instructions && (
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed border-emerald-200 dark:border-emerald-800">
                              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-2">
                                Additional Advice & Restrictions
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                "{plan.plan_data.instructions}"
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800">
                      <Utensils className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium font-lg">No Diet Charts prescribed yet</p>
                    </div>
                  )}
                </div>
              )}

              {activeRecordTab === "Medications" && (
                <div className="space-y-4">
                  {consultationHistory.flatMap(c => c.prescriptions || []).length > 0 ? (
                    consultationHistory.map((consultation) =>
                      consultation.prescriptions?.map((med, i) => (
                        <Card key={`${consultation.id}-${i}`} className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                          <CardContent className="p-5">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <Pill className="h-5 w-5 text-green-600 dark:text-green-400" />
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-lg text-gray-900 dark:text-white mb-2">{med.medicine_name}</p>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">
                                    {med.dosage}
                                  </span>
                                  <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-semibold">
                                    {med.frequency}
                                  </span>
                                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-semibold">
                                    {med.duration}
                                  </span>
                                </div>
                                {med.instructions && (
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                    <span className="font-semibold">Instructions:</span> {med.instructions}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Prescribed on {formatDate(consultation.consultation_date)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )
                  ) : (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800">
                      <Pill className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium font-lg">No medications prescribed</p>
                    </div>
                  )}
                </div>
              )}

              {activeRecordTab === "Lab Results" && (
                <div className="space-y-4">
                  {labOrders.length > 0 ? (
                    labOrders.map((lab) => (
                      <Card key={lab.id} className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 border-l-4 border-orange-400 overflow-hidden">
                        <CardContent className="p-0">
                          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="h-14 w-14 rounded-2xl bg-orange-50 dark:bg-orange-900/10 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform duration-300">
                                <FlaskConical className="h-7 w-7" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-lg text-gray-900 dark:text-white">{lab.test_name}</h4>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                                    lab.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    lab.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                                    lab.status === 'sample_collected' ? 'bg-amber-100 text-amber-700' :
                                    'bg-gray-100 text-gray-500'
                                  }`}>
                                    {lab.status?.replace('_', ' ')}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500 font-bold flex items-center gap-2">
                                   <CalendarDays className="w-3.5 h-3.5" /> Ordered on {formatDate(lab.created_at)}
                                </p>
                                {lab.instructions && (
                                   <div className="text-[11px] text-gray-400 italic bg-gray-50 dark:bg-gray-700/30 p-2 rounded-lg border border-gray-100 dark:border-gray-700 mt-2">
                                      Instructions: {lab.instructions}
                                   </div>
                                )}
                                {lab.doctor_notes && (
                                   <div className="text-[11px] text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/10 p-2.5 rounded-lg border border-blue-100 dark:border-blue-800/30 mt-2 flex gap-2">
                                      <span className="flex-shrink-0 mt-0.5">🩺 Note:</span>
                                      <span className="italic mt-0.5">"{lab.doctor_notes}"</span>
                                   </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-center md:items-end gap-3 min-w-[160px]">
                              {lab.report_file_url ? (
                                <Button
                                  onClick={() => handleViewReport(lab.report_file_url)}
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
                                >
                                  <Download className="w-4 h-4" />
                                  View Report
                                </Button>
                              ) : (
                                <div className="w-full">
                                  <input
                                    type="file"
                                    id={`upload-${lab.id}`}
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => handleLabUpload(lab.id, e.target.files[0])}
                                  />
                                  <label
                                    htmlFor={`upload-${lab.id}`}
                                    className={`w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-6 rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer ${uploadingLabId === lab.id ? 'opacity-50 pointer-events-none' : ''}`}
                                  >
                                    {uploadingLabId === lab.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Upload className="w-4 h-4" />
                                    )}
                                    Upload Report
                                  </label>
                                </div>
                              )}
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                                {lab.status === 'completed' || lab.status === 'reviewed' ? 'Results Available' : 'Pending Results'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800">
                      <FlaskConical className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium font-lg">No lab orders found</p>
                    </div>
                  )}
                </div>
              )}

              {activeRecordTab === "Allergies & Notes" && (
                <div className="space-y-4">
                  <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">Allergies</CardTitle>
                      </div>
                      {patient?.allergies ? (
                        <ul className="space-y-2">
                          {patient.allergies.split(',').map((allergy, i) => (
                            <li key={i} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700/50 rounded-lg border border-red-200 dark:border-red-800">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-red-700 dark:text-red-400 font-semibold">{allergy.trim()}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">No known allergies</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">Medical History</CardTitle>
                      </div>
                      {patient?.medical_history ? (
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{patient.medical_history}</p>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">No medical history recorded</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPaymentsTab = () => {
    const unpaidBills = bills.filter(b => ['unpaid', 'pending', 'created'].includes(b.status?.toLowerCase()));
    const paidBills = bills.filter(b => ['paid', 'settled'].includes(b.status?.toLowerCase()));

    return (
      <div className="space-y-6">
        <header className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
             </div>
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Dashboard</h2>
          </div>
          <p className="text-gray-500 pl-11">Manage your health investments and view detailed invoices</p>
        </header>

        {loadingBills ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card className="relative overflow-hidden border-0 bg-blue-600 text-white shadow-xl shadow-blue-500/20">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Activity className="w-32 h-32" />
                </div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center gap-3 mb-4 opacity-80">
                    <Receipt className="w-5 h-5 text-blue-100" />
                    <span className="text-sm font-medium uppercase tracking-wider">Amount Due</span>
                  </div>
                  <div className="text-4xl font-black mb-1">
                    ₹{(unpaidBills.reduce((acc, curr) => acc + (parseFloat(curr.total_amount) || parseFloat(curr.amount) || 0), 0) / 100).toFixed(2)}
                  </div>
                  <p className="text-blue-100 text-xs font-semibold backdrop-blur-sm bg-white/10 w-fit px-2 py-1 rounded">
                    {unpaidBills.length} PENDING TRANSACTIONS
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 ring-1 ring-gray-100 dark:ring-gray-700">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-500" /> Secured Payments
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    All payment data is encrypted as per SOC2 and HIPAA standards. 
                  </p>
                  <div className="flex gap-2">
                    <div className="h-6 w-10 bg-gray-50 dark:bg-gray-700/50 rounded flex items-center justify-center text-[8px] font-black text-gray-400 border">UPI</div>
                    <div className="h-6 w-10 bg-gray-50 dark:bg-gray-700/50 rounded flex items-center justify-center text-[8px] font-black text-gray-400 border">VISA</div>
                    <div className="h-6 w-10 bg-gray-50 dark:bg-gray-700/50 rounded flex items-center justify-center text-[8px] font-black text-gray-400 border">MASTER</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                   <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" /> Pending Settlement
                  </h3>
                   <span className="text-[10px] text-gray-400">{unpaidBills.length} Items</span>
                </div>

                {unpaidBills.length > 0 ? (
                  unpaidBills.map((bill) => (
                    <Card key={bill.id} className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 border-l-4 border-amber-400 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="h-14 w-14 rounded-2xl bg-amber-50 dark:bg-amber-900/10 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform duration-300">
                              <AlertCircle className="h-7 w-7" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-lg text-gray-900 dark:text-white">Invoice #{bill.invoice_number || bill.id.slice(0, 8)}</h4>
                              </div>
                              <p className="text-sm text-gray-500 font-bold flex items-center gap-2">
                                 <CalendarDays className="w-3.5 h-3.5" /> {formatDate(bill.created_at)}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                 <div className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-[10px] font-bold text-gray-500 flex items-center gap-1">
                                    <Stethoscope className="w-3 h-3" />  {bill.staff_name || 'Medical Team'}
                                 </div>
                                 <Button 
                                    variant="link" 
                                    className="h-auto p-0 text-[10px] font-bold text-blue-600"
                                    onClick={() => fetchInvoiceDetails(bill.id)}
                                 >
                                    View Details
                                 </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-center md:items-end gap-3 min-w-[140px]">
                            <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                               ₹{(parseFloat(bill.total_amount || bill.amount || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                            <Button
                              onClick={() => handleOnlinePayment(bill)}
                              disabled={paymentLoading}
                              className="w-full bg-blue-600 hover:bg-highlight text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95"
                            >
                              {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Settle Now'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-16 bg-gray-50/50 dark:bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800">
                    <CheckCircle className="h-14 w-14 text-emerald-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold">Everything Paid Up!</p>
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-500" /> Transaction History
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paidBills.map((bill) => (
                    <Card key={bill.id} className="group border-0 shadow-sm hover:shadow-md bg-gray-50/50 dark:bg-gray-800/40 border-l-2 border-emerald-500/30 transition-all duration-300">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter flex items-center gap-1">
                               <CheckCircle className="w-3 h-3" /> Paid
                            </p>
                            <h4 className="font-bold text-gray-900 dark:text-white">₹{(parseFloat(bill.total_amount || bill.amount || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
                            <p className="text-[10px] font-bold text-gray-400">Inv #{bill.invoice_number || bill.id.slice(0, 8)}</p>
                          </div>
                          <div className="flex gap-1">
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 bg-white dark:bg-gray-700 shadow-sm text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
                                onClick={() => fetchInvoiceDetails(bill.id)}
                                title="View Breakdown"
                             >
                                <Receipt className="w-4 h-4" />
                             </Button>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 bg-white dark:bg-gray-700 shadow-sm text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all"
                                onClick={() => handleDownloadReceipt(bill.id)}
                                title="Download PDF"
                             >
                                <Download className="w-4 h-4" />
                             </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold">
                             <CalendarDays className="w-3 h-3 text-gray-400" /> {formatDate(bill.created_at)}
                          </div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-tighter bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                             {bill.payment_mode || 'Cash'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* Breakdown Modal */}
        {viewingBillModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setViewingBillModal(false)}></div>
            <Card className="relative w-full max-w-lg bg-white dark:bg-gray-900 overflow-hidden shadow-2xl rounded-3xl border-0 animate-in zoom-in-95 duration-200">
               <CardHeader className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6">
                  <div className="flex justify-between items-start">
                     <div>
                        <CardTitle className="text-xl font-black mb-1">Invoice Breakdown</CardTitle>
                        <p className="text-blue-100 text-xs font-semibold">
                           #{selectedBillDetails?.receiptNumber || 'Loading...'}
                        </p>
                     </div>
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white hover:bg-white/20 rounded-full"
                        onClick={() => setViewingBillModal(false)}
                     >
                        <X className="w-5 h-5" />
                     </Button>
                  </div>
               </CardHeader>
               
               <CardContent className="p-6 max-h-[70vh] overflow-y-auto">
                  {loadingDetails ? (
                     <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                        <p className="text-sm font-bold text-gray-500 animate-pulse uppercase tracking-widest">Compiling details...</p>
                     </div>
                  ) : (
                     <div className="space-y-6">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 flex items-center justify-between border border-gray-100 dark:border-gray-700">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                                 <Stethoscope className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Attending Professional</p>
                                 <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    {selectedBillDetails?.doctorName || 'Medical Team'}
                                 </p>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${selectedBillDetails?.paymentStatus === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                              <span className="text-[10px] font-black text-gray-500">{selectedBillDetails?.paymentStatus}</span>
                           </div>
                        </div>

                        <div className="space-y-3">
                           <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Detailed Line Items</h4>
                           {selectedBillDetails?.items?.map((item, i) => (
                              <div key={i} className="flex items-center justify-between py-3 px-1 border-b border-gray-50 dark:border-gray-800 last:border-0 group">
                                 <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 transition-colors">
                                       {item.type === 'Consultation' ? <Stethoscope className="w-5 h-5" /> : 
                                        item.type === 'Pharmaceutical' || item.type === 'Medicine' ? <Pill className="w-5 h-5" /> :
                                        item.type === 'Lab' ? <FlaskConical className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                                    </div>
                                    <div>
                                       <p className="text-sm font-bold text-gray-900 dark:text-white">{item.name}</p>
                                       <p className="text-[10px] font-medium text-gray-400">Qty: {item.qty} × ₹{parseFloat(item.unitPrice).toFixed(2)}</p>
                                    </div>
                                 </div>
                                 <div className="text-sm font-black text-gray-900 dark:text-white">
                                    ₹{parseFloat(item.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                 </div>
                              </div>
                           ))}
                        </div>

                        <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-3xl p-6 shadow-2xl">
                           <div className="flex items-center justify-between mb-2 opacity-60">
                              <span className="text-xs font-bold uppercase tracking-widest">Subtotal</span>
                              <span className="text-sm font-bold">₹{parseFloat(selectedBillDetails?.summary?.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                           </div>
                           <div className="flex items-center justify-between">
                              <span className="text-sm font-black uppercase tracking-widest">Grand Total</span>
                              <span className="text-2xl font-black tracking-tighter text-blue-400 dark:text-blue-600">
                                 ₹{parseFloat(selectedBillDetails?.summary?.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                           </div>
                        </div>
                     </div>
                  )}
               </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  };

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
          <div>
            <label className="block text-sm font-medium mb-2">Select Date</label>
            <div className="relative">
              <Input
                type={rescheduleDate ? "date" : "text"}
                onFocus={(e) => e.target.type = "date"}
                onBlur={(e) => !rescheduleDate && (e.target.type = "text")}
                value={rescheduleDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setRescheduleDate(e.target.value);
                  fetchRescheduleSlots(appointmentToReschedule.staff_id, e.target.value);
                  setRescheduleSlot("");
                }}
                placeholder="Select Reschedule Date"
                className="w-full date-input-field"
              />
            </div>
          </div>
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
      case "reminders": return renderRemindersTab();
      case "calls": return renderCallsTab();
      case "images": return renderImagesTab();
      case "records": return renderRecordsTab();
      case "profile": return renderProfileTab();
      case "payments": return renderPaymentsTab();
      default: return renderAppointmentsTab();
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-blue-50 dark:bg-gray-900"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>;

  return (
    <div className="min-h-svh flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Toast Notifications */}
      <Toaster position="top-right" />

      {/* Loading Overlay while joining call */}
      {isJoiningCall && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">Joining Call...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please wait</p>
            </div>
          </div>
        </div>
      )}

      {/* Rejoin Call Banner */}
      {showRejoinBanner && !showJitsi && activeCallId && activeRoomName && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-green-600 text-white px-4 py-3 shadow-lg">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PhoneCall className="h-5 w-5 animate-pulse" />
              <span className="font-medium">You have an active call</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRejoinCall}
                className="bg-white text-green-600 hover:bg-gray-100 h-8 px-4 text-sm font-medium"
              >
                Rejoin Call
              </Button>
              <button
                onClick={() => setShowRejoinBanner(false)}
                className="p-1 hover:bg-green-700 rounded"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <PatientSidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab !== "appointments") setView("list");
            if (tab === "payments") setLoadingBills(true);
            if (tab === "records") setLoadingRecords(true);
            if (tab === "reminders") setLoadingReminders(true);
            if (tab === "calls") setLoadingCallHistory(true);
            if (tab === "images") setLoadingSessions(true);
            if (tab === "profile") setLoadingProfile(true);
          }}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden pt-0">
          <PatientNavbar
            patientName={patient?.name || patient?.patient_name}
            patientRole="Patient"
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              if (tab !== "appointments") setView("list");
              if (tab === "payments") setLoadingBills(true);
              if (tab === "records") setLoadingRecords(true);
              if (tab === "reminders") setLoadingReminders(true);
              if (tab === "calls") setLoadingCallHistory(true);
              if (tab === "images") setLoadingSessions(true);
              if (tab === "profile") setLoadingProfile(true);
            }}
            patientId={patient?.id}
            onMenuClick={() => {
              if (window.innerWidth < 1024) {
                setIsMobileSidebarOpen(true);
              } else {
                setIsSidebarCollapsed(!isSidebarCollapsed);
              }
            }}
          />

          <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-6">
              {renderActiveTab()}
            </div>
          </main>
        </div>
      </div>

      {showCallNotification && incomingCall && (
        <CallNotification
          callData={incomingCall}
          onAccept={handleAcceptCall}
          onTimeout={handleCallTimeout}
        />
      )}

      {/* Jitsi Meeting */}
      {showJitsi && activeCallId && activeRoomName && (
        <JitsiMeeting
          roomName={activeRoomName}
          displayName={patient?.name || patient?.patient_name || "Patient"}
          callId={activeCallId}
          onClose={handleCloseJitsi}
          onCallEnd={handleEndCall}
        />
      )}

      {renderCancelModal()}
      {renderRescheduleModal()}

      {/* Upload Session Modal */}
      <UploadSessionModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        patientId={patient?.id}
        uploadedBy={{ id: patient?.id, type: 'patient' }}
        onSuccess={handleUploadSuccess}
      />

      {/* Image Viewer */}
      <ImageViewer
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        session={selectedSession}
      />
      {/* Hidden Receipt Template for PDF generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
        {receiptData && <ReceiptTemplate data={receiptData} ref={receiptRef} />}
      </div>
    </div>
  );
}