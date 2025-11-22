import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, ShieldCheck, Clock, Smartphone, Moon, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import authAPI from "@/api/authapi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const phoneDigitsOnly = (value) => value.replace(/[^0-9]/g, "").slice(0, 10);

// Country codes
const countries = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+1", country: "United States", flag: "🇺🇸" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
];

const LandingPage = () => {
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const navigate = useNavigate();

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

  const handleSendOTP = async () => {
    const clean = phoneDigitsOnly(phone);
    if (clean.length !== 10) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    try {
      const fullPhone = `${countryCode}${clean}`;
      const res = await authAPI.sendOtp({ phone: clean, countryCode });
      if (res?.success) {
        toast.success("OTP sent successfully");
        // Store session info
        if (res.otpSessionId) {
          sessionStorage.setItem("otpSessionId", res.otpSessionId);
        }
        navigate("/otp-verification", {
          state: { phone: clean, countryCode, isExistingPatient: res.isExistingPatient },
        });
      } else {
        toast.error(res?.message || "Failed to send OTP");
      }
    } catch (err) {
      toast.error(err?.message || "Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center transition-colors duration-300">
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

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-lg">
              <Stethoscope className="h-6 w-6" />
              <span className="text-sm font-semibold">MedPortal — Patient Access</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
              Book your appointment in minutes
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Simple, secure, and fast way to see your doctor. No downloads required.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Save time</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Skip waiting lines</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Secure</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">OTP-based login</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Mobile-first</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Works on any device</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="shadow-2xl border-0 rounded-2xl dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 text-white">
              <CardTitle className="text-xl">Start with your phone number</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <span className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.code}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    placeholder="Enter 10-digit phone"
                    value={phone}
                    onChange={(e) => setPhone(phoneDigitsOnly(e.target.value))}
                    disabled={loading}
                    className="flex-1"
                  />
                </div>
              </div>
              <Button 
                onClick={handleSendOTP} 
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white h-12 text-base font-semibold rounded-xl transition-all duration-200 hover:shadow-lg" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Sending OTP…
                  </>
                ) : (
                  "Send OTP"
                )}
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                We'll send a 6-digit code to your phone.
              </p>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <button className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Help</button>
                  <button className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy</button>
                  <button className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms</button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
