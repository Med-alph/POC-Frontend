// Procedure Permissions Hook
// Reads role and permissions from auth context
// Returns boolean flags for UI control

import { useSelector } from 'react-redux';
import { usePermissions } from '../../../contexts/PermissionsContext';

export interface ProcedurePermissions {
  canViewProcedure: boolean;
  canCreateProcedure: boolean;
  canEditProcedure: boolean;
  canCompleteProcedure: boolean;
  canUploadPhoto: boolean;
  canSignConsent: boolean;
  canViewBilling: boolean;
  canDeleteProcedure: boolean;
}

// Permission constants
export const PROCEDURE_PERMISSIONS = {
  CAN_VIEW_PROCEDURE: 'CAN_VIEW_PROCEDURE',
  CAN_CREATE_PROCEDURE: 'CAN_CREATE_PROCEDURE',
  CAN_EDIT_PROCEDURE: 'CAN_EDIT_PROCEDURE',
  CAN_COMPLETE_PROCEDURE: 'CAN_COMPLETE_PROCEDURE',
  CAN_UPLOAD_PHOTO: 'CAN_UPLOAD_PHOTO',
  CAN_SIGN_CONSENT: 'CAN_SIGN_CONSENT',
  CAN_VIEW_BILLING: 'CAN_VIEW_BILLING',
  CAN_DELETE_PROCEDURE: 'CAN_DELETE_PROCEDURE',
} as const;

export const useProcedurePermissions = (): ProcedurePermissions => {
  const reduxUser = useSelector((state: any) => state.auth.user);
  const { hasFeature } = usePermissions();

  // Get role and permissions from user
  const role = reduxUser?.role || reduxUser?.designation_group || '';
  const permissions: string[] = reduxUser?.permissions || [];

  // Helper to check if user has permission
  const hasPermission = (permission: string): boolean => {
    // Check explicit permissions array
    if (permissions.includes(permission)) {
      return true;
    }

    // Role-based fallback (if permissions array is empty or not used)
    // ADMIN has all permissions
    if (role === 'Admin' || role === 'HOSPITAL_ADMIN') {
      return true;
    }

    // DOCTOR permissions
    if (role === 'Doctor') {
      return [
        PROCEDURE_PERMISSIONS.CAN_VIEW_PROCEDURE,
        PROCEDURE_PERMISSIONS.CAN_CREATE_PROCEDURE,
        PROCEDURE_PERMISSIONS.CAN_EDIT_PROCEDURE,
        PROCEDURE_PERMISSIONS.CAN_COMPLETE_PROCEDURE,
        PROCEDURE_PERMISSIONS.CAN_UPLOAD_PHOTO,
        PROCEDURE_PERMISSIONS.CAN_SIGN_CONSENT,
      ].includes(permission as any);
    }

    // STAFF permissions (limited)
    if (role === 'Staff') {
      return [
        PROCEDURE_PERMISSIONS.CAN_VIEW_PROCEDURE,
        PROCEDURE_PERMISSIONS.CAN_CREATE_PROCEDURE,
      ].includes(permission as any);
    }

    return false;
  };

  return {
    canViewProcedure: hasPermission(PROCEDURE_PERMISSIONS.CAN_VIEW_PROCEDURE),
    canCreateProcedure: hasPermission(PROCEDURE_PERMISSIONS.CAN_CREATE_PROCEDURE),
    canEditProcedure: hasPermission(PROCEDURE_PERMISSIONS.CAN_EDIT_PROCEDURE),
    canCompleteProcedure: hasPermission(PROCEDURE_PERMISSIONS.CAN_COMPLETE_PROCEDURE),
    canUploadPhoto: hasPermission(PROCEDURE_PERMISSIONS.CAN_UPLOAD_PHOTO),
    canSignConsent: hasPermission(PROCEDURE_PERMISSIONS.CAN_SIGN_CONSENT),
    canViewBilling: hasPermission(PROCEDURE_PERMISSIONS.CAN_VIEW_BILLING),
    canDeleteProcedure: hasPermission(PROCEDURE_PERMISSIONS.CAN_DELETE_PROCEDURE),
  };
};


