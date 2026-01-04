import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
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
import attendanceAPI from "../api/attendanceapi";

export default function Notifications() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [modal, setModal] = useState({ open: false, notif: null, comments: "" });
  const [filter, setFilter] = useState('unread');

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.list({
        limit: 50,
        filter: filter
      });
      // Handle both array response and object with notifications property
      const notificationsData = Array.isArray(response) ? response : (response.notifications || response.data || []);
      setNotifications(notificationsData);
    } catch (error) {
      toast.error("Failed to load notifications");
      console.error("Fetch notifications failed:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const openModal = (notif) => {
    setModal({ open: true, notif, comments: "" });
  };

  const closeModal = () => {
    setModal({ open: false, notif: null, comments: "" });
  };
  
  // Determine notification type
  const getNotificationType = (notif) => {
    // Check multiple fields to determine if it's a leave request
    if (
      notif.notification_type === 'leave_request' ||  // API uses lowercase with underscore
      notif.notification_type === 'LEAVE_REQUEST' || 
      notif.type === 'leave_request' ||
      notif.notification_leave_request_id ||  // API field name
      notif.leave_request_id ||
      (notif.notification_metadata && (notif.notification_metadata.leaveType || notif.notification_metadata.startDate)) ||
      (notif.metadata && (notif.metadata.leaveType || notif.metadata.startDate))
    ) {
      return 'leave';
    }
    return 'cancellation';
  };

  const handleApprove = async () => {
    const notifType = getNotificationType(modal.notif);
    
    if (notifType === 'leave') {
      // Handle leave request approval
      if (!modal.notif?.leave_request_id) {
        toast.error("Leave request ID missing.");
        return;
      }
      try {
        setProcessingId(modal.notif.notification_id);
        await attendanceAPI.approveLeave(
          modal.notif.leave_request_id,
          user.id
        );
        toast.success("Leave request approved");
        setModal({ open: false, notif: null, comments: "" });
        await fetchNotifications();
      } catch (error) {
        console.error("Leave approval failed:", error);
        toast.error("Failed to approve leave request");
      } finally {
        setProcessingId(null);
      }
    } else {
      // Handle cancellation request approval
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
    }
  };

  const handleReject = async () => {
    const notifType = getNotificationType(modal.notif);
    
    if (notifType === 'leave') {
      // Handle leave request rejection
      if (!modal.notif?.leave_request_id) {
        toast.error("Leave request ID missing.");
        return;
      }
      try {
        setProcessingId(modal.notif.notification_id);
        await attendanceAPI.rejectLeave(
          modal.notif.leave_request_id,
          user.id,
          modal.comments || "Leave request rejected by admin"
        );
        toast.success("Leave request rejected");
        setModal({ open: false, notif: null, comments: "" });
        await fetchNotifications();
      } catch (error) {
        console.error("Leave rejection failed:", error);
        toast.error("Failed to reject leave request");
      } finally {
        setProcessingId(null);
      }
    } else {
      // Handle cancellation request rejection
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
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 p-6 lg:p-8">
        <Toaster position="top-right" />
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            Notifications
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            View and manage all your notifications
          </p>
          
          {/* Filter Tabs */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {notifications.length > 0 && (
              <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400">Total:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{notifications.length}</span>
              </div>
            )}
          </div>
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
              const notifType = getNotificationType(notif);
              const isProcessed = notifType === 'leave' 
                ? (notif.status === "approved" || notif.status === "rejected")
                : (notif.cancellation_status === "approved" || notif.cancellation_status === "rejected");
              const isProcessing = processingId === (notif.notification_id || notif.id);
              
              // Support both old and new notification formats
              const notificationId = notif.notification_id || notif.id;
              const notificationType = (notif.notification_type || notif.type || "").replace(/_/g, " ");
              const notificationTitle = notif.title || notif.notification_type || notif.type || "Notification";
              const notificationBody = notif.body || notif.notification_message || notif.message || "";
              const notificationSeverity = notif.severity || 'info';
              const notificationStatus = notif.status || 'unread';
              const notificationData = notif.data || notif.notification_metadata || notif.metadata || {};
              const displayStatus = notifType === 'leave' ? notif.status : notif.cancellation_status;

              // Get severity color
              const getSeverityColor = (severity) => {
                switch(severity) {
                  case 'critical':
                    return {
                      bg: 'bg-red-100 dark:bg-red-900/30',
                      border: 'border-red-200 dark:border-red-800',
                      icon: 'text-red-600 dark:text-red-400',
                      badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
                    };
                  case 'warning':
                    return {
                      bg: 'bg-orange-100 dark:bg-orange-900/30',
                      border: 'border-orange-200 dark:border-orange-800',
                      icon: 'text-orange-600 dark:text-orange-400',
                      badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800'
                    };
                  default:
                    return {
                      bg: 'bg-blue-100 dark:bg-blue-900/30',
                      border: 'border-blue-200 dark:border-blue-800',
                      icon: 'text-blue-600 dark:text-blue-400',
                      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                    };
                }
              };

              const severityColors = getSeverityColor(notificationSeverity);

              return (
                <div
                  key={notificationId}
                  className={`bg-white dark:bg-gray-800 border rounded-md transition-colors ${
                    isProcessed || notificationStatus === 'read' || notificationStatus === 'dismissed'
                      ? "border-gray-200 dark:border-gray-700 opacity-75"
                      : notifType === 'leave'
                        ? "border-orange-200 dark:border-orange-800"
                        : severityColors.border
                  }`}
                >
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      {/* Left Section */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-md ${
                            isProcessed || notificationStatus === 'read'
                              ? "bg-gray-100 dark:bg-gray-700"
                              : notifType === 'leave'
                                ? "bg-orange-100 dark:bg-orange-900/30"
                                : severityColors.bg
                          }`}>
                            {notifType === 'leave' ? (
                              <FileText className={`h-5 w-5 ${
                                isProcessed
                                  ? "text-gray-500 dark:text-gray-400"
                                  : "text-orange-600 dark:text-orange-400"
                              }`} />
                            ) : (
                              <AlertCircle className={`h-5 w-5 ${
                                isProcessed || notificationStatus === 'read'
                                  ? "text-gray-500 dark:text-gray-400"
                                  : severityColors.icon
                              }`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                {notificationTitle}
                              </h3>
                              {/* Severity Badge */}
                              {notificationSeverity && notificationSeverity !== 'info' && (
                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${severityColors.badge}`}>
                                  {notificationSeverity.charAt(0).toUpperCase() + notificationSeverity.slice(1)}
                                </span>
                              )}
                              {/* Status Badge */}
                              {notificationStatus && (
                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                                  notificationStatus === 'read' || notificationStatus === 'dismissed'
                                    ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
                                }`}>
                                  {notificationStatus.charAt(0).toUpperCase() + notificationStatus.slice(1)}
                                </span>
                              )}
                              {/* Only show status badge for cancellation requests */}
                              {notifType === 'cancellation' && getStatusBadge(displayStatus)}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                              {notificationBody}
                            </p>
                            
                            {/* Display notification data/details if available */}
                            {Object.keys(notificationData).length > 0 && (
                              <div className={`${notifType === 'leave' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'} rounded-md p-3 mb-2 border`}>
                                <div className="space-y-1.5 text-xs">
                                  {Object.entries(notificationData).map(([key, value]) => {
                                    if (value === null || value === undefined) return null;
                                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                    return (
                                      <div key={key} className="flex items-center justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">{displayKey}:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {/* Leave Request Details */}
                            {notifType === 'leave' && (notif.notification_metadata || notif.metadata) && (
                              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-md p-3 mb-2 border border-orange-200 dark:border-orange-800">
                                <div className="space-y-1.5 text-xs">
                                  {(() => {
                                    const meta = notif.notification_metadata || notif.metadata;
                                    return (
                                      <>
                                        <div className="flex items-center justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Leave Type:</span>
                                          <span className="font-medium text-gray-900 dark:text-white capitalize">
                                            {meta.leaveType || 'N/A'}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                                          <span className="font-medium text-gray-900 dark:text-white">
                                            {meta.startDate} to {meta.endDate}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Total Days:</span>
                                          <span className="font-medium text-gray-900 dark:text-white">
                                            {meta.totalDays} {meta.totalDays === 1 ? 'day' : 'days'}
                                          </span>
                                        </div>
                                        {meta.reason && (
                                          <div className="pt-1.5 border-t border-orange-200 dark:border-orange-800">
                                            <p className="text-gray-600 dark:text-gray-400 mb-0.5">Reason:</p>
                                            <p className="text-gray-800 dark:text-gray-200">{meta.reason}</p>
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}
                            
                            {/* Cancellation Request Details */}
                            {notifType === 'cancellation' && notif.notification_doctor_cancellation_reason && (
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
                                <span>{formatDate(notif.notification_created_at || notif.created_at || notif.createdAt)}</span>
                              </div>
                              {notif.type && (
                                <div className="flex items-center gap-1">
                                  <FileText className="h-3.5 w-3.5" />
                                  <span className="capitalize">{notif.type}</span>
                                </div>
                              )}
                              {notif.target_type && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3.5 w-3.5" />
                                  <span>{notif.target_type}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Action Buttons */}
                      <div className="flex items-center sm:items-start gap-2">
                        {/* Mark as read button for unread notifications */}
                        {notificationStatus === 'unread' && (
                          <button
                            onClick={async () => {
                              try {
                                await notificationAPI.markAsRead(notificationId);
                                toast.success("Notification marked as read");
                                await fetchNotifications();
                              } catch (error) {
                                toast.error("Failed to mark as read");
                              }
                            }}
                            className="px-3 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Mark Read
                          </button>
                        )}
                        
                        {/* Action Button (Only for cancellation requests) */}
                        {!isProcessed && notifType === 'cancellation' && (
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
                        )}
                        
                        {/* For leave requests, show a link to Leave Management */}
                        {notifType === 'leave' && (
                          <button
                            onClick={() => navigate('/leave-management')}
                            className="px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 bg-orange-600 text-white hover:bg-orange-700"
                          >
                            <Calendar className="h-4 w-4" />
                            Manage in Leave Tab
                          </button>
                        )}
                      </div>
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
                    {getNotificationType(modal.notif) === 'leave' ? (
                      <FileText className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {getNotificationType(modal.notif) === 'leave' ? 'Review Leave Request' : 'Review Cancellation Request'}
                    </h3>
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
                <div className={`rounded-md p-3 border ${
                  getNotificationType(modal.notif) === 'leave'
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Request Details:
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {modal.notif?.notification_message || modal.notif?.message}
                  </p>
                  
                  {/* Leave Request Details */}
                  {getNotificationType(modal.notif) === 'leave' && modal.notif?.metadata && (
                    <div className="mt-2 pt-2 border-t border-orange-200 dark:border-orange-800 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Leave Type:</span>
                        <span className="font-medium text-gray-900 dark:text-white capitalize">
                          {modal.notif.metadata.leaveType}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {modal.notif.metadata.startDate} to {modal.notif.metadata.endDate}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Total Days:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {modal.notif.metadata.totalDays} {modal.notif.metadata.totalDays === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                      {modal.notif.metadata.reason && (
                        <div className="pt-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Reason:</p>
                          <p className="text-xs text-gray-800 dark:text-gray-200">{modal.notif.metadata.reason}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Cancellation Request Details */}
                  {getNotificationType(modal.notif) === 'cancellation' && modal.notif?.notification_doctor_cancellation_reason && (
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
                    {getNotificationType(modal.notif) === 'leave' ? 'Rejection Reason (Required for rejection)' : 'Add Comments (Optional)'}
                  </label>
                  <textarea
                    rows={4}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-md p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                    placeholder={getNotificationType(modal.notif) === 'leave' ? 'Enter rejection reason...' : 'Enter your comments here...'}
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
      </main>
    </div>
  );
}
