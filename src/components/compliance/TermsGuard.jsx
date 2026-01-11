import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import TermsAcceptanceModal from "./TermsAcceptanceModal";
import { complianceAPI } from "@/api/complianceapi";

export default function TermsGuard({ children }) {
  const user = useSelector((state) => state.auth.user);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsCheckComplete, setTermsCheckComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  const CURRENT_TERMS_VERSION = "1.0";

  useEffect(() => {
    if (user?.id) {
      checkTermsAcceptance();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkTermsAcceptance = async () => {
    try {
      setLoading(true);
      console.log('Checking terms acceptance for user:', user.id);
      
      // Include hospital context if available
      const hospitalId = user.hospital_id;
      const termsStatus = await complianceAPI.getTermsStatus(user.id, hospitalId);
      console.log('Terms status response:', termsStatus);
      
      // Check if user has accepted current version
      // Backend returns: { accepted: true, terms_version: "1.0", ... }
      const hasAcceptedCurrentVersion = 
        termsStatus?.accepted && 
        termsStatus?.terms_version === CURRENT_TERMS_VERSION;

      console.log('Has accepted current version:', hasAcceptedCurrentVersion);
      console.log('Backend accepted:', termsStatus?.accepted);
      console.log('Backend version:', termsStatus?.terms_version);
      console.log('Current version:', CURRENT_TERMS_VERSION);

      if (!hasAcceptedCurrentVersion) {
        setShowTermsModal(true);
      } else {
        setTermsCheckComplete(true);
      }
    } catch (error) {
      console.error('Failed to check terms status:', error);
      // If we can't check terms status, show the modal to be safe
      setShowTermsModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleTermsAccepted = () => {
    setShowTermsModal(false);
    setTermsCheckComplete(true);
  };

  // Show loading while checking terms status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Checking compliance status...</p>
        </div>
      </div>
    );
  }

  // Show terms modal if needed
  if (showTermsModal && user) {
    return (
      <>
        <TermsAcceptanceModal
          open={showTermsModal}
          onAccepted={handleTermsAccepted}
          user={user}
          currentTermsVersion={CURRENT_TERMS_VERSION}
          cannotClose={true}
        />
        {/* Render children in background but they won't be accessible */}
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
      </>
    );
  }

  // Only render children if terms are accepted or no user
  if (termsCheckComplete || !user) {
    return children;
  }

  // Fallback loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto mb-3"></div>
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );
}