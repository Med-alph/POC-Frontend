import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
// import axios from "axios";

const PatientDetails = () => {
    const [name, setName] = useState("");
    const [dob, setDob] = useState("");
    const [email, setEmail] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const phone = (location.state)?.phone;

    const handleSubmit = async () => {
        // try {
        //     await axios.post("/api/patient", { name, dob, email, phone });
        //     navigate("/book-appointment", { state: { phone } });
        // } catch (err) {
        //     console.error(err);
        // }
    };

    return (
        <div className="flex items-center justify-center h-screen">
            <Card className="w-96 p-6">
                <CardContent className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold">Patient Details</h2>
                    <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
                    <Input type="date" placeholder="DOB" value={dob} onChange={(e) => setDob(e.target.value)} />
                    <Input placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <Button onClick={handleSubmit}>Next</Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default PatientDetails;