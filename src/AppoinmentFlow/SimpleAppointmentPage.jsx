import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Stethoscope, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import AddPatientDialog from "@/Patients/AddPatient";
import { patientsAPI } from "@/api/patientsapi";
import NewAppointmentFlow from "./NewAppointmentFlow";

export default function SimpleAppointmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { phone } = location.state || {};

  const HOSPITAL_ID = "550e8400-e29b-41d4-a716-446655440001";

  // Patient states
  const [showAddPatientDialog, setShowAddPatientDialog] = useState(false);
  const [existingPatientData, setExistingPatientData] = useState(null);
  const [showPatientConfirmation, setShowPatientConfirmation] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState(null);
  const [checkingPatient, setCheckingPatient] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", newMode.toString());
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Check for existing patient
  useEffect(() => {
    const checkPatient = async () => {
      if (!phone) return;
      try {
        setCheckingPatient(true);
        const patient = await patientsAPI.getByPhoneAndHospital(phone, HOSPITAL_ID);
        if (patient && patient.id) {
          setExistingPatientData(patient);
          setShowPatientConfirmation(true);
          setRegisteredPatient(patient);
        } else {
          setShowAddPatientDialog(true);
        }
      } catch {
        toast.error("Could not check patient records");
      } finally {
        setCheckingPatient(false);
      }
    };
    checkPatient();
  }, [phone]);

  const handleAddPatient = async (patientData) => {
    try {
      setLoading(true);
      const newPatient = await patientsAPI.create({
        ...patientData,
        hospital_id: HOSPITAL_ID,
        phone: phone,
      });
      setRegisteredPatient(newPatient);
      setShowAddPatientDialog(false);
      toast.success("Patient registered successfully!");
    } catch {
      toast.error("Failed to register patient");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithExistingPatient = () => {
    setRegisteredPatient(existingPatientData);
    setShowPatientConfirmation(false);
    toast.success(`Welcome back, ${existingPatientData.patient_name}`);
  };

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
      return "N/A";
    }
  };

  // If patient is registered, show the new appointment flow
  if (registeredPatient) {
    return <NewAppointmentFlow registeredPatient={registeredPatient} phone={phone} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-start justify-center py-10 px-4 transition-colors duration-300">
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
      
      <div className="w-full max-w-lg">
        <div className="inline-flex items-center gap-3 bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-lg mb-4">
          <Stethoscope className="h-6 w-6" />
          <span className="text-sm font-semibold">MedPortal — Patient Access</span>
        </div>
        
        <Card className="w-full shadow-2xl border-0 rounded-2xl dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 text-white">
            <CardTitle className="text-xl">Book an Appointment</CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Patient Information</h2>
              </div>
              
              {checkingPatient ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="animate-spin text-blue-600 h-10 w-10 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Verifying patient information...</p>
                </div>
              ) : showPatientConfirmation && existingPatientData ? (
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 shadow-lg">
                  <CardHeader className="border-b border-green-200 dark:border-green-700 bg-white/50 dark:bg-gray-800/50">
                    <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
                      Patient Found!
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Full Name</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {existingPatientData.patient_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Phone</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {existingPatientData.phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Date of Birth</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {existingPatientData.date_of_birth ? formatDate(existingPatientData.date_of_birth) : "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Gender</p>
                        <p className="font-semibold text-gray-900 dark:text-white capitalize">
                          {existingPatientData.gender || "Not specified"}
                        </p>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                      onClick={handleContinueWithExistingPatient}
                    >
                      Continue to Appointment Booking
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No patient record found. Please register to continue.
                  </p>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all" 
                    onClick={() => setShowAddPatientDialog(true)}
                  >
                    Register New Patient
                  </Button>
                </div>
              )}
              
              <AddPatientDialog
                open={showAddPatientDialog}
                setOpen={setShowAddPatientDialog}
                onAdd={handleAddPatient}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}