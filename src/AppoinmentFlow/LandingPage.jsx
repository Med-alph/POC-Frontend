import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authAPI } from "../api/authAPI";

const LandingPage = () => {
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSendOTP = async () => {
        if (!phone) return alert("Please enter phone number");
        setLoading(true);
        try {
            const res = await authAPI.sendOtp({ phone });
            // res = { success: true, isExistingPatient: boolean }
            if (res.success) {
                navigate("/otp-verification", {
                    state: { phone, isExistingPatient: res.isExistingPatient },
                });
            } else {
                alert("Failed to send OTP");
            }
        } catch (err) {
            alert("Error sending OTP: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen gap-6">
            <h1 className="text-2xl font-bold">Book Appointment</h1>
            <Input
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-64"
                disabled={loading}
            />
            <Button onClick={handleSendOTP} className="w-64" disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
            </Button>
        </div>
    );
};

export default LandingPage;
