import React, { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import toast from 'react-hot-toast';
import { remindersAPI } from "@/api/remindersapi";
import { patientsAPI } from "@/api/patientsapi";
import { staffApi } from "@/api/staffapi";

export default function AddReminderDialog({ open, setOpen, onSuccess, editReminder = null }) {
    const [formData, setFormData] = useState({
        hospital_id: "",
        patient_id: "",
        reminder_type: "",
        due_date: "",
        reminder_time: "",
        title: "",
        priority: "medium",
        assigned_to_id: "",
        message: "",
        reminder_channels: ["inapp", "email"],
        email_address: "",
        phone_number: "",
    });

    const [patients, setPatients] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [loadingAdmins, setLoadingAdmins] = useState(false);
    const [patientSearch, setPatientSearch] = useState("");
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);
    const [hospitalId, setHospitalId] = useState("");
    const patientDropdownRef = useRef(null);

    useEffect(() => {
        if (open) {
            // Get hospital_id from localStorage
            const userJson = localStorage.getItem('user');
            if (userJson) {
                try {
                    const user = JSON.parse(userJson);
                    const id = user.hospital_id || "550e8400-e29b-41d4-a716-446655440001";
                    setHospitalId(id);
                    setFormData(prev => ({ ...prev, hospital_id: id }));
                    // Only fetch admins on open, patients will be fetched when user starts typing
                    fetchAdmins(id);
                } catch (e) {
                    console.error("Failed to parse user JSON:", e);
                    const defaultId = "550e8400-e29b-41d4-a716-446655440001";
                    setHospitalId(defaultId);
                    setFormData(prev => ({ ...prev, hospital_id: defaultId }));
                }
            } else {
                // Fallback if no user in localStorage
                const defaultId = "550e8400-e29b-41d4-a716-446655440001";
                setHospitalId(defaultId);
                setFormData(prev => ({ ...prev, hospital_id: defaultId }));
            }

            // If editing, populate form
            if (editReminder) {
                const dueDate = editReminder.due_date 
                    ? new Date(editReminder.due_date).toISOString().split('T')[0]
                    : "";
                const reminderTime = editReminder.reminder_time
                    ? new Date(editReminder.reminder_time).toISOString().slice(0, 16)
                    : "";
                
                const patientId = editReminder.patient_id || "";
                const patient = patients.find(p => p.id === patientId);
                
                setFormData({
                    hospital_id: editReminder.hospital_id || "",
                    patient_id: patientId,
                    reminder_type: editReminder.reminder_type || "",
                    due_date: dueDate,
                    reminder_time: reminderTime,
                    title: editReminder.title || "",
                    priority: editReminder.priority || "medium",
                    assigned_to_id: editReminder.assigned_to_id || "",
                    message: editReminder.message || "",
                    reminder_channels: editReminder.reminder_channels || ["inapp", "email"],
                    email_address: editReminder.email_address || "",
                    phone_number: editReminder.phone_number || "",
                });
                
                if (patient) {
                    setSelectedPatient(patient);
                    setPatientSearch(patient.patient_name);
                }
            } else {
                // Reset form for new reminder (but keep hospital_id)
                setFormData({
                    hospital_id: hospitalId || "",
                    patient_id: "",
                    reminder_type: "",
                    due_date: "",
                    reminder_time: "",
                    title: "",
                    priority: "medium",
                    assigned_to_id: "",
                    message: "",
                    reminder_channels: ["inapp", "email"],
                    email_address: "",
                    phone_number: "",
                });
                setSelectedPatient(null);
                setPatientSearch("");
            }
        }
    }, [open, editReminder]);

    const fetchPatients = async (hospitalId, searchTerm = "") => {
        setLoadingPatients(true);
        try {
            const params = { 
                hospital_id: hospitalId, 
                limit: 50 
            };
            if (searchTerm && searchTerm.trim().length > 0) {
                params.search = searchTerm.trim();
            }
            const result = await patientsAPI.getAll(params);
            setPatients(Array.isArray(result?.data) ? result.data : []);
        } catch (error) {
            console.error("Error fetching patients:", error);
            toast.error("Failed to load patients");
        } finally {
            setLoadingPatients(false);
        }
    };

    // Debounced search for patients
    useEffect(() => {
        if (!open || !hospitalId) {
            setPatients([]);
            return;
        }

        // If search is empty or too short, don't fetch
        if (!patientSearch || patientSearch.trim().length < 2) {
            setPatients([]);
            return;
        }

        // Debounce the search - wait 300ms after user stops typing
        const debounceTimer = setTimeout(() => {
            const searchTerm = patientSearch.trim();
            if (searchTerm.length >= 2 && hospitalId) {
                console.log('Fetching patients with search:', searchTerm, 'hospital_id:', hospitalId);
                fetchPatients(hospitalId, searchTerm);
            } else {
                setPatients([]);
            }
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [patientSearch, open, hospitalId]);

    // Filter patients based on search (client-side filtering for better UX)
    const filteredPatients = useMemo(() => {
        if (!patientSearch || patientSearch.trim().length < 2) return [];
        const searchLower = patientSearch.toLowerCase();
        return patients.filter(patient => 
            patient.patient_name?.toLowerCase().includes(searchLower) ||
            patient.contact_info?.includes(searchLower) ||
            patient.email?.toLowerCase().includes(searchLower)
        );
    }, [patients, patientSearch]);

    // Update patient selection
    const handlePatientSelect = (patient) => {
        setSelectedPatient(patient);
        setPatientSearch(patient.patient_name);
        setFormData(prev => ({ ...prev, patient_id: patient.id }));
        setShowPatientDropdown(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target)) {
                setShowPatientDropdown(false);
            }
        };

        if (showPatientDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showPatientDropdown]);

    const fetchAdmins = async (hospitalId) => {
        setLoadingAdmins(true);
        try {
            // Using staff API to get admins/staff
            const result = await staffApi.getAll({ hospital_id: hospitalId, limit: 100 });
            setAdmins(Array.isArray(result?.data) ? result.data : []);
        } catch (error) {
            console.error("Error fetching admins:", error);
        } finally {
            setLoadingAdmins(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleChannelToggle = (channel) => {
        setFormData(prev => {
            const channels = prev.reminder_channels || [];
            if (channels.includes(channel)) {
                return { ...prev, reminder_channels: channels.filter(c => c !== channel) };
            } else {
                return { ...prev, reminder_channels: [...channels, channel] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate required fields
            if (!formData.patient_id || !formData.reminder_type || !formData.due_date) {
                toast.error("Please fill in all required fields");
                setLoading(false);
                return;
            }

            // Get hospital_id from localStorage (primary source), then state, then formData, then fallback
            let finalHospitalId = null;
            const userJson = localStorage.getItem('user');
            if (userJson) {
                try {
                    const user = JSON.parse(userJson);
                    finalHospitalId = user.hospital_id;
                } catch (e) {
                    console.error("Failed to parse user JSON:", e);
                }
            }
            
            // Fallback to state or formData
            finalHospitalId = finalHospitalId || hospitalId || formData.hospital_id || "550e8400-e29b-41d4-a716-446655440001";
            
            // Build reminder data, only including valid fields
            const reminderData = {
                hospital_id: finalHospitalId,
                patient_id: formData.patient_id,
                reminder_type: formData.reminder_type,
                due_date: new Date(formData.due_date).toISOString(),
                reminder_time: formData.reminder_time 
                    ? new Date(formData.reminder_time).toISOString()
                    : new Date(formData.due_date).toISOString(),
                priority: formData.priority || "medium",
                message: formData.message || undefined,
                reminder_channels: formData.reminder_channels || ["inapp", "email"],
            };

            // Only include optional fields if they have valid values
            if (formData.title) {
                reminderData.title = formData.title;
            }
            if (formData.assigned_to_id && formData.assigned_to_id !== "none" && formData.assigned_to_id !== "") {
                reminderData.assigned_to_id = formData.assigned_to_id;
            }
            // Only include email_address if it's a valid email
            if (formData.email_address && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_address)) {
                reminderData.email_address = formData.email_address;
            }
            // Only include phone_number if it's not empty
            if (formData.phone_number && formData.phone_number.trim() !== "") {
                reminderData.phone_number = formData.phone_number;
            }

            if (editReminder) {
                await remindersAPI.update(editReminder.id, reminderData);
                toast.success("Reminder updated successfully");
            } else {
                await remindersAPI.create(reminderData);
                toast.success("Reminder created successfully");
            }

            setOpen(false);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Error saving reminder:", error);
            toast.error(error.message || "Failed to save reminder. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl h-[90vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="text-xl font-semibold">
                        {editReminder ? "Edit Reminder" : "Add New Reminder"}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto mt-4 pr-2 space-y-4">
                    <form id="reminder-form" onSubmit={handleSubmit} className="space-y-4">
                        {/* Patient Selection - Searchable */}
                        <div>
                            <Label>
                                Patient <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative" ref={patientDropdownRef}>
                                <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2 z-10" />
                                <Input
                                    type="text"
                                    placeholder="Search patient by name, phone, or email..."
                                    className="pl-9"
                                    value={patientSearch}
                                    onChange={(e) => {
                                        setPatientSearch(e.target.value);
                                        setShowPatientDropdown(true);
                                        if (!e.target.value) {
                                            setSelectedPatient(null);
                                            setFormData(prev => ({ ...prev, patient_id: "" }));
                                        }
                                    }}
                                    onFocus={() => {
                                        if (patientSearch) {
                                            setShowPatientDropdown(true);
                                        }
                                    }}
                                    disabled={loadingPatients}
                                    required
                                />
                                {showPatientDropdown && patientSearch && filteredPatients.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        {filteredPatients.map((patient) => (
                                            <div
                                                key={patient.id}
                                                className="p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3"
                                                onClick={() => handlePatientSelect(patient)}
                                            >
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>
                                                        {patient.patient_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <p className="font-medium">{patient.patient_name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {patient.contact_info}
                                                        {patient.email && ` • ${patient.email}`}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {showPatientDropdown && patientSearch && patientSearch.length >= 2 && !loadingPatients && filteredPatients.length === 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 text-gray-500 text-center">
                                        No patients found
                                    </div>
                                )}
                                {patientSearch && patientSearch.length < 2 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 text-gray-500 text-center">
                                        Type at least 2 characters to search
                                    </div>
                                )}
                            </div>
                            {selectedPatient && (
                                <div className="mt-2 p-2 bg-gray-50 rounded-md flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-xs">
                                            {selectedPatient.patient_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{selectedPatient.patient_name}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 ml-auto"
                                        onClick={() => {
                                            setSelectedPatient(null);
                                            setPatientSearch("");
                                            setFormData(prev => ({ ...prev, patient_id: "" }));
                                        }}
                                    >
                                        Clear
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Reminder Type */}
                        <div>
                            <Label>
                                Reminder Type <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.reminder_type}
                                onValueChange={(value) => handleChange("reminder_type", value)}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select reminder type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="appointment">Appointment</SelectItem>
                                    <SelectItem value="medication">Medication</SelectItem>
                                    <SelectItem value="follow_up">Follow Up</SelectItem>
                                    <SelectItem value="test">Test/Procedure</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Title */}
                        <div>
                            <Label>Title</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => handleChange("title", e.target.value)}
                                placeholder="Enter reminder title"
                            />
                        </div>

                        {/* Due Date */}
                        <div>
                            <Label>
                                Due Date <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="date"
                                value={formData.due_date}
                                onChange={(e) => handleChange("due_date", e.target.value)}
                                required
                            />
                        </div>

                        {/* Reminder Time */}
                        <div>
                            <Label>Reminder Time</Label>
                            <Input
                                type="datetime-local"
                                value={formData.reminder_time}
                                onChange={(e) => handleChange("reminder_time", e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                When to send the reminder (defaults to due date if not set)
                            </p>
                        </div>

                        {/* Priority */}
                        <div>
                            <Label>Priority</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(value) => handleChange("priority", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Assigned To */}
                        <div>
                            <Label>Assigned To</Label>
                            <Select
                                value={formData.assigned_to_id || "none"}
                                onValueChange={(value) => handleChange("assigned_to_id", value === "none" ? "" : value)}
                                disabled={loadingAdmins}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select staff/admin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {admins.map((admin) => (
                                        <SelectItem key={admin.id} value={admin.id}>
                                            {admin.staff_name || admin.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Message */}
                        <div>
                            <Label>Message</Label>
                            <Textarea
                                value={formData.message}
                                onChange={(e) => handleChange("message", e.target.value)}
                                placeholder="Enter reminder message"
                                rows={3}
                            />
                        </div>

                        {/* Reminder Channels */}
                        <div>
                            <Label>Reminder Channels</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {["inapp", "email", "whatsapp", "call"].map((channel) => (
                                    <Button
                                        key={channel}
                                        type="button"
                                        variant={
                                            formData.reminder_channels?.includes(channel)
                                                ? "default"
                                                : "outline"
                                        }
                                        onClick={() => handleChannelToggle(channel)}
                                        className="capitalize"
                                    >
                                        {channel}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Email Address */}
                        <div>
                            <Label>Email Address (optional)</Label>
                            <Input
                                type="email"
                                value={formData.email_address}
                                onChange={(e) => handleChange("email_address", e.target.value)}
                                placeholder="Override patient email"
                            />
                        </div>

                        {/* Phone Number */}
                        <div>
                            <Label>Phone Number (optional)</Label>
                            <Input
                                type="tel"
                                value={formData.phone_number}
                                onChange={(e) => handleChange("phone_number", e.target.value)}
                                placeholder="Override patient phone"
                            />
                        </div>
                    </form>
                </div>
                <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t mt-4">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Saving..." : editReminder ? "Update" : "Create"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

