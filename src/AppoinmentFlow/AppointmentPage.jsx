import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CalendarIcon, CheckCircleIcon, AlertTriangleIcon, XCircleIcon } from "lucide-react";

const doctors = [
    { id: 1, name: "Dr. Smith" },
    { id: 2, name: "Dr. Patel" },
    { id: 3, name: "Dr. Lee" },
    { id: 4, name: "Dr. Gomez" },
    { id: 5, name: "Dr. Khan" },
];

const generateDummySlots = () => {
    const times = [
        "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
        "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
        "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM"
    ];
    return times.map(time => ({
        time,
        status: ["available", "few", "unavailable"][Math.floor(Math.random() * 3)]
    }));
};

export default function AppointmentForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const phoneFromState = location.state?.phone || "";

    const [isFirstTime, setIsFirstTime] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState("");
    const [reason, setReason] = useState("");
    const [patientPhone, setPatientPhone] = useState(phoneFromState);

    const handleSelectDate = () => {
        if (selectedDoctor && selectedDate) setSlots(generateDummySlots());
    };

    const handleConfirm = () => {
        navigate("/confirmation", {
            state: { doctor: selectedDoctor?.name, date: selectedDate, slot: selectedSlot, firstTime: isFirstTime, reason, patientPhone }
        });
    };

    const renderSlotIcon = (status) => {
        switch (status) {
            case "available": return <CheckCircleIcon className="text-green-500" />;
            case "few": return <AlertTriangleIcon className="text-yellow-500" />;
            case "unavailable": return <XCircleIcon className="text-red-500" />;
            default: return null;
        }
    };

    return (
        <div className="flex justify-center py-10 px-4 bg-gray-50 min-h-screen">
            <Card className="w-full max-w-lg p-6 shadow-lg space-y-6">
                <CardContent className="space-y-4">
                    <h2 className="text-2xl font-bold text-center">Book Appointment</h2>

                    <fieldset className="border p-4 rounded-md space-y-2">
                        <legend className="font-semibold">First-time Visit?</legend>
                        <div className="flex gap-4">
                            <Button variant={isFirstTime === true ? "default" : "outline"} onClick={() => setIsFirstTime(true)}>Yes</Button>
                            <Button variant={isFirstTime === false ? "default" : "outline"} onClick={() => setIsFirstTime(false)}>No</Button>
                        </div>
                    </fieldset>

                    {isFirstTime && (
                        <fieldset className="border p-4 rounded-md space-y-2">
                            <legend className="font-semibold">Select Doctor</legend>
                            {doctors.map(doc => (
                                <Button
                                    key={doc.id}
                                    variant={selectedDoctor?.id === doc.id ? "default" : "outline"}
                                    className="w-full text-left"
                                    onClick={() => setSelectedDoctor(doc)}
                                >
                                    {doc.name}
                                </Button>
                            ))}
                        </fieldset>
                    )}

                    {isFirstTime === false && (
                        <fieldset className="border p-4 rounded-md space-y-2">
                            <legend className="font-semibold">Returning Patient Info</legend>

                            {!reason && (
                                <div className="flex flex-col gap-2">
                                    {["Follow-up", "Prescription Renewal", "Lab Result Review", "Consultation"].map(r => (
                                        <Button key={r} variant={reason === r ? "default" : "outline"} onClick={() => setReason(r)}>
                                            {r}
                                        </Button>
                                    ))}
                                </div>
                            )}

                            {reason && !patientPhone && (
                                <Input placeholder="Enter Phone / Patient ID" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} />
                            )}
                        </fieldset>
                    )}

                    {/* Section 3: Date selection */}
                    {((isFirstTime && selectedDoctor) || (isFirstTime === false && reason && patientPhone)) && (
                        <fieldset className="border p-4 rounded-md space-y-2">
                            <legend className="font-semibold">Select Date</legend>
                            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                            <Button className="mt-2" onClick={handleSelectDate} disabled={!selectedDate}>Load Available Times</Button>
                        </fieldset>
                    )}

                    {/* Section 4: Time slots */}
                    {slots.length > 0 && (
                        <fieldset className="border p-4 rounded-md space-y-2">
                            <legend className="font-semibold">Select Time Slot</legend>
                            <div className="grid grid-cols-2 gap-2">
                                {slots.map((slot, i) => (
                                    <Button
                                        key={i}
                                        variant={selectedSlot === slot.time ? "default" : slot.status === "unavailable" ? "outline" : "default"}
                                        className={`flex justify-between items-center ${slot.status === "unavailable" ? "opacity-50 cursor-not-allowed" : ""}`}
                                        onClick={() => slot.status !== "unavailable" && setSelectedSlot(slot.time)}
                                    >
                                        {slot.time} {renderSlotIcon(slot.status)}
                                    </Button>
                                ))}
                            </div>
                        </fieldset>
                    )}

                    {(selectedSlot || (isFirstTime === false && reason && patientPhone)) && (
                        <Button className="w-full mt-4" onClick={handleConfirm}>Confirm Appointment</Button>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
