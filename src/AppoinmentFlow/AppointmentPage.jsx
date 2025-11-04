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

import { staffApi } from "@/api/StaffAPI";
import AddPatientDialog from "@/Patients/AddPatient";
import { patientsAPI } from "@/api/PatientsAPI";
import appointmentsAPI from "@/api/AppointmentsAPI";

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
              <Loader2 className="animate-spin mx-auto text-blue-500" />
            ) : showPatientConfirmation && existingPatientData ? (
              <>
                <Card className="bg-green-50 border-green-300">
                  <CardContent>
                    <h3 className="font-semibold text-green-800 mb-2">Patient Info</h3>
                    <div className="space-y-1 text-gray-900">
                      <p>
                        <strong>Name:</strong> {existingPatientData.patient_name || "N/A"}
                      </p>
                      <p>
                        <strong>Date of Birth:</strong> {formatDate(existingPatientData.dob)}
                      </p>
                      <p>
                        <strong>Contact:</strong> {existingPatientData.contact_info || phone}
                      </p>
                      <p>
                        <strong>Age:</strong> {existingPatientData.age || "N/A"}
                      </p>
                      {existingPatientData.email && (
                        <p><strong>Email:</strong> {existingPatientData.email}</p>
                      )}
                      {existingPatientData.address && (
                        <p><strong>Address:</strong> {existingPatientData.address}</p>
                      )}
                      {existingPatientData.insurance_provider && (
                        <p><strong>Insurance:</strong> {existingPatientData.insurance_provider}</p>
                      )}
                    </div>
                    <Button
                      className="mt-4 w-full bg-green-600 hover:bg-green-700"
                      onClick={handleContinueWithExistingPatient}
                    >
                      Continue
                    </Button>
                  </CardContent>
                </Card>
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-3">Your Appointments</h4>
                  {loadingAppointments ? (
                    <p>Loading appointments...</p>
                  ) : patientAppointments.length === 0 ? (
                    <p>No appointments found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse border border-gray-300 rounded">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-2">Date</th>
                            <th className="border border-gray-300 p-2">Time</th>
                            <th className="border border-gray-300 p-2">Doctor</th>
                            <th className="border border-gray-300 p-2">Status</th>
                            <th className="border border-gray-300 p-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patientAppointments.map((apt) => (
                            <tr key={apt.id} className="odd:bg-white even:bg-gray-50">
                              <td className="border border-gray-300 p-2">{formatDate(apt.appointment_date)}</td>
                              <td className="border border-gray-300 p-2">{apt.appointment_time || "-"}</td>
                              <td className="border border-gray-300 p-2">{apt.staff_name || "-"}</td>
                              <td className="border border-gray-300 p-2">{apt.status || "-"}</td>
                              <td className="border border-gray-300">
                                {apt.status !== "fulfilled" && apt.status !== "cancelled" ? (
                                  <div className="flex flex-col gap-2 items-start py-1">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="!bg-neutral-900 !text-white !rounded-lg !px-4 !py-1 !min-w-[110px]"
                                      onClick={() => openRescheduleModal(apt)}
                                    >
                                      Reschedule
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="!rounded-lg !px-4 !py-1 !min-w-[110px]"
                                      onClick={() => openCancelModal(apt)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : null}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                {cancelModalOpen && (
                  <div
                    style={{
                      position: "fixed",
                      top: "50%",
                      left: "50%",
                      zIndex: 9999,
                      width: "350px",
                      backgroundColor: "white",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.5rem",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.18)",
                      padding: "1.7rem 1.5rem",
                      transform: "translate(-50%, -50%)",
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="cancel-dialog-title"
                  >
                    <h3 id="cancel-dialog-title" className="text-lg font-semibold mb-4">
                      Cancel Appointment?
                    </h3>
                    <p className="mb-4 text-sm">Please provide a reason for cancellation:</p>
                    <Input
                      type="text"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Reason for cancellation"
                      disabled={cancelling}
                      className="mb-4"
                    />
                    <div className="flex justify-end space-x-3">
                      <Button
                        variant="ghost"
                        onClick={() => setCancelModalOpen(false)}
                        disabled={cancelling}
                      >
                        Close
                      </Button>
                      <Button
                        variant="destructive"
                        className="min-w-[90px]"
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
                )}
                {rescheduleModalOpen && (
                  <div
                    style={{
                      position: "fixed",
                      top: "50%",
                      left: "50%",
                      zIndex: 9999,
                      width: "350px",
                      backgroundColor: "white",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.5rem",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.18)",
                      padding: "1.7rem 1.5rem",
                      transform: "translate(-50%, -50%)",
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="reschedule-dialog-title"
                  >
                    <h3 id="reschedule-dialog-title" className="text-lg font-semibold mb-4">
                      Reschedule Appointment
                    </h3>
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
                      className="mb-4"
                    />
                    {loadingRescheduleSlots ? (
                      <Loader2 className="animate-spin text-blue-500 mb-4" />
                    ) : rescheduleSlots.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto mb-4">
                        {rescheduleSlots.map((slot, idx) => {
                          const isSelected = rescheduleSlot === slot.time;
                          return (
                            <button
                              key={idx}
                              type="button"
                              className={`w-full rounded-md py-2 px-2 text-sm font-medium outline-none border transition ${
                                slot.status === "unavailable"
                                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                  : isSelected
                                  ? "bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300"
                                  : "bg-white text-gray-900 border-gray-300 hover:bg-blue-50"
                              }`}
                              style={{
                                opacity: slot.status === "unavailable" ? 0.6 : 1,
                              }}
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
                    ) : (
                      <p>No slots available</p>
                    )}
                    <div className="flex justify-end space-x-3 mt-2">
                      <Button
                        variant="secondary"
                        className="min-w-[90px]"
                        onClick={() => setRescheduleModalOpen(false)}
                        disabled={rescheduleLoading}
                      >
                        Close
                      </Button>
                      <Button
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700 text-white min-w-[90px]"
                        onClick={handleRescheduleConfirm}
                        disabled={rescheduleLoading || !rescheduleDate || !rescheduleSlot}
                      >
                        {rescheduleLoading ? (
                          <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Button className="w-full" onClick={() => setShowAddPatientDialog(true)}>
                Register New Patient
              </Button>
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
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Go Back">
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h2 className="text-xl font-semibold">Select Doctor</h2>
            </div>
            {loadingDoctors ? (
              <Loader2 className="animate-spin mx-auto text-blue-500" />
            ) : doctors.length === 0 ? (
              <p className="text-center text-gray-500">No doctors available</p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {doctors.map((doc) => (
                  <div
                    key={doc.id}
                    className={`border rounded-md p-3 cursor-pointer transition-colors ${
                      selectedDoctor?.id === doc.id
                        ? "border-blue-600 bg-blue-50"
                        : "hover:border-blue-300"
                    }`}
                    onClick={() => {
                      setSelectedDoctor(doc);
                      setStep(3);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{doc.staff_name}</div>
                        <div className="text-xs text-gray-600">{doc.department || "General"}</div>
                      </div>
                      <Button
                        size="sm"
                        variant={selectedDoctor?.id === doc.id ? "default" : "outline"}
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
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Go Back">
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h2 className="text-xl font-semibold">Select Date & Time Slot</h2>
            </div>
            <Input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <Button
              onClick={handleSelectDate}
              disabled={!selectedDate || loadingSlots}
              className="w-full"
            >
              {loadingSlots ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                  Loading Slots...
                </>
              ) : (
                "Load Available Slots"
              )}
            </Button>
            {slots.length > 0 && (
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto mt-4">
                {slots.map((slot, i) => (
                  <Button
                    key={i}
                    variant={selectedSlot === slot.time ? "default" : "outline"}
                    className={`flex justify-between items-center ${
                      slot.status === "unavailable"
                        ? "cursor-not-allowed opacity-50 bg-red-50 border-red-300"
                        : "hover:bg-green-50 hover:border-green-300"
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
                    <span>{slot.display_time}</span>
                    <div className="flex items-center gap-1">
                      {renderSlotIcon(slot.status)}
                      {slot.reason === "past" && <span className="text-xs">(Past)</span>}
                      {slot.reason === "booked" && <span className="text-xs">(Booked)</span>}
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Go Back">
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h2 className="text-xl font-semibold">Appointment Details</h2>
            </div>
            <select
              className="w-full border p-2 rounded-md"
              value={appointmentType}
              onChange={(e) => setAppointmentType(e.target.value)}
            >
              <option value="consultation">Consultation</option>
              <option value="follow-up">Follow-up</option>
              <option value="emergency">Emergency</option>
              <option value="vaccination">Vaccination</option>
              <option value="checkup">Checkup</option>
            </select>
            <textarea
              className="w-full border p-2 rounded-md resize-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Please describe your reason for visit..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            {reason.trim().length > 0 && (
              <p className="text-xs text-gray-500">{reason.trim().length} characters</p>
            )}
            <Button
              onClick={handleConfirm}
              disabled={loading || !reason.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
