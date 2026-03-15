import { baseUrl } from '../constants/Constant';
import { getAuthToken } from '../utils/auth';

const API_ENDPOINT = '/prescription-safety/check';

export const prescriptionSafetyAPI = {
  checkSafety: async (patientId, prescriptions) => {
    const url = `${baseUrl}${API_ENDPOINT}`;
    const token = getAuthToken();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        patient_id: patientId,
        prescriptions: prescriptions.map(p => ({
          medicine_name: p.medicine_name,
          dosage: p.dosage,
          frequency: p.frequency
        }))
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
};

export default prescriptionSafetyAPI;
