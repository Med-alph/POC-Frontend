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
import { Lock } from "lucide-react";
import { useHospital } from "@/contexts/HospitalContext";
import { PHONE_REGEX } from "@/constants/Constant";


export default function EditPatientDialog({ open, setOpen, onUpdate, editPatient }) {
    const { hospitalInfo } = useHospital();
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
        status: editPatient?.status || "active"
    });

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
                status: editPatient?.status || "active"
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
        if (!formData.patient_name.trim() || !formData.contact_info.trim()) {
            toast.error("Please fill in required fields (Name and Contact)");
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
                updated_at: new Date().toISOString(),
            };

            await onUpdate(editPatient.id, patientData);
            setOpen(false);
        } catch (error) {
            console.error('Error updating patient:', error);
            toast.error("Failed to update patient. Please try again.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-[600px] h-[85vh] sm:h-[90vh] flex flex-col modal-content">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Edit Patient</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto mt-4 pr-2 scrollbar-thin">
                    <form id="edit-patient-form" onSubmit={handleSubmit} className="space-y-4" noValidate>

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
                                    <Label htmlFor="dob">Date of Birth</Label>
                                    <Input
                                        id="dob"
                                        name="dob"
                                        type="date"
                                        value={formData.dob}
                                        onChange={handleChange}
                                        max={new Date().toISOString().split('T')[0]}
                                    />

                                </div>
                                <div>
                                    <Label htmlFor="contact_info">Contact Number *</Label>
                                    <Input
                                        id="contact_info"
                                        name="contact_info"
                                        type="tel"
                                        placeholder="Enter contact number"
                                        value={formData.contact_info}
                                        onChange={handleChange}
                                        required
                                    />

                                </div>
                                <div>
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="Enter email address"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Address Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
                            <div>
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    name="address"
                                    placeholder="Enter full address"
                                    value={formData.address}
                                    onChange={handleChange}
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
                                    <Label htmlFor="insurance_provider" className="flex items-center h-5 mb-1.5">Insurance Provider</Label>
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
                                    <Label htmlFor="insurance_number" className="flex items-center gap-1 h-5 mb-1.5">
                                        Insurance Number
                                        <Lock className="h-3 w-3 text-blue-500" title="This field is encrypted at the application level" />
                                    </Label>
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
                            <div>
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
                            </div>
                        </div>

                    </form>
                </div>
                <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t mt-4">
                    <Button type="button" variant="outline" onClick={() => { setOpen(false); }}>
                        Cancel
                    </Button>
                    <Button type="submit" form="edit-patient-form" className="bg-blue-600 hover:bg-blue-700 text-white">
                        Save Changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}


