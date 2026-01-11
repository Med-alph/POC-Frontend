import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, FileText, Clock, CheckCircle } from "lucide-react";

export default function ConsentPreview({ 
  consentText = '', 
  version = '1.0',
  hospitalName = 'Healthcare Facility' 
}) {
  
  // Format the consent text to preserve line breaks and structure
  const formatConsentText = (text) => {
    if (!text) return '';
    
    return text
      .split('\n')
      .map((line, index) => {
        const trimmedLine = line.trim();
        
        // Handle numbered lists
        if (/^\d+\./.test(trimmedLine)) {
          return (
            <div key={index} className="mb-3">
              <p className="font-medium text-gray-900">{trimmedLine}</p>
            </div>
          );
        }
        
        // Handle bullet points
        if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
          return (
            <div key={index} className="mb-2 ml-4">
              <p className="text-gray-700">{trimmedLine}</p>
            </div>
          );
        }
        
        // Handle section headers (lines that end with colon)
        if (trimmedLine.endsWith(':') && trimmedLine.length < 100) {
          return (
            <div key={index} className="mb-3 mt-4">
              <h4 className="font-semibold text-gray-900 text-base">{trimmedLine}</h4>
            </div>
          );
        }
        
        // Handle empty lines
        if (trimmedLine === '') {
          return <div key={index} className="mb-2"></div>;
        }
        
        // Regular paragraphs
        return (
          <div key={index} className="mb-3">
            <p className="text-gray-700 leading-relaxed">{trimmedLine}</p>
          </div>
        );
      });
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-4">
      {/* Preview Header */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-blue-900">Patient View Preview</span>
        </div>
        <p className="text-sm text-blue-700">
          This is how patients will see the consent form during registration
        </p>
      </div>

      {/* Mock Patient Interface */}
      <Card className="border-2 border-dashed border-gray-300">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            Patient Consent Form
          </CardTitle>
          <div className="flex items-center gap-4 text-blue-100 text-sm">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {currentDate}
            </span>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              Version {version}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Hospital Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">
              {hospitalName}
            </h3>
            <p className="text-sm text-gray-600">
              Please read the following consent information carefully before proceeding with your registration.
            </p>
          </div>

          {/* Consent Text */}
          <div className="prose prose-sm max-w-none">
            {consentText ? (
              <div className="space-y-2">
                {formatConsentText(consentText)}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No consent text to preview</p>
                <p className="text-sm">Add consent text in the editor to see the preview</p>
              </div>
            )}
          </div>

          {/* Mock Consent Actions */}
          {consentText && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    id="medical-consent-preview" 
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled
                  />
                  <label htmlFor="medical-consent-preview" className="text-sm text-gray-700">
                    <span className="font-medium">I consent to medical data processing</span>
                    <span className="block text-gray-500 mt-1">
                      I agree to the collection and processing of my medical information as described above.
                    </span>
                  </label>
                </div>
                
                <div className="flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    id="communication-consent-preview" 
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled
                  />
                  <label htmlFor="communication-consent-preview" className="text-sm text-gray-700">
                    <span className="font-medium">I consent to communication</span>
                    <span className="block text-gray-500 mt-1">
                      I agree to receive communications regarding my healthcare and appointments.
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-xs text-gray-500">
                  By clicking "I Agree", you acknowledge that you have read and understood this consent form.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" disabled>
                    Cancel
                  </Button>
                  <Button size="sm" disabled className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    I Agree
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Info */}
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-yellow-900 mb-1">Preview Information</p>
            <ul className="text-yellow-800 space-y-1">
              <li>• This preview shows how patients will see the consent form</li>
              <li>• Formatting and line breaks are preserved from your input</li>
              <li>• The actual form will include your hospital's branding</li>
              <li>• Version information helps track consent changes over time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}