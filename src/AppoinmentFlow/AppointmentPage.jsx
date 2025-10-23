import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

// Simple inline Patient Details Form for booking-for-other scenario
const PatientDetailsMiniForm = ({ onChange, initialPhone }) => {
    const [name, setName] = useState("");
    const [dob, setDob] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState(initialPhone || "");

    // Update parent on any field change
    useEffect(() => {
        onChange({ name, dob, email, phone });
    }, [name, dob, email, phone, onChange]);

    return (
        <fieldset className="border p-4 rounded-md space-y-4">
            <legend className="font-semibold">Patient Details</legend>
            <Input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
            <Input type="date" placeholder="DOB" value={dob} onChange={e => setDob(e.target.value)} />
            <Input type="email" placeholder="Email (optional)" value={email} onChange={e => setEmail(e.target.value)} />
            <Input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
        </fieldset>
    );
};

export default function AppointmentForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const passedState = location.state || {};
    const incomingPhone = passedState.phone || "";

    // Detect if first time visitor from location state; default to null (undecided)
    const [isFirstTime, setIsFirstTime] = useState(passedState.isFirstTime ?? null);
    
    // Booking for self or someone else question for first-time patients only
    const [bookingForOther, setBookingForOther] = useState(null);

    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState("");
    const [reason, setReason] = useState("");
    const [patientPhone, setPatientPhone] = useState(incomingPhone);

    // Patient details filled if booking for other (or can extend for first-timers)
    const [patientDetails, setPatientDetails] = useState({});

    // When date and doctor selected, generate dummy slots
    const handleSelectDate = () => {
        if (selectedDoctor && selectedDate) setSlots(generateDummySlots());
    };

    // Confirm appointment, pass all collected data to confirmation
    const handleConfirm = () => {
        // Compose data to send forward
        let finalPhone = patientPhone;
        if (isFirstTime && bookingForOther && patientDetails.phone) {
            finalPhone = patientDetails.phone;
        }
        navigate("/confirmation", {
            state: {
                doctor: selectedDoctor?.name,
                date: selectedDate,
                slot: selectedSlot,
                firstTime: isFirstTime,
                reason,
                patientPhone: finalPhone,
                bookingForOther,
                patientDetails: bookingForOther ? patientDetails : null,
            }
        });
    };

    // Render icon for time slot status
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

                    {/* If isFirstTime is undefined (like page refresh) ask question */}
                    {isFirstTime === null && (
                        <fieldset className="border p-4 rounded-md space-y-2">
                            <legend className="font-semibold">First-time Visit?</legend>
                            <div className="flex gap-4">
                                <Button variant={"outline"} onClick={() => setIsFirstTime(true)}>Yes</Button>
                                <Button variant={"outline"} onClick={() => setIsFirstTime(false)}>No</Button>
                            </div>
                        </fieldset>
                    )}

                    {/* For first-time patients: booking for self or other */}
                    {isFirstTime === true && bookingForOther === null && (
                        <fieldset className="border p-4 rounded-md space-y-2">
                            <legend className="font-semibold">Booking For?</legend>
                            <div className="flex gap-4">
                                <Button variant={"outline"} onClick={() => setBookingForOther(false)}>Self</Button>
                                <Button variant={"outline"} onClick={() => setBookingForOther(true)}>Someone Else</Button>
                            </div>
                        </fieldset>
                    )}

                    {/* If first time and booking for other, show patient details form */}
                    {isFirstTime === true && bookingForOther === true && (
                        <PatientDetailsMiniForm onChange={setPatientDetails} initialPhone={incomingPhone} />
                    )}

                    {/* Doctor selection for first time or always show if isFirstTime true */}
                    {(isFirstTime === true || isFirstTime === false) && (
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

                    {/* For returning patients, reason for visit + phone if not present */}
                    {isFirstTime === false && (
                        <fieldset className="border p-4 rounded-md space-y-2">
                            <legend className="font-semibold">Reason for Appointment</legend>
                            {!reason && (
                                <div className="flex flex-col gap-2">
                                    {["Follow-up", "Prescription Renewal", "Lab Result Review", "Consultation"].map(r => (
                                        <Button
                                            key={r}
                                            variant={reason === r ? "default" : "outline"}
                                            onClick={() => setReason(r)}
                                        >
                                            {r}
                                        </Button>
                                    ))}
                                </div>
                            )}
                            {reason && !patientPhone && (
                                <Input
                                    placeholder="Enter Phone / Patient ID"
                                    value={patientPhone}
                                    onChange={e => setPatientPhone(e.target.value)}
                                />
                            )}
                        </fieldset>
                    )}

                    {/* Date selection section */}
                    {((isFirstTime === true && selectedDoctor)
                        || (isFirstTime === false && reason && patientPhone)
                        || (isFirstTime === true && bookingForOther === false && selectedDoctor)) && (
                            <fieldset className="border p-4 rounded-md space-y-2">
                                <legend className="font-semibold">Select Date</legend>
                                <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                                <Button className="mt-2" onClick={handleSelectDate} disabled={!selectedDate}>Load Available Times</Button>
                            </fieldset>
                        )}

                    {/* Time slots */}
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

                    {/* Confirm button */}
                    {(selectedSlot ||
                        (isFirstTime === false && reason && patientPhone)) && (
                            <Button className="w-full mt-4" onClick={handleConfirm}>Confirm Appointment</Button>
                        )}
                </CardContent>
            </Card>
        </div>
    );
}
