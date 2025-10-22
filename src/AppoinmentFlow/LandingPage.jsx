import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// import axios from "axios";

const LandingPage = () => {
    const [phone, setPhone] = useState("");
    const navigate = useNavigate();

    const handleSendOTP = async () => {
        // try {
        //     await axios.post("/api/send-otp", { phone });
        //     navigate("/verify-otp", { state: { phone } });
        // } catch (err) {
        //     console.error(err);
        // }
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
            />
            <Button onClick={handleSendOTP} className="w-64">
                Send OTP
            </Button>
        </div>
    );
};

export default LandingPage;
