import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Stethoscope, User, Calendar, Phone, Mail, FileText, Edit, PlusCircle, Moon, Sun } from "lucide-react";
import { patientsAPI } from "@/API/PatientsAPI";

const HOSPITAL_ID = "550e8400-e29b-41d4-a716-446655440001";

const PatientDetails = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { phone, patientId } = location.state || {};
    
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
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

    // Fetch patient data
    useEffect(() => {
        const fetchPatient = async () => {
            if (!phone) {
                toast.error("Please login to access your portal");
                navigate("/landing");
                return;
            }

            try {
                setLoading(true);
                let p = null;
                if (patientId) {
                    p = await patientsAPI.getById(patientId);
                } else {
                    p = await patientsAPI.getByPhoneAndHospital(phone, HOSPITAL_ID);
                }
                
                if (!p || !p.id) {
                    // If patient not found, navigate to appointment flow
                    navigate("/appointment", { state: { phone, isFirstTime: true } });
                    return;
                }
                setPatient(p);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load patient details");
                navigate("/landing");
            } finally {
                setLoading(false);
            }
        };
        fetchPatient();
    }, [phone, patientId, navigate]);

    // Mock recent activity data
    const recentActivity = [
        { id: 1, type: "Appointment", description: "General Consultation", date: "2024-01-15", status: "Completed" },
        { id: 2, type: "Lab Report", description: "Blood Test Results", date: "2024-01-10", status: "Reviewed" },
        { id: 3, type: "Prescription", description: "Medication Refill", date: "2024-01-05", status: "Active" },
    ];

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center transition-colors duration-300">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading patient details…</p>
                </div>
            </div>
        );
    }

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

            <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-3 bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-lg mb-4">
                        <Stethoscope className="h-6 w-6" />
                        <span className="text-sm font-semibold">MedPortal — Patient Access</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                        Patient Information
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        View and manage your health records
                    </p>
                </div>

                {/* Patient Summary Card */}
                {patient && (
                    <Card className="shadow-2xl border-0 rounded-2xl dark:bg-gray-800 dark:border-gray-700 overflow-hidden mb-6">
                        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 text-white">
                            <CardTitle className="flex items-center gap-3 text-xl">
                                <User className="h-6 w-6" />
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-start gap-3">
                                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Full Name</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {patient.patient_name || "N/A"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Date of Birth</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {formatDate(patient.dob)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Phone Number</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {patient.contact_info || phone}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {patient.email || "Not provided"}
                                        </p>
                                    </div>
                                </div>
                                {patient.age && (
                                    <div className="flex items-start gap-3">
                                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Age</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {patient.age} years
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {patient.insurance_provider && (
                                    <div className="flex items-start gap-3">
                                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Insurance</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {patient.insurance_provider}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={() => navigate("/patient-details-form", { state: { patient, phone } })}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Details
                                </Button>
                                <Button
                                    onClick={() => navigate("/appointment", { state: { phone, patientId: patient.id } })}
                                    className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white"
                                >
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    Book Appointment
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Recent Activity Section */}
                <Card className="shadow-2xl border-0 rounded-2xl dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-600 dark:from-gray-700 dark:to-gray-600 text-white">
                        <CardTitle className="flex items-center gap-3 text-xl">
                            <FileText className="h-6 w-6" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {recentActivity.length === 0 ? (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                                No recent activity
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {recentActivity.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                                    >
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {activity.description}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {activity.type} • {formatDate(activity.date)}
                                            </p>
                                        </div>
                                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                            {activity.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default PatientDetails;