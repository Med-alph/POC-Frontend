// Procedure Management Types

export type ProcedureStatus = 
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'POSTPONED';

export interface Procedure {
  id: string;
  patientId: string;
  patientName?: string;
  procedureTypeId: string;
  procedureTypeName?: string;
  doctorId: string;
  doctorName?: string;
  status: ProcedureStatus;
  scheduledDate: string;
  completedDate?: string;
  sessionNumber: number;
  totalSessions: number;
  diagnosis?: string;
  notes?: string;
  price?: number;
  consentSigned: boolean;
  consentSignedAt?: string;
  consentSignedBy?: string;
  createdAt: string;
  updatedAt: string;
  tenantId: string; // Auto-included from JWT, never editable
}

export interface ProcedureTemplate {
  id: string;
  name: string;
  description?: string;
  defaultPrice?: number;
  defaultSessions?: number;
  defaultConsentText?: string;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProcedurePhoto {
  id: string;
  procedureId: string;
  sessionNumber: number;
  photoType: 'BEFORE' | 'AFTER' | 'DURING';
  imageUrl: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
  notes?: string;
}

export interface ProcedurePackage {
  id: string;
  name: string;
  description?: string;
  procedureTypeIds: string[];
  totalSessions: number;
  price: number;
  discount?: number;
  isActive: boolean;
  tenantId: string;
}

export interface ProcedureDashboardStats {
  totalProcedures: number;
  completed: number;
  pending: number;
  inProgress: number;
  revenue?: number; // Only if CAN_VIEW_BILLING permission
}

export interface ProcedureFilters {
  doctorId?: string;
  procedureTypeId?: string;
  status?: ProcedureStatus;
  dateFrom?: string;
  dateTo?: string;
  patientId?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface ProcedureListResponse {
  procedures: Procedure[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}


