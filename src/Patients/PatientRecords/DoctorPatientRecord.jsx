import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { CalendarDays, FileText, Activity, Stethoscope, AlertCircle, X, Download, ArrowLeft, User, Phone, Mail, Droplet, Clock, Pill, FlaskConical, Heart, GalleryThumbnails, Sparkles, Utensils, Upload, Eye, CheckCircle, ChevronDown, Loader2, Trash2, UserCircle2, MoreVertical } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import consultationsAPI from "../../api/consultationsapi";
import dietAPI from "../../api/dietapi";
import labOrdersAPI from "../../api/labordersapi";
import CopilotPanel from "@/components/CopilotPanel";
import { useSubscription } from "@/hooks/useSubscription";
import { useSelector } from "react-redux";
import hospitalsAPI from "../../api/hospitalsapi";
import { getModuleComponent, ModuleRegistry } from "../../Specialties/ModuleRegistry";
import ChildHeader from "../../Specialties/Pediatrics/ChildHeader";
import ReportExportButton from "../../components/Reports/ReportExportButton";
import ReportPreviewModal from "../../components/Reports/ReportPreviewModal";

const staticTabs = ["Appointments", "SOAP Notes", "Procedures", "Medications", "Diet Plans", "Lab Results", "Allergies & Notes", 'Gallery'];

