import { useState } from "react";
import { useHospital } from "@/contexts/HospitalContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, CheckCircleIcon, XCircleIcon, Calendar, User, Clock, CheckCircle, Info } from "lucide-react";
import appointmentsAPI from "../api/appointmentsapi";
import hospitalsapi from "../api/hospitalsapi";
import staffApi from "../api/staffapi";
import toast from "react-hot-toast";

export default function NewAppointmentFlow({ registeredPatient, phone, onSuccess }) {
  const { hospitalInfo } = useHospital();
  const HOSPITAL_ID = hospitalInfo?.hospital_id;
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Form states
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slots, setSlots] = useState([]);
  const [doctorPreference, setDoctorPreference] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentType, setAppointmentType] = useState("consultation");
  const [reason, setReason] = useState("");

  // Loading states
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Helper for 12h format
  const to12Hour = (timeStr) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(':');
    const date = new Date();
    date.setHours(h);
    date.setMinutes(m);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  // Fetch Hospital Sessions for selected date
  const fetchSessions = async () => {
    if (!selectedDate) return;
    try {
      setLoadingSessions(true);
      setSelectedSession(null);
      setSessions([]);

      const timings = await hospitalsapi.getTimings(HOSPITAL_ID);
      const dateObj = new Date(selectedDate);
      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const dayName = days[dateObj.getDay()];
      const daySchedule = timings[dayName];

      if (!daySchedule || !daySchedule.active || !daySchedule.sessions?.length) {
        toast.error(`Hospital is closed on ${dayName}s`);
        return;
      }

      const isToday = new Date().toLocaleDateString('en-CA') === selectedDate; // en-CA gives YYYY-MM-DD
      const now = new Date();
      const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const mappedSessions = daySchedule.sessions
        .filter(s => {
          if (!isToday) return true;
          return s.end > currentTimeStr;
        })
        .map((s, idx) => {
          let label = "Session";
          const startH = parseInt(s.start.split(':')[0], 10);

          if (startH < 12) label = "Morning";
          else if (startH < 17) label = "Afternoon";
          else label = "Evening";

          return {
            id: idx,
            label: `${label} (${to12Hour(s.start)} - ${to12Hour(s.end)})`,
            start: s.start,
            end: s.end
          };
        });

      if (isToday && mappedSessions.length === 0) {
        toast.error("All sessions for today have ended. Please select a future date.");
      }

      setSessions(mappedSessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load hospital timings");
    } finally {
      setLoadingSessions(false);
    }
  };

  // Fetch Doctor List
  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const response = await staffApi.getByHospital(HOSPITAL_ID, { limit: 100 });
      // Filter active doctors only
      const activeDoctors = (response.data || []).filter(d => d.status?.toLowerCase() === "active" && !d.is_archived);
      setDoctors(activeDoctors);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast.error("Failed to load doctors");
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Fetch Slots for Selected Doctor in Session
  const fetchDoctorSlots = async (docId) => {
    if (!selectedDate || !selectedSession) return;
    try {
      setLoadingSlots(true);
      const response = await appointmentsAPI.getAvailableSlots(docId, selectedDate);
      // Handle both array response and object { slots: [] }
      const allSlots = Array.isArray(response) ? response : (response.slots || []);

      // Filter slots to be within selected session AND in the future if today
      const isToday = new Date().toLocaleDateString('en-CA') === selectedDate;
      const now = new Date();
      const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

      const filtered = allSlots.filter(slot => {
        const slotTime = slot.time; // "HH:MM:SS"
        const withinSession = slotTime >= selectedSession.start && slotTime <= selectedSession.end;
        if (!isToday) return withinSession;
        return withinSession && slotTime > currentTimeStr;
      });

      setSlots(filtered);
    } catch (error) {
      console.error("Error fetching doctor slots:", error);
      toast.error("Failed to load available slots");
    } finally {
      setLoadingSlots(false);
    }
  };

  // Fetch consolidated slots for "Any Doctor" in Session from backend
  const fetchConsolidatedSlots = async () => {
    if (!selectedSession || !selectedDate) return;
    try {
      setLoadingSlots(true);
      setSlots([]);
      const response = await appointmentsAPI.getConsolidatedAvailableSlots(
        HOSPITAL_ID,
        selectedDate,
        selectedSession.start,
        selectedSession.end
      );

      // en-CA gives YYYY-MM-DD
      const isToday = new Date().toLocaleDateString('en-CA') === selectedDate;
      const now = new Date();
      const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

      // Handle both array response and object { slots: [] }
      const allSlots = Array.isArray(response) ? response : (response.slots || []);
      const filtered = allSlots.filter(s => {
        if (!isToday) return true;
        return s.time > currentTimeStr;
      });

      setSlots(filtered);
    } catch (error) {
      console.error("Error fetching consolidated slots:", error);
      toast.error("Failed to load available slots");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBooking = async () => {
    if (!reason.trim()) return toast.error("Please enter a reason for visit");
    try {
      setSubmitting(true);
      const appointmentData = {
        hospital_id: HOSPITAL_ID,
        patient_id: registeredPatient.id,
        patientPhone: phone,
        appointment_date: selectedDate,
        appointment_time: selectedSlot,
        appointment_type: appointmentType,
        reason: reason.trim(),
        preferredDoctor: !!selectedDoctor,
        ...(selectedDoctor && { staff_id: selectedDoctor.id }),
        status: "pending",
      };

      const created = await appointmentsAPI.create(appointmentData);

      toast.success("Appointment booked successfully!");
      if (onSuccess) onSuccess(created);
      else navigate("/confirmation", { state: { appointment: created } });
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      if (onSuccess) onSuccess(null);
      else navigate(-1);
    } else {
      setStep(prev => prev - 1);
    }
  };

  // UI Components
  const ProgressHeader = () => {
    const totalSteps = doctorPreference === "yes" ? 5 : 4;
    const currentStep = step;
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4, 5].slice(0, totalSteps).map((s) => (
            <div key={s} className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStep >= s ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                {s}
              </div>
            </div>
          ))}
        </div>
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900">Choose Date & Time</h3>
              <p className="text-gray-500 text-sm">Select when you'd like to visit the hospital</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Appointment Date</label>
                <Input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSessions([]);
                  }}
                  className="h-12 border-gray-200 focus:ring-blue-500"
                />
              </div>
              <Button
                onClick={fetchSessions}
                disabled={!selectedDate || loadingSessions}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl"
              >
                {loadingSessions ? <Loader2 className="animate-spin" /> : "View Available Sessions"}
              </Button>

              {sessions.length > 0 && (
                <div className="space-y-3 pt-4 border-t animate-in slide-in-from-top-4 duration-300">
                  <label className="text-sm font-medium text-gray-700">Select Time Window</label>
                  <div className="grid grid-cols-1 gap-3">
                    {sessions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSelectedSession(s);
                          setStep(2);
                        }}
                        className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 hover:border-blue-400 hover:bg-blue-50 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-blue-500" />
                          <span className="font-semibold text-gray-900">{s.label}</span>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transform rotate-180" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900">Doctor Preference</h3>
              <p className="text-gray-500 text-sm">Would you like to choose a specific doctor?</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => {
                  setDoctorPreference("yes");
                  fetchDoctors();
                  setStep(3);
                }}
                className="p-6 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 text-left transition-all"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-bold text-gray-900">Yes, I want to choose</h4>
                <p className="text-sm text-gray-500">Pick from our available specialists</p>
              </button>
              <button
                onClick={() => {
                  setDoctorPreference("no");
                  setSelectedDoctor(null);
                  fetchConsolidatedSlots();
                  setStep(3);
                }}
                className="p-6 rounded-2xl border-2 border-gray-100 hover:border-green-500 hover:bg-green-50 text-left transition-all"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-bold text-gray-900">No preference</h4>
                <p className="text-sm text-gray-500">Book any available doctor for faster service</p>
              </button>
            </div>
            <Button variant="ghost" onClick={handleBack} className="w-full text-gray-500">Back</Button>
          </div>
        );

      case 3:
        if (doctorPreference === "yes") {
          return (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900">Select Doctor</h3>
                <p className="text-gray-500 text-sm">Choose from specialists available in the session</p>
              </div>
              {loadingDoctors ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div> : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {doctors.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setSelectedDoctor(doc);
                        fetchDoctorSlots(doc.id);
                        setStep(4);
                      }}
                      className="w-full p-4 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50 flex items-center gap-4 transition-all"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold">
                        {doc.staff_name.charAt(0)}
                      </div>
                      <div className="text-left flex-1">
                        <h4 className="font-bold text-gray-900">{doc.staff_name}</h4>
                        <p className="text-xs text-gray-500">{doc.department || "Specialist"}</p>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-gray-300 transform rotate-180" />
                    </button>
                  ))}
                </div>
              )}
              <Button variant="ghost" onClick={handleBack} className="w-full text-gray-500">Back</Button>
            </div>
          );
        } else {
          // "No Preference" Path: Show Consolidated Slots
          return (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900">Select Exact Time</h3>
                <p className="text-gray-500 text-sm">Real-time availability across all doctors</p>
              </div>
              {loadingSlots ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>
              ) : slots.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-2xl">
                  <Info className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No doctors are available for this session today. Please try another session.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {slots.map((slot, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedSlot(slot.time);
                        setStep(4);
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all ${selectedSlot === slot.time ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-100 hover:border-blue-300 shadow-sm"}`}
                    >
                      <span className="font-bold">{slot.display_time || to12Hour(slot.time)}</span>
                      {slot.doctors_available && (
                        <span className={`text-[9px] ${selectedSlot === slot.time ? "text-blue-100" : "text-blue-500"}`}>
                          {slot.doctors_available} {slot.doctors_available === 1 ? 'doc' : 'docs'} avail.
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              <Button variant="ghost" onClick={handleBack} className="w-full text-gray-500">Back</Button>
            </div>
          );
        }

      case 4:
        if (doctorPreference === "yes") {
          // Path: Specific Doctor -> Select Slot
          return (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900">Choose Available Time</h3>
                <p className="text-gray-500 text-sm">Viewing slots for Dr. {selectedDoctor?.staff_name}</p>
              </div>
              {loadingSlots ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div> : (
                <>
                  {slots.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed">
                      <Info className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">This doctor has no available slots in this session. Please try another session or doctor.</p>
                      <Button variant="outline" onClick={handleBack} className="mt-4">Go Back</Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {slots.map((slot, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedSlot(slot.time);
                            setStep(5);
                          }}
                          className={`p-3 rounded-xl border font-bold h-12 transition-all ${selectedSlot === slot.time ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-100 hover:border-blue-300"}`}
                        >
                          {slot.display_time || to12Hour(slot.time)}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
              <Button variant="ghost" onClick={handleBack} className="w-full text-gray-500">Back</Button>
            </div>
          );
        } else {
          // Path: No Preference -> Final Summary
          return (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900">Final Details</h3>
                <p className="text-gray-500 text-sm">Tell us why you're visiting today</p>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600 font-medium">Date</span>
                    <span className="text-blue-900 font-bold">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600 font-medium">Time</span>
                    <span className="text-blue-900 font-bold">{to12Hour(selectedSlot)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600 font-medium">Doctor</span>
                    <span className="text-blue-900 font-bold">Any Available</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason for Visit</label>
                  <Textarea
                    placeholder="Briefly describe your health concern..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="min-h-[120px] rounded-xl border-gray-200"
                  />
                </div>
                <Button
                  onClick={handleBooking}
                  disabled={submitting || !reason.trim()}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 transition-all"
                >
                  {submitting ? <Loader2 className="animate-spin" /> : "Confirm & Book Now"}
                </Button>
                <Button variant="ghost" onClick={handleBack} className="w-full text-gray-500 h-12">Back</Button>
              </div>
            </div>
          )
        }

      case 5:
        // Final Summary for "Specific Doctor" Path
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900">Confirm Booking</h3>
              <p className="text-gray-500 text-sm">Please verify your appointment details</p>
            </div>
            <div className="space-y-4">
              <div className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white space-y-4 shadow-xl">
                <div className="flex items-center gap-4 border-b border-white/20 pb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-xl">
                    {selectedDoctor?.staff_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Dr. {selectedDoctor?.staff_name}</h4>
                    <p className="text-xs text-blue-100">{selectedDoctor?.department || "Specialist"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase text-blue-200 font-bold">Date</p>
                    <p className="font-bold">{selectedDate}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-blue-200 font-bold">Time</p>
                    <p className="font-bold">{to12Hour(selectedSlot)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for Visit</label>
                <Textarea
                  placeholder="Briefly describe your health concern..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[120px] rounded-xl border-gray-200"
                />
              </div>
              <Button
                onClick={handleBooking}
                disabled={submitting || !reason.trim()}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all"
              >
                {submitting ? <Loader2 className="animate-spin" /> : "Secure Appointment"}
              </Button>
              <Button variant="ghost" onClick={handleBack} className="w-full text-gray-500 h-12">Back</Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <ProgressHeader />
      {renderStep()}
    </div>
  );
}