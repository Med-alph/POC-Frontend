import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, XCircleIcon, Building2, Loader2 } from "lucide-react";
import toast from 'react-hot-toast';

import appointmentsAPI from "../API/AppointmentsAPI";
import staffAPI from "../API/StaffAPI";
import hospitalsAPI from "../API/HospitalsAPI";
import AddPatientDialog from "../Patients/AddPatient";
import patientsAPI from "../API/PatientsAPI";

export default function AppointmentForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { phone, isFirstTime: initialFirstTime } = location.state || {};

  console.log('=== AppointmentForm Mounted ===');
  console.log('Phone from location:', phone);
  console.log('Initial isFirstTime:', initialFirstTime);

  // Hospital selection state
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [loadingHospitals, setLoadingHospitals] = useState(false);

  // Patient flow states
  const [isFirstTime, setIsFirstTime] = useState(initialFirstTime ?? null);
  const [bookingForOther, setBookingForOther] = useState(null);
  const [isExistingPatient, setIsExistingPatient] = useState(null);
  const [showAddPatientDialog, setShowAddPatientDialog] = useState(false);
  const [existingPatientData, setExistingPatientData] = useState(null);
  const [showPatientConfirmation, setShowPatientConfirmation] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState(null);
  const [checkingPatient, setCheckingPatient] = useState(false);

  // Appointment booking states
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [appointmentType, setAppointmentType] = useState("consultation");
  const [reason, setReason] = useState("");

  const userId = "system_user";

  // Fetch hospitals on component mount
  useEffect(() => {
    console.log('[Effect:FetchHospitals] Running');
    const fetchHospitals = async () => {
      try {
        setLoadingHospitals(true);
        const response = await hospitalsAPI.getAll();
        console.log("[Effect:FetchHospitals] Hospitals loaded:", response);
        
        const hospitalsList = Array.isArray(response) ? response : response.data || [];
        setHospitals(hospitalsList);
        
        if (hospitalsList.length === 0) {
          toast.error("No hospitals available");
        } else {
          console.log(`[Effect:FetchHospitals] Loaded ${hospitalsList.length} hospitals`);
        }
      } catch (err) {
        console.error("[Effect:FetchHospitals] Failed to fetch hospitals:", err);
        toast.error("Failed to load hospitals list");
      } finally {
        setLoadingHospitals(false);
      }
    };

    fetchHospitals();
  }, []);

  // Check if patient exists in selected hospital
  useEffect(() => {
    console.log('[Effect:CheckPatient] Running');
    console.log('[Effect:CheckPatient] Dependencies:', {
      selectedHospital: selectedHospital?.id,
      isFirstTime,
      bookingForOther,
      phone
    });

    const checkPatientInHospital = async () => {
      // Early exit conditions
      if (!selectedHospital) {
        console.log('[Effect:CheckPatient] No hospital selected - SKIP');
        return;
      }
      
      if (!phone) {
        console.log('[Effect:CheckPatient] No phone number - SKIP');
        return;
      }
      
      if (isFirstTime === null) {
        console.log('[Effect:CheckPatient] isFirstTime not answered yet - SKIP');
        return;
      }
      
      if (isFirstTime === true && bookingForOther === null) {
        console.log('[Effect:CheckPatient] bookingForOther not answered yet - SKIP');
        return;
      }

      // Determine if we should check for existing patient
      const shouldCheckForReturning = isFirstTime === false;
      const shouldCheckForFirstTimeSelf = isFirstTime === true && bookingForOther === false;
      const shouldOpenDialogDirectly = isFirstTime === true && bookingForOther === true;

      console.log('[Effect:CheckPatient] Conditions:', {
        shouldCheckForReturning,
        shouldCheckForFirstTimeSelf,
        shouldOpenDialogDirectly,
      });

      // If booking for someone else (first time), directly open dialog
      if (shouldOpenDialogDirectly) {
        console.log('[Effect:CheckPatient] Booking for someone else - opening registration dialog');
        setIsExistingPatient(false);
        setShowAddPatientDialog(true);
        return;
      }

      // Only check if it's returning patient OR first time self
      if (!shouldCheckForReturning && !shouldCheckForFirstTimeSelf) {
        console.log('[Effect:CheckPatient] No need to check patient - SKIP');
        return;
      }

      try {
        setCheckingPatient(true);
        console.log(`[Effect:CheckPatient] ===== STARTING CHECK =====`);
        console.log(`[Effect:CheckPatient] Phone: ${phone}`);
        console.log(`[Effect:CheckPatient] Hospital: ${selectedHospital.id} (${selectedHospital.name})`);
        
        const patientInHospital = await patientsAPI.getByPhoneAndHospital(
          phone,
          selectedHospital.id
        );
        
        console.log('[Effect:CheckPatient] ===== API RESPONSE =====');
        console.log('[Effect:CheckPatient] Response:', patientInHospital);
        console.log('[Effect:CheckPatient] Response type:', typeof patientInHospital);
        
        if (patientInHospital) {
          console.log('[Effect:CheckPatient] Response keys:', Object.keys(patientInHospital));
          console.log('[Effect:CheckPatient] Patient ID:', patientInHospital.id);
          console.log('[Effect:CheckPatient] Patient Name:', patientInHospital.patient_name);
        }
        
        // Check if patient exists (response is not null and has id)
        if (patientInHospital && patientInHospital.id) {
          // Patient exists in this hospital
          console.log("[Effect:CheckPatient] ✓ PATIENT FOUND");
          console.log("[Effect:CheckPatient] Name:", patientInHospital.patient_name);
          console.log("[Effect:CheckPatient] Contact:", patientInHospital.contact_info);
          console.log("[Effect:CheckPatient] Age:", patientInHospital.age);
          
          setExistingPatientData(patientInHospital);
          setIsExistingPatient(true);
          
          if (isFirstTime === false) {
            // Returning patient - auto-continue
            console.log('[Effect:CheckPatient] Returning patient - AUTO-CONTINUING');
            setRegisteredPatient(patientInHospital);
            toast.success(`Welcome back, ${patientInHospital.patient_name}!`);
          } else if (isFirstTime === true && bookingForOther === false) {
            // First time self - show confirmation
            console.log('[Effect:CheckPatient] First time self - SHOWING CONFIRMATION');
            setShowPatientConfirmation(true);
          }
        } else {
          // Patient doesn't exist in this hospital (null response)
          console.log("[Effect:CheckPatient] ✗ PATIENT NOT FOUND");
          setIsExistingPatient(false);
          setExistingPatientData(null);
          
          if (isFirstTime === false) {
            // They said returning but no record found
            console.log('[Effect:CheckPatient] No record for returning patient - RESET TO FIRST TIME');
            toast.error("No record found at this hospital. Please register as new patient.");
            setIsFirstTime(true);
            setBookingForOther(false);
            setShowAddPatientDialog(true);
          } else {
            // First time self - open registration dialog
            console.log('[Effect:CheckPatient] Opening registration dialog');
            setShowAddPatientDialog(true);
          }
        }
        
      } catch (err) {
        console.error("[Effect:CheckPatient] ✗ ERROR:", err);
        console.error("[Effect:CheckPatient] Error stack:", err.stack);
        
        setIsExistingPatient(false);
        setExistingPatientData(null);
        toast.error("Failed to check patient records. Please try again.");
        
      } finally {
        setCheckingPatient(false);
        console.log('[Effect:CheckPatient] ===== CHECK COMPLETE =====');
        console.log('[Effect:CheckPatient] Final State:', {
          isExistingPatient,
          hasExistingData: !!existingPatientData,
          hasRegisteredPatient: !!registeredPatient,
          showConfirmation: showPatientConfirmation,
          showDialog: showAddPatientDialog
        });
      }
    };

    checkPatientInHospital();
  }, [selectedHospital?.id, isFirstTime, bookingForOther, phone]);

  // Debug registered patient changes
  useEffect(() => {
    console.log('[Effect:RegisteredPatient] registeredPatient changed:', registeredPatient);
    if (registeredPatient) {
      console.log('[Effect:RegisteredPatient] ID:', registeredPatient.id);
      console.log('[Effect:RegisteredPatient] Name:', registeredPatient.patient_name);
      console.log('[Effect:RegisteredPatient] Contact:', registeredPatient.contact_info);
      console.log('[Effect:RegisteredPatient] Full Data:', JSON.stringify(registeredPatient, null, 2));
    }
  }, [registeredPatient]);

  // Fetch doctors when hospital and patient conditions are met
  useEffect(() => {
    console.log('[Effect:FetchDoctors] Running');
    console.log('[Effect:FetchDoctors] Can show doctor selection:', canShowDoctorSelection());
    
    const fetchDoctors = async () => {
      if (selectedHospital && canShowDoctorSelection() && doctors.length === 0) {
        try {
          setLoadingDoctors(true);
          console.log('[Effect:FetchDoctors] Fetching doctors for hospital:', selectedHospital.id);
          
          const response = await staffAPI.getByHospital(selectedHospital.id, {
            limit: 100,
            offset: 0
          });
          
          console.log("[Effect:FetchDoctors] Raw API response:", response.data);
          
          const activeDoctors = response.data.filter(
            staff => staff.status?.toLowerCase() === 'active' && !staff.is_archived
          );
          
          console.log("[Effect:FetchDoctors] Filtered active doctors:", activeDoctors.length);
          setDoctors(activeDoctors);
          
          if (activeDoctors.length === 0) {
            toast.error("No doctors available at this hospital");
          }
        } catch (err) {
          console.error("[Effect:FetchDoctors] Failed to fetch doctors:", err);
          toast.error("Failed to load doctors list");
        } finally {
          setLoadingDoctors(false);
        }
      } else {
        console.log('[Effect:FetchDoctors] Skipping - conditions not met');
      }
    };

    fetchDoctors();
  }, [selectedHospital, registeredPatient, doctors.length]);

  // Handle date selection and fetch available slots
  const handleSelectDate = async () => {
    if (selectedDoctor && selectedDate) {
      try {
        setLoadingSlots(true);
        console.log("[handleSelectDate] Fetching slots for:", selectedDoctor.id, selectedDate);
        
        const response = await appointmentsAPI.getAvailableSlots(
          selectedDoctor.id,
          selectedDate
        );
        
        console.log("[handleSelectDate] Available slots response:", response);
        
        if (response.slots && response.slots.length > 0) {
          setSlots(response.slots);
          toast.success(`Found ${response.slots.length} available slots`);
        } else {
          toast.error(response.message || "No slots available for this date");
          setSlots([]);
        }
      } catch (err) {
        console.error("[handleSelectDate] Failed to fetch slots:", err);
        toast.error("Failed to load available slots");
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
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

  const handleAddPatient = async (patientData) => {
    try {
      setLoading(true);
      console.log('[handleAddPatient] Creating new patient with data:', patientData);
      
      const newPatient = await patientsAPI.create({
        ...patientData,
        user_id: userId,
        hospital_id: selectedHospital.id,
        contact_info: phone,
      });
      
      console.log("[handleAddPatient] New patient created:", newPatient);
      console.log("[handleAddPatient] Setting registeredPatient to:", newPatient);
      
      setRegisteredPatient(newPatient);
      setShowAddPatientDialog(false);
      setIsExistingPatient(true);
      
      toast.success(`Patient registered successfully! Welcome, ${newPatient.patient_name}!`);
    } catch (err) {
      console.error("[handleAddPatient] Failed to register patient:", err);
      toast.error("Failed to register patient: " + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithExistingPatient = () => {
    console.log("[handleContinue] ===== CONTINUING WITH EXISTING PATIENT =====");
    console.log("[handleContinue] existingPatientData:", existingPatientData);
    
    if (!existingPatientData) {
      console.error("[handleContinue] ERROR: No existingPatientData!");
      toast.error("Patient data not available");
      return;
    }
    
    console.log("[handleContinue] Patient keys:", Object.keys(existingPatientData));
    console.log("[handleContinue] Patient name:", existingPatientData.patient_name);
    console.log("[handleContinue] Patient ID:", existingPatientData.id);
    
    // Create a clean copy
    const patientData = { ...existingPatientData };
    
    console.log("[handleContinue] Setting registeredPatient to:", patientData);
    
    setRegisteredPatient(patientData);
    setShowPatientConfirmation(false);
    
    toast.success(`Welcome back, ${patientData.patient_name}! You can now book an appointment.`);
    
    // Verify state was set
    setTimeout(() => {
      console.log("[handleContinue] After timeout - registeredPatient state:", registeredPatient);
    }, 100);
  };

  const handleConfirm = async () => {
    if (!reason.trim()) {
      toast.error("Please enter a reason for your visit");
      return;
    }

    if (!registeredPatient) {
      toast.error("Patient information is missing");
      return;
    }

    if (!selectedDoctor) {
      toast.error("Please select a doctor");
      return;
    }

    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    if (!selectedSlot) {
      toast.error("Please select a time slot");
      return;
    }

    setLoading(true);
    try {
      const appointmentPayload = {
        hospital_id: selectedHospital.id,
        patient_id: registeredPatient.id,
        patientPhone: phone,
        staff_id: selectedDoctor.id,
        appointment_date: selectedDate,
        appointment_time: selectedSlot,
        reason: reason.trim(),
        status: "booked",
        appointment_type: appointmentType,
      };

      console.log("[handleConfirm] Creating appointment with payload:", appointmentPayload);
      const created = await appointmentsAPI.create(appointmentPayload);
      
      toast.success("Appointment booked successfully!");
      navigate("/confirmation", { state: { appointment: created } });
    } catch (err) {
      console.error("[handleConfirm] Failed to create appointment:", err);
      toast.error("Failed to create appointment: " + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const canShowDoctorSelection = () => {
    const canShow = registeredPatient !== null;
    console.log('[canShowDoctorSelection]', canShow, 'registeredPatient:', registeredPatient?.patient_name);
    return canShow;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return "N/A";
    }
  };

  const handleHospitalSelection = (hospital) => {
    console.log('[handleHospitalSelection] ===== HOSPITAL SELECTED =====');
    console.log('[handleHospitalSelection] Hospital:', hospital.name, hospital.id);
    
    setSelectedHospital(hospital);
    
    // Reset ONLY doctor/appointment selections
    setSelectedDoctor(null);
    setDoctors([]);
    setSelectedDate("");
    setSlots([]);
    setSelectedSlot("");
    setReason("");
    
    // Reset patient data when changing hospital
    setRegisteredPatient(null);
    setExistingPatientData(null);
    setShowPatientConfirmation(false);
    setIsExistingPatient(null);
    
    console.log('[handleHospitalSelection] State reset complete');
    console.log('[handleHospitalSelection] isFirstTime:', isFirstTime);
    console.log('[handleHospitalSelection] bookingForOther:', bookingForOther);
  };

  const handleFirstTimeAnswer = (answer) => {
    console.log('[handleFirstTimeAnswer] Answer:', answer);
    setIsFirstTime(answer);
  };

  const handleBookingForAnswer = (answer) => {
    console.log('[handleBookingForAnswer] Answer:', answer);
    setBookingForOther(answer);
  };

  return (
    <div className="flex justify-center py-10 px-4 bg-gray-50 min-h-screen">
      <Card className="w-full max-w-lg p-6 shadow-lg space-y-6">
        <CardContent className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Book Appointment</h2>
          
          <div className="text-xs text-gray-500 text-center">
            Phone: {phone}
          </div>

          {/* Step 0: Hospital Selection */}
          <fieldset className="border p-4 rounded-md space-y-3">
            <legend className="font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              Select Hospital
            </legend>
            
            {loadingHospitals ? (
              <div className="text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" />
                <p className="text-gray-500 mt-2">Loading hospitals...</p>
              </div>
            ) : hospitals.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">No hospitals available</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {hospitals.map((hospital) => (
                    <div
                      key={hospital.id}
                      onClick={() => handleHospitalSelection(hospital)}
                      className={`
                        p-3 rounded-lg border-2 cursor-pointer transition-all
                        ${selectedHospital?.id === hospital.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-base">
                            {hospital.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            📍 {hospital.address}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <p className="text-xs text-gray-500">
                              📞 {hospital.contact_number}
                            </p>
                            {hospital.email && (
                              <p className="text-xs text-gray-500">
                                ✉️ {hospital.email}
                              </p>
                            )}
                          </div>
                        </div>
                        {selectedHospital?.id === hospital.id && (
                          <div className="ml-2">
                            <CheckCircleIcon className="h-6 w-6 text-blue-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedHospital && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800 text-center">
                      ✓ Selected: <strong>{selectedHospital.name}</strong>
                    </p>
                  </div>
                )}
              </>
            )}
          </fieldset>

          {/* Only show remaining steps if hospital is selected */}
          {selectedHospital && (
            <>
              {/* Step 1: First-time check */}
              {isFirstTime === null && (
                <fieldset className="border p-4 rounded-md space-y-2">
                  <legend className="font-semibold">First-time Visit to {selectedHospital.name}?</legend>
                  <div className="flex gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => handleFirstTimeAnswer(true)}
                      className="flex-1"
                    >
                      Yes (First Time)
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleFirstTimeAnswer(false)}
                      className="flex-1"
                    >
                      No (Returning)
                    </Button>
                  </div>
                </fieldset>
              )}

              {/* Step 2: Booking for self or others */}
              {isFirstTime === true && bookingForOther === null && (
                <fieldset className="border p-4 rounded-md space-y-2">
                  <legend className="font-semibold">Booking For?</legend>
                  <div className="flex gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => handleBookingForAnswer(false)}
                      className="flex-1"
                    >
                      Self
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleBookingForAnswer(true)}
                      className="flex-1"
                    >
                      Someone Else
                    </Button>
                  </div>
                </fieldset>
              )}

              {/* Registration Dialog */}
              <AddPatientDialog
                open={showAddPatientDialog}
                setOpen={setShowAddPatientDialog}
                onAdd={handleAddPatient}
              />

              {/* Show checking patient message */}
              {checkingPatient && (
                <div className="border p-4 rounded-md bg-blue-50 border-blue-200">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <p className="text-blue-700">Checking patient records...</p>
                  </div>
                </div>
              )}

              {/* Show existing patient details with confirmation */}
              {showPatientConfirmation && existingPatientData && !registeredPatient && (
                <fieldset className="border-2 p-4 rounded-md space-y-4 bg-green-50 border-green-300">
                  <legend className="font-semibold text-green-800 px-2">
                    ✓ Patient Record Found
                  </legend>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Name:</p>
                        <p className="text-base font-semibold text-gray-900">
                          {existingPatientData.patient_name || "N/A"}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-600">Date of Birth:</p>
                        <p className="text-base text-gray-900">
                          {formatDate(existingPatientData.dob)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Contact:</p>
                        <p className="text-base text-gray-900">
                          {existingPatientData.contact_info || phone}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-600">Age:</p>
                        <p className="text-base text-gray-900">
                          {existingPatientData.age || "N/A"}
                        </p>
                      </div>
                    </div>

                    {existingPatientData.email && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Email:</p>
                        <p className="text-base text-gray-900">{existingPatientData.email}</p>
                      </div>
                    )}

                    {existingPatientData.address && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Address:</p>
                        <p className="text-base text-gray-900">{existingPatientData.address}</p>
                      </div>
                    )}

                    {existingPatientData.insurance_provider && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Insurance:</p>
                          <p className="text-base text-gray-900">{existingPatientData.insurance_provider}</p>
                        </div>
                        {existingPatientData.blood_type && (
                          <div>
                            <p className="text-sm font-medium text-gray-600">Blood Type:</p>
                            <p className="text-base text-gray-900">{existingPatientData.blood_type}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Button 
                    className="w-full mt-4 bg-green-600 hover:bg-green-700" 
                    onClick={handleContinueWithExistingPatient}
                  >
                    Continue with this Patient
                  </Button>
                </fieldset>
              )}

              {/* Show patient summary after confirmation */}
              {registeredPatient && (
                <div className="border-2 p-4 rounded-md bg-green-50 border-green-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-800 mb-2">
                        📋 Booking Details
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-600 min-w-[80px]">Patient:</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {registeredPatient.patient_name || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-600 min-w-[80px]">Contact:</span>
                          <span className="text-sm text-gray-700">
                            {registeredPatient.contact_info || phone}
                          </span>
                        </div>
                        {registeredPatient.age && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600 min-w-[80px]">Age:</span>
                            <span className="text-sm text-gray-700">
                              {registeredPatient.age} years
                            </span>
                          </div>
                        )}
                        {registeredPatient.dob && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600 min-w-[80px]">DOB:</span>
                            <span className="text-sm text-gray-700">
                              {formatDate(registeredPatient.dob)}
                            </span>
                          </div>
                        )}
                        {registeredPatient.insurance_provider && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600 min-w-[80px]">Insurance:</span>
                            <span className="text-sm text-gray-700">
                              {registeredPatient.insurance_provider}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Doctor selection */}
              {canShowDoctorSelection() && (
                <fieldset className="border p-4 rounded-md space-y-2">
                  <legend className="font-semibold">Select Doctor</legend>
                  
                  {loadingDoctors ? (
                    <div className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" />
                      <p className="text-gray-500 mt-2">Loading doctors...</p>
                    </div>
                  ) : doctors.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No doctors available</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {doctors.map((doc) => (
                          <Button
                            key={doc.id}
                            variant={selectedDoctor?.id === doc.id ? "default" : "outline"}
                            className="w-full text-left flex justify-between"
                            onClick={() => {
                              setSelectedDoctor(doc);
                              setSelectedDate("");
                              setSlots([]);
                              setSelectedSlot("");
                            }}
                          >
                            <span>{doc.staff_name}</span>
                            <span className="text-xs text-gray-500">
                              {doc.department || "General"}
                            </span>
                          </Button>
                        ))}
                      </div>
                      {selectedDoctor && (
                        <p className="text-green-700 text-center mt-2 font-medium">
                          ✓ Selected: Dr. {selectedDoctor.staff_name}
                        </p>
                      )}
                    </>
                  )}
                </fieldset>
              )}

              {/* Step 4: Date selection */}
              {selectedDoctor && (
                <fieldset className="border p-4 rounded-md space-y-2">
                  <legend className="font-semibold">Select Date</legend>
                  <Input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full"
                  />
                  <Button 
                    className="mt-2 w-full" 
                    onClick={handleSelectDate} 
                    disabled={!selectedDate || loadingSlots}
                  >
                    {loadingSlots ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading Slots...
                      </>
                    ) : (
                      "Load Available Slots"
                    )}
                  </Button>
                </fieldset>
              )}

              {/* Step 5: Time slot selection */}
              {slots.length > 0 && (
                <fieldset className="border p-4 rounded-md space-y-2">
                  <legend className="font-semibold">Select Time Slot</legend>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
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
                        }}
                        disabled={slot.status === "unavailable"}
                        title={
                          slot.reason === 'booked' 
                            ? 'Already booked' 
                            : slot.reason === 'past' 
                            ? 'Time has passed' 
                            : ''
                        }
                      >
                        <span>{slot.display_time}</span>
                        <div className="flex items-center gap-1">
                          {renderSlotIcon(slot.status)}
                          {slot.reason === 'past' && <span className="text-xs">(Past)</span>}
                          {slot.reason === 'booked' && <span className="text-xs">(Booked)</span>}
                        </div>
                      </Button>
                    ))}
                  </div>
                  {selectedSlot && (
                    <p className="text-green-700 text-center mt-2 font-medium">
                      ✓ Selected: {selectedSlot}
                    </p>
                  )}
                </fieldset>
              )}

              {/* Step 6: Appointment Details */}
              {selectedSlot && (
                <fieldset className="border p-4 rounded-md space-y-4">
                  <legend className="font-semibold">Appointment Details</legend>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Appointment Type</label>
                    <select
                      className="w-full p-2 border rounded-md"
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Reason for Visit <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="w-full p-2 border rounded-md resize-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Please describe your reason for visit..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    {reason.trim().length > 0 && (
                      <p className="text-xs text-gray-500">
                        {reason.trim().length} characters
                      </p>
                    )}
                  </div>
                </fieldset>
              )}

              {/* Step 7: Confirm appointment */}
              {selectedSlot && (
                <Button 
                  className="w-full mt-4" 
                  onClick={handleConfirm} 
                  disabled={loading || !reason.trim()}
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
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
