import React from "react";
import { useOutletContext } from "react-router-dom";
import { Loader2, Globe, Mail, Phone, Clock, Calendar, Shield, CreditCard, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TenantAdminDashboard() {
  const { tenantInfo } = useOutletContext();

  if (!tenantInfo) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-gray-500">No tenant information available.</p>
      </div>
    );
  }

  const InfoItem = ({ label, value, icon: Icon }) => (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{value || "N/A"}</span>
      </div>
    </div>
  );

  const PlanCard = ({ label, value, icon: Icon, colorClass }) => (
    <div className={`p-4 rounded-xl border ${colorClass} shadow-sm flex flex-col gap-2 transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest opacity-70">{label}</span>
        <Icon className="h-4 w-4 opacity-70" />
      </div>
      <span className="text-lg font-bold truncate">{value || "N/A"}</span>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-200 dark:shadow-blue-900/20 transform -rotate-3">
             <Globe className="h-8 w-8" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{tenantInfo.name}</h1>
            <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              Verified Enterprise Partner
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Core Info */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoItem label="Legal Entity" value={tenantInfo.legal_name} icon={Globe} />
          <InfoItem label="Support Email" value={tenantInfo.email} icon={Mail} />
          <InfoItem label="Contact Phone" value={tenantInfo.phone} icon={Phone} />
          <InfoItem label="Timezone" value={tenantInfo.timezone} icon={Clock} />
          <InfoItem label="License Number" value={tenantInfo.license_no} icon={Shield} />
          <InfoItem label="Registration Status" value={tenantInfo.status} icon={Shield} />
        </div>

        {/* Subscription Sidebar */}
        <Card className="border-0 shadow-lg dark:bg-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Subscription Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PlanCard 
              label="Active Plan" 
              value={tenantInfo.plan_type} 
              icon={Shield}
              colorClass="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300" 
            />
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <span className="text-gray-500 dark:text-gray-400">Member Since</span>
                <span className="font-bold">{tenantInfo.plan_start ? new Date(tenantInfo.plan_start).toLocaleDateString() : "N/A"}</span>
              </div>
              <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <span className="text-gray-500 dark:text-gray-400">Renewal Date</span>
                <span className="font-bold text-red-600">{tenantInfo.plan_end ? new Date(tenantInfo.plan_end).toLocaleDateString() : "N/A"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operations Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Business Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 space-y-2">
              <p className="font-bold text-gray-900 dark:text-white leading-relaxed">
                {tenantInfo.address_street || "Street address not provided"}
              </p>
              <div className="text-gray-500 dark:text-gray-400 text-sm flex gap-2">
                <span>{tenantInfo.address_city}</span>
                <span>•</span>
                <span>{tenantInfo.address_state} {tenantInfo.address_zip}</span>
              </div>
              <p className="text-xs uppercase tracking-widest font-bold text-blue-600 dark:text-blue-400 mt-2">
                {tenantInfo.address_country}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Operation Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">Working Hours</span>
                <span className="text-lg font-black text-blue-800 dark:text-blue-200 tracking-tight leading-none">
                   {tenantInfo.working_hours_start && tenantInfo.working_hours_end
                    ? `${tenantInfo.working_hours_start} - ${tenantInfo.working_hours_end}`
                    : "N/A"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {tenantInfo.working_days?.map((day) => (
                  <span key={day} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-tighter border border-gray-200 dark:border-gray-600">
                    {day}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
