import { baseUrl } from '../constants/Constant';
import { getAuthToken } from '../utils/auth';

const apiRequest = async (endpoint, options = {}) => {
  const url = `${baseUrl}${endpoint}`;
  const token = getAuthToken();

  const config = {
    method: 'GET',
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
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error(`[InsuranceClaimsAPI] Error for ${endpoint}:`, error);
    throw error;
  }
};

const insuranceClaimsAPI = {
  /**
   * Submit a new insurance claim.
   * Backend generates the claim number and stores claim_status = 'submitted'.
   * @param {object} data
   * @param {string} data.consultation_id
   * @param {string} data.patient_id
   * @param {string} data.hospital_id
   * @param {string} data.submitted_by        - staff id of the person submitting
   * @param {string} data.insurance_company   - required
   * @param {string} [data.policy_number]     - optional
   * @param {string} [data.card_valid_until]  - ISO date string e.g. "2026-12-31", optional
   * @param {'general'|'emergency'} data.claim_type
   * @param {boolean} data.pre_authorization_required - true if insurer gave prior approval
   * @param {string} [data.authorization_number] - required when pre_authorization_required = true
   * @returns {{ id, claim_number, claim_status, submitted_at }}
   */
  submitClaim: async (data) => {
    return apiRequest('/insurance-claims', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Check if a claim already exists for a given consultation.
   * Returns the claim record if found, throws 404 if not.
   * Use this on ClaimPreparation load to avoid duplicate submissions.
   * @param {string} consultationId
   */
  getClaimByConsultation: async (consultationId) => {
    return apiRequest(`/insurance-claims/consultation/${consultationId}`);
  },

  /**
   * Manually update claim status (for demo: approved / denied).
   * @param {string} claimId
   * @param {'approved'|'denied'} status
   */
  updateClaimStatus: async (claimId, status) => {
    return apiRequest(`/insurance-claims/${claimId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ claim_status: status }),
    });
  },

  /**
   * Fetch a patient's insurance defaults stored during patient registration.
   * Backend decrypts insurance_number before returning — frontend receives plaintext.
   * Returns null values if the patient has no insurance on file.
   * @param {string} patientId
   * @returns {{ insurance_provider: string|null, insurance_number: string|null }}
   */
  getPatientInsuranceDefaults: async (patientId) => {
    return apiRequest(`/insurance-claims/patient-insurance/${patientId}`);
  },
};

export default insuranceClaimsAPI;
