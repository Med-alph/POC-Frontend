import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// import axios from "axios";

const OTPVerification = () => {
    const [otp, setOtp] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const phone = (location.state)?.phone;

    const handleVerifyOTP = async () => {
        // try {
        //     await axios.post("/api/verify-otp", { phone, otp });
        //     navigate("/patient-details", { state: { phone } });
        // } catch (err) {
        //     console.error(err);
        // }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen gap-6">
            <h1 className="text-2xl font-bold">Verify OTP</h1>
            <Input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-64"
            />
            <Button onClick={handleVerifyOTP} className="w-64">
                Verify
            </Button>
        </div>
    );
};

export default OTPVerification;
