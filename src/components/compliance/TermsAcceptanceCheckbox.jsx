import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

export default function TermsAcceptanceCheckbox({ 
  checked, 
  onCheckedChange, 
  required = true,
  className = "" 
}) {
  return (
    <div className={`flex items-start space-x-3 ${className}`}>
      <Checkbox
        id="terms-acceptance"
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-1"
        required={required}
      />
      <div className="flex-1">
        <Label 
          htmlFor="terms-acceptance" 
          className="text-sm cursor-pointer leading-relaxed"
        >
          I agree to the{" "}
          <Link 
            to="/terms-of-service" 
            target="_blank"
            className="text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Terms of Service
          </Link>
          {" "}and{" "}
          <Link 
            to="/privacy-policy" 
            target="_blank"
            className="text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Privacy Policy
          </Link>
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {required && (
          <p className="text-xs text-gray-500 mt-1">
            Required to proceed with registration
          </p>
        )}
      </div>
    </div>
  );
}