  import { useState, useEffect } from "react";
  import { useNavigate, useLocation } from "react-router-dom";
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

  export default function AppointmentForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const { phone, isFirstTime: initialFirstTime } = location.state || {};

    const HOSPITAL_ID = "550e8400-e29b-41d4-a716-446655440001";

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
    const [appointmentType, setAppointmentType] = useState("consultation");
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingDoctors, setLoadingDoctors] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);

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
      setTimeout(() => setStep(2), 500);
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
        const response = await appointmentsAPI.getAvailableSlots(
          selectedDoctor.id,
          selectedDate
        );
        if (response.slots?.length) {
          setSlots(response.slots);
        } else {
          toast.error("No slots available");
          setSlots([]);
        }
      } catch {
        toast.error("Failed to fetch slots");
        setSlots([]);
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

    const fetchRescheduleSlots = async (staffId, date) => {
      if (!staffId || !date) return;
      setLoadingRescheduleSlots(true);
      try {
        const response = await appointmentsAPI.getAvailableSlots(staffId, date);
        setRescheduleSlots(response.slots || []);
      } catch {
        toast.error("Failed to fetch slots");
        setRescheduleSlots([]);
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

    // Regular appointment booking
    const handleConfirm = async () => {
      if (!reason.trim()) return toast.error("Enter reason for visit");
      if (!registeredPatient) return toast.error("Patient info missing");
      if (!selectedDoctor) return toast.error("Select a doctor");
      if (!selectedDate) return toast.error("Select a date");
      if (!selectedSlot) return toast.error("Select a time slot");

      try {
        setLoading(true);
        const payload = {
          hospital_id: HOSPITAL_ID,
          patient_id: registeredPatient.id,
          patientPhone: phone,
          staff_id: selectedDoctor.id,
          appointment_date: selectedDate,
          appointment_time: selectedSlot,
          reason: reason.trim(),
          appointment_type: appointmentType,
          status: "booked",
        };
        const created = await appointmentsAPI.create(payload);
        toast.success("Appointment booked successfully!");
        navigate("/confirmation", { state: { appointment: created } });
      } catch {
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

    const renderStep = () => {
      switch (step) {
        case 1:
          return (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  aria-label="Go Back"
                >
                  <ArrowLeft className="w-6 h-6" />
                </Button>
                <h2 className="text-xl font-semibold text-center flex-grow">
                  Patient Verification
                </h2>
                <div style={{ width: 40 }} />
              </div>
              {checkingPatient ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="animate-spin text-blue-600 h-10 w-10 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Verifying patient information...</p>
                </div>
              ) : showPatientConfirmation && existingPatientData ? (
                <>
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-600 rounded-lg">
                          <CheckCircleIcon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-green-900 dark:text-green-100">Patient Verified</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Full Name</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {existingPatientData.patient_name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Date of Birth</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {formatDate(existingPatientData.dob)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Contact</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {existingPatientData.contact_info || phone}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Age</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {existingPatientData.age || "N/A"} years
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

                          const canModify = 
                            apt.status !== "fulfilled" &&
                            apt.status !== "cancelled" &&
                            isDateFutureOrToday;

                          const statusColors = {
                            booked: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                            confirmed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                            fulfilled: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
                            cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                          };

                          return (
                            <div
                              key={apt.id}
                              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                      {formatDate(apt.appointment_date)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Time</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                      {apt.appointment_time || "-"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Doctor</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                      {apt.staff_name || "-"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                  <span
                                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                      statusColors[apt.status?.toLowerCase()] || statusColors.booked
                                    }`}
                                  >
                                    {apt.status || "Booked"}
                                  </span>
                                  {canModify && (
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        onClick={() => openRescheduleModal(apt)}
                                      >
                                        Reschedule
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => openCancelModal(apt)}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {cancelModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setCancelModalOpen(false)}
                      />
                      <div
                        className="relative z-50 w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 animate-in fade-in-0 zoom-in-95"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cancel-dialog-title"
                      >
                        <h3 id="cancel-dialog-title" className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          Cancel Appointment?
                        </h3>
                        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                          Please provide a reason for cancellation:
                        </p>
                        <Input
                          type="text"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          placeholder="Enter cancellation reason..."
                          disabled={cancelling}
                          className="mb-6 h-12"
                        />
                        <div className="flex justify-end gap-3">
                          <Button
                            variant="outline"
                            onClick={() => setCancelModalOpen(false)}
                            disabled={cancelling}
                            className="min-w-[100px]"
                          >
                            Close
                          </Button>
                          <Button
                            variant="destructive"
                            className="min-w-[130px]"
                            onClick={handleCancelConfirm}
                            disabled={cancelling || !cancelReason.trim()}
                          >
                            {cancelling ? (
                              <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Confirm Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  {rescheduleModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setRescheduleModalOpen(false)}
                      />
                      <div
                        className="relative z-50 w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-y-auto"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="reschedule-dialog-title"
                      >
                        <h3 id="reschedule-dialog-title" className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          Reschedule Appointment
                        </h3>
                        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                          Select a new date and time for your appointment
                        </p>
                        <div className="space-y-4 mb-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Select Date
                            </label>
                            <Input
                              type="date"
                              value={rescheduleDate}
                              min={new Date().toISOString().split("T")[0]}
                              onChange={async (e) => {
                                setRescheduleDate(e.target.value);
                                await fetchRescheduleSlots(
                                  appointmentToReschedule.staff_id,
                                  e.target.value
                                );
                                setRescheduleSlot("");
                              }}
                              className="h-12"
                            />
                          </div>
                          {loadingRescheduleSlots ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
                            </div>
                          ) : rescheduleSlots.length > 0 ? (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Available Time Slots
                              </label>
                              <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1">
                                {rescheduleSlots.map((slot, idx) => {
                                  const isSelected = rescheduleSlot === slot.time;
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      className={`w-full rounded-xl py-3 px-4 text-sm font-semibold outline-none border-2 transition-all duration-200 ${
                                        slot.status === "unavailable"
                                          ? "bg-gray-100 dark:bg-gray-700 text-gray-400 border-gray-200 dark:border-gray-600 cursor-not-allowed"
                                          : isSelected
                                          ? "bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300 shadow-lg scale-105"
                                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400"
                                      }`}
                                      disabled={slot.status === "unavailable"}
                                      onClick={() => setRescheduleSlot(slot.time)}
                                      title={
                                        slot.reason === "booked"
                                          ? "Already booked"
                                          : slot.reason === "past"
                                          ? "Time has passed"
                                          : ""
                                      }
                                    >
                                      {slot.display_time}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : rescheduleDate ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                              <p>No slots available for this date</p>
                            </div>
                          ) : null}
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <Button
                            variant="outline"
                            className="min-w-[100px]"
                            onClick={() => setRescheduleModalOpen(false)}
                            disabled={rescheduleLoading}
                          >
                            Close
                          </Button>
                          <Button
                            variant="default"
                            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
                            onClick={handleRescheduleConfirm}
                            disabled={rescheduleLoading || !rescheduleDate || !rescheduleSlot}
                          >
                            {rescheduleLoading ? (
                              <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
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
        case 2:
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Go Back">
                  <ArrowLeft className="w-6 h-6" />
                </Button>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Doctor</h2>
              </div>
              {loadingDoctors ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="animate-spin text-blue-600 h-10 w-10 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Loading doctors...</p>
                </div>
              ) : doctors.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <p className="text-gray-500 dark:text-gray-400">No doctors available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {doctors.map((doc) => (
                    <div
                      key={doc.id}
                      className={`border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 ${
                        selectedDoctor?.id === doc.id
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-[1.02]"
                          : "border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-md"
                      }`}
                      onClick={() => {
                        setSelectedDoctor(doc);
                        setStep(3);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                            {doc.staff_name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {doc.department || "General Medicine"}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={selectedDoctor?.id === doc.id ? "default" : "outline"}
                          className={selectedDoctor?.id === doc.id ? "bg-blue-600" : ""}
                        >
                          {selectedDoctor?.id === doc.id ? "Selected" : "Select"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        case 3:
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Go Back">
                  <ArrowLeft className="w-6 h-6" />
                </Button>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Date & Time</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Date
                  </label>
                  <Input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-12"
                  />
                </div>
                <Button
                  onClick={handleSelectDate}
                  disabled={!selectedDate || loadingSlots}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 font-semibold rounded-xl"
                >
                  {loadingSlots ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2 inline" />
                      Loading Available Slots...
                    </>
                  ) : (
                    "Load Available Slots"
                  )}
                </Button>
              </div>
              {slots.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Available Time Slots
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1">
                    {slots.map((slot, i) => (
                      <Button
                        key={i}
                        variant={selectedSlot === slot.time ? "default" : "outline"}
                        className={`h-auto py-4 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                          slot.status === "unavailable"
                            ? "cursor-not-allowed opacity-50 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                            : selectedSlot === slot.time
                            ? "bg-blue-600 text-white border-blue-700 shadow-lg scale-105"
                            : "hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400"
                        }`}
                        onClick={() => {
                          if (slot.status === "unavailable") return;
                          setSelectedSlot(slot.time);
                          setStep(4);
                        }}
                        disabled={slot.status === "unavailable"}
                        title={
                          slot.reason === "booked"
                            ? "Already booked"
                            : slot.reason === "past"
                            ? "Time has passed"
                            : ""
                        }
                      >
                        <span className="font-semibold">{slot.display_time}</span>
                        <div className="flex items-center gap-1">
                          {renderSlotIcon(slot.status)}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        case 4:
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Go Back">
                  <ArrowLeft className="w-6 h-6" />
                </Button>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Appointment Details</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Appointment Type
                  </label>
                  <select
                    className="w-full h-12 border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={appointmentType}
                    onChange={(e) => setAppointmentType(e.target.value)}
                  >
                    <option value="consultation">Consultation</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="emergency">Emergency</option>
                    <option value="vaccination">Vaccination</option>
                    <option value="checkup">Checkup</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason for Visit <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full h-32 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
                    placeholder="Please describe your reason for visit..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  {reason.trim().length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {reason.trim().length} characters
                    </p>
                  )}
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Appointment Summary</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Doctor:</span> {selectedDoctor?.staff_name}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Date:</span> {formatDate(selectedDate)}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Time:</span> {selectedSlot}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleConfirm}
                disabled={loading || !reason.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2 inline" />
                    Booking Appointment...
                  </>
                ) : (
                  "Confirm Appointment"
                )}
              </Button>
            </div>
          );
        default:
          return null;
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
            <Stethoscope className="h-6 w-6" />
            <span className="text-sm font-semibold">MedPortal — Patient Access</span>
          </div>
          <Card className="w-full shadow-2xl border-0 rounded-2xl dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 text-white">
              <CardTitle className="text-xl">Book an Appointment</CardTitle>
              <div className="mt-2">
                <div className="flex items-center gap-2 text-xs text-gray-200">
                  <div className={`h-2 rounded w-1/4 ${step >= 1 ? "bg-white" : "bg-gray-300"}`}></div>
                  <div className={`h-2 rounded w-1/4 ${step >= 2 ? "bg-white" : "bg-gray-300"}`}></div>
                  <div className={`h-2 rounded w-1/4 ${step >= 3 ? "bg-white" : "bg-gray-300"}`}></div>
                  <div className={`h-2 rounded w-1/4 ${step >= 4 ? "bg-white" : "bg-gray-300"}`}></div>
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
