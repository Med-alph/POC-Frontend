// Procedure Management API Service
// All requests automatically include tenantId from JWT via apiInterceptor

import { baseUrl } from '../../../constants/Constant';
import { getAuthToken } from '../../../utils/auth';
import type { 
  Procedure, 
  ProcedureTemplate, 
  ProcedurePhoto, 
  ProcedurePackage,
  ProcedureFilters,
  ProcedureListResponse,
  ProcedureDashboardStats
} from '../types/procedure.types';

const API_CONFIG = {
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  const token = getAuthToken();

  const config: RequestInit = {
    ...options,
    credentials: 'include', // SOC 2: Required for httpOnly cookies
    headers: {
      ...API_CONFIG.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    console.error(`ProcedureAPI Error for ${endpoint}:`, error);
    throw error;
  }
};

// Build query string from filters
const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
};

export const procedureAPI = {
  // Get procedure dashboard stats
  getDashboardStats: async (filters?: ProcedureFilters): Promise<ProcedureDashboardStats> => {
    const query = buildQueryString(filters || {});
    return apiRequest(`/procedures/dashboard/stats${query}`, { method: 'GET' });
  },

  // List procedures with filters and pagination
  listProcedures: async (filters?: ProcedureFilters): Promise<ProcedureListResponse> => {
    const query = buildQueryString(filters || {});
    return apiRequest(`/procedures${query}`, { method: 'GET' });
  },

  // Get single procedure by ID
  getProcedure: async (id: string): Promise<Procedure> => {
    return apiRequest(`/procedures/${id}`, { method: 'GET' });
  },

  // Create new procedure
  createProcedure: async (data: Partial<Procedure>): Promise<Procedure> => {
    // tenantId is automatically included from JWT, never send it manually
    const { tenantId, ...safeData } = data as any;
    return apiRequest('/procedures', {
      method: 'POST',
      body: JSON.stringify(safeData),
    });
  },

  // Update procedure
  updateProcedure: async (id: string, data: Partial<Procedure>): Promise<Procedure> => {
    // tenantId is automatically included from JWT, never send it manually
    const { tenantId, ...safeData } = data as any;
    return apiRequest(`/procedures/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(safeData),
    });
  },

  // Delete procedure
  deleteProcedure: async (id: string): Promise<void> => {
    return apiRequest(`/procedures/${id}`, { method: 'DELETE' });
  },

  // Get procedure templates (tenant-specific)
  getTemplates: async (): Promise<ProcedureTemplate[]> => {
    return apiRequest('/procedure-templates', { method: 'GET' });
  },

  // Get procedure packages (tenant-specific)
  getPackages: async (): Promise<ProcedurePackage[]> => {
    return apiRequest('/procedure-packages', { method: 'GET' });
  },

  // Upload procedure photo
  uploadPhoto: async (procedureId: string, file: File, photoType: 'BEFORE' | 'AFTER' | 'DURING', sessionNumber: number, notes?: string): Promise<ProcedurePhoto> => {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('photoType', photoType);
    formData.append('sessionNumber', String(sessionNumber));
    if (notes) {
      formData.append('notes', notes);
    }

    const url = `${baseUrl}/procedures/${procedureId}/photos`;
    const token = getAuthToken();

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    return handleResponse(response);
  },

  // Get procedure photos
  getPhotos: async (procedureId: string): Promise<ProcedurePhoto[]> => {
    return apiRequest(`/procedures/${procedureId}/photos`, { method: 'GET' });
  },

  // Delete procedure photo
  deletePhoto: async (procedureId: string, photoId: string): Promise<void> => {
    return apiRequest(`/procedures/${procedureId}/photos/${photoId}`, { method: 'DELETE' });
  },

  // Sign consent
  signConsent: async (procedureId: string): Promise<Procedure> => {
    return apiRequest(`/procedures/${procedureId}/consent`, {
      method: 'POST',
    });
  },

  // Complete procedure
  completeProcedure: async (procedureId: string, data?: { notes?: string; completedDate?: string }): Promise<Procedure> => {
    return apiRequest(`/procedures/${procedureId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },
};


