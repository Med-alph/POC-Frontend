import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft, User, Stethoscope, Code2, CheckCircle2,
  Loader2, AlertTriangle, Building2, CreditCard,
  Calendar, FileText, ShieldCheck, Send,
} from 'lucide-react';
import medicalCodingAPI from '../api/medicalcodingapi';
import insuranceClaimsAPI from '../api/insuranceclaimsapi';
import toast from 'react-hot-toast';

// ─── Reusable collapsible section (mirrors CodingWorkspace pattern) ──────────
function InfoSection({ title, icon: Icon, children }) {
  return (
    <Card className="border border-slate-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 bg-white dark:bg-gray-950 border-b border-slate-50 dark:border-gray-800">
        <Icon className="h-4 w-4 text-violet-500" />
        <span className="font-bold text-slate-800 dark:text-white text-sm">{title}</span>
      </div>
      <CardContent className="px-5 pb-5 pt-4 bg-white dark:bg-gray-950">
        {children}
      </CardContent>
    </Card>
  );
}

// ─── Claim Status Badge ───────────────────────────────────────────────────────
function ClaimStatusBadge({ status }) {
  const config = {
    submitted: { label: 'Submitted', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    approved:  { label: 'Approved',  className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    denied:    { label: 'Denied',    className: 'bg-rose-50 text-rose-700 border-rose-200' },
    draft:     { label: 'Draft',     className: 'bg-slate-100 text-slate-500 border-slate-200' },
  };
  const cfg = config[status] || config.draft;
  return (
    <Badge className={`${cfg.className} font-semibold text-xs border`}>
      {cfg.label}
    </Badge>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────
function ClaimSuccessScreen({ claim, consultation, onBackToQueue }) {
  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6">
      {/* Success hero */}
      <div className="flex flex-col items-center text-center py-8 px-6 bg-white dark:bg-gray-950 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
        <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Claim Submitted</h2>
        <p className="text-sm text-slate-400 dark:text-gray-400">
          The claim has been prepared and submitted successfully.
        </p>
      </div>

      {/* Claim details card */}
      <Card className="border border-slate-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 bg-white dark:bg-gray-950 border-b border-slate-50 dark:border-gray-800">
          <FileText className="h-4 w-4 text-violet-500" />
          <span className="font-bold text-slate-800 dark:text-white text-sm">Claim Details</span>
        </div>
        <CardContent className="px-5 pb-5 pt-4 bg-white dark:bg-gray-950 space-y-4">
          {/* Claim number — prominent */}
          <div className="flex items-center justify-between p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-800">
            <div>
              <p className="text-xs text-violet-500 font-semibold uppercase tracking-wider mb-1">Claim Number</p>
              <p className="text-xl font-mono font-bold text-violet-700 dark:text-violet-300">
                {claim.claim_number}
              </p>
            </div>
            <ClaimStatusBadge status={claim.claim_status} />
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['Patient',      consultation?.patient?.patient_name],
              ['Doctor',       consultation?.staff?.staff_name],
              ['Insurance',    claim.insurance_company],
              ['Claim Type',             claim.claim_type === 'emergency' ? 'Emergency' : 'General'],
              ['Pre-Authorization',      claim.pre_authorization_required ? 'Yes' : 'No'],
              ['Policy No.',   claim.policy_number || '—'],
              ['Auth No.',     claim.authorization_number || '—'],
              ['Submitted On', claim.submitted_at ? new Date(claim.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
                <p className="font-semibold text-slate-800 dark:text-white">{val || '—'}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          className="flex-1 h-11 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-violet-200"
          onClick={onBackToQueue}
        >
          Back to Coding Queue
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ClaimPreparation() {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  // Data state
  const [consultation, setConsultation] = useState(null);
  const [existingClaim, setExistingClaim] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);

  // Form state
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [cardValidUntil, setCardValidUntil] = useState('');
  const [claimType, setClaimType] = useState('general');       // 'general' | 'emergency'
  const [preAuthRequired, setPreAuthRequired] = useState('no'); // 'yes' | 'no'
  const [authNumber, setAuthNumber] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submittedClaim, setSubmittedClaim] = useState(null); // non-null = show success screen
  // 'patient_record' = prefilled from registration data, 'manual' = user typed, null = empty
  const [prefillSource, setPrefillSource] = useState(null);

  // ─── Load consultation + check for existing claim ───────────────────────────
  const loadData = useCallback(async () => {
    if (!consultationId) return;
    try {
      setLoadingPage(true);
      const consData = await medicalCodingAPI.getConsultation(consultationId);
      setConsultation(consData);

      // Check if claim already submitted for this consultation
      try {
        const claim = await insuranceClaimsAPI.getClaimByConsultation(consultationId);
        if (claim?.id) {
          setExistingClaim(claim);
          setSubmittedClaim(claim); // show success screen directly
          return; // no need to prefill form — claim already done
        }
      } catch {
        // 404 is expected when no claim exists yet — not an error
      }

      // Prefill insurance details from patient registration if available.
      // Backend decrypts insurance_number transparently — we receive plaintext.
      const patientId = consData.patient?.id;
      if (patientId) {
        try {
          const defaults = await insuranceClaimsAPI.getPatientInsuranceDefaults(patientId);
          if (defaults?.insurance_provider || defaults?.insurance_number) {
            if (defaults.insurance_provider) setInsuranceCompany(String(defaults.insurance_provider));
            if (defaults.insurance_number)   setPolicyNumber(String(defaults.insurance_number));
            setPrefillSource('patient_record');
          }
        } catch {
          // Patient has no insurance on file — form stays empty, not an error
        }
      }
    } catch (err) {
      toast.error('Failed to load consultation data');
      console.error(err);
    } finally {
      setLoadingPage(false);
    }
  }, [consultationId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Card validity helper ───────────────────────────────────────────────────
  const isCardExpired = cardValidUntil && new Date(cardValidUntil) < new Date(new Date().toDateString());

  // ─── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!String(insuranceCompany ?? '').trim()) {
      errs.insuranceCompany = 'Insurance company is required';
    }
    if (preAuthRequired === 'yes' && !String(authNumber ?? '').trim()) {
      errs.authNumber = 'Authorization number is required when pre-authorization is selected';
    }
    return errs;
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    try {
      setSubmitting(true);
      const payload = {
        consultation_id: consultationId,
        patient_id: consultation.patient?.id,
        hospital_id: consultation.hospital_id || user?.hospital_id,
        submitted_by: user?.id,
        insurance_company: String(insuranceCompany ?? '').trim(),
        policy_number: String(policyNumber ?? '').trim() || null,
        card_valid_until: cardValidUntil || null,
        claim_type: claimType,
        pre_authorization_required: preAuthRequired === 'yes',
        authorization_number: preAuthRequired === 'yes' ? (String(authNumber ?? '').trim() || null) : null,
      };

      const result = await insuranceClaimsAPI.submitClaim(payload);
      setSubmittedClaim(result);
      toast.success('Claim submitted successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to submit claim');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (loadingPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 text-violet-600 animate-spin mb-4" />
        <p className="text-slate-600 dark:text-gray-400 font-semibold">Loading Insurance Claim Preparation...</p>
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

  // ─── Show success screen if claim already submitted ───────────────────────
  if (submittedClaim) {
    return (
      <ClaimSuccessScreen
        claim={submittedClaim}
        consultation={consultation}
        onBackToQueue={() => navigate('/medical-coding/queue')}
      />
    );
  }

  // ─── Extract coded data for preview ──────────────────────────────────────
  const codedDiagnoses = consultation.diagnoses || [];
  const codedProcedures = (consultation.procedures || []).filter((p) => p.cpt_code);

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
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Insurance Claim Preparation</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              CON-{consultation.id.slice(0, 8).toUpperCase()} •{' '}
              {new Date(consultation.consultation_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-xs border">
          Coded ✓
        </Badge>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* LEFT — Read-only clinical summary */}
        <div className="space-y-4">
          {/* Patient + Consultation info */}
          <InfoSection title="Patient & Consultation" icon={User}>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Patient',  consultation.patient?.patient_name],
                ['Gender',   consultation.patient?.gender],
                ['DOB',      consultation.patient?.dob ? new Date(consultation.patient.dob).toLocaleDateString() : '—'],
                ['Phone',    consultation.patient?.contact_info],
                ['Doctor',   consultation.staff?.staff_name],
                ['Date',     new Date(consultation.consultation_date).toLocaleDateString()],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
                  <p className="font-semibold text-slate-800 dark:text-white text-sm">{val || '—'}</p>
                </div>
              ))}
            </div>
          </InfoSection>

          {/* ICD Codes */}
          <InfoSection title={`ICD-10 Diagnosis Codes (${codedDiagnoses.length})`} icon={Code2}>
            {codedDiagnoses.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No ICD codes attached.</p>
            ) : (
              <div className="space-y-2">
                {codedDiagnoses.map((d, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800">
                    <span className="font-mono font-bold text-xs text-violet-700 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 rounded flex-shrink-0">
                      {d.icd_code}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-gray-300 truncate">
                      {d.icd_code_description_snapshot}
                    </span>
                    {idx === 0 && (
                      <span className="ml-auto text-[10px] text-slate-400 flex-shrink-0">Primary</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </InfoSection>

          {/* CPT Codes */}
          <InfoSection title={`CPT Procedure Codes (${codedProcedures.length})`} icon={Stethoscope}>
            {codedProcedures.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No CPT codes attached.</p>
            ) : (
              <div className="space-y-2">
                {codedProcedures.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50/40 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800">
                    <span className="font-mono font-bold text-xs text-indigo-700 dark:text-indigo-400 bg-indigo-100/60 dark:bg-indigo-900/30 px-2 py-0.5 rounded flex-shrink-0">
                      {p.cpt_code}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-gray-300 truncate">
                      {p.cpt_code_description_snapshot || p.procedure?.name || '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </InfoSection>
        </div>

        {/* RIGHT — Claim form */}
        <div className="space-y-4">
          <Card className="border border-slate-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 bg-white dark:bg-gray-950 border-b border-slate-50 dark:border-gray-800">
              <Building2 className="h-4 w-4 text-violet-500" />
              <span className="font-bold text-slate-800 dark:text-white text-sm">Insurance Information</span>
            </div>
            <CardContent className="px-5 pb-5 pt-5 bg-white dark:bg-gray-950 space-y-5">

              {/* Prefill notice — shown when insurance data was pulled from patient record */}
              {prefillSource === 'patient_record' && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                      Pre-filled from patient record
                    </p>
                    <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mt-0.5">
                      Insurance details were loaded from registration. Verify and edit if needed before submitting.
                    </p>
                  </div>
                </div>
              )}

              {/* Insurance Company */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                  Insurance Company <span className="text-rose-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. ABC Health Insurance"
                  value={insuranceCompany}
                  onChange={(e) => {
                    setInsuranceCompany(e.target.value);
                    setPrefillSource('manual');
                    if (errors.insuranceCompany) setErrors((prev) => ({ ...prev, insuranceCompany: null }));
                  }}
                  className={`rounded-xl bg-slate-50 dark:bg-gray-900 border text-sm focus-visible:ring-1 focus-visible:ring-violet-400 ${
                    errors.insuranceCompany ? 'border-rose-400 focus-visible:ring-rose-400' : 'border-slate-200 dark:border-gray-700'
                  }`}
                />
                {errors.insuranceCompany && (
                  <p className="text-xs text-rose-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {errors.insuranceCompany}
                  </p>
                )}
              </div>

              {/* Policy Number */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                  Policy / Insurance Number
                  <span className="ml-1.5 text-[10px] font-normal text-slate-400">(Optional)</span>
                </Label>
                <Input
                  placeholder="e.g. POL-458721"
                  value={policyNumber}
                  onChange={(e) => {
                    setPolicyNumber(e.target.value);
                    setPrefillSource('manual');
                  }}
                  className="rounded-xl bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-sm focus-visible:ring-1 focus-visible:ring-violet-400"
                />
              </div>

              {/* Card Validity */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                  Insurance Card Valid Until
                  <span className="ml-1.5 text-[10px] font-normal text-slate-400">(Optional)</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    type="date"
                    value={cardValidUntil}
                    onChange={(e) => setCardValidUntil(e.target.value)}
                    className={`pl-9 rounded-xl bg-slate-50 dark:bg-gray-900 border text-sm focus-visible:ring-1 focus-visible:ring-violet-400 ${
                      isCardExpired ? 'border-amber-400' : 'border-slate-200 dark:border-gray-700'
                    }`}
                  />
                </div>
                {isCardExpired && (
                  <p className="text-xs text-amber-600 flex items-center gap-1 font-semibold">
                    <AlertTriangle className="h-3 w-3" /> Insurance card has expired. Verify before submitting.
                  </p>
                )}
              </div>

              {/* Claim Type */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                  Claim Type <span className="text-rose-500">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'general',   label: 'General',   sub: 'Standard consultation or planned procedure' },
                    { value: 'emergency', label: 'Emergency', sub: 'Urgent / unplanned treatment' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setClaimType(opt.value)}
                      className={`flex flex-col items-start p-3.5 rounded-xl border-2 text-left transition-all duration-200 ${
                        claimType === opt.value
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-500'
                          : 'border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className={`flex items-center gap-2 mb-0.5 ${claimType === opt.value ? 'text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-gray-300'}`}>
                        <div className={`h-3.5 w-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          claimType === opt.value ? 'border-violet-600' : 'border-slate-300 dark:border-gray-600'
                        }`}>
                          {claimType === opt.value && (
                            <div className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                          )}
                        </div>
                        <span className="font-bold text-xs">{opt.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 ml-5">{opt.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 dark:border-gray-800" />

              {/* Pre-Authorization Required */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                  Pre-Authorization Required <span className="text-rose-500">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'yes', label: 'Yes', sub: 'Insurer approved in advance' },
                    { value: 'no',  label: 'No',  sub: 'No prior approval needed' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setPreAuthRequired(opt.value);
                        if (opt.value === 'no') {
                          setAuthNumber('');
                          setErrors((prev) => ({ ...prev, authNumber: null }));
                        }
                      }}
                      className={`flex flex-col items-start p-3.5 rounded-xl border-2 text-left transition-all duration-200 ${
                        preAuthRequired === opt.value
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-500'
                          : 'border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className={`flex items-center gap-2 mb-0.5 ${preAuthRequired === opt.value ? 'text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-gray-300'}`}>
                        <div className={`h-3.5 w-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          preAuthRequired === opt.value ? 'border-violet-600' : 'border-slate-300 dark:border-gray-600'
                        }`}>
                          {preAuthRequired === opt.value && (
                            <div className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                          )}
                        </div>
                        <span className="font-bold text-xs">{opt.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 ml-5">{opt.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Authorization Number — only visible when pre-auth = yes */}
              {preAuthRequired === 'yes' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                    Authorization Number <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      placeholder="e.g. AUTH-45891"
                      value={authNumber}
                      onChange={(e) => {
                        setAuthNumber(e.target.value);
                        if (errors.authNumber) setErrors((prev) => ({ ...prev, authNumber: null }));
                      }}
                      className={`pl-9 rounded-xl bg-slate-50 dark:bg-gray-900 border text-sm focus-visible:ring-1 focus-visible:ring-violet-400 ${
                        errors.authNumber ? 'border-rose-400 focus-visible:ring-rose-400' : 'border-slate-200 dark:border-gray-700'
                      }`}
                    />
                  </div>
                  {errors.authNumber && (
                    <p className="text-xs text-rose-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> {errors.authNumber}
                    </p>
                  )}
                </div>
              )}

              {/* Submit button */}
              <Button
                className="w-full h-11 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-violet-200 transition-all duration-300 mt-2"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting Claim...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" /> Submit Claim</>
                )}
              </Button>

              <p className="text-[10px] text-center text-slate-400 dark:text-gray-500">
                A claim number will be generated upon submission.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
