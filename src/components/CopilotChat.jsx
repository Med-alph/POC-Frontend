import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Sparkles, X, Search, User, AlertCircle, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import copilotAPI from '@/api/copilotapi';
import { patientsAPI } from '@/api/patientsapi';
import { appointmentsAPI } from '@/api/appointmentsapi';
import { detectCopilotIntent } from '@/utils/copilotIntentDetection';

/**
 * AIVisitComparisonPanel - Specialized view for visit comparison insights
 */
const AIVisitComparisonPanel = ({ insights, suggestedActions, onActionClick }) => {
  if (!insights) return null;

  const { clinical_summary, key_changes, documentation_gaps, clinical_trend } = insights;

  const parseCurrentPreviousList = (items = []) => {
    return items.map((text) => {
      const parts = text.split(';').map((p) => p.trim());
      const current = parts.find((p) => p.toLowerCase().startsWith('current'));
      const previous = parts.find((p) => p.toLowerCase().startsWith('previous'));
      return { raw: text, current, previous };
    });
  };

  const symptomChanges = parseCurrentPreviousList(key_changes?.symptoms || []);
  const vitalChanges = parseCurrentPreviousList(key_changes?.vitals || []);
  const medicationChanges = parseCurrentPreviousList(key_changes?.medications || []);
  const investigationChanges = parseCurrentPreviousList(key_changes?.investigations || []);

  const trend = (clinical_trend || 'unclear').toLowerCase();
  const trendConfig = {
    persistent: {
      wrapper: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
      dot: 'bg-orange-500'
    },
    improving: {
      wrapper: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:border-green-800',
      dot: 'bg-green-500'
    },
    worsening: {
      wrapper: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-800',
      dot: 'bg-red-500'
    },
    unclear: {
      wrapper: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800',
      dot: 'bg-gray-400'
    },
  };
  const trendStyle = trendConfig[trend] || trendConfig.unclear;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      {/* Clinical Summary Section */}
      {clinical_summary && (
        <div className="relative group">
          <div className="absolute -left-3 top-0 bottom-0 w-1 bg-indigo-500 rounded-full" />
          <div className="pl-1">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
              Clinical Summary
            </h4>
            <p className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed font-medium">
              {clinical_summary}
            </p>
          </div>
        </div>
      )}

      {/* Changes Table-like View */}
      {(symptomChanges.length || vitalChanges.length || medicationChanges.length || investigationChanges.length) && (
        <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
          <div className="bg-gray-50/50 dark:bg-gray-900/30 px-3 py-2 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Visit Comparison Insights</span>
          </div>
          
          <div className="p-3 space-y-4">
            {/* Categorized Changes */}
            {[
              { label: 'Symptoms', data: symptomChanges, icon: '📋' },
              { label: 'Vital Signs', data: vitalChanges, icon: '🫀' },
              { label: 'Medications', data: medicationChanges, icon: '💊' },
              { label: 'Investigations', data: investigationChanges, icon: '🔬' }
            ].map((section, sidx) => section.data.length > 0 && (
              <div key={sidx} className="space-y-1.5">
                <div className="flex items-center gap-1.5 px-1">
                  <span className="text-xs">{section.icon}</span>
                  <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">{section.label}</span>
                </div>
                <div className="grid gap-1.5">
                  {section.data.map((item, idx) => (
                    <div key={idx} className="bg-gray-50/30 dark:bg-gray-900/10 rounded-lg p-2 border border-gray-100/50 dark:border-gray-700/50">
                      {item.current && (
                        <div className="flex gap-2 items-baseline">
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 w-12 shrink-0">Current:</span>
                          <span className="text-xs text-gray-900 dark:text-gray-100">{item.current.replace(/^current:\s*/i, '')}</span>
                        </div>
                      )}
                      {item.previous && (
                        <div className="flex gap-2 items-baseline mt-1 opacity-80 border-t border-gray-100/50 dark:border-gray-700/50 pt-1">
                          <span className="text-[10px] font-bold text-gray-500 w-12 shrink-0">Previous:</span>
                          <span className="text-xs text-gray-600 dark:text-gray-400 italic font-medium">{item.previous.replace(/^previous:\s*/i, '')}</span>
                        </div>
                      )}
                      {!item.current && !item.previous && (
                        <p className="text-xs text-gray-700 dark:text-gray-300">• {item.raw}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footnotes: Gaps and Trend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {documentation_gaps?.length > 0 && (
          <div className="flex-1">
            <div className="flex flex-wrap gap-1.5">
              {documentation_gaps.map((gap, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] md:text-[11px] font-bold text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300"
                >
                  <AlertCircle className="w-3 h-3" />
                  {gap.replace(/^missing\s*/i, 'Missing ')}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold shadow-sm ${trendStyle.wrapper}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${trendStyle.dot} animate-pulse`} />
          Trend: {trend.charAt(0).toUpperCase() + trend.slice(1)}
        </div>
      </div>

      {/* Actionable Suggestions */}
      {suggestedActions && suggestedActions.length > 0 && (
        <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
          <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Suggested Next Steps</h5>
          <div className="grid grid-cols-1 gap-3">
            {suggestedActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => onActionClick(action)}
                className="w-full min-h-[72px] relative flex items-center gap-4 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-white dark:bg-gray-800/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm hover:shadow transition-all group overflow-hidden"
              >
                {/* Plus Icon Container */}
                <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                  <Plus className="w-5 h-5" />
                </div>
                
                {/* Text Container */}
                <div className="flex-1 min-w-0 text-left py-0.5">
                  <p className="text-[14px] font-bold text-indigo-950 dark:text-indigo-100 leading-snug">
                    {action.label}
                  </p>
                  {action.description && (
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5 leading-normal font-medium">
                      {action.description}
                    </p>
                  )}
                </div>
                
                {/* Arrow Icon */}
                <div className="shrink-0 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-md">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * CopilotChat - Patient-scoped clinical copilot chat component
 */
const CopilotChat = ({ patientId: routePatientId, visitId = null, isOpen, onClose }) => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [selectedPatientId, setSelectedPatientId] = useState(routePatientId || null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [allPatients, setAllPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  // Use selected patient or route patient
  const activePatientId = selectedPatientId || routePatientId;

  // Update selected patient when route patient changes
  useEffect(() => {
    if (routePatientId && routePatientId !== selectedPatientId) {
      setSelectedPatientId(routePatientId);
      setShowPatientSelector(false);
    }
  }, [routePatientId]);

  // Fetch selected patient details
  useEffect(() => {
    const fetchPatientDetails = async () => {
      if (activePatientId) {
        try {
          const patient = await patientsAPI.getById(activePatientId);
          setSelectedPatient(patient);
          setShowPatientSelector(false);
        } catch (error) {
          console.error('Failed to fetch patient details:', error);
        }
      } else {
        setSelectedPatient(null);
      }
    };
    fetchPatientDetails();
  }, [activePatientId]);

  // Fetch all patients on mount
  useEffect(() => {
    if (isOpen && !activePatientId) {
      fetchAllPatients();
    }
  }, [isOpen, activePatientId]);

  // Show patient selector if no patient is selected when chat opens
  useEffect(() => {
    if (isOpen && !activePatientId) {
      setShowPatientSelector(true);
      setMessages([]);
    } else if (isOpen && activePatientId && messages.length === 0) {
      setShowPatientSelector(false);
    }
  }, [isOpen, activePatientId]);

  const fetchAllPatients = async () => {
    try {
      setLoadingPatients(true);
      const [patientsRes, todayRes, upcomingRes] = await Promise.all([
        patientsAPI.getAll({ limit: 1000, offset: 0 }),
        appointmentsAPI.getTodaysAppointments().catch(e => { console.error('today e:', e); return { data: [] } }),
        appointmentsAPI.getUpcomingAppointments().catch(e => { console.error('upcoming e:', e); return { data: [] } })
      ]);
      
      const pData = patientsRes.data || [];
      
      const extractList = (res) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.appointments)) return res.appointments;
        return [];
      };

      const todayList = extractList(todayRes);
      const upcomingList = extractList(upcomingRes);
      
      console.log('=== Copilot Chat Debug ===');
      console.log('Today Res:', todayRes);
      console.log('Upcoming Res:', upcomingRes);
      console.log('Today List length:', todayList.length);
      console.log('Upcoming List length:', upcomingList.length);
      
      let allAppts = [...todayList, ...upcomingList];
      
      const apptPatientIds = new Set(allAppts.map(a => a.patient_id || (a.patient && a.patient.id)).filter(Boolean));
      
      console.log('Extracted patient IDs from appointments:', Array.from(apptPatientIds));
      
      const suggested = pData.filter(p => apptPatientIds.has(p.id)).map(p => ({...p, isSuggested: true}));
      const others = pData.filter(p => !apptPatientIds.has(p.id));
      
      console.log('Total suggested patients matched:', suggested.length);
      console.log('==========================');
      
      setAllPatients([...suggested, ...others]);
    } catch (error) {
      console.error('Failed to load patients for Copilot Chat:', error);
      setAllPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  // Filter patients based on search (client-side filtering like CopilotPage)
  const filteredPatients = allPatients.filter(p =>
    p.patient_name?.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    p.patient_code?.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    p.contact_info?.includes(patientSearchTerm)
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatInsights = (insights, intent = null) => {
    if (!insights) return '';
    
    let formatted = '';
    
    // For visit_comparison we render a rich panel instead of long text,
    // so we skip text formatting here and let the UI component handle it.
    if (intent === 'visit_comparison') {
      return '';
    }
    
    // Handle other intents (existing logic)
    if (insights.summary) {
      formatted += insights.summary + '\n\n';
    }
    
    // Handle data_retrieval intent structure
    if (insights.labResults && Array.isArray(insights.labResults)) {
      formatted += 'Lab Results:\n';
      insights.labResults.forEach(lab => {
        formatted += `• ${lab.test}: ${lab.result}`;
        if (lab.date && lab.date !== 'Not available') {
          formatted += ` (${lab.date})`;
        }
        formatted += '\n';
      });
      formatted += '\n';
    }
    
    if (insights.medications && Array.isArray(insights.medications)) {
      formatted += 'Medications:\n';
      insights.medications.forEach(med => {
        formatted += `• ${med.name} - ${med.status}`;
        if (med.dose) {
          formatted += ` (${med.dose})`;
        }
        formatted += '\n';
      });
      formatted += '\n';
    }
    
    if (insights.allergies && Array.isArray(insights.allergies)) {
      formatted += 'Allergies:\n';
      insights.allergies.forEach(allergy => {
        formatted += `• ${allergy}\n`;
      });
      formatted += '\n';
    }
    
    if (insights.vitalSigns) {
      formatted += 'Vital Signs:\n';
      const vitals = insights.vitalSigns;
      if (vitals.bp && vitals.bp !== 'Not available') {
        formatted += `• Blood Pressure: ${vitals.bp}\n`;
      }
      if (vitals.temp && vitals.temp !== 'Not available') {
        formatted += `• Temperature: ${vitals.temp}\n`;
      }
      if (vitals.pulse && vitals.pulse !== 'Not available') {
        formatted += `• Pulse: ${vitals.pulse}\n`;
      }
      if (vitals.date && vitals.date !== 'Not available') {
        formatted += `• Date: ${vitals.date}\n`;
      }
      formatted += '\n';
    }
    
    if (insights.otherData && Array.isArray(insights.otherData)) {
      insights.otherData.forEach(item => {
        formatted += `${item}\n`;
      });
      formatted += '\n';
    }
    
    // Handle patient_summary intent structure
    if (insights.keyFindings && Array.isArray(insights.keyFindings)) {
      formatted += 'Key Findings:\n';
      insights.keyFindings.forEach(finding => {
        formatted += `• ${finding}\n`;
      });
      formatted += '\n';
    }
    
    if (insights.activeConcerns && Array.isArray(insights.activeConcerns)) {
      formatted += 'Active Concerns:\n';
      insights.activeConcerns.forEach(concern => {
        formatted += `• ${concern}\n`;
      });
      formatted += '\n';
    }
    
    if (insights.medicationStatus) {
      formatted += `Medication Status: ${insights.medicationStatus}\n\n`;
    }
    
    if (insights.labStatus) {
      formatted += `Lab Status: ${insights.labStatus}\n`;
    }
    
    return formatted.trim();
  };

  const handlePatientSelect = (patientId) => {
    setSelectedPatientId(patientId);
    setShowPatientSelector(false);
    setPatientSearchTerm('');
    setMessages([]);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !activePatientId || !user?.id || loading) return;

    const userMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    };

    const typingMessage = {
      role: 'system',
      content: 'typing',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage, typingMessage]);
    setInputValue('');
    setLoading(true);

    try {
      // Detect intent hint (non-authoritative, backend has final say)
      const intentHint = detectCopilotIntent(inputValue.trim());
      
      const response = await copilotAPI.sendChatMessage(
        activePatientId,
        user.id,
        inputValue.trim(),
        visitId,
        intentHint
      );

      // Remove typing indicator
      setMessages(prev => prev.filter(m => m.content !== 'typing'));

      // Format response
      let assistantContent = '';
      let suggestedActions = null;

      let intent = response.intent || intentHint;

      if (response.insights) {
        assistantContent = formatInsights(response.insights, intent);
      } else if (response.message) {
        assistantContent = response.message;
      } else {
        assistantContent = 'I couldn\'t generate insights safely from available data.';
      }

      if (response.suggestedActions && response.suggestedActions.length > 0) {
        // Show all suggested actions for richer UI
        suggestedActions = response.suggestedActions;
      }

      // Filter out non-clinical generic warnings (e.g. prescription disclaimers)
      let insightsForMessage = response.insights;
      if (insightsForMessage?.warnings && Array.isArray(insightsForMessage.warnings)) {
        insightsForMessage = {
          ...insightsForMessage,
          warnings: insightsForMessage.warnings.filter(
            (w) =>
              !w.toLowerCase().includes('prescription suggestions') &&
              !w.toLowerCase().includes('review carefully')
          ),
        };
      }

      const assistantMessage = {
        role: 'assistant',
        content: assistantContent,
        intent,
        insights: insightsForMessage,
        suggestedActions,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Copilot chat error:', error);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(m => m.content !== 'typing'));

      // Add error message
      const errorMessage = {
        role: 'assistant',
        content: 'I couldn\'t generate insights safely from available data.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };


  const handleActionClick = (action) => {
    if (!activePatientId) return;
    
    // Handle action types with navigation
    const actionType = action.type;
    const patientRecordPath = `/doctor-patient-record/${activePatientId}`;
    
    // Map action types to tab names
    const tabMap = {
      'review_labs': 'Lab Results',
      'review_medications': 'Medications',
      'review_allergies': 'Allergies & Notes',
      'review_insights': 'Appointments', // Default tab
      'review_medication_changes': 'Medications', // Visit comparison action
      'review_lab_changes': 'Lab Results', // Visit comparison action
      'record_vitals': 'Vitals',
      'add_followup_plan': 'Appointments',
      'complete_exam': 'Appointments',
      'view_imaging_orders': 'Investigations',
    };
    
    const targetTab = tabMap[actionType];
    
    if (targetTab) {
      // Navigate with state to set the active tab
      navigate(patientRecordPath, { 
        state: { activeTab: targetTab } 
      });
      // Close chat when navigating
      onClose();
    } else {
      // Fallback to metadata route if provided
      if (action.metadata?.route) {
        navigate(action.metadata.route);
        onClose();
      } else if (action.metadata?.modal) {
        console.log('Open modal:', action.metadata.modal);
      }
    }
  };

  if (!isOpen) return null;

  const isDisabled = !activePatientId || !user?.id;

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/50 z-40 sm:hidden transition-opacity"
        onClick={onClose}
      />
      
      {/* Chat Container */}
      <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full h-[85vh] sm:w-[400px] sm:h-[600px] sm:max-h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 border sm:border-gray-200 sm:dark:border-gray-700 rounded-t-3xl sm:rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
              Clinical Copilot
            </h3>
            {selectedPatient && (
              <button 
                onClick={() => {
                  setShowPatientSelector(true);
                  if (!allPatients.length) fetchAllPatients();
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 truncate hover:underline text-left block w-full"
              >
                {selectedPatient.patient_name} (Switch)
              </button>
            )}
          </div>
        </div>
        {!activePatientId && (
          <button
            onClick={() => {
              setShowPatientSelector(true);
              if (!allPatients.length) fetchAllPatients();
            }}
            className="text-xs md:text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-2 py-1 rounded transition-colors"
          >
            Select Patient
          </button>
        )}
        <button
          onClick={onClose}
          className="p-1.5 md:p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
          aria-label="Close chat"
        >
          <X className="h-5 w-5 md:h-4 md:w-4 text-gray-500 dark:text-gray-400" />
        </button>
        </div>

        {/* Patient Selector */}
        {showPatientSelector && (
          <div className="flex-1 overflow-y-auto p-3 md:p-4 min-h-0">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Search & Select Patient
                  </label>
                  {activePatientId && (
                    <button 
                      onClick={() => setShowPatientSelector(false)}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                
                {loadingPatients ? (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading patients...</span>
                  </div>
                ) : (
                  <>
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search by name, ID, or phone..."
                        value={patientSearchTerm}
                        onChange={(e) => setPatientSearchTerm(e.target.value)}
                        className="pl-10 text-sm"
                      />
                    </div>

                    {/* Show search results or suggested patients */}
                    {(patientSearchTerm || (!patientSearchTerm && allPatients.some(p => p.isSuggested))) && (
                      <div className="mt-3 max-h-96 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-900">
                        {!patientSearchTerm && (
                           <div className="py-2 px-3 text-xs md:text-sm font-semibold text-indigo-700 dark:text-indigo-400 border-b border-gray-200 dark:border-gray-700 mb-2">
                             Suggested Patients (Upcoming/Today's Appointments)
                           </div>
                        )}
                        {patientSearchTerm && filteredPatients.length === 0 ? (
                          <div className="text-center py-8">
                            <User className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No patients found matching "{patientSearchTerm}"
                            </p>
                          </div>
                        ) : (
                          (patientSearchTerm ? filteredPatients : allPatients.filter(p => p.isSuggested)).map((patient) => (
                            <button
                              key={patient.id}
                              onClick={() => handlePatientSelect(patient.id)}
                              className={`w-full text-left p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                                selectedPatientId === patient.id
                                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-600'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                  {patient.patient_name?.charAt(0).toUpperCase() || 'P'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                    {patient.patient_name} {patient.isSuggested && !patientSearchTerm && <span className="ml-2 text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium">Recommended</span>}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                    <span className="truncate">ID: {patient.patient_code || patient.id.slice(0, 8)}</span>
                                    {patient.contact_info && (
                                      <>
                                        <span>•</span>
                                        <span>{patient.contact_info}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {selectedPatientId === patient.id && (
                                  <div className="flex-shrink-0">
                                    <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}

                    {/* Show instruction when no search and no recommended */}
                    {!patientSearchTerm && !allPatients.some(p => p.isSuggested) && (
                      <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
                        <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        Start typing to search for a patient
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {!showPatientSelector && (
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 min-h-0"
        >
          {messages.length === 0 && activePatientId && (
            <div className="text-center py-8">
              <Sparkles className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ask me anything about this patient
              </p>
            </div>
          )}
          {messages.map((message, index) => {
          if (message.content === 'typing') {
            return (
              <div key={index} className="flex items-start gap-2">
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-2.5 md:p-3">
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin text-gray-500" />
                    <span className="text-xs md:text-sm text-gray-500">Thinking...</span>
                  </div>
                </div>
              </div>
            );
          }

          if (message.role === 'system') {
            return (
              <div key={index} className="text-center py-2">
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 italic">
                  {message.content}
                </p>
              </div>
            );
          }

          const isUser = message.role === 'user';

          const isVisitComparison =
            !isUser && message.intent === 'visit_comparison' && message.insights;

          return (
            <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] sm:max-w-[80%] ${
                  isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                } rounded-lg p-2.5 md:p-3`}
              >
                {isVisitComparison ? (
                  <AIVisitComparisonPanel
                    insights={message.insights}
                    suggestedActions={message.suggestedActions}
                    onActionClick={handleActionClick}
                  />
                ) : (
                  <>
                    <p className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>

                    {/* Suggested Actions (non-visit-comparison fallback) */}
                    {!isUser && message.suggestedActions && message.suggestedActions.length > 0 && (
                      <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-300 dark:border-gray-600 space-y-1.5 md:space-y-2">
                        {message.suggestedActions.map((action, actionIndex) => (
                          <Button
                            key={actionIndex}
                            variant="outline"
                            size="sm"
                            onClick={() => handleActionClick(action)}
                            className="w-full justify-start text-left h-auto py-1.5 md:py-2 px-2 md:px-3 text-xs bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{action.label}</p>
                              {action.description && (
                                <p className="text-gray-600 dark:text-gray-400 text-[10px] md:text-xs mt-0.5 line-clamp-2">
                                  {action.description}
                                </p>
                              )}
                            </div>
                          </Button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
          <div ref={messagesEndRef} />
        </div>
        )}

        {/* Input */}
        {!showPatientSelector && (
        <div className="p-3 md:p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isDisabled ? "Select a patient to use Copilot" : "Ask about this patient..."}
              disabled={isDisabled || loading}
              className="flex-1 text-sm md:text-base"
            />
            <Button
              onClick={handleSend}
              disabled={isDisabled || loading || !inputValue.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex-shrink-0 h-9 md:h-9 px-3 md:px-4"
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        )}
      </div>
    </>
  );
};

export default CopilotChat;



