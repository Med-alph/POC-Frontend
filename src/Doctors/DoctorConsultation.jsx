import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { User, ClipboardList, Activity, Stethoscope, Pill, FlaskConical, Play, StopCircle, XCircle, Clock, Camera } from "lucide-react";
import appointmentsAPI from "../api/appointmentsapi";
import consultationsAPI from "../api/consultationsapi";
import imagesAPI from "../api/imagesapi";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import cancellationRequestAPI from "../api/cancellationrequestapi";
import UploadSessionModal from "../components/UploadSessionModal";
import MedicationAutocomplete from "../components/MedicationAutocomplete";
import VoiceTranscription from "../components/VoiceTranscription";
import { baseUrl } from "../constants/Constant";
import { getAuthToken } from "../utils/auth";

const DoctorConsultation = () => {
    const { appointmentId } = useParams();
    const user = useSelector((state) => state.auth.user);

    const [appointmentData, setAppointmentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isConsultationStarted, setIsConsultationStarted] = useState(false);
    const [consultationStartTime, setConsultationStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancellationReason, setCancellationReason] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    
    const [cancelRequested, setCancelRequested] = useState(false);
    
    // Image upload state
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadedSessions, setUploadedSessions] = useState([]);
    
    const [soapNotes, setSoapNotes] = useState({
        subjective: "",
        objective: "",
        assessment: "",
        plan: "",
    });

    const [prescriptions, setPrescriptions] = useState([
        { medicine_name: "", dosage: "", frequency: "", duration: "" },
    ]);

    const [labOrders, setLabOrders] = useState([
        { test_name: "", instructions: "" }
    ]);

    // AI SOAP generation state
    const [aiGenerationInProgress, setAiGenerationInProgress] = useState(false);
    const [aiDraftApplied, setAiDraftApplied] = useState(false);
    const [showReplaceConfirmModal, setShowReplaceConfirmModal] = useState(false);
    const [pendingAiDraft, setPendingAiDraft] = useState(null);

    // Voice transcription state
    const [isVoiceRecording, setIsVoiceRecording] = useState(false);
    const voiceTranscriptionRef = useRef(null);


    async function checkCancellationRequest() {
  try {
    // Call an API endpoint you must create:
    // Should return boolean or details if request exists
    const exists = await cancellationRequestAPI.hasRequestForAppointment(appointmentId, user.id);
    setCancelRequested(exists);
  } catch (err) {
    console.error("Error checking cancellation request", err);
  }
}


    useEffect(() => {
  const fetchAppointmentDetails = async () => {
    if (!appointmentId) {
      toast.error("No appointment ID provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await appointmentsAPI.getById(appointmentId);
      setAppointmentData(response);

      if (response.status === 'in-progress' && response.actual_start_time) {
        setIsConsultationStarted(true);
        setConsultationStartTime(new Date(response.actual_start_time));
      }

      // Check if a cancellation request exists for this appointment by this doctor
      const hasCancelRequest = await cancellationRequestAPI.hasRequestForAppointment(appointmentId, user.id);
      setCancelRequested(hasCancelRequest);

      toast.success("Appointment loaded successfully!");
    } catch (err) {
      console.error("Failed to fetch appointment details:", err);
      toast.error(`Failed to load: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  fetchAppointmentDetails();
}, [appointmentId, user?.id]);


    useEffect(() => {
        let interval;
        if (isConsultationStarted && consultationStartTime) {
            interval = setInterval(() => {
                const now = new Date();
                const elapsed = Math.floor((now - consultationStartTime) / 1000);
                setElapsedTime(elapsed);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isConsultationStarted, consultationStartTime]);

    const formatElapsedTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartConsultation = async () => {
        try {
            const startTime = new Date();
            await appointmentsAPI.update(appointmentId, {
                status: 'in-progress',
                actual_start_time: startTime.toISOString(),
            });
            setIsConsultationStarted(true);
            setConsultationStartTime(startTime);
            setAppointmentData(prev => ({
                ...prev,
                status: 'in-progress',
                actual_start_time: startTime.toISOString(),
            }));
            toast.success("Consultation started!");
        } catch (err) {
            console.error("Failed to start consultation:", err);
            toast.error("Failed to start consultation");
        }
    };

    const handleEndConsultation = async () => {
        if (!soapNotes.subjective && !soapNotes.objective && !soapNotes.assessment && !soapNotes.plan) {
            toast.error("Please fill in at least one SOAP note section");
            return;
        }

        try {
            setIsSaving(true);
            const endTime = new Date();
            const actualDuration = Math.floor((endTime - consultationStartTime) / 60000);

            const consultationData = {
                appointment_id: appointmentId,
                patient_id: appointmentData.patient_id,
                staff_id: user.id,
                hospital_id: appointmentData.hospital_id,
                subjective: soapNotes.subjective || null,
                objective: soapNotes.objective || null,
                assessment: soapNotes.assessment || null,
                plan: soapNotes.plan || null,
                consultation_start_time: consultationStartTime.toISOString(),
                consultation_end_time: endTime.toISOString(),
                prescriptions: prescriptions
                    .filter(p => p.medicine_name.trim() !== "")
                    .map(p => ({
                        medicine_name: p.medicine_name,
                        dosage: p.dosage,
                        frequency: p.frequency,
                        duration: p.duration,
                    })),
                lab_orders: labOrders
                    .filter(l => l.test_name.trim() !== "")
                    .map(l => ({
                        test_name: l.test_name,
                        instructions: l.instructions || null,
                    })),
            };

            await consultationsAPI.create(consultationData);

            await appointmentsAPI.update(appointmentId, {
                status: 'fulfilled',
                actual_end_time: endTime.toISOString(),
                actual_duration: actualDuration,
            });

            toast.success("Consultation completed and saved successfully!");
            setTimeout(() => {
                window.history.back();
            }, 2000);
        } catch (err) {
            console.error("Failed to save consultation:", err);
            toast.error(`Failed to save consultation: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelAppointment = async () => {
        if (!cancellationReason.trim()) {
            toast.error("Please provide a cancellation reason");
            return;
        }

        try {
            setIsSaving(true);

            await cancellationRequestAPI.createCancellationRequest({
                appointmentId,
                doctorId: user.id,
                reason: cancellationReason,
            });

            toast.success("Cancellation request sent to admin for approval!");
            setShowCancelModal(false);
            setCancellationReason("");
            setCancelRequested(true);

            // Navigate to doctor's cancellation requests page
            window.location.href = "/CancellationRequests";
        } catch (err) {
            console.error("Failed to create cancellation request:", err);
            toast.error("Failed to send cancellation request");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSoapChange = (field, value) => {
        setSoapNotes((prev) => ({ ...prev, [field]: value }));
        // Reset AI draft flag if doctor manually edits
        if (aiDraftApplied) {
            setAiDraftApplied(false);
        }
    };

    // Handle voice transcription completion - automatically generate SOAP
    const handleTranscriptionComplete = async () => {
        setIsVoiceRecording(false);
        // Small delay to ensure backend has processed the audio
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Automatically call generate SOAP API
        await handleGenerateAiSoap();
    };

    // Handle voice transcription errors
    const handleTranscriptionError = (error) => {
        setIsVoiceRecording(false);
        toast.error(`Voice transcription error: ${error}`);
    };

    // Toggle voice recording
    const handleToggleVoiceRecording = () => {
        if (voiceTranscriptionRef.current) {
            if (isVoiceRecording) {
                voiceTranscriptionRef.current.handleStopRecording();
            } else {
                voiceTranscriptionRef.current.handleStartRecording();
            }
        }
    };

    const handleGenerateAiSoap = async () => {
        try {
            setAiGenerationInProgress(true);

            // Make API call to generate SOAP from accumulated audio
            const token = getAuthToken();
            const response = await fetch(`${baseUrl}/consultation/appointment/${appointmentId}/generate-soap`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "AI SOAP generation failed");
            }

            const result = await response.json();

            // Check if fields already have content
            const hasExistingContent = soapNotes.subjective || 
                                      soapNotes.objective || 
                                      soapNotes.assessment || 
                                      soapNotes.plan;

            if (hasExistingContent) {
                // Store draft and show confirmation modal
                setPendingAiDraft({
                    subjective: result.subjective || result.S || "",
                    objective: result.objective || result.O || "",
                    assessment: result.assessment || result.A || "",
                    plan: result.plan || result.P || "",
                });
                setShowReplaceConfirmModal(true);
            } else {
                // Apply directly if no existing content
                setSoapNotes({
                    subjective: result.subjective || result.S || "",
                    objective: result.objective || result.O || "",
                    assessment: result.assessment || result.A || "",
                    plan: result.plan || result.P || "",
                });
                setAiDraftApplied(true);
            }
        } catch (err) {
            toast.error("AI SOAP generation failed. Please try again.");
        } finally {
            setAiGenerationInProgress(false);
        }
    };

    const handleConfirmReplace = () => {
        if (pendingAiDraft) {
            setSoapNotes(pendingAiDraft);
            setAiDraftApplied(true);
            setPendingAiDraft(null);
        }
        setShowReplaceConfirmModal(false);
    };

    const handleCancelReplace = () => {
        setPendingAiDraft(null);
        setShowReplaceConfirmModal(false);
    };

    const addPrescription = () =>
        setPrescriptions([...prescriptions, { medicine_name: "", dosage: "", frequency: "", duration: "" }]);

    const addLabOrder = () =>
        setLabOrders([...labOrders, { test_name: "", instructions: "" }]);

    const handleMedicationSelect = (index, medication) => {
        const updated = [...prescriptions];
        updated[index].medicine_name = medication.name;
        setPrescriptions(updated);
        
        // Show stock info to doctor
        if (!medication.is_available) {
            toast.error(`${medication.name} is currently out of stock`);
        } else if (medication.current_stock < 10) {
            toast.warning(`${medication.name} has low stock (${medication.current_stock} ${medication.unit} remaining)`);
        }
    };

    const calculateAge = (dob) => {
        if (!dob) return "N/A";
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const formatTime = (time) => {
        if (!time) return "N/A";
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'arrived':
                return "bg-green-100 text-green-700";
            case 'pending':
                return "bg-yellow-100 text-yellow-700";
            case 'in-progress':
                return "bg-blue-100 text-blue-700";
            case 'fulfilled':
            case 'completed':
                return "bg-green-100 text-green-700";
            case 'cancelled':
                return "bg-red-100 text-red-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600">Loading appointment details...</p>
                </div>
            </div>
        );
    }

    if (!appointmentData) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lg text-gray-600">Appointment not found</p>
                    <button 
                        onClick={() => window.history.back()}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const patient = {
        id: appointmentData.patient_id || "N/A",
        name: appointmentData.patient_name || appointmentData.patient?.patient_name || "Unknown Patient",
        age: appointmentData.patient?.age || calculateAge(appointmentData.patient?.dob),
        gender: appointmentData.patient?.gender || "N/A",
        dob: appointmentData.patient?.dob || "N/A",
        reason: appointmentData.reason || "N/A",
        appointmentType: appointmentData.appointment_type || "N/A",
        status: appointmentData.status || "N/A",
        appointmentTime: formatTime(appointmentData.appointment_time),
        appointmentDate: appointmentData.appointment_date,
        contact: appointmentData.patient?.contact_info || "N/A",
        email: appointmentData.patient?.email || "N/A",
        allergies: appointmentData.patient?.allergies?.split(',').filter(a => a.trim()) || [],
        medicalHistory: appointmentData.patient?.medical_history || null,
        insuranceProvider: appointmentData.patient?.insurance_provider || "N/A",
    };

    const canStartConsultation = ['pending', 'arrived'].includes(appointmentData.status?.toLowerCase());
    const canEndConsultation = appointmentData.status?.toLowerCase() === 'in-progress';
    const canCancelAppointment = !['fulfilled', 'completed', 'cancelled', 'in-progress'].includes(appointmentData.status?.toLowerCase());
    const isCompleted = ['fulfilled', 'completed'].includes(appointmentData.status?.toLowerCase());
    const isCancelled = appointmentData.status?.toLowerCase() === 'cancelled';

    return (
        <div className="min-h-screen bg-gray-50 p-6 space-y-6">
            {isConsultationStarted && !isCompleted && !isCancelled && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
                        <div>
                            <p className="text-sm font-semibold text-blue-900">Consultation in Progress</p>
                            <p className="text-xs text-blue-700">Started at {consultationStartTime?.toLocaleTimeString()}</p>
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                        {formatElapsedTime(elapsedTime)}
                    </div>
                </div>
            )}

            <div className="bg-white shadow rounded-lg p-6 border-l-4 border-blue-500">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                            <User className="h-6 w-6 text-blue-500" /> {patient.name}
                        </h1>
                        <p className="text-gray-600">
                            {patient.age} yrs / {patient.gender} | ID: {patient.id}
                        </p>
                        <p className="text-gray-500 mt-1">
                            <strong>DOB:</strong> {patient.dob}
                        </p>
                        <p className="text-gray-500">
                            <strong>Reason:</strong> {patient.reason}
                        </p>
                        <p className="text-gray-500">
                            <strong>Contact:</strong> {patient.contact}
                        </p>
                        {patient.email !== "N/A" && (
                            <p className="text-gray-500">
                                <strong>Email:</strong> {patient.email}
                            </p>
                        )}
                        <p className="text-gray-500">
                            <strong>Insurance:</strong> {patient.insuranceProvider}
                        </p>
                        <p className="text-gray-500">
                            <strong>Appointment:</strong> {patient.appointmentDate} at {patient.appointmentTime}
                        </p>
                    </div>

                    <div className="text-right">
                        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${getStatusColor(patient.status)}`}>
                            {patient.status}
                        </span>
                        <div className="mt-2 text-sm">
                            <p><strong>Type:</strong> {patient.appointmentType}</p>
                            <p><strong>Duration:</strong> {appointmentData.duration || 30} min</p>
                        </div>
                    </div>
                </div>
            </div>

            {!isCompleted && !isCancelled && (
                <div className="flex gap-3 justify-end">
                    {canStartConsultation && (
                        <button 
                            onClick={handleStartConsultation}
                            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                            <Play className="h-4 w-4" />
                            Start Consultation
                        </button>
                    )}

                    {isConsultationStarted && user?.id && (
                        <button 
                            onClick={handleToggleVoiceRecording}
                            className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                        >
                            {isVoiceRecording ? 'Stop AI Capture' : 'Start AI Capture'}
                        </button>
                    )}

                    {canCancelAppointment && !cancelRequested && (
                        <button 
                            onClick={() => setShowCancelModal(true)}
                            className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                            <XCircle className="h-4 w-4" />
                            Cancel Appointment
                        </button>
                    )}
                    {cancelRequested && (
                        <button 
                            disabled
                            className="flex items-center gap-2 px-6 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed"
                        >
                            <XCircle className="h-4 w-4" />
                            Cancellation Requested
                        </button>
                    )}
                </div>
            )}

            {/* Rest of your UI like Medical History, Allergies, SOAP Notes, Prescriptions, Lab Orders, Bottom Action Buttons... */}
{/* Medical History + Alerts */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white shadow rounded-lg p-5">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 mb-2">
                        <ClipboardList className="h-5 w-5 text-blue-500" /> Medical History
                    </h2>
                    {patient.medicalHistory ? (
                        <ul className="text-gray-600 list-disc list-inside">
                            {patient.medicalHistory.split(',').map((item, i) => (
                                <li key={i}>{item.trim()}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-sm">No medical history recorded</p>
                    )}
                </div>

                <div className="bg-white shadow rounded-lg p-5">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-red-600 mb-2">
                        <Activity className="h-5 w-5" /> Allergies & Alerts
                    </h2>
                    {patient.allergies.length > 0 ? (
                        <ul className="text-gray-600 list-disc list-inside">
                            {patient.allergies.map((allergy, i) => (
                                <li key={i} className="text-red-600 font-semibold">{allergy.trim()}</li>
                            ))}
                            <li className="text-red-700 font-bold mt-2">⚠️ Critical: Check before prescribing</li>
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-sm">No known allergies</p>
                    )}
                </div>
            </div>

            {/* Voice Transcription Section - Hidden UI, only controls */}
            {isConsultationStarted && !isCompleted && !isCancelled && user?.id && appointmentId && (
                <div style={{ display: 'none' }}>
                    <VoiceTranscription
                        ref={voiceTranscriptionRef}
                        userId={user.id}
                        appointmentId={appointmentId}
                        onTranscriptionComplete={handleTranscriptionComplete}
                        onError={handleTranscriptionError}
                        showTranscription={false}
                        onStartRecording={() => setIsVoiceRecording(true)}
                        onStopRecording={() => setIsVoiceRecording(false)}
                    />
                </div>
            )}

            {/* SOAP Notes Section */}
            <div className={`bg-white shadow rounded-lg p-5 ${!isConsultationStarted && !isCompleted ? 'opacity-60 pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                        <Stethoscope className="h-5 w-5 text-blue-500" /> Consultation Notes (SOAP)
                        {!isConsultationStarted && !isCompleted && (
                            <span className="text-xs text-gray-500 font-normal ml-2">(Start consultation to edit)</span>
                        )}
                    </h2>
                    {isConsultationStarted && !isCompleted && aiGenerationInProgress && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Generating AI draft…</span>
                        </div>
                    )}
                </div>

                {aiDraftApplied && (
                    <p className="text-sm text-gray-500 mb-3">AI-generated draft — please review and edit</p>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                    {["subjective", "objective", "assessment", "plan"].map((field) => (
                        <div key={field}>
                            <label className="block text-sm font-semibold text-gray-700 mb-1 capitalize">
                                {field}
                            </label>
                            <textarea
                                className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400"
                                rows={3}
                                value={soapNotes[field]}
                                onChange={(e) => handleSoapChange(field, e.target.value)}
                                placeholder={`Enter ${field} details...`}
                                disabled={!isConsultationStarted || isCompleted}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Image Upload Section */}
            <div className={`bg-white shadow rounded-lg p-5 ${!isConsultationStarted && !isCompleted ? 'opacity-60 pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                        <Camera className="h-5 w-5 text-blue-500" /> Patient Images
                        {!isConsultationStarted && !isCompleted && (
                            <span className="text-xs text-gray-500 font-normal ml-2">(Start consultation to upload)</span>
                        )}
                    </h2>
                    {isConsultationStarted && !isCompleted && (
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <Camera className="h-4 w-4" />
                            Upload Images
                        </button>
                    )}
                </div>
                
                {uploadedSessions.length > 0 ? (
                    <div className="space-y-2">
                        {uploadedSessions.map((session, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-md">
                                <Camera className="h-4 w-4 text-green-600" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                        {session.body_part} - {session.image_count} image{session.image_count > 1 ? 's' : ''} uploaded
                                    </p>
                                    {session.notes && (
                                        <p className="text-xs text-gray-600 mt-1">{session.notes}</p>
                                    )}
                                </div>
                                <span className="text-xs text-gray-500">
                                    {new Date(session.uploaded_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic">No images uploaded during this consultation</p>
                )}
            </div>

            {/* Prescription Section */}
            <div className={`bg-white shadow rounded-lg p-5 ${!isConsultationStarted && !isCompleted ? 'opacity-60 pointer-events-none' : ''}`}>
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 mb-3">
                    <Pill className="h-5 w-5 text-blue-500" /> Prescriptions
                </h2>

                {prescriptions.map((pres, index) => (
                    <div key={index} className="grid md:grid-cols-4 gap-3 mb-3">
                        <MedicationAutocomplete
                            placeholder="Search medications..."
                            value={pres.medicine_name}
                            onChange={(value) => {
                                const updated = [...prescriptions];
                                updated[index].medicine_name = value;
                                setPrescriptions(updated);
                            }}
                            onSelect={(medication) => handleMedicationSelect(index, medication)}
                            disabled={!isConsultationStarted || isCompleted}
                            className="w-full"
                        />
                        <input
                            type="text"
                            placeholder="Dosage (e.g., 500mg)"
                            className="border p-2 rounded-md text-sm"
                            value={pres.dosage}
                            onChange={(e) => {
                                const updated = [...prescriptions];
                                updated[index].dosage = e.target.value;
                                setPrescriptions(updated);
                            }}
                            disabled={!isConsultationStarted || isCompleted}
                        />
                        <input
                            type="text"
                            placeholder="Frequency (e.g., 2x daily)"
                            className="border p-2 rounded-md text-sm"
                            value={pres.frequency}
                            onChange={(e) => {
                                const updated = [...prescriptions];
                                updated[index].frequency = e.target.value;
                                setPrescriptions(updated);
                            }}
                            disabled={!isConsultationStarted || isCompleted}
                        />
                        <input
                            type="text"
                            placeholder="Duration (e.g., 7 days)"
                            className="border p-2 rounded-md text-sm"
                            value={pres.duration}
                            onChange={(e) => {
                                const updated = [...prescriptions];
                                updated[index].duration = e.target.value;
                                setPrescriptions(updated);
                            }}
                            disabled={!isConsultationStarted || isCompleted}
                        />
                    </div>
                ))}

                {!isCompleted && (
                    <button
                        onClick={addPrescription}
                        className="mt-2 text-blue-500 text-sm font-semibold hover:underline"
                        disabled={!isConsultationStarted}
                    >
                        + Add Prescription
                    </button>
                )}
            </div>

            {/* Lab Orders Section */}
            <div className={`bg-white shadow rounded-lg p-5 ${!isConsultationStarted && !isCompleted ? 'opacity-60 pointer-events-none' : ''}`}>
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 mb-3">
                    <FlaskConical className="h-5 w-5 text-blue-500" /> Lab / Scan Orders
                </h2>

                {labOrders.map((order, index) => (
                    <div key={index} className="grid md:grid-cols-2 gap-3 mb-3">
                        <input
                            type="text"
                            placeholder="Test / Scan Name"
                            className="border p-2 rounded-md text-sm"
                            value={order.test_name}
                            onChange={(e) => {
                                const updated = [...labOrders];
                                updated[index].test_name = e.target.value;
                                setLabOrders(updated);
                            }}
                            disabled={!isConsultationStarted || isCompleted}
                        />
                        <input
                            type="text"
                            placeholder="Instructions / Notes"
                            className="border p-2 rounded-md text-sm"
                            value={order.instructions}
                            onChange={(e) => {
                                const updated = [...labOrders];
                                updated[index].instructions = e.target.value;
                                setLabOrders(updated);
                            }}
                            disabled={!isConsultationStarted || isCompleted}
                        />
                    </div>
                ))}

                {!isCompleted && (
                    <button
                        onClick={addLabOrder}
                        className="mt-2 text-blue-500 text-sm font-semibold hover:underline"
                        disabled={!isConsultationStarted}
                    >
                        + Add Lab Order
                    </button>
                )}
            </div>

            {/* Bottom Action Buttons */}
            <div className="flex justify-end gap-3">
                <button 
                    className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
                    onClick={() => window.history.back()}
                    disabled={isSaving}
                >
                    {isCompleted || isCancelled ? 'Close' : 'Back'}
                </button>
                
                {canEndConsultation && (
                    <button 
                        onClick={handleEndConsultation}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <StopCircle className="h-4 w-4" />
                                End & Save Consultation
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Cancel Appointment Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
                        <h3 className="text-lg font-semibold mb-4">Cancel Appointment</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Please provide a reason for cancellation:
                        </p>
                        <textarea
                            className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-red-400 mb-4"
                            rows={4}
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            placeholder="Enter cancellation reason..."
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setCancellationReason("");
                                }}
                                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                                disabled={isSaving}
                            >
                                Close
                            </button>
                            <button
                                onClick={handleCancelAppointment}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                                ) : 'Request Admin Approval'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Replace SOAP Confirmation Modal */}
            {showReplaceConfirmModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
                        <h3 className="text-lg font-semibold mb-4">Replace current notes with AI draft?</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Your current SOAP notes will be replaced with the AI-generated draft. This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleCancelReplace}
                                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmReplace}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Replace
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Session Modal */}
            <UploadSessionModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                patientId={appointmentData?.patient_id}
                uploadedBy={{ id: user?.id, type: 'doctor' }}
                onSuccess={(result) => {
                    setUploadedSessions(prev => [...prev, {
                        body_part: result.body_part || 'Unknown',
                        image_count: result.image_urls?.length || 0,
                        notes: result.notes || '',
                        uploaded_at: new Date().toISOString()
                    }]);
                    toast.success('Images uploaded successfully!');
                }}
            />
        </div>
    );
};

export default DoctorConsultation;
