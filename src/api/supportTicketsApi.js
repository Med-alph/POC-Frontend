import { baseUrl } from '../constants/Constant';
import { getAuthToken } from '../utils/auth';

async function apiRequest(endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const token = getAuthToken();
  const config = {
    method: 'GET',
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };
  const response = await fetch(url, config);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

const supportTicketsApi = {
  listTickets: (params = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.set('status', params.status);
    if (params.priority) q.set('priority', params.priority);
    if (params.hospitalId) q.set('hospitalId', params.hospitalId);
    const qs = q.toString();
    return apiRequest(`/tickets${qs ? `?${qs}` : ''}`);
  },

  getTicket: (id, { messagesPage = 1, messagesLimit = 40 } = {}) =>
    apiRequest(`/tickets/${id}?messagesPage=${messagesPage}&messagesLimit=${messagesLimit}`),

  createTicket: (body) =>
    apiRequest('/tickets', { method: 'POST', body: JSON.stringify(body) }),

  updateStatus: (id, body) =>
    apiRequest(`/tickets/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),

  assignTicket: (id, body) =>
    apiRequest(`/tickets/${id}/assign`, { method: 'PUT', body: JSON.stringify(body) }),

  listMessages: (id, { page = 1, limit = 40 } = {}) =>
    apiRequest(`/tickets/${id}/messages?page=${page}&limit=${limit}`),

  sendMessage: (id, body) =>
    apiRequest(`/tickets/${id}/messages`, { method: 'POST', body: JSON.stringify(body) }),

  markRead: (id) => apiRequest(`/tickets/${id}/read`, { method: 'POST' }),

  listAssignableSuperadmins: () => apiRequest('/tickets/assignable-superadmins'),

  listFaqs: (params = {}) => {
    const q = new URLSearchParams();
    if (params.hospitalId) q.set('hospitalId', params.hospitalId);
    if (params.search) q.set('search', params.search);
    const qs = q.toString();
    return apiRequest(`/faqs${qs ? `?${qs}` : ''}`);
  },

  createFaq: (body, hospitalId) => {
    const q = hospitalId ? `?hospitalId=${encodeURIComponent(hospitalId)}` : '';
    return apiRequest(`/faqs${q}`, { method: 'POST', body: JSON.stringify(body) });
  },

  updateFaq: (id, body) =>
    apiRequest(`/faqs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  deleteFaq: (id) => apiRequest(`/faqs/${id}`, { method: 'DELETE' }),
};

export default supportTicketsApi;
