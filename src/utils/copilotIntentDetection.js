/**
 * Copilot Intent Detection Utility
 * Rule-based intent detection for Copilot chat queries
 * This is ONLY a hint - backend remains the final authority
 */

/**
 * Supported Copilot intents
 * @typedef {'patient_summary' | 'visit_comparison' | 'data_retrieval' | 'documentation_review' | 'workflow_assistance' | 'unknown'} CopilotIntent
 */

/**
 * Detects intent from user query using rule-based keyword matching
 * @param {string} userQuery - The user's chat message
 * @returns {CopilotIntent} Detected intent (hint only, backend may override)
 */
export const detectCopilotIntent = (userQuery) => {
  if (!userQuery || typeof userQuery !== 'string') {
    return 'patient_summary';
  }

  const query = userQuery.toLowerCase().trim();

  // Priority 1: visit_comparison
  const visitComparisonKeywords = [
    'worsened', 'improved', 'better', 'worse',
    'changed', 'difference', 'since last visit',
    'any change', 'progress', 'compare',
    'previous visit', 'last visit', 'compared to',
    'how has', 'what changed', 'changes since'
  ];
  
  if (visitComparisonKeywords.some(keyword => query.includes(keyword))) {
    return 'visit_comparison';
  }

  // Priority 2: data_retrieval
  const dataRetrievalKeywords = [
    'lab', 'labs', 'test result', 'results',
    'medication', 'meds', 'drug', 'prescription',
    'allergy', 'allergies', 'vitals', 'bp',
    'blood pressure', 'temperature', 'pulse',
    'show me', 'get me', 'find', 'retrieve',
    'what are the', 'list of'
  ];
  
  if (dataRetrievalKeywords.some(keyword => query.includes(keyword))) {
    return 'data_retrieval';
  }

  // Priority 3: documentation_review
  const documentationReviewKeywords = [
    'missing', 'complete', 'documentation',
    'note complete', 'any risk', 'risk',
    'documented', 'recorded', 'noted',
    'is there', 'are there any', 'check if'
  ];
  
  if (documentationReviewKeywords.some(keyword => query.includes(keyword))) {
    return 'documentation_review';
  }

  // Priority 4: workflow_assistance
  const workflowAssistanceKeywords = [
    'what next', 'next step', 'next steps',
    'follow up', 'follow-up', 'followup',
    'pending', 'action needed', 'action required',
    'what should', 'recommend', 'suggest',
    'what do i', 'how should i'
  ];
  
  if (workflowAssistanceKeywords.some(keyword => query.includes(keyword))) {
    return 'workflow_assistance';
  }

  // Default: patient_summary
  return 'patient_summary';
};

/**
 * Get intent display name (for debugging/logging only, not for UI)
 * @param {CopilotIntent} intent
 * @returns {string}
 */
export const getIntentDisplayName = (intent) => {
  const names = {
    patient_summary: 'Patient Summary',
    visit_comparison: 'Visit Comparison',
    data_retrieval: 'Data Retrieval',
    documentation_review: 'Documentation Review',
    workflow_assistance: 'Workflow Assistance',
    unknown: 'Unknown'
  };
  return names[intent] || 'Unknown';
};

