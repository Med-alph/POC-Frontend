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

        if (response.status === 204) return null;
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    } catch (error) {
        console.error(`API Error for ${endpoint}:`, error);
        throw error;
    }
};

const proceduresAPI = {
    // Master List Management (Hospital Admin)
    create: async (data) => {
        return apiRequest('/procedures', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getByHospital: async (hospitalId) => {
        return apiRequest(`/procedures/hospital/${hospitalId}`);
    },

    update: async (id, data) => {
        return apiRequest(`/procedures/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    delete: async (id) => {
        return apiRequest(`/procedures/${id}`, {
            method: 'DELETE',
        });
    },

    // Doctor/Consultation
    search: async (hospitalId, query, departmentId) => {
        let url = `/procedures/search?hospital_id=${hospitalId}&query=${encodeURIComponent(query)}`;
        if (departmentId) {
            url += `&department_id=${encodeURIComponent(departmentId)}`;
        }
        return apiRequest(url);
    },

    getConsultationProcedures: async (consultationId) => {
        return apiRequest(`/consultations/${consultationId}/procedures`);
    },

    addConsultationProcedure: async (consultationId, data) => {
        return apiRequest(`/consultations/${consultationId}/procedures`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
};

export default proceduresAPI;
