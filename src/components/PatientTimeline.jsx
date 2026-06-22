import React, { useState, useEffect, useCallback } from 'react';
import consultationsAPI from '../api/consultationsapi';
import {
  Calendar, User, Stethoscope, Pill, FlaskConical, ChevronDown,
  ChevronUp, Clock, Code2, AlertTriangle, CheckCircle2, RefreshCw,
  Loader2, FileText, Activity, CalendarCheck, MessageSquare, Pencil,
} from 'lucide-react';

// ─── Coding status badge ──────────────────────────────────────────────────────
const CODING_STATUS = {
  pending:                { label: 'Pending Coding',      cls: 'bg-amber-50 text-amber-700 border-amber-200',    icon: Clock },
  in_progress:            { label: 'In Progress',         cls: 'bg-blue-50 text-blue-700 border-blue-200',       icon: Code2 },
  clarification_required: { label: 'Needs Clarification', cls: 'bg-orange-50 text-orange-700 border-orange-200', icon: AlertTriangle },
  pending_recoding:       { label: 'Pending Re-coding',   cls: 'bg-rose-50 text-rose-700 border-rose-200',       icon: RefreshCw },
  coded:                  { label: 'Coded ✓',             cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
};

function CodingBadge({ status }) {
  if (!status || status === 'not_required') return null;
  const cfg = CODING_STATUS[status];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  );
}

