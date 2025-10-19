import React from "react"
import { useSelector } from "react-redux"
import { Navigate, useLocation } from "react-router-dom"

const ProtectedRoute = ({ children, requiredPermissions = [], requireSuperAdmin = false }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const location = useLocation()

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  // Check if user has required permissions
  if (requiredPermissions.length > 0) {
    const userPermissions = user.permissions || []
    const hasRequiredPermissions = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    )
    
    if (!hasRequiredPermissions) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
            <button 
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      )
    }
  }

  // Check if super admin is required
  if (requireSuperAdmin) {
    const isSuperAdmin = user.permissions?.includes('roles:manage') || user.role === 'super_admin'
    if (!isSuperAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">Super admin privileges required.</p>
            <button 
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      )
    }
  }

  return children
}

export default ProtectedRoute
