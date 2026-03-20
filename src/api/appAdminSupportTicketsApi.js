import { baseUrl } from '../constants/Constant';
import { getAuthToken } from '../utils/auth';

/** Matches backend `platformAppAdminPseudoUserId` for message bubble alignment. */
export function platformAppAdminPseudoUserId(adminId) {
  const hex = BigInt(Math.floor(Number(adminId))).toString(16).padStart(12, '0').slice(-12);
  return `00000000-0000-4000-8000-${hex}`;
}

async function appAdminRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: options.method || 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    body: options.body != null ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return data;
}

async function appAdminGet(endpoint) {
  return appAdminRequest(endpoint, { method: 'GET' });
}

export function listAppAdminSupportTickets(params = {}) {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.priority) q.set('priority', params.priority);
  if (params.hospitalId) q.set('hospitalId', params.hospitalId);
  if (params.tenantId != null && params.tenantId !== '') {
    q.set('tenantId', String(params.tenantId));
  }
  const qs = q.toString();
  return appAdminGet(`/app-admin/support-tickets${qs ? `?${qs}` : ''}`);
}

export function getAppAdminSupportTicket(id, { messagesPage = 1, messagesLimit = 40 } = {}) {
  const q = new URLSearchParams({
    messagesPage: String(messagesPage),
    messagesLimit: String(messagesLimit),
  });
  return appAdminGet(`/app-admin/support-tickets/${id}?${q}`);
}

export function postAppAdminSupportTicketMessage(id, body) {
  return appAdminRequest(`/app-admin/support-tickets/${id}/messages`, { method: 'POST', body });
}

export function putAppAdminSupportTicketStatus(id, body) {
  return appAdminRequest(`/app-admin/support-tickets/${id}/status`, { method: 'PUT', body });
}

export function postAppAdminSupportTicketRead(id) {
  return appAdminRequest(`/app-admin/support-tickets/${id}/read`, { method: 'POST' });
}
