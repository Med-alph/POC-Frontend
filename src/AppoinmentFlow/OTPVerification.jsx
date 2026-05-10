import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useHospital } from "@/contexts/HospitalContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Smartphone, Stethoscope, Moon, Sun, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import authAPI from "@/api/authapi";
import { setAuthData } from "@/utils/auth";
import InputOtp from "@/components/InputOtp";
import AddPatientDialog from "@/Patients/AddPatient";
import patientsAPI from "../api/patientsapi";

const OTPVerification = () => {
  const navigate = useNavigate();
  const { phone, countryCode } = useLocation().state || {};
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30); // 30 seconds countdown
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [showAddPatientDialog, setShowAddPatientDialog] = useState(false);
  const [userId, setUserId] = useState(null); // To store patient id if needed for adding patient
  const { hospitalInfo } = useHospital();
  const HOSPITAL_ID = hospitalInfo?.id || hospitalInfo?.hospital_id;

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
    document.documentElement.classList.toggle("dark", newMode);
    console.log("Dark mode toggled:", newMode);
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    }
    console.log("useEffect darkMode:", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (!phone) {
      console.warn("No phone in location state, redirecting to /landing");
      navigate("/landing");
    }
  }, [phone, navigate]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Handle OTP Verification and conditionally show AddPatientDialog or navigate to dashboard
  const handleVerifyOtp = async (otpFromArg = null) => {
    // Determine the current OTP to use: either from argument (if called from onComplete) or from state
    const currentOtp = typeof otpFromArg === "string" ? otpFromArg : otp;

    // Check if the current OTP is fully formed (6 digits)
    if (!currentOtp || currentOtp.length !== 6) {
      // If manually clicked or something went wrong - toast error
      if (!otpFromArg) { // only show error if NOT an automated onComplete trigger
        toast.error("Please enter a valid 6-digit OTP");
      }
      console.warn("Attempted OTP verify with invalid OTP:", currentOtp);
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.verifyOtp({ phone, otp: currentOtp, hospitalId: HOSPITAL_ID });
      console.log('OTP verification API response:', res);

      if (res.success) {
        toast.success('OTP verified successfully');

        // Store token and user data (even if incomplete)
        // This ensures the current session is tracked in memory
        setAuthData(res.token, res.user || res.patient || { phone, role: 'patient_incomplete' });
        localStorage.setItem('isAuthenticated', 'true');

        if (res.isNewPatient) {
          // Store the underlying user ID if provided, used for linking during registration
          setUserId(res.user?.id || res.patient?.id || null);
          setShowAddPatientDialog(true);
        } else {
          navigate('/patient-dashboard', { replace: true });
        }
      } else {
        toast.error(res.message || 'Invalid OTP, please try again');
      }
    } catch (err) {
      toast.error(err.message || "Error verifying OTP");
      console.error("Error in OTP verification:", err);
    } finally {
      setLoading(false);
    }
  };

  // Function to resend OTP and reset timer
  const handleResend = async () => {
    try {
      console.log("Resending OTP for phone:", phone);
      await authAPI.sendOtp({ phone, hospitalId: HOSPITAL_ID });
      setTimer(30);
      toast.success("OTP resent successfully");
    } catch (err) {
      toast.error(err.message || "Failed to resend OTP");
      console.error("Failed to resend OTP:", err);
    }
  };

  const handleAddPatient = async (patientData) => {
    console.log("handleAddPatient called with data:", patientData);
    try {
      setLoading(true);
      const newPatient = await patientsAPI.create({
        ...patientData,
        user_id: userId,
        hospital_id: HOSPITAL_ID,
        contact_info: phone,
      });
      console.log("New patient creation API response:", newPatient);
      // Do not close dialog or navigate here. Return patient for consent flow.
      return newPatient;
    } catch (error) {
      console.error("Error creating new patient:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationComplete = (response) => {
    // After creation AND consent, handle login/navigation
    // response now contains normalized patient info and potentially a new session token
    if (response) {
      const patient = response.patient || response.data || response;
      const token = response.token; // Upgrade to full token returned by backend

      // Update local auth data with the new ID and Token
      setAuthData(token, patient);
      localStorage.setItem("isAuthenticated", "true");

      navigate("/patient-dashboard", { replace: true });
    } else {
      navigate("/landing");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center px-4 transition-colors duration-300">
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

      <div className="w-full max-w-md mx-auto">
        <div className="inline-flex items-center gap-3 bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-lg mb-4">
          <Stethoscope className="h-6 w-6" />
          <span className="text-sm font-semibold">MedPortal — Patient Access</span>
        </div>

        <Card className="shadow-2xl border-0 rounded-2xl dark:bg-gray-800 dark:border-gray-700 overflow-hidden animate-in fade-in-0 zoom-in-95">
          <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 dark:from-blue-700 dark:via-blue-600 dark:to-indigo-600 text-white">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-white/20 rounded-lg">
                <ShieldCheck className="h-6 w-6" />
              </div>
              Verify OTP
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold shadow-lg">1</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">of</span>
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 font-bold">2</span>
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-2">Appointment booking</span>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 sm:p-5 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex flex-col sm:flex-row sm:items-center gap-x-2 flex-wrap min-w-0">
                  <span className="text-[13px] sm:text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">Enter the 6-digit code sent to</span>
                  <span className="text-[15px] sm:text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">{countryCode} {phone}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 text-center">
                Enter the 6-digit code
              </label>
              <div className="flex justify-center">
                <InputOtp
                  length={6}
                  value={otp}
                  onChange={setOtp}
                  onComplete={handleVerifyOtp}
                  disabled={loading}
                  autoFocus={true}
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              <button
                disabled={loading || timer > 0}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-colors underline"
                onClick={handleResend}
              >
                Resend code
              </button>
              {timer > 0 && (
                <span className="font-bold text-gray-700 dark:text-gray-300">{timer}s remaining</span>
              )}
            </div>

            <Button
              onClick={handleVerifyOtp}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white h-14 text-base font-bold rounded-xl transition-all duration-200 hover:shadow-xl shadow-lg"
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate("/landing")}
              className="w-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 h-12 rounded-xl font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Change phone number
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AddPatientDialog for new patient registration */}
      <AddPatientDialog
        open={showAddPatientDialog}
        setOpen={setShowAddPatientDialog}
        onAdd={handleAddPatient}
        hospitalId={HOSPITAL_ID}
        isSelfRegistration={true}
        onComplete={handleRegistrationComplete}
      />
    </div>
  );
};

export default OTPVerification;
