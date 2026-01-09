import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../contexts/PermissionsContext';
import { useSelector } from 'react-redux';
import { Shield, AlertCircle } from 'lucide-react';

const ProtectedRoute = ({
  children,
  feature,  // Legacy support
  module,   // New module-based protection
  features = [],
  modules = [],
  requiredPermissions = [], // Support for array of permissions
  requireAll = false,
  fallback = null
}) => {
  const { userFeatures, loading, hasFeature, hasAnyFeature, hasAllFeatures } = usePermissions();
  const reduxUser = useSelector((state) => state.auth.user);

  // Show loading state while permissions are being fetched
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center space-x-2 text-gray-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span>Loading permissions...</span>
        </div>
      </div>
    );
  }

  // Check permissions
  let hasAccess = false;

  // Check for HOSPITAL_ADMIN role if specified in requiredPermissions
  if (requiredPermissions.includes('HOSPITAL_ADMIN')) {
    // Check both permission context user AND redux user to be safe
    const userRole = reduxUser?.role || reduxUser?.designation_group;
    if (userRole === 'Admin') {
      hasAccess = true;
    }
  } else if (module) {
    hasAccess = hasFeature(module);
  } else if (feature) {
    // Legacy support
    hasAccess = hasFeature(feature);
  } else if (modules.length > 0) {
    hasAccess = requireAll ? hasAllFeatures(modules) : hasAnyFeature(modules);
  } else if (features.length > 0) {
    // Legacy support
    hasAccess = requireAll ? hasAllFeatures(features) : hasAnyFeature(features);
  } else if (requiredPermissions.length > 0) {
    // General permission check if not handled above
    // For now, assume other permissions map to features
    hasAccess = requireAll ? hasAllFeatures(requiredPermissions) : hasAnyFeature(requiredPermissions);
  } else {
    // No specific module required, allow access
    hasAccess = true;
  }

  // If no access, show fallback or access denied page
  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this feature. Please contact your administrator if you believe this is an error.
          </p>
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-gray-500" />
              <span>Required: {module || feature || modules.join(', ') || features.join(', ')}</span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <Shield className="h-4 w-4 text-gray-500" />
              <span>Your access: {userFeatures.length > 0 ? userFeatures.join(', ') : 'None'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User has access, render the protected content
  return children;
};

export default ProtectedRoute;