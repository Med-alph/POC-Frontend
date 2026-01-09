import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, Loader, Save, Eye } from "lucide-react";
import { complianceAPI } from "@/api/complianceapi";
import toast from 'react-hot-toast';
import ConsentTextEditor from "./ConsentTextEditor";
import ConsentPreview from "./ConsentPreview";

export default function HospitalConsentManagement() {
  const user = useSelector((state) => state.auth.user);
  const hospitalId = user?.hospital_id;

  const [consentConfig, setConsentConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeEditor, setActiveEditor] = useState("general"); // 'general' or 'npp'
  const [showPreview, setShowPreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Check if user has hospital admin permissions
  // Based on your JWT payload, role is 'Admin' and designation_group is 'Admin'
  const hasPermission = user?.role === 'Admin' || user?.designation_group === 'Admin';

  useEffect(() => {
    if (hospitalId && hasPermission) {
      loadConsentConfig();
    } else if (!hasPermission) {
      setError("You don't have permission to manage consent configurations.");
      setLoading(false);
    } else {
      setError("Hospital ID not found in user data.");
      setLoading(false);
    }
  }, [hospitalId, hasPermission]);

  const loadConsentConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const config = await complianceAPI.getHospitalConsentConfig(hospitalId);
      setConsentConfig(config);
    } catch (error) {
      console.error('Failed to load consent configuration:', error);

      // If it's a 404, it means no custom config exists yet
      if (error.response?.status === 404) {
        setConsentConfig({
          hospital_id: hospitalId,
          consent_text: getDefaultConsentText(),
          npp_text: getDefaultNPPText(),
          version: "1.0",
          has_custom_config: false
        });
      } else {
        setError("Failed to load consent configuration. Please try again.");
      }
    } finally {
      setLoading(false);
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

Your information will be kept confidential and will only be shared as necessary for your medical care or as required by law.

This consent remains in effect until you withdraw it in writing.`;
  };

  const getDefaultNPPText = () => {
    return `NOTICE OF PRIVACY PRACTICES

THIS NOTICE DESCRIBES HOW MEDICAL INFORMATION ABOUT YOU MAY BE USED AND DISCLOSED AND HOW YOU CAN GET ACCESS TO THIS INFORMATION. PLEASE REVIEW IT CAREFULLY.

We are required by law to maintain the privacy of your protected health information ("PHI") and to provide you with this Notice of Privacy Practices.

1. USES AND DISCLOSURES OF PHI:
We used your PHI for:
• Treatment (e.g., sending medical records to specialists)
• Payment (e.g., billing insurance)
• Healthcare Operations (e.g., quality assessments)

2. YOUR RIGHTS:
You have the right to:
• Request restrictions on certain uses
• Inspect and copy your records
• Amend your medical information
• Receive an accounting of disclosures

3. OUR DUTIES:
We are required to:
• Maintain the privacy of your PHI
• Provide this Notice
• Abide by the terms of this Notice

If you have questions, please contact our Privacy Officer.`;
  };

  const handleConsentTextChange = (newText) => {
    setConsentConfig(prev => ({
      ...prev,
      consent_text: newText
    }));
    setHasUnsavedChanges(true);
  };

  const handleNPPTextChange = (newText) => {
    setConsentConfig(prev => ({
      ...prev,
      npp_text: newText
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async (consentText) => {
    if (!consentText || consentText.trim().length < 50) {
      toast.error("Consent text must be at least 50 characters long.");
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        consent_text: consentConfig.consent_text,
        npp_text: consentConfig.npp_text || getDefaultNPPText()
      };

      const updatedConfig = await complianceAPI.updateHospitalConsentConfig(hospitalId, updateData);

      setConsentConfig(updatedConfig);
      setHasUnsavedChanges(false);
      toast.success("Consent configuration saved successfully!");

    } catch (error) {
      console.error('Failed to save consent configuration:', error);
      toast.error("Failed to save consent configuration. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <Loader className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading consent configuration...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!hasPermission) {
    return (
      <Alert className="m-6">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to access consent management. Please contact your administrator.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Patient Consent Management</h2>
          <p className="text-gray-600 mt-1">
            Customize the consent text that patients see during registration
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
      </div>

      {/* Configuration Status */}
      {consentConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Configuration Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Configuration Type</div>
                <div className="font-semibold text-blue-900">
                  {consentConfig.has_custom_config ? 'Custom' : 'Default'}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Current Version</div>
                <div className="font-semibold text-green-900">
                  v{consentConfig.version}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Last Updated</div>
                <div className="font-semibold text-gray-900">
                  {(consentConfig.last_updated || consentConfig.updated_at || consentConfig.updatedAt)
                    ? new Date(consentConfig.last_updated || consentConfig.updated_at || consentConfig.updatedAt).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                    : 'Never'
                  }
                </div>
              </div>
            </div>

            {hasUnsavedChanges && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You have unsaved changes. Don't forget to save your modifications.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab Switcher */}
      <div className="flex space-x-4 border-b">
        <button
          className={`py-2 px-4 font-medium text-sm transition-colors relative ${activeEditor === "general"
            ? "text-blue-600 border-b-2 border-blue-600"
            : "text-gray-500 hover:text-gray-700"
            }`}
          onClick={() => setActiveEditor("general")}
        >
          General Consent to Treat
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm transition-colors relative ${activeEditor === "npp"
            ? "text-blue-600 border-b-2 border-blue-600"
            : "text-gray-500 hover:text-gray-700"
            }`}
          onClick={() => setActiveEditor("npp")}
        >
          Notice of Privacy Practices (NPP)
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <Card>
          <CardHeader>
            <CardTitle>{activeEditor === 'general' ? 'Consent Text Editor' : 'NPP Text Editor'}</CardTitle>
          </CardHeader>
          <CardContent>
            {activeEditor === 'general' ? (
              <ConsentTextEditor
                key="general-editor"
                initialText={consentConfig?.consent_text || ''}
                onTextChange={handleConsentTextChange}
                onSave={() => handleSave(consentConfig.consent_text)}
                saving={saving}
              />
            ) : (
              <ConsentTextEditor
                key="npp-editor"
                initialText={consentConfig?.npp_text || getDefaultNPPText()}
                onTextChange={handleNPPTextChange}
                onSave={() => handleSave(consentConfig.npp_text)}
                saving={saving}
              />
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        {showPreview && (
          <Card>
            <CardHeader>
              <CardTitle>Patient View Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <ConsentPreview
                consentText={activeEditor === 'general' ? consentConfig?.consent_text : consentConfig?.npp_text}
                version={consentConfig?.version || '1.0'}
                title={activeEditor === 'general' ? "Patient Consent Form" : "Notice of Privacy Practices"}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}