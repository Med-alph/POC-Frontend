import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate, useLocation } from "react-router-dom";
import { useHospital } from "@/contexts/HospitalContext";
import { toast } from "sonner";
import { Stethoscope, ArrowLeft, Moon, Sun, User, Calendar, Phone, Mail, FileText, Heart, Pill } from "lucide-react";
import { patientsAPI } from "@/api/patientsapi";
import { PHONE_REGEX } from "@/constants/Constant";

//this is a comment
const PatientDetailsForm = () => {
    const navigate = useNavigate();
    const { hospitalInfo } = useHospital();
    const HOSPITAL_ID = hospitalInfo?.hospital_id;
    const location = useLocation();
    const { patient, phone } = location.state || {};

    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState(1);
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("darkMode") === "true";
    });

    // Toggle dark mode
    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem("darkMode", String(newMode));
        document.documentElement.classList.toggle("dark", newMode);
    };

    // Apply dark mode on mount
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add("dark");
        }
    }, [darkMode]);

    const [isBookingForOther, setIsBookingForOther] = useState(false);
    const [firstTime, setFirstTime] = useState(false);

    // Booker Info
    const [bookerName, setBookerName] = useState("");
    const [bookerPhone, setBookerPhone] = useState("");
    const [bookerEmail, setBookerEmail] = useState("");

    // Patient Info
    const [name, setName] = useState("");
    const [dob, setDob] = useState("");
    const [gender, setGender] = useState("");
    const [bloodGroup, setBloodGroup] = useState("");

    // Contact Info
    const [contactPhone, setContactPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");

    // Medical History
    const [medicalHistory, setMedicalHistory] = useState("");
    const [allergies, setAllergies] = useState("");
    const [medications, setMedications] = useState("");
    const [surgeries, setSurgeries] = useState("");
    const [familyHistory, setFamilyHistory] = useState("");
    const [lifestyle, setLifestyle] = useState([]);
    const [emergencyContact, setEmergencyContact] = useState("");
    const [errors, setErrors] = useState({});

    const lifestyleOptions = [
        "Non-smoker",
        "Smoker",
        "Occasional Alcohol",
        "Regular Alcohol",
        "Active",
        "Sedentary",
    ];

    const handleLifestyleChange = (option) => {
        setLifestyle((prev) =>
            prev.includes(option)
                ? prev.filter((o) => o !== option)
                : [...prev, option]
        );
    };

    // Initialize form with patient data if available
    useEffect(() => {
        if (patient) {
            setName(patient.patient_name || "");
            setDob(patient.dob || "");
            setGender(patient.gender || "");
            setBloodGroup(patient.blood_group || "");
            setContactPhone(patient.contact_info || phone || "");
            setEmail(patient.email || "");
            setAddress(patient.address || "");
            setMedicalHistory(patient.medical_history || "");
            setAllergies(patient.allergies || "");
            setMedications(patient.medications || "");
            setSurgeries(patient.surgeries || "");
            setFamilyHistory(patient.family_history || "");
            setEmergencyContact(patient.emergency_contact || "");
        } else {
            setContactPhone(phone || "");
        }
    }, [patient, phone]);

    const validateSection = (section) => {
        const newErrors = {};
        if (section === 1) {
            if (!name.trim()) newErrors.name = "Full name is required";
            if (!dob) newErrors.dob = "Date of birth is required";
            if (!gender.trim()) newErrors.gender = "Gender is required";

            if (dob) {
                const selectedDate = new Date(dob);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (selectedDate > today) newErrors.dob = "Date of Birth cannot be in the future";
            }
        } else if (section === 2) {
            if (!contactPhone.trim()) {
                newErrors.contactPhone = "Phone number is required";
            } else {
                const phoneToTest = contactPhone.trim().replace(/(?!^\+)[\s-]/g, '');
                if (phoneToTest.startsWith('+91') && phoneToTest.replace('+91', '').length !== 10) {
                    newErrors.contactPhone = "India phone numbers must have 10 digits after +91";
                } else if (!PHONE_REGEX.test(phoneToTest)) {
                    newErrors.contactPhone = "Invalid phone number format";
                }
            }
            if (!emergencyContact.trim()) newErrors.emergencyContact = "Emergency contact is required";
            if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                newErrors.email = "Invalid email format";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateSection(1) || !validateSection(2)) {
            toast.error("Please correct the errors in the form before submitting");
            return;
        }


        setLoading(true);
        try {
            const payload = {
                patient_name: name,
                dob,
                gender,
                blood_group: bloodGroup,
                contact_info: contactPhone,
                email,
                address,
                medical_history: medicalHistory,
                allergies,
                medications,
                surgeries,
                family_history: familyHistory,
                lifestyle: lifestyle.join(", "),
                emergency_contact: emergencyContact,
                hospital_id: HOSPITAL_ID,
                user_id: "system_user",
            };

            let updatedPatient;
            if (patient && patient.id) {
                // Update existing patient
                updatedPatient = await patientsAPI.update(patient.id, payload);
                toast.success("Patient details updated successfully!");
            } else {
                // Create new patient
                updatedPatient = await patientsAPI.create(payload);
                toast.success("Patient registered successfully!");
            }

            // Navigate to appointment page
            navigate("/appointment", {
                state: {
                    phone: contactPhone,
                    isFirstTime: !patient || !patient.id,
                    patientId: updatedPatient?.id
                }
            });
        } catch (err) {
            console.error(err);
            toast.error(err?.message || "Failed to save patient details");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
            {/* Dark Mode Toggle */}
            <button
                onClick={toggleDarkMode}
                className="fixed top-4 right-4 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 z-50"
                aria-label="Toggle dark mode"
            >
                {darkMode ? (
                    <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                    <Moon className="h-5 w-5 text-gray-700" />
                )}
            </button>

            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="mb-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div className="inline-flex items-center gap-3 bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-lg mb-4">
                        {hospitalInfo?.logo ? (
                            <img src={hospitalInfo.logo} alt={hospitalInfo.name} className="h-6 w-6 object-contain" />
                        ) : (
                            <Stethoscope className="h-6 w-6" />
                        )}
                        <span className="text-sm font-semibold">{hospitalInfo?.name || "MedPortal"} — Patient Access</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                        {patient && patient.id ? "Edit Patient Details" : "Complete Your Profile"}
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Please fill in all required information to continue
                    </p>
                </div>

                {/* Progress Indicator */}
                <div className="mb-8 flex justify-center gap-2">
                    {[1, 2, 3].map((section) => (
                        <div
                            key={section}
                            className={`h-2 rounded-full transition-all duration-300 ${activeSection === section
                                ? "bg-blue-600 w-12"
                                : activeSection > section
                                    ? "bg-green-500 w-8"
                                    : "bg-gray-300 dark:bg-gray-600 w-8"
                                }`}
                        />
                    ))}
                </div>

                <Card className="w-full shadow-2xl border-0 rounded-2xl dark:bg-gray-800 dark:border-gray-700 overflow-hidden animate-in fade-in-0">
                    <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 dark:from-blue-700 dark:via-blue-600 dark:to-indigo-600 text-white">
                        <CardTitle className="text-2xl flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                {activeSection === 1 && <User className="h-6 w-6" />}
                                {activeSection === 2 && <Phone className="h-6 w-6" />}
                                {activeSection === 3 && <Heart className="h-6 w-6" />}
                            </div>
                            {activeSection === 1 && "Personal Information"}
                            {activeSection === 2 && "Contact & Emergency"}
                            {activeSection === 3 && "Medical History"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 sm:p-8 space-y-6">
                        {/* Section 1: Personal Information */}
                        {activeSection === 1 && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold flex items-center gap-2">
                                            <User className="h-4 w-4 text-blue-600" />
                                            Full Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            value={name}
                                            onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: null })); }}
                                            placeholder="Enter your full name"
                                            className="h-12"
                                            aria-invalid={!!errors.name}
                                        />
                                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-blue-600" />
                                            Date of Birth <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="dob"
                                            name="dob"
                                            type="date"
                                            value={dob}
                                            onChange={(e) => { setDob(e.target.value); if (errors.dob) setErrors(prev => ({ ...prev, dob: null })); }}
                                            max={new Date().toISOString().split('T')[0]}
                                            className="h-12"
                                            aria-invalid={!!errors.dob}
                                        />
                                        {errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob}</p>}


                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">Gender <span className="text-red-500">*</span></Label>
                                        <Input
                                            placeholder="Male / Female / Other"
                                            value={gender}
                                            onChange={(e) => { setGender(e.target.value); if (errors.gender) setErrors(prev => ({ ...prev, gender: null })); }}
                                            className="h-12"
                                            aria-invalid={!!errors.gender}
                                        />
                                        {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">Blood Group</Label>
                                        <Input
                                            placeholder="A+, O-, etc."
                                            value={bloodGroup}
                                            onChange={(e) => setBloodGroup(e.target.value)}
                                            className="h-12"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate(-1)}
                                        className="px-8 h-12 rounded-xl font-semibold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            if (validateSection(1)) {
                                                setActiveSection(2);
                                            } else {
                                                toast.error("Please fill required fields correctly");
                                            }
                                        }}
                                        className="px-8 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                                    >
                                        Next: Contact Info →
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Section 2: Contact & Emergency */}
                        {activeSection === 2 && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-blue-600" />
                                            Phone Number <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            type="tel"
                                            value={contactPhone}
                                            onChange={(e) => { setContactPhone(e.target.value); if (errors.contactPhone) setErrors(prev => ({ ...prev, contactPhone: null })); }}
                                            placeholder="+91 9876543210"
                                            className="h-12"
                                            aria-invalid={!!errors.contactPhone}
                                        />
                                        {errors.contactPhone && <p className="text-xs text-red-500 mt-1">{errors.contactPhone}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-blue-600" />
                                            Email
                                        </Label>
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: null })); }}
                                            placeholder="example@mail.com"
                                            className="h-12"
                                            aria-invalid={!!errors.email}
                                        />
                                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label className="text-sm font-semibold">Address</Label>
                                        <Textarea
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder="Enter full address"
                                            rows={3}
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label className="text-sm font-semibold flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-blue-600" />
                                            Emergency Contact <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            placeholder="Name + Phone number"
                                            value={emergencyContact}
                                            onChange={(e) => { setEmergencyContact(e.target.value); if (errors.emergencyContact) setErrors(prev => ({ ...prev, emergencyContact: null })); }}
                                            className="h-12"
                                            aria-invalid={!!errors.emergencyContact}
                                        />
                                        {errors.emergencyContact && <p className="text-xs text-red-500 mt-1">{errors.emergencyContact}</p>}
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Please provide an emergency contact person
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                        variant="outline"
                                        onClick={() => setActiveSection(1)}
                                        className="px-8 h-12 rounded-xl font-semibold"
                                    >
                                        ← Back
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            if (validateSection(2)) {
                                                setActiveSection(3);
                                            } else {
                                                toast.error("Please fill required fields correctly");
                                            }
                                        }}
                                        className="px-8 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                                    >
                                        Next: Medical History →
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Section 3: Medical History */}
                        {activeSection === 3 && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold flex items-center gap-2">
                                            <Heart className="h-4 w-4 text-blue-600" />
                                            Past Illnesses
                                        </Label>
                                        <Textarea
                                            value={medicalHistory}
                                            onChange={(e) => setMedicalHistory(e.target.value)}
                                            placeholder="Diabetes, Hypertension, etc."
                                            rows={3}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold flex items-center gap-2">
                                            <Pill className="h-4 w-4 text-blue-600" />
                                            Allergies
                                        </Label>
                                        <Textarea
                                            value={allergies}
                                            onChange={(e) => setAllergies(e.target.value)}
                                            placeholder="Peanuts, Penicillin, etc."
                                            rows={2}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">Current Medications</Label>
                                        <Textarea
                                            value={medications}
                                            onChange={(e) => setMedications(e.target.value)}
                                            placeholder="List current medications"
                                            rows={2}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">Past Surgeries / Procedures</Label>
                                        <Textarea
                                            value={surgeries}
                                            onChange={(e) => setSurgeries(e.target.value)}
                                            placeholder="Appendectomy, Knee surgery, etc."
                                            rows={2}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">Family Medical History</Label>
                                        <Textarea
                                            value={familyHistory}
                                            onChange={(e) => setFamilyHistory(e.target.value)}
                                            placeholder="Diabetes, Heart Disease, etc."
                                            rows={2}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-sm font-semibold">Lifestyle</Label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {lifestyleOptions.map((option) => (
                                                <div key={option} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                    <Checkbox
                                                        checked={lifestyle.includes(option)}
                                                        onCheckedChange={() => handleLifestyleChange(option)}
                                                    />
                                                    <Label className="text-sm cursor-pointer">{option}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                        variant="outline"
                                        onClick={() => setActiveSection(2)}
                                        className="px-8 h-12 rounded-xl font-semibold"
                                    >
                                        ← Back
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="px-8 h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline" />
                                                Saving...
                                            </>
                                        ) : (
                                            "✓ Save & Continue"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default PatientDetailsForm;