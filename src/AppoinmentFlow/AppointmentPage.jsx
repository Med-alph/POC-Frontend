import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useHospital } from "@/contexts/HospitalContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeft,
  Loader2,
  Stethoscope,
  Moon,
  Sun,
} from "lucide-react";
import { toast } from "sonner";


import AddPatientDialog from "@/Patients/AddPatient";
import { patientsAPI } from "@/api/patientsapi";
import appointmentsAPI from "@/api/appointmentsapi";
import staffApi from "../api/staffapi";
import NewAppointmentFlow from "./NewAppointmentFlow";

export default function AppointmentForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { phone, isFirstTime: initialFirstTime } = location.state || {};

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { hospitalInfo } = useHospital();
  const HOSPITAL_ID = hospitalInfo?.hospital_id;

  const [step, setStep] = useState(1);

  // Patient flow states
  const [isFirstTime, setIsFirstTime] = useState(initialFirstTime ?? null);
  const [showAddPatientDialog, setShowAddPatientDialog] = useState(false);
  const [existingPatientData, setExistingPatientData] = useState(null);
  const [showPatientConfirmation, setShowPatientConfirmation] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState(null);
  const [checkingPatient, setCheckingPatient] = useState(false);

  // Appointment states
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slotInfo, setSlotInfo] = useState(null); // Stores full slot response including leave info
  const [appointmentType, setAppointmentType] = useState("consultation");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // New doctor preference flow states
  const [doctorPreference, setDoctorPreference] = useState(""); // "yes" or "no"
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [loadingAvailableDoctors, setLoadingAvailableDoctors] = useState(false);

  const [patientAppointments, setPatientAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [reloadAppointments, setReloadAppointments] = useState(0);

  // Cancel modal states
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

  // Reschedule modal states
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [rescheduleSlotInfo, setRescheduleSlotInfo] = useState(null); // Stores full slot response for reschedule
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  const userId = "system_user";


  const isDateTodayOrFuture = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight

    const apptDate = new Date(dateString);
    apptDate.setHours(0, 0, 0, 0); // Normalize to midnight

    return apptDate >= today;
  };


  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  useEffect(() => {
    const checkPatient = async () => {
      if (!phone) return;
      try {
        setCheckingPatient(true);
        const patient = await patientsAPI.getByPhoneAndHospital(phone, HOSPITAL_ID);
        if (patient && patient.id) {
          setExistingPatientData(patient);
          setShowPatientConfirmation(true);
          setRegisteredPatient(patient);
        } else {
          setShowAddPatientDialog(true);
        }
      } catch {
        toast.error("Could not check patient records");
      } finally {
        setCheckingPatient(false);
      }
    };
    checkPatient();
  }, [phone]);

  // Fetch appointments
  useEffect(() => {
    if (!registeredPatient?.id) {
      setPatientAppointments([]);
      return;
    }
    setLoadingAppointments(true);
    appointmentsAPI.getByPatient(registeredPatient.id, { limit: 20 })
      .then((response) => {
        setPatientAppointments(response.data || []);
      })
      .catch(() => {
        toast.error("Failed to load patient's appointments");
      })
      .finally(() => setLoadingAppointments(false));
  }, [registeredPatient?.id, reloadAppointments]);

  const handleAddPatient = async (patientData) => {
    try {
      setLoading(true);
      const newPatient = await patientsAPI.create({
        ...patientData,
        user_id: userId,
        hospital_id: HOSPITAL_ID,
        contact_info: phone,
      });
      setRegisteredPatient(newPatient);
      setShowAddPatientDialog(false);
      toast.success("Patient registered successfully!");
      setTimeout(() => setStep(2), 500);
    } catch {
      toast.error("Failed to register patient");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithExistingPatient = () => {
    setRegisteredPatient(existingPatientData);
    setShowPatientConfirmation(false);
    toast.success(`Welcome back, ${existingPatientData.patient_name}`);
    setTimeout(() => setStep(2), 500); // Go to new appointment flow
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!registeredPatient) return;
      try {
        setLoadingDoctors(true);
        const response = await staffApi.getByHospital(HOSPITAL_ID, {
          limit: 50,
          offset: 0,
        });
        const activeDoctors = response.data.filter(
          (doc) => doc.status?.toLowerCase() === "active" && !doc.is_archived
        );
        setDoctors(activeDoctors);
      } catch {
        toast.error("Failed to load doctors");
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, [registeredPatient]);

  const handleSelectDate = async () => {
    if (!selectedDoctor || !selectedDate) return;
    try {
      setLoadingSlots(true);
      console.log("🔍 Fetching slots for:", {
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.staff_name,
        date: selectedDate
      });

      const response = await appointmentsAPI.getAvailableSlots(
        selectedDoctor.id,
        selectedDate
      );

      console.log("📦 Full API Response:", response);
      console.log("🏥 on_leave flag:", response.on_leave);
      console.log("📋 leave_type:", response.leave_type);
      console.log("🕐 Number of slots:", response.slots?.length);
      console.log("🎯 First slot sample:", response.slots?.[0]);

      setSlotInfo(response); // Store full response including on_leave flag

      if (response.slots?.length) {
        setSlots(response.slots);
        console.log("✅ Slots set successfully");

        // Show toast if doctor is on leave
        if (response.on_leave) {
          console.log("⚠️ Doctor is on leave - showing warning");
          toast.warning(`Doctor is on ${response.leave_type || ''} leave on this date`);
        } else {
          console.log("✓ Doctor is available");
        }
      } else {
        console.log("❌ No slots in response");
        toast.error("No slots available");
        setSlots([]);
      }
    } catch (error) {
      console.error("💥 Error fetching slots:", error);
      toast.error("Failed to fetch slots");
      setSlots([]);
      setSlotInfo(null);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Reschedule modal logic
  const openRescheduleModal = (appointment) => {
    setAppointmentToReschedule(appointment);
    setRescheduleDate(appointment.appointment_date);
    setRescheduleSlot(appointment.appointment_time);
    setRescheduleSlots([]);
    setRescheduleModalOpen(true);
    fetchRescheduleSlots(appointment.staff_id, appointment.appointment_date);
  };

  // New function to fetch available doctors for selected date/time
  const fetchAvailableDoctors = async () => {
    if (!selectedDate || !selectedSlot) return;

    try {
      setLoadingAvailableDoctors(true);

      // Get available doctors from the API (backend now handles filtering)
      const response = await appointmentsAPI.getAvailableDoctors(
        selectedDate,
        selectedSlot,
        HOSPITAL_ID
      );

      console.log("Available doctors response:", response);

      // Handle both array format and object format
      const doctors = Array.isArray(response) ? response : (response.doctors || []);

      // Map the response to match expected format
      const mappedDoctors = doctors.map(doctor => ({
        id: doctor.doctorId || doctor.id,
        staff_name: doctor.doctorName || doctor.staff_name,
        department: doctor.department,
        staff_code: doctor.specialty || doctor.staff_code,
      }));

      console.log("Final mapped doctors:", mappedDoctors);
      setAvailableDoctors(mappedDoctors);

      if (mappedDoctors.length === 0) {
        toast.info("No doctors available for this time slot");
      }

    } catch (error) {
      console.error("Error fetching available doctors:", error);
      toast.error("Failed to fetch available doctors");
      setAvailableDoctors([]);
    } finally {
      setLoadingAvailableDoctors(false);
    }
  };

  // Handle doctor preference selection
  const handleDoctorPreference = async (preference) => {
    setDoctorPreference(preference);

    if (preference === "yes") {
      // Show doctor list
      await fetchAvailableDoctors();
      setStep(2); // Go to doctor selection step
    } else {
      // Skip doctor selection, go to date/time
      setSelectedDoctor(null); // Clear any previously selected doctor
      setStep(3); // Go to date/time selection
    }
  };

  // Book appointment with any available doctor
  const handleBookAnyAvailable = async () => {
    if (!selectedDate || !selectedSlot || !reason.trim() || !registeredPatient) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      const appointmentData = {
        hospital_id: HOSPITAL_ID,
        patient_id: registeredPatient.id,
        patientPhone: phone,
        appointment_date: selectedDate,
        appointment_time: selectedSlot,
        appointment_type: appointmentType,
        reason: reason.trim(),
        preferredDoctor: false,
        status: "pending",
      };

      const created = await appointmentsAPI.bookAnyAvailable(appointmentData);
      toast.success("Appointment booked successfully!");
      navigate("/confirmation", { state: { appointment: created } });
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error("Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  const fetchRescheduleSlots = async (staffId, date) => {
    if (!staffId || !date) return;
    setLoadingRescheduleSlots(true);
    try {
      const response = await appointmentsAPI.getAvailableSlots(staffId, date);
      console.log("Reschedule slot response:", response); // Debug log
      setRescheduleSlotInfo(response); // Store full response including leave info

      // Filter out the current appointment's time slot when rescheduling
      let availableSlots = response.slots || [];
      if (appointmentToReschedule && date === appointmentToReschedule.appointment_date) {
        availableSlots = availableSlots.filter(slot =>
          slot.time !== appointmentToReschedule.appointment_time
        );
        console.log(`🚫 Filtered out current appointment time: ${appointmentToReschedule.appointment_time}`);
      }

      setRescheduleSlots(availableSlots);

      // Show toast if doctor is on leave
      if (response.on_leave) {
        toast.warning(`Doctor is on ${response.leave_type || ''} leave on this date`);
      }
    } catch {
      toast.error("Failed to fetch slots");
      setRescheduleSlots([]);
      setRescheduleSlotInfo(null);
    } finally {
      setLoadingRescheduleSlots(false);
    }
  };

  const handleRescheduleConfirm = async () => {
    if (!rescheduleDate || !rescheduleSlot || !appointmentToReschedule) {
      toast.error("Please select date and time");
      return;
    }
    setRescheduleLoading(true);
    try {
      await appointmentsAPI.update(appointmentToReschedule.id, {
        appointment_date: rescheduleDate,
        appointment_time: rescheduleSlot,
      });
      toast.success("Appointment rescheduled successfully");
      setRescheduleModalOpen(false);
      setAppointmentToReschedule(null);
      setReloadAppointments((v) => v + 1);
    } catch {
      toast.error("Failed to reschedule appointment");
    } finally {
      setRescheduleLoading(false);
    }
  };

  // Cancel modal logic
  const openCancelModal = (appointment) => {
    setAppointmentToCancel(appointment);
    setCancelReason("");
    setCancelModalOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancelReason.trim() || !appointmentToCancel) {
      toast.error("Cancellation reason required.");
      return;
    }
    setCancelling(true);
    try {
      await appointmentsAPI.cancel(appointmentToCancel.id, {
        cancelled_by: existingPatientData?.id,
        reason: cancelReason.trim(),
      });
      toast.success("Appointment cancelled successfully");
      setCancelModalOpen(false);
      setAppointmentToCancel(null);
      setCancelReason("");
      setReloadAppointments((v) => v + 1);
    } catch {
      toast.error("Failed to cancel appointment");
    } finally {
      setCancelling(false);
    }
  };

  // Regular appointment booking (when doctor is selected)
  const handleConfirm = async () => {
    if (!reason.trim()) return toast.error("Enter reason for visit");
    if (!registeredPatient) return toast.error("Patient info missing");
    if (!selectedDate) return toast.error("Select a date");
    if (!selectedSlot) return toast.error("Select a time slot");

    try {
      setLoading(true);

      if (selectedDoctor) {
        // Book with specific doctor
        const payload = {
          hospital_id: HOSPITAL_ID,
          patient_id: registeredPatient.id,
          patientPhone: phone,
          staff_id: selectedDoctor.id,
          appointment_date: selectedDate,
          appointment_time: selectedSlot,
          reason: reason.trim(),
          appointment_type: appointmentType,
          preferredDoctor: true,
          status: "pending",
        };
        const created = await appointmentsAPI.create(payload);
        toast.success("Appointment created successfully!");
        navigate("/confirmation", { state: { appointment: created } });
      } else {
        // Book with any available doctor
        const appointmentData = {
          hospital_id: HOSPITAL_ID,
          patient_id: registeredPatient.id,
          patientPhone: phone,
          appointment_date: selectedDate,
          appointment_time: selectedSlot,
          appointment_type: appointmentType,
          reason: reason.trim(),
          preferredDoctor: false,
          status: "pending",
        };
        const created = await appointmentsAPI.bookAnyAvailable(appointmentData);
        toast.success("Appointment booked successfully!");
        navigate("/confirmation", { state: { appointment: created } });
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error("Failed to create appointment");
    } finally {
      setLoading(false);
    }
  };

  const renderSlotIcon = (status) => {
    switch (status) {
      case "available":
        return <CheckCircleIcon className="text-green-500 w-4 h-4" />;
      case "unavailable":
        return <XCircleIcon className="text-red-500 w-4 h-4" />;
      default:
        return null;
    }
  };

  const handleBack = () => {
    if (step === 1) {
      navigate(-1);
    } else if (step === 4) {
      setSelectedSlot("");
      setStep(step - 1);
    } else {
      setStep(step - 1);
    }
  };

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
    document.documentElement.classList.toggle("dark", newMode);
  };
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    }
  }, [darkMode]);

  // Debug useEffect to track slotInfo changes
  useEffect(() => {
    console.log("🔄 slotInfo changed:", slotInfo);
    console.log("🔄 slotInfo.on_leave:", slotInfo?.on_leave);
    console.log("🔄 slots.length:", slots.length);
    if (slotInfo?.on_leave) {
      console.log("🚨 SHOULD SHOW LEAVE BANNER NOW!");
    }
  }, [slotInfo, slots]);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Patient Information</h2>
            </div>
            {checkingPatient ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="animate-spin text-blue-600 h-10 w-10 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Verifying patient information...</p>
              </div>
            ) : showPatientConfirmation && existingPatientData ? (
              <>
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 shadow-lg">
                  <CardHeader className="border-b border-green-200 dark:border-green-700 bg-white/50 dark:bg-gray-800/50">
                    <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
                      <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                      Patient Found!
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Full Name</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {existingPatientData.patient_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Phone</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {existingPatientData.phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Date of Birth</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {existingPatientData.date_of_birth ? formatDate(existingPatientData.date_of_birth) : "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Gender</p>
                        <p className="font-semibold text-gray-900 dark:text-white capitalize">
                          {existingPatientData.gender || "Not specified"}
                        </p>
                      </div>
                      {existingPatientData.email && (
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Email</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {existingPatientData.email}
                          </p>
                        </div>
                      )}
                      {existingPatientData.insurance_provider && (
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Insurance</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {existingPatientData.insurance_provider}
                          </p>
                        </div>
                      )}
                    </div>
                    {existingPatientData.address && (
                      <div className="mb-6 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Address</p>
                        <p className="text-sm text-gray-900 dark:text-white">{existingPatientData.address}</p>
                      </div>
                    )}
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                      onClick={handleContinueWithExistingPatient}
                    >
                      Continue to Appointment Booking
                    </Button>
                  </CardContent>
                </Card>
                {/* Existing appointments section remains the same */}
                <div className="mt-8">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Appointments</h4>
                  {loadingAppointments ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="animate-spin text-blue-600 h-8 w-8 mr-3" />
                      <p className="text-gray-600 dark:text-gray-400">Loading appointments...</p>
                    </div>
                  ) : patientAppointments.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                      <p className="text-gray-500 dark:text-gray-400">No appointments found.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {patientAppointments.map((apt) => {
                        const isDateFutureOrToday = (() => {
                          if (!apt.appointment_date) return false;
                          const aptDate = new Date(apt.appointment_date);
                          aptDate.setHours(0, 0, 0, 0);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return aptDate >= today;
                        })();

                        const getStatusColor = (status) => {
                          switch (status) {
                            case "confirmed": return "bg-green-100 text-green-800 border-green-200";
                            case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
                            case "cancelled": return "bg-red-100 text-red-800 border-red-200";
                            case "completed": return "bg-blue-100 text-blue-800 border-blue-200";
                            case "in-progress": return "bg-purple-100 text-purple-800 border-purple-200";
                            default: return "bg-gray-100 text-gray-800 border-gray-200";
                          }
                        };

                        return (
                          <div
                            key={apt.id}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(apt.status)}`}>
                                    {apt.status?.charAt(0).toUpperCase() + apt.status?.slice(1)}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {apt.appointment_code}
                                  </span>
                                </div>
                                <h5 className="font-semibold text-gray-900 dark:text-white mb-1">
                                  {apt.staff?.staff_name || "Unknown"}
                                </h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                  {formatDate(apt.appointment_date)} at {apt.appointment_time}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                  {apt.reason}
                                </p>
                              </div>
                              <div className="flex flex-col gap-2">
                                {isDateFutureOrToday && apt.status !== "cancelled" && apt.status !== "completed" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs"
                                      onClick={() => openRescheduleModal(apt)}
                                    >
                                      Reschedule
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs text-red-600 border-red-300 hover:bg-red-50"
                                      onClick={() => {
                                        setAppointmentToCancel(apt);
                                        setCancelModalOpen(true);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No patient record found. Please register to continue.
                </p>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                  onClick={() => setShowAddPatientDialog(true)}
                >
                  Register New Patient
                </Button>
              </div>
            )}
            <AddPatientDialog
              open={showAddPatientDialog}
              setOpen={setShowAddPatientDialog}
              onAdd={handleAddPatient}
            />
          </div>
        );
      default:
        // For steps 2 and beyond, use the new appointment flow
        return registeredPatient ? (
          <NewAppointmentFlow
            registeredPatient={registeredPatient}
            phone={phone}
          />
        ) : null;
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-start justify-center py-10 px-4 transition-colors duration-300">
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 z-50"
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <Sun className="h-5 w-5 text-yellow-500" />
        ) : (
          <Moon className="h-5 w-5 text-gray-700" />
        )}
      </button>

      <div className="w-full max-w-lg">
        <div className="inline-flex items-center gap-3 bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-lg mb-4">
          {hospitalInfo?.logo ? (
            <img src={hospitalInfo.logo} alt={hospitalInfo.name} className="h-6 w-6 object-contain" />
          ) : (
            <Stethoscope className="h-6 w-6" />
          )}
          <span className="text-sm font-semibold">{hospitalInfo?.name || "MedPortal"} — Patient Access</span>
        </div>

        <Card className="w-full shadow-2xl border-0 rounded-2xl dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 text-white">
            <CardTitle className="text-xl">Book an Appointment</CardTitle>
            <div className="mt-2">
              <div className="flex items-center gap-2 text-xs text-gray-200">
                <div
                  className={`h-2 rounded w-1/4 ${step >= 1 ? "bg-white" : "bg-gray-300"
                    }`}
                ></div>
                <div
                  className={`h-2 rounded w-1/4 ${step >= 2 ? "bg-white" : "bg-gray-300"
                    }`}
                ></div>
                <div
                  className={`h-2 rounded w-1/4 ${step >= 3 ? "bg-white" : "bg-gray-300"
                    }`}
                ></div>
                <div
                  className={`h-2 rounded w-1/4 ${step >= 4 ? "bg-white" : "bg-gray-300"
                    }`}
                ></div>
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-gray-200">
                <span>Verify</span>
                <span>Doctor</span>
                <span>Slot</span>
                <span>Details</span>
              </div>
            </div>
          </CardHeader>

          <CardContent>{renderStep()}</CardContent>
        </Card>
      </div>
    </div>
  );
}
