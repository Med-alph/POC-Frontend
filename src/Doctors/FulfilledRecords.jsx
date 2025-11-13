import { useEffect, useState } from "react";
import appointmentsAPI from "../api/appointmentsapi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle2, CalendarDays, Clock, User, FileText, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FulfilledRecords() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 lg:p-8 transition-all">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="mb-6">
          {/* <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg mb-4">
            <CheckCircle2 className="h-6 w-6" />
            <span className="text-sm font-semibold">Fulfilled Patient Records</span>
          </div> */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Completed Appointments
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
            View and access patient records from fulfilled appointments
          </p>
        </div>

        {/* Stats Card */}
        {!loading && (
          <Card className="shadow-xl border-0 rounded-2xl overflow-hidden dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 text-white p-6">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                  <FileText className="h-6 w-6" />
                </div>
                Total Records: {appointments.length}
              </CardTitle>
            </CardHeader>
          </Card>
        )}

        {/* Loading State */}
        {loading ? (
          <Card className="shadow-xl border-0 rounded-2xl overflow-hidden dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Loading fulfilled records...</p>
              </div>
            </CardContent>
          </Card>
        ) : appointments.length === 0 ? (
          /* Empty State */
          <Card className="shadow-xl border-0 rounded-2xl overflow-hidden dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No fulfilled appointments found</p>
                <p className="text-gray-500 dark:text-gray-400">All completed appointments will appear here</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Records List */
          <div className="grid grid-cols-1 gap-4">
            {appointments.map((apt) => (
              <Card 
                key={apt.id} 
                className="shadow-xl border-0 rounded-2xl overflow-hidden dark:bg-gray-800 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                        <User className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {apt.patient_name || "Unknown Patient"}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            <span className="font-medium">{formatDate(apt.appointment_date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">{formatTime(apt.appointment_time)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => ViewRecord(apt.patient_id)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2 whitespace-nowrap"
                      aria-label={`View record of ${apt.patient_name}`}
                    >
                      <FileText className="h-4 w-4" />
                      View Record
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
