import React, { createContext, useContext, useState, useEffect } from 'react';
import appAdminAuthService from '../services/appAdminAuthService';
import toast from 'react-hot-toast';

const AppAdminAuthContext = createContext();

export const useAppAdminAuth = () => {
  const context = useContext(AppAdminAuthContext);
  if (!context) {
    throw new Error('useAppAdminAuth must be used within an AppAdminAuthProvider');
  }
  return context;
};

export const AppAdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);

      // Check if token exists and is valid
      if (appAdminAuthService.isAuthenticated()) {
        const isValid = await appAdminAuthService.verifyToken();

        if (isValid) {
          const adminData = appAdminAuthService.getAdminData();
          setAdmin(adminData);
          setIsAuthenticated(true);
        } else {
          // Token is invalid
          setAdmin(null);
          setIsAuthenticated(false);
        }
      } else {
        setAdmin(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setAdmin(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await appAdminAuthService.login(email, password);

      setAdmin(response.admin);
      setIsAuthenticated(true);

      toast.success('Login successful!');
      return response;
    } catch (error) {
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await appAdminAuthService.register(userData);

      toast.success('Registration successful!');
      return response;
    } catch (error) {
      toast.error(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoggingOut(true);
      setLoading(true);
      await appAdminAuthService.logout();

      setAdmin(null);
      setIsAuthenticated(false);

      toast.success('Logged out successfully');
      // Using window location here instead of react router just to bypass React unmounting flickers
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
      setIsLoggingOut(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await appAdminAuthService.getProfile();
      setAdmin(profile);
      return profile;
    } catch (error) {
      console.error('Refresh profile error:', error);
      throw error;
    }
  };

  const value = {
    admin,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    refreshProfile,
  };

  if (isLoggingOut) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 font-medium animate-pulse">Logging out securely...</p>
        </div>
      </div>
    );
  }

  return (
    <AppAdminAuthContext.Provider value={value}>
      {children}
    </AppAdminAuthContext.Provider>
  );
};

export default AppAdminAuthContext;