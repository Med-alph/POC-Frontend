import { useState } from "react";
import { useHospital } from "@/contexts/HospitalContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, CheckCircleIcon, XCircleIcon } from "lucide-react";
import appointmentsAPI from "../api/appointmentsapi";
import toast from "react-hot-toast";



export default function NewAppointmentFlow({ registeredPatient, phone, onSuccess }) {
  const { hospitalInfo } = useHospital();
  const HOSPITAL_ID = hospitalInfo?.hospital_id;
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Form states
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slots, setSlots] = useState([]);
  const [doctorPreference, setDoctorPreference] = useState("");
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentType, setAppointmentType] = useState("consultation");
  const [reason, setReason] = useState("");

  // Loading states
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch available time slots for selected date
  const fetchTimeSlots = async () => {
    if (!selectedDate) return;

    try {
      setLoadingSlots(true);

      // Generate standard time slots (this is a simplified approach)
      // In a real implementation, you'd call an API to get available slots across all doctors
      const generateTimeSlots = () => {
        const slots = [];
        const startHour = 9; // 9 AM
        const endHour = 17; // 5 PM

        for (let hour = startHour; hour < endHour; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
            const displayTime = `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;

            slots.push({
              time: time,
              display_time: displayTime,
              status: "available"
            });
          }
        }
        return slots;
      };

      const generatedSlots = generateTimeSlots();
      setSlots(generatedSlots);

    } catch (error) {
      console.error("Error fetching slots:", error);
      toast.error("Failed to fetch available slots");
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Fetch available doctors for selected date/time
  const fetchAvailableDoctors = async () => {
    if (!selectedDate || !selectedSlot) return;

    try {
      setLoadingDoctors(true);

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
      setLoadingDoctors(false);
    }
  };

  // Handle doctor preference selection (just store the preference)
  const handleDoctorPreferenceChange = (preference) => {
    setDoctorPreference(preference);
  };

  // Handle next step from preference (this is where API calls happen)
  const handlePreferenceNext = async () => {
    if (!doctorPreference) {
      toast.error("Please select a preference");
      return;
    }

    if (doctorPreference === "yes") {
      // Show doctor list - fetch available doctors
      await fetchAvailableDoctors();
      setStep(3); // Go to doctor selection step
    } else {
      // Skip to reason step for auto-booking
      setStep(4);
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

      // Call onSuccess callback if provided, otherwise navigate
      if (onSuccess) {
        onSuccess(created);
      } else {
        navigate("/confirmation", { state: { appointment: created } });
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error("Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  // Book appointment with selected doctor
  const handleBookWithDoctor = async () => {
    if (!selectedDate || !selectedSlot || !reason.trim() || !registeredPatient || !selectedDoctor) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      const appointmentData = {
        hospital_id: HOSPITAL_ID,
        patient_id: registeredPatient.id,
        patientPhone: phone,
        staff_id: selectedDoctor.id,
        appointment_date: selectedDate,
        appointment_time: selectedSlot,
        appointment_type: appointmentType,
        reason: reason.trim(),
        preferredDoctor: true,
        status: "pending",
      };

      const created = await appointmentsAPI.create(appointmentData);
      toast.success("Appointment booked successfully!");

      // Call onSuccess callback if provided, otherwise navigate
      if (onSuccess) {
        onSuccess(created);
      } else {
        navigate("/confirmation", { state: { appointment: created } });
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error("Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      // If onSuccess is provided, we're in patient dashboard, go back to appointments
      if (onSuccess) {
        // This is a bit of a hack, but we can call onSuccess with null to indicate going back
        onSuccess(null);
      } else {
        navigate(-1);
      }
    } else {
      setStep(step - 1);
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

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Select Date & Time</h3>
              <p className="text-gray-600 dark:text-gray-400">Choose your preferred appointment date and time</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Select Date</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="h-12 text-base"
                />
              </div>

              {selectedDate && (
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium"
                  onClick={fetchTimeSlots}
                  disabled={loadingSlots}
                >
                  {loadingSlots ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Loading Available Slots...
                    </>
                  ) : (
                    "Load Available Time Slots"
                  )}
                </Button>
              )}

              {slots.length > 0 && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Available Time Slots</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-2 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    {slots.map((slot, idx) => {
                      const isSelected = selectedSlot === slot.time;
                      const disabled = slot.status === "unavailable";
                      return (
                        <button
                          key={idx}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${isSelected
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-md"
                            : disabled
                              ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "border-gray-200 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:shadow-sm"
                            }`}
                          onClick={() => !disabled && setSelectedSlot(slot.time)}
                          disabled={disabled}
                        >
                          <div className="flex items-center justify-between">
                            <span>{slot.display_time || slot.time}</span>
                            {renderSlotIcon(slot.status)}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedSlot && (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-medium"
                      onClick={() => setStep(2)}
                    >
                      Continue to Doctor Preference
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Doctor Preference</h3>
              <p className="text-gray-600 dark:text-gray-400">Would you like to choose a specific doctor?</p>
            </div>

            <Card className="border-2 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-center">Do you have a preferred doctor?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all">
                    <input
                      type="radio"
                      name="doctorPreference"
                      value="yes"
                      checked={doctorPreference === "yes"}
                      onChange={(e) => handleDoctorPreferenceChange(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <span className="text-base font-medium text-gray-900 dark:text-white">Yes, I want to choose a doctor</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Select from available doctors for your time slot</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg border-2 border-gray-200 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all">
                    <input
                      type="radio"
                      name="doctorPreference"
                      value="no"
                      checked={doctorPreference === "no"}
                      onChange={(e) => handleDoctorPreferenceChange(e.target.value)}
                      className="w-4 h-4 text-green-600"
                    />
                    <div>
                      <span className="text-base font-medium text-gray-900 dark:text-white">No, book any available doctor</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">We'll assign the best available doctor for you</p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 h-12 text-base"
                onClick={() => setStep(1)}
              >
                Back to Date & Time
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium"
                onClick={handlePreferenceNext}
                disabled={!doctorPreference || loadingDoctors}
              >
                {loadingDoctors ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  "Next Step"
                )}
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Select Doctor</h3>
              <p className="text-gray-600 dark:text-gray-400">Choose your preferred doctor from available options</p>
            </div>

            {loadingDoctors ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="animate-spin text-blue-600 h-10 w-10 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading available doctors...</p>
              </div>
            ) : availableDoctors.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No doctors available for this time slot</p>
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Choose Different Time
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {availableDoctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className={`border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 ${selectedDoctor?.id === doctor.id
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-lg transform scale-[1.02]"
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    onClick={() => setSelectedDoctor(doctor)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {doctor.staff_name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{doctor.department}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Staff ID: {doctor.staff_code}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={selectedDoctor?.id === doctor.id ? "default" : "outline"}
                        className={selectedDoctor?.id === doctor.id ? "bg-blue-600 hover:bg-blue-700" : ""}
                      >
                        {selectedDoctor?.id === doctor.id ? "Selected" : "Select"}
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 h-12"
                    onClick={() => setStep(2)}
                  >
                    Back
                  </Button>
                  {selectedDoctor && (
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12"
                      onClick={() => setStep(4)}
                    >
                      Continue
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Appointment Details</h3>
              <p className="text-gray-600 dark:text-gray-400">Provide details about your visit</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Appointment Type</label>
                <select
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value)}
                  className="w-full h-12 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base"
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Reason for Visit</label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please describe your symptoms or reason for visit..."
                  className="min-h-[100px] text-base resize-none"
                />
              </div>

              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-blue-900 dark:text-blue-100">Appointment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Date:</span>
                    <span className="text-gray-900 dark:text-white">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Time:</span>
                    <span className="text-gray-900 dark:text-white">{slots.find(s => s.time === selectedSlot)?.display_time || selectedSlot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Doctor:</span>
                    <span className="text-gray-900 dark:text-white">{
                      selectedDoctor ? `${selectedDoctor.staff_name}` : "Any available doctor"
                    }</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                    <span className="text-gray-900 dark:text-white capitalize">{appointmentType}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 h-12"
                onClick={() => setStep(selectedDoctor ? 3 : 2)}
              >
                Back
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 text-base font-medium"
                onClick={selectedDoctor ? handleBookWithDoctor : handleBookAnyAvailable}
                disabled={loading || !reason.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Booking...
                  </>
                ) : (
                  "Book Appointment"
                )}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Progress Indicator */}
      <div className="mb-8">
        {/* Step circles and connecting lines */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-full max-w-md">
            {/* Circles row */}
            <div className="grid grid-cols-4 gap-2 relative mb-2">
              {[1, 2, 3, 4].map((stepNum, index) => (
                <div key={stepNum} className="flex justify-center relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= stepNum
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-500'
                    }`}>
                    {stepNum}
                  </div>
                </div>
              ))}

              {/* Connecting line background */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0" />

              {/* Progress line */}
              <div
                className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-300"
                style={{
                  width: step > 1 ? `${((step - 1) / 3) * 100}%` : '0%'
                }}
              />
            </div>

            {/* Labels row */}
            <div className="grid grid-cols-4 gap-2 text-xs font-medium">
              <div className={`text-center ${step === 1 ? 'text-blue-600' : 'text-gray-500'}`}>
                Date & Time
              </div>
              <div className={`text-center ${step === 2 ? 'text-blue-600' : 'text-gray-500'}`}>
                Preference
              </div>
              <div className={`text-center ${step === 3 ? 'text-blue-600' : 'text-gray-500'}`}>
                Doctor
              </div>
              <div className={`text-center ${step === 4 ? 'text-blue-600' : 'text-gray-500'}`}>
                Details
              </div>
            </div>
          </div>
        </div>
      </div>

      {renderStep()}
    </div>
  );
}