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

const tabs = ["Appointments", "SOAP Notes", "Procedures", "Medications", "Diet Plans", "Lab Results", "Allergies & Notes", 'Gallery'];

const DoctorPatientRecord = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { isModuleDisabled } = useSubscription();
    const [activeTab, setActiveTab] = useState(tabs[0]);

    useEffect(() => {
        if (location.state?.activeTab && tabs.includes(location.state.activeTab)) {
            setActiveTab(location.state.activeTab);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);
    const [loading, setLoading] = useState(true);
    const [patientData, setPatientData] = useState(null);
    const [consultations, setConsultations] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [isCopilotOpen, setIsCopilotOpen] = useState(false);
    const [dietPlans, setDietPlans] = useState([]);
    const user = useSelector((state) => state.auth.user);
    const userRole = (user?.role || user?.designation_group || "").toLowerCase();
    
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
            let docLine = `Dr. ${doctorName}`;
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Actions */}
                <div className="flex flex-wrap items-center gap-4">
                    <Button onClick={() => navigate(-1)} variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
                    {!isModuleDisabled('AI_ANALYSIS') && (
                        <Button onClick={() => setIsCopilotOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white"><Sparkles className="h-4 w-4 mr-2" /> AI Insights</Button>
                    )}
                    <Button onClick={downloadAllSOAPNotes} disabled={consultations.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white"><Download className="h-4 w-4 mr-2" /> Download SOAP Notes</Button>
                </div>

                {/* Patient Summary Card */}
                <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                    <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-xl">
                        <CardTitle className="text-xl font-bold flex items-center gap-3">
                            <User className="h-6 w-6" /> {patientData.patient_name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100">
                                <p className="text-gray-500 font-medium">Age/Gender</p>
                                <p className="font-black text-gray-900 dark:text-white uppercase">{calculateAge(patientData.dob)} yrs / {patientData.gender}</p>
                            </div>
                            <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100">
                                <p className="text-gray-500 font-medium">Blood Group</p>
                                <p className="font-black text-gray-900 dark:text-white uppercase">{patientData.blood_group || 'N/A'}</p>
                            </div>
                            <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100">
                                <p className="text-gray-500 font-medium">Contact</p>
                                <p className="font-black text-gray-900 dark:text-white uppercase">{patientData.contact_info || 'N/A'}</p>
                            </div>
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100">
                                <p className="text-gray-500 font-medium">Insurance</p>
                                <p className="font-black text-gray-900 dark:text-white uppercase truncate">{patientData.insurance_provider || 'Self Pay'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tab Navigation */}
                <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                    <div className="p-2 border-b border-gray-100 flex gap-2 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => tab === "Gallery" ? navigate(`/patient-gallery?patientId=${patientId}`) : setActiveTab(tab)}
                                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-500 hover:bg-gray-100"}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <CardContent className="p-6">
                        {/* Tab Content Mapping */}
                        {activeTab === "Appointments" && (
                            <div className="space-y-4">
                                {consultations.length > 0 ? consultations.map((consultation, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100">
                                        <div className="flex gap-4 items-center">
                                            <div className="p-2.5 bg-white dark:bg-gray-700 rounded-xl shadow-sm"><CalendarDays className="h-5 w-5 text-blue-600" /></div>
                                            <div>
                                                <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Dr. {consultation.staff?.staff_name}</p>
                                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{formatDate(consultation.consultation_date)} @ {formatTime(consultation.consultation_start_time)}</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-200">Completed</span>
                                    </div>
                                )) : <p className="text-center py-10 text-gray-400 font-bold uppercase tracking-widest text-xs">No Records</p>}
                            </div>
                        )}

                        {activeTab === "SOAP Notes" && (
                            <div className="space-y-6">
                                {consultations.length > 0 ? consultations.map((consultation, i) => (
                                    <Card key={i} className="border-0 shadow-sm bg-blue-50/30 dark:bg-blue-900/5 rounded-2xl">
                                        <CardHeader className="border-b border-blue-100/30 p-4">
                                            <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-blue-700">
                                                <FileText className="h-4 w-4" /> {formatDate(consultation.consultation_date)} - Review
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 grid md:grid-cols-2 gap-4">
                                            {['Subjective', 'Objective', 'Assessment', 'Plan'].map(key => (
                                                <div key={key} className="space-y-1">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{key}</p>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">{consultation[key.toLowerCase()] || 'N/A'}</p>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                )) : <p className="text-center py-10 text-gray-400 font-bold uppercase tracking-widest text-xs">No Clinical Notes</p>}
                            </div>
                        )}

                        {activeTab === "Lab Results" && (
                            <div className="space-y-4">
                                {loadingLabs ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                                        <p className="text-sm font-bold text-gray-500 animate-pulse uppercase tracking-widest tracking-widest">Loading Lab Records...</p>
                                    </div>
                                ) : labOrders.length > 0 ? (
                                    labOrders.map((lab) => {
                                        const canReview = lab.report_file_url && lab.status === 'completed' && doctorStatus;
                                        const canToggleSample = lab.status !== 'reviewed';

                                        return (
                                            <Card key={lab.id} className="group border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 border-l-4 border-blue-400 overflow-hidden">
                                                <CardContent className="p-0">
                                                    <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                        <div className="flex items-start gap-4 flex-1">
                                                            <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300">
                                                                <FlaskConical className="h-7 w-7" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-bold text-lg text-gray-900 dark:text-white uppercase tracking-tight">{lab.test_name}</h4>
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                                                                        lab.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                        lab.status === 'reviewed' ? 'bg-gray-100 text-gray-400' :
                                                                        lab.status === 'sample_collected' ? 'bg-amber-100 text-amber-700' :
                                                                        'bg-blue-100 text-blue-600'
                                                                    }`}>
                                                                        {(lab.status || 'ORDERED').replace('_', ' ')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-400 font-medium font-bold uppercase tracking-wider">
                                                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(lab.created_at).toLocaleDateString()}</span>
                                                                    <span className="flex items-center gap-1"><UserCircle2 className="h-3 w-3" /> Ordered by {lab.created_by_staff?.staff_name || 'Medical Team'}</span>
                                                                </div>
                                                                {lab.doctor_notes && (
                                                                    <div className="mt-3 p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                                                                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1 shadow-sm inline-block px-1 bg-white dark:bg-gray-800 rounded">Physician Interpretation</p>
                                                                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic">"{lab.doctor_notes}"</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {/* Only show Upload to Clinicians/Lab Staff, hide from Admins */}
                                                            {!lab.report_file_url ? (
                                                                (doctorStatus || labStaffStatus) && (
                                                                    <div className="relative">
                                                                        <input type="file" id={`upload-${lab.id}`} className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleUploadReport(lab.id, e.target.files[0])} />
                                                                        <label htmlFor={`upload-${lab.id}`} className={`flex items-center gap-2 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest h-11 px-5 rounded-xl cursor-pointer hover:bg-highlight active:scale-95 transition-all ${uploadingLabId === lab.id ? 'opacity-50' : ''}`}>
                                                                            {uploadingLabId === lab.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload Results
                                                                        </label>
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <Button variant="outline" onClick={() => window.open(lab.report_file_url, '_blank')} className="h-11 px-6 rounded-xl text-blue-600 font-black uppercase text-[10px] tracking-widest border-blue-100 active:scale-95 transition-all">
                                                                    <Eye className="h-4 w-4 mr-2" /> View Report
                                                                </Button>
                                                            )}
                                                            {/* Management Dropdown (⋮) - Hidden from Admins, visible to Doctor/LabStaff in actionable states */}
                                                            {(doctorStatus || labStaffStatus) && (lab.status === 'ordered' || (lab.status === 'completed' && doctorStatus)) && (
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                                                            <MoreVertical className="h-5 w-5 text-gray-400" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-2xl border-0 dark:bg-gray-900 bg-white">
                                                                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 py-2">Lifecycle Actions</DropdownMenuLabel>
                                                                        <DropdownMenuSeparator className="bg-gray-50 dark:bg-gray-800" />
                                                                        
                                                                        {lab.status === 'ordered' && (
                                                                            <>
                                                                                <DropdownMenuItem 
                                                                                    onClick={() => handleStatusUpdate(lab.id, 'sample_collected')} 
                                                                                    className="flex items-center gap-3 py-3 px-3 cursor-pointer focus:bg-amber-50 rounded-xl font-bold transition-all"
                                                                                >
                                                                                    <Droplet className="h-4 w-4 text-amber-600" /> 
                                                                                    Mark Sample Taken
                                                                                </DropdownMenuItem>
                                                                                {doctorStatus && (
                                                                                    <>
                                                                                        <DropdownMenuSeparator className="bg-gray-50 dark:bg-gray-800" />
                                                                                        <DropdownMenuItem 
                                                                                            onClick={() => { 
                                                                                                setLabToRetract(lab); 
                                                                                                setConfirmRetractOpen(true); 
                                                                                            }} 
                                                                                            className="flex items-center gap-3 py-3 px-3 cursor-pointer text-red-600 focus:bg-red-50 rounded-xl font-bold transition-all"
                                                                                        >
                                                                                            <Trash2 className="h-4 w-4" /> 
                                                                                            Retract Order
                                                                                        </DropdownMenuItem>
                                                                                    </>
                                                                                )}
                                                                            </>
                                                                        )}

                                                                        {lab.status === 'completed' && doctorStatus && (
                                                                            <DropdownMenuItem 
                                                                                onClick={() => { 
                                                                                    setReviewingLab(lab); 
                                                                                    setReviewNotes(""); 
                                                                                    setShowReviewModal(true); 
                                                                                }} 
                                                                                className="flex items-center gap-3 py-3 px-3 cursor-pointer focus:bg-green-50 rounded-xl font-bold transition-all"
                                                                            >
                                                                                <CheckCircle className="h-4 w-4 text-green-600" /> 
                                                                                Sign Off & Review
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })
                                ) : <p className="text-center py-10 text-gray-400 font-bold uppercase tracking-widest text-xs">No Clinical Lab Records</p>}

                                {/* Retract Confirmation Modal */}
                                <Dialog open={confirmRetractOpen} onOpenChange={setConfirmRetractOpen}>
                                    <DialogContent className="sm:max-w-md rounded-3xl p-6 border-0 shadow-2xl bg-white dark:bg-gray-900">
                                        <DialogHeader>
                                            <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4"><AlertCircle className="h-8 w-8 animate-pulse" /></div>
                                            <DialogTitle className="text-center text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Retract Lab Order?</DialogTitle>
                                            <DialogDescription className="text-center font-bold text-gray-500 pt-2 leading-relaxed">This will permanently cancel <span className="text-orange-600">"{labToRetract?.test_name}"</span>. This action is irreversible once recorded.</DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-8">
                                            <Button variant="ghost" onClick={() => setConfirmRetractOpen(false)} className="flex-1 rounded-2xl h-12 font-black text-gray-400">Keep Order</Button>
                                            <Button onClick={confirmRetract} disabled={retracting} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-2xl h-12 font-black shadow-lg shadow-red-200">{retracting ? <Loader2 className="h-4 w-4 animate-spin" /> : "YES, RETRACT NOW"}</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}

                        {activeTab === "Medications" && (
                            <div className="space-y-4">
                                {consultations.flatMap(c => c.prescriptions || []).length > 0 ? consultations.map(c => c.prescriptions?.map((med, i) => (
                                    <div key={i} className="p-4 bg-emerald-50/20 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100/50 flex items-start gap-4">
                                        <div className="p-2.5 bg-white dark:bg-emerald-800 rounded-xl shadow-sm"><Pill className="h-5 w-5 text-emerald-600" /></div>
                                        <div>
                                            <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{med.medicine_name}</p>
                                            <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest">{med.dosage} | {med.frequency} | {med.duration}</p>
                                        </div>
                                    </div>
                                ))) : <p className="text-center py-10 text-gray-400 font-bold uppercase tracking-widest text-xs">No Prescriptions</p>}
                            </div>
                        )}

                        {activeTab === "Diet Plans" && (
                            <div className="space-y-4">
                                {dietPlans.length > 0 ? dietPlans.map((plan, i) => (
                                    <Card key={i} className="border-0 shadow-lg bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
                                        <CardHeader className="bg-emerald-500 text-white p-4">
                                            <CardTitle className="text-sm font-black uppercase tracking-widest flex gap-2"><Utensils className="h-4 w-4" /> Healthy Nutrition Plan</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-5 grid grid-cols-2 md:grid-cols-5 gap-3">
                                            {['morning', 'breakfast', 'lunch', 'snack', 'dinner'].map(time => (
                                                <div key={time} className="p-3 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100">
                                                    <p className="text-[9px] font-black text-emerald-600 uppercase mb-1 tracking-tighter">{time}</p>
                                                    <p className="text-xs text-gray-700 dark:text-gray-300 font-bold leading-tight">{plan.plan_data?.[time] || 'N/A'}</p>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                )) : <p className="text-center py-10 text-gray-400 font-bold uppercase tracking-widest text-xs">No Diet Charts</p>}
                            </div>
                        )}

                        {activeTab === "Allergies & Notes" && (
                            <div className="space-y-4">
                                <Card className="border-0 shadow-sm bg-rose-50/30 dark:bg-rose-900/10 rounded-2xl p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <AlertCircle className="h-5 w-5 text-rose-600" />
                                        <p className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-sm">Active Allergies</p>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{patientData.allergies || 'No known allergies reported.'}</p>
                                </Card>
                                <Card className="border-0 shadow-sm bg-indigo-50/30 dark:bg-indigo-900/10 rounded-2xl p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <FileText className="h-5 w-5 text-indigo-600" />
                                        <p className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-sm">Medical History</p>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{patientData.medical_history || 'No medical history recorded.'}</p>
                                </Card>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Review Modal */}
            {showReviewModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setShowReviewModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 bg-indigo-50/50 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black text-indigo-700 uppercase tracking-tighter">Clinical Report Review</h3>
                                <p className="text-xs text-indigo-500 font-bold uppercase tracking-widest">{reviewingLab?.test_name}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowReviewModal(false)}><X className="h-5 w-5" /></Button>
                        </div>
                        <div className="p-6 space-y-4">
                            <textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} placeholder="Type clinical interpretation here..." className="w-full h-32 border border-gray-200 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-gray-50/30" />
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-end gap-3 rounded-b-3xl">
                            <Button variant="ghost" onClick={() => setShowReviewModal(false)} className="font-bold text-gray-400">Discard</Button>
                            <Button onClick={handleMarkAsReviewed} disabled={isSavingReview || !reviewNotes.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs px-6 rounded-xl shadow-lg">
                                {isSavingReview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />} Sign & Finish
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <CopilotPanel isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} patientId={patientId} />
        </div>
    );
};

export default DoctorPatientRecord;
