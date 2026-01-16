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

    const response = await fetch(url, config);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
    }

    return response.json();
};

const emailTemplatesAPI = {
    getTemplate: async (type) => {
        return apiRequest(`/email-templates/${type}`);
    },

    updateTemplate: async (type, data) => {
        return apiRequest(`/email-templates/${type}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    resetTemplate: async (type) => {
        return apiRequest(`/email-templates/${type}`, {
            method: 'DELETE',
        });
    },

    getPreview: async (type, data) => {
        return apiRequest(`/email-templates/preview/${type}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};

export default emailTemplatesAPI;
