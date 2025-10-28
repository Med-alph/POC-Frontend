import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import authAPI from "../api/AuthAPI";


const OTPVerification = () => {
  const navigate = useNavigate();
  const { phone } = useLocation().state || {};
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(""); // To show success/error messages
  const [timer, setTimer] = useState(30); // 30 secs countdown

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

  // Determine if message is error for styling
  const isError =
    message.toLowerCase().includes("error") ||
    message.toLowerCase().includes("invalid");

  // Handle OTP Verification followed by checking if phone is existing
  const handleVerifyOtp = async () => {
    if (!otp) {
      setMessage("Please enter OTP");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await authAPI.verifyOtp({ phone, otp });
      if (res.success) {
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
        setMessage("Invalid OTP, please try again");
      }
    } catch (err) {
      setMessage("Error verifying OTP");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP: calls API, resets timer & message
  const handleResend = async () => {
    setMessage("");
    try {
      await authAPI.sendOtp({ phone });
      setTimer(30);
      setMessage("OTP resent successfully");
    } catch {
      setMessage("Failed to resend OTP");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6 px-4">
      <h1 className="text-2xl font-bold">Verify OTP</h1>
      <p className="mb-2">OTP sent to {phone}</p>
      {message && (
        <div
          className={`text-center text-sm p-2 rounded ${
            isError ? "text-red-600 bg-red-100" : "text-green-600 bg-green-100"
          }`}
        >
          {message}
        </div>
      )}
      <Input
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className="w-64"
        disabled={loading}
      />
      <div className="flex justify-between w-64 items-center px-4 mb-4 text-sm text-gray-600">
        <button
          disabled={loading || timer > 0}
          className={`underline hover:text-blue-600 disabled:text-gray-400`}
          onClick={handleResend}
        >
          Resend OTP
        </button>
        <span>Time remaining: {timer}s</span>
      </div>
      <Button onClick={handleVerifyOtp} className="w-64" disabled={loading}>
        {loading ? "Verifying..." : "Verify OTP"}
      </Button>
    </div>
  );
};

export default OTPVerification;
