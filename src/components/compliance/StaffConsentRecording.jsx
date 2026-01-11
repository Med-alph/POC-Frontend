import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Shield, MessageSquare, Loader, FileText } from "lucide-react";
import { complianceAPI } from "@/api/complianceapi";
import toast from 'react-hot-toast';

export default function StaffConsentRecording({
  open,
  onClose,
  onConsentRecorded,
  patientName = "the patient",
  hospitalName = "this hospital",
  hospitalId = null
}) {
  const [consents, setConsents] = useState({
    medical_data: false,
    communication: false,
    npp_acknowledged: false
  });

  const [consentMethod, setConsentMethod] = useState("verbal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentConfig, setConsentConfig] = useState(null);
  const [loadingConsent, setLoadingConsent] = useState(false);
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
      }
    } finally {
      setLoadingConsent(false);
    }
  };

  const getDefaultConsentText = () => {
    return `Standard consent for medical data collection, storage, and processing for healthcare purposes.`;
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
      const consentData = {
        hospital_id: hospitalId,
        consent_types: Object.keys(consents).filter(key => consents[key]),
        consent_method: consentMethod,
        consent_version: consentConfig?.version || "1.0"
      };

      // Pass consent data back to parent
      await onConsentRecorded(consentData);
      onClose();
    } catch (error) {
      console.error('Error recording consent:', error);
      toast.error("Failed to record consent. Please try again.");
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
    setConsentMethod("verbal");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[600px] max-h-[85vh] flex flex-col modal-content p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-6 w-6 text-blue-600" />
            Record Patient Consent
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

          {!loadingConsent && (
            <>
              {/* Staff Notice */}
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Staff Consent Recording</p>
                    <p className="mb-2">
                      You are recording consent for <strong>{patientName}</strong> at{" "}
                      <strong>{hospitalName}</strong>.
                    </p>
                    <p className="text-xs">
                      <strong>Important:</strong> Ensure the patient has been properly informed about
                      data processing and has provided explicit consent before proceeding.
                    </p>
                  </div>
                </div>
              </div>

              {/* Hospital-Specific Consent Text */}
              {consentConfig?.consent_text && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Consent agreement terms
                  </h4>
                  <p className="text-xs text-gray-500 mb-3 italic border-l-2 border-gray-300 pl-2">
                    "I verify that the patient has read (or had read to them) and agreed to the following statement:"
                  </p>
                  <div className="text-sm text-gray-700 space-y-2 max-h-32 overflow-y-auto bg-white p-3 rounded border border-gray-100 shadow-inner">
                    {consentConfig.consent_text.split('\n').map((line, index) => (
                      <p key={index} className={line.trim() === '' ? 'mb-2' : ''}>
                        {line.trim()}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Consent Method */}
              <div className="space-y-3">
                <Label className="text-base font-medium">How was consent obtained?</Label>
                <RadioGroup value={consentMethod} onValueChange={setConsentMethod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="verbal" id="verbal" />
                    <Label htmlFor="verbal">Verbal consent (patient confirmed verbally)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paper" id="paper" />
                    <Label htmlFor="paper">Paper form (patient signed physical form)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="in_person" id="in_person" />
                    <Label htmlFor="in_person">In-person confirmation (patient present)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Consent Types */}
              <div className="space-y-6">
                {/* Required Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <Label className="text-sm font-bold text-gray-900 uppercase tracking-wide">Required for Compliance</Label>
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
                          <p className="text-xs text-gray-500 mt-1">Patient acknowledges receipt of privacy protocols.</p>
                          <div className="mt-2 text-xs">
                            <button type="button" onClick={() => setShowNPPText(!showNPPText)} className="text-blue-600 hover:text-blue-800 font-medium underline">
                              {showNPPText ? 'Hide full notice' : 'View full notice'}
                            </button>
                          </div>
                          {showNPPText && (
                            <div className="mt-3 p-3 bg-white border border-blue-100 rounded text-[11px] text-gray-600 max-h-32 overflow-y-auto whitespace-pre-wrap shadow-inner font-mono">
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
                          <p className="text-xs text-gray-500 mt-1">Consent for records collection and treatment data.</p>
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
                        <p className="text-xs text-gray-500 mt-1">Receive updates via SMS, WhatsApp, or email (Optional).</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal Notice */}
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border">
                <p className="font-medium mb-1">Staff Responsibilities:</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>Ensure patient was properly informed about data processing</li>
                  <li>Confirm patient provided explicit consent</li>
                  <li>Record consent method accurately</li>
                  <li>Inform patient of their rights to access and withdraw consent</li>
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
            disabled={!consents.medical_data || !consents.npp_acknowledged || isSubmitting || loadingConsent}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? "Recording..." : "Record Consent & Create Patient"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}