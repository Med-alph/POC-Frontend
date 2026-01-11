import React, { useState, useEffect } from "react";
import { complianceAPI } from "@/api/complianceapi";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function TermsOfServicePage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadTermsOfService();
  }, []);

  const loadTermsOfService = async () => {
    try {
      setLoading(true);
      const response = await complianceAPI.getTermsOfService();
      setContent(response.content || getDefaultTermsOfService());
    } catch (err) {
      console.error('Error loading terms of service:', err);
      setError('Failed to load terms of service');
      setContent(getDefaultTermsOfService());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultTermsOfService = () => {
    return `
      <div class="terms-of-service">
        <h1>Terms of Service</h1>
        <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
        
        <h2>1. Acceptance of Terms</h2>
        <p>By using this Electronic Medical Records (EMR) system, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use this system.</p>

        <h2>2. Description of Service</h2>
        <p>This EMR system is a healthcare management tool designed to:</p>
        <ul>
          <li>Store and manage patient medical records</li>
          <li>Facilitate appointment scheduling and management</li>
          <li>Support healthcare providers in delivering medical care</li>
          <li>Maintain compliance with healthcare regulations</li>
        </ul>

        <h2>3. Medical Disclaimer</h2>
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>IMPORTANT MEDICAL DISCLAIMER:</strong></p>
          <ul>
            <li><strong>This system is a tool, not a medical professional</strong></li>
            <li><strong>All medical decisions remain the responsibility of licensed healthcare providers</strong></li>
            <li><strong>This software does not provide medical advice, diagnosis, or treatment recommendations</strong></li>
            <li><strong>Healthcare providers are solely responsible for patient care decisions</strong></li>
            <li><strong>In case of medical emergencies, contact emergency services immediately</strong></li>
          </ul>
        </div>

        <h2>4. User Responsibilities</h2>
        <p>Users of this system agree to:</p>
        <ul>
          <li>Provide accurate and complete information</li>
          <li>Maintain the confidentiality of login credentials</li>
          <li>Use the system only for legitimate healthcare purposes</li>
          <li>Comply with all applicable laws and regulations</li>
          <li>Report any security breaches or unauthorized access immediately</li>
          <li>Not attempt to access data they are not authorized to view</li>
        </ul>

        <h2>5. Healthcare Provider Responsibilities</h2>
        <p>Healthcare providers using this system acknowledge that:</p>
        <ul>
          <li>They remain fully responsible for all medical decisions and patient care</li>
          <li>They must verify all information before making medical decisions</li>
          <li>They are responsible for maintaining their professional licenses and certifications</li>
          <li>They must comply with all medical ethics and professional standards</li>
          <li>They are responsible for obtaining proper patient consent</li>
        </ul>

        <h2>6. Data Security and Privacy</h2>
        <p>We are committed to protecting your data:</p>
        <ul>
          <li>All data is encrypted in transit and at rest</li>
          <li>Access is restricted to authorized personnel only</li>
          <li>We comply with healthcare data protection regulations</li>
          <li>Regular security audits and monitoring are performed</li>
          <li>Data breaches will be reported as required by law</li>
        </ul>

        <h2>7. System Availability</h2>
        <p>While we strive for maximum uptime:</p>
        <ul>
          <li>We do not guarantee 100% system availability</li>
          <li>Scheduled maintenance may cause temporary outages</li>
          <li>Emergency maintenance may be performed without notice</li>
          <li>Users should have backup procedures for critical situations</li>
        </ul>

        <h2>8. Limitation of Liability</h2>
        <div style="background-color: #fffbeb; border: 1px solid #fed7aa; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>LIMITATION OF LIABILITY:</strong></p>
          <p>To the maximum extent permitted by law, we shall not be liable for:</p>
          <ul>
            <li>Any medical malpractice or healthcare-related claims</li>
            <li>Decisions made by healthcare providers using this system</li>
            <li>Data loss due to user error or system failures</li>
            <li>Indirect, incidental, or consequential damages</li>
            <li>Business interruption or loss of profits</li>
          </ul>
        </div>

        <h2>9. Indemnification</h2>
        <p>Users agree to indemnify and hold harmless the system provider from any claims, damages, or expenses arising from:</p>
        <ul>
          <li>Misuse of the system</li>
          <li>Violation of these terms</li>
          <li>Medical decisions made using system data</li>
          <li>Breach of patient confidentiality</li>
          <li>Non-compliance with applicable laws</li>
        </ul>

        <h2>10. Compliance and Regulations</h2>
        <p>This system is designed to comply with:</p>
        <ul>
          <li>Indian Personal Data Protection Act (DPDP) 2023</li>
          <li>Medical Council of India regulations</li>
          <li>Healthcare data protection standards</li>
          <li>International healthcare compliance requirements (where applicable)</li>
        </ul>

        <h2>11. Termination</h2>
        <p>We reserve the right to terminate access to the system for:</p>
        <ul>
          <li>Violation of these terms</li>
          <li>Misuse of the system</li>
          <li>Security breaches</li>
          <li>Non-payment of fees (if applicable)</li>
        </ul>

        <h2>12. Changes to Terms</h2>
        <p>We may update these terms periodically. Users will be notified of significant changes and may be required to accept updated terms to continue using the system.</p>

        <h2>13. Contact Information</h2>
        <p>For questions about these terms, contact:</p>
        <ul>
          <li><strong>Email:</strong> legal@yourhospital.com</li>
          <li><strong>Phone:</strong> +91-XXXX-XXXX-XX</li>
          <li><strong>Address:</strong> Your Hospital Address</li>
        </ul>

        <h2>14. Governing Law</h2>
        <p>These terms are governed by the laws of India. Any disputes will be resolved in the courts of [Your Jurisdiction].</p>

        <p><strong>By using this system, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</strong></p>
      </div>
    `;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Terms of Service...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadTermsOfService}>Retry</Button>
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
              <FileText className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
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