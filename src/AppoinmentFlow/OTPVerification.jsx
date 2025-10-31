import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Smartphone, Stethoscope, Moon, Sun, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import authAPI from "@/API/AuthAPI";
import InputOtp from "@/components/InputOtp";


const OTPVerification = () => {
  const navigate = useNavigate();
  const { phone, countryCode } = useLocation().state || {};
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30); // 30 secs countdown
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

  // Redirect if accessed directly
  useEffect(() => {
    if (!phone) navigate("/landing");
  }, [phone, navigate]);

  // Timer effect: count down from 30
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Handle OTP Verification followed by checking if phone is existing
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) return toast.error("Please enter a valid 6-digit OTP");
    setLoading(true);
    try {
      const res = await authAPI.verifyOtp({ phone, otp });
      if (res.success) {
        toast.success("OTP verified successfully");
        
        // Store authentication token
        if (res.token) {
          localStorage.setItem("auth_token", res.token);
          localStorage.setItem("isAuthenticated", "true");
        }
        
        // Check if phone exists in patient DB via separate API call
        const checkRes = await authAPI.checkPhone({ phone });
        if (checkRes.isExistingPatient) {
          // Navigate to appointment with isFirstTime false
          navigate("/appointment", { state: { phone, isFirstTime: false } });
        } else {
          // New patient flow
          navigate("/appointment", { state: { phone, isFirstTime: true } });
        }
      } else {
        toast.error("Invalid OTP, please try again");
      }
    } catch (err) {
      toast.error("Error verifying OTP");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP: calls API, resets timer & message
  const handleResend = async () => {
    try {
      await authAPI.sendOtp({ phone });
      setTimer(30);
      toast.success("OTP resent successfully");
    } catch {
      toast.error("Failed to resend OTP");
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
        
        <Card className="shadow-2xl border-0 rounded-2xl dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 text-white">
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShieldCheck className="h-6 w-6" />
              Verify OTP
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Step indicator */}
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white font-semibold">1</span>
              <span>of</span>
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 font-semibold">2</span>
              <span className="ml-2">Appointment booking</span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>Enter the 6-digit code sent to</span>
              <span className="font-semibold text-gray-900 dark:text-white">{countryCode} {phone}</span>
            </p>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                Enter the 6-digit code
              </label>
              <InputOtp 
                length={6}
                value={otp}
                onChange={setOtp}
                disabled={loading}
                autoFocus={true}
              />
            </div>

            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 pt-2">
              <button
                disabled={loading || timer > 0}
                className="underline hover:text-blue-600 dark:hover:text-blue-400 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                onClick={handleResend}
              >
                Resend code
              </button>
              {timer > 0 && (
                <span className="font-medium">{timer}s remaining</span>
              )}
            </div>
            
            <Button 
              onClick={handleVerifyOtp} 
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white h-12 text-base font-semibold rounded-xl transition-all duration-200 hover:shadow-lg" 
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
              className="w-full text-gray-600 dark:text-gray-400"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Change phone number
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OTPVerification;
