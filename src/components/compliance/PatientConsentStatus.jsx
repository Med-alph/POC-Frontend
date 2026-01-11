import React, { useState, useEffect } from "react";
import { Shield, ShieldCheck, ShieldX, MessageSquare, AlertTriangle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { complianceAPI } from "@/api/complianceapi";
import toast from 'react-hot-toast';

export default function PatientConsentStatus({ 
  patientId, 
  hospitalId, 
  patientName = "Patient",
  showDetails = true,
  allowWithdraw = false 
}) {
  const [consentStatus, setConsentStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId && hospitalId) {
      loadConsentStatus();
    }
  }, [patientId, hospitalId]);

  const loadConsentStatus = async () => {
    try {
      setLoading(true);
      const status = await complianceAPI.getConsentStatus(patientId, hospitalId);
      setConsentStatus(status);
    } catch (error) {
      console.error('Failed to load consent status:', error);
      setConsentStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawConsent = async (consentType) => {
    try {
      await complianceAPI.withdrawConsent(patientId, {
        hospital_id: hospitalId,
        consent_types: [consentType],
        created_by: JSON.parse(localStorage.getItem('user') || '{}').id
      });
      
      toast.success(`${consentType} consent withdrawn successfully`);
      loadConsentStatus(); // Reload status
    } catch (error) {
      console.error('Failed to withdraw consent:', error);
      toast.error('Failed to withdraw consent');
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-gray-400 animate-pulse" />
          <span className="text-sm text-gray-500">Loading consent status...</span>
        </div>
      </div>
    );
  }

  if (!consentStatus) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex items-start gap-2">
          <ShieldX className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-red-900 mb-1">
              No Consent Records Found
            </h4>
            <p className="text-xs text-red-700">
              This patient has no consent records. Patient consent is required before accessing medical data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { consents } = consentStatus;
  const hasMedicalConsent = consents?.medical_data?.status === 'granted';
  const hasCommunicationConsent = consents?.communication?.status === 'granted';

  if (!hasMedicalConsent) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-red-900 mb-1">
              Medical Data Consent Required
            </h4>
            <p className="text-xs text-red-700">
              {patientName} has not provided consent for medical data processing. 
              Access to medical records is restricted.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-md p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 flex-1">
          <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-green-900 mb-2">
              Patient Consent Status
            </h4>
            
            <div className="space-y-2">
              {/* Medical Data Consent */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="success" className="text-xs">
                    Medical Data ✓
                  </Badge>
                  <span className="text-xs text-green-700">
                    Granted on {new Date(consents.medical_data.granted_at).toLocaleDateString()}
                  </span>
                </div>
                {allowWithdraw && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleWithdrawConsent('medical_data')}
                    className="text-xs text-red-600 hover:text-red-800 h-6 px-2"
                  >
                    Withdraw
                  </Button>
                )}
              </div>

              {/* Communication Consent */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={hasCommunicationConsent ? "success" : "secondary"} 
                    className={`text-xs flex items-center gap-1 ${
                      hasCommunicationConsent 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <MessageSquare className="h-3 w-3" />
                    Communication {hasCommunicationConsent ? "✓" : "✗"}
                  </Badge>
                  {hasCommunicationConsent && (
                    <span className="text-xs text-blue-700">
                      Granted on {new Date(consents.communication.granted_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {allowWithdraw && hasCommunicationConsent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleWithdrawConsent('communication')}
                    className="text-xs text-red-600 hover:text-red-800 h-6 px-2"
                  >
                    Withdraw
                  </Button>
                )}
              </div>
            </div>

            {showDetails && (
              <div className="mt-3 pt-2 border-t border-green-200">
                <p className="text-xs text-green-700">
                  <Eye className="h-3 w-3 inline mr-1" />
                  Patient rights: Access, correct, or withdraw consent at any time
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}