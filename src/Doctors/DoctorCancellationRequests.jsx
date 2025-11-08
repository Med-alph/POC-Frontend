import React, { useEffect, useState } from "react";
import cancellationRequestAPI from "../api/cancellationrequestapi";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

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

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">My Cancellation Requests</h2>
      {loading ? (
        <p>Loading...</p>
      ) : requests.length === 0 ? (
        <p>No cancellation requests found.</p>
      ) : (
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border border-gray-300">Appointment ID</th>
              <th className="p-2 border border-gray-300">Reason</th>
              <th className="p-2 border border-gray-300">Status</th>
              <th className="p-2 border border-gray-300">Reviewer Comments</th>
              <th className="p-2 border border-gray-300">Last Updated</th>
              <th className="p-2 border border-gray-300">Requested On</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50">
                <td className="p-2 border border-gray-300 break-words">{req.appointment_id}</td>
                <td className="p-2 border border-gray-300">{req.doctor_cancellation_reason || "-"}</td>
                <td className="p-2 border border-gray-300 capitalize">{req.status}</td>
                <td className="p-2 border border-gray-300">{req.review_comments || "-"}</td>
                <td className="p-2 border border-gray-300">{req.updated_at ? new Date(req.updated_at).toLocaleString() : "-"}</td>
                <td className="p-2 border border-gray-300">{req.created_at ? new Date(req.created_at).toLocaleString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
