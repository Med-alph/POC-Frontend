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
import { Lock, Shield } from "lucide-react";
import PatientConsentModal from "@/components/compliance/PatientConsentModal";
import { complianceAPI } from "@/api/complianceapi";
import DataProtectionNotice from "@/components/compliance/DataProtectionNotice";
import StaffConsentRecording from "@/components/compliance/StaffConsentRecording";
import { PHONE_REGEX, SUPPORTED_COUNTRY_CODES } from "@/constants/Constant";
import { ReadOnlyTooltip } from "@/components/ui/read-only-tooltip";


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
        status: "active",
        is_credit_eligible: "no",
        credit_amount: 0
    });

    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const role = user.role?.toLowerCase();
            const designation = user.designation_group?.toLowerCase();
            setIsAdmin(role === 'hospital_admin' || role === 'super_admin' || role === 'admin' || designation === 'admin');
        } catch (e) {
            setIsAdmin(false);
        }
    }, []);

    // Consent modal state
    const [showConsentModal, setShowConsentModal] = useState(false);
    const [pendingPatientData, setPendingPatientData] = useState(null);
    const [formErrors, setFormErrors] = useState({});

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

    const validateForm = () => {
        const errors = {};
        if (!formData.patient_name.trim()) errors.patient_name = "Full name is required";
        if (!formData.dob) errors.dob = "Date of birth is required";
        if (!formData.contact_info.trim()) errors.contact_info = "Contact number is required";
        if (!formData.email.trim()) errors.email = "Email address is required";
        if (!formData.address.trim()) errors.address = "Address is required";

        // Phone number validation
        if (formData.contact_info.trim()) {
            const phoneToTest = formData.contact_info.trim().replace(/(?!^\+)[\s-]/g, '');

            if (phoneToTest.startsWith('+')) {
                const matchedCode = SUPPORTED_COUNTRY_CODES.find(c => phoneToTest.startsWith(c.code));
                if (!matchedCode) {
                    errors.contact_info = "Unsupported or invalid country code";
                } else {
                    const subscriberNumber = phoneToTest.replace(matchedCode.code, '');
                    if (subscriberNumber.length !== 10) {
                        errors.contact_info = `${matchedCode.country} phone numbers must have exactly 10 digits after the code`;
                    }
                }
            } else if (phoneToTest.length !== 10) {
                errors.contact_info = "Please enter a valid 10-digit phone number";
            } else if (!PHONE_REGEX.test(phoneToTest)) {
                errors.contact_info = "Invalid phone number format";
            }
        }

        // DOB future date validation
        if (formData.dob) {
            const selectedDate = new Date(formData.dob);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate > today) {
                errors.dob = "Date of Birth cannot be in the future";
            }
        }

        setFormErrors(errors);
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            toast.error(Object.values(errors)[0]);
            return;
        }


        try {
            // Calculate age from date of birth
            const age = formData.dob
                ? Math.floor((new Date() - new Date(formData.dob)) / (365.25 * 24 * 60 * 60 * 1000))
                : null;

            // Normalize insurance number for Blind Indexing (trim and uppercase)
            const normalizedInsuranceNumber = formData.insurance_number?.trim().toUpperCase() || "";

            const patientData = {
                ...formData,
                insurance_number: normalizedInsuranceNumber,
                age,
                credit_amount: Number(formData.credit_amount) || 0,
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
            setFormErrors({});
            setOpen(false);

            toast.success(`Patient "${createdPatient.patient_name}" added successfully!`);

            if (onComplete) {
                // Pass normalized createdPatient but also preserve response if needed for tokens
                onComplete(response);
            }

        } catch (error) {
            console.error('Error creating patient with consent:', error);
            // Show specific error message from backend if available, otherwise generic
            const errorMessage = error.message || "Failed to create patient. Please try again.";
            toast.error(errorMessage);
            
            // Automatically close the dialogs on error as requested
            setShowConsentModal(false);
            setOpen(false);
            setPendingPatientData(null);
        }
    };

    return (
        <>
            <Dialog open={open && !showConsentModal} onOpenChange={setOpen}>
                <DialogContent className="max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="px-6 py-4 border-b bg-gray-50/50 dark:bg-gray-900/20 shrink-0">
                        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Add New Patient</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="px-6 py-6 space-y-8">
                            {/* Data Protection Notice */}
                            <DataProtectionNotice context="patient" />

                            <form id="patient-form" onSubmit={handleSubmit} className="space-y-8" noValidate>
                                {/* Basic Information */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 border-b pb-2">
                                        <div className="h-4 w-1 bg-blue-600 rounded-full" />
                                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Basic Information</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="patient_name" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Full Name *</Label>
                                            <Input
                                                id="patient_name"
                                                name="patient_name"
                                                placeholder="Enter patient's full name"
                                                value={formData.patient_name}
                                                onChange={handleChange}
                                                className="h-10 transition-shadow focus:ring-2 focus:ring-blue-500/20"
                                                required
                                                aria-invalid={!!formErrors.patient_name}
                                            />
                                            {formErrors.patient_name && <p className="text-[11px] font-medium text-red-500 mt-1">{formErrors.patient_name}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="dob" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Date of Birth *</Label>
                                            <Input
                                                id="dob"
                                                name="dob"
                                                type="date"
                                                value={formData.dob}
                                                onChange={handleChange}
                                                className="h-10 transition-shadow focus:ring-2 focus:ring-blue-500/20"
                                                max={new Date().toISOString().split('T')[0]}
                                                required
                                                aria-invalid={!!formErrors.dob}
                                            />
                                            {formErrors.dob && <p className="text-[11px] font-medium text-red-500 mt-1">{formErrors.dob}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="contact_info" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contact Number *</Label>
                                            <Input
                                                id="contact_info"
                                                name="contact_info"
                                                type="tel"
                                                placeholder="+91 XXXXX XXXXX"
                                                value={formData.contact_info}
                                                onChange={handleChange}
                                                className="h-10 transition-shadow focus:ring-2 focus:ring-blue-500/20"
                                                required
                                                aria-invalid={!!formErrors.contact_info}
                                            />
                                            {formErrors.contact_info && <p className="text-[11px] font-medium text-red-500 mt-1">{formErrors.contact_info}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Address *</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="patient@example.com"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="h-10 transition-shadow focus:ring-2 focus:ring-blue-500/20"
                                                required
                                                aria-invalid={!!formErrors.email}
                                            />
                                            {formErrors.email && <p className="text-[11px] font-medium text-red-500 mt-1">{formErrors.email}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Address Information */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 border-b pb-2">
                                        <div className="h-4 w-1 bg-blue-600 rounded-full" />
                                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Contact & Address</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-5">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="address" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Full Address *</Label>
                                            <Input
                                                id="address"
                                                name="address"
                                                placeholder="House No, Street, Landmark, City, State, PIN"
                                                value={formData.address}
                                                onChange={handleChange}
                                                className="h-10 transition-shadow focus:ring-2 focus:ring-blue-500/20"
                                                required
                                                aria-invalid={!!formErrors.address}
                                            />
                                            {formErrors.address && <p className="text-[11px] font-medium text-red-500 mt-1">{formErrors.address}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="emergency_contact" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Emergency Contact Number</Label>
                                            <Input
                                                id="emergency_contact"
                                                name="emergency_contact"
                                                placeholder="Relative/Friend's contact number"
                                                value={formData.emergency_contact}
                                                onChange={handleChange}
                                                className="h-10 transition-shadow focus:ring-2 focus:ring-blue-500/20"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Insurance Information */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 border-b pb-2">
                                        <div className="h-4 w-1 bg-blue-600 rounded-full" />
                                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Insurance (Optional)</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="insurance_provider" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Insurance Provider</Label>
                                            <Select
                                                value={formData.insurance_provider}
                                                onValueChange={(value) => handleSelectChange('insurance_provider', value)}
                                            >
                                                <SelectTrigger className="h-10 transition-shadow focus:ring-2 focus:ring-blue-500/20">
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
                                        <div className="space-y-1.5">
                                            <Label htmlFor="insurance_number" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    Insurance ID
                                                    <Lock className="h-3 w-3 text-blue-500/70" title="Application-level encryption active" />
                                                </div>
                                            </Label>
                                            <Input
                                                id="insurance_number"
                                                name="insurance_number"
                                                placeholder="Policy or Membership ID"
                                                value={formData.insurance_number}
                                                onChange={handleChange}
                                                className="h-10 transition-shadow focus:ring-2 focus:ring-blue-500/20"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Medical Information */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 border-b pb-2">
                                        <div className="h-4 w-1 bg-blue-600 rounded-full" />
                                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Clinical History</h3>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="medical_history" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Previous Conditions/Surgeries</Label>
                                            <textarea
                                                id="medical_history"
                                                name="medical_history"
                                                placeholder="Describe any chronic conditions or past surgical procedures..."
                                                value={formData.medical_history}
                                                onChange={handleChange}
                                                className="w-full p-3 text-sm border border-gray-200 dark:border-gray-800 rounded-lg dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all min-h-[100px] resize-none"
                                                rows={3}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="allergies" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Medication & Food Allergies</Label>
                                            <textarea
                                                id="allergies"
                                                name="allergies"
                                                placeholder="List all known allergies to medications, food, or other substances..."
                                                value={formData.allergies}
                                                onChange={handleChange}
                                                className="w-full p-3 text-sm border border-gray-200 dark:border-gray-800 rounded-lg dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all min-h-[80px] resize-none"
                                                rows={2}
                                            />
                                        </div>

                                        {/* Credit Information (Admin Only) */}
                                        {isAdmin && (
                                            <div className="p-5 bg-blue-50/40 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/20 rounded-xl space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                                                        <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-tight">Credit Governance</h3>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="is_credit_eligible" className="text-xs font-bold text-blue-800/70 dark:text-blue-400/70">Eligibility Status</Label>
                                                        <Select
                                                            value={formData.is_credit_eligible}
                                                            onValueChange={(value) => handleSelectChange('is_credit_eligible', value)}
                                                        >
                                                            <SelectTrigger className="h-9 bg-white dark:bg-gray-900 border-blue-200/50 dark:border-blue-800/30">
                                                                <SelectValue placeholder="Select" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="yes">Eligible for Credit</SelectItem>
                                                                <SelectItem value="no">Not Eligible</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    {formData.is_credit_eligible === "yes" && (
                                                        <div className="space-y-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
                                                            <Label htmlFor="credit_amount" className="text-xs font-bold text-blue-800/70 dark:text-blue-400/70">Credit Limit (₹)</Label>
                                                            <Input
                                                                id="credit_amount"
                                                                name="credit_amount"
                                                                type="number"
                                                                placeholder="e.g. 5000"
                                                                value={formData.credit_amount}
                                                                onChange={handleChange}
                                                                className="h-9 bg-white dark:bg-gray-900 border-blue-200/50 dark:border-blue-800/30"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t bg-gray-50/50 dark:bg-gray-900/20 flex items-center justify-between shrink-0">
                        <Button type="button" variant="ghost" className="text-gray-500 hover:text-gray-700" onClick={() => { setOpen(false); }}>
                            Cancel
                        </Button>
                        <ReadOnlyTooltip>
                            <Button type="submit" form="patient-form" className="bg-blue-600 hover:bg-blue-700 text-white px-6 shadow-md hover:shadow-lg transition-all active:scale-95">
                                {isSelfRegistration ? "Next: Review Consent" : "Continue to Record Consent"}
                            </Button>
                        </ReadOnlyTooltip>
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
