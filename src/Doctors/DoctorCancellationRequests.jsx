import React, { useEffect, useState } from "react";
import cancellationRequestAPI from "../api/cancellationrequestapi";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { XCircle, CalendarDays, MessageSquare, Clock, FileText, CheckCircle2, AlertCircle, Hourglass } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DoctorCancellationRequests() {
  const user = useSelector((state) => state.auth.user);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user?.id) {
        toast.error("User not authenticated");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await cancellationRequestAPI.getDoctorRequests(user.id);
        setRequests(data);
      } catch (error) {
        toast.error("Failed to load cancellation requests");
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [user]);

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusConfig = (status) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'approved':
        return {
          color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700",
          icon: CheckCircle2,
          label: "Approved"
        };
      case 'rejected':
      case 'denied':
        return {
          color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-300 dark:border-red-700",
          icon: XCircle,
          label: "Rejected"
        };
      case 'pending':
        return {
          color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700",
          icon: Hourglass,
          label: "Pending"
        };
      default:
        return {
          color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600",
          icon: AlertCircle,
          label: status || "Unknown"
        };
    }
  };

  const pendingCount = requests.filter(r => r.status?.toLowerCase() === 'pending').length;
  const approvedCount = requests.filter(r => r.status?.toLowerCase() === 'approved').length;
  const rejectedCount = requests.filter(r => r.status?.toLowerCase() === 'rejected' || r.status?.toLowerCase() === 'denied').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            My Cancellation Requests
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track and manage your appointment cancellation requests
          </p>
        </div>

        {/* Stats Cards */}
        {!loading && requests.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border border-gray-200 dark:border-gray-700">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Hourglass className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-4xl font-semibold text-gray-900 dark:text-white mb-1">
                    {pendingCount}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Awaiting review
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-700">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  Approved
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-4xl font-semibold text-gray-900 dark:text-white mb-1">
                    {approvedCount}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Requests approved
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-700">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  Rejected
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-4xl font-semibold text-gray-900 dark:text-white mb-1">
                    {rejectedCount}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Requests rejected
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
      {loading ? (
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading cancellation requests...</p>
              </div>
            </CardContent>
          </Card>
      ) : requests.length === 0 ? (
          /* Empty State */
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <XCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">No cancellation requests found</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your cancellation requests will appear here</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Requests List */
          <div className="space-y-3">
            {requests.map((req) => {
              const statusConfig = getStatusConfig(req.status);
              const StatusIcon = statusConfig.icon;
              return (
                <Card 
                  key={req.id} 
                  className="border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Left Section - Main Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                            <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                Appointment #{req.appointment_id}
                              </h3>
                              <Badge className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig.label}
                              </Badge>
                            </div>
                            
                            {/* Reason */}
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700 mb-2">
                              <div className="flex items-center gap-1.5 mb-1">
                                <MessageSquare className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Cancellation Reason</p>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {req.doctor_cancellation_reason || "No reason provided"}
                              </p>
                            </div>

                            {/* Reviewer Comments */}
                            {req.review_comments && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-3 border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <MessageSquare className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Reviewer Comments</p>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {req.review_comments}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Dates */}
                      <div className="lg:w-56 space-y-2">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Clock className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Requested On</p>
                          </div>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">
                            {formatDateTime(req.created_at)}
                          </p>
                        </div>
                        {req.updated_at && req.updated_at !== req.created_at && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-3 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-1.5 mb-1">
                              <CalendarDays className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                              <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Last Updated</p>
                            </div>
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">
                              {formatDateTime(req.updated_at)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
