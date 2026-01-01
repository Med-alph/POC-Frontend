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
      setLoading(true);
      await appAdminAuthService.logout();
      
      setAdmin(null);
      setIsAuthenticated(false);
      
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
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

  return (
    <AppAdminAuthContext.Provider value={value}>
      {children}
    </AppAdminAuthContext.Provider>
  );
};

export default AppAdminAuthContext;