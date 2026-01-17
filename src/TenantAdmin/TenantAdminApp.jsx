import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TenantAdminLogin from './TenantAdminLogin';
import TenantAdminDashboard from './TenantAdminDashboard';
import ProtectedRoute from '../components/ProtectedRoute';

const TenantAdminApp = () => {
    return (
        <Routes>
            <Route path="/login" element={<TenantAdminLogin />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <TenantAdminDashboard />
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

export default TenantAdminApp;
