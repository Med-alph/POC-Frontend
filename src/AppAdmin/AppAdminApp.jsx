import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppAdminLogin from './Login/AppAdminLogin';
import AppAdminDashboard from './Dashboard/AppAdminDashboard';
import AppAdminProtectedRoute from './components/AppAdminProtectedRoute';

const AppAdminApp = () => {
    return (
        <Routes>
            <Route path="/" element={<AppAdminLogin />} />
            <Route path="/login" element={<AppAdminLogin />} />
            <Route
                path="/*"
                element={
                    <AppAdminProtectedRoute>
                        <AppAdminDashboard />
                    </AppAdminProtectedRoute>
                }
            />
        </Routes>
    );
};

export default AppAdminApp;
