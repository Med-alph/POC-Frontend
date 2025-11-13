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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 lg:p-8 transition-all">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="mb-6">
          {/* <div className="inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-3 rounded-xl shadow-lg mb-4">
            <XCircle className="h-6 w-6" />
            <span className="text-sm font-semibold">Cancellation Requests</span>
          </div> */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            My Cancellation Requests
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
            Track and manage your appointment cancellation requests
          </p>
        </div>

        {/* Stats Cards */}
        {!loading && requests.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <Card className="shadow-xl border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
              <CardHeader className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-orange-500 text-white p-6">
                <CardTitle className="text-lg font-bold flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Hourglass className="h-5 w-5" />
                  </div>
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                    {pendingCount}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Awaiting review
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
              <CardHeader className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 text-white p-6">
                <CardTitle className="text-lg font-bold flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  Approved
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                    {approvedCount}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Requests approved
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
              <CardHeader className="bg-gradient-to-r from-red-600 via-red-500 to-rose-500 text-white p-6">
                <CardTitle className="text-lg font-bold flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                    <XCircle className="h-5 w-5" />
                  </div>
                  Rejected
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                    {rejectedCount}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Requests rejected
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
      {loading ? (
          <Card className="shadow-xl border-0 rounded-2xl overflow-hidden dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-600 mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Loading cancellation requests...</p>
              </div>
            </CardContent>
          </Card>
      ) : requests.length === 0 ? (
          /* Empty State */
          <Card className="shadow-xl border-0 rounded-2xl overflow-hidden dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <XCircle className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No cancellation requests found</p>
                <p className="text-gray-500 dark:text-gray-400">Your cancellation requests will appear here</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Requests List */
          <div className="space-y-4">
            {requests.map((req) => {
              const statusConfig = getStatusConfig(req.status);
              const StatusIcon = statusConfig.icon;
              return (
                <Card 
                  key={req.id} 
                  className="shadow-xl border-0 rounded-2xl overflow-hidden dark:bg-gray-800 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Left Section - Main Info */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                              <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                  Appointment #{req.appointment_id}
                                </h3>
                                <Badge className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${statusConfig.color}`}>
                                  <StatusIcon className="h-3.5 w-3.5" />
                                  {statusConfig.label}
                                </Badge>
                              </div>
                              
                              {/* Reason */}
                              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600 mb-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <MessageSquare className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Cancellation Reason</p>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {req.doctor_cancellation_reason || "No reason provided"}
                                </p>
                              </div>

                              {/* Reviewer Comments */}
                              {req.review_comments && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                                  <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Reviewer Comments</p>
                                  </div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    {req.review_comments}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Dates */}
                      <div className="lg:w-64 space-y-3">
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Requested On</p>
                          </div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {formatDateTime(req.created_at)}
                          </p>
                        </div>
                        {req.updated_at && req.updated_at !== req.created_at && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-2">
                              <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Last Updated</p>
                            </div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
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
