import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, XCircleIcon, ArrowLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import appointmentsAPI from "../api/AppointmentsAPI";
import staffAPI from "../api/StaffAPI";
import AddPatientDialog from "../Patients/AddPatient";
import patientsAPI from "../api/PatientsAPI";

export default function AppointmentForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { phone, isFirstTime: initialFirstTime } = location.state || {};

  // Hardcoded hospital
  const HOSPITAL_ID = "550e8400-e29b-41d4-a716-446655440001";

  // Step tracker
  const [step, setStep] = useState(1);

  // Patient flow states
  const [isFirstTime, setIsFirstTime] = useState(initialFirstTime ?? null);
  const [bookingForOther, setBookingForOther] = useState(null);
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

  const userId = "system_user";

  // Format date helper
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

  // Check patient existence
  useEffect(() => {
    const checkPatient = async () => {
      if (!phone) return;
      try {
        setCheckingPatient(true);
        const patient = await patientsAPI.getByPhoneAndHospital(phone, HOSPITAL_ID);
        if (patient && patient.id) {
          setExistingPatientData(patient);
          setShowPatientConfirmation(true);
        } else {
          setShowAddPatientDialog(true);
        }
      } catch (err) {
        toast.error("Could not check patient records");
      } finally {
        setCheckingPatient(false);
      }
    };
    checkPatient();
  }, [phone]);

  // Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!registeredPatient) return;
      try {
        setLoadingDoctors(true);
        const response = await staffAPI.getByHospital(HOSPITAL_ID, { limit: 50, offset: 0 });
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

  // Handle adding new patient
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

  // Continue with existing patient
  const handleContinueWithExistingPatient = () => {
    setRegisteredPatient(existingPatientData);
    setShowPatientConfirmation(false);
    toast.success(`Welcome back, ${existingPatientData.patient_name}`);
    setTimeout(() => setStep(2), 500);
  };

  // Handle date selection and fetch slots
  const handleSelectDate = async () => {
    if (!selectedDoctor || !selectedDate) return;
    try {
      setLoadingSlots(true);
      const response = await appointmentsAPI.getAvailableSlots(selectedDoctor.id, selectedDate);
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

  // Confirm appointment
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

  // Render icon for slot status
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

  // Handle back button click
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
              <div style={{ width: 40 }} /> {/* spacing for alignment */}
            </div>

            {checkingPatient ? (
              <Loader2 className="animate-spin mx-auto text-blue-500" />
            ) : showPatientConfirmation && existingPatientData ? (
              <Card className="bg-green-50 border-green-300">
                <CardContent>
                  <h3 className="font-semibold text-green-800 mb-2">Patient Info</h3>
                  <div className="space-y-1 text-gray-900">
                    <p><strong>Name:</strong> {existingPatientData.patient_name || "N/A"}</p>
                    <p><strong>Date of Birth:</strong> {formatDate(existingPatientData.dob)}</p>
                    <p><strong>Contact:</strong> {existingPatientData.contact_info || phone}</p>
                    <p><strong>Age:</strong> {existingPatientData.age || "N/A"}</p>
                    {existingPatientData.email && <p><strong>Email:</strong> {existingPatientData.email}</p>}
                    {existingPatientData.address && <p><strong>Address:</strong> {existingPatientData.address}</p>}
                    {existingPatientData.insurance_provider && <p><strong>Insurance:</strong> {existingPatientData.insurance_provider}</p>}
                  </div>
                  <Button
                    className="mt-4 w-full bg-green-600 hover:bg-green-700"
                    onClick={handleContinueWithExistingPatient}
                  >
                    Continue
                  </Button>
                </CardContent>
              </Card>
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
              doctors.map((doc) => (
                <Button
                  key={doc.id}
                  onClick={() => {
                    setSelectedDoctor(doc);
                    setStep(3);
                  }}
                  variant={selectedDoctor?.id === doc.id ? "default" : "outline"}
                  className="w-full flex justify-between"
                >
                  <span>{doc.staff_name}</span>
                  <span className="text-xs text-gray-500">{doc.department || "General"}</span>
                </Button>
              ))
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

            <Button onClick={handleSelectDate} disabled={!selectedDate || loadingSlots} className="w-full">
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
            <Button onClick={handleConfirm} disabled={loading || !reason.trim()} className="w-full">
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
    <div className="flex justify-center py-10 px-4 bg-gray-50 min-h-screen">
      <Card className="w-full max-w-lg p-6 shadow-lg">
        <CardContent>{renderStep()}</CardContent>
      </Card>
    </div>
  );
}
