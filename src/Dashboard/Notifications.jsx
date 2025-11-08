import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Pencil, X } from "lucide-react";
import notificationAPI from "../api/notificationapi";
import cancellationRequestAPI from "../api/cancellationrequestapi";
import appointmentsAPI from "../api/AppointmentsAPI";

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

  const Spinner = () => (
    <svg
      className="animate-spin h-5 w-5 text-gray-700"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      ></path>
    </svg>
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Notifications</h2>

      {loading ? (
        <p>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p>No notifications found.</p>
      ) : (
        <table className="w-full border border-gray-300 bg-white rounded-md">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-100">
              <th className="py-2 px-4 text-left">Date</th>
              <th className="py-2 px-4 text-left">Type</th>
              <th className="py-2 px-4 text-left">Doctor's Reason</th>
              <th className="py-2 px-4 text-left">Message</th>
              <th className="py-2 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((notif) => {
              const isProcessed =
                notif.cancellation_status === "approved" || notif.cancellation_status === "rejected";
              const isProcessing = processingId === notif.notification_id;
              return (
                <tr key={notif.notification_id} className="border-b border-gray-300 hover:bg-gray-50">
                  <td className="py-2 px-4 text-sm">
                    {new Date(notif.notification_created_at || notif.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2 px-4 text-sm">
                    {(notif.notification_type || "").replace(/_/g, " ")}
                  </td>
                  <td className="py-2 px-4 max-w-xs text-sm break-words">
                    {notif.notification_doctor_cancellation_reason || "-"}
                  </td>
                  <td className="py-2 px-4 max-w-xs text-sm">{notif.notification_message}</td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => openModal(notif)}
                      title="Review Request"
                      className={`p-1 rounded ${
                        isProcessed || isProcessing
                          ? "cursor-not-allowed text-gray-400"
                          : "hover:bg-gray-200"
                      }`}
                      disabled={isProcessed || isProcessing}
                    >
                      {isProcessing ? <Spinner /> : <Pencil className="h-5 w-5 text-gray-700" />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {modal.open && (
        <div className="fixed top-[20%] left-1/2 transform -translate-x-1/2 bg-white rounded shadow-lg max-w-md w-full z-50 p-5 border border-gray-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Review Cancellation Request</h3>
            <button
              onClick={closeModal}
              aria-label="Close"
              className="p-1 rounded hover:bg-gray-200"
              disabled={processingId === modal.notif.notification_id}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <textarea
            rows={4}
            className="w-full border border-gray-300 rounded p-2 mb-4 resize-none"
            placeholder="Add comments (optional)"
            value={modal.comments}
            onChange={(e) => setModal({ ...modal, comments: e.target.value })}
            disabled={processingId === modal.notif.notification_id}
          />
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleApprove}
              disabled={processingId === modal.notif.notification_id}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white disabled:opacity-50"
            >
              {processingId === modal.notif.notification_id ? "Processing..." : "Approve"}
            </button>
            <button
              onClick={handleReject}
              disabled={processingId === modal.notif.notification_id}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white disabled:opacity-50"
            >
              {processingId === modal.notif.notification_id ? "Processing..." : "Reject"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
