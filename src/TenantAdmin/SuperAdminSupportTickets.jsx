import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import supportTicketsApi from "../api/supportTicketsApi";
import { baseUrl } from "../constants/Constant";
import { getAuthToken } from "../utils/auth";
import toast from "react-hot-toast";
import socketService from "../services/socketService";

async function fetchTenantHospitals() {
  const url = `${baseUrl}/hospitals/tenant`;
  const r = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(getAuthToken() && { Authorization: `Bearer ${getAuthToken()}` }),
    },
  });
  if (!r.ok) throw new Error("Failed to load hospitals");
  return r.json();
}

export default function SuperAdminSupportTickets() {
  const user = useSelector((s) => s.auth.user);
  const tenantId = user?.tenant_id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [hospitalId, setHospitalId] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const hospitalsQuery = useQuery({
    queryKey: ["tenant-hospitals"],
    queryFn: () => fetchTenantHospitals(),
    enabled: !!tenantId,
  });

  const hospitals = useMemo(() => {
    const raw = hospitalsQuery.data;
    if (Array.isArray(raw)) return raw;
    if (raw?.hospitals) return raw.hospitals;
    return [];
  }, [hospitalsQuery.data]);

  const ticketsQuery = useQuery({
    queryKey: ["support-tickets", "superadmin", hospitalId, status, priority],
    queryFn: () =>
      supportTicketsApi.listTickets({
        hospitalId: hospitalId || undefined,
        status: status || undefined,
        priority: priority || undefined,
      }),
    enabled: !!tenantId,
  });

  const assigneesQuery = useQuery({
    queryKey: ["support-assignees"],
    queryFn: () => supportTicketsApi.listAssignableSuperadmins(),
    enabled: !!tenantId,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status: st }) =>
      supportTicketsApi.updateStatus(id, { status: st }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    const fn = () => {
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
    };
    window.addEventListener("support:new-ticket", fn);
    return () => window.removeEventListener("support:new-ticket", fn);
  }, [qc]);

  useEffect(() => {
    const s = socketService.getNotificationsSocket();
    if (!s) return undefined;
    const bump = () => qc.invalidateQueries({ queryKey: ["support-tickets"] });
    s.on("ticket_message", bump);
    s.on("ticket_updated", bump);
    return () => {
      s.off("ticket_message", bump);
      s.off("ticket_updated", bump);
    };
  }, [qc]);

  const assignMut = useMutation({
    mutationFn: ({ id, assignedToUserId, clearAssignment }) =>
      supportTicketsApi.assignTicket(id, { assignedToUserId, clearAssignment }),
    onSuccess: () => {
      toast.success("Assignment updated");
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const openChat = (id) => {
    navigate(`/dashboard/support-ticket/${id}`);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Support tickets</h2>

      <div className="flex flex-wrap gap-3 items-end bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Hospital
          </label>
          <select
            className="border border-gray-200 rounded-md px-3 py-2 text-sm min-w-[200px]"
            value={hospitalId}
            onChange={(e) => setHospitalId(e.target.value)}
          >
            <option value="">All hospitals</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name || h.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Status
          </label>
          <select
            className="border border-gray-200 rounded-md px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Any</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Priority
          </label>
          <select
            className="border border-gray-200 rounded-md px-3 py-2 text-sm"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="">Any</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      </div>

      {hospitalsQuery.isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      <div className="bg-white rounded-lg shadow border border-gray-100 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Priority</th>
              <th className="px-4 py-3 font-semibold">Assign</th>
              <th className="px-4 py-3 font-semibold">Status action</th>
              <th className="px-4 py-3 font-semibold">Chat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ticketsQuery.isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  <Loader2 className="h-6 w-6 animate-spin inline" />
                </td>
              </tr>
            )}
            {(ticketsQuery.data || []).map((t) => (
              <tr key={t.id} className="hover:bg-gray-50/80">
                <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">
                  {t.title}
                </td>
                <td className="px-4 py-3">{t.status}</td>
                <td className="px-4 py-3">{t.priority}</td>
                <td className="px-4 py-3">
                  <select
                    className="border border-gray-200 rounded px-2 py-1 text-xs max-w-[160px]"
                    value={t.assignedTo || ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) {
                        assignMut.mutate({
                          id: t.id,
                          clearAssignment: true,
                        });
                      } else {
                        assignMut.mutate({
                          id: t.id,
                          assignedToUserId: v,
                        });
                      }
                    }}
                  >
                    <option value="">Unassigned</option>
                    {(assigneesQuery.data || []).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    className="border border-gray-200 rounded px-2 py-1 text-xs"
                    value={t.status}
                    onChange={(e) =>
                      statusMut.mutate({ id: t.id, status: e.target.value })
                    }
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => openChat(t.id)}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!ticketsQuery.isLoading &&
          (!ticketsQuery.data || ticketsQuery.data.length === 0) && (
            <p className="text-center text-gray-500 py-10">No tickets</p>
          )}
      </div>
    </div>
  );
}
