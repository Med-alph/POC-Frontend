import React, { useState } from "react";
import { Shield, Info, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ComplianceBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  // Check if user is a Hospital Admin
  const isHospitalAdmin = user?.role === 'Admin' || user?.designation_group === 'Admin';

  const handleManageConsent = () => {
    navigate('/hospital/consent');
  };

  if (!isVisible) return null;

  return (
    <div className="relative overflow-hidden bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900/30 rounded-xl shadow-sm mb-6 transition-all duration-300 hover:shadow-md">
      {/* Accent strip */}
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>

      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Healthcare Data Protection Notice
              </h3>
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                Compliance
              </span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
              This environment handles sensitive Protected Health Information (PHI). All activities are monitored
              and data is processed according to HIPAA and global healthcare privacy standards.
            </p>

            <div className="flex items-center gap-4 pt-1">
              <Link
                to="/privacy-policy"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 transition-colors"
              >
                Privacy Policy <ExternalLink className="h-3 w-3 opacity-70" />
              </Link>
              <Link
                to="/terms-of-service"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 transition-colors"
              >
                Terms of Service <ExternalLink className="h-3 w-3 opacity-70" />
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pl-12 md:pl-0">
          {isHospitalAdmin && (
            <Button
              variant="default"
              size="sm"
              onClick={handleManageConsent}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold"
            >
              Manage Consent
            </Button>
          )}
        </div>
      </div>

      {/* Close button - absolute position */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}