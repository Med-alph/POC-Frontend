import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const PatientDetailsForm = () => {
    const navigate = useNavigate();

    const [isBookingForOther, setIsBookingForOther] = useState(false);
    const [firstTime, setfirstTime] = useState(false);

    // Booker Info
    const [bookerName, setBookerName] = useState("");
    const [bookerPhone, setBookerPhone] = useState("");
    const [bookerEmail, setBookerEmail] = useState("");

    // Patient Info
    const [name, setName] = useState("");
    const [dob, setDob] = useState("");
    const [gender, setGender] = useState("");
    const [bloodGroup, setBloodGroup] = useState("");

    // Contact Info
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");

    // Medical History
    const [medicalHistory, setMedicalHistory] = useState("");
    const [allergies, setAllergies] = useState("");
    const [medications, setMedications] = useState("");
    const [surgeries, setSurgeries] = useState("");
    const [familyHistory, setFamilyHistory] = useState("");
    const [lifestyle, setLifestyle] = useState([]);
    const [emergencyContact, setEmergencyContact] = useState("");

    const lifestyleOptions = [
        "Non-smoker",
        "Smoker",
        "Occasional Alcohol",
        "Regular Alcohol",
        "Active",
        "Sedentary",
    ];

    const handleLifestyleChange = (option) => {
        setLifestyle((prev) =>
            prev.includes(option)
                ? prev.filter((o) => o !== option)
                : [...prev, option]
        );
    };

    const handleSubmit = async () => {
        try {
            const payload = {
                isBookingForOther,
                booker: isBookingForOther
                    ? { name: bookerName, phone: bookerPhone, email: bookerEmail }
                    : { name, phone, email }, // self-booking
                patient: { name, dob, gender, bloodGroup, phone, email, address },
                medicalHistory,
                allergies,
                medications,
                surgeries,
                familyHistory,
                lifestyle,
                emergencyContact,
            };
            await axios.post("/api/patient/full-details", payload);
            navigate("/confirmation");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex justify-center py-10 px-4">
            <Card className="w-full max-w-4xl p-6 space-y-6">
                <CardContent className="space-y-6">
                    <h2 className="text-3xl font-bold text-center">Patient Medical History</h2>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            checked={isBookingForOther}
                            onCheckedChange={(checked) => setIsBookingForOther(checked)}
                        />
                        <Label>Booking for someone else?</Label>

                        <Checkbox
                            checked={firstTime}
                            onCheckedChange={(checked) => setfirstTime(checked)}
                        />
                        <Label>Booking for the first time ?</Label>
                    </div>

                    {/* Booker Info (only if booking for someone else) */}
                    {isBookingForOther && (
                        <fieldset className="border p-4 rounded-md space-y-4">
                            <legend className="font-semibold text-lg">Booker Information</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Booker Name</Label>
                                    <Input
                                        value={bookerName}
                                        onChange={(e) => setBookerName(e.target.value)}
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div>
                                    <Label>Phone</Label>
                                    <Input
                                        value={bookerPhone}
                                        onChange={(e) => setBookerPhone(e.target.value)}
                                        placeholder="+91 9876543210"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={bookerEmail}
                                        onChange={(e) => setBookerEmail(e.target.value)}
                                        placeholder="example@mail.com"
                                    />
                                </div>
                            </div>
                        </fieldset>
                    )}

                    {/* Patient Info */}
                    <fieldset className="border p-4 rounded-md space-y-4">
                        <legend className="font-semibold text-lg">Patient Information</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Name</Label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
                            </div>
                            <div>
                                <Label>Date of Birth</Label>
                                <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                            </div>
                            <div>
                                <Label>Gender</Label>
                                <Input placeholder="Male / Female / Other" value={gender} onChange={(e) => setGender(e.target.value)} />
                            </div>
                            <div>
                                <Label>Blood Group</Label>
                                <Input placeholder="A+, O-, etc." value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} />
                            </div>
                        </div>
                    </fieldset>

                    {/* Contact Info */}
                    <fieldset className="border p-4 rounded-md space-y-4">
                        <legend className="font-semibold text-lg">Contact Information</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Phone</Label>
                                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" />
                            </div>
                            <div>
                                <Label>Email</Label>
                                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@mail.com" />
                            </div>
                            <div className="md:col-span-2">
                                <Label>Address</Label>
                                <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter full address" />
                            </div>
                        </div>
                    </fieldset>

                    {/* Medical History */}
                    <fieldset className="border p-4 rounded-md space-y-4">
                        <legend className="font-semibold text-lg">Medical History</legend>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <Label>Past Illnesses</Label>
                                <Textarea value={medicalHistory} onChange={(e) => setMedicalHistory(e.target.value)} placeholder="Diabetes, Hypertension, etc." />
                            </div>
                            <div>
                                <Label>Allergies</Label>
                                <Textarea value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Peanuts, Penicillin, etc." />
                            </div>
                            <div>
                                <Label>Medications</Label>
                                <Textarea value={medications} onChange={(e) => setMedications(e.target.value)} placeholder="Current medications" />
                            </div>
                            <div>
                                <Label>Past Surgeries / Procedures</Label>
                                <Textarea value={surgeries} onChange={(e) => setSurgeries(e.target.value)} placeholder="Appendectomy, Knee surgery, etc." />
                            </div>
                            <div>
                                <Label>Family Medical History</Label>
                                <Textarea value={familyHistory} onChange={(e) => setFamilyHistory(e.target.value)} placeholder="Diabetes, Heart Disease, etc." />
                            </div>
                            <div>
                                <Label>Lifestyle</Label>
                                <div className="flex flex-wrap gap-4">
                                    {lifestyleOptions.map((option) => (
                                        <div key={option} className="flex items-center gap-2">
                                            <Checkbox
                                                checked={lifestyle.includes(option)}
                                                onCheckedChange={() => handleLifestyleChange(option)}
                                            />
                                            <Label>{option}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Label>Emergency Contact</Label>
                                <Input placeholder="Name + Phone" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} />
                            </div>
                        </div>
                    </fieldset>

                    <Button onClick={handleSubmit} className="w-full mt-4">
                        Save & Continue
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default PatientDetailsForm;
