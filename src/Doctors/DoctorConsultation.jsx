// src/DoctorConsultation.jsx
import React, { useState } from "react";
import { User, ClipboardList, Activity, FileText, Stethoscope, Pill, FlaskConical } from "lucide-react";
import AppointmentTimer from "../Dashboard/AppointmentTimer";
const DoctorConsultation = () => {
    const [soapNotes, setSoapNotes] = useState({
        subjective: "",
        objective: "",
        assessment: "",
        plan: "",
    });

    const [prescriptions, setPrescriptions] = useState([
        { name: "", dosage: "", frequency: "", duration: "" },
    ]);

    const [labOrders, setLabOrders] = useState([{ test: "", notes: "" }]);

    const handleSoapChange = (field, value) =>
        setSoapNotes((prev) => ({ ...prev, [field]: value }));

    const addPrescription = () =>
        setPrescriptions([...prescriptions, { name: "", dosage: "", frequency: "", duration: "" }]);

    const addLabOrder = () =>
        setLabOrders([...labOrders, { test: "", notes: "" }]);

    const patient = {
        id: "PAT-1023",
        name: "John Doe",
        age: 45,
        gender: "Male",
        reason: "Chest pain and shortness of breath",
        appointmentType: "In-person",
        priority: "Emergency",
        status: "Arrived",
        allergies: ["Penicillin"],
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 space-y-6">
            {/* Patient Header */}
            <AppointmentTimer />
            <div className="bg-white shadow rounded-lg p-6 border-l-4 border-blue-500">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                            <User className="h-6 w-6 text-blue-500" /> {patient.name}
                        </h1>
                        <p className="text-gray-600">
                            {patient.age} / {patient.gender} | ID: {patient.id}
                        </p>
                        <p className="text-gray-500 mt-1">Reason: {patient.reason}</p>
                    </div>

                    <div className="text-right">
                        <span
                            className={`text-sm font-semibold px-3 py-1 rounded-full ${patient.status === "Arrived"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                                }`}
                        >
                            {patient.status}
                        </span>
                        <div className="mt-2 text-sm">
                            <p>Type: {patient.appointmentType}</p>
                            <p>Priority: <span className="text-red-600 font-semibold">{patient.priority}</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Medical History + Alerts */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white shadow rounded-lg p-5">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 mb-2">
                        <ClipboardList className="h-5 w-5 text-blue-500" /> Medical History
                    </h2>
                    <ul className="text-gray-600 list-disc list-inside">
                        <li>Hypertension (diagnosed 2022)</li>
                        <li>Type 2 Diabetes (diagnosed 2020)</li>
                    </ul>
                </div>

                <div className="bg-white shadow rounded-lg p-5">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-red-600 mb-2">
                        <Activity className="h-5 w-5" /> Allergies & Alerts
                    </h2>
                    <ul className="text-gray-600 list-disc list-inside">
                        {patient.allergies.map((a, i) => (
                            <li key={i}>{a}</li>
                        ))}
                        <li>Critical: Avoid Penicillin-based drugs</li>
                    </ul>
                </div>
            </div>

            {/* SOAP Notes Section */}
            <div className="bg-white shadow rounded-lg p-5">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 mb-3">
                    <Stethoscope className="h-5 w-5 text-blue-500" /> Consultation Notes (SOAP)
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                    {["subjective", "objective", "assessment", "plan"].map((field) => (
                        <div key={field}>
                            <label className="block text-sm font-semibold text-gray-700 mb-1 capitalize">
                                {field}
                            </label>
                            <textarea
                                className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400"
                                rows={3}
                                value={soapNotes[field]}
                                onChange={(e) => handleSoapChange(field, e.target.value)}
                                placeholder={`Enter ${field} details...`}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Prescription Section */}
            <div className="bg-white shadow rounded-lg p-5">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 mb-3">
                    <Pill className="h-5 w-5 text-blue-500" /> Prescriptions
                </h2>

                {prescriptions.map((pres, index) => (
                    <div key={index} className="grid md:grid-cols-4 gap-3 mb-3">
                        <input
                            type="text"
                            placeholder="Medicine Name"
                            className="border p-2 rounded-md text-sm"
                            value={pres.name}
                            onChange={(e) => {
                                const updated = [...prescriptions];
                                updated[index].name = e.target.value;
                                setPrescriptions(updated);
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Dosage"
                            className="border p-2 rounded-md text-sm"
                            value={pres.dosage}
                            onChange={(e) => {
                                const updated = [...prescriptions];
                                updated[index].dosage = e.target.value;
                                setPrescriptions(updated);
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Frequency"
                            className="border p-2 rounded-md text-sm"
                            value={pres.frequency}
                            onChange={(e) => {
                                const updated = [...prescriptions];
                                updated[index].frequency = e.target.value;
                                setPrescriptions(updated);
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Duration"
                            className="border p-2 rounded-md text-sm"
                            value={pres.duration}
                            onChange={(e) => {
                                const updated = [...prescriptions];
                                updated[index].duration = e.target.value;
                                setPrescriptions(updated);
                            }}
                        />
                    </div>
                ))}

                <button
                    onClick={addPrescription}
                    className="mt-2 text-blue-500 text-sm font-semibold hover:underline"
                >
                    + Add Prescription
                </button>
            </div>

            {/* Lab Orders Section */}
            <div className="bg-white shadow rounded-lg p-5">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 mb-3">
                    <FlaskConical className="h-5 w-5 text-blue-500" /> Lab / Scan Orders
                </h2>

                {labOrders.map((order, index) => (
                    <div key={index} className="grid md:grid-cols-2 gap-3 mb-3">
                        <input
                            type="text"
                            placeholder="Test / Scan Name"
                            className="border p-2 rounded-md text-sm"
                            value={order.test}
                            onChange={(e) => {
                                const updated = [...labOrders];
                                updated[index].test = e.target.value;
                                setLabOrders(updated);
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Notes"
                            className="border p-2 rounded-md text-sm"
                            value={order.notes}
                            onChange={(e) => {
                                const updated = [...labOrders];
                                updated[index].notes = e.target.value;
                                setLabOrders(updated);
                            }}
                        />
                    </div>
                ))}

                <button
                    onClick={addLabOrder}
                    className="mt-2 text-blue-500 text-sm font-semibold hover:underline"
                >
                    + Add Lab Order
                </button>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
                    Save Consultation
                </button>
            </div>
        </div>
    );
};

export default DoctorConsultation;
