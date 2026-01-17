import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useHospital } from "@/contexts/HospitalContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Stethoscope, User, Calendar, Phone, Mail, FileText, Edit, PlusCircle, Moon, Sun } from "lucide-react";
import { patientsAPI } from "@/api/patientsapi";

const PatientDetails = () => {
    const navigate = useNavigate();
    const { hospitalInfo } = useHospital();
    const HOSPITAL_ID = hospitalInfo?.hospital_id;
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
                        {hospitalInfo?.logo ? (
                            <img src={hospitalInfo.logo} alt={hospitalInfo.name} className="h-6 w-6 object-contain" />
                        ) : (
                            <Stethoscope className="h-6 w-6" />
                        )}
                        <span className="text-sm font-semibold">{hospitalInfo?.name || "MedPortal"} — Patient Access</span>
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
                    <Card className="shadow-2xl border-0 rounded-2xl dark:bg-gray-800 dark:border-gray-700 overflow-hidden mb-6 animate-in fade-in-0">
                        <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 dark:from-blue-700 dark:via-blue-600 dark:to-indigo-600 text-white">
                            <CardTitle className="flex items-center gap-3 text-2xl">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <User className="h-6 w-6" />
                                </div>
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-start gap-3">
                                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Full Name</p>
                                            <p className="font-bold text-lg text-gray-900 dark:text-white">
                                                {patient.patient_name || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-start gap-3">
                                        <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Date of Birth</p>
                                            <p className="font-bold text-lg text-gray-900 dark:text-white">
                                                {formatDate(patient.dob)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-start gap-3">
                                        <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Phone Number</p>
                                            <p className="font-bold text-lg text-gray-900 dark:text-white">
                                                {patient.contact_info || phone}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-start gap-3">
                                        <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Email</p>
                                            <p className="font-bold text-lg text-gray-900 dark:text-white">
                                                {patient.email || "Not provided"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {patient.age && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                                        <div className="flex items-start gap-3">
                                            <User className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Age</p>
                                                <p className="font-bold text-lg text-gray-900 dark:text-white">
                                                    {patient.age} years
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {patient.insurance_provider && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                                        <div className="flex items-start gap-3">
                                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Insurance</p>
                                                <p className="font-bold text-lg text-gray-900 dark:text-white">
                                                    {patient.insurance_provider}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <Button
                                    onClick={() => navigate("/patient-details-form", { state: { patient, phone } })}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                                >
                                    <Edit className="h-5 w-5 mr-2" />
                                    Edit Details
                                </Button>
                                <Button
                                    onClick={() => navigate("/appointment", { state: { phone, patientId: patient.id } })}
                                    className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                                >
                                    <PlusCircle className="h-5 w-5 mr-2" />
                                    Book Appointment
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Recent Activity Section */}
                <Card className="shadow-2xl border-0 rounded-2xl dark:bg-gray-800 dark:border-gray-700 overflow-hidden animate-in fade-in-0">
                    <CardHeader className="bg-gradient-to-r from-gray-700 via-gray-600 to-gray-500 dark:from-gray-700 dark:via-gray-600 dark:to-gray-500 text-white">
                        <CardTitle className="flex items-center gap-3 text-2xl">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <FileText className="h-6 w-6" />
                            </div>
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {recentActivity.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                <p className="text-gray-500 dark:text-gray-400">
                                    No recent activity
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentActivity.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                                    >
                                        <div className="flex-1">
                                            <p className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                                                {activity.description}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {activity.type} • {formatDate(activity.date)}
                                            </p>
                                        </div>
                                        <span className="px-4 py-2 text-xs font-bold rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 shadow-sm">
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