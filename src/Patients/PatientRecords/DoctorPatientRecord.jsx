// src/DoctorPatientRecord.jsx
import React, { useState } from "react";
import { CalendarDays, FileText, Activity, Stethoscope, AlertCircle, X } from "lucide-react";

const dummyPatient = {
    name: "John Doe",
    age: 45,
    gender: "Male",
    contact: "+1 234 567 890",
    bloodType: "O+",
    allergies: ["Penicillin", "Peanuts"],
    primaryDoctor: "Dr. Smith",
};

const dummyAppointments = [
    { date: "2025-10-15", time: "09:00 AM", department: "Cardiology", doctor: "Dr. Smith", status: "Completed", reason: "Routine Checkup" },
    { date: "2025-10-16", time: "11:00 AM", department: "Neurology", doctor: "Dr. Adams", status: "Pending", reason: "Headache" },
];

const dummyMedications = [
    { name: "Aspirin", dosage: "100mg", frequency: "Once Daily", notes: "Take after meal" },
    { name: "Metformin", dosage: "500mg", frequency: "Twice Daily", notes: "Before breakfast and dinner" },
];

const dummyLabResults = [
    { test: "Blood Sugar", date: "2025-10-10", result: "105 mg/dL", status: "Normal" },
    { test: "Cholesterol", date: "2025-10-12", result: "220 mg/dL", status: "High" },
];

const dummyDiagnoses = [
    { condition: "Hypertension", date: "2023-05-12", notes: "Controlled with medication" },
    { condition: "Migraine", date: "2024-03-10", notes: "Occasional, take painkiller as needed" },
];

const dummyProcedures = [
    { procedure: "Appendectomy", date: "2020-08-20", doctor: "Dr. Lee", outcome: "Successful" },
];

const tabs = ["Appointments", "Medications", "Lab Results", "Diagnoses", "Procedures", "Allergies & Notes"];

const DoctorPatientRecord = () => {
    const [activeTab, setActiveTab] = useState(tabs[0]);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto bg-white shadow rounded-lg p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{dummyPatient.name}</h1>
                        <p className="text-gray-600">
                            {dummyPatient.age} / {dummyPatient.gender} | Blood Type: {dummyPatient.bloodType} | Primary Doctor: {dummyPatient.primaryDoctor}
                        </p>
                        <p className="text-gray-600 mt-1">Contact: {dummyPatient.contact}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-4">
                    <nav className="-mb-px flex space-x-4">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm ${activeTab === tab
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === "Appointments" && (
                        <div className="space-y-3">
                            {dummyAppointments.map((appt, i) => (
                                <div key={i} className="p-3 border rounded-md flex justify-between items-center hover:shadow-md transition">
                                    <div>
                                        <p className="font-semibold text-gray-800">{appt.department} with {appt.doctor}</p>
                                        <p className="text-gray-500 text-sm">{appt.date} at {appt.time}</p>
                                        <p className="text-gray-500 text-sm">Reason: {appt.reason}</p>
                                    </div>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-semibold ${appt.status === "Completed"
                                                ? "bg-green-100 text-green-700"
                                                : appt.status === "Pending"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-red-100 text-red-700"
                                            }`}
                                    >
                                        {appt.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "Medications" && (
                        <div className="space-y-3">
                            {dummyMedications.map((med, i) => (
                                <div key={i} className="p-3 border rounded-md hover:shadow-md transition">
                                    <p className="font-semibold text-gray-800">{med.name}</p>
                                    <p className="text-gray-500 text-sm">{med.dosage} | {med.frequency}</p>
                                    <p className="text-gray-500 text-sm">Notes: {med.notes}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "Lab Results" && (
                        <div className="space-y-3">
                            {dummyLabResults.map((lab, i) => (
                                <div key={i} className="p-3 border rounded-md hover:shadow-md transition flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-800">{lab.test}</p>
                                        <p className="text-gray-500 text-sm">{lab.date}</p>
                                    </div>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-semibold ${lab.status === "Normal"
                                                ? "bg-green-100 text-green-700"
                                                : lab.status === "High"
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                            }`}
                                    >
                                        {lab.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "Diagnoses" && (
                        <div className="space-y-3">
                            {dummyDiagnoses.map((diag, i) => (
                                <div key={i} className="p-3 border rounded-md hover:shadow-md transition">
                                    <p className="font-semibold text-gray-800">{diag.condition}</p>
                                    <p className="text-gray-500 text-sm">Diagnosed: {diag.date}</p>
                                    <p className="text-gray-500 text-sm">Notes: {diag.notes}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "Procedures" && (
                        <div className="space-y-3">
                            {dummyProcedures.map((proc, i) => (
                                <div key={i} className="p-3 border rounded-md hover:shadow-md transition">
                                    <p className="font-semibold text-gray-800">{proc.procedure}</p>
                                    <p className="text-gray-500 text-sm">Date: {proc.date}</p>
                                    <p className="text-gray-500 text-sm">Doctor: {proc.doctor}</p>
                                    <p className="text-gray-500 text-sm">Outcome: {proc.outcome}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "Allergies & Notes" && (
                        <div className="space-y-3">
                            <div className="p-3 border rounded-md">
                                <p className="font-semibold text-gray-800">Allergies</p>
                                <ul className="list-disc list-inside text-gray-500">
                                    {dummyPatient.allergies.map((allergy, i) => (
                                        <li key={i}>{allergy}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="p-3 border rounded-md">
                                <p className="font-semibold text-gray-800">General Notes</p>
                                <p className="text-gray-500">Patient shows good compliance with treatment. Follow-up required in 1 month.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoctorPatientRecord;
