import { useEffect, useState } from "react";
import appointmentsAPI from "../api/appointmentsapi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle2, CalendarDays, Clock, User, FileText, ArrowRight, ThumbsUp, ThumbsDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReportExportButton from "../components/Reports/ReportExportButton";
import ReportPreviewModal from "../components/Reports/ReportPreviewModal";

export default function FulfilledRecords() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFulfilledAppointments = async () => {
      try {
        setLoading(true);
        const response = await appointmentsAPI.getFulfilledAppointments();
        setAppointments(response.appointments || []);
      } catch (err) {
        toast.error("Failed to load fulfilled appointments");
      } finally {
        setLoading(false);
      }
    };
    fetchFulfilledAppointments();
  }, []);

  function ViewRecord(patientId) {
    navigate("/doctor-patient-record/" + patientId);
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            Completed Appointments
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            View and access patient records from fulfilled appointments
          </p>
        </div>

        {/* Stats Card */}
        {!loading && (
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                Total Records: {appointments.length}
              </CardTitle>
            </CardHeader>
          </Card>
        )}

        {/* Loading State */}
        {loading ? (
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading fulfilled records...</p>
              </div>
            </CardContent>
          </Card>
        ) : appointments.length === 0 ? (
          /* Empty State */
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">No fulfilled appointments found</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">All completed appointments will appear here</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Records List */
          <div className="space-y-3">
            {appointments.map((apt) => (
              <Card 
                key={apt.id} 
                className="border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                        <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5">
                          {apt.patient_name || "Unknown Patient"}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            <span>{formatDate(apt.appointment_date)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{formatTime(apt.appointment_time)}</span>
                          </div>
                          {apt.feedback && (
                            <div className="flex items-center gap-1.5 ml-2 border-l border-gray-200 dark:border-gray-700 pl-3">
                              {apt.feedback.rating === 'positive' ? (
                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                  <ThumbsUp className="h-3 w-3" /> Excellent
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                                  <ThumbsDown className="h-3 w-3" /> Needs Attention
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ReportExportButton 
                        type="VISIT_SUMMARY"
                        consultationId={apt.consultation_id || apt.id} // Backend might return consultation_id or we use apt.id if it's the anchor
                        patientId={apt.patient_id}
                        variant="outline"
                        className="h-9 px-3 rounded-md"
                        onPreview={(url) => setPreviewUrl(url)}
                      />
                      <Button
                        onClick={() => ViewRecord(apt.patient_id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 text-sm font-medium rounded-md flex items-center gap-2 whitespace-nowrap"
                        aria-label={`View record of ${apt.patient_name}`}
                      >
                        <FileText className="h-4 w-4" />
                        View Record
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ReportPreviewModal 
        isOpen={!!previewUrl} 
        url={previewUrl} 
        onClose={() => setPreviewUrl(null)} 
        title="Encounter Summary Report"
      />
    </div>
  );
}