const DoctorPatientRecord = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { isModuleDisabled } = useSubscription();

    // 1. All States First
    const [hospitalProfile, setHospitalProfile] = useState(null);
    const [patientData, setPatientData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tabs, setTabs] = useState(staticTabs);
    const [activeTab, setActiveTab] = useState(staticTabs[0]);
    const [consultations, setConsultations] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isCopilotOpen, setIsCopilotOpen] = useState(false);
    const [dietPlans, setDietPlans] = useState([]);
    const user = useSelector((state) => state.auth.user);
    const userRole = (user?.role || user?.designation_group || "").toLowerCase();

    // 2. Helper Functions
    const fetchHospitalProfile = async () => {
        try {
            const profile = await hospitalsAPI.getProfile();
            setHospitalProfile(profile);
            
            // Generate dynamic tabs with Smart Visibility
            const dynamicModules = profile.enabled_modules || [];
            const isPediatricHospital = profile.primary_specialty === 'PEDIATRICS' || profile.all_specialties?.includes('PEDIATRICS');
            
            // Calculate age to check if child (< 18)
            const birthDate = patientData?.dob ? new Date(patientData.dob) : null;
            const today = new Date();
            let ageInYears = birthDate ? today.getFullYear() - birthDate.getFullYear() : 99;
            if (birthDate && (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()))) {
                ageInYears--;
            }
            const isChild = ageInYears < 18;

            const newTabs = [...staticTabs];
            
            dynamicModules.forEach(mod => {
                const config = ModuleRegistry[mod];
                if (config && !newTabs.includes(config.name)) {
                    // Clinical Guard: Only show Pediatric modules (Vaccines/Growth) if patient is < 18 and VACCINES module is enabled (Master Switch)
                    const isPediatricModule = ['VACCINES', 'GROWTH'].includes(mod);
                    const isVaccineEnabled = dynamicModules.includes('VACCINES');
                    if (isPediatricModule && (!isPediatricHospital || !isChild || !isVaccineEnabled)) {
                        return; // Skip this module
                    }

                    // Subscription Guard: Explicitly check if module is disabled in subscription
                    if (isModuleDisabled(mod)) {
                        return;
                    }

                    // Insert before Gallery
                    const galleryIdx = newTabs.indexOf('Gallery');
                    if (galleryIdx !== -1) {
                        newTabs.splice(galleryIdx, 0, config.name);
                    } else {
                        newTabs.push(config.name);
                    }
                }
            });
            setTabs(newTabs);
        } catch (err) {
            console.error("Failed to fetch hospital profile:", err);
        }
    };
    
    // 3. Effects
    useEffect(() => {
        fetchHospitalProfile();
    }, []);

    useEffect(() => {
        if (patientData) {
            fetchHospitalProfile();
        }
    }, [patientData]);

    useEffect(() => {
        if (location.state?.activeTab && tabs.includes(location.state.activeTab)) {
            setActiveTab(location.state.activeTab);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname, tabs]);

    // Role Checks
    const doctorStatus = userRole === 'doctor';
    const labStaffStatus = userRole === 'lab_assistant' || userRole === 'lab_technician' || userRole === 'staff';
    const adminStatus = ['admin', 'hospital_admin', 'tenant_admin'].includes(userRole);

    const [labOrders, setLabOrders] = useState([]);
    const [loadingLabs, setLoadingLabs] = useState(false);
    const [confirmRetractOpen, setConfirmRetractOpen] = useState(false);
    const [labToRetract, setLabToRetract] = useState(null);
    const [retracting, setRetracting] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewingLab, setReviewingLab] = useState(null);
    const [reviewNotes, setReviewNotes] = useState("");
    const [isSavingReview, setIsSavingReview] = useState(false);
    const [uploadingLabId, setUploadingLabId] = useState(null);
    const fileInputRef = useRef(null);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(null);

    useEffect(() => {
        fetchPatientRecords();
    }, [patientId]);

    const fetchPatientRecords = async () => {
        try {
            setLoading(true);
            if (patientId) {
                const response = await consultationsAPI.getByPatient(patientId);
                if (response.patient) {
                    setPatientData(response.patient);
                } else {
                    setPatientData(null);
                }
                if (response.consultations && response.consultations.length > 0) {
                    setConsultations(response.consultations);
                    const allDietPlans = response.consultations
                        .filter(c => c.diet_plan)
                        .map(c => ({
                            ...c.diet_plan,
                            consultation_date: c.consultation_date,
                            staff_name: c.staff?.staff_name
                        }))
                        .sort((a, b) => new Date(b.consultation_date) - new Date(a.consultation_date));
                    setDietPlans(allDietPlans);
                    toast.success("Patient records loaded");
                } else {
                    setConsultations([]);
                    toast("No consultation records found");
                }
                try {
                    const dietResponse = await dietAPI.getPatientPlans(patientId);
                    const dietData = Array.isArray(dietResponse) ? dietResponse : (dietResponse.data || []);
                    setDietPlans(dietData);
                } catch (dietErr) {
                    console.error("Failed to fetch diet plans:", dietErr);
                }
            }
        } catch (err) {
            console.error("Failed to fetch patient records:", err);
            toast.error(`Failed to load patient records: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const isDoctor = () => {
        const dg = user?.designation_group?.toLowerCase();
        return dg === 'doctor' || dg === 'physician';
    };

    const fetchLabOrders = async () => {
        if (!patientId) return;
        try {
            setLoadingLabs(true);
            const data = await labOrdersAPI.getByPatient(patientId);
            setLabOrders(data || []);
        } catch (err) {
            console.error('Failed to fetch lab orders:', err);
        } finally {
            setLoadingLabs(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'Lab Results' && patientId) {
            fetchLabOrders();
        }
    }, [activeTab, patientId]);

    const handleUploadReport = async (labOrderId, file) => {
        if (!file) return;
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Only PDF, JPEG, and PNG files are allowed');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must not exceed 10MB');
            return;
        }
        try {
            setUploadingLabId(labOrderId);
            await labOrdersAPI.uploadReport(labOrderId, file);
            toast.success('Report uploaded successfully!');
            fetchLabOrders();
        } catch (err) {
            toast.error(err.message || 'Failed to upload report');
        } finally {
            setUploadingLabId(null);
        }
    };

    const handleStatusUpdate = async (labOrderId, newStatus) => {
        try {
            await labOrdersAPI.updateStatus(labOrderId, { status: newStatus });
            toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
            fetchLabOrders();
        } catch (err) {
            toast.error(err.message || 'Failed to update status');
        }
    };

    const handleMarkAsReviewed = async () => {
        if (!reviewNotes.trim()) {
            toast.error('Doctor notes are required');
            return;
        }
        try {
            setIsSavingReview(true);
            await labOrdersAPI.updateStatus(reviewingLab.id, {
                status: 'reviewed',
                doctor_notes: reviewNotes.trim(),
            });
            toast.success('Lab order marked as Reviewed');
            setShowReviewModal(false);
            setReviewingLab(null);
            setReviewNotes("");
            fetchLabOrders();
        } catch (err) {
            toast.error(err.message || 'Failed to mark as reviewed');
        } finally {
            setIsSavingReview(false);
        }
    };

    const confirmRetract = async () => {
        if (!labToRetract) return;
        try {
            setRetracting(true);
            await labOrdersAPI.remove(labToRetract.id);
            toast.success('Lab order retracted successfully');
            setConfirmRetractOpen(false);
            setLabToRetract(null);
            fetchLabOrders();
        } catch (err) {
            toast.error(err.message || 'Failed to retract order');
        } finally {
            setRetracting(false);
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

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatTime = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const downloadAllSOAPNotes = () => {
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.getHeight();
        const bottomMargin = 56;
        const contentBottomLimit = pageHeight - bottomMargin - 10;

        function addFooter(doc, doctorName, department) {
            const pageHeight = doc.internal.pageSize.getHeight();
            let yFooter = pageHeight - 56;
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            doc.setFont(undefined, 'italic');
            doc.text('This note was electronically generated and authenticated by:', 14, yFooter);
            yFooter += 6;
            doc.setFont(undefined, 'normal');
            let docLine = `${doctorName}`;
            if (department) docLine += ` (${department})`;
            doc.text(docLine, 14, yFooter);
            yFooter += 6;
            doc.text(`Date & Time: ${new Date().toLocaleString()}`, 14, yFooter);
            yFooter += 6;
            doc.text('Digital Signature: ________', 14, yFooter);
            yFooter += 6;
            doc.setFont(undefined, 'bold');
            doc.setTextColor(200, 0, 0);
            doc.text('Confidential – For Medical Use Only', 14, yFooter);
            yFooter += 6;
            doc.setFont(undefined, 'normal');
            doc.setTextColor(80, 80, 80);
            doc.text('Follow-up: ________', 14, yFooter);
            yFooter += 6;
            doc.text('Doctor’s Signature: ________', 14, yFooter);
            yFooter += 6;
            doc.text('Date & Time: ________', 14, yFooter);
            yFooter += 6;
            doc.setFont(undefined, 'italic');
            doc.setTextColor(120, 120, 120);
            doc.text("Note: This document is a part of the patient's confidential medical record.", 14, yFooter);
            doc.setTextColor(0, 0, 0);
        }

        const staff = consultations?.[0]?.staff || {};
        let doctorDisplayName = staff.staff_name || staff.department || '________________';
        const department = staff.department || null;

        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('Patient Medical Records - SOAP Notes', 14, 20);
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Patient: ${patientData?.patient_name || 'N/A'}`, 14, 30);
        doc.text(`Age: ${patientData?.age || calculateAge(patientData?.dob) || 'N/A'} | Gender: ${patientData?.gender || 'N/A'} | Blood Group: ${patientData?.blood_group || 'N/A'}`, 14, 37);
        doc.text(`Contact: ${patientData?.contact_info || 'N/A'}`, 14, 44);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 51);
        doc.line(14, 55, 196, 55);
        addFooter(doc, doctorDisplayName, department);

        let yPosition = 65;
        consultations.forEach((consultation, index) => {
            if (yPosition > contentBottomLimit) {
                doc.addPage();
                addFooter(doc, doctorDisplayName, department);
                yPosition = 20;
            }
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(`Consultation ${index + 1}`, 14, yPosition);
            yPosition += 7;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Date: ${formatDate(consultation.consultation_date)}`, 14, yPosition);
            doc.text(`Doctor: ${consultation.staff?.staff_name || 'N/A'}`, 100, yPosition);
            yPosition += 7;
            doc.text(`Duration: ${consultation.duration_minutes || 'N/A'} minutes`, 14, yPosition);
            yPosition += 10;

            ['Subjective', 'Objective', 'Assessment', 'Plan'].forEach((section) => {
                if (yPosition > contentBottomLimit) {
                    doc.addPage();
                    addFooter(doc, doctorDisplayName, department);
                    yPosition = 20;
                }
                doc.setFont(undefined, 'bold');
                doc.text(`${section}:`, 14, yPosition);
                doc.setFont(undefined, 'normal');
                yPosition += 5;
                const lines = doc.splitTextToSize(consultation[section.toLowerCase()] || 'Not recorded', 170);
                doc.text(lines, 20, yPosition);
                yPosition += (lines.length * 5) + 5;
            });

            // NEW: Add Vaccines to PDF
            if (consultation.vaccines && consultation.vaccines.length > 0) {
                if (yPosition > contentBottomLimit) {
                    doc.addPage();
                    addFooter(doc, doctorDisplayName, department);
                    yPosition = 20;
                }
                doc.setFont(undefined, 'bold');
                doc.text('Vaccines Administered:', 14, yPosition);
                doc.setFont(undefined, 'normal');
                yPosition += 6;
                consultation.vaccines.forEach(v => {
                    doc.text(`- ${v.name} (${v.dose})`, 20, yPosition);
                    yPosition += 5;
                });
                yPosition += 5;
            }

            doc.setDrawColor(200, 200, 200);
            doc.line(14, yPosition, 196, yPosition);
            yPosition += 10;
        });

        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            addFooter(doc, doctorDisplayName, department);
        }
        doc.save(`${patientData?.patient_name || 'Patient'}_SOAP_Notes_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success("SOAP notes downloaded");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!patientData) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <Card className="p-8 text-center max-w-md">
                    <Stethoscope className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium mb-4">Patient not found</p>
                    <Button onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Button onClick={() => navigate(-1)} variant="outline" className="rounded-xl font-medium border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                    </Button>
                    <div className="flex gap-3">
                        {!isModuleDisabled('AI_ANALYSIS') && (
                            <Button onClick={() => setIsCopilotOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-all">
                                <Sparkles className="h-4 w-4 mr-2" /> AI Insights
                            </Button>
                        )}
                        {/* <Button onClick={downloadAllSOAPNotes} disabled={consultations.length === 0} variant="outline" className="rounded-xl font-medium border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm">
                            <Download className="h-4 w-4 mr-2" /> Export Records
                        </Button> */}
                    </div>
                </div>

                {/* Patient Summary Card */}
                <Card className="shadow-sm border border-slate-200/60 rounded-[2rem] bg-white overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-sm">
                                <User className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-white tracking-tight">{patientData.patient_name}</h2>
                                <p className="text-slate-300 text-sm mt-1 flex items-center gap-2">
                                    <span>ID: {patientData.patient_code || 'N/A'}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                                    <span>Registered: {new Date(patientData.created_at || new Date()).toLocaleDateString()}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <Activity className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm font-medium text-white">Status: Active</span>
                        </div>
                    </div>
                    
                    <CardContent className="p-6 sm:p-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                            <div className="space-y-1">
                                <p className="text-slate-500 font-medium text-xs flex items-center gap-1.5"><UserCircle2 className="w-3.5 h-3.5" /> Age & Gender</p>
                                <p className="font-semibold text-slate-900 text-base">{calculateAge(patientData.dob)} yrs <span className="text-slate-300 font-normal mx-1">/</span> <span className="capitalize">{patientData.gender}</span></p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-slate-500 font-medium text-xs flex items-center gap-1.5"><Droplet className="w-3.5 h-3.5 text-red-400" /> Blood Group</p>
                                <p className="font-semibold text-slate-900 text-base">{patientData.blood_group || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-slate-500 font-medium text-xs flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-emerald-500" /> Contact</p>
                                <p className="font-semibold text-slate-900 text-base">{patientData.contact_info || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-slate-500 font-medium text-xs flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-indigo-500" /> Insurance</p>
                                <p className="font-semibold text-slate-900 text-base truncate">{patientData.insurance_provider || 'Self Pay'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tab Navigation */}
                <div className="bg-white p-1.5 rounded-[1.5rem] shadow-sm border border-slate-200/60 overflow-x-auto hide-scrollbar flex items-center gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => tab === "Gallery" ? navigate(`/patient-gallery?patientId=${patientId}`) : setActiveTab(tab)}
                            className={`px-5 py-2.5 rounded-[1.25rem] font-medium text-sm transition-all whitespace-nowrap flex-shrink-0 ${
                                activeTab === tab 
                                ? "bg-slate-100 text-slate-900 shadow-sm" 
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Pediatric First Header - Only for Children < 18 */}
                {hospitalProfile?.primary_specialty === 'PEDIATRICS' && 
                 calculateAge(patientData.dob) < 18 && 
                 hospitalProfile?.enabled_modules?.includes('VACCINES') && (
                    <ChildHeader 
                        patientData={patientData} 
                        enabledModules={hospitalProfile.enabled_modules} 
                    />
                )}

                {/* Main Content Area */}
                <div className="min-h-[500px]">
                    {activeTab === "Appointments" && (
                        <div className="space-y-4">
                            {consultations.length > 0 ? consultations.map((consultation, i) => (
                                <div key={i} className="flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-200/60 shadow-sm transition-all hover:shadow-md">
                                    <div className="flex gap-4 items-center">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl flex-shrink-0">
                                            <CalendarDays className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900 text-base">{consultation.staff?.staff_name}</p>
                                            <p className="text-sm text-slate-500 mt-0.5">{formatDate(consultation.consultation_date)} at {consultation.appointment?.appointment_time ? formatTime(consultation.appointment.appointment_time) : consultation.consultation_start_time ? formatTime(consultation.consultation_start_time) : 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <ReportExportButton 
                                            type="VISIT_SUMMARY"
                                            consultationId={consultation.id} 
                                            patientId={patientId}
                                            variant="ghost"
                                            size="sm"
                                            label=""
                                            className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100 flex items-center justify-center"
                                            onPreview={(url) => setPreviewUrl(url)}
                                        />
                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-medium rounded-full">Completed</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/60 border-dashed">
                                    <CalendarDays className="h-10 w-10 mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500 font-medium">No appointments scheduled</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "SOAP Notes" && (
                        <div className="space-y-5">
                            {consultations.length > 0 ? consultations.map((consultation, i) => (
                                <Card key={i} className="border border-slate-200/60 shadow-sm bg-white rounded-[2rem] overflow-hidden">
                                    <CardHeader className="border-b border-slate-100 p-5 bg-slate-50/50">
                                        <CardTitle className="text-sm font-semibold flex items-center justify-between text-slate-800">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-indigo-500" />
                                                Consultation Notes
                                            </div>
                                            <span className="text-xs font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">{formatDate(consultation.consultation_date)}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                                            {['Subjective', 'Objective', 'Assessment', 'Plan'].map(key => (
                                                <div key={key} className="space-y-1.5">
                                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{key}</p>
                                                    <p className="text-sm text-slate-800 leading-relaxed bg-slate-50/50 rounded-xl p-4 border border-slate-100 min-h-[4rem]">
                                                        {consultation[key.toLowerCase()] || 'No notes recorded.'}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Display vaccines administered during this session */}
                                        {consultation.vaccines && consultation.vaccines.length > 0 && (
                                            <div className="mt-6 pt-6 border-t border-slate-100">
                                                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <Stethoscope className="h-3.5 w-3.5 text-indigo-500" />
                                                    Vaccines Administered During Visit
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {consultation.vaccines.map((v, idx) => (
                                                        <div key={idx} className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100 text-xs font-semibold flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                                            {v.name} ({v.dose})
                                                            {v.batch_number && v.batch_number !== 'PENDING' && (
                                                                <span className="text-[10px] opacity-60 ml-1 font-medium">Batch: {v.batch_number}</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )) : (
                                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/60 border-dashed">
                                    <FileText className="h-10 w-10 mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500 font-medium">No clinical notes recorded</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "Procedures" && (
                        <div className="space-y-4">
                            {consultations.flatMap(c => c.procedures || []).length > 0 ? consultations.map(c => c.procedures?.map((proc, i) => (
                                <div key={i} className="flex items-start gap-4 p-5 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
                                    <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl flex-shrink-0 mt-1">
                                        <Stethoscope className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-900 text-base">
                                            {typeof proc === 'string' ? proc : (proc.procedure?.name || proc.procedure_name || proc.name || 'Unnamed Procedure')}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-0.5">{formatDate(c.consultation_date)} • {c.staff?.staff_name}</p>
                                        {typeof proc !== 'string' && proc.doctor_notes && (
                                            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <p className="text-sm text-slate-700 leading-relaxed">{proc.doctor_notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))) : (
                                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/60 border-dashed">
                                    <Stethoscope className="h-10 w-10 mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500 font-medium">No procedures recorded</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "Lab Results" && (
                        <div className="space-y-4">
                            {loadingLabs ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                    <p className="text-sm font-medium text-slate-500">Retrieving lab records...</p>
                                </div>
                            ) : labOrders.length > 0 ? (
                                labOrders.map((lab) => (
                                    <div key={lab.id} className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md p-5 sm:p-6 items-center gap-6">
                                        <div className="flex items-start gap-4 flex-1 w-full">
                                            <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl flex-shrink-0">
                                                <FlaskConical className="h-6 w-6" />
                                            </div>
                                            <div className="space-y-3 w-full">
                                                <div className="flex items-center flex-wrap gap-2">
                                                    <h4 className="font-semibold text-slate-900 text-base mr-2">{lab.test_name}</h4>
                                                    <span className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border ${
                                                        lab.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        lab.status === 'reviewed' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                                        lab.status === 'sample_collected' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                        'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                    }`}>
                                                        {(lab.status || 'Ordered').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                                    <CalendarDays className="h-4 w-4" />
                                                    <span>Ordered: {new Date(lab.created_at).toLocaleDateString()}</span>
                                                    <span className="text-slate-300">•</span>
                                                    <span>By {lab.created_by_staff?.staff_name || 'Medical Team'}</span>
                                                </div>
                                                {lab.doctor_notes && (
                                                    <div className="mt-3 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50 max-w-2xl">
                                                        <p className="text-xs font-semibold text-indigo-900 mb-1">Physician Interpretation</p>
                                                        <p className="text-sm text-indigo-800/80">{lab.doctor_notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end gap-3 w-full md:w-auto md:ml-auto">
                                            {!lab.report_file_url ? (
                                                (doctorStatus || labStaffStatus) && (
                                                    <div className="relative">
                                                        <input type="file" id={`upload-${lab.id}`} className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleUploadReport(lab.id, e.target.files[0])} />
                                                        <label htmlFor={`upload-${lab.id}`} className={`flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm h-10 px-5 rounded-xl cursor-pointer transition-all border border-slate-200 shadow-sm whitespace-nowrap ${uploadingLabId === lab.id ? 'opacity-50 pointer-events-none' : ''}`}>
                                                            {uploadingLabId === lab.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-slate-400" />} Upload File
                                                        </label>
                                                    </div>
                                                )
                                            ) : (
                                                <Button variant="outline" onClick={() => window.open(lab.report_file_url, '_blank')} className="h-10 px-5 rounded-xl text-indigo-600 font-medium border-indigo-200 hover:bg-indigo-50 shadow-sm whitespace-nowrap">
                                                    <Eye className="h-4 w-4 mr-2" /> View Document
                                                </Button>
                                            )}
                                            
                                            {/* Dropdown Menu Container (Fixed width to prevent jumping) */}
                                            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                                                {(doctorStatus || labStaffStatus) && (lab.status === 'ordered' || (lab.status === 'completed' && doctorStatus)) ? (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" className="h-10 w-10 p-0 rounded-xl bg-white border-slate-200 shadow-sm hover:bg-slate-50">
                                                                <MoreVertical className="h-5 w-5 text-slate-500" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5 shadow-lg border-slate-200">
                                                            <DropdownMenuLabel className="text-xs font-medium text-slate-500 px-2 py-1.5">Manage Order</DropdownMenuLabel>
                                                            <DropdownMenuSeparator className="bg-slate-100 mb-1" />
                                                            {lab.status === 'ordered' && (
                                                                <>
                                                                    <DropdownMenuItem onClick={() => handleStatusUpdate(lab.id, 'sample_collected')} className="rounded-lg cursor-pointer flex items-center gap-2.5 py-2 px-2.5 text-sm font-medium text-slate-700 focus:bg-slate-100">
                                                                        <Droplet className="h-4 w-4 text-amber-500" /> Mark Collected
                                                                    </DropdownMenuItem>
                                                                    {doctorStatus && (
                                                                        <DropdownMenuItem onClick={() => { setLabToRetract(lab); setConfirmRetractOpen(true); }} className="rounded-lg cursor-pointer flex items-center gap-2.5 py-2 px-2.5 text-sm font-medium text-red-600 focus:bg-red-50 focus:text-red-700 mt-1">
                                                                            <Trash2 className="h-4 w-4" /> Retract Order
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                </>
                                                            )}
                                                            {lab.status === 'completed' && doctorStatus && (
                                                                <DropdownMenuItem onClick={() => { setReviewingLab(lab); setReviewNotes(""); setShowReviewModal(true); }} className="rounded-lg cursor-pointer flex items-center gap-2.5 py-2 px-2.5 text-sm font-medium text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700">
                                                                    <CheckCircle className="h-4 w-4" /> Sign Off Review
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/60 border-dashed">
                                    <FlaskConical className="h-10 w-10 mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500 font-medium">No lab records found</p>
                                </div>
                            )}

                            {/* Retract Confirmation Modal */}
                            <Dialog open={confirmRetractOpen} onOpenChange={setConfirmRetractOpen}>
                                <DialogContent className="sm:max-w-md rounded-3xl p-6 shadow-2xl bg-white border border-slate-100">
                                    <DialogHeader>
                                        <div className="mx-auto w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4"><AlertCircle className="h-7 w-7" /></div>
                                        <DialogTitle className="text-center text-xl font-semibold text-slate-900">Retract Lab Order?</DialogTitle>
                                        <DialogDescription className="text-center text-slate-500 pt-2">
                                            Are you sure you want to retract "{labToRetract?.test_name}"? This action cannot be undone.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
                                        <Button variant="outline" onClick={() => setConfirmRetractOpen(false)} className="flex-1 rounded-xl h-11 font-medium border-slate-200 hover:bg-slate-50">Cancel</Button>
                                        <Button variant="destructive" onClick={confirmRetract} disabled={retracting} className="flex-1 rounded-xl h-11 font-medium bg-red-600 hover:bg-red-700 text-white shadow-sm">
                                            {retracting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                            Confirm Retract
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}

                    {activeTab === "Medications" && (
                        <div className="space-y-4">
                            {consultations.flatMap(c => c.prescriptions || []).length > 0 ? consultations.map(c => c.prescriptions?.map((med, i) => (
                                <div key={i} className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl flex-shrink-0">
                                        <Pill className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900 text-base">{med.medicine_name}</p>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            {[med.dosage, med.frequency, med.duration].filter(Boolean).join(' • ')}
                                            {med.quantity ? ` • Qty: ${med.quantity}` : ''}
                                        </p>
                                    </div>
                                </div>
                            ))) : (
                                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/60 border-dashed">
                                    <Pill className="h-10 w-10 mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500 font-medium">No prescriptions found</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "Diet Plans" && (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {dietPlans.length > 0 ? dietPlans.map((plan, i) => (
                                <Card key={i} className="border border-slate-200/60 shadow-sm bg-white rounded-[2rem] overflow-hidden flex flex-col">
                                    <CardHeader className="border-b border-slate-100 p-5 bg-emerald-50/50">
                                        <div className="flex items-center justify-between mb-1">
                                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-800">
                                                <Utensils className="h-4 w-4" />
                                                Diet Plan
                                            </CardTitle>
                                            <span className="text-xs font-medium bg-white px-2.5 py-1 rounded-full border border-emerald-100 text-emerald-600">
                                                {formatDate(plan.consultation_date || plan.created_at)}
                                            </span>
                                        </div>
                                        {(plan.staff_name || plan.assigner?.staff_name) && (
                                            <p className="text-xs text-emerald-700 font-medium opacity-80 mt-1">Prescribed by {plan.staff_name || plan.assigner?.staff_name}</p>
                                        )}
                                    </CardHeader>
                                    <CardContent className="p-0 flex-1">
                                        {['morning', 'breakfast', 'lunch', 'snack', 'dinner'].map((time, idx) => (
                                            <div key={time} className={`p-4 flex gap-4 border-b border-slate-50`}>
                                                <div className="w-20 flex-shrink-0">
                                                    <p className="text-xs font-medium text-slate-400 capitalize">{time}</p>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-slate-700">{plan.plan_data?.[time] || '—'}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {(plan.plan_data?.instructions || plan.plan_data?.notes) && (
                                            <div className="p-5 bg-slate-50/50 mt-auto">
                                                <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Additional Advice & Restrictions</p>
                                                <p className="text-sm text-slate-600 leading-relaxed italic whitespace-pre-line">{plan.plan_data.instructions || plan.plan_data.notes}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )) : (
                                <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-slate-200/60 border-dashed">
                                    <Utensils className="h-10 w-10 mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500 font-medium">No diet plans created</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "Allergies & Notes" && (
                        <div className="grid md:grid-cols-2 gap-5">
                            <Card className="border border-slate-200/60 shadow-sm bg-white rounded-[2rem] overflow-hidden">
                                <CardHeader className="border-b border-slate-100 p-5 bg-red-50/50">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-700">
                                        <AlertCircle className="h-4 w-4" /> Active Allergies
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {patientData.allergies ? (
                                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{patientData.allergies}</p>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">No known allergies reported.</p>
                                    )}
                                </CardContent>
                            </Card>
                            <Card className="border border-slate-200/60 shadow-sm bg-white rounded-[2rem] overflow-hidden">
                                <CardHeader className="border-b border-slate-100 p-5 bg-blue-50/50">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-blue-700">
                                        <Activity className="h-4 w-4" /> Medical History
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {patientData.medical_history ? (
                                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{patientData.medical_history}</p>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">No medical history recorded.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Dynamic Specialty Modules (Lazy Loaded) */}
                    <React.Suspense fallback={
                        <div className="flex justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        </div>
                    }>
                        {Object.keys(ModuleRegistry).map(moduleKey => {
                            const config = ModuleRegistry[moduleKey];
                            if (activeTab === config.name) {
                                const Component = config.component;
                                return <Component key={moduleKey} patientId={patientId} patientDob={patientData?.dob} onUpdate={fetchPatientRecords} />;
                            }
                            return null;
                        })}
                    </React.Suspense>
                </div>
            </div>

            {/* Review Modal */}
            <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
                <DialogContent className="sm:max-w-lg rounded-3xl p-6 shadow-2xl bg-white border border-slate-100">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-slate-900">Clinical Review</DialogTitle>
                        <DialogDescription className="text-slate-500 pt-1 font-medium">
                            {reviewingLab?.test_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-3">
                        <label className="block text-sm font-medium text-slate-700">Physician Interpretation</label>
                        <textarea 
                            value={reviewNotes} 
                            onChange={e => setReviewNotes(e.target.value)} 
                            placeholder="Type clinical interpretation here..." 
                            className="w-full h-32 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none bg-slate-50 transition-all placeholder:text-slate-400" 
                        />
                    </div>
                    <DialogFooter className="gap-3 mt-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowReviewModal(false)} className="rounded-xl font-medium border-slate-200 hover:bg-slate-50">Cancel</Button>
                        <Button onClick={handleMarkAsReviewed} disabled={isSavingReview || !reviewNotes.trim()} className="rounded-xl font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                            {isSavingReview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Sign & Complete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CopilotPanel isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} patientId={patientId} />
            
            <ReportPreviewModal 
                isOpen={!!previewUrl} 
                url={previewUrl} 
                onClose={() => setPreviewUrl(null)} 
                title="Encounter Summary Report"
            />
        </div>
    );
};

export default DoctorPatientRecord;
