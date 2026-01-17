import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppAdminAuth } from '../contexts/AppAdminAuthContext';

const AppAdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAppAdminAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render protected component
  return children;
};

export default AppAdminProtectedRoute;