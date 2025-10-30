import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CalendarDays, FileText, Activity, Stethoscope, AlertCircle, X, Download, ArrowLeft } from "lucide-react";

import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import consultationsAPI from "../../api/ConsultationsAPI";

const tabs = ["Appointments", "SOAP Notes", "Medications", "Lab Results", "Allergies & Notes"];

const DoctorPatientRecord = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(tabs[0]);
    const [loading, setLoading] = useState(true);
    const [patientData, setPatientData] = useState(null);
    const [consultations, setConsultations] = useState([]);
    const [appointments, setAppointments] = useState([]);

    useEffect(() => {
        fetchPatientRecords();
    }, [patientId]);

    const fetchPatientRecords = async () => {
        try {
            setLoading(true);

            let consultationsData = [];
            let actualPatientId = patientId;

            console.log("Fetching consultations for patient:", patientId);

            // Fetch all consultations for patient
            if (actualPatientId) {
                consultationsData = await consultationsAPI.getByPatient(actualPatientId);
                console.log("Consultations response:", consultationsData);

                if (consultationsData && consultationsData.length > 0) {
                    // Try to get patient from consultation
                    if (consultationsData[0].patient) {
                        setPatientData(consultationsData[0].patient);
                    } else {
                        // If patient relation not loaded, fetch patient separately
                        console.log("Patient not in consultation, creating from data...");
                        // Create patient object from consultation data
                        setPatientData({
                            id: consultationsData[0].patient_id,
                            patient_name: "Patient", // You might need to fetch this separately
                            contact_info: "N/A",
                            // Add other fields as needed
                        });
                    }
                    setConsultations(consultationsData);
                    toast.success("Patient records loaded");
                } else {
                    console.log("No consultations found");
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
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600">Loading patient records...</p>
                </div>
            </div>
        );
    }

    if (!patientData) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lg text-gray-600">No patient records found</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto bg-white shadow rounded-lg p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{patientData.patient_name}</h1>
                            <p className="text-gray-600">
                                {patientData.age || calculateAge(patientData.dob)} yrs / {patientData.gender || 'N/A'} |
                                Blood Type: {patientData.blood_type || 'N/A'}
                            </p>
                            <p className="text-gray-600 mt-1">Contact: {patientData.contact_info || 'N/A'}</p>
                            {patientData.email && (
                                <p className="text-gray-600">Email: {patientData.email}</p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={downloadAllSOAPNotes}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        disabled={consultations.length === 0}
                    >
                        <Download className="h-4 w-4" />
                        Download SOAP Notes
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-4">
                    <nav className="-mb-px flex space-x-4">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm ${activeTab === tab
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === "Appointments" && (
                        <div className="space-y-3">
                            {consultations.length > 0 ? (
                                consultations.map((consultation, i) => (
                                    <div key={i} className="p-3 border rounded-md flex justify-between items-center hover:shadow-md transition">
                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                Consultation with Dr. {consultation.staff?.staff_name || 'Unknown'}
                                            </p>
                                            <p className="text-gray-500 text-sm">
                                                {formatDate(consultation.consultation_date)} at {formatTime(consultation.consultation_start_time)}
                                            </p>
                                            <p className="text-gray-500 text-sm">
                                                Duration: {consultation.duration_minutes || 'N/A'} minutes
                                            </p>
                                        </div>
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                            {consultation.status}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-4">No consultations found</p>
                            )}
                        </div>
                    )}

                    {activeTab === "SOAP Notes" && (
                        <div className="space-y-4">
                            {consultations.length > 0 ? (
                                consultations.map((consultation, i) => (
                                    <div key={i} className="p-4 border rounded-md hover:shadow-md transition">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-semibold text-gray-800">
                                                    {formatDate(consultation.consultation_date)} - Dr. {consultation.staff?.staff_name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Duration: {consultation.duration_minutes} minutes
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm font-semibold text-blue-600">Subjective:</p>
                                                <p className="text-sm text-gray-700 ml-2">
                                                    {consultation.subjective || 'Not recorded'}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-semibold text-blue-600">Objective:</p>
                                                <p className="text-sm text-gray-700 ml-2">
                                                    {consultation.objective || 'Not recorded'}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-semibold text-blue-600">Assessment:</p>
                                                <p className="text-sm text-gray-700 ml-2">
                                                    {consultation.assessment || 'Not recorded'}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-semibold text-blue-600">Plan:</p>
                                                <p className="text-sm text-gray-700 ml-2">
                                                    {consultation.plan || 'Not recorded'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-4">No SOAP notes found</p>
                            )}
                        </div>
                    )}

                    {activeTab === "Medications" && (
                        <div className="space-y-3">
                            {consultations.flatMap(c => c.prescriptions || []).length > 0 ? (
                                consultations.map((consultation) =>
                                    consultation.prescriptions?.map((med, i) => (
                                        <div key={`${consultation.id}-${i}`} className="p-3 border rounded-md hover:shadow-md transition">
                                            <p className="font-semibold text-gray-800">{med.medicine_name}</p>
                                            <p className="text-gray-500 text-sm">
                                                {med.dosage} | {med.frequency} | {med.duration}
                                            </p>
                                            {med.instructions && (
                                                <p className="text-gray-500 text-sm">Notes: {med.instructions}</p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-1">
                                                Prescribed on {formatDate(consultation.consultation_date)}
                                            </p>
                                        </div>
                                    ))
                                )
                            ) : (
                                <p className="text-gray-500 text-center py-4">No medications prescribed</p>
                            )}
                        </div>
                    )}

                    {activeTab === "Lab Results" && (
                        <div className="space-y-3">
                            {consultations.flatMap(c => c.lab_orders || []).length > 0 ? (
                                consultations.map((consultation) =>
                                    consultation.lab_orders?.map((lab, i) => (
                                        <div key={`${consultation.id}-${i}`} className="p-3 border rounded-md hover:shadow-md transition flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-gray-800">{lab.test_name}</p>
                                                <p className="text-gray-500 text-sm">
                                                    Ordered on {formatDate(consultation.consultation_date)}
                                                </p>
                                                {lab.instructions && (
                                                    <p className="text-gray-500 text-sm">Instructions: {lab.instructions}</p>
                                                )}
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${lab.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                    lab.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {lab.status}
                                            </span>
                                        </div>
                                    ))
                                )
                            ) : (
                                <p className="text-gray-500 text-center py-4">No lab orders found</p>
                            )}
                        </div>
                    )}

                    {activeTab === "Allergies & Notes" && (
                        <div className="space-y-3">
                            <div className="p-3 border rounded-md">
                                <p className="font-semibold text-gray-800 flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                    Allergies
                                </p>
                                {patientData.allergies ? (
                                    <ul className="list-disc list-inside text-gray-500 mt-2">
                                        {patientData.allergies.split(',').map((allergy, i) => (
                                            <li key={i} className="text-red-600">{allergy.trim()}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500 mt-2">No known allergies</p>
                                )}
                            </div>

                            <div className="p-3 border rounded-md">
                                <p className="font-semibold text-gray-800">Medical History</p>
                                {patientData.medical_history ? (
                                    <p className="text-gray-500 mt-2">{patientData.medical_history}</p>
                                ) : (
                                    <p className="text-gray-500 mt-2">No medical history recorded</p>
                                )}
                            </div>

                            <div className="p-3 border rounded-md">
                                <p className="font-semibold text-gray-800">Insurance Information</p>
                                <p className="text-gray-500 mt-2">
                                    Provider: {patientData.insurance_provider || 'N/A'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoctorPatientRecord;
