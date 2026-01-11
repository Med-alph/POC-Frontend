import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileText, AlertTriangle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import toast from 'react-hot-toast';
import { complianceAPI } from "@/api/complianceapi";

export default function TermsAcceptanceModal({ 
  open, 
  onAccepted, 
  user,
  currentTermsVersion = "1.0",
  cannotClose = true // Prevent closing without acceptance
}) {
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAcceptTerms = async () => {
    if (!hasReadTerms) {
      toast.error("Please confirm that you have read and agree to the Terms of Service");
      return;
    }

    setIsAccepting(true);
    try {
      const termsData = {
        user_id: user.id,
        hospital_id: user.hospital_id,
        terms_version: currentTermsVersion,
        ip_address: "auto-detected", // Backend should capture real IP
        user_agent: navigator.userAgent
      };

      console.log('Accepting terms with data:', termsData);
      await complianceAPI.acceptTerms(termsData);

      toast.success("Terms of Service accepted successfully");
      onAccepted();
    } catch (error) {
      console.error('Failed to accept terms:', error);
      
      // More detailed error handling
      if (error.response?.status === 401) {
        toast.error("Authentication required. Please log in again.");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to accept terms.");
      } else if (error.response?.data?.message) {
        toast.error(`Error: ${error.response.data.message}`);
      } else {
        toast.error("Failed to record terms acceptance. Please try again.");
      }
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={cannotClose ? undefined : () => {}} // Prevent closing if cannotClose is true
    >
      <DialogContent 
        className="max-w-[600px] max-h-[80vh] flex flex-col"
        hideCloseButton={cannotClose}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-6 w-6 text-blue-600" />
            Updated Terms of Service
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Important Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-amber-900 mb-1">
                  Terms Acceptance Required
                </h4>
                <p className="text-xs text-amber-800">
                  To continue using this healthcare system, you must read and accept our updated Terms of Service. 
                  This is required for compliance and legal protection.
                </p>
              </div>
            </div>
          </div>

          {/* Terms Content Preview */}
          <div className="flex-1 border border-gray-200 rounded-md p-4 overflow-y-auto bg-gray-50">
            <div className="text-sm text-gray-700 space-y-3">
              <h3 className="font-semibold text-gray-900">Terms of Service Summary</h3>
              
              <div className="space-y-2">
                <p><strong>1. Medical Disclaimer:</strong> This system is a healthcare management tool. All medical decisions remain the responsibility of licensed healthcare providers.</p>
                
                <p><strong>2. Data Protection:</strong> We protect your information according to healthcare privacy regulations including DPDP Act 2023.</p>
                
                <p><strong>3. User Responsibilities:</strong> Users must maintain confidentiality, use the system appropriately, and comply with healthcare regulations.</p>
                
                <p><strong>4. Liability Limitations:</strong> The software provider is not liable for medical decisions made using this system.</p>
                
                <p><strong>5. Compliance:</strong> This system complies with Indian healthcare regulations and international standards.</p>
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs text-blue-800">
                  <strong>Full Terms:</strong> For complete terms and conditions, please review the full document.
                </p>
              </div>
            </div>
          </div>

          {/* View Full Terms Link */}
          <div className="mt-4 text-center">
            <Link 
              to="/terms-of-service" 
              target="_blank"
              className="text-blue-600 hover:text-blue-800 underline text-sm flex items-center justify-center gap-1"
            >
              View Complete Terms of Service <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {/* Acceptance Checkbox */}
          <div className="mt-4 p-4 bg-white border border-gray-200 rounded-md">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms-acceptance"
                checked={hasReadTerms}
                onCheckedChange={setHasReadTerms}
                className="mt-1"
              />
              <div className="flex-1">
                <Label 
                  htmlFor="terms-acceptance" 
                  className="text-sm cursor-pointer leading-relaxed font-medium"
                >
                  I have read, understood, and agree to be bound by the Terms of Service (Version {currentTermsVersion})
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  By checking this box, you provide explicit consent to the terms and conditions outlined above.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          {!cannotClose && (
            <Button 
              variant="outline" 
              onClick={() => onAccepted(false)}
              disabled={isAccepting}
            >
              Cancel
            </Button>
          )}
          <Button 
            onClick={handleAcceptTerms}
            disabled={!hasReadTerms || isAccepting}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
          >
            {isAccepting ? "Processing..." : "Accept & Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}