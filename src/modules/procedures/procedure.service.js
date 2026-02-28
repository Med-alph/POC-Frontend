// src/modules/procedures/procedure.service.js
// Service layer for Procedure master CRUD
// Uses window.fetch (intercepted by apiInterceptor) + baseUrl + auth token

import { baseUrl } from '../../constants/Constant';
import { getAuthToken } from '../../utils/auth';

// Build headers with JWT where available
const buildHeaders = (extra = {}) => {
  const token = getAuthToken?.() || null;

  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...extra,
  };
};

// Generic response handler (returns parsed JSON or throws structured error)
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const error = new Error(
      payload?.message || payload?.error || `Request failed with status ${response.status}`
    );
    error.status = response.status;
    // Accept both { errors: { field: msg } } and { fieldErrors: { field: msg } } styles
    error.fieldErrors = payload?.errors || payload?.fieldErrors || null;
    error.raw = payload;
    throw error;
  }

  return payload;
};

// Serialize query parameters
const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.append(key, String(value));
  });

  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
};

const procedureService = {
  /**
   * List procedures with optional search, status filter and pagination.
   * Backend supports at least: GET /procedures?search=&is_active=
   */
  async listProcedures({ search = '', isActive, page, pageSize } = {}) {
    const params = {};

    if (search) params.search = search;
    if (isActive === true) params.is_active = 'true';
    else if (isActive === false) params.is_active = 'false';

    // Optional pagination if backend supports it
    if (page !== undefined) params.page = page;
    if (pageSize !== undefined) params.page_size = pageSize;

    const query = buildQueryString(params);

    const response = await fetch(`${baseUrl}/procedures${query}`, {
      method: 'GET',
      headers: buildHeaders(),
    });

    return handleResponse(response);
  },

  /**
   * Get single procedure by id
   */
  async getProcedure(id) {
    const response = await fetch(`${baseUrl}/procedures/${id}`, {
      method: 'GET',
      headers: buildHeaders(),
    });

    return handleResponse(response);
  },

  /**
   * Create a new procedure
   */
  async createProcedure(data) {
    const response = await fetch(`${baseUrl}/procedures`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  /**
   * Update existing procedure (PATCH)
   */
  async updateProcedure(id, data) {
    const response = await fetch(`${baseUrl}/procedures/${id}`, {
      method: 'PATCH',
      headers: buildHeaders(),
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  /**
   * Delete a procedure
   */
  async deleteProcedure(id) {
    const response = await fetch(`${baseUrl}/procedures/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(),
    });

    return handleResponse(response);
  },
};

export default procedureService;



