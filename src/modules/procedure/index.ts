// Procedure Module Exports

export * from './types/procedure.types';
export * from './hooks/useProcedurePermissions';
export { procedureAPI } from './services/procedure.api';

// Pages
export { default as ProcedureDashboard } from './pages/ProcedureDashboard';
export { default as CreateProcedure } from './pages/CreateProcedure';
export { default as ProcedureDetails } from './pages/ProcedureDetails';
export { PatientProcedures } from './pages/PatientProcedures';

// Components
export { ProcedureStatusBadge } from './components/ProcedureStatusBadge';
export { ProcedureForm } from './components/ProcedureForm';
export { ProcedurePhotoUpload } from './components/ProcedurePhotoUpload';
export { ProcedureConsent } from './components/ProcedureConsent';
export { ProcedurePackageSelector } from './components/ProcedurePackageSelector';


