import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { 
    User as UserIcon, 
    ClipboardList, 
    Activity, 
    Stethoscope, 
    Pill, 
    FlaskConical, 
    Play, 
    StopCircle, 
    XCircle, 
    Clock, 
    Camera, 
    Sparkles, 
    Check, 
    X,
    PlusCircle, 
    Trash2, 
    Calendar, 
    Clock as ClockIcon, 
    CalendarCheck, 
    ShieldCheck, 
    AlertTriangle, 
    AlertCircle as AlertCircleIcon, 
    Info, 
    CheckCircle2, 
    Loader2, 
    ChevronDown 
} from "lucide-react";
import appointmentsAPI from "../api/appointmentsapi";
import consultationsAPI from "../api/consultationsapi";
import imagesAPI from "../api/imagesapi";
import prescriptionSafetyAPI from "../api/prescriptionSafetyAPI";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import cancellationRequestAPI from "../api/cancellationrequestapi";
import UploadSessionModal from "../components/UploadSessionModal";
import MedicationAutocomplete from "../components/MedicationAutocomplete";
import VoiceTranscription from "../components/VoiceTranscription";
import proceduresAPI from "../api/proceduresapi";
import ProcedureAutocomplete from "../components/ProcedureAutocomplete";
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

    const [procedures, setProcedures] = useState([
        { procedure_id: null, procedure_name: "", price: 0, clinical_notes: "", category: "" }
    ]);

    // AI SOAP generation state
    const [aiGenerationInProgress, setAiGenerationInProgress] = useState(false);
    const [aiDraftApplied, setAiDraftApplied] = useState(false);
    const [showReplaceConfirmModal, setShowReplaceConfirmModal] = useState(false);
    const [pendingAiDraft, setPendingAiDraft] = useState(null);

    // Voice transcription state
    const [isVoiceRecording, setIsVoiceRecording] = useState(false);
    const voiceTranscriptionRef = useRef(null);

    // Follow-up state
    const [isFollowUpRequired, setIsFollowUpRequired] = useState(false);
    const [followUpDate, setFollowUpDate] = useState("");
    const [followUpNote, setFollowUpNote] = useState("");
    const [followUpSlot, setFollowUpSlot] = useState("");
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // AI Prescription Safety State
    const [safetyReport, setSafetyReport] = useState(null);
    const [isCheckingSafety, setIsCheckingSafety] = useState(false);



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
        window.scrollTo(0, 0);
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
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error("Failed to start consultation:", err);
            toast.error("Failed to start consultation");
        }
    };

    const handleQuickDate = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        setFollowUpDate(date.toISOString().split("T")[0]);
    };

    useEffect(() => {
        const fetchSlots = async () => {
            if (!followUpDate || !appointmentData?.staff_id) return;

            try {
                setLoadingSlots(true);
                const response = await appointmentsAPI.getAvailableSlots(
                    appointmentData.staff_id,
                    followUpDate
                );

                const slots = Array.isArray(response) ? response : (response.slots || []);
                setAvailableSlots(slots);

                if (response.on_leave) {
                    toast(`Doctor is on ${response.leave_type || ''} leave on this date`, { icon: '⚠️' });
                }
            } catch (error) {
                console.error("Error fetching slots:", error);
                toast.error("Failed to fetch slots");
                setAvailableSlots([]);
            } finally {
                setLoadingSlots(false);
            }
        };

        if (isFollowUpRequired && followUpDate) {
            fetchSlots();
        }
    }, [followUpDate, isFollowUpRequired, appointmentData?.staff_id]);

    const handleEndConsultation = async () => {
        const validPrescriptions = prescriptions.filter(p => p.medicine_name.trim() !== "");

        if (!soapNotes.subjective && !soapNotes.objective && !soapNotes.assessment && !soapNotes.plan) {
            toast.error("Please fill in at least one SOAP note section");
            return;
        }

        // Enforce AI Safety Check for prescriptions
        if (validPrescriptions.length > 0 && !safetyReport) {
            toast.error("AI Safety Scan Required: Please scan your prescriptions for allergies and conflicts before finalizing.");
            // Scroll to the button
            const safetyBtn = document.getElementById("ai-safety-scan-btn");
            if (safetyBtn) {
                safetyBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Optional: add a temporary highlight
                safetyBtn.classList.add("ring-4", "ring-indigo-300");
                setTimeout(() => safetyBtn.classList.remove("ring-4", "ring-indigo-300"), 3000);
            }
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
                procedures: procedures
                    .filter(p => p.procedure_id)
                    .map(p => ({
                        procedure_id: p.procedure_id,
                        actual_price_charged: Number(p.price) || 0,
                        doctor_notes: p.clinical_notes || null,
                    })),
                is_follow_up_required: isFollowUpRequired,
                follow_up: isFollowUpRequired ? {
                    appointment_date: followUpDate || null,
                    appointment_time: followUpSlot || null,
                    reason: followUpNote || "Follow-up visit",
                    root_visit_id: appointmentData.root_visit_id || appointmentId,
                    visit_category: "Follow-up"
                } : null
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
    const handleTranscriptionComplete = async (fullText) => {
        setIsVoiceRecording(false);

        if (!fullText || !fullText.trim()) {
            console.warn("Transcription session ended with no text.");
            return;
        }

        console.log("Captured transcription for SOAP:", fullText);
        // Small delay to ensure any pending state updates are finished
        await new Promise(resolve => setTimeout(resolve, 500));
        await handleGenerateAiSoap(fullText);
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

    const handleGenerateAiSoap = async (transcriptionText) => {
        try {
            setAiGenerationInProgress(true);

            console.log("Sending transcription to Generate SOAP API:", {
                length: transcriptionText.length,
                preview: transcriptionText.substring(0, 100) + "..."
            });

            // Make API call to generate SOAP from accurately captured text
            const token = getAuthToken();
            const response = await fetch(`${baseUrl}/consultation/appointment/${appointmentId}/generate-soap`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({
                    transcription: transcriptionText
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 400) {
                    throw new Error("The backend has no cached transcript. Ensure the recording was captures and the transcription text is being sent correctly.");
                }
                throw new Error(errorData.message || "AI SOAP generation failed");
            }

            const result = await response.json();
            console.log("AI SOAP Result:", result);

            // Corrected Mapping based on your API response structure
            const aiDraft = {
                subjective: result.soap_notes?.S || result.subjective || "",
                objective: result.soap_notes?.O || result.objective || "",
                assessment: result.soap_notes?.A || result.assessment || "",
                plan: result.soap_notes?.P || result.plan || "",
            };

            // Store the draft for interactive review
            setPendingAiDraft(aiDraft);
            setAiDraftApplied(true);
            toast.success("AI clinical draft ready for review!");
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

    const handleCheckPrescriptionSafety = async () => {
        const validPrescriptions = prescriptions.filter(p => p.medicine_name.trim() !== "");
        
        if (validPrescriptions.length === 0) {
            toast.error("Please add at least one medication to check safety");
            return;
        }

        try {
            setIsCheckingSafety(true);
            const patientId = appointmentData?.patient_id || patient?.id;
            
            if (!patientId || patientId === "N/A") {
                toast.error("Patient identification missing. Cannot run safety check. 🔍");
                return;
            }

            const report = await prescriptionSafetyAPI.checkSafety(patientId, validPrescriptions);
            
            if (!report || !report.status) {
                throw new Error("AI returned an incomplete safety report.");
            }

            setSafetyReport(report);
            const status = report.status.toLowerCase();
            
            if (status === 'safe') {
                toast.success("AI Safety Scan: All Clear! 🛡️", {
                    duration: 4000
                });
            } else if (status === 'high risk' || status === 'high-risk') {
                toast.error("CRITICAL: AI detected severe safety risks!", {
                    duration: 6000
                });
            } else if (status === 'caution' || status === 'warning') {
                toast("AI Safety Scan: Potential risks found. ⚠️", {
                    duration: 5000,
                    icon: '⚠️'
                });
            } else {
                toast(`AI Scan Complete: ${report.status} status 🔍`);
            }
        } catch (err) {
            console.error("Prescription safety check failed:", err);
            toast.error(
                <div className="flex flex-col gap-1">
                    <span className="font-bold">Clinical AI Scan Interrupted 🛰️</span>
                    <span className="text-[10px] opacity-80">{err.message || 'Service temporarily unavailable'}</span>
                </div>,
                { duration: 5000 }
            );
        } finally {
            setIsCheckingSafety(false);
        }
    };

    const addPrescription = () =>
        setPrescriptions([...prescriptions, { medicine_name: "", dosage: "", frequency: "", duration: "" }]);

    const addLabOrder = () =>
        setLabOrders([...labOrders, { test_name: "", instructions: "" }]);

    const addProcedure = () =>
        setProcedures([...procedures, { procedure_id: null, procedure_name: "", price: 0, clinical_notes: "", category: "" }]);

    const handleProcedureSelect = (index, procedure) => {
        const updated = [...procedures];
        updated[index].procedure_id = procedure.id;
        updated[index].procedure_name = procedure.name;
        updated[index].price = Number(procedure.price) || 0;
        updated[index].category = procedure.category;
        setProcedures(updated);
        toast.success(`Procedure selected: ${procedure.name}`);
    };

    const removeProcedure = (index) => {
        const updated = procedures.filter((_, i) => i !== index);
        setProcedures(updated.length ? updated : [{ procedure_id: null, procedure_name: "", price: 0, clinical_notes: "", category: "" }]);
    };

    const handleMedicationSelect = (index, medication) => {
        const updated = [...prescriptions];
        updated[index].medicine_name = medication.name;
        setPrescriptions(updated);

        // Show stock info to doctor
        if (!medication.is_available) {
            toast.error(`${medication.name} is currently out of stock`);
        } else if (medication.current_stock < 10) {
            toast(`${medication.name} has low stock (${medication.current_stock} ${medication.unit} remaining)`, { icon: '⚠️' });
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

    const canStartConsultation = ['pending', 'arrived', 'booked'].includes(appointmentData.status?.toLowerCase());
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
                            <UserIcon className="h-6 w-6 text-blue-500" /> {patient.name}
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

                    {/* {isConsultationStarted && user?.id && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleToggleVoiceRecording}
                                className={`px-6 py-2 rounded-md transition-all flex items-center gap-2 shadow-sm ${
                                    isVoiceRecording 
                                    ? 'bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-200' 
                                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                                }`}
                            >
                                {isVoiceRecording ? (
                                    <>
                                        <StopCircle className="h-4 w-4" />
                                        Stop AI Capture
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4" />
                                        Start AI Capture
                                    </>
                                )}
                            </button>
                            
                            {isVoiceRecording && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-full shadow-sm animate-in fade-in zoom-in duration-300">
                                    <div className="flex items-end gap-1 h-4">
                                        <div className="w-1 bg-red-400 rounded-full animate-[bounce_1s_infinite]" style={{ animationDelay: '0s', height: '60%' }}></div>
                                        <div className="w-1 bg-red-500 rounded-full animate-[bounce_1s_infinite]" style={{ animationDelay: '0.2s', height: '100%' }}></div>
                                        <div className="w-1 bg-red-400 rounded-full animate-[bounce_1s_infinite]" style={{ animationDelay: '0.4s', height: '70%' }}></div>
                                    </div>
                                    <span className="text-xs font-bold text-red-600 uppercase tracking-widest flex items-center">
                                        Listening...
                                    </span>
                                </div>
                            )}
                        </div>
                    )} */}

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

                {aiDraftApplied && pendingAiDraft && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-blue-600" />
                            <div>
                                <p className="text-sm font-semibold text-blue-900">AI Clinical Insights Ready</p>
                                <p className="text-xs text-blue-700">Review sections below. Press <strong>Enter</strong> in empty fields to accept or <strong>Esc</strong> to discard.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setSoapNotes(pendingAiDraft);
                                setPendingAiDraft(null);
                                setAiDraftApplied(false);
                                toast.success("All AI suggestions applied");
                            }}
                            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 font-medium whitespace-nowrap"
                        >
                            Apply All
                        </button>
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                    {["subjective", "objective", "assessment", "plan"].map((field) => (
                        <div key={field} className="relative group">
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-semibold text-gray-700 capitalize">
                                    {field}
                                </label>
                                {pendingAiDraft?.[field] && !soapNotes[field] && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-wider animate-pulse">
                                        <Sparkles className="h-3 w-3" />
                                        AI Draft Available
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <textarea
                                    className={`w-full border rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-400 transition-all ${pendingAiDraft?.[field] && !soapNotes[field]
                                        ? 'border-blue-200 bg-blue-50/30'
                                        : 'border-gray-200'
                                        }`}
                                    rows={4}
                                    value={soapNotes[field]}
                                    onChange={(e) => handleSoapChange(field, e.target.value)}
                                    onKeyDown={(e) => {
                                        if (pendingAiDraft?.[field] && !soapNotes[field]) {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSoapChange(field, pendingAiDraft[field]);
                                                toast.success(`${field} accepted`);
                                            } else if (e.key === 'Escape') {
                                                const newDraft = { ...pendingAiDraft };
                                                delete newDraft[field];
                                                setPendingAiDraft(newDraft);
                                                toast("Suggestion discarded");
                                            }
                                        }
                                    }}
                                    placeholder={pendingAiDraft?.[field] && !soapNotes[field] ? pendingAiDraft[field] : `Enter ${field} details...`}
                                    disabled={!isConsultationStarted || isCompleted}
                                />
                                {pendingAiDraft?.[field] && !soapNotes[field] && (
                                    <button
                                        onClick={() => handleSoapChange(field, pendingAiDraft[field])}
                                        className="absolute right-2 top-2 p-1.5 bg-white shadow-sm border border-blue-100 rounded-md text-blue-600 hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                        title="Apply AI suggestion"
                                    >
                                        <Sparkles className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
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
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                        <Pill className="h-5 w-5 text-blue-500" /> Prescriptions
                    </h2>
                    {isConsultationStarted && !isCompleted && (
                        <button
                            id="ai-safety-scan-btn"
                            onClick={handleCheckPrescriptionSafety}
                            disabled={isCheckingSafety}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${
                                isCheckingSafety 
                                ? 'bg-gray-100 text-gray-400' 
                                : safetyReport?.status?.toLowerCase() === 'high risk'
                                    ? 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100 shake-animation'
                                    : safetyReport?.status?.toLowerCase() === 'caution'
                                        ? 'bg-amber-50 text-amber-600 border-2 border-amber-200 hover:bg-amber-100'
                                        : 'bg-indigo-50 text-indigo-600 border-2 border-indigo-100 hover:bg-indigo-100'
                            }`}
                        >
                            {isCheckingSafety ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4" />
                            )}
                            {isCheckingSafety ? "Analyzing Safety..." : "Scan for Allergies & Conflicts"}
                        </button>
                    )}
                </div>

                {safetyReport && (
                    <div className={`mb-4 p-4 rounded-xl border-l-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
                        safetyReport.status === 'High Risk' 
                        ? 'bg-red-50 border-red-500 text-red-900' 
                        : safetyReport.status === 'Caution'
                            ? 'bg-amber-50 border-amber-500 text-amber-900'
                            : 'bg-emerald-50 border-emerald-500 text-emerald-900'
                    }`}>
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full flex-shrink-0 ${
                                safetyReport.status === 'High Risk' ? 'bg-red-100 text-red-600' :
                                safetyReport.status === 'Caution' ? 'bg-amber-100 text-amber-600' :
                                'bg-emerald-100 text-emerald-600'
                            }`}>
                                {safetyReport.status === 'High Risk' ? (
                                    <AlertTriangle className="h-4 w-4" />
                                ) : safetyReport.status === 'Caution' ? (
                                    <Info className="h-4 w-4" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-xs font-black uppercase tracking-widest opacity-70">
                                        AI Safety Analysis: {safetyReport.status}
                                    </p>
                                    <button 
                                        onClick={() => setSafetyReport(null)}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <p className="text-sm font-semibold mb-1">{safetyReport.summary}</p>
                                {safetyReport.suggestion && (
                                    <p className="text-xs font-medium opacity-80 italic">
                                        Clinical Suggestion: {safetyReport.suggestion}
                                    </p>
                                )}
                                {safetyReport.alternativeConsiderations && safetyReport.alternativeConsiderations.length > 0 && (
                                    <div className="mt-2 space-y-1 p-2 bg-black/5 rounded-md">
                                        <p className="text-[10px] font-bold uppercase opacity-60 flex items-center gap-1">
                                            <Activity className="h-3 w-3" /> Alternatives to Consider
                                        </p>
                                        {safetyReport.alternativeConsiderations.map((alt, i) => (
                                            <p key={i} className="text-[11px] leading-tight">• {alt}</p>
                                        ))}
                                    </div>
                                )}
                                {safetyReport.warnings && safetyReport.warnings.length > 0 && (
                                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-orange-600 bg-orange-50/50 w-fit px-2 py-0.5 rounded border border-orange-100">
                                        <AlertCircleIcon className="h-3 w-3" />
                                        {safetyReport.warnings[0]}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

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

            {/* Procedures Section */}
            <div className={`bg-white shadow rounded-lg p-5 ${!isConsultationStarted && !isCompleted ? 'opacity-60 pointer-events-none' : ''}`}>
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 mb-3">
                    <Activity className="h-5 w-5 text-blue-500" /> Procedures Performed
                </h2>

                {procedures.map((proc, index) => (
                    <div key={index} className="grid md:grid-cols-12 gap-3 mb-3 items-start border-b pb-3 border-gray-100 last:border-0">
                        <div className="md:col-span-4">
                            <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block md:hidden">Procedure Name</label>
                            <ProcedureAutocomplete
                                hospitalId={appointmentData?.hospital_id}
                                value={proc.procedure_name}
                                onSelect={(p) => handleProcedureSelect(index, p)}
                                disabled={!isConsultationStarted || isCompleted}
                                placeholder="Search or select procedure"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block md:hidden">Category</label>
                            <input
                                type="text"
                                className="border p-2 rounded-md text-sm w-full bg-gray-50 text-gray-500 italic"
                                placeholder="Category"
                                value={proc.category || ""}
                                readOnly
                                disabled
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block md:hidden">Charge (₹)</label>
                            <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                <input
                                    type="number"
                                    className="border p-2 pl-6 rounded-md text-sm w-full"
                                    placeholder="Price"
                                    value={proc.price}
                                    onChange={(e) => {
                                        const updated = [...procedures];
                                        updated[index].price = parseFloat(e.target.value) || 0;
                                        setProcedures(updated);
                                    }}
                                    disabled={!isConsultationStarted || isCompleted}
                                />
                            </div>
                        </div>
                        <div className="md:col-span-3">
                            <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block md:hidden">Notes</label>
                            <input
                                type="text"
                                placeholder="Clinical Notes / Findings"
                                className="border p-2 rounded-md text-sm w-full"
                                value={proc.clinical_notes}
                                onChange={(e) => {
                                    const updated = [...procedures];
                                    updated[index].clinical_notes = e.target.value;
                                    setProcedures(updated);
                                }}
                                disabled={!isConsultationStarted || isCompleted}
                            />
                        </div>
                        <div className="md:col-span-1 flex justify-center pt-2">
                            <button
                                onClick={() => removeProcedure(index)}
                                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                                title="Remove Procedure"
                                disabled={!isConsultationStarted || isCompleted}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {!isCompleted && (
                    <button
                        onClick={addProcedure}
                        className="mt-2 text-blue-500 text-sm font-semibold hover:underline flex items-center gap-1"
                        disabled={!isConsultationStarted}
                    >
                        <PlusCircle size={14} /> Add Another Procedure
                    </button>
                )}
            </div>

            {/* Follow-up Section */}
            <div className={`bg-white shadow rounded-lg p-5 border-l-4 border-indigo-500 ${!isConsultationStarted && !isCompleted ? 'opacity-60 pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                        <CalendarCheck className="h-5 w-5 text-indigo-500" /> Plan Next Visit (Follow-Up)
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Follow-up Required?</span>
                        <button
                            onClick={() => setIsFollowUpRequired(!isFollowUpRequired)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isFollowUpRequired ? 'bg-indigo-600' : 'bg-gray-200'}`}
                            disabled={!isConsultationStarted || isCompleted}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isFollowUpRequired ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>
                </div>

                {isFollowUpRequired && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Date</label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {[
                                            { label: '+3 Days', days: 3 },
                                            { label: '+1 Week', days: 7 },
                                            { label: '+2 Weeks', days: 14 },
                                            { label: '+1 Month', days: 30 }
                                        ].map((opt) => (
                                            <button
                                                key={opt.label}
                                                onClick={() => handleQuickDate(opt.days)}
                                                className="px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 border border-indigo-100 transition-colors"
                                                disabled={isCompleted}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="date"
                                            className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                                            value={followUpDate}
                                            min={new Date().toISOString().split("T")[0]}
                                            onChange={(e) => setFollowUpDate(e.target.value)}
                                            disabled={isCompleted}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Instructions for Visit</label>
                                    <textarea
                                        className="w-full border rounded-md p-3 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                                        rows={2}
                                        placeholder="e.g., Review lab results, Check stitches recovery..."
                                        value={followUpNote}
                                        onChange={(e) => setFollowUpNote(e.target.value)}
                                        disabled={isCompleted}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Available Time Slots</label>
                                {loadingSlots ? (
                                    <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                    </div>
                                ) : !followUpDate ? (
                                    <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                        <ClockIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">Pick a date to see available slots</p>
                                    </div>
                                ) : availableSlots.length === 0 ? (
                                    <div className="p-8 text-center bg-red-50 rounded-lg border border-red-100">
                                        <XCircle className="h-8 w-8 text-red-300 mx-auto mb-2" />
                                        <p className="text-sm text-red-600 font-medium">No slots available for this date</p>
                                        <p className="text-xs text-red-500 mt-1">Try another date or check doctor schedule</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2 max-h-[180px] overflow-y-auto pr-2">
                                        {availableSlots.map((slot) => (
                                            <button
                                                key={slot.time}
                                                onClick={() => setFollowUpSlot(slot.time)}
                                                className={`p-2 text-xs font-bold rounded-md border transition-all ${followUpSlot === slot.time
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                        : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50'
                                                    }`}
                                                disabled={isCompleted}
                                            >
                                                {slot.display_time || slot.time.substring(0, 5)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
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
