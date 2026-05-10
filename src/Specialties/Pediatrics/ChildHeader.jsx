import React, { useState, useEffect } from 'react';
import { Baby, Calendar, Syringe, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import pediatricsAPI from "../../api/pediatricsapi";

const ChildHeader = ({ patientData, enabledModules = [] }) => {
    const [nextVaccine, setNextVaccine] = useState(null);
    const [latestGrowth, setLatestGrowth] = useState(null);
    const [loading, setLoading] = useState(false);

    const hasVaccines = enabledModules.includes('VACCINES');
    const hasGrowth = enabledModules.includes('GROWTH');

    const calculateAge = (dob) => {
        if (!dob) return 0;
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

    const isAdult = calculateAge(patientData?.dob) >= 18;

    useEffect(() => {
        if (patientData?.id && !isAdult) {
            if (hasVaccines) fetchNextVaccine();
            if (hasGrowth) fetchLatestGrowth();
        }
    }, [patientData?.id, hasVaccines, hasGrowth]);

    const fetchNextVaccine = async () => {
        try {
            setLoading(true);
            const vaccines = await pediatricsAPI.getVaccines(patientData.id);
            const upcoming = vaccines.find(v => !v.administered && (v.status === 'Due' || v.status === 'Overdue'));
            setNextVaccine(upcoming);
        } catch (err) {
            console.error("Failed to fetch next vaccine:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLatestGrowth = async () => {
        try {
            const data = await pediatricsAPI.getGrowthHistory(patientData.id);
            if (data && data.length > 0) {
                setLatestGrowth(data[data.length - 1]);
            }
        } catch (err) {
            console.error("Failed to fetch growth history:", err);
        }
    };

    const getDetailedAge = (dob) => {
        if (!dob) return "N/A";
        const birthDate = new Date(dob);
        const today = new Date();
        
        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();
        let days = today.getDate() - birthDate.getDate();

        if (days < 0) {
            months--;
            const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            days += lastMonth.getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }

        const parts = [];
        if (years > 0) parts.push(`${years}y`);
        if (months > 0) parts.push(`${months}m`);
        if (days > 0 || parts.length === 0) parts.push(`${days}d`);
        
        return parts.join(' ');
    };

    if (isAdult) return null;

    let growthStatus = "No Data";
    let growthSubtext = "Add entry to track";
    let statusColor = "text-slate-900";
    
    if (latestGrowth) {
        if (latestGrowth.weightTrend === 'up' && latestGrowth.heightTrend === 'up') {
            growthStatus = "Growth Improving";
            growthSubtext = `${latestGrowth.weight}kg • ${latestGrowth.height}cm`;
            statusColor = "text-emerald-600";
        } else if (latestGrowth.weightTrend === 'down') {
            growthStatus = "Watch Growth";
            growthSubtext = "Weight dropping • Watch required";
            statusColor = "text-amber-600";
        } else if (latestGrowth.weightTrend === 'neutral') {
            growthStatus = "Growth Slowing";
            growthSubtext = `${latestGrowth.weight}kg • ${latestGrowth.height}cm`;
            statusColor = "text-blue-600";
        } else {
            growthStatus = "Normal Growth";
            growthSubtext = `${latestGrowth.weight}kg • ${latestGrowth.height}cm`;
            statusColor = "text-slate-600";
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Age Badge - Always Visible in Pediatrics */}
            <div className="bg-white p-4 rounded-[1.5rem] border border-slate-200/60 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                    <Baby className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clinical Age</p>
                    <p className="text-lg font-bold text-slate-900">{getDetailedAge(patientData.dob)}</p>
                </div>
            </div>

            {/* Next Vaccine Badge - Conditional */}
            {hasVaccines && (
                <div className="bg-white p-4 rounded-[1.5rem] border border-slate-200/60 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        nextVaccine?.status === 'Overdue' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'
                    }`}>
                        <Syringe className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Next Vaccine</p>
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400 mt-1" />
                        ) : nextVaccine ? (
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{nextVaccine.name}</p>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    nextVaccine.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                    {nextVaccine.status}
                                </span>
                            </div>
                        ) : (
                            <p className="text-sm font-bold text-emerald-600">Up to date</p>
                        )}
                    </div>
                </div>
            )}

            {/* Growth Status - Conditional */}
            {hasGrowth && (
                <div className="bg-white p-4 rounded-[1.5rem] border border-slate-200/60 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Growth Status</p>
                        <p className={`text-sm font-bold ${statusColor}`}>{growthStatus}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{growthSubtext}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChildHeader;
