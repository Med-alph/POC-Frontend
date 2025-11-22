import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { 
  Bell, 
  X, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  MessageSquare,
  Calendar,
  User,
  FileText,
  Loader2
} from "lucide-react";
import notificationAPI from "../api/notificationapi";
import cancellationRequestAPI from "../api/cancellationrequestapi";
import appointmentsAPI from "../api/appointmentsapi";

export default function Notifications() {
  const user = useSelector((state) => state.auth.user);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [modal, setModal] = useState({ open: false, notif: null, comments: "" });

  const fetchNotifications = async () => {
    if (!user) {
      console.warn("User not found, skipping fetch");
      return;
    }
    try {
      setLoading(true);
      const data = await notificationAPI.getUserNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      toast.error("Failed to load notifications");
      console.error("Fetch notifications failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const openModal = (notif) => {
    setModal({ open: true, notif, comments: "" });
  };

  const closeModal = () => {
    setModal({ open: false, notif: null, comments: "" });
  };

  const handleApprove = async () => {
    if (!modal.notif?.notification_cancellation_request_id) {
      toast.error("Cancellation request id missing.");
      return;
    }
    if (!modal.notif?.notification_appointment_id) {
      toast.error("Appointment id missing.");
      return;
    }
    try {
      setProcessingId(modal.notif.notification_id);
      await cancellationRequestAPI.reviewRequest({
        requestId: modal.notif.notification_cancellation_request_id,
        adminId: user.id,
        approve: true,
        comments: modal.comments,
      });
      toast.success("Request approved");

      await appointmentsAPI.cancel(modal.notif.notification_appointment_id, {
        cancelled_by: user.id,
        reason: modal.comments.trim() || "Cancellation approved by admin",
      });

      setModal({ open: false, notif: null, comments: "" });
      await fetchNotifications();
    } catch (error) {
      console.error("Approve and cancel failed:", error);
      toast.error("Failed to process cancellation approval");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!modal.notif?.notification_cancellation_request_id) {
      toast.error("Cancellation request id missing.");
      return;
    }
    try {
      setProcessingId(modal.notif.notification_id);
      await cancellationRequestAPI.reviewRequest({
        requestId: modal.notif.notification_cancellation_request_id,
        adminId: user.id,
        approve: false,
        comments: modal.comments,
      });
      toast.success("Request rejected");
      setModal({ open: false, notif: null, comments: "" });
      await fetchNotifications();
    } catch (error) {
      console.error("Reject failed:", error);
      toast.error("Failed to reject request");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    if (status === "approved") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-3 w-3" />
          Approved
        </span>
      );
    }
    if (status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
          <XCircle className="h-3 w-3" />
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
        <Clock className="h-3 w-3" />
        Pending
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            Notifications
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Review and manage cancellation requests
          </p>
          {notifications.length > 0 && (
            <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 mt-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">Total:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{notifications.length}</span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Loading notifications...</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Please wait</p>
          </div>
        ) : notifications.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">No notifications</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">You're all caught up! No pending notifications at the moment.</p>
          </div>
        ) : (
          /* Notifications List */
          <div className="space-y-3">
            {notifications.map((notif) => {
              const isProcessed =
                notif.cancellation_status === "approved" || notif.cancellation_status === "rejected";
              const isProcessing = processingId === notif.notification_id;
              const notificationType = (notif.notification_type || "").replace(/_/g, " ");

              return (
                <div
                  key={notif.notification_id}
                  className={`bg-white dark:bg-gray-800 border rounded-md transition-colors ${
                    isProcessed
                      ? "border-gray-200 dark:border-gray-700 opacity-75"
                      : "border-blue-200 dark:border-blue-800"
                  }`}
                >
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      {/* Left Section */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-md ${
                            isProcessed
                              ? "bg-gray-100 dark:bg-gray-700"
                              : "bg-blue-100 dark:bg-blue-900/30"
                          }`}>
                            <AlertCircle className={`h-5 w-5 ${
                              isProcessed
                                ? "text-gray-500 dark:text-gray-400"
                                : "text-blue-600 dark:text-blue-400"
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                {notificationType}
                              </h3>
                              {getStatusBadge(notif.cancellation_status)}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                              {notif.notification_message}
                            </p>
                            {notif.notification_doctor_cancellation_reason && (
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 mb-2 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-start gap-1.5">
                                  <FileText className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                                      Doctor's Reason:
                                    </p>
                                    <p className="text-xs text-gray-800 dark:text-gray-200">
                                      {notif.notification_doctor_cancellation_reason}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{formatDate(notif.notification_created_at || notif.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Action Button */}
                      {!isProcessed && (
                        <div className="flex items-center sm:items-start">
                          <button
                            onClick={() => openModal(notif)}
                            disabled={isProcessing}
                            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 ${
                              isProcessing
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <MessageSquare className="h-4 w-4" />
                                Review Request
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {modal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={closeModal}
            />
            <div className="relative z-50 bg-white dark:bg-gray-800 rounded-md shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700">
              {/* Modal Header */}
              <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Review Cancellation Request</h3>
                  </div>
                  <button
                    onClick={closeModal}
                    aria-label="Close"
                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                    disabled={processingId === modal.notif?.notification_id}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-4 space-y-3">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Request Details:
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {modal.notif?.notification_message}
                  </p>
                  {modal.notif?.notification_doctor_cancellation_reason && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                        Doctor's Reason:
                      </p>
                      <p className="text-xs text-gray-800 dark:text-gray-200">
                        {modal.notif.notification_doctor_cancellation_reason}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Add Comments (Optional)
                  </label>
                  <textarea
                    rows={4}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-md p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                    placeholder="Enter your comments here..."
                    value={modal.comments}
                    onChange={(e) => setModal({ ...modal, comments: e.target.value })}
                    disabled={processingId === modal.notif?.notification_id}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 pt-0 flex justify-end gap-2">
                <button
                  onClick={closeModal}
                  disabled={processingId === modal.notif?.notification_id}
                  className="px-4 py-2 rounded-md font-medium text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={processingId === modal.notif?.notification_id}
                  className="px-4 py-2 rounded-md font-medium text-sm bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {processingId === modal.notif?.notification_id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Reject"
                  )}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processingId === modal.notif?.notification_id}
                  className="px-4 py-2 rounded-md font-medium text-sm bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {processingId === modal.notif?.notification_id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Approve"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
