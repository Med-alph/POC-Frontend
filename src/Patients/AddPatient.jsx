import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import toast from 'react-hot-toast';
import PatientConsentModal from "@/components/compliance/PatientConsentModal";
import { complianceAPI } from "@/api/complianceapi";
import DataProtectionNotice from "@/components/compliance/DataProtectionNotice";
import StaffConsentRecording from "@/components/compliance/StaffConsentRecording";

export default function AddPatientDialog({ open, setOpen, onAdd, hospitalId, isSelfRegistration = false, onComplete }) {
    // Get hospital_id from localStorage user if not provided as prop
    const getUserHospitalId = () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return user.hospital_id || hospitalId;
        } catch (error) {
            console.error('Error parsing user from localStorage:', error);
            return hospitalId;
        }
    };

    // Get hospital name for consent modal
    const getHospitalName = () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return user.hospital_name || "this hospital";
        } catch (error) {
            return "this hospital";
        }
    };

    const [formData, setFormData] = useState({
        hospital_id: getUserHospitalId(),
        patient_name: "",
        dob: "",
        contact_info: "",
        email: "",
        address: "",
        emergency_contact: "",
        insurance_provider: "",
        insurance_number: "",
        medical_history: "",
        allergies: "",
        status: "active"
    });

    // Consent modal state
    const [showConsentModal, setShowConsentModal] = useState(false);
    const [pendingPatientData, setPendingPatientData] = useState(null);

    // Update hospital_id in form when prop changes
    useEffect(() => {
        const currentHospitalId = getUserHospitalId();
        setFormData(prev => ({ ...prev, hospital_id: currentHospitalId }));
    }, [hospitalId]);

    // Log formData on every change for debugging
    useEffect(() => {
        // console.log("Current formData:", formData);
    }, [formData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // console.log(`Input changed: ${name} = ${value}`);
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        // console.log(`Select changed: ${name} = ${value}`);
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // console.log('Submitting form data:', formData);

        // Basic validation with trimming to avoid whitespace only
        if (
            !formData.patient_name.trim() ||
            !formData.contact_info.trim() ||
            !formData.dob ||
            !formData.email.trim() ||
            !formData.address.trim()
        ) {
            toast.error("Please fill in all required fields (Name, DOB, Contact, Email, and Address)");
            return;
        }

        try {
            // Calculate age from date of birth
            const age = formData.dob
                ? Math.floor((new Date() - new Date(formData.dob)) / (365.25 * 24 * 60 * 60 * 1000))
                : null;

            const patientData = {
                ...formData,
                age,
                created_at: new Date().toISOString(),
                last_visit: null,
                next_appointment: null
            };

            // Store patient data and show staff consent recording modal
            setPendingPatientData(patientData);
            setShowConsentModal(true);

        } catch (error) {
            console.error('Error in form submission:', error);
            toast.error("Failed to prepare patient data. Please try again.");
        }
    };

    const handleConsentRecorded = async (consentData) => {
        if (!pendingPatientData) {
            toast.error("Patient data not found. Please try again.");
            return;
        }

        try {
            console.log('Creating patient with staff-recorded consent:', { patientData: pendingPatientData, consentData });

            // First create the patient
            const response = await onAdd(pendingPatientData);
            console.log('Patient creation response:', response);

            // Normalize the response to get the patient object with ID
            // Handle different API response structures (e.g., { patient: {...} } or { data: {...} })
            const createdPatient = response?.patient ?? response?.data ?? response;
            console.log('Normalized created patient:', createdPatient);

            // Then record consent for the created patient
            if (createdPatient && createdPatient.id) {
                if (isSelfRegistration) {
                    // For self-registration, we expect consent_types array or specific keys.
                    // PatientConsentModal returns an object with boolean keys for types.
                    const consentTypes = Array.isArray(consentData.consent_types)
                        ? consentData.consent_types
                        : Object.keys(consentData).filter(k => consentData[k] === true && k !== 'hospital_id' && k !== 'consent_version' && k !== 'consent_method');

                    await complianceAPI.recordSelfConsent(createdPatient.id, {
                        hospital_id: consentData.hospital_id || getUserHospitalId(),
                        consent_types: consentTypes
                    });
                } else {
                    await complianceAPI.recordStaffConsent(createdPatient.id, consentData);
                }

                console.log('Consent recorded successfully');
                toast.success("Patient created successfully with recorded consent!");
            }

            // Reset form and close modals
            setFormData({
                hospital_id: getUserHospitalId(),
                patient_name: "",
                dob: "",
                contact_info: "",
                email: "",
                address: "",
                emergency_contact: "",
                insurance_provider: "",
                insurance_number: "",
                medical_history: "",
                allergies: "",
                status: "active"
            });

            setPendingPatientData(null);
            setShowConsentModal(false);
            setOpen(false);

            if (onComplete) {
                // Pass normalized createdPatient but also preserve response if needed for tokens
                onComplete(response);
            }

        } catch (error) {
            console.error('Error creating patient with consent:', error);
            toast.error("Failed to create patient. Please try again.");
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-[600px] h-[85vh] sm:h-[90vh] flex flex-col modal-content">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle>Add New Patient</DialogTitle>
                    </DialogHeader>

                    {/* Data Protection Notice */}
                    <DataProtectionNotice context="patient" />

                    <div className="flex-1 overflow-y-auto mt-4 pr-2 scrollbar-thin">
                        <form id="patient-form" onSubmit={handleSubmit} className="space-y-4" noValidate>

                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="patient_name">Full Name *</Label>
                                        <Input
                                            id="patient_name"
                                            name="patient_name"
                                            placeholder="Enter patient's full name"
                                            value={formData.patient_name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="dob">Date of Birth *</Label>
                                        <Input
                                            id="dob"
                                            name="dob"
                                            type="date"
                                            value={formData.dob}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="contact_info">Contact Number *</Label>
                                        <Input
                                            id="contact_info"
                                            name="contact_info"
                                            placeholder="Enter contact number"
                                            value={formData.contact_info}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="email">Email Address *</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="Enter email address"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Address Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
                                <div>
                                    <Label htmlFor="address">Address *</Label>
                                    <Input
                                        id="address"
                                        name="address"
                                        placeholder="Enter full address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="emergency_contact">Emergency Contact</Label>
                                    <Input
                                        id="emergency_contact"
                                        name="emergency_contact"
                                        placeholder="Emergency contact number"
                                        value={formData.emergency_contact}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Insurance Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Insurance Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="insurance_provider">Insurance Provider</Label>
                                        <Select
                                            value={formData.insurance_provider}
                                            onValueChange={(value) => handleSelectChange('insurance_provider', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select insurance provider" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Blue Cross">Blue Cross</SelectItem>
                                                <SelectItem value="Aetna">Aetna</SelectItem>
                                                <SelectItem value="Cigna">Cigna</SelectItem>
                                                <SelectItem value="UnitedHealth">UnitedHealth</SelectItem>
                                                <SelectItem value="Medicare">Medicare</SelectItem>
                                                <SelectItem value="Medicaid">Medicaid</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="insurance_number">Insurance Number</Label>
                                        <Input
                                            id="insurance_number"
                                            name="insurance_number"
                                            placeholder="Enter insurance number"
                                            value={formData.insurance_number}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Medical Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Medical Information</h3>
                                <div>
                                    <Label htmlFor="medical_history">Medical History</Label>
                                    <textarea
                                        id="medical_history"
                                        name="medical_history"
                                        placeholder="Enter medical history, previous conditions, surgeries, etc."
                                        value={formData.medical_history}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-md resize-none"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="allergies">Allergies</Label>
                                    <textarea
                                        id="allergies"
                                        name="allergies"
                                        placeholder="Enter known allergies, medications, food allergies, etc."
                                        value={formData.allergies}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-md resize-none"
                                        rows={2}
                                    />
                                </div>

                                {/* <div>
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => handleSelectChange('status', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div> */}
                            </div>

                        </form>
                    </div>
                    <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t mt-4">
                        <Button type="button" variant="outline" onClick={() => { setOpen(false); }}>
                            Cancel
                        </Button>
                        <Button type="submit" form="patient-form" className="bg-blue-600 hover:bg-blue-700 text-white">
                            {isSelfRegistration ? "Next: Review Consent" : "Continue to Record Consent"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Conditional Consent Modal */}
            {isSelfRegistration ? (
                <PatientConsentModal
                    open={showConsentModal}
                    onClose={() => {
                        setShowConsentModal(false);
                        setPendingPatientData(null);
                    }}
                    onConsentGiven={(data) => handleConsentRecorded({ ...data, consent_method: 'digital_self' })}
                    patientName={formData.patient_name}
                    hospitalName={getHospitalName()}
                    hospitalId={getUserHospitalId()}
                />
            ) : (
                <StaffConsentRecording
                    open={showConsentModal}
                    onClose={() => {
                        setShowConsentModal(false);
                        setPendingPatientData(null);
                    }}
                    onConsentRecorded={handleConsentRecorded}
                    patientName={pendingPatientData?.patient_name || "the patient"}
                    hospitalName={getHospitalName()}
                    hospitalId={getUserHospitalId()}
                />
            )}
        </>
    );
}
