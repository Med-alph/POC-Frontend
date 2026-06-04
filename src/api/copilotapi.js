import { baseUrl } from '../constants/Constant';
import { getAuthToken } from '../utils/auth';

const apiRequest = async (endpoint, options = {}) => {
  const url = `${baseUrl}${endpoint}`;
  const token = getAuthToken();
  
  const config = {
    method: options.method || 'GET',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`Copilot API Error for ${endpoint}:`, error);
    throw error;
  }
};

const copilotAPI = {
  /**
   * Generate structured SOAP notes + ICD-10 suggestions from free-form clinical text
   * @param {string} rawText - Free-form clinical notes (max 4000 chars)
   * @param {string} [consultationId] - Optional consultation UUID for context
   * @returns {Promise<{ soap: { subjective, objective, assessment, plan }, icdSuggestions: Array, warnings: Array, timestamp: string }>}
   */
  analyseSoap: async (rawText, consultationId = null) => {
    const body = { rawText };
    if (consultationId) body.consultationId = consultationId;
    return apiRequest('/soap-assist/analyse', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  /**
   * Get AI Clinical Copilot insights for a patient
   * @param {string} patientId - Patient ID
   * @param {string} userId - User ID (doctor/clinician ID)
   * @param {string} inputText - Optional input text/question (defaults to patient summary query)
   * @param {string} intent - Intent type (defaults to "patient_summary")
   * @returns {Promise<Object>} Copilot response with insights and suggested actions
   */
  getPatientInsights: async (patientId, userId, inputText = "What are the key concerns for this patient?", intent = "patient_summary") => {
    return apiRequest('/copilot/execute', {
      method: 'POST',
      body: JSON.stringify({
        intent,
        patientId,
        userId,
        inputText,
      }),
    });
  },
  
  /**
   * Send chat message to Copilot
   * @param {string} patientId - Patient ID
   * @param {string} userId - User ID
   * @param {string} userQuery - User's chat message
   * @param {string} visitId - Optional visit ID
   * @param {string} intentHint - Optional intent hint (non-authoritative, backend may override)
   * @returns {Promise<Object>} Copilot response
   */
  sendChatMessage: async (patientId, userId, userQuery, visitId = null, intentHint = null) => {
    const body = {
      intent: 'copilot_chat',
      patientId,
      userId,
      userQuery,
    };
    
    if (visitId) {
      body.visitId = visitId;
    }
    
    // Add intent hint if provided (backend may override)
    if (intentHint) {
      body.intentHint = intentHint;
    }
    
    return apiRequest('/copilot/execute', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};

export default copilotAPI;