// ─── Format helpers ───────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtTime(t) {
  if (!t) return null;
  try {
    if (t.includes('T') || t.includes(' ')) {
      const d = new Date(t);
      return isNaN(d) ? null : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    const parts = t.split(':');
    if (parts.length >= 2) {
      const d = new Date();
      d.setHours(parseInt(parts[0], 10));
      d.setMinutes(parseInt(parts[1], 10));
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Single timeline card ─────────────────────────────────────────────────────
function TimelineCard({ consultation, mode, isExpanded, onToggle, isFirst, isCurrent }) {
  const c = consultation;
  const time = fmtTime(c.appointment?.appointment_time || c.consultation_start_time);
  const hasRx   = c.prescriptions?.length > 0;
  const hasLabs = c.lab_orders?.length > 0;
  const hasProc = c.procedures?.length > 0;
  const hasDx   = c.diagnoses?.length > 0;
  const isCoder = mode === 'coder';

  // brief summary line shown in collapsed state
  const summary = isCoder
    ? (hasDx ? c.diagnoses.slice(0, 2).map(d => d.icd_code).join(', ') : null)
    : (c.assessment || c.subjective || null);

  return (
    <div className={`relative flex gap-4 group ${isCurrent ? 'rounded-xl ring-2 ring-violet-300 ring-offset-1 bg-violet-50/30' : ''}`}>
      {/* Timeline spine + dot */}
      <div className="flex flex-col items-center flex-shrink-0 w-8">
        <div
          className={`w-3 h-3 rounded-full border-2 flex-shrink-0 mt-1 transition-colors
            ${isCurrent
              ? 'bg-violet-600 border-violet-600'
              : isFirst
                ? 'bg-indigo-600 border-indigo-600'
                : 'bg-white border-slate-300 group-hover:border-indigo-400'
            }`}
        />
        <div className="w-0.5 bg-slate-200 flex-1 mt-1" />
      </div>

      {/* Card body */}
      <div className="flex-1 pb-6 pt-1">
        {/* "Currently Open" pill — only in coder mode, shows which record is open in workspace */}
        {isCurrent && isCoder && (
          <div className="inline-flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-100 border border-violet-200 px-2 py-0.5 rounded-full">
              <Pencil className="h-2.5 w-2.5" />
              Currently Open
            </span>
            {/* Still show the actual coding status so there's no ambiguity */}
            <CodingBadge status={c.coding_status} />
          </div>
        )}

        {/* Collapsed header — always visible */}
        <button
          className="w-full text-left"
          onClick={onToggle}
          aria-expanded={isExpanded}
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            {/* Date + doctor */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-bold ${isCurrent ? 'text-violet-800' : 'text-slate-800'}`}>
                  {fmtDate(c.consultation_date)}
                </span>
                {time && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />{time}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <User className="h-3 w-3 flex-shrink-0" />
                {c.staff?.staff_name || 'Unknown Doctor'}
              </p>
            </div>

            {/* Right side: coding badge + expand icon */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Hide coding status badge on the currently-open card — "Currently Coding" pill already conveys the state */}
              {!isCurrent && <CodingBadge status={c.coding_status} />}
              {isExpanded
                ? <ChevronUp className="h-4 w-4 text-slate-400" />
                : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </div>
          </div>

          {/* Brief summary in collapsed state */}
          {!isExpanded && summary && (
            <p className="text-xs text-slate-500 mt-1.5 line-clamp-1 italic">
              {summary}
            </p>
          )}

          {/* Chip row in collapsed state */}
          {!isExpanded && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {hasDx && (
                <span className="text-[10px] bg-violet-50 text-violet-700 border border-violet-100 font-semibold px-2 py-0.5 rounded-full">
                  {c.diagnoses.length} dx
                </span>
              )}
              {!isCoder && hasRx && (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold px-2 py-0.5 rounded-full">
                  {c.prescriptions.length} rx
                </span>
              )}
              {hasProc && (
                <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold px-2 py-0.5 rounded-full">
                  {c.procedures.length} proc
                </span>
              )}
              {!isCoder && hasLabs && (
                <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-100 font-semibold px-2 py-0.5 rounded-full">
                  {c.lab_orders.length} labs
                </span>
              )}
            </div>
          )}
        </button>

        {/* ── Expanded content ── */}
        {isExpanded && (
          <div className="mt-3 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">

            {/* Diagnoses — shown in both modes */}
            {hasDx && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Diagnoses (ICD-10)
                </p>
                <div className="space-y-1">
                  {c.diagnoses.map((d, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="font-mono font-bold text-[10px] bg-violet-50 text-violet-700 border border-violet-100 px-1.5 py-0.5 rounded flex-shrink-0">
                        {d.icd_code}
                      </span>
                      <span className="text-xs text-slate-700 leading-relaxed">
                        {d.icd_code_description_snapshot}
                        {d.sequence === 1 && (
                          <span className="ml-1.5 text-[9px] font-bold text-emerald-600 uppercase">Primary</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Procedures — shown in both modes */}
            {hasProc && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Stethoscope className="h-3 w-3" /> Procedures
                </p>
                <div className="space-y-1">
                  {c.procedures.map((p, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5" />
                      <span>
                        {p.procedure?.name || p.procedure_name || 'Unnamed procedure'}
                        {p.cpt_code && (
                          <span className="ml-2 font-mono font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded">
                            CPT: {p.cpt_code}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clinical context (coder mode: condensed, not full SOAP) */}
            {isCoder && (c.assessment || c.subjective) && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Clinical Summary
                </p>
                {c.assessment && (
                  <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 leading-relaxed">
                    <span className="font-semibold text-slate-500">Assessment: </span>
                    {c.assessment}
                  </p>
                )}
                {!c.assessment && c.subjective && (
                  <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 leading-relaxed line-clamp-3">
                    {c.subjective}
                  </p>
                )}
              </div>
            )}

            {/* Coder mode: clarification comments if present */}
            {isCoder && c.coding_status === 'clarification_required' && c.coding_comments && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600 mb-1 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Clarification Note
                </p>
                <p className="text-xs text-orange-800 italic">"{c.coding_comments}"</p>
              </div>
            )}

            {/* Doctor mode only: full SOAP notes */}
            {!isCoder && (c.subjective || c.objective || c.assessment || c.plan) && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <FileText className="h-3 w-3" /> SOAP Notes
                </p>
                <div className="space-y-2">
                  {[
                    ['S', 'Subjective', c.subjective],
                    ['O', 'Objective',  c.objective],
                    ['A', 'Assessment', c.assessment],
                    ['P', 'Plan',       c.plan],
                  ].filter(([, , val]) => val).map(([abbr, , val]) => (
                    <div key={abbr} className="flex gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded bg-slate-100 text-slate-500 text-[10px] font-black flex items-center justify-center">
                        {abbr}
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Doctor mode only: prescriptions */}
            {!isCoder && hasRx && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Pill className="h-3 w-3" /> Prescriptions
                </p>
                <div className="space-y-1">
                  {c.prescriptions.map((rx, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" />
                      <span>
                        <span className="font-semibold">{rx.medicine_name}</span>
                        {(rx.dosage || rx.frequency || rx.duration) && (
                          <span className="text-slate-400">
                            {' — '}
                            {[rx.dosage, rx.frequency, rx.duration].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Doctor mode only: lab orders */}
            {!isCoder && hasLabs && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <FlaskConical className="h-3 w-3" /> Lab Orders
                </p>
                <div className="space-y-1">
                  {c.lab_orders.map((l, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0 mt-1.5" />
                      <span>{l.test_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Doctor mode only: follow-up indicator */}
            {!isCoder && c.is_follow_up_required && c.follow_up_appointment && (
              <div className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2 border border-indigo-100">
                <CalendarCheck className="h-3.5 w-3.5 flex-shrink-0" />
                Follow-up: {fmtDate(c.follow_up_appointment.appointment_date)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main PatientTimeline component ──────────────────────────────────────────
/**
 * @param {string}  patientId             — required
 * @param {'doctor'|'coder'} mode         — controls what fields are shown
 * @param {number}  [limit=15]            — initial load limit
 * @param {string}  [className]           — optional wrapper class
 * @param {string}  [currentConsultationId] — highlights this consultation with a
 *                                           "Currently Coding" badge instead of
 *                                           hiding it (replaces old excludeConsultationId)
 */
export default function PatientTimeline({
  patientId,
  mode = 'doctor',
  limit = 15,
  className = '',
  currentConsultationId,
}) {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState(null);

  const loadConsultations = useCallback(async (pageNum = 1) => {
    if (!patientId) return;
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await consultationsAPI.getByPatient(patientId);
      let all = Array.isArray(res) ? res : (res.consultations || []);

      // Sort newest first — never filter anything out
      all.sort((a, b) => new Date(b.consultation_date) - new Date(a.consultation_date));

      const end   = pageNum * limit;
      const slice = all.slice(0, end);

      setConsultations(slice);
      setHasMore(all.length > end);
      setError(null);
    } catch (err) {
      console.error('[PatientTimeline] Failed to load:', err);
      setError('Could not load patient history.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [patientId, limit]);

  useEffect(() => {
    setPage(1);
    setExpandedId(null);
    loadConsultations(1);
  }, [patientId, loadConsultations]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    loadConsultations(next);
  };

  const toggle = (id) => setExpandedId(prev => (prev === id ? null : id));

  // ── Render states ──
  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 gap-3 ${className}`}>
        <Loader2 className="h-7 w-7 text-indigo-500 animate-spin" />
        <p className="text-xs font-medium text-slate-400">Loading patient history…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-10 ${className}`}>
        <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
        <p className="text-sm text-slate-500">{error}</p>
        <button
          onClick={() => loadConsultations(1)}
          className="mt-3 text-xs text-indigo-600 hover:underline font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  if (consultations.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Calendar className="h-10 w-10 text-slate-200 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-400">No consultations found</p>
        <p className="text-xs text-slate-300 mt-1">History will appear here after the first completed visit.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {consultations.length} consultation{consultations.length !== 1 ? 's' : ''}
          {mode === 'coder' && (
            <span className="ml-2 text-[9px] font-bold bg-violet-50 text-violet-600 border border-violet-100 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
              Coding View
            </span>
          )}
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {consultations.map((c, idx) => (
          <TimelineCard
            key={c.id}
            consultation={c}
            mode={mode}
            isFirst={idx === 0}
            isCurrent={currentConsultationId ? c.id === currentConsultationId : false}
            isExpanded={expandedId === c.id}
            onToggle={() => toggle(c.id)}
          />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="text-center mt-2 pb-4">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-colors"
          >
            {loadingMore ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…</>
            ) : (
              <><ChevronDown className="h-3.5 w-3.5" /> Load older visits</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
