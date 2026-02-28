import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { CalendarDays, FileText, Activity, Stethoscope, AlertCircle, X, Download, ArrowLeft, User, Phone, Mail, Droplet, Clock, Pill, FlaskConical, Heart, GalleryThumbnails, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import consultationsAPI from "../../api/consultationsapi";
import CopilotPanel from "@/components/CopilotPanel";
import { PatientProcedures } from "../../modules/procedure/pages/PatientProcedures";

const tabs = ["Appointments", "SOAP Notes", "Medications", "Lab Results", "Allergies & Notes", 'Gallery', 'Procedures'];

const DoctorPatientRecord = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(tabs[0]);
    
    // Check if navigation state contains activeTab
    useEffect(() => {
        if (location.state?.activeTab && tabs.includes(location.state.activeTab)) {
            setActiveTab(location.state.activeTab);
            // Clear the state to avoid re-applying on re-renders
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);
    const [loading, setLoading] = useState(true);
    const [patientData, setPatientData] = useState(null);
    const [consultations, setConsultations] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [isCopilotOpen, setIsCopilotOpen] = useState(false);

    useEffect(() => {
        fetchPatientRecords();
    }, [patientId]);

    const fetchPatientRecords = async () => {
        try {
            setLoading(true);

            if (patientId) {
                const response = await consultationsAPI.getByPatient(patientId); // now returns { patient, consultations }

                if (response.patient) {
                    setPatientData(response.patient);
                } else {
                    setPatientData(null); // or empty object to handle no patient found
                }

                if (response.consultations && response.consultations.length > 0) {
                    setConsultations(response.consultations);
                    toast.success("Patient records loaded");
                } else {
                    setConsultations([]); // no consultations but patient data present
                    toast.info("No consultation records found");
                }
            }
        } catch (err) {
            console.error("Failed to fetch patient records:", err);
            toast.error(`Failed to load patient records: ${err.message}`);
        } finally {
            setLoading(false);
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
        const bottomMargin = 56; // reserve footer space
        const contentBottomLimit = pageHeight - bottomMargin - 10; // additional space for safety

        // Helper: Render footer at bottom, non-overlapping, only doctor name or department
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


        // Doctor's display name: prefer name, else department, avoid qualifications/specialty if not present
        const staff = consultations?.[0]?.staff || {};
        let doctorDisplayName = staff.staff_name || staff.department || '________________';
        const department = staff.department || null;

        // Header section
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('Patient Medical Records - SOAP Notes', 14, 20);

        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Patient: ${patientData?.patient_name || 'N/A'}`, 14, 30);
        doc.text(
            `Age: ${patientData?.age || calculateAge(patientData?.dob) || 'N/A'} | Gender: ${patientData?.gender || 'N/A'}`,
            14, 37
        );
        doc.text(`Contact: ${patientData?.contact_info || 'N/A'}`, 14, 44);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 51);

        doc.line(14, 55, 196, 55);

        addFooter(doc, doctorDisplayName, department);

        let yPosition = 65;

        consultations.forEach((consultation, index) => {
            // Respect content bottom limit to prevent overlap
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

            if (consultation.prescriptions && consultation.prescriptions.length > 0) {
                if (yPosition > contentBottomLimit - 20) {
                    doc.addPage();
                    addFooter(doc, doctorDisplayName, department);
                    yPosition = 20;
                }
                doc.setFont(undefined, 'bold');
                doc.text('Prescriptions:', 14, yPosition);
                yPosition += 7;
                consultation.prescriptions.forEach((rx) => {
                    doc.setFont(undefined, 'normal');
                    doc.text(
                        `• ${rx.medicine_name} - ${rx.dosage}, ${rx.frequency}, ${rx.duration}`,
                        20, yPosition
                    );
                    yPosition += 5;
                });
                yPosition += 5;
            }

            if (consultation.lab_orders && consultation.lab_orders.length > 0) {
                if (yPosition > contentBottomLimit - 20) {
                    doc.addPage();
                    addFooter(doc, doctorDisplayName, department);
                    yPosition = 20;
                }
                doc.setFont(undefined, 'bold');
                doc.text('Lab Orders:', 14, yPosition);
                yPosition += 7;
                consultation.lab_orders.forEach((lab) => {
                    doc.setFont(undefined, 'normal');
                    doc.text(
                        `• ${lab.test_name} - ${lab.instructions || 'No instructions'}`,
                        20, yPosition
                    );
                    yPosition += 5;
                });
                yPosition += 5;
            }

            doc.setDrawColor(200, 200, 200);
            doc.line(14, yPosition, 196, yPosition);
            yPosition += 10;
            doc.setDrawColor(0, 0, 0);
        });

        // Ensure footer appears (re-draw) on every page
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            addFooter(doc, doctorDisplayName, department);
        }

        doc.save(`${patientData?.patient_name || 'Patient'}_SOAP_Notes_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success("SOAP notes downloaded successfully");
    };



    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 flex items-center justify-center">
                <Card className="shadow-xl border-0 rounded-2xl p-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                        <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">Loading patient records...</p>
                    </div>
                </Card>
            </div>
        );
    }

    if (!patientData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 flex items-center justify-center">
                <Card className="shadow-xl border-0 rounded-2xl p-8">
                    <div className="text-center">
                        <Stethoscope className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-lg text-gray-600 dark:text-gray-400 font-medium mb-4">No patient records found</p>
                        <Button
                            onClick={() => navigate(-1)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go Back
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 lg:p-8 transition-all">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="mb-6">
                    {/* <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg mb-4">
                        <Stethoscope className="h-6 w-6" />
                        <span className="text-sm font-semibold">Patient Medical Records</span>
                    </div> */}
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            onClick={() => navigate(-1)}
                            variant="outline"
                            className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <Button
                            onClick={() => setIsCopilotOpen(true)}
                            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                        >
                            <Sparkles className="h-4 w-4" />
                            AI Insights
                        </Button>
                        <Button
                            onClick={downloadAllSOAPNotes}
                            disabled={consultations.length === 0}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Download SOAP Notes
                        </Button>
                    </div>
                </div>

                {/* Patient Info Card */}
                <Card className="shadow-xl border-0 rounded-2xl overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-500 text-white p-6">
                        <CardTitle className="text-2xl font-bold flex items-center gap-3">
                            <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                <User className="h-6 w-6" />
                            </div>
                            {patientData.patient_name || 'Unknown Patient'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Age / Gender</p>
                                </div>
                                <p className="font-bold text-gray-900 dark:text-white">
                                    {patientData.age || calculateAge(patientData.dob)} yrs / {patientData.gender || 'N/A'}
                                </p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <Droplet className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Blood Type</p>
                                </div>
                                <p className="font-bold text-gray-900 dark:text-white">
                                    {patientData.blood_type || 'N/A'}
                                </p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Contact</p>
                                </div>
                                <p className="font-bold text-gray-900 dark:text-white">
                                    {patientData.contact_info || 'N/A'}
                                </p>
                            </div>
                            {patientData.email && (
                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Mail className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Email</p>
                                    </div>
                                    <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
                                        {patientData.email}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Card className="shadow-xl border-0 rounded-2xl overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-4 border-b border-gray-200 dark:border-gray-600">
                        <nav className="flex space-x-2 overflow-x-auto scrollbar-hide">
                            {tabs.map((tab) => {
                                const tabIcons = {
                                    "Appointments": CalendarDays,
                                    "SOAP Notes": FileText,
                                    "Medications": Pill,
                                    "Lab Results": FlaskConical,
                                    "Allergies & Notes": AlertCircle,
                                    "Gallery": GalleryThumbnails,
                                    "Procedures": Stethoscope,
                                };
                                const Icon = tabIcons[tab] || FileText;
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => {
                                            if (tab == "Gallery") {
                                                navigate(`/patient-gallery?patientId=${patientId}`)
                                            }
                                            setActiveTab(tab)
                                        }}
                                        className={`whitespace-nowrap flex items-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm transition-all ${activeTab === tab
                                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                            }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {tab}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <CardContent className="p-6">
                        {activeTab === "Appointments" && (
                            <div className="space-y-4">
                                {consultations.length > 0 ? (
                                    consultations.map((consultation, i) => (
                                        <Card key={i} className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                                            <CardContent className="p-5">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                                <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-lg text-gray-900 dark:text-white">
                                                                    Consultation with Dr. {consultation.staff?.staff_name || 'Unknown'}
                                                                </p>
                                                                <div className="flex items-center gap-4 mt-1">
                                                                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                                                        <Clock className="h-4 w-4" />
                                                                        {formatDate(consultation.consultation_date)} at {formatTime(consultation.consultation_start_time)}
                                                                    </div>
                                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                                        Duration: {consultation.duration_minutes || 'N/A'} min
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700">
                                                        {consultation.status?.toUpperCase() || 'COMPLETED'}
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <CalendarDays className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-500 dark:text-gray-400">No consultations found</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "SOAP Notes" && (
                            <div className="space-y-4">
                                {consultations.length > 0 ? (
                                    consultations.map((consultation, i) => (
                                        <Card key={i} className="border-0 shadow-md hover:shadow-xl transition-all duration-300">
                                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                            {formatDate(consultation.consultation_date)} - Dr. {consultation.staff?.staff_name}
                                                        </CardTitle>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                            Duration: {consultation.duration_minutes} minutes
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-5 space-y-4">
                                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                                                    <p className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-2">Subjective:</p>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                                        {consultation.subjective || 'Not recorded'}
                                                    </p>
                                                </div>

                                                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                                                    <p className="text-sm font-bold text-green-700 dark:text-green-400 mb-2">Objective:</p>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                                        {consultation.objective || 'Not recorded'}
                                                    </p>
                                                </div>

                                                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                                                    <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400 mb-2">Assessment:</p>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                                        {consultation.assessment || 'Not recorded'}
                                                    </p>
                                                </div>

                                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                                                    <p className="text-sm font-bold text-purple-700 dark:text-purple-400 mb-2">Plan:</p>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                                        {consultation.plan || 'Not recorded'}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-500 dark:text-gray-400">No SOAP notes found</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "Medications" && (
                            <div className="space-y-4">
                                {consultations.flatMap(c => c.prescriptions || []).length > 0 ? (
                                    consultations.map((consultation) =>
                                        consultation.prescriptions?.map((med, i) => (
                                            <Card key={`${consultation.id}-${i}`} className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                                                <CardContent className="p-5">
                                                    <div className="flex items-start gap-3">
                                                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                                            <Pill className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-bold text-lg text-gray-900 dark:text-white mb-2">{med.medicine_name}</p>
                                                            <div className="flex flex-wrap gap-2 mb-2">
                                                                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">
                                                                    {med.dosage}
                                                                </span>
                                                                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-semibold">
                                                                    {med.frequency}
                                                                </span>
                                                                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-semibold">
                                                                    {med.duration}
                                                                </span>
                                                            </div>
                                                            {med.instructions && (
                                                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                                                    <span className="font-semibold">Instructions:</span> {med.instructions}
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                Prescribed on {formatDate(consultation.consultation_date)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )
                                ) : (
                                    <div className="text-center py-12">
                                        <Pill className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-500 dark:text-gray-400">No medications prescribed</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "Lab Results" && (
                            <div className="space-y-4">
                                {consultations.flatMap(c => c.lab_orders || []).length > 0 ? (
                                    consultations.map((consultation) =>
                                        consultation.lab_orders?.map((lab, i) => (
                                            <Card key={`${consultation.id}-${i}`} className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20">
                                                <CardContent className="p-5">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-start gap-3 flex-1">
                                                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                                                <FlaskConical className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-bold text-lg text-gray-900 dark:text-white mb-2">{lab.test_name}</p>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                                    Ordered on {formatDate(consultation.consultation_date)}
                                                                </p>
                                                                {lab.instructions && (
                                                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                                                        <span className="font-semibold">Instructions:</span> {lab.instructions}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${lab.status === 'completed'
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700'
                                                            : lab.status === 'in_progress'
                                                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700'
                                                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                                                            }`}>
                                                            {lab.status?.toUpperCase() || 'PENDING'}
                                                        </span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )
                                ) : (
                                    <div className="text-center py-12">
                                        <FlaskConical className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-500 dark:text-gray-400">No lab orders found</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "Allergies & Notes" && (
                            <div className="space-y-4">
                                <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20">
                                    <CardContent className="p-5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                            </div>
                                            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">Allergies</CardTitle>
                                        </div>
                                        {patientData.allergies ? (
                                            <ul className="space-y-2">
                                                {patientData.allergies.split(',').map((allergy, i) => (
                                                    <li key={i} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700/50 rounded-lg border border-red-200 dark:border-red-800">
                                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                        <span className="text-red-700 dark:text-red-400 font-semibold">{allergy.trim()}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-gray-500 dark:text-gray-400">No known allergies</p>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                                    <CardContent className="p-5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">Medical History</CardTitle>
                                        </div>
                                        {patientData.medical_history ? (
                                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{patientData.medical_history}</p>
                                        ) : (
                                            <p className="text-gray-500 dark:text-gray-400">No medical history recorded</p>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                                    <CardContent className="p-5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                                <Heart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">Insurance Information</CardTitle>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300">
                                            <span className="font-semibold">Provider:</span> {patientData.insurance_provider || 'N/A'}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {activeTab === "Procedures" && (
                            <PatientProcedures patientId={patientId} />
                        )}


                    </CardContent>
                </Card>
            </div>

            {/* Copilot Panel */}
            <CopilotPanel
                isOpen={isCopilotOpen}
                onClose={() => setIsCopilotOpen(false)}
                patientId={patientId}
            />
        </div>
    );
};

export default DoctorPatientRecord;
