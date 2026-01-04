import React, { useState, useEffect } from 'react';
import { X, Loader2, Sparkles, AlertCircle, Pill, FlaskConical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSelector } from 'react-redux';
import copilotAPI from '@/api/copilotapi';

/**
 * CopilotPanel - AI Clinical Copilot side panel component
 * Displays structured insights for patient care
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the panel is open
 * @param {Function} props.onClose - Callback to close the panel
 * @param {string} props.patientId - Patient ID for fetching insights
 */
const CopilotPanel = ({ isOpen, onClose, patientId }) => {
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (isOpen && patientId && !data) {
      fetchCopilotData();
    }
    // Reset data when panel closes
    if (!isOpen) {
      setData(null);
      setError(null);
    }
  }, [isOpen, patientId]);

  const fetchCopilotData = async () => {
    if (!patientId || !user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await copilotAPI.getPatientInsights(
        patientId,
        user.id,
        "What are the key concerns for this patient?",
        "patient_summary"
      );
      setData(response);
    } catch (err) {
      console.error('Failed to fetch copilot data:', err);
      setError(err.message || 'Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action) => {
    // Handle action based on type and metadata
    // This can trigger navigation, modals, or other handlers
    if (action.metadata?.route) {
      // Example: navigate to route if provided
      window.location.href = action.metadata.route;
    } else if (action.metadata?.modal) {
      // Example: open modal if provided
      console.log('Open modal:', action.metadata.modal);
    }
    // Add more action handlers as needed
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      {/* Side Panel */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
              AI Clinical Insights
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400 mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Analyzing patient data...</p>
            </div>
          )}

          {error && (
            <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchCopilotData}
                  className="mt-3"
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {!loading && !error && data && (
            <>
              {/* Summary */}
              {data.insights?.summary && (
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                      Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {data.insights.summary}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Key Findings */}
              {data.insights?.keyFindings && data.insights.keyFindings.length > 0 && (
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                      Key Findings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {data.insights.keyFindings.map((finding, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-2 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Active Concerns */}
              {data.insights?.activeConcerns && data.insights.activeConcerns.length > 0 && (
                <Card className="border-0 shadow-md border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      Active Concerns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {data.insights.activeConcerns.map((concern, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-600 dark:bg-orange-400 mt-2 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Medication Status */}
              {data.insights?.medicationStatus && (
                <Card className="border-0 shadow-md border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Pill className="h-4 w-4 text-green-600 dark:text-green-400" />
                      Medication Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {data.insights.medicationStatus}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Lab Status */}
              {data.insights?.labStatus && (
                <Card className="border-0 shadow-md border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      Lab Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {data.insights.labStatus}
                    </p>
                  </CardContent>
                </Card>
              )}

            </>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && data && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              AI-generated summary • Reviewed by clinician
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default CopilotPanel;

