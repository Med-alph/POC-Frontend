import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, MessageSquare, Loader, FileText, CheckCircle } from "lucide-react";
import { complianceAPI } from "@/api/complianceapi";
import toast from 'react-hot-toast';

export default function PatientSelfConsent({ 
  patientId,
  hospitalId,
  hospitalName = "Healthcare Facility",
  onConsentCompleted
}) {
  const [consents, setConsents] = useState({
    medical_data: false,
    communication: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentConfig, setConsentConfig] = useState(null);
  const [loadingConsent, setLoadingConsent] = useState(true);
  const [consentError, setConsentError] = useState(null);

  // Load hospital-specific consent configuration
  useEffect(() => {
    if (hospitalId) {
      loadHospitalConsentConfig();
    }
  }, [hospitalId]);

  const loadHospitalConsentConfig = async () => {
    try {
      setLoadingConsent(true);
      setConsentError(null);
      const config = await complianceAPI.getHospitalConsentConfig(hospitalId);
      setConsentConfig(config);
    } catch (error) {
      console.error('Failed to load hospital consent config:', error);
      
      // If no custom config exists (404), use default
      if (error.response?.status === 404) {
        setConsentConfig({
          hospital_id: hospitalId,
          consent_text: getDefaultConsentText(),
          version: "1.0",
          has_custom_config: false
        });
      } else {
        setConsentError("Failed to load consent information");
      }
    } finally {
      setLoadingConsent(false);
    }
  };

  const getDefaultConsentText = () => {
    return `By providing your consent, you agree to allow this healthcare facility to:

1. Collect, store, and process your personal health information for the purpose of providing medical care and treatment.

2. Share your medical information with healthcare professionals involved in your care, including doctors, nurses, specialists, and other medical staff.

3. Use your health information for treatment coordination, medical consultations, and continuity of care.

4. Store your medical records securely in our electronic health record system.

5. Contact you regarding your appointments, treatment plans, test results, and other healthcare-related communications.

You have the right to:
- Access your medical records
- Request corrections to your information  
- Withdraw your consent at any time
- Receive a copy of this consent form

Your information will be kept confidential and will only be shared as necessary for your medical care or as required by law.`;
  };

  const handleConsentChange = (consentType, checked) => {
    setConsents(prev => ({
      ...prev,
      [consentType]: checked
    }));
  };

  const handleSubmit = async () => {
    // Medical data consent is mandatory
    if (!consents.medical_data) {
      toast.error("Medical data consent is required to complete registration");
      return;
    }

    setIsSubmitting(true);
    try {
      const consentData = {
        hospital_id: hospitalId,
        consent_types: Object.keys(consents).filter(key => consents[key]),
        consent_version: consentConfig?.version || "1.0"
      };
      
      await complianceAPI.recordSelfConsent(patientId, consentData);
      
      toast.success("Consent recorded successfully!");
      
      if (onConsentCompleted) {
        onConsentCompleted(consentData);
      }
      
    } catch (error) {
      console.error('Error recording self consent:', error);
      toast.error("Failed to record consent. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingConsent) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading consent information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (consentError) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertDescription>{consentError}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <Shield className="h-6 w-6" />
          Patient Consent Form
        </CardTitle>
        <p className="text-blue-100 mt-2">
          {hospitalName} - Please review and provide your consent
        </p>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        {/* Hospital Info */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              Consent Information (Version {consentConfig?.version})
            </span>
          </div>
          <p className="text-sm text-blue-700">
            {consentConfig?.has_custom_config ? 'Hospital-specific policy' : 'Standard policy'}
          </p>
        </div>

        {/* Consent Text */}
        {consentConfig?.consent_text && (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="prose prose-sm max-w-none text-gray-700">
              {consentConfig.consent_text.split('\n').map((line, index) => {
                const trimmedLine = line.trim();
                
                // Handle numbered lists
                if (/^\d+\./.test(trimmedLine)) {
                  return (
                    <div key={index} className="mb-3">
                      <p className="font-medium text-gray-900">{trimmedLine}</p>
                    </div>
                  );
                }
                
                // Handle bullet points
                if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
                  return (
                    <div key={index} className="mb-2 ml-4">
                      <p className="text-gray-700">{trimmedLine}</p>
                    </div>
                  );
                }
                
                // Handle section headers (lines that end with colon)
                if (trimmedLine.endsWith(':') && trimmedLine.length < 100) {
                  return (
                    <div key={index} className="mb-3 mt-4">
                      <h4 className="font-semibold text-gray-900 text-base">{trimmedLine}</h4>
                    </div>
                  );
                }
                
                // Handle empty lines
                if (trimmedLine === '') {
                  return <div key={index} className="mb-2"></div>;
                }
                
                // Regular paragraphs
                return (
                  <div key={index} className="mb-3">
                    <p className="text-gray-700 leading-relaxed">{trimmedLine}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Consent Checkboxes */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Consent</h3>
          
          {/* Medical Data Consent - REQUIRED */}
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="medical_data"
                checked={consents.medical_data}
                onCheckedChange={(checked) => handleConsentChange('medical_data', checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label 
                  htmlFor="medical_data" 
                  className="text-sm font-medium text-red-900 cursor-pointer"
                >
                  I consent to medical data processing <span className="text-red-600">*</span>
                </Label>
                <p className="text-xs text-red-700 mt-1">
                  I agree to the collection and processing of my medical information as described above.
                </p>
                <p className="text-xs text-red-600 font-medium mt-1">
                  Required to complete registration
                </p>
              </div>
            </div>
          </div>

          {/* Communication Consent - OPTIONAL */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="communication"
                checked={consents.communication}
                onCheckedChange={(checked) => handleConsentChange('communication', checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label 
                  htmlFor="communication" 
                  className="text-sm font-medium text-gray-900 cursor-pointer flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  I consent to communication
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  I agree to receive communications regarding my healthcare and appointments.
                </p>
                <p className="text-xs text-green-600 font-medium mt-1">
                  Optional - You can change this preference later
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-2">Important Information:</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>You can withdraw your consent at any time</li>
              <li>Your data will be processed according to our Privacy Policy</li>
              <li>You have the right to access and correct your information</li>
              <li>Data is stored securely and used only for healthcare purposes</li>
            </ul>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={handleSubmit}
            disabled={!consents.medical_data || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-8 py-3"
          >
            <CheckCircle className="h-5 w-5" />
            {isSubmitting ? "Recording Consent..." : "I Agree & Complete Registration"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}