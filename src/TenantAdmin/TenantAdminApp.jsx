import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TenantAdminLogin from './TenantAdminLogin';
import TenantAdminDashboard from './TenantAdminDashboard';
import ProtectedRoute from '../components/ProtectedRoute';
import TicketChatPage from '../components/support/TicketChatPage';
import TenantSuperAdminSupportGate from './TenantSuperAdminSupportGate';
import TenantAdminLayout from './TenantAdminLayout';
import HospitalListTable from './Hospitals/HospitalListTable';
import ProcedureList from './Procedures/ProcedureList';
import StaffsRolesTab from './StaffRoles/StaffsRolesTab';
import RoleManagement from './RoleManagement/RoleManagement';
import HospitalPatinets from './Patients/HospitalPatients';
import SuperAdminSupportTickets from './SuperAdminSupportTickets';

const TenantAdminApp = () => {
  return (
    <Routes>
      <Route path="/login" element={<TenantAdminLogin />} />
      
      <Route element={<ProtectedRoute><TenantAdminLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Navigate to="/tenant/overview" replace />} />
        <Route path="/tenant/overview" element={<TenantAdminDashboard />} />
        <Route path="/tenant/hospitals" element={<HospitalListTable />} />
        <Route path="/tenant/procedures" element={<ProcedureList />} />
        <Route path="/tenant/staffs" element={<StaffsRolesTab />} />
        <Route path="/tenant/roles" element={<RoleManagement />} />
        <Route path="/tenant/patients" element={<HospitalPatinets />} />
        
        <Route
          path="/tenant/support"
          element={
            <TenantSuperAdminSupportGate>
              <SuperAdminSupportTickets />
            </TenantSuperAdminSupportGate>
          }
        />
        
        <Route
          path="/tenant/support-ticket/:ticketId"
          element={
            <TenantSuperAdminSupportGate>
              <TicketChatPage />
            </TenantSuperAdminSupportGate>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default TenantAdminApp;
