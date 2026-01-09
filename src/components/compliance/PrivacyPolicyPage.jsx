import React, { useState, useEffect } from "react";
import { complianceAPI } from "@/api/complianceapi";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicyPage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPrivacyPolicy();
  }, []);

  const loadPrivacyPolicy = async () => {
    try {
      setLoading(true);
      const response = await complianceAPI.getPrivacyPolicy();
      setContent(response.content || getDefaultPrivacyPolicy());
    } catch (err) {
      console.error('Error loading privacy policy:', err);
      setError('Failed to load privacy policy');
      setContent(getDefaultPrivacyPolicy());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPrivacyPolicy = () => {
    return `
      <div class="privacy-policy">
        <h1>Privacy Policy</h1>
        <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
        
        <h2>1. Information We Collect</h2>
        <p>We collect the following types of information:</p>
        <ul>
          <li><strong>Medical Information:</strong> Health records, treatment history, medications, allergies, and other medical data necessary for healthcare delivery.</li>
          <li><strong>Personal Information:</strong> Name, date of birth, contact information, address, and emergency contacts.</li>
          <li><strong>Insurance Information:</strong> Insurance provider details and policy numbers for billing purposes.</li>
          <li><strong>Technical Information:</strong> IP address, browser type, and usage data for system security and improvement.</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>Your information is used for:</p>
        <ul>
          <li>Providing medical care and treatment</li>
          <li>Maintaining accurate medical records</li>
          <li>Scheduling appointments and sending reminders</li>
          <li>Processing insurance claims and billing</li>
          <li>Complying with legal and regulatory requirements</li>
          <li>Improving our healthcare services</li>
        </ul>

        <h2>3. Information Sharing</h2>
        <p>We may share your information with:</p>
        <ul>
          <li><strong>Healthcare Providers:</strong> Doctors, nurses, and other medical professionals involved in your care</li>
          <li><strong>Insurance Companies:</strong> For claim processing and coverage verification</li>
          <li><strong>Legal Authorities:</strong> When required by law or court order</li>
          <li><strong>Emergency Situations:</strong> To protect your health and safety</li>
        </ul>
        <p><strong>We never sell your personal or medical information to third parties.</strong></p>

        <h2>4. Data Security</h2>
        <p>We implement robust security measures including:</p>
        <ul>
          <li>Encryption of data in transit and at rest</li>
          <li>Access controls and user authentication</li>
          <li>Regular security audits and monitoring</li>
          <li>Staff training on data protection</li>
          <li>Compliance with healthcare data protection standards</li>
        </ul>

        <h2>5. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your medical records and personal information</li>
          <li>Request corrections to inaccurate information</li>
          <li>Withdraw consent for non-essential data processing</li>
          <li>Request deletion of your data (subject to legal requirements)</li>
          <li>File complaints about data handling practices</li>
        </ul>

        <h2>6. Data Retention</h2>
        <p>We retain your information for:</p>
        <ul>
          <li><strong>Medical Records:</strong> As required by medical regulations (typically 7-10 years)</li>
          <li><strong>Personal Information:</strong> As long as you are an active patient</li>
          <li><strong>Technical Data:</strong> Up to 2 years for security and system improvement</li>
        </ul>

        <h2>7. Contact Information</h2>
        <p>For questions about this privacy policy or your data rights, contact:</p>
        <ul>
          <li><strong>Email:</strong> privacy@yourhospital.com</li>
          <li><strong>Phone:</strong> +91-XXXX-XXXX-XX</li>
          <li><strong>Address:</strong> Your Hospital Address</li>
        </ul>

        <h2>8. Changes to This Policy</h2>
        <p>We may update this privacy policy periodically. We will notify you of significant changes through our system or by email.</p>

        <p><strong>This policy complies with Indian Personal Data Protection Act (DPDP) 2023, HIPAA, and other applicable data protection regulations.</strong></p>
      </div>
    `;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Privacy Policy...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadPrivacyPolicy}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div 
            className="prose prose-blue max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
            style={{
              lineHeight: '1.6',
              fontSize: '16px'
            }}
          />
        </div>
      </div>
    </div>
  );
}