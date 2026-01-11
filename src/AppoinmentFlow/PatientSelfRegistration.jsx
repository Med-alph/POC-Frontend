import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Phone, Mail, Calendar } from "lucide-react";
import { patientsAPI } from "@/api/patientsapi";
import PatientSelfConsent from "@/components/compliance/PatientSelfConsent";
import toast from 'react-hot-toast';

const HOSPITAL_ID = "26146e33-8808-4ed4-b3bf-9de057437e85"; // Default hospital ID

export default function PatientSelfRegistration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Consent
  const [patientData, setPatientData] = useState({
    patient_name: "",
    dob: "",
    contact_info: "",
    email: "",
    hospital_id: HOSPITAL_ID
  });
  const [createdPatientId, setCreatedPatientId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatientData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBasicInfoSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!patientData.patient_name.trim() || !patientData.contact_info.trim()) {
      toast.error("Please fill in required fields (Name and Phone)");
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate age from date of birth
      const age = patientData.dob
        ? Math.floor((new Date() - new Date(patientData.dob)) / (365.25 * 24 * 60 * 60 * 1000))
        : null;

      const patientPayload = {
        ...patientData,
        age,
        created_at: new Date().toISOString(),
        status: "active"
      };

      // Create patient record (without consent yet)
      const createdPatient = await patientsAPI.create(patientPayload);
      setCreatedPatientId(createdPatient.id);

      // Move to consent step
      setStep(2);
      toast.success("Basic information saved. Please provide your consent to complete registration.");

    } catch (error) {
      console.error('Error creating patient:', error);
      toast.error("Failed to save patient information. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConsentCompleted = (consentData) => {
    toast.success("Registration completed successfully!");
    // Navigate to patient dashboard or login
    navigate("/patient-details", {
      state: {
        phone: patientData.contact_info,
        patientId: createdPatientId
      }
    });
  };

  if (step === 2 && createdPatientId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8">
        <div className="container mx-auto px-4">
          <PatientSelfConsent
            patientId={createdPatientId}
            hospitalId={HOSPITAL_ID}
            hospitalName="MedAssist Healthcare"
            onConsentCompleted={handleConsentCompleted}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center py-8">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 text-white">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <User className="h-6 w-6" />
              Patient Registration
            </CardTitle>
            <p className="text-blue-100 mt-1">
              Step 1: Basic Information
            </p>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleBasicInfoSubmit} className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="patient_name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name *
                </Label>
                <Input
                  id="patient_name"
                  name="patient_name"
                  placeholder="Enter your full name"
                  value={patientData.patient_name}
                  onChange={handleInputChange}
                  required
                  className="h-12"
                />
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="dob" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date of Birth
                </Label>
                <Input
                  id="dob"
                  name="dob"
                  type="date"
                  value={patientData.dob}
                  onChange={handleInputChange}
                  className="h-12"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="contact_info" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number *
                </Label>
                <Input
                  id="contact_info"
                  name="contact_info"
                  placeholder="Enter your phone number"
                  value={patientData.contact_info}
                  onChange={handleInputChange}
                  required
                  className="h-12"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={patientData.email}
                  onChange={handleInputChange}
                  className="h-12"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Continue to Consent"}
              </Button>
            </form>

            {/* Info */}
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Next: You'll review and provide consent for data processing</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}