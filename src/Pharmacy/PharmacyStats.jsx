import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Pill, Clock, CheckCircle2, TrendingUp, AlertCircle, 
  RefreshCw, BarChart2, ShieldAlert, ShoppingCart, UserCheck
} from "lucide-react";
import { useSelector } from "react-redux";
import pharmacyAPI from "../api/pharmacyapi";
import toast from "react-hot-toast";

export default function PharmacyStats() {
  const user = useSelector((state) => state.auth.user);
  const hospitalId = user?.hospital_id;

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (showIndicator = false) => {
    if (!hospitalId) return;
    try {
      if (showIndicator) setRefreshing(true);
      else setLoading(true);
      
      const response = await pharmacyAPI.getStats(hospitalId);
      setStats(response);
    } catch (err) {
      console.error("Failed to load pharmacy dashboard analytics", err);
      toast.error("Failed to refresh statistics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh stats every 60 seconds
    const interval = setInterval(() => {
      fetchStats(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-slate-50/50">
        <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600 dark:text-gray-400">Loading pharmacy stats...</p>
      </div>
    );
  }

  const kpis = [
    {
      title: "Pending Stock Check",
      value: stats?.pending ?? 0,
      icon: Clock,
      colorClass: "from-amber-500 to-orange-600 shadow-orange-100",
      description: "Prescriptions awaiting pharmacist stock check"
    },
    {
      title: "Verified (Awaiting Invoice)",
      value: stats?.verified ?? 0,
      icon: ShoppingCart,
      colorClass: "from-cyan-500 to-blue-600 shadow-cyan-100",
      description: "Orders locked, awaiting cashier invoice generation"
    },
    {
      title: "Ready to Dispense",
      value: stats?.paid ?? 0,
      icon: UserCheck,
      colorClass: "from-emerald-500 to-teal-600 shadow-emerald-100",
      description: "Invoices settled. Medications ready to hand to patient"
    },
    {
      title: "Dispensed Today",
      value: stats?.dispensed_today ?? 0,
      icon: CheckCircle2,
      colorClass: "from-indigo-500 to-violet-600 shadow-indigo-100",
      description: "Orders completed, stock correctly consumed today"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-indigo-500" />
            Performance & Workload Overview
          </h2>
          <p className="text-xs text-slate-400 font-light mt-0.5">Real-time counters tracking pharmacy throughput.</p>
        </div>

        <button 
          onClick={() => fetchStats(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl border border-slate-100 shadow-sm transition-all"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* KPI Cards Grid with Vibrant Gradients */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => {
          const IconComp = kpi.icon;
          return (
            <Card key={idx} className="border-none shadow-sm overflow-hidden rounded-2xl bg-white dark:bg-gray-950 flex flex-col justify-between p-6 relative group hover:shadow-lg transition-all duration-300">
              {/* Top Accent Pill Decorator */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider">{kpi.title}</span>
                <div className={`h-8 w-8 rounded-lg bg-gradient-to-tr ${kpi.colorClass} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
                  <IconComp className="h-4 w-4" />
                </div>
              </div>

              <div>
                <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                  {kpi.value}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-gray-400 font-light mt-1 bg-slate-50/50 dark:bg-gray-900 p-2 rounded-xl border border-slate-100/50 dark:border-gray-800">
                  {kpi.description}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Specialty Guard Notice & Recommendations */}
      <Card className="border border-slate-100 dark:border-gray-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-gray-950">
        <CardHeader className="border-b border-slate-50 dark:border-gray-800 p-5">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <ShieldAlert className="h-4.5 w-4.5 text-indigo-500" />
            Pharmacist Compliance Guidelines (HIPAA)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 text-xs text-slate-500 dark:text-gray-400 leading-relaxed space-y-3">
          <p>
            1. <strong className="text-slate-700">Stock Matching:</strong> Ensure the brand name, batch expiry, and specific dosage match the physical packaging before verifying the prescription items.
          </p>
          <p>
            2. <strong className="text-slate-700">Invoice Integrity:</strong> Once a stock check is verified and billed, its price is locked. Do not re-verify an order after the patient pays the bill unless the order is cancelled and a fresh prescription is logged by the doctor.
          </p>
          <p>
            3. <strong className="text-slate-700">Audit Logs:</strong> Every stock verification and medicine dispense is associated with your unique account signature. Ensure HIPAA security by locking your terminal whenever stepping away from the counter.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
