import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useSubscription } from "../hooks/useSubscription";
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
import labOrdersAPI from "../api/labordersapi";
import prescriptionSafetyAPI from "../api/prescriptionSafetyAPI";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import cancellationRequestAPI from "../api/cancellationrequestapi";
import UploadSessionModal from "../components/UploadSessionModal";
import MedicationAutocomplete from "../components/MedicationAutocomplete";
import VoiceTranscription from "../components/VoiceTranscription";
import proceduresAPI from "../api/proceduresapi";
import ProcedureAutocomplete from "../components/ProcedureAutocomplete";
import clinicalCodingAPI from "../api/clinicalcodingapi";
import IcdAutocomplete from "../components/IcdAutocomplete";
import copilotAPI from "../api/copilotapi";
import { baseUrl } from "../constants/Constant";
import { getAuthToken } from "../utils/auth";
import { ReadOnlyTooltip } from "@/components/ui/read-only-tooltip";
import DietPlanSection from "./DietPlanSection";
import dietAPI from "../api/dietapi";
import { useHospital } from "../contexts/HospitalContext";
import VaccineConsultationWidget from "../Specialties/Pediatrics/VaccineConsultationWidget";
import GrowthConsultationWidget from "../Specialties/Pediatrics/GrowthConsultationWidget";
import ReportPreviewModal from "../components/Reports/ReportPreviewModal";
import reportsAPI from "../api/reportsapi";



