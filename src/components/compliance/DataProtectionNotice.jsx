import React from "react";
import { Shield, Lock, Eye } from "lucide-react";

export default function DataProtectionNotice({ context = "general" }) {
  const getContextualMessage = () => {
    switch (context) {
      case "patient":
        return {
          title: "Patient Data Protection",
          message: "Patient medical records are encrypted and access-controlled. Only authorized healthcare providers can view this information.",
          icon: Shield
        };
      case "medical":
        return {
          title: "Medical Information Security",
          message: "This medical data is protected under healthcare privacy laws. Access is logged and monitored.",
          icon: Lock
        };
      case "consent":
        return {
          title: "Data Usage Consent",
          message: "Patient consent is required for data collection and processing. Consent can be withdrawn at any time.",
          icon: Eye
        };
      default:
        return {
          title: "Data Protection",
          message: "This information is protected and handled according to healthcare privacy regulations.",
          icon: Shield
        };
    }
  };

  const { title, message, icon: Icon } = getContextualMessage();

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
      <div className="flex items-start gap-2">
        <Icon className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-1">{title}</h4>
          <p className="text-xs text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
}