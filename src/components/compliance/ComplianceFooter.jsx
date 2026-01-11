import React from "react";
import { Shield, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export default function ComplianceFooter({ showWarning = false }) {
  return (
    <div className="mt-8 pt-4 border-t border-gray-200">
      {showWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-900 mb-1">
                Confidential Medical Information
              </h4>
              <p className="text-xs text-yellow-800">
                This page contains protected health information. Unauthorized access or disclosure is prohibited by law.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <Shield className="h-3 w-3" />
          <span>Protected Health Information (PHI) - Confidential</span>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            to="/privacy-policy" 
            className="hover:text-gray-700 underline"
          >
            Privacy Policy
          </Link>
          <Link 
            to="/terms-of-service" 
            className="hover:text-gray-700 underline"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}