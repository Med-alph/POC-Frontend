import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, User, Stethoscope, ClipboardList, Code2,
  CheckCircle2, AlertTriangle, RefreshCw, Pill, FlaskConical,
  Search, X, Plus, Save, MessageSquare, ChevronDown, ChevronUp,
  Loader2, FileText, Info, Sparkles
} from 'lucide-react';
import medicalCodingAPI from '../api/medicalcodingapi';
import copilotAPI from '../api/copilotapi';
import toast from 'react-hot-toast';
import PatientTimeline from '../components/PatientTimeline';

// ─── Inline Code Search Component ───────────────────────────────────────────
function CodeSearch({ label, searchFn, onSelect, placeholder }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const runSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) { setResults([]); setOpen(false); return; }
    try {
      setLoading(true);
      const data = await searchFn(q.trim());
      setResults(Array.isArray(data) ? data : []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchFn]);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 350);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const handleSelect = (item) => {
    onSelect(item);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        {loading && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 animate-spin" />}
        <Input
          placeholder={placeholder || `Search ${label}...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-9 rounded-xl bg-slate-50 border border-slate-200 dark:bg-gray-900 dark:border-gray-700 text-sm focus-visible:ring-1 focus-visible:ring-violet-400"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 z-50 w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {results.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(item)}
              className="w-full text-left px-4 py-3 text-sm hover:bg-violet-50 dark:hover:bg-gray-800 transition-colors border-b border-slate-50 dark:border-gray-800 last:border-0"
            >
              <span className="font-bold text-violet-700 dark:text-violet-400 font-mono text-xs mr-2">
                {item.code}
              </span>
              <span className="text-slate-700 dark:text-gray-300">{item.description}</span>
            </button>
          ))}
        </div>
      )}
      {open && results.length === 0 && !loading && query.length >= 2 && (
        <div className="absolute top-full mt-1 z-50 w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl px-4 py-3 text-sm text-slate-400">
          No codes found for "{query}"
        </div>
      )}
    </div>
  );
}

// ─── Section Collapse ────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="border border-slate-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 bg-white dark:bg-gray-950 hover:bg-slate-50/50 dark:hover:bg-gray-900/30 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white text-sm">
          <Icon className="h-4 w-4 text-violet-500" />
          {title}
          {badge !== undefined && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
              {badge}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {open && <CardContent className="px-5 pb-5 pt-0 border-t border-slate-50 dark:border-gray-800 bg-white dark:bg-gray-950">{children}</CardContent>}
    </Card>
  );
}

const CODING_STATUS_LABELS = {
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  in_progress: { label: 'In Progress', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  clarification_required: { label: 'Needs Clarification', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  pending_recoding: { label: 'Pending Re-coding', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  coded: { label: 'Coded ✓', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

// ─── Main Workspace Component ─────────────────────────────────────────────
export default function CodingWorkspace() {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Left column tab — 'current' shows clinical summary, 'history' shows patient timeline
  const [leftTab, setLeftTab] = useState('current');

  // Working copies — coder edits these without touching read-only doctor data
  const [diagnoses, setDiagnoses] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [codingComments, setCodingComments] = useState('');
  const [targetStatus, setTargetStatus] = useState('in_progress');

  // AI ICD auto-suggestions
  const [pendingIcdSuggestions, setPendingIcdSuggestions] = useState([]);
  const [loadingAiSuggestions, setLoadingAiSuggestions] = useState(false);

  const loadConsultation = useCallback(async () => {
    if (!consultationId) return;
    try {
      setLoading(true);
      const data = await medicalCodingAPI.getConsultation(consultationId);
      setConsultation(data);
      // Pre-populate from existing coding data
      setDiagnoses(data.diagnoses || []);
      setProcedures(data.procedures || []);
      setCodingComments(data.coding_comments || '');
      // If already in_progress keep that status, otherwise set to in_progress
      if (['in_progress', 'clarification_required'].includes(data.coding_status)) {
        setTargetStatus(data.coding_status);
      } else if (data.coding_status === 'coded') {
        setTargetStatus('coded');
      } else {
        setTargetStatus('in_progress');
      }
    } catch (err) {
      toast.error('Failed to load consultation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [consultationId]);

  useEffect(() => { loadConsultation(); }, [loadConsultation]);

  // ─── Diagnosis Management ─────────────────────────────────────────────────
  const handleAddDiagnosis = (icdItem) => {
    const alreadyExists = diagnoses.some((d) => d.icd_code === icdItem.code);
    if (alreadyExists) { toast('This ICD code is already in the list.'); return; }
    setDiagnoses((prev) => [
      ...prev,
      {
        id: undefined, // new record — no id yet
        icd_code: icdItem.code,
        icd_code_description_snapshot: icdItem.description,
        sequence: prev.length + 1,
        notes: '',
      },
    ]);
  };

  const handleRemoveDiagnosis = (idx) => {
    setDiagnoses((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDiagnosisNotesChange = (idx, val) => {
    setDiagnoses((prev) => prev.map((d, i) => (i === idx ? { ...d, notes: val } : d)));
  };

  // ─── AI ICD Code Suggestions ──────────────────────────────────────────────
  const handleAiSuggestIcd = async () => {
    if (!consultation) return;

    const subjective = consultation.subjective || '';
    const objective = consultation.objective || '';
    const assessment = consultation.assessment || '';
    const plan = consultation.plan || '';

    const combinedText = `Subjective: ${subjective}
Objective: ${objective}
Assessment: ${assessment}
Plan: ${plan}`.trim();

    // Strip header strings to check if there is actual content
    const actualContent = combinedText.replace(/Subjective:|Objective:|Assessment:|Plan:/gi, '').replace(/\s/g, '');
    if (actualContent.length < 10) {
      toast.error("SOAP notes are too brief or not documented to suggest codes.");
      return;
    }

    try {
      setLoadingAiSuggestions(true);
      const result = await copilotAPI.analyseSoap(combinedText, consultation.id);
      
      if (result.icdSuggestions && result.icdSuggestions.length > 0) {
        const existingCodes = new Set(diagnoses.map(d => d.icd_code));
        const fresh = result.icdSuggestions
          .filter(s => !existingCodes.has(s.code))
          .map(s => ({
            icd_code: s.code,
            icd_code_description_snapshot: s.description,
            confidence: s.confidence || "medium",
            checked: true,
          }));
        
        if (fresh.length === 0) {
          toast.success("AI suggested codes that are already added.");
        } else {
          setPendingIcdSuggestions(fresh);
          toast.success(`Found ${fresh.length} suggested code(s).`);
        }
      } else {
        toast("AI did not suggest any new ICD codes for these SOAP notes.");
      }
    } catch (err) {
      console.error("Failed to fetch AI suggestions:", err);
      toast.error(err.message || "Failed to fetch AI suggestions");
    } finally {
      setLoadingAiSuggestions(false);
    }
  };

  const handleApplyIcdSuggestions = () => {
    const toAdd = pendingIcdSuggestions.filter(s => s.checked);
    if (toAdd.length === 0) {
      toast("No codes selected.");
      setPendingIcdSuggestions([]);
      return;
    }

    const existingCodes = new Set(diagnoses.map(d => d.icd_code));
    const fresh = toAdd.filter(s => !existingCodes.has(s.icd_code));

    if (fresh.length === 0) {
      toast("All selected codes are already in the diagnoses list.");
      setPendingIcdSuggestions([]);
      return;
    }

    const baseSequence = diagnoses.length;
    const newDiagnoses = fresh.map((s, idx) => ({
      id: undefined,
      icd_code: s.icd_code,
      icd_code_description_snapshot: s.icd_code_description_snapshot,
      sequence: baseSequence + idx + 1,
      notes: '',
    }));

    setDiagnoses(prev => [...prev, ...newDiagnoses]);
    setPendingIcdSuggestions([]);
    toast.success(`${fresh.length} code(s) added successfully.`);
  };

  // ─── Procedure CPT Management ─────────────────────────────────────────────
  const handleSetProcedureCpt = (procIdx, cptItem) => {
    setProcedures((prev) =>
      prev.map((p, i) =>
        i === procIdx
          ? { ...p, cpt_code: cptItem.code, cpt_code_description_snapshot: cptItem.description }
          : p
      )
    );
  };

  const handleClearProcedureCpt = (procIdx) => {
    setProcedures((prev) =>
      prev.map((p, i) =>
        i === procIdx ? { ...p, cpt_code: null, cpt_code_description_snapshot: null } : p
      )
    );
  };

  // ─── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async (status) => {
    const saveStatus = status || targetStatus;
    if (!saveStatus || saveStatus === 'pending') {
      toast.error('Please select a valid status before saving.');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        coding_status: saveStatus,
        coding_comments: codingComments,
        diagnoses: diagnoses.map((d, idx) => ({
          id: d.id || undefined,
          icd_code: d.icd_code,
          icd_code_description_snapshot: d.icd_code_description_snapshot,
          sequence: d.sequence || idx + 1,
          notes: d.notes,
        })),
        procedures: procedures
          .filter((p) => p.procedure_id)
          .map((p) => ({
            id: p.id,
            cpt_code: p.cpt_code || null,
            cpt_code_description_snapshot: p.cpt_code_description_snapshot || null,
          })),
      };

      await medicalCodingAPI.updateCoding(consultationId, payload);

      const label = saveStatus === 'coded' ? 'Consultation marked as Coded!' : `Status updated to "${saveStatus}"`;
      toast.success(label);
      await loadConsultation();

      if (saveStatus === 'coded') {
        setTimeout(() => navigate('/medical-coding/queue'), 1500);
      }
    } catch (err) {
      toast.error(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading State ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 text-violet-600 animate-spin mb-4" />
        <p className="text-slate-600 dark:text-gray-400 font-semibold">Loading consultation...</p>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-500">Consultation not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/medical-coding/queue')}>
          Back to Queue
        </Button>
      </div>
    );
  }

  const codingStatusConfig = CODING_STATUS_LABELS[consultation.coding_status] || CODING_STATUS_LABELS.pending;

  return (
    <div className="space-y-6 pb-16">
      {/* Back + Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="mt-0.5 h-8 w-8 p-0 rounded-lg"
            onClick={() => navigate('/medical-coding/queue')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Coding Workspace
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              CON-{consultation.id.slice(0, 8).toUpperCase()} •{' '}
              {new Date(consultation.consultation_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge className={`${codingStatusConfig.className} font-bold text-xs`}>
          {codingStatusConfig.label}
        </Badge>
      </div>

      {/* Re-coding Banner */}
      {consultation.coding_status === 'pending_recoding' && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
          <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-700 dark:text-rose-400 text-sm">Doctor Edited After Coding</p>
            <p className="text-xs text-rose-600 dark:text-rose-300 mt-0.5">
              The doctor has modified clinical data since you last coded this consultation. Please review and re-code.
            </p>
          </div>
        </div>
      )}

      {/* Clarification Banner */}
      {consultation.coding_status === 'clarification_required' && consultation.coding_comments && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <MessageSquare className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-700 dark:text-amber-400 text-sm">Clarification Request Pending</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">{consultation.coding_comments}</p>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LEFT — Read-only Clinical Summary */}
        <div className="space-y-4">
          {/* ── Left column tab switcher ── */}
          <div className="flex gap-1 bg-slate-100 dark:bg-gray-900 p-1 rounded-xl">
            {[
              { id: 'current', label: 'This Consultation' },
              { id: 'history', label: 'Patient History' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setLeftTab(tab.id)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  leftTab === tab.id
                    ? 'bg-white dark:bg-gray-800 text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Current consultation panel ── */}
          {leftTab === 'current' && (
            <>
          {/* Patient Info */}
          <Section title="Patient" icon={User}>
            <div className="grid grid-cols-2 gap-3 pt-3 text-sm">
              {[
                ['Name', consultation.patient?.patient_name],
                ['Gender', consultation.patient?.gender],
                ['DOB', consultation.patient?.dob ? new Date(consultation.patient.dob).toLocaleDateString() : '—'],
                ['Phone', consultation.patient?.contact_info],
                ['Doctor', consultation.staff?.staff_name],
                ['Date', new Date(consultation.consultation_date).toLocaleDateString()],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
                  <p className="font-semibold text-slate-800 dark:text-white text-sm">{val || '—'}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* SOAP Notes (read-only) */}
          <Section title="SOAP Notes (Read-only)" icon={ClipboardList} defaultOpen={false}>
            <div className="space-y-3 pt-3">
              {['subjective', 'objective', 'assessment', 'plan'].map((field) => (
                <div key={field}>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </p>
                  <p className="text-sm text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-gray-900 rounded-xl p-3 min-h-[40px] whitespace-pre-wrap">
                    {consultation[field] || <span className="text-slate-300 italic">Not recorded</span>}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* Prescriptions (read-only) */}
          {consultation.prescriptions?.length > 0 && (
            <Section title="Prescriptions" icon={Pill} badge={consultation.prescriptions.length} defaultOpen={false}>
              <div className="space-y-2 pt-3">
                {consultation.prescriptions.map((rx, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-gray-900">
                    <Pill className="h-3.5 w-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-slate-800 dark:text-white">{rx.medicine_name}</p>
                      <p className="text-slate-500">{rx.dosage} • {rx.frequency} • {rx.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Lab Orders (read-only) */}
          {consultation.lab_orders?.length > 0 && (
            <Section title="Lab Orders" icon={FlaskConical} badge={consultation.lab_orders.length} defaultOpen={false}>
              <div className="space-y-2 pt-3">
                {consultation.lab_orders.map((l, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-gray-900">
                    <FlaskConical className="h-3.5 w-3.5 text-cyan-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-slate-800 dark:text-white">{l.test_name}</p>
                      {l.instructions && <p className="text-slate-500">{l.instructions}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
            </>
          )}

          {/* ── Patient history timeline panel (coder mode) ── */}
          {leftTab === 'history' && consultation.patient?.id && (
            <div className="bg-white dark:bg-gray-950 border border-slate-100 dark:border-gray-800 rounded-2xl p-4">
              <PatientTimeline
                patientId={consultation.patient.id}
                mode="coder"
                limit={10}
                currentConsultationId={consultation.id}
              />
            </div>
          )}
          {leftTab === 'history' && !consultation.patient?.id && (
            <div className="text-center py-10 text-sm text-slate-400">
              Patient ID not available for history lookup.
            </div>
          )}
        </div>

        {/* RIGHT — Coding Panel */}
        <div className="space-y-4">
          {/* ICD Diagnosis Coding */}
          <Section title="ICD-10 Diagnosis Codes" icon={Code2} badge={diagnoses.length}>
            <div className="space-y-4 pt-3">
              {/* Search + AI Suggestion */}
              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex-1 min-w-0">
                  <CodeSearch
                    label="ICD Code"
                    searchFn={medicalCodingAPI.searchIcd}
                    onSelect={handleAddDiagnosis}
                    placeholder="Search ICD-10 codes or descriptions..."
                  />
                </div>
                <Button
                  onClick={handleAiSuggestIcd}
                  disabled={loadingAiSuggestions}
                  variant="outline"
                  className="rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800 flex items-center gap-2 h-10 px-4 flex-shrink-0"
                >
                  {loadingAiSuggestions ? (
                    <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-violet-500" />
                  )}
                  Suggest Codes (AI)
                </Button>
              </div>

              {/* AI-suggested ICD codes */}
              {pendingIcdSuggestions.length > 0 && (
                <div className="border border-violet-100 rounded-xl bg-violet-50/40 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-violet-500" />
                      <span className="text-sm font-semibold text-violet-800">
                        AI Suggested Codes
                      </span>
                      <span className="text-[10px] text-violet-500 font-medium">
                        ({pendingIcdSuggestions.filter(s => s.checked).length} selected)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPendingIcdSuggestions([])}
                        className="text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={handleApplyIcdSuggestions}
                        className="text-xs bg-violet-600 hover:bg-violet-700 text-white font-semibold px-3 py-1 rounded-lg transition-colors"
                      >
                        Add Selected
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-violet-600/70 mb-3">
                    Uncheck codes to exclude. Click "Add Selected" to add them to your diagnoses list.
                  </p>
                  <div className="space-y-2">
                    {pendingIcdSuggestions.map((suggestion, idx) => {
                      const confidenceConfig = {
                        high: { label: "HIGH", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
                        medium: { label: "MED", cls: "bg-amber-100 text-amber-700 border-amber-200" },
                        low: { label: "LOW", cls: "bg-gray-100 text-gray-500 border-gray-200" },
                      };
                      const conf = confidenceConfig[suggestion.confidence] || confidenceConfig.low;
                      return (
                        <label
                          key={suggestion.icd_code}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${suggestion.checked ? "bg-white border-violet-200 shadow-sm" : "bg-gray-50/60 border-gray-200 opacity-60"}`}
                        >
                          <input
                            type="checkbox"
                            checked={suggestion.checked}
                            onChange={() => {
                              setPendingIcdSuggestions(prev =>
                                prev.map((s, i) => i === idx ? { ...s, checked: !s.checked } : s)
                              );
                            }}
                            className="rounded border-gray-300 text-violet-600 focus:ring-violet-500 w-4 h-4 flex-shrink-0"
                          />
                          <span className="font-bold text-xs text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-100 whitespace-nowrap">
                            {suggestion.icd_code}
                          </span>
                          <span className="text-xs text-slate-700 dark:text-gray-300 font-medium flex-1 min-w-0 truncate">
                            {suggestion.icd_code_description_snapshot}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${conf.cls}`}>
                            {conf.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Coded Diagnoses List */}
              {diagnoses.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 dark:bg-gray-900 rounded-xl">
                  <Code2 className="h-8 w-8 text-slate-200 dark:text-gray-800 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No ICD codes added yet. Search above to add codes.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {diagnoses.map((d, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-mono font-bold text-xs text-violet-700 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 rounded-lg flex-shrink-0">
                            {d.icd_code}
                          </span>
                          <span className="text-xs text-slate-700 dark:text-gray-300 truncate">
                            {d.icd_code_description_snapshot}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveDiagnosis(idx)}
                          className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-all flex-shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-2">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                          {idx === 0 ? 'Primary' : `Secondary ${idx}`} •
                        </span>
                        <input
                          type="text"
                          placeholder="Coding notes (optional)"
                          value={d.notes || ''}
                          onChange={(e) => handleDiagnosisNotesChange(idx, e.target.value)}
                          className="ml-2 text-xs text-slate-600 dark:text-gray-400 bg-transparent border-b border-dashed border-slate-300 dark:border-gray-600 focus:outline-none focus:border-violet-500 w-40"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {/* CPT Procedure Coding */}
          {consultation.procedures?.length > 0 && (
            <Section title="CPT Procedure Codes" icon={Stethoscope} badge={consultation.procedures.length}>
              <div className="space-y-4 pt-3">
                {procedures.map((proc, procIdx) => (
                  <div
                    key={procIdx}
                    className="p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800"
                  >
                    <p className="font-semibold text-sm text-slate-800 dark:text-white mb-1">
                      {proc.procedure?.name || `Procedure ${procIdx + 1}`}
                    </p>
                    {proc.doctor_notes && (
                      <p className="text-xs text-slate-400 mb-3">Doctor notes: {proc.doctor_notes}</p>
                    )}
                    {proc.cpt_code ? (
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-indigo-100/60 dark:bg-indigo-900/30">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-indigo-700 dark:text-indigo-400 bg-indigo-200/60 dark:bg-indigo-900/50 px-2 py-0.5 rounded-md">
                            {proc.cpt_code}
                          </span>
                          <span className="text-xs text-slate-600 dark:text-gray-400 truncate max-w-[200px]">
                            {proc.cpt_code_description_snapshot}
                          </span>
                        </div>
                        <button
                          onClick={() => handleClearProcedureCpt(procIdx)}
                          className="text-rose-400 hover:text-rose-600 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <CodeSearch
                        label="CPT Code"
                        searchFn={medicalCodingAPI.searchCpt}
                        onSelect={(item) => handleSetProcedureCpt(procIdx, item)}
                        placeholder="Search CPT codes..."
                      />
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Coding Comments */}
          <Section title="Comments to Doctor" icon={MessageSquare}>
            <div className="pt-3">
              <Textarea
                placeholder="Add clarification request or coding notes for the doctor..."
                value={codingComments}
                onChange={(e) => setCodingComments(e.target.value)}
                rows={3}
                className="rounded-xl text-sm bg-slate-50 dark:bg-gray-900 border-slate-200 dark:border-gray-700 resize-none focus-visible:ring-1 focus-visible:ring-violet-400"
              />
            </div>
          </Section>

          {/* Action Panel */}
          <Card className="border border-slate-100 dark:border-gray-800 rounded-2xl shadow-sm">
            <CardContent className="p-5 space-y-4">
              <p className="text-xs font-bold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                Update Coding Status
              </p>

              {/* Status Selection */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'in_progress', label: 'In Progress', color: 'border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700' },
                  { value: 'clarification_required', label: 'Need Clarification', color: 'border-orange-300 text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700' },
                  { value: 'coded', label: 'Mark as Coded', color: 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTargetStatus(opt.value)}
                    className={`px-3 py-2.5 rounded-xl border-2 text-xs font-bold transition-all duration-200 ${
                      targetStatus === opt.value
                        ? opt.color + ' ring-2 ring-offset-1 ring-current/30 scale-[1.02]'
                        : 'border-slate-200 text-slate-500 dark:border-gray-700 dark:text-gray-500 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Validation hint for coded status */}
              {targetStatus === 'coded' && diagnoses.length === 0 && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                  <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    No ICD codes have been added. Consider adding at least one diagnosis code before marking as Coded.
                  </p>
                </div>
              )}

              {/* Save Button */}
              <Button
                className="w-full h-11 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-violet-200 transition-all duration-300"
                disabled={saving}
                onClick={() => handleSave(targetStatus)}
              >
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
                ) : targetStatus === 'coded' ? (
                  <><CheckCircle2 className="h-4 w-4 mr-2" /> Save & Mark as Coded</>
                ) : targetStatus === 'clarification_required' ? (
                  <><AlertTriangle className="h-4 w-4 mr-2" /> Send Clarification to Doctor</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Save Progress</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Audit / Coding History */}
          {consultation.coding_completed_at && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                Coded on {new Date(consultation.coding_completed_at).toLocaleString()} by{' '}
                {consultation.coding_completed_by_staff?.staff_name || 'Medical Coder'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