const DoctorConsultation = () => {
    const { appointmentId } = useParams();
    const user = useSelector((state) => state.auth.user);
    const { isReadOnly } = useSubscription();

    const [appointmentData, setAppointmentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isConsultationStarted, setIsConsultationStarted] = useState(false);
    const [consultationStartTime, setConsultationStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancellationReason, setCancellationReason] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Stores the consultation record once the appointment is fulfilled (for coding-status banner)
    const [existingConsultation, setExistingConsultation] = useState(null);

    // Controlled amendment mode — allows doctor to edit a completed consultation
    // only via "Edit for Clarification" or "Amend Consultation" actions.
    const [isAmendMode, setIsAmendMode] = useState(false);
    const [isAmendSaving, setIsAmendSaving] = useState(false);
    const [showAmendWarning, setShowAmendWarning] = useState(false);

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
        { medicine_name: "", dosage: "", frequency: "", duration: "", quantity: "" },
    ]);

    const [labOrders, setLabOrders] = useState([
        { test_name: "", instructions: "" }
    ]);

    // Recent Lab Orders (context for doctor during consultation)
    const [recentLabOrders, setRecentLabOrders] = useState([]);
    const [loadingRecentLabs, setLoadingRecentLabs] = useState(false);

    const [procedures, setProcedures] = useState([
        { procedure_id: null, procedure_name: "", price: 0, clinical_notes: "", category: "", cpt_code: null, cpt_code_description_snapshot: null, justified_by_icd_codes: [] }
    ]);
    const [diagnoses, setDiagnoses] = useState([]);

    // AI SOAP generation state
    const [aiGenerationInProgress, setAiGenerationInProgress] = useState(false);
    const [aiDraftApplied, setAiDraftApplied] = useState(false);
    const [showReplaceConfirmModal, setShowReplaceConfirmModal] = useState(false);
    const [pendingAiDraft, setPendingAiDraft] = useState(null);

    // SOAP Assist (raw text → structured SOAP + ICD suggestions)
    const [soapAssistRawText, setSoapAssistRawText] = useState("");
    const [soapAssistLoading, setSoapAssistLoading] = useState(false);
    const [soapAssistError, setSoapAssistError] = useState(null);
    const [soapAssistWarning, setSoapAssistWarning] = useState(null);
    // Pending AI-suggested ICD codes: [{ icd_code, icd_code_description_snapshot, confidence, checked }]
    const [pendingIcdSuggestions, setPendingIcdSuggestions] = useState([]);

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
    
    // Diet Plan State
    const [currentDietPlan, setCurrentDietPlan] = useState(null);

    const [safetyReport, setSafetyReport] = useState(null);
    const [isCheckingSafety, setIsCheckingSafety] = useState(false);

    // Draft Recovery State
    const [hasDraft, setHasDraft] = useState(false);
    const [draftTimestamp, setDraftTimestamp] = useState(null);
    const [showDraftBanner, setShowDraftBanner] = useState(false);
    
    // Report Preview State
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);



    const { hospitalInfo: hospitalProfile } = useHospital();

    // Clinical coding flag — fetched from the dedicated lightweight endpoint.
    // Falls back to hospitalProfile if the API hasn't responded yet.
    const [isClinicalCodingEnabled, setIsClinicalCodingEnabled] = useState(
        !!(hospitalProfile?.clinical_coding_enabled || hospitalProfile?.tenant?.clinical_coding_enabled)
    );

    useEffect(() => {
        const fetchClinicalCodingFlag = async () => {
            try {
                const result = await clinicalCodingAPI.checkEnabled();
                setIsClinicalCodingEnabled(result?.enabled === true);
            } catch (err) {
                // 403 means flag is off — treat as disabled, not an error
                if (err?.message?.includes('403') || err?.message?.includes('Forbidden')) {
                    setIsClinicalCodingEnabled(false);
                } else {
                    // On any other error, fall back to hospitalProfile value
                    setIsClinicalCodingEnabled(
                        !!(hospitalProfile?.clinical_coding_enabled || hospitalProfile?.tenant?.clinical_coding_enabled)
                    );
                }
            }
        };
        fetchClinicalCodingFlag();
    }, []);

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

                // If appointment is fulfilled, also fetch the consultation to get coding_status
                if (['fulfilled', 'completed'].includes(response.status?.toLowerCase())) {
                    try {
                        const existingCons = await consultationsAPI.getByAppointment(appointmentId);
                        if (existingCons) setExistingConsultation(existingCons);
                    } catch (consErr) {
                        // Non-blocking — just means the consultation hasn't been created yet
                        console.warn('[CODING BANNER] Could not fetch existing consultation:', consErr?.message);
                    }
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

    // Moved initialization of status helpers up so draft logic can use them
    const canStartConsultation = ['pending', 'arrived', 'booked'].includes(appointmentData?.status?.toLowerCase());
    const canEndConsultation = appointmentData?.status?.toLowerCase() === 'in-progress';
    const canCancelAppointment = !['fulfilled', 'completed', 'cancelled', 'in-progress'].includes(appointmentData?.status?.toLowerCase());
    const isCompleted = ['fulfilled', 'completed'].includes(appointmentData?.status?.toLowerCase());
    const isCancelled = appointmentData?.status?.toLowerCase() === 'cancelled';

    // When in amend mode, treat the form as editable (same as in-progress) so
    // all fields that gate on `!isConsultationStarted || isCompleted` open up.
    const effectivelyEditable = isConsultationStarted || isAmendMode;

    // --- DRAFT SYSTEM LOGIC ---
    const getDraftKey = () => `cons_draft_${user?.hospital_id || 'h'}_${user?.id || 'u'}_${appointmentId}`;

    const clearDraft = () => {
        sessionStorage.removeItem(getDraftKey());
        setHasDraft(false);
        setShowDraftBanner(false);
    };

    const saveDraft = () => {
        if (!isConsultationStarted || isCompleted) return;
        
        const draftData = {
            soapNotes,
            prescriptions,
            labOrders,
            procedures,
            diagnoses,
            isFollowUpRequired,
            followUpDate,
            followUpNote,
            followUpSlot,
            currentDietPlan,
            soapAssistRawText,
            timestamp: new Date().getTime()
        };
        
        sessionStorage.setItem(getDraftKey(), JSON.stringify(draftData));
    };

    // Auto-save effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isConsultationStarted && !isCompleted) {
                saveDraft();
            }
        }, 3000); // Save every 3 seconds

        return () => clearTimeout(timer);
    }, [soapNotes, prescriptions, labOrders, procedures, diagnoses, isFollowUpRequired, followUpDate, followUpNote, followUpSlot, currentDietPlan]);

    // Detect draft on start
    useEffect(() => {
        if (isConsultationStarted && !isCompleted) {
            const saved = sessionStorage.getItem(getDraftKey());
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    const now = new Date().getTime();
                    const fourHours = 4 * 60 * 60 * 1000;
                    
                    if (now - parsed.timestamp < fourHours) {
                        setDraftTimestamp(new Date(parsed.timestamp).toLocaleTimeString());
                        setHasDraft(true);
                        setShowDraftBanner(true);
                    } else {
                        // Expired draft
                        sessionStorage.removeItem(getDraftKey());
                    }
                } catch (e) {
                    console.error("Failed to parse draft", e);
                }
            }
        }
    }, [isConsultationStarted]);

    const handleRestoreDraft = () => {
        const saved = sessionStorage.getItem(getDraftKey());
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.soapNotes) setSoapNotes(parsed.soapNotes);
            if (parsed.prescriptions) setPrescriptions(parsed.prescriptions);
            if (parsed.labOrders) setLabOrders(parsed.labOrders);
            if (parsed.procedures) setProcedures(parsed.procedures);
            if (parsed.diagnoses) setDiagnoses(parsed.diagnoses);
            if (parsed.isFollowUpRequired !== undefined) setIsFollowUpRequired(parsed.isFollowUpRequired);
            if (parsed.followUpDate) setFollowUpDate(parsed.followUpDate);
            if (parsed.followUpNote) setFollowUpNote(parsed.followUpNote);
            if (parsed.followUpSlot) setFollowUpSlot(parsed.followUpSlot);
            if (parsed.currentDietPlan) setCurrentDietPlan(parsed.currentDietPlan);
            if (parsed.soapAssistRawText) setSoapAssistRawText(parsed.soapAssistRawText);
            
            toast.success("Draft restored successfully!");
            setShowDraftBanner(false);
        }
    };

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
                diagnoses: isClinicalCodingEnabled ? diagnoses.map((d, index) => ({
                    icd_code: d.icd_code || d.code,
                    icd_code_description_snapshot: d.icd_code_description_snapshot || d.description,
                    sequence: Number(d.sequence) || (index + 1)
                })) : [],
                prescriptions: prescriptions
                    .filter(p => p.medicine_name.trim() !== "")
                    .map(p => ({
                        medicine_name: p.medicine_name,
                        dosage: p.dosage,
                        frequency: p.frequency,
                        duration: p.duration,
                        quantity: p.quantity ? Number(p.quantity) : null,
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
                        cpt_code: isClinicalCodingEnabled ? (p.cpt_code || null) : null,
                        cpt_code_description_snapshot: isClinicalCodingEnabled ? (p.cpt_code_description_snapshot || null) : null,
                        justified_by_icd_codes: isClinicalCodingEnabled ? (p.justified_by_icd_codes || []) : []
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


            const consultationResult = await consultationsAPI.create(consultationData);
            const consultationIdCreated = consultationResult.id;

            // Save Diet Plan separately if included
            if (currentDietPlan && consultationIdCreated) {
                try {
                    await dietAPI.saveConsultationPlan(consultationIdCreated, {
                        plan_data: currentDietPlan,
                        patient_id: appointmentData.patient_id,
                        hospital_id: appointmentData.hospital_id
                    });
                    toast.success("Diet plan saved!");
                } catch (dietErr) {
                    console.error("Failed to save diet plan:", dietErr);
                    toast.error("Failed to save diet plan, but consultation was successfull.");
                }
            }

            await appointmentsAPI.update(appointmentId, {
                status: 'fulfilled',
                actual_end_time: endTime.toISOString(),
                actual_duration: actualDuration,
            });

            toast.success("Consultation completed and saved successfully!");
            clearDraft(); // Important: Clear draft on success
            
            // Generate and show the Visit Summary Report
            try {
                setIsGeneratingReport(true);
                const response = await reportsAPI.generateEncounterReport(consultationIdCreated, { preview: true });
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                setPreviewUrl(url);
            } catch (reportErr) {
                console.error("Failed to generate visit report:", reportErr);
                toast.error("Consultation saved, but summary report generation failed.");
                setTimeout(() => {
                    window.history.back();
                }, 2000);
            } finally {
                setIsGeneratingReport(false);
            }
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

    // ── Enter Amend Mode ──────────────────────────────────────────────────────
    // Populate form fields from the existing saved consultation so the doctor
    // can see and edit the previously saved data.
    const enterAmendMode = () => {
        if (!existingConsultation) return;

        setSoapNotes({
            subjective: existingConsultation.subjective || "",
            objective: existingConsultation.objective || "",
            assessment: existingConsultation.assessment || "",
            plan: existingConsultation.plan || "",
        });

        if (existingConsultation.prescriptions?.length > 0) {
            setPrescriptions(existingConsultation.prescriptions.map(p => ({
                id: p.id,                          // preserve DB id for upsert
                medicine_name: p.medicine_name || "",
                dosage: p.dosage || "",
                frequency: p.frequency || "",
                duration: p.duration || "",
                quantity: p.quantity ?? "",
            })));
        } else {
            setPrescriptions([{ medicine_name: "", dosage: "", frequency: "", duration: "", quantity: "" }]);
        }

        if (existingConsultation.lab_orders?.length > 0) {
            setLabOrders(existingConsultation.lab_orders.map(l => ({
                id: l.id,                          // preserve DB id for upsert
                test_name: l.test_name || "",
                instructions: l.instructions || "",
            })));
        } else {
            setLabOrders([{ test_name: "", instructions: "" }]);
        }

        if (existingConsultation.diagnoses?.length > 0) {
            setDiagnoses(existingConsultation.diagnoses.map(d => ({
                id: d.id,                          // preserve DB id for upsert
                icd_code: d.icd_code,
                icd_code_description_snapshot: d.icd_code_description_snapshot,
                sequence: d.sequence || 1,
            })));
        }

        // Preserve procedures with their DB ids so CPT codes aren't duplicated
        if (existingConsultation.procedures?.length > 0) {
            setProcedures(existingConsultation.procedures.map(p => ({
                id: p.id,                          // preserve DB id for upsert
                procedure_id: p.procedure_id || p.procedure?.id,
                procedure_name: p.procedure?.name || "",
                price: p.actual_price_charged || 0,
                clinical_notes: p.doctor_notes || "",
                category: p.procedure?.category || "",
                cpt_code: p.cpt_code || null,
                cpt_code_description_snapshot: p.cpt_code_description_snapshot || null,
                justified_by_icd_codes: p.justified_by_icd_codes || [],
            })));
        }

        setIsAmendMode(true);
    };

    // ── Amend Save ────────────────────────────────────────────────────────────
    // Saves doctor edits to a completed/coded consultation.
    // Backend is responsible for transitioning coding_status → pending_recoding
    // whenever a previously-coded consultation is patched.
    const handleAmendSave = async () => {
        if (!existingConsultation?.id) {
            toast.error("Could not find consultation record to update.");
            return;
        }
        try {
            setIsAmendSaving(true);

            const amendData = {
                subjective: soapNotes.subjective || null,
                objective: soapNotes.objective || null,
                assessment: soapNotes.assessment || null,
                plan: soapNotes.plan || null,
                diagnoses: isClinicalCodingEnabled ? diagnoses.map((d, index) => ({
                    // pass id so backend can UPDATE the existing row instead of INSERT
                    ...(d.id && { id: d.id }),
                    icd_code: d.icd_code || d.code,
                    icd_code_description_snapshot: d.icd_code_description_snapshot || d.description,
                    sequence: Number(d.sequence) || (index + 1),
                })) : [],
                prescriptions: prescriptions
                    .filter(p => p.medicine_name?.trim())
                    .map(p => ({
                        // pass id so backend can UPDATE instead of INSERT
                        ...(p.id && { id: p.id }),
                        medicine_name: p.medicine_name,
                        dosage: p.dosage,
                        frequency: p.frequency,
                        duration: p.duration,
                        quantity: p.quantity ? Number(p.quantity) : null,
                    })),
                lab_orders: labOrders
                    .filter(l => l.test_name?.trim())
                    .map(l => ({
                        // pass id so backend can UPDATE instead of INSERT
                        ...(l.id && { id: l.id }),
                        test_name: l.test_name,
                        instructions: l.instructions || null,
                    })),
                procedures: procedures
                    .filter(p => p.procedure_id)
                    .map(p => ({
                        procedure_id: p.procedure_id,
                        // pass id so backend can UPDATE instead of INSERT
                        ...(p.id && { id: p.id }),
                        actual_price_charged: Number(p.price) || 0,
                        doctor_notes: p.clinical_notes || null,
                        cpt_code: isClinicalCodingEnabled ? (p.cpt_code || null) : null,
                        cpt_code_description_snapshot: isClinicalCodingEnabled ? (p.cpt_code_description_snapshot || null) : null,
                        justified_by_icd_codes: isClinicalCodingEnabled ? (p.justified_by_icd_codes || []) : [],
                    })),
            };

            await consultationsAPI.update(existingConsultation.id, amendData);

            // Re-fetch the consultation so the coding banner reflects the new status
            try {
                const refreshed = await consultationsAPI.getByAppointment(appointmentId);
                if (refreshed) setExistingConsultation(refreshed);
            } catch (_) {
                // Non-fatal — banner will update on next page load
            }

            toast.success("Consultation updated. Sent back to coder queue for re-coding.");
            setIsAmendMode(false);
        } catch (err) {
            console.error("Failed to save amendment:", err);
            toast.error(`Failed to update consultation: ${err.message}`);
        } finally {
            setIsAmendSaving(false);
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

    // SOAP Assist handler — POSTs raw clinical text to /soap-assist/analyse
    const handleSoapAssist = async () => {
        const text = soapAssistRawText.trim();
        if (!text) {
            toast.error("Please enter some clinical notes first.");
            return;
        }
        if (text.length < 20) {
            toast.error("Notes too short — add more detail for a useful SOAP draft.");
            return;
        }

        setSoapAssistLoading(true);
        setSoapAssistError(null);
        setSoapAssistWarning(null);

        try {
            const result = await copilotAPI.analyseSoap(text);

            const aiDraft = {
                subjective: result.soap?.subjective || "",
                objective: result.soap?.objective || "",
                assessment: result.soap?.assessment || "",
                plan: result.soap?.plan || "",
            };

            setPendingAiDraft(aiDraft);
            setAiDraftApplied(true);

            // Surface any safety warnings from the backend
            if (result.warnings && result.warnings.length > 0) {
                setSoapAssistWarning(result.warnings.join(" • "));
            }

            // Populate ICD suggestions (gate on feature flag)
            if (isClinicalCodingEnabled && result.icdSuggestions && result.icdSuggestions.length > 0) {
                // Filter out codes already added to diagnoses
                const existingCodes = new Set(diagnoses.map(d => d.icd_code || d.code));
                const fresh = result.icdSuggestions
                    .filter(s => !existingCodes.has(s.code))
                    .map(s => ({
                        icd_code: s.code,
                        icd_code_description_snapshot: s.description,
                        confidence: s.confidence || "medium",
                        checked: true, // pre-checked by default, doctor can uncheck
                    }));
                setPendingIcdSuggestions(fresh);
            }

            toast.success("SOAP draft ready — review below.");
        } catch (err) {
            console.error("SOAP Assist failed:", err);
            const msg = err.message || "";
            if (msg.includes("403") || msg.includes("Forbidden")) {
                setSoapAssistError("Clinical coding not enabled — contact your admin.");
            } else if (msg.includes("429") || msg.includes("Too Many")) {
                setSoapAssistError("Too many requests, please wait a moment.");
            } else if (msg.includes("400") || msg.includes("Bad Request")) {
                setSoapAssistError("Text is too short or contains unsupported characters.");
            } else {
                setSoapAssistError("AI unavailable — please fill SOAP manually.");
            }
        } finally {
            setSoapAssistLoading(false);
        }
    };

    // Accept all AI-suggested ICD codes that are still checked.
    // Uses a single setDiagnoses call to avoid the stale-closure bug where
    // forEach + handleAddDiagnosis each read the same old `diagnoses` snapshot,
    // causing every code to get sequence:1 and duplicate-detection to miss them.
    const handleApplyIcdSuggestions = () => {
        const toAdd = pendingIcdSuggestions.filter(s => s.checked);
        if (toAdd.length === 0) {
            toast("No codes selected.");
            setPendingIcdSuggestions([]);
            return;
        }

        // Deduplicate against current diagnoses, then append in one atomic update
        const existingCodes = new Set(diagnoses.map(d => d.icd_code || d.code));
        const fresh = toAdd.filter(s => !existingCodes.has(s.icd_code));

        if (fresh.length === 0) {
            toast("All selected codes are already in this visit.");
            setPendingIcdSuggestions([]);
            return;
        }

        const baseSequence = diagnoses.length; // 0 = list was empty, first new gets seq 1
        const newDiagnoses = fresh.map((s, idx) => ({
            icd_code: s.icd_code,
            icd_code_description_snapshot: s.icd_code_description_snapshot,
            sequence: baseSequence + idx === 0 ? 1 : 2,
        }));

        const updatedDiagnoses = [...diagnoses, ...newDiagnoses];
        setDiagnoses(updatedDiagnoses);

        // Auto-justify any unjustified procedures with the first/primary diagnosis
        const primaryCode = updatedDiagnoses.find(d => d.sequence === 1)?.icd_code;
        if (primaryCode) {
            setProcedures(prev => prev.map(proc => {
                if (proc.procedure_id && (!proc.justified_by_icd_codes || proc.justified_by_icd_codes.length === 0)) {
                    return { ...proc, justified_by_icd_codes: [primaryCode] };
                }
                return proc;
            }));
        }

        setPendingIcdSuggestions([]);
        const skipped = toAdd.length - fresh.length;
        toast.success(
            `${fresh.length} code${fresh.length > 1 ? "s" : ""} added${skipped > 0 ? ` (${skipped} already present, skipped)` : ""}.`
        );
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
        setPrescriptions([...prescriptions, { medicine_name: "", dosage: "", frequency: "", duration: "", quantity: "" }]);

    const addLabOrder = () =>
        setLabOrders([...labOrders, { test_name: "", instructions: "" }]);

    const removeLabOrder = (index) => {
        const updated = labOrders.filter((_, i) => i !== index);
        setLabOrders(updated.length ? updated : [{ test_name: "", instructions: "" }]);
    };

    // Fetch recent lab results for context when consultation starts
    useEffect(() => {
        const fetchRecentLabs = async () => {
            if (!appointmentData?.patient_id || !isConsultationStarted) return;
            try {
                setLoadingRecentLabs(true);
                const labs = await labOrdersAPI.getByPatient(appointmentData.patient_id);
                // Show most recent 5 labs (including pending orders) for full clinical context
                setRecentLabOrders((labs || []).slice(0, 5));
            } catch (err) {
                console.error('Failed to fetch recent labs:', err);
            } finally {
                setLoadingRecentLabs(false);
            }
        };
        fetchRecentLabs();
    }, [appointmentData?.patient_id, isConsultationStarted]);

    const handleAddDiagnosis = (icdCodeObj) => {
        const targetCode = icdCodeObj.code || icdCodeObj.icd_code;
        const targetDesc = icdCodeObj.description || icdCodeObj.icd_code_description_snapshot;
        
        // Prevent duplicate diagnoses
        const exists = diagnoses.some(d => (d.icd_code || d.code) === targetCode);
        if (exists) {
            toast.error("Diagnosis is already added to this visit.");
            return;
        }

        const newDiagnosis = {
            icd_code: targetCode,
            icd_code_description_snapshot: targetDesc,
            sequence: diagnoses.length === 0 ? 1 : 2 // 1 = Primary, 2+ = Secondary
        };

        const updatedDiagnoses = [...diagnoses, newDiagnosis];
        setDiagnoses(updatedDiagnoses);
        toast.success(`Diagnosis added: ${targetCode}`);

        // Smart Update: If we have procedures that are not justified, auto-justify them with this primary diagnosis!
        if (updatedDiagnoses.length === 1) {
            const updatedProcs = procedures.map(proc => {
                if (proc.procedure_id && (!proc.justified_by_icd_codes || proc.justified_by_icd_codes.length === 0)) {
                    return {
                        ...proc,
                        justified_by_icd_codes: [targetCode]
                    };
                }
                return proc;
            });
            setProcedures(updatedProcs);
        }
    };

    const handleRemoveDiagnosis = (code) => {
        const updated = diagnoses.filter(d => (d.icd_code || d.code) !== code);
        // Re-calculate sequences to ensure there is always a sequence 1 (Primary) diagnosis if list is not empty
        const resequenced = updated.map((d, index) => ({
            ...d,
            sequence: index === 0 ? 1 : 2
        }));
        setDiagnoses(resequenced);
        
        // Also remove this diagnosis justification from any procedures that linked it!
        const updatedProcedures = procedures.map(proc => ({
            ...proc,
            justified_by_icd_codes: (proc.justified_by_icd_codes || []).filter(c => c !== code)
        }));
        setProcedures(updatedProcedures);
        
        toast.success("Diagnosis removed");
    };

    const handleTogglePriority = (code) => {
        // Find the one to make primary (sequence 1)
        const updated = diagnoses.map(d => {
            const isMatch = (d.icd_code || d.code) === code;
            return {
                ...d,
                sequence: isMatch ? 1 : 2
            };
        });
        
        // Ensure only one is sequence 1 (Primary), others sequence 2 (Secondary)
        // Sort it so Primary is always rendered first!
        const sorted = updated.sort((a, b) => a.sequence - b.sequence);
        setDiagnoses(sorted);
        toast.success("Primary diagnosis updated");
    };

    const addProcedure = () =>
        setProcedures([...procedures, { procedure_id: null, procedure_name: "", price: 0, clinical_notes: "", category: "", cpt_code: null, cpt_code_description_snapshot: null, justified_by_icd_codes: [] }]);

    const handleProcedureSelect = (index, procedure) => {
        const updated = [...procedures];
        updated[index].procedure_id = procedure.id;
        updated[index].procedure_name = procedure.name;
        updated[index].price = Number(procedure.price) || 0;
        updated[index].category = procedure.category;
        updated[index].cpt_code = procedure.cpt_code || null;
        updated[index].cpt_code_description_snapshot = procedure.cpt_code_description_snapshot || (procedure.cpt_code ? procedure.name : null);
        // Smart Default: If we have at least one diagnosis, auto-justify with the primary one!
        const primaryDiag = diagnoses.find(d => d.sequence === 1) || diagnoses[0];
        updated[index].justified_by_icd_codes = primaryDiag ? [primaryDiag.icd_code || primaryDiag.code] : [];
        setProcedures(updated);
        toast.success(`Procedure selected: ${procedure.name}`);
    };

    const removeProcedure = (index) => {
        const updated = procedures.filter((_, i) => i !== index);
        setProcedures(updated.length ? updated : [{ procedure_id: null, procedure_name: "", price: 0, clinical_notes: "", category: "", cpt_code: null, cpt_code_description_snapshot: null, justified_by_icd_codes: [] }]);
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

    return (
        <div className="min-h-screen bg-gray-50 p-6 space-y-6">
            {/* Draft Restoration Banner */}
            {showDraftBanner && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-100 p-2 rounded-full">
                                <ClipboardList className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-amber-900">Unsaved Consultation Draft Found</h4>
                                <p className="text-xs text-amber-700">We found an unsaved session for this patient from <strong>{draftTimestamp}</strong>. Would you like to restore it?</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                                onClick={handleRestoreDraft}
                                className="flex-1 sm:flex-none px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Check className="h-3 w-3" /> Restore Draft
                            </button>
                            <button
                                onClick={clearDraft}
                                className="flex-1 sm:flex-none px-4 py-2 bg-white border border-amber-200 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <X className="h-3 w-3" /> Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Coding Status Banners (shown to doctor on completed consultations) ── */}
            {isCompleted && existingConsultation?.coding_status === 'clarification_required' && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-start gap-3">
                        <div className="bg-orange-100 p-2 rounded-full flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-orange-900">Medical Coder Needs Clarification</h4>
                            <p className="text-xs text-orange-700 mt-0.5">
                                The medical coder has flagged this consultation and is requesting additional clinical information before assigning ICD/CPT codes.
                            </p>
                            {existingConsultation?.coding_comments && (
                                <p className="text-xs font-semibold text-orange-800 mt-2 bg-orange-100 rounded-lg px-3 py-2 border border-orange-200">
                                    💬 "{existingConsultation.coding_comments}"
                                </p>
                            )}
                            {!isAmendMode && (
                                <button
                                    onClick={() => enterAmendMode()}
                                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                >
                                    <AlertCircleIcon className="h-3.5 w-3.5" />
                                    Edit Consultation to Respond
                                </button>
                            )}
                            {isAmendMode && (
                                <p className="mt-2 text-xs font-semibold text-orange-700 bg-orange-100 rounded-lg px-3 py-1.5 border border-orange-300 inline-block">
                                    ✏️ Edit mode active — update the consultation below and click "Save &amp; Send for Re-coding"
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isCompleted && existingConsultation?.coding_status === 'pending_recoding' && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <AlertCircleIcon className="h-5 w-5 text-rose-600 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-rose-800">Consultation Re-coding Triggered</p>
                            <p className="text-xs text-rose-600 mt-0.5">This consultation was edited after coding was completed. The medical coder has been alerted and will re-code it.</p>
                        </div>
                    </div>
                </div>
            )}

            {isCompleted && existingConsultation?.coding_status === 'coded' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-emerald-800">Consultation Successfully Coded ✓</p>
                                <p className="text-xs text-emerald-600 mt-0.5">
                                    ICD/CPT coding has been completed by the medical coder
                                    {existingConsultation?.coding_completed_at
                                        ? ` on ${new Date(existingConsultation.coding_completed_at).toLocaleDateString()}`
                                        : ''}.
                                </p>
                            </div>
                        </div>
                        {!isAmendMode && (
                            <button
                                onClick={() => setShowAmendWarning(true)}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg transition-colors"
                            >
                                <AlertCircleIcon className="h-3.5 w-3.5" />
                                Amend Consultation
                            </button>
                        )}
                        {isAmendMode && (
                            <p className="text-xs font-semibold text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 border border-amber-200">
                                ✏️ Amend mode — save will return this consultation for re-coding
                            </p>
                        )}
                    </div>
                </div>
            )}

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


            <div className="bg-white shadow rounded-lg p-6 border-l-4 border-blue-500 overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-0">
                    <div className="min-w-0 w-full">
                        <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center gap-2">
                            <UserIcon className="h-6 w-6 text-blue-500 flex-shrink-0" /> 
                            <span className="truncate">{patient.name}</span>
                        </h1>
                        <p className="text-sm md:text-base text-gray-600 break-words mt-1">
                            {patient.age} yrs / {patient.gender} | ID: <span className="break-all">{patient.id}</span>
                        </p>
                        <div className="mt-3 space-y-1 text-sm md:text-base">
                            <p className="text-gray-500 break-words">
                                <strong>DOB:</strong> {patient.dob}
                            </p>
                            <p className="text-gray-500 break-words">
                                <strong>Reason:</strong> {patient.reason}
                            </p>
                            <p className="text-gray-500 break-words">
                                <strong>Contact:</strong> {patient.contact}
                            </p>
                            {patient.email !== "N/A" && (
                                <p className="text-gray-500 break-all">
                                    <strong>Email:</strong> {patient.email}
                                </p>
                            )}
                            <p className="text-gray-500 break-words">
                                <strong>Insurance:</strong> {patient.insuranceProvider}
                            </p>
                            <p className="text-gray-500 break-words">
                                <strong>Appointment:</strong> {patient.appointmentDate} at {patient.appointmentTime}
                            </p>
                        </div>
                    </div>

                    <div className="w-full md:w-auto md:text-right mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 flex-shrink-0">
                        <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${getStatusColor(patient.status)}`}>
                            {patient.status}
                        </span>
                        <div className="mt-3 text-sm flex flex-col gap-1">
                            <p><strong>Type:</strong> <span className="capitalize">{patient.appointmentType}</span></p>
                            <p><strong>Duration:</strong> {appointmentData.duration || 30} min</p>
                        </div>
                    </div>
                </div>
            </div>

            {!isCompleted && !isCancelled && (
                <div className="flex flex-col sm:flex-row gap-3 justify-end w-full">
                    {canStartConsultation && (
                        <ReadOnlyTooltip>
                            <button
                                onClick={handleStartConsultation}
                                disabled={isReadOnly}
                                className="flex items-center justify-center w-full sm:w-auto gap-2 px-6 py-3 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Play className="h-4 w-4" />
                                Start Consultation
                            </button>
                        </ReadOnlyTooltip>
                    )}

                    {/* {isConsultationStarted && user?.id && (
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={handleToggleVoiceRecording}
                                className={`px-6 py-3 sm:py-2 w-full sm:w-auto rounded-md transition-all flex items-center justify-center gap-2 shadow-sm ${
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
                                <div className="flex items-center justify-center w-full sm:w-auto gap-2 px-3 py-2 sm:py-1.5 bg-red-50 border border-red-100 rounded-full sm:rounded-full shadow-sm animate-in fade-in zoom-in duration-300">
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
                        <ReadOnlyTooltip>
                            <button
                                onClick={() => setShowCancelModal(true)}
                                disabled={isReadOnly}
                                className="flex items-center justify-center w-full sm:w-auto gap-2 px-6 py-3 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <XCircle className="h-4 w-4" />
                                Cancel Appointment
                            </button>
                        </ReadOnlyTooltip>
                    )}
                    {cancelRequested && (
                        <button
                            disabled
                            className="flex items-center justify-center w-full sm:w-auto gap-2 px-6 py-3 sm:py-2 bg-gray-400 text-white rounded-md cursor-not-allowed"
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

            {/* Pediatric & Specialty Clinical Modules */}
            {isConsultationStarted && !isCompleted && !isCancelled && (
                <div className="space-y-6 mb-6">
                    {/* Vaccines Widget: Requires PEDIATRICS specialty AND VACCINES module */}
                    {((hospitalProfile?.primary_specialty?.toUpperCase() === 'PEDIATRICS' || 
                       hospitalProfile?.all_specialties?.some(s => s?.toUpperCase() === 'PEDIATRICS')) &&
                      hospitalProfile?.enabled_modules?.some(m => m?.toUpperCase() === 'VACCINES')) && 
                      (calculateAge(appointmentData?.patient?.dob) < 18 || appointmentData?.patient?.age < 18) && (
                        <VaccineConsultationWidget 
                            patientId={appointmentData?.patient_id} 
                            appointmentId={appointmentId} 
                        />
                    )}
                    
                    {/* Growth Widget: Requires PEDIATRICS specialty AND GROWTH module */}
                    {((hospitalProfile?.primary_specialty?.toUpperCase() === 'PEDIATRICS' || 
                       hospitalProfile?.all_specialties?.some(s => s?.toUpperCase() === 'PEDIATRICS')) &&
                      hospitalProfile?.enabled_modules?.some(m => m?.toUpperCase() === 'GROWTH')) && 
                      (calculateAge(appointmentData?.patient?.dob) < 18 || appointmentData?.patient?.age < 18) && (
                        <GrowthConsultationWidget 
                            patientId={appointmentData?.patient_id} 
                            onSave={() => toast.success("Growth data synced to patient record")}
                        />
                    )}
                </div>
            )}

            {/* SOAP Notes Section */}
            <div className={`bg-white shadow rounded-lg p-5 ${!effectivelyEditable && !isCompleted ? 'opacity-60 pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                        <Stethoscope className="h-5 w-5 text-blue-500" /> Consultation Notes (SOAP)
                        {!effectivelyEditable && !isCompleted && (
                            <span className="text-xs text-gray-500 font-normal ml-2">(Start consultation to edit)</span>
                        )}
                        {isAmendMode && (
                            <span className="text-xs text-amber-600 font-semibold ml-2 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Amendment Mode</span>
                        )}
                    </h2>
                    {isConsultationStarted && !isCompleted && aiGenerationInProgress && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Generating AI draft…</span>
                        </div>
                    )}
                </div>

                {/* SOAP Assist — raw notes → structured SOAP + ICD suggestions */}
                {(effectivelyEditable || isAmendMode) && (
                    <div className="mb-4 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-blue-50/40 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                            <span className="text-sm font-semibold text-indigo-800">Clinical Notes</span>
                            <span className="text-[10px] bg-indigo-100 text-indigo-600 font-bold px-2 py-0.5 rounded-full border border-indigo-200 ml-auto">AI ASSIST</span>
                        </div>
                        <p className="text-xs text-indigo-600/80 mb-3">
                            Type or paste your raw consultation notes. AI will structure them into SOAP fields
                            {isClinicalCodingEnabled ? " and suggest ICD-10 codes." : "."}
                        </p>
                        <textarea
                            className="w-full border border-indigo-200 bg-white rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 placeholder-gray-400 resize-none transition-all"
                            rows={4}
                            maxLength={4000}
                            placeholder="e.g. Fever 3 days, cough, no SOB. Temp 38.5°C, throat red. Likely viral URI. Give paracetamol, review in 3 days."
                            value={soapAssistRawText}
                            onChange={(e) => {
                                setSoapAssistRawText(e.target.value);
                                if (soapAssistError) setSoapAssistError(null);
                            }}
                            disabled={soapAssistLoading}
                        />
                        <div className="flex items-center justify-between mt-2 gap-3 flex-wrap">
                            <span className="text-[11px] text-gray-400 tabular-nums">
                                {soapAssistRawText.length} / 4000
                            </span>
                            <button
                                onClick={handleSoapAssist}
                                disabled={soapAssistLoading || !soapAssistRawText.trim() || isReadOnly}
                                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
                            >
                                {soapAssistLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Generating…
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4" />
                                        Generate SOAP{isClinicalCodingEnabled ? " & Suggest Codes" : ""}
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Error state */}
                        {soapAssistError && (
                            <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 animate-in fade-in duration-200">
                                <AlertCircleIcon className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-red-700 font-medium">{soapAssistError}</p>
                            </div>
                        )}

                        {/* Non-blocking safety warning */}
                        {soapAssistWarning && !soapAssistError && (
                            <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 animate-in fade-in duration-200">
                                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-semibold text-amber-800">Review AI output before saving</p>
                                    <p className="text-xs text-amber-700 mt-0.5">{soapAssistWarning}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {aiDraftApplied && pendingAiDraft && (                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-blue-600" />
                            <div>
                                <p className="text-sm font-semibold text-blue-900">AI Clinical Insights Ready</p>
                                <p className="text-xs text-blue-700">Review sections below. Press <strong>Enter</strong> in empty fields to accept or <strong>Esc</strong> to discard.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setSoapNotes(prev => ({ ...prev, ...pendingAiDraft }));
                                setPendingAiDraft(null);
                                setAiDraftApplied(false);
                                toast.success("All AI suggestions applied");
                            }}
                            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 font-medium whitespace-nowrap"
                        >
                            Replace All
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
                                {pendingAiDraft?.[field] && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-wider animate-pulse">
                                        <Sparkles className="h-3 w-3" />
                                        {soapNotes[field] ? "AI Update Ready" : "AI Draft Available"}
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <textarea
                                    className={`w-full border rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-400 transition-all ${pendingAiDraft?.[field]
                                        ? 'border-blue-200 bg-blue-50/30'
                                        : 'border-gray-200'
                                        }`}
                                    rows={4}
                                    value={soapNotes[field]}
                                    onChange={(e) => handleSoapChange(field, e.target.value)}
                                    onKeyDown={(e) => {
                                        if (pendingAiDraft?.[field]) {
                                            if (e.key === 'Enter' && !e.shiftKey && !soapNotes[field]) {
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
                                    disabled={!effectivelyEditable || (isCompleted && !isAmendMode)}
                                />
                                {pendingAiDraft?.[field] && (
                                    <button
                                        onClick={() => handleSoapChange(field, pendingAiDraft[field])}
                                        className="absolute right-2 top-2 p-1.5 bg-white shadow-sm border border-blue-100 rounded-md text-blue-600 hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                        title={soapNotes[field] ? "Replace with AI suggestion" : "Apply AI suggestion"}
                                    >
                                        <Sparkles className="h-4 w-4" />
                                    </button>
                                )}
                                {/* Show AI draft preview below field when field already has content */}
                                {pendingAiDraft?.[field] && soapNotes[field] && (
                                    <div className="mt-1.5 rounded-md border border-blue-100 bg-blue-50/60 px-3 py-2">
                                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">AI Suggestion</p>
                                        <p className="text-xs text-blue-800 leading-relaxed whitespace-pre-wrap">{pendingAiDraft[field]}</p>
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => handleSoapChange(field, pendingAiDraft[field])}
                                                className="text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded transition-colors"
                                            >
                                                Replace
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const newDraft = { ...pendingAiDraft };
                                                    delete newDraft[field];
                                                    setPendingAiDraft(newDraft);
                                                }}
                                                className="text-[11px] font-semibold text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 px-2.5 py-1 rounded transition-colors"
                                            >
                                                Keep mine
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Standardized ICD-10 Coding Panel */}
                {isClinicalCodingEnabled && (
                    <div className="mt-6 border-t pt-5 border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <div>
                                <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                    Standardized Visit Diagnoses (ICD-10-CM)
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Search and link standard medical codes. The first added diagnosis defaults to Primary.
                                </p>
                            </div>
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-1 rounded-full border border-emerald-100 w-fit self-start sm:self-center">
                                FEATURE ACTIVE
                            </span>
                        </div>

                        <div className="max-w-2xl">
                            <IcdAutocomplete
                                onSelect={handleAddDiagnosis}
                                disabled={!effectivelyEditable || (isCompleted && !isAmendMode)}
                                placeholder="Search diagnoses by name or code (e.g. 'Diabetes', 'E11.9')..."
                            />
                        </div>

                        {diagnoses.length > 0 ? (
                            <div className="mt-4 border rounded-xl overflow-hidden bg-gray-50/50 border-gray-100">
                                <table className="min-w-full divide-y divide-gray-100 text-left">
                                    <thead className="bg-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-2">Code</th>
                                            <th className="px-4 py-2">Description Snapshot</th>
                                            <th className="px-4 py-2">Priority Selection</th>
                                            <th className="px-4 py-2 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm bg-white">
                                        {diagnoses.map((diag, index) => {
                                            const code = diag.icd_code || diag.code;
                                            const desc = diag.icd_code_description_snapshot || diag.description;
                                            const isPrimary = diag.sequence === 1;

                                            return (
                                                <tr key={code} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-100">
                                                            {code}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-gray-700">
                                                        {desc}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        {isPrimary ? (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                                                                <Check className="h-3 w-3" /> Primary Diagnosis
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleTogglePriority(code)}
                                                                disabled={!isConsultationStarted || isCompleted || isReadOnly}
                                                                className="text-xs text-gray-500 hover:text-blue-600 font-semibold transition-colors bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 px-2 py-1 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Make Primary
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-right">
                                                        <ReadOnlyTooltip>
                                                            <button
                                                                onClick={() => handleRemoveDiagnosis(code)}
                                                                disabled={!isConsultationStarted || isCompleted || isReadOnly}
                                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                title="Remove Diagnosis"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </ReadOnlyTooltip>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic mt-3">
                                No standardized diagnoses added to this visit yet. Standardize diagnosis via autocomplete above.
                            </p>
                        )}

                        {/* AI-suggested ICD codes from SOAP Assist */}
                        {pendingIcdSuggestions.length > 0 && (
                            <div className="mt-5 border border-indigo-100 rounded-xl bg-indigo-50/40 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-indigo-500" />
                                        <span className="text-sm font-semibold text-indigo-800">
                                            AI Suggested Codes
                                        </span>
                                        <span className="text-[10px] text-indigo-500 font-medium">
                                            ({pendingIcdSuggestions.filter(s => s.checked).length} selected)
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPendingIcdSuggestions([])}
                                            className="text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                                        >
                                            Dismiss
                                        </button>
                                        <button
                                            onClick={handleApplyIcdSuggestions}
                                            disabled={!isConsultationStarted || isCompleted || isReadOnly || !pendingIcdSuggestions.some(s => s.checked)}
                                            className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-3 py-1 rounded-lg transition-colors"
                                        >
                                            Add Selected
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-indigo-600/70 mb-3">
                                    Uncheck codes to exclude. Click "Add Selected" to add them to this visit.
                                </p>
                                <div className="space-y-2">
                                    {pendingIcdSuggestions.map((suggestion, idx) => {
                                        const confidenceConfig = {
                                            high: { label: "HIGH", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
                                            medium: { label: "MED", cls: "bg-amber-100 text-amber-700 border-amber-200" },
                                            low: { label: "LOW", cls: "bg-gray-100 text-gray-500 border-gray-200" },
                                        };
                                        const conf = confidenceConfig[suggestion.confidence] || confidenceConfig.low;
                                        return (
                                            <label
                                                key={suggestion.icd_code}
                                                className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${suggestion.checked ? "bg-white border-indigo-200 shadow-sm" : "bg-gray-50/60 border-gray-200 opacity-60"}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={suggestion.checked}
                                                    onChange={() => {
                                                        setPendingIcdSuggestions(prev =>
                                                            prev.map((s, i) => i === idx ? { ...s, checked: !s.checked } : s)
                                                        );
                                                    }}
                                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 flex-shrink-0"
                                                />
                                                <span className="font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 whitespace-nowrap">
                                                    {suggestion.icd_code}
                                                </span>
                                                <span className="text-xs text-gray-700 font-medium flex-1 min-w-0 truncate">
                                                    {suggestion.icd_code_description_snapshot}
                                                </span>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${conf.cls}`}>
                                                    {conf.label}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Image Upload Section */}
            <div className={`bg-white shadow rounded-lg p-5 ${!effectivelyEditable && !isCompleted ? 'opacity-60 pointer-events-none' : ''}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 w-full">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                        <Camera className="h-5 w-5 text-blue-500 flex-shrink-0" /> <span className="truncate">Patient Images</span>
                        {!effectivelyEditable && !isCompleted && (
                            <span className="text-xs text-gray-500 font-normal ml-2 break-words">(Start consultation to upload)</span>
                        )}
                    </h2>
                    {isConsultationStarted && !isCompleted && (
                        <div className="w-full sm:w-auto">
                            <ReadOnlyTooltip>
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    disabled={isReadOnly}
                                    className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto justify-center px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Camera className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">Upload Images</span>
                                </button>
                            </ReadOnlyTooltip>
                        </div>
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
            <div className={`bg-white shadow rounded-lg p-5 ${!effectivelyEditable && !isCompleted ? 'opacity-60 pointer-events-none' : ''}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 w-full">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                        <Pill className="h-5 w-5 text-blue-500 flex-shrink-0" /> <span className="truncate">Prescriptions</span>
                    </h2>
                    {isConsultationStarted && !isCompleted && (
                        <div className="w-full sm:w-auto">
                            <ReadOnlyTooltip>
                                <button
                                    id="ai-safety-scan-btn"
                                    onClick={handleCheckPrescriptionSafety}
                                    disabled={isCheckingSafety || isReadOnly}
                                    className={`flex items-center justify-center w-full sm:w-auto gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
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
                                        <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                                    ) : (
                                        <Sparkles className="h-4 w-4 flex-shrink-0" />
                                    )}
                                    <span className="truncate">{isCheckingSafety ? "Analyzing Safety..." : "Scan for Allergies & Conflicts"}</span>
                                </button>
                            </ReadOnlyTooltip>
                        </div>
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
                    <div key={index} className="grid md:grid-cols-5 gap-3 mb-3">
                        <MedicationAutocomplete
                            placeholder="Search medications..."
                            value={pres.medicine_name}
                            onChange={(value) => {
                                const updated = [...prescriptions];
                                updated[index].medicine_name = value;
                                setPrescriptions(updated);
                            }}
                            onSelect={(medication) => handleMedicationSelect(index, medication)}
                            disabled={!effectivelyEditable || (isCompleted && !isAmendMode)}
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
                            disabled={!effectivelyEditable || (isCompleted && !isAmendMode)}
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
                            disabled={!effectivelyEditable || (isCompleted && !isAmendMode)}
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
                            disabled={!effectivelyEditable || (isCompleted && !isAmendMode)}
                        />
                        <input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            className="border p-2 rounded-md text-sm"
                            value={pres.quantity || ""}
                            onChange={(e) => {
                                const updated = [...prescriptions];
                                updated[index].quantity = e.target.value;
                                setPrescriptions(updated);
                            }}
                            disabled={!effectivelyEditable || (isCompleted && !isAmendMode)}
                        />
                    </div>
                ))}

                {!isCompleted && (
                    <ReadOnlyTooltip>
                        <button
                            onClick={addPrescription}
                            className="mt-2 text-blue-500 text-sm font-semibold hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                            disabled={!isConsultationStarted || isReadOnly}
                        >
                            + Add Prescription
                        </button>
                    </ReadOnlyTooltip>
                )}
            </div>

            {/* Lab Orders Section */}
            <div className={`bg-white shadow rounded-lg p-5 ${!effectivelyEditable && !isCompleted ? 'opacity-60 pointer-events-none' : ''}`}>
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 mb-3">
                    <FlaskConical className="h-5 w-5 text-blue-500" /> Lab / Scan Orders
                </h2>

                {labOrders.map((order, index) => (
                    <div key={index} className="grid md:grid-cols-12 gap-3 mb-3 items-center">
                        <div className="md:col-span-5">
                            <input
                                type="text"
                                placeholder="Test / Scan Name"
                                className="border p-2 rounded-md text-sm w-full"
                                value={order.test_name}
                                onChange={(e) => {
                                    const updated = [...labOrders];
                                    updated[index].test_name = e.target.value;
                                    setLabOrders(updated);
                                }}
                                disabled={!effectivelyEditable || (isCompleted && !isAmendMode)}
                            />
                        </div>
                        <div className="md:col-span-6">
                            <input
                                type="text"
                                placeholder="Instructions (e.g., Fasting, 12 hrs)"
                                className="border p-2 rounded-md text-sm w-full"
                                value={order.instructions}
                                onChange={(e) => {
                                    const updated = [...labOrders];
                                    updated[index].instructions = e.target.value;
                                    setLabOrders(updated);
                                }}
                                disabled={!effectivelyEditable || (isCompleted && !isAmendMode)}
                            />
                        </div>
                        <div className="md:col-span-1 flex justify-center">
                            {!isCompleted && (
                                <ReadOnlyTooltip>
                                    <button
                                        onClick={() => removeLabOrder(index)}
                                        className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Remove Lab Order"
                                        disabled={!isConsultationStarted || isReadOnly}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </ReadOnlyTooltip>
                            )}
                        </div>
                    </div>
                ))}

                {!isCompleted && (
                    <ReadOnlyTooltip>
                        <button
                            onClick={addLabOrder}
                            className="mt-2 text-blue-500 text-sm font-semibold hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed flex items-center gap-1"
                            disabled={!isConsultationStarted || isReadOnly}
                        >
                            <PlusCircle size={14} /> Add Lab Order
                        </button>
                    </ReadOnlyTooltip>
                )}

                {/* Recent Lab Results — Context Panel */}
                {isConsultationStarted && recentLabOrders.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-gray-100">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <Clock className="h-3 w-3" /> Recent Lab Results
                        </p>
                        <div className="space-y-2">
                            {recentLabOrders.map((lab) => (
                                <div key={lab.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                            lab.status === 'reviewed' ? 'bg-gray-400' : lab.status === 'completed' ? 'bg-green-500' : 'bg-yellow-400'
                                        }`} />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 truncate">{lab.test_name}</p>
                                            <p className="text-[10px] text-gray-400">
                                                {new Date(lab.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                {lab.doctor_notes && <span className="ml-1">— {lab.doctor_notes.substring(0, 40)}{lab.doctor_notes.length > 40 ? '…' : ''}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight flex-shrink-0 ${
                                        lab.status === 'reviewed' ? 'bg-gray-100 text-gray-600' :
                                        lab.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        lab.status === 'sample_collected' ? 'bg-blue-100 text-blue-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {lab.status === 'ordered' ? 'Awaiting' : lab.status === 'sample_collected' ? 'Sample Taken' : lab.status === 'completed' ? 'Report Ready' : 'Reviewed'}
                                    </span>
                                    {lab.report_file_url && (
                                        <a
                                            href={lab.report_file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-2 text-blue-600 hover:text-blue-700 text-[10px] font-bold"
                                        >
                                            View
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Procedures Section */}
            <div className={`bg-white shadow rounded-lg p-5 ${!effectivelyEditable && !isCompleted ? 'opacity-60 pointer-events-none' : ''}`}>
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 mb-3">
                    <Activity className="h-5 w-5 text-blue-500" /> Procedures Performed
                </h2>

                {procedures.map((proc, index) => (
                    <div key={index} className="border-b pb-3 border-gray-100 last:border-b-0 last:pb-0 mb-4">
                        <div className="grid md:grid-cols-12 gap-3 items-start">
                            <div className="md:col-span-4">
                                <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block md:hidden">Procedure Name</label>
                                <ProcedureAutocomplete
                                    hospitalId={appointmentData?.hospital_id}
                                    value={proc.procedure_name}
                                    onSelect={(p) => handleProcedureSelect(index, p)}
                                    disabled={!effectivelyEditable || (isCompleted && !isAmendMode)}
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
                                        disabled={!effectivelyEditable || (isCompleted && !isAmendMode)}
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
                                    disabled={!effectivelyEditable || (isCompleted && !isAmendMode)}
                                />
                            </div>
                            <div className="md:col-span-1 flex justify-center pt-2">
                                <ReadOnlyTooltip>
                                    <button
                                        onClick={() => removeProcedure(index)}
                                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Remove Procedure"
                                        disabled={!isConsultationStarted || isCompleted || isReadOnly}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </ReadOnlyTooltip>
                            </div>
                        </div>

                        {/* CPT Badge & Description Snapshot Display */}
                        {isClinicalCodingEnabled && proc.cpt_code && (
                            <div className="mt-2 flex items-center gap-2 pl-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 shadow-sm leading-none flex items-center">
                                    CPT Code: {proc.cpt_code}
                                </span>
                                <span className="text-xs text-gray-500 italic truncate max-w-xl">
                                    {proc.cpt_code_description_snapshot}
                                </span>
                            </div>
                        )}

                        {/* Medical Justification Links */}
                        {isClinicalCodingEnabled && proc.procedure_id && (
                            <div className="mt-3 pl-4 py-2 bg-gray-50/50 rounded-lg border border-gray-100 max-w-4xl">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                                    Medical Necessity Justification (ICD-10)
                                </span>
                                {diagnoses.length > 0 ? (
                                    <div className="flex flex-wrap gap-3">
                                        {diagnoses.map((diag) => {
                                            const code = diag.icd_code || diag.code;
                                            const desc = diag.icd_code_description_snapshot || diag.description;
                                            const isChecked = proc.justified_by_icd_codes?.includes(code);

                                            return (
                                                <label key={code} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                                                    isChecked 
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                }`}>
                                                    <input
                                                        type="checkbox"
                                                        className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-400 border-gray-300 rounded cursor-pointer"
                                                        checked={isChecked}
                                                        disabled={!effectivelyEditable || (isCompleted && !isAmendMode)}
                                                        onChange={(e) => {
                                                            const updated = [...procedures];
                                                            const currentJustifications = updated[index].justified_by_icd_codes || [];
                                                            if (e.target.checked) {
                                                                updated[index].justified_by_icd_codes = [...currentJustifications, code];
                                                            } else {
                                                                updated[index].justified_by_icd_codes = currentJustifications.filter(c => c !== code);
                                                            }
                                                            setProcedures(updated);
                                                        }}
                                                    />
                                                    <span className="font-bold">{code}</span>
                                                    <span className="opacity-80 font-normal truncate max-w-[200px]">{desc}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-amber-600 bg-amber-50/50 border border-amber-100 rounded px-2.5 py-1 w-fit flex items-center gap-1.5">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        Please document standardized diagnoses in the SOAP Assessment panel first to link medical necessity justifications.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {!isCompleted && (
                    <ReadOnlyTooltip>
                        <button
                            onClick={addProcedure}
                            className="mt-2 text-blue-500 text-sm font-semibold hover:underline flex items-center gap-1 disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                            disabled={!isConsultationStarted || isReadOnly}
                        >
                            <PlusCircle size={14} /> Add Another Procedure
                        </button>
                    </ReadOnlyTooltip>
                )}
            </div>

            {/* Diet Plan Section */}
            <DietPlanSection 
                hospitalId={appointmentData?.hospital_id}
                consultationId={null} // Will be created on save
                isConsultationStarted={isConsultationStarted}
                isCompleted={isCompleted}
                isReadOnly={isReadOnly}
                onDataChange={(plan) => setCurrentDietPlan(plan)}
                initialData={currentDietPlan}
            />

            {/* Follow-up Section */}
            <div className={`bg-white shadow rounded-lg p-5 border-l-4 border-indigo-500 ${!effectivelyEditable && !isCompleted ? 'opacity-60 pointer-events-none' : ''}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 w-full">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                        <CalendarCheck className="h-5 w-5 text-indigo-500 flex-shrink-0" /> <span className="truncate">Plan Next Visit (Follow-Up)</span>
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Follow-up Required?</span>
                        <button
                            onClick={() => setIsFollowUpRequired(!isFollowUpRequired)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isFollowUpRequired ? 'bg-indigo-600' : 'bg-gray-200'}`}
                            disabled={!effectivelyEditable || (isCompleted && !isAmendMode)}
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
                                                disabled={isCompleted && !isAmendMode}
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
                                            disabled={isCompleted && !isAmendMode}
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
                                        disabled={isCompleted && !isAmendMode}
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
                                                disabled={isCompleted && !isAmendMode}
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
            <div className="flex flex-col sm:flex-row justify-end gap-3 w-full mt-6">
                <button
                    className="w-full sm:w-auto bg-gray-500 text-white px-6 py-3 sm:py-2 rounded-md hover:bg-gray-600 flex items-center justify-center"
                    onClick={() => {
                        if (isAmendMode) {
                            setIsAmendMode(false);
                        } else {
                            window.history.back();
                        }
                    }}
                    disabled={isSaving || isAmendSaving}
                >
                    {isAmendMode ? 'Cancel Amendment' : (isCompleted || isCancelled ? 'Close' : 'Back')}
                </button>

                {/* Save Amendment button — shown only in amend mode */}
                {isAmendMode && (
                    <button
                        onClick={handleAmendSave}
                        disabled={isAmendSaving || isReadOnly}
                        className="flex items-center justify-center w-full sm:w-auto gap-2 bg-amber-600 text-white px-6 py-3 sm:py-2 rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAmendSaving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <AlertCircleIcon className="h-4 w-4" />
                                Save &amp; Send for Re-coding
                            </>
                        )}
                    </button>
                )}

                {canEndConsultation && (
                    <ReadOnlyTooltip>
                        <button
                            onClick={handleEndConsultation}
                            disabled={isSaving || isReadOnly}
                            className="flex items-center justify-center w-full sm:w-auto gap-2 bg-blue-600 text-white px-6 py-3 sm:py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Saving...
                                </>
                            ) : isGeneratingReport ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Generating Report...
                                </>
                            ) : (
                                <>
                                    <StopCircle className="h-4 w-4" />
                                    End & Save Consultation
                                </>
                            )}
                        </button>
                    </ReadOnlyTooltip>
                )}
            </div>

            {/* Amend Consultation Warning Modal */}
            {showAmendWarning && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="bg-amber-100 p-2 rounded-full flex-shrink-0">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-800">Amend Coded Consultation?</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    This consultation has already been coded. Updating clinical details will move it back to <strong>Pending Re-coding</strong> and alert the medical coder.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowAmendWarning(false)}
                                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowAmendWarning(false);
                                    enterAmendMode();
                                }}
                                className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm font-semibold"
                            >
                                Amend Consultation
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
            <ReportPreviewModal 
                isOpen={!!previewUrl} 
                url={previewUrl} 
                onClose={() => {
                    setPreviewUrl(null);
                    window.history.back();
                }} 
                title="Visit Summary Report"
            />
        </div>
    );
};

export default DoctorConsultation;
