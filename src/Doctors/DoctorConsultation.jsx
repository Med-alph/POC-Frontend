import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { User, ClipboardList, Activity, Stethoscope, Pill, FlaskConical, Play, StopCircle, XCircle, Clock } from "lucide-react";
import appointmentsAPI from "../API/AppointmentsAPI";
import consultationsAPI from "../API/ConsultationsAPI";
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

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

    // Fetch appointment details
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
                
                // Check if consultation already started
                if (response.status === 'in-progress' && response.actual_start_time) {
                    setIsConsultationStarted(true);
                    setConsultationStartTime(new Date(response.actual_start_time));
                }
                
                toast.success("Appointment loaded successfully!");
            } catch (err) {
                console.error("Failed to fetch appointment details:", err);
                toast.error(`Failed to load: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointmentDetails();
    }, [appointmentId]);

    // Timer for consultation duration
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

    // START CONSULTATION
    const handleStartConsultation = async () => {
        try {
            const startTime = new Date();
            
            // Update appointment status to in-progress
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

    // END & SAVE CONSULTATION
    const handleEndConsultation = async () => {
        // Validation
        if (!soapNotes.subjective && !soapNotes.objective && !soapNotes.assessment && !soapNotes.plan) {
            toast.error("Please fill in at least one SOAP note section");
            return;
        }

        try {
            setIsSaving(true);
            const endTime = new Date();
            const actualDuration = Math.floor((endTime - consultationStartTime) / 60000); // minutes
            
            // Prepare consultation data
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

            // Save consultation (this will save to all 3 tables)
            await consultationsAPI.create(consultationData);
            
            // Update appointment status to fulfilled
            await appointmentsAPI.update(appointmentId, {
                status: 'fulfilled',
                actual_end_time: endTime.toISOString(),
                actual_duration: actualDuration,
            });
            
            toast.success("Consultation completed and saved successfully!");
            
            // Navigate back after 2 seconds
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

    // CANCEL APPOINTMENT
    const handleCancelAppointment = async () => {
        if (!cancellationReason.trim()) {
            toast.error("Please provide a cancellation reason");
            return;
        }

        try {
            await appointmentsAPI.update(appointmentId, {
                status: 'cancelled',
                cancelled_by: 'doctor',
                cancellation_reason: cancellationReason,
                cancelled_at: new Date().toISOString(),
            });
            
            setAppointmentData(prev => ({
                ...prev,
                status: 'cancelled',
            }));
            
            toast.success("Appointment cancelled");
            setShowCancelModal(false);
            
            // Navigate back after 2 seconds
            setTimeout(() => {
                window.history.back();
            }, 2000);
        } catch (err) {
            console.error("Failed to cancel appointment:", err);
            toast.error("Failed to cancel appointment");
        }
    };

    const handleSoapChange = (field, value) =>
        setSoapNotes((prev) => ({ ...prev, [field]: value }));

    const addPrescription = () =>
        setPrescriptions([...prescriptions, { medicine_name: "", dosage: "", frequency: "", duration: "" }]);

    const addLabOrder = () =>
        setLabOrders([...labOrders, { test_name: "", instructions: "" }]);

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
            case 'booked':
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

    const canStartConsultation = ['booked', 'arrived'].includes(appointmentData.status?.toLowerCase());
    const canEndConsultation = appointmentData.status?.toLowerCase() === 'in-progress';
    const canCancelAppointment = !['fulfilled', 'completed', 'cancelled', 'in-progress'].includes(appointmentData.status?.toLowerCase());
    const isCompleted = ['fulfilled', 'completed'].includes(appointmentData.status?.toLowerCase());
    const isCancelled = appointmentData.status?.toLowerCase() === 'cancelled';

    return (
        <div className="min-h-screen bg-gray-50 p-6 space-y-6">
            {/* Consultation Timer Bar */}
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

            {/* Patient Header */}
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

            {/* Action Buttons */}
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
                    
                    {canCancelAppointment && (
                        <button 
                            onClick={() => setShowCancelModal(true)}
                            className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                            <XCircle className="h-4 w-4" />
                            Cancel Appointment
                        </button>
                    )}
                </div>
            )}

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

            {/* SOAP Notes Section */}
            <div className={`bg-white shadow rounded-lg p-5 ${!isConsultationStarted && !isCompleted ? 'opacity-60 pointer-events-none' : ''}`}>
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 mb-3">
                    <Stethoscope className="h-5 w-5 text-blue-500" /> Consultation Notes (SOAP)
                    {!isConsultationStarted && !isCompleted && (
                        <span className="text-xs text-gray-500 font-normal ml-2">(Start consultation to edit)</span>
                    )}
                </h2>

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

            {/* Prescription Section */}
            <div className={`bg-white shadow rounded-lg p-5 ${!isConsultationStarted && !isCompleted ? 'opacity-60 pointer-events-none' : ''}`}>
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 mb-3">
                    <Pill className="h-5 w-5 text-blue-500" /> Prescriptions
                </h2>

                {prescriptions.map((pres, index) => (
                    <div key={index} className="grid md:grid-cols-4 gap-3 mb-3">
                        <input
                            type="text"
                            placeholder="Medicine Name"
                            className="border p-2 rounded-md text-sm"
                            value={pres.medicine_name}
                            onChange={(e) => {
                                const updated = [...prescriptions];
                                updated[index].medicine_name = e.target.value;
                                setPrescriptions(updated);
                            }}
                            disabled={!isConsultationStarted || isCompleted}
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
                            >
                                Close
                            </button>
                            <button
                                onClick={handleCancelAppointment}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Confirm Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorConsultation;
