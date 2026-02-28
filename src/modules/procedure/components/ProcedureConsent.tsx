// Procedure Consent Component

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, CheckCircle2, XCircle } from 'lucide-react';
import { procedureAPI } from '../services/procedure.api';
import type { Procedure } from '../types/procedure.types';
import { useProcedurePermissions } from '../hooks/useProcedurePermissions';
import toast from 'react-hot-toast';

interface ProcedureConsentProps {
  procedure: Procedure;
  onConsentSigned?: () => void;
}

export const ProcedureConsent: React.FC<ProcedureConsentProps> = ({
  procedure,
  onConsentSigned,
}) => {
  const { canSignConsent } = useProcedurePermissions();
  const [consentText, setConsentText] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    loadConsentText();
  }, [procedure.id]);

  const loadConsentText = async () => {
    try {
      setLoading(true);
      // Load default consent text from procedure template or tenant settings
      // For now, use a default text - backend should provide this
      const templates = await procedureAPI.getTemplates();
      const template = templates.find(t => t.id === procedure.procedureTypeId);
      setConsentText(template?.defaultConsentText || 'I hereby consent to the procedure as described. I understand the risks and benefits.');
    } catch (error) {
      console.error('Failed to load consent text:', error);
      setConsentText('I hereby consent to the procedure as described. I understand the risks and benefits.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignConsent = async () => {
    if (!agreed) {
      toast.error('Please agree to the consent terms');
      return;
    }

    try {
      setSigning(true);
      await procedureAPI.signConsent(procedure.id);
      toast.success('Consent signed successfully');
      onConsentSigned?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign consent');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Procedure Consent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {procedure.consentSigned ? (
          <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-400">Consent Signed</p>
              {procedure.consentSignedAt && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Signed on {new Date(procedure.consentSignedAt).toLocaleString()}
                  {procedure.consentSignedBy && ` by ${procedure.consentSignedBy}`}
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {consentText}
              </p>
            </div>

            {canSignConsent && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="consent-agree"
                    checked={agreed}
                    onCheckedChange={(checked) => setAgreed(checked as boolean)}
                  />
                  <label
                    htmlFor="consent-agree"
                    className="text-sm font-medium cursor-pointer"
                  >
                    I agree to the terms and conditions above
                  </label>
                </div>

                <Button
                  onClick={handleSignConsent}
                  disabled={!agreed || signing}
                  className="w-full"
                >
                  {signing ? 'Signing...' : 'Sign Consent'}
                </Button>
              </div>
            )}

            {!canSignConsent && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <XCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  You don't have permission to sign consent
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};


