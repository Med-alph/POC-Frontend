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
import { Lock, Loader2, Shield } from "lucide-react";
import { useHospital } from "@/contexts/HospitalContext";
import { PHONE_REGEX } from "@/constants/Constant";
import { ReadOnlyTooltip } from "@/components/ui/read-only-tooltip";


export default function EditPatientDialog({ open, setOpen, onUpdate, editPatient }) {
    const { hospitalInfo } = useHospital();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        hospital_id: editPatient?.hospital_id || hospitalInfo?.hospital_id,
        patient_name: editPatient?.patient_name || "",
        dob: editPatient?.dob || "",
        contact_info: editPatient?.contact_info || "",
        email: editPatient?.email || "",
        address: editPatient?.address || "",
        emergency_contact: editPatient?.emergency_contact || "",
        insurance_provider: editPatient?.insurance_provider || "",
        insurance_number: editPatient?.insurance_number || "",
        medical_history: editPatient?.medical_history || "",
        allergies: editPatient?.allergies || "",
        gender: editPatient?.gender || "",
        blood_group: editPatient?.blood_group || "",
        status: editPatient?.status || "active",
        is_credit_eligible: editPatient?.is_credit_eligible || "no",
        credit_amount: editPatient?.credit_amount || 0
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

    useEffect(() => {
        if (editPatient) {
            // Format date for input field (YYYY-MM-DD)
            const formatDateForInput = (dateString) => {
                if (!dateString) return "";
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return "";
                return date.toISOString().split('T')[0];
            };

            setFormData({
                hospital_id: editPatient?.hospital_id || hospitalInfo?.hospital_id,
                patient_name: editPatient?.patient_name || "",
                dob: formatDateForInput(editPatient?.dob),
                contact_info: editPatient?.contact_info || "",
                email: editPatient?.email || "",
                address: editPatient?.address || "",
                emergency_contact: editPatient?.emergency_contact || "",
                insurance_provider: editPatient?.insurance_provider || "",
                insurance_number: editPatient?.insurance_number || "",
                medical_history: editPatient?.medical_history || "",
                allergies: editPatient?.allergies || "",
                gender: editPatient?.gender || "",
                blood_group: editPatient?.blood_group || "",
                status: editPatient?.status || "active",
                is_credit_eligible: editPatient?.is_credit_eligible || "no",
                credit_amount: editPatient?.credit_amount || 0
            });
        }
    }, [editPatient]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation with trimming to avoid whitespace only
        if (!formData.patient_name.trim() || !formData.contact_info.trim() || !formData.gender) {
            toast.error("Please fill in required fields (Name, Contact, and Gender)");
            return;
        }

        // Phone number validation
        const phoneToTest = formData.contact_info.trim().replace(/(?!^\+)[\s-]/g, '');

        // Strict check for India
        if (phoneToTest.startsWith('+91') && phoneToTest.replace('+91', '').length !== 10) {
            toast.error("India phone numbers (+91) must have exactly 10 digits after the code");
            return;
        }

        if (!PHONE_REGEX.test(phoneToTest)) {
            toast.error("Please enter a valid 10-digit phone number (e.g., +91 9876543210 or 9876543210)");
            return;
        }



        // DOB future date validation
        if (formData.dob) {
            const selectedDate = new Date(formData.dob);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate > today) {
                toast.error("Date of Birth cannot be in the future");
                return;
            }
        }


        try {
            setLoading(true);
            // Calculate age from date of birth
            const age = formData.dob
                ? Math.floor((new Date() - new Date(formData.dob)) / (365.25 * 24 * 60 * 60 * 1000))
                : editPatient?.age || null;

            // Normalize insurance number for Blind Indexing (trim and uppercase)
            const normalizedInsuranceNumber = formData.insurance_number?.trim().toUpperCase() || "";

            const patientData = {
                ...formData,
                insurance_number: normalizedInsuranceNumber,
                age,
                credit_amount: Number(formData.credit_amount) || 0,
                updated_at: new Date().toISOString(),
            };

            await onUpdate(editPatient.id, patientData);
            setOpen(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="px-6 py-4 border-b bg-gray-50/50 dark:bg-gray-900/20 shrink-0">
                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Edit Patient Profile</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="px-6 py-6 space-y-8">
                        <form id="edit-patient-form" onSubmit={handleSubmit} className="space-y-8" noValidate>

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
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="dob" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Date of Birth</Label>
                                        <Input
                                            id="dob"
                                            name="dob"
                                            type="date"
                                            value={formData.dob}
                                            onChange={handleChange}
                                            className="h-10 transition-shadow focus:ring-2 focus:ring-blue-500/20"
                                            max={new Date().toISOString().split('T')[0]}
                                        />
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
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Address</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="patient@example.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="h-10 transition-shadow focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="gender" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Gender *</Label>
                                        <Select
                                            value={formData.gender}
                                            onValueChange={(value) => handleSelectChange('gender', value)}
                                        >
                                            <SelectTrigger className="h-10 transition-shadow focus:ring-2 focus:ring-blue-500/20">
                                                <SelectValue placeholder="Select Gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="blood_group" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Blood Group (Optional)</Label>
                                        <Select
                                            value={formData.blood_group}
                                            onValueChange={(value) => handleSelectChange('blood_group', value)}
                                        >
                                            <SelectTrigger className="h-10 transition-shadow focus:ring-2 focus:ring-blue-500/20">
                                                <SelectValue placeholder="Select Blood Group" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="A+">A+</SelectItem>
                                                <SelectItem value="A-">A-</SelectItem>
                                                <SelectItem value="B+">B+</SelectItem>
                                                <SelectItem value="B-">B-</SelectItem>
                                                <SelectItem value="O+">O+</SelectItem>
                                                <SelectItem value="O-">O-</SelectItem>
                                                <SelectItem value="AB+">AB+</SelectItem>
                                                <SelectItem value="AB-">AB-</SelectItem>
                                                <SelectItem value="Unknown">Unknown</SelectItem>
                                            </SelectContent>
                                        </Select>
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
                                        <Label htmlFor="address" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Full Address</Label>
                                        <Input
                                            id="address"
                                            name="address"
                                            placeholder="House No, Street, Landmark, City, State, PIN"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="h-10 transition-shadow focus:ring-2 focus:ring-blue-500/20"
                                        />
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
                                    <div className="space-y-1.5">
                                        <Label htmlFor="status" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Patient Status</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(value) => handleSelectChange('status', value)}
                                        >
                                            <SelectTrigger className="h-10 transition-shadow focus:ring-2 focus:ring-blue-500/20">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active Case</SelectItem>
                                                <SelectItem value="inactive">Inactive/Discharged</SelectItem>
                                                <SelectItem value="pending">Pending Review</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
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
                                                    <SelectValue placeholder="Select eligibility" />
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

                        </form>
                    </div>
                </div>
                <div className="px-6 py-4 border-t bg-gray-50/50 dark:bg-gray-900/20 flex items-center justify-between shrink-0">
                    <Button type="button" variant="ghost" className="text-gray-500 hover:text-gray-700" onClick={() => { setOpen(false); }}>
                        Cancel
                    </Button>
                    <ReadOnlyTooltip>
                        <Button type="submit" form="edit-patient-form" className="bg-blue-600 hover:bg-blue-700 text-white px-8 shadow-md hover:shadow-lg transition-all active:scale-95" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Update Profile"
                            )}
                        </Button>
                    </ReadOnlyTooltip>
                </div>
            </DialogContent>
        </Dialog >
    );
}


