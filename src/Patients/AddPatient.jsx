import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import toast from 'react-hot-toast'

export default function AddPatientDialog({ open, setOpen, onAdd }) {
    const [formData, setFormData] = useState({
        hospital_id: "550e8400-e29b-41d4-a716-446655440001",  // hardcoded hospital ID
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
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        console.log('Submitting form data:', formData)

        // Basic validation
        if (!formData.patient_name || !formData.contact_info) {
            toast.error("Please fill in required fields (Name and Contact)")
            return
        }

        try {
            // Calculate age from date of birth
            const age = formData.dob
                ? Math.floor((new Date() - new Date(formData.dob)) / (365.25 * 24 * 60 * 60 * 1000))
                : null

            const patientData = {
                ...formData,
                age: age,
                created_at: new Date().toISOString(),
                last_visit: null,
                next_appointment: null
            }

            console.log('Calling onAdd with patientData:', patientData)
            await onAdd(patientData) // Await API call completion here
            console.log('onAdd call successful')

            // toast.success("Patient created successfully!")
            setOpen(false)

            // Reset form only after success
            setFormData({
                hospital_id: "550e8400-e29b-41d4-a716-446655440001",
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
            })
            console.log('Form reset after success')

        } catch (error) {
            console.error('Error in form submission:', error)
            toast.error("Failed to create patient. Please try again.")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-[600px] h-[85vh] sm:h-[90vh] flex flex-col modal-content">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Add New Patient</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto mt-4 pr-2 scrollbar-thin">
                    <form id="patient-form" onSubmit={handleSubmit} className="space-y-4">
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
                                    <Label htmlFor="insurance_provider">Insurance Provider</Label>
                                    <Select value={formData.insurance_provider} onValueChange={(value) => handleSelectChange('insurance_provider', value)}>
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

                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
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
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="patient-form" className="bg-blue-600 hover:bg-blue-700 text-white">
                        Add Patient
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
