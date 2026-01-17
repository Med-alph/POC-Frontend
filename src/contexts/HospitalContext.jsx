import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { baseUrl } from '../constants/Constant';
import { getHospitalSubdomain } from '../utils/subdomain';

const HospitalContext = createContext(null);

export const HospitalProvider = ({ children }) => {
    const [hospitalInfo, setHospitalInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const subdomain = getHospitalSubdomain();

    useEffect(() => {
        const resolveHospital = async () => {
            if (!subdomain) {
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(`${baseUrl}/hospitals/resolve/${subdomain}`);
                setHospitalInfo(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Failed to resolve hospital:', err);
                setError(err);
                setLoading(false);
            }
        };

        resolveHospital();
    }, [subdomain]);

    return (
        <HospitalContext.Provider value={{ hospitalInfo, loading, error }}>
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
