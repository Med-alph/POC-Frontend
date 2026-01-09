import React from "react";
import { Shield, ShieldCheck, ShieldX, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ConsentStatusIndicator({
  consentStatus,
  showDetails = false,
  className = ""
}) {
  if (!consentStatus) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <ShieldX className="h-4 w-4 text-red-500" />
        <Badge variant="destructive" className="text-xs">
          No Consent
        </Badge>
      </div>
    );
  }

  const { consents } = consentStatus;
  const hasMedicalConsent = consents?.medical_data?.status === 'granted';
  const hasCommunicationConsent = consents?.communication?.status === 'granted';
  const hasNppAcknowledgement = consents?.npp_acknowledged?.status === 'granted';

  if (!hasMedicalConsent) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <ShieldX className="h-4 w-4 text-red-500" />
        <Badge variant="destructive" className="text-xs">
          Missing Medical Consent
        </Badge>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <ShieldCheck className="h-4 w-4 text-green-500" />
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="success" className="text-xs bg-green-100 text-green-800 border-green-200">
          Medical Data ✓
        </Badge>

        {showDetails && (
          <>
            <Badge
              variant={hasNppAcknowledgement ? "success" : "secondary"}
              className={`text-xs flex items-center gap-1 ${hasNppAcknowledgement
                  ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                  : "bg-gray-100 text-gray-600 border-gray-200"
                }`}
            >
              <Shield className="h-3 w-3" />
              NPP {hasNppAcknowledgement ? "✓" : "✗"}
            </Badge>

            <Badge
              variant={hasCommunicationConsent ? "success" : "secondary"}
              className={`text-xs flex items-center gap-1 ${hasCommunicationConsent
                  ? "bg-blue-100 text-blue-800 border-blue-200"
                  : "bg-gray-100 text-gray-600 border-gray-200"
                }`}
            >
              <MessageSquare className="h-3 w-3" />
              Comm {hasCommunicationConsent ? "✓" : "✗"}
            </Badge>
          </>
        )}
      </div>
    </div>
  );
}