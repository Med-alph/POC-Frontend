import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Sparkles, X, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import copilotAPI from '@/api/copilotapi';
import { patientsAPI } from '@/api/patientsapi';
import { detectCopilotIntent } from '@/utils/copilotIntentDetection';

/**
 * CopilotChat - Patient-scoped clinical copilot chat component
 * Renders in header, operates only in context of currently opened patient
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
      const response = await patientsAPI.getAll({
        limit: 1000,
        offset: 0
      });
      setAllPatients(response.data || []);
    } catch (error) {
      console.error('Failed to load patients:', error);
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
    
    // Handle visit_comparison intent structure
    if (intent === 'visit_comparison' || insights.currentVisitSoapSummary || insights.previousVisitSoapSummary) {
      // Summary
      if (insights.summary) {
        formatted += `📋 ${insights.summary}\n\n`;
      }
      
      // Clinical Trends - prominently displayed
      if (insights.clinicalTrends) {
        formatted += `🔍 Clinical Trends:\n${insights.clinicalTrends}\n\n`;
      }
      
      // Current Visit SOAP Summary
      if (insights.currentVisitSoapSummary) {
        const current = insights.currentVisitSoapSummary;
        formatted += '📝 Current Visit Summary:\n';
        
        if (current.subjective && current.subjective !== 'No previous visit data available for comparison.') {
          formatted += `\nSubjective:\n${current.subjective}\n`;
        }
        if (current.objective && current.objective !== 'No previous visit data available for comparison.') {
          formatted += `\nObjective:\n${current.objective}\n`;
        }
        if (current.assessment && current.assessment !== 'No previous visit data available for comparison.') {
          formatted += `\nAssessment:\n${current.assessment}\n`;
        }
        if (current.plan && current.plan !== 'No previous visit data available for comparison.') {
          formatted += `\nPlan:\n${current.plan}\n`;
        }
        formatted += '\n';
      }
      
      // Previous Visit SOAP Summary (if available)
      if (insights.previousVisitSoapSummary) {
        const previous = insights.previousVisitSoapSummary;
        const hasPreviousData = previous.subjective && previous.subjective !== 'No previous visit data available for comparison.';
        
        if (hasPreviousData) {
          formatted += '📋 Previous Visit Summary:\n';
          if (previous.subjective) {
            formatted += `\nSubjective:\n${previous.subjective}\n`;
          }
          if (previous.objective) {
            formatted += `\nObjective:\n${previous.objective}\n`;
          }
          if (previous.assessment) {
            formatted += `\nAssessment:\n${previous.assessment}\n`;
          }
          if (previous.plan) {
            formatted += `\nPlan:\n${previous.plan}\n`;
          }
          formatted += '\n';
        }
      }
      
      // Changes
      if (insights.symptomChanges && Array.isArray(insights.symptomChanges) && 
          insights.symptomChanges.length > 0 && 
          !insights.symptomChanges[0].includes('No previous visit data')) {
        formatted += '🔄 Symptom Changes:\n';
        insights.symptomChanges.forEach(change => {
          formatted += `• ${change}\n`;
        });
        formatted += '\n';
      }
      
      if (insights.vitalSignChanges && 
          insights.vitalSignChanges !== 'No previous visit data to compare vital signs.') {
        formatted += `📊 Vital Sign Changes:\n${insights.vitalSignChanges}\n\n`;
      }
      
      if (insights.medicationChanges && Array.isArray(insights.medicationChanges) && 
          insights.medicationChanges.length > 0 && 
          !insights.medicationChanges[0].includes('No previous visit data')) {
        formatted += '💊 Medication Changes:\n';
        insights.medicationChanges.forEach(change => {
          formatted += `• ${change}\n`;
        });
        formatted += '\n';
      }
      
      if (insights.labChanges && Array.isArray(insights.labChanges) && 
          insights.labChanges.length > 0 && 
          !insights.labChanges[0].includes('No previous visit data')) {
        formatted += '🧪 Lab Changes:\n';
        insights.labChanges.forEach(change => {
          formatted += `• ${change}\n`;
        });
        formatted += '\n';
      }
      
      // Improvements
      if (insights.improvements && Array.isArray(insights.improvements) && 
          insights.improvements.length > 0 && 
          !insights.improvements[0].includes('No previous visit data')) {
        formatted += '✅ Improvements:\n';
        insights.improvements.forEach(improvement => {
          formatted += `• ${improvement}\n`;
        });
        formatted += '\n';
      }
      
      // Worsening
      if (insights.worsening && Array.isArray(insights.worsening) && 
          insights.worsening.length > 0 && 
          !insights.worsening[0].includes('No previous visit data')) {
        formatted += '⚠️ Worsening:\n';
        insights.worsening.forEach(item => {
          formatted += `• ${item}\n`;
        });
        formatted += '\n';
      }
      
      // Warnings
      if (insights.warnings && Array.isArray(insights.warnings) && insights.warnings.length > 0) {
        formatted += '🚨 Warnings:\n';
        insights.warnings.forEach(warning => {
          formatted += `• ${warning}\n`;
        });
        formatted += '\n';
      }
      
      return formatted.trim();
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

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    // Add typing indicator
    const typingMessage = {
      role: 'system',
      content: 'typing',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, typingMessage]);

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

      if (response.insights) {
        // Pass intent from response to formatInsights for proper formatting
        const intent = response.intent || intentHint;
        assistantContent = formatInsights(response.insights, intent);
      } else if (response.message) {
        assistantContent = response.message;
      } else {
        assistantContent = 'I couldn\'t generate insights safely from available data.';
      }

      if (response.suggestedActions && response.suggestedActions.length > 0) {
        // Limit to 2 suggested actions
        suggestedActions = response.suggestedActions.slice(0, 2);
      }

      const assistantMessage = {
        role: 'assistant',
        content: assistantContent,
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
      'review_lab_changes': 'Lab Results' // Visit comparison action
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
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Chat Container */}
      <div className="fixed right-0 bottom-0 md:right-4 md:bottom-4 w-full h-full md:w-96 md:h-[600px] md:max-h-[calc(100vh-2rem)] bg-white dark:bg-gray-800 border-t md:border border-gray-200 dark:border-gray-700 md:rounded-lg shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
              Clinical Copilot
            </h3>
            {selectedPatient && (
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {selectedPatient.patient_name}
              </p>
            )}
          </div>
        </div>
        {!activePatientId && (
          <button
            onClick={() => setShowPatientSelector(true)}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search & Select Patient
                </label>
                
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

                    {/* Search Results as Cards */}
                    {patientSearchTerm && (
                      <div className="mt-3 max-h-96 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-900">
                        {filteredPatients.length === 0 ? (
                          <div className="text-center py-8">
                            <User className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No patients found matching "{patientSearchTerm}"
                            </p>
                          </div>
                        ) : (
                          filteredPatients.map((patient) => (
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
                                    {patient.patient_name}
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

                    {/* Show instruction when no search */}
                    {!patientSearchTerm && (
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

          return (
            <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] sm:max-w-[80%] ${isUser ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'} rounded-lg p-2.5 md:p-3`}>
                <p className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                
                {/* Suggested Actions */}
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

