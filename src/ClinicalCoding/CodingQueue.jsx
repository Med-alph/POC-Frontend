import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ClipboardList, Search, User, Calendar, RefreshCw,
  ArrowRight, AlertTriangle, Clock, CheckCircle2, Code2, Hourglass
} from 'lucide-react';
import { useSelector } from 'react-redux';
import medicalCodingAPI from '../api/medicalcodingapi';
import toast from 'react-hot-toast';

const statusTabs = [
  { id: 'PENDING', label: 'Pending Coding', statuses: ['pending'] },
  { id: 'IN_PROGRESS', label: 'In Progress', statuses: ['in_progress'] },
  { id: 'CLARIFICATION', label: 'Needs Clarification', statuses: ['clarification_required'] },
  { id: 'RECODING', label: 'Pending Re-coding', statuses: ['pending_recoding'] },
  { id: 'CODED', label: 'Coded', statuses: ['coded'] },
  { id: 'ALL', label: 'All', statuses: [] },
];

const CODING_STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Hourglass,
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Clock,
  },
  clarification_required: {
    label: 'Needs Clarification',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: AlertTriangle,
  },
  pending_recoding: {
    label: 'Pending Re-coding',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: RefreshCw,
  },
  coded: {
    label: 'Coded',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  not_required: {
    label: 'Not Required',
    className: 'bg-slate-100 text-slate-500 border-slate-200',
    icon: ClipboardList,
  },
};

function CodingStatusBadge({ status }) {
  const config = CODING_STATUS_CONFIG[status] || CODING_STATUS_CONFIG.not_required;
  const Icon = config.icon;
  return (
    <Badge className={`${config.className} gap-1.5 font-semibold`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export default function CodingQueue() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const hospitalId = user?.hospital_id;

  const [consultations, setConsultations] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('PENDING');
  const [page, setPage] = useState(1);
  const limit = 30;

  const getStatusFilter = () => {
    const tab = statusTabs.find((t) => t.id === activeTab);
    return tab?.statuses[0] || '';
  };

  const fetchQueue = useCallback(
    async (showIndicator = false) => {
      if (!hospitalId) return;
      try {
        if (showIndicator) setRefreshing(true);
        else setLoading(true);

        const statusFilter = getStatusFilter();
        const res = await medicalCodingAPI.getQueue(hospitalId, statusFilter, page, limit);
        setConsultations(res.data || []);
        setTotal(res.total || 0);
      } catch (err) {
        console.error('Failed to load coding queue', err);
        toast.error('Failed to refresh coding queue');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [hospitalId, activeTab, page]
  );

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(() => fetchQueue(true), 60000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const filtered = consultations.filter((c) => {
    const name = c.patient?.patient_name || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="space-y-6">
      {/* Tabs + Search Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-950 p-4 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1 md:pb-0">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
                setLoading(true);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-violet-700 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-gray-800/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[280px]">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by patient name..."
            className="pl-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-slate-300 dark:bg-gray-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Queue Card */}
      <Card className="border border-slate-100 dark:border-gray-800 shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="bg-white dark:bg-gray-950 border-b border-slate-50 dark:border-gray-800 px-6 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <Code2 className="h-4 w-4 text-violet-500" />
            Medical Coding Queue
            {refreshing && (
              <span className="text-[10px] font-normal text-slate-400 animate-pulse ml-2">(Refreshing...)</span>
            )}
            {!loading && (
              <span className="ml-2 text-xs font-normal text-slate-400">
                {total} consultation{total !== 1 ? 's' : ''}
              </span>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 rounded-lg text-slate-500 hover:text-slate-800"
            onClick={() => fetchQueue(true)}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <RefreshCw className="h-8 w-8 text-violet-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-600 dark:text-gray-400">Loading coding queue...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-gray-950">
              <Code2 className="h-14 w-14 text-slate-200 dark:text-gray-800 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-gray-400 font-semibold text-sm">No consultations in this queue</p>
              <p className="text-xs text-slate-400 mt-1">
                Completed consultations will appear here awaiting ICD/CPT coding.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 dark:bg-gray-900/50 hover:bg-slate-50/50 border-b border-slate-100 dark:border-gray-800">
                  <TableHead className="font-bold text-slate-700 dark:text-gray-300 py-4 pl-6">
                    Consultation
                  </TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-gray-300 py-4">Patient</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-gray-300 py-4">Doctor</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-gray-300 py-4">Date</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-gray-300 py-4">Coding Status</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-gray-300 py-4 text-right pr-6">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow
                    key={c.id}
                    className="hover:bg-violet-50/30 dark:hover:bg-gray-900/40 transition-colors border-b border-slate-100 dark:border-gray-800"
                  >
                    <TableCell className="font-mono text-xs font-bold text-violet-600 dark:text-violet-400 pl-6 py-4">
                      CON-{c.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 text-sm">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {c.patient?.patient_name || '—'}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-gray-400 font-light mt-0.5 pl-5">
                          {c.patient?.gender || '—'} • {c.patient?.contact_info || 'No Phone'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-slate-600 dark:text-gray-300 text-xs font-medium">
                        {c.staff?.staff_name || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col text-xs text-slate-500 dark:text-gray-400">
                        <span className="font-medium">{new Date(c.consultation_date).toLocaleDateString()}</span>
                        {c.coding_status === 'pending_recoding' && (
                          <span className="text-[10px] text-rose-500 font-semibold mt-0.5">Doctor edited after coding</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <CodingStatusBadge status={c.coding_status} />
                    </TableCell>
                    <TableCell className="text-right pr-6 py-4">
                      <Button
                        size="sm"
                        className="h-8 px-3 rounded-lg text-xs font-semibold gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-sm shadow-violet-200 transition-all duration-300"
                        onClick={() => navigate(`/medical-coding/workspace/${c.id}`)}
                      >
                        <Code2 className="h-3.5 w-3.5" />
                        {c.coding_status === 'coded' ? 'View / Edit' : 'Open Workspace'}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-center gap-3 py-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg"
          >
            Previous
          </Button>
          <span className="text-sm text-slate-500">
            Page {page} of {Math.ceil(total / limit)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page * limit >= total}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
