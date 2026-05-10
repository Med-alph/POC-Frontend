import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { baseUrl } from '../constants/Constant';
import { getHospitalSubdomain } from '../utils/subdomain';
import { useAuth } from './AuthContext';
import hospitalsAPI from '../api/hospitalsapi';

const HospitalContext = createContext(null);

export const HospitalProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [hospitalInfo, setHospitalInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const subdomain = getHospitalSubdomain();

    const resolveHospital = async () => {
        if (!subdomain) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            
            // Priority 1: If authenticated, fetch full profile (includes enabled_modules, etc)
            if (isAuthenticated) {
                const profile = await hospitalsAPI.getProfile();
                setHospitalInfo(profile);
            } else {
                // Priority 2: Public resolution (basic info only)
                const response = await axios.get(`${baseUrl}/hospitals/resolve/${subdomain}`);
                setHospitalInfo(response.data);
            }
            
            setLoading(false);
        } catch (err) {
            console.error('Failed to resolve hospital:', err);
            setError(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        resolveHospital();
    }, [subdomain, isAuthenticated]);

    return (
        <HospitalContext.Provider value={{ hospitalInfo, loading, error, refreshHospital: resolveHospital }}>
            {children}
        </HospitalContext.Provider>
    );
};

export const useHospital = () => {
    const context = useContext(HospitalContext);
    if (context === undefined) {
        throw new Error('useHospital must be used within a HospitalProvider');
    }
    return context;
};
