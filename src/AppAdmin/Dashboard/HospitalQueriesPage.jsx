import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listAppAdminSupportTickets } from '../../api/appAdminSupportTicketsApi';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';

function formatDt(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function HospitalQueriesPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  const filters = useMemo(
    () => ({
      ...(status && { status }),
      ...(priority && { priority }),
    }),
    [status, priority],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['app-admin', 'support-tickets', filters],
    queryFn: () => listAppAdminSupportTickets(filters),
  });

  const rows = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-sm text-gray-600 mt-1">
            Support tickets raised from hospitals across all tenants.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col text-xs font-medium text-gray-600">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </label>
          <label className="flex flex-col text-xs font-medium text-gray-600">
            Priority
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-[38px] rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : "Refresh"}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-x-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading tickets…
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-600">
            {error?.message || 'Failed to load tickets'}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No tickets yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hospital</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-gray-50/80"
                  onClick={() => navigate(`/queries/ticket/${row.id}`)}
                >
                  <TableCell className="font-medium text-gray-900">
                    <div>{row.hospitalName || '—'}</div>
                    {row.hospitalSubdomain && (
                      <div className="text-xs text-gray-500">{row.hospitalSubdomain}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-700">{row.tenantId ?? '—'}</TableCell>
                  <TableCell className="max-w-xs truncate text-gray-800" title={row.title}>
                    {row.title}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                      {row.status}
                    </span>
                  </TableCell>
                  <TableCell>{row.priority}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-gray-600">
                    {formatDt(row.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
