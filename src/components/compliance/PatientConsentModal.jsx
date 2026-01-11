import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertCircle, Shield, MessageSquare, Loader } from "lucide-react";
import { complianceAPI } from "@/api/complianceapi";
import toast from 'react-hot-toast';

export default function PatientConsentModal({
  open,
  onClose,
  onConsentGiven,
  patientName = "the patient",
  hospitalName = "this hospital",
  hospitalId = null
}) {
  const [consents, setConsents] = useState({
    medical_data: false,
    communication: false,
    npp_acknowledged: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentConfig, setConsentConfig] = useState(null);
  const [loadingConsent, setLoadingConsent] = useState(false);
  const [consentError, setConsentError] = useState(null);
  const [showNPPText, setShowNPPText] = useState(false);

  // Load hospital-specific consent configuration when modal opens
  useEffect(() => {
    if (open && hospitalId) {
      loadHospitalConsentConfig();
    }
  }, [open, hospitalId]);

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
    return `By providing your consent, you agree to allow this healthcare facility to collect, store, and process your personal health information for the purpose of providing medical care and treatment.

Your information will be kept confidential and will only be shared as necessary for your medical care or as required by law.

You have the right to access your medical records, request corrections to your information, and withdraw your consent at any time.`;
  };

  const getDefaultNPPText = () => {
    return `NOTICE OF PRIVACY PRACTICES: This hospital is required by law to maintain the privacy of your protected health information and to provide you with a notice of our legal duties and privacy practices.`;
  };

  const handleConsentChange = (consentType, checked) => {
    setConsents(prev => ({
      ...prev,
      [consentType]: checked
    }));
  };

  const handleSubmit = async () => {
    // Medical data and NPP are mandatory
    if (!consents.medical_data || !consents.npp_acknowledged) {
      toast.error("Medical data consent and NPP acknowledgement are required");
      return;
    }

    setIsSubmitting(true);
    try {
      // Include consent version information
      const consentData = {
        ...consents,
        consent_version: consentConfig?.version || "1.0",
        hospital_id: hospitalId
      };

      // Pass consent data back to parent
      await onConsentGiven(consentData);
      onClose();
    } catch (error) {
      console.error('Error processing consent:', error);
      toast.error("Failed to process consent. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setConsents({
      medical_data: false,
      communication: false,
      npp_acknowledged: false
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[600px] max-h-[85vh] flex flex-col modal-content p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-6 w-6 text-blue-600" />
            Patient Data Consent
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2 px-6 flex-1 overflow-y-auto">
          {/* Loading State */}
          {loadingConsent && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <Loader className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-gray-600">Loading consent information...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {consentError && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">Error Loading Consent</p>
                  <p>{consentError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Consent Content */}
          {!loadingConsent && !consentError && (
            <>
              {/* Introduction */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Data Protection Notice</p>
                    <p>
                      To provide medical care for <strong>{patientName}</strong> at{" "}
                      <strong>{hospitalName}</strong>, we need your explicit consent to collect and process medical data.
                    </p>
                    {consentConfig && (
                      <p className="text-xs text-blue-600 mt-2">
                        Consent Version: {consentConfig.version} |
                        {consentConfig.has_custom_config ? ' Custom Policy' : ' Standard Policy'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Hospital-Specific Consent Text */}
              {consentConfig?.consent_text && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Detailed Consent Information</h4>
                  <div className="text-sm text-gray-700 space-y-2 max-h-48 overflow-y-auto bg-white p-3 rounded border border-gray-100 shadow-inner whitespace-pre-wrap">
                    {consentConfig.consent_text}
                  </div>
                </div>
              )}

              {/* Consent Options */}
              <div className="space-y-6">
                {/* Required Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <Label className="text-sm font-bold text-gray-900 uppercase tracking-wide">Required for Healthcare Services</Label>
                  </div>

                  <div className="grid gap-3">
                    {/* NPP Acknowledgement */}
                    <div className={`border rounded-xl p-4 transition-all ${consents.npp_acknowledged ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="npp_acknowledged"
                          checked={consents.npp_acknowledged}
                          onCheckedChange={(checked) => handleConsentChange('npp_acknowledged', checked)}
                          className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <div className="flex-1">
                          <Label htmlFor="npp_acknowledged" className="text-sm font-semibold text-gray-900 cursor-pointer">
                            Notice of Privacy Practices (NPP)
                          </Label>
                          <p className="text-xs text-gray-500 mt-1">I acknowledge I have received or been offered the hospital's privacy practices.</p>
                          <div className="mt-2 text-xs">
                            <button type="button" onClick={() => setShowNPPText(!showNPPText)} className="text-blue-600 hover:text-blue-800 font-medium underline">
                              {showNPPText ? 'Hide full notice' : 'View full notice'}
                            </button>
                          </div>
                          {showNPPText && (
                            <div className="mt-3 p-4 bg-white border border-blue-100 rounded-lg text-[11px] text-gray-600 max-h-40 overflow-y-auto whitespace-pre-wrap shadow-inner font-mono leading-relaxed">
                              {consentConfig?.npp_text || getDefaultNPPText()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Medical Data Consent */}
                    <div className={`border rounded-xl p-4 transition-all ${consents.medical_data ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="medical_data"
                          checked={consents.medical_data}
                          onCheckedChange={(checked) => handleConsentChange('medical_data', checked)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label htmlFor="medical_data" className="text-sm font-semibold text-gray-900 cursor-pointer">
                            Medical Data Storage & Processing
                          </Label>
                          <p className="text-xs text-gray-500 mt-1">I consent to the secure collection and processing of my health records for my treatment.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <Label className="text-sm font-bold text-gray-500 uppercase tracking-wide">Communication Preferences</Label>
                  </div>

                  <div className={`border rounded-xl p-4 transition-all ${consents.communication ? 'bg-green-50/50 border-green-200' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="communication"
                        checked={consents.communication}
                        onCheckedChange={(checked) => handleConsentChange('communication', checked)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor="communication" className="text-sm font-semibold text-gray-900 cursor-pointer">
                          Appointment Reminders & Notifications
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">I consent to receiving updates via SMS, WhatsApp, or email (Optional).</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal Notice */}
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border">
                <p className="font-medium mb-1">Your Rights:</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>You can withdraw consent at any time</li>
                  <li>Your data will be processed according to our Privacy Policy</li>
                  <li>Data is stored securely and used only for healthcare purposes</li>
                  <li>You have the right to access and correct your information</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 p-6 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!consents.medical_data || !consents.npp_acknowledged || isSubmitting || loadingConsent || consentError}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? "Processing..." : "I Consent & Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}