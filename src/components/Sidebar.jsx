import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { 
  Home, Users, Stethoscope, Calendar, Clock, 
  Package, Sparkles, MessageSquare, Shield, Mail, 
  Banknote, FileText, Clipboard, X, ChevronRight,
  LayoutDashboard, Bell, AlertCircle
} from "lucide-react";
import { usePermissions } from "../contexts/PermissionsContext";
import { UI_MODULES } from "../constants/Constant";
import { useHospital } from "../contexts/HospitalContext";
import { useSubscription } from "../hooks/useSubscription";

const navigationItems = [
  { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, requiredModule: UI_MODULES.DASHBOARD },
  { id: "patients", label: "Patients", path: "/patients", icon: Users, requiredModule: UI_MODULES.PATIENTS },
  { id: "doctors", label: "Doctors", path: "/doctors", icon: Stethoscope, requiredModule: UI_MODULES.DOCTORS },
  { id: "appointments", label: "Appointments", path: "/appointments", icon: Calendar, requiredModule: UI_MODULES.APPOINTMENTS },
  { id: "inventory", label: "Inventory", path: "/inventory", icon: Package, requiredModule: UI_MODULES.INVENTORY, subscriptionModule: "INVENTORY" },
  { id: "leave-management", label: "Leave Management", path: "/leave-management", icon: Calendar, requiredModule: UI_MODULES.LEAVE_MANAGEMENT },
  { id: "attendance-management", label: "Attendance Management", path: "/admin/attendance", icon: Clock, requiredModule: UI_MODULES.ATTENDANCE },
  { id: "reminders", label: "Reminders", path: "/reminders", icon: Clock, requiredModule: UI_MODULES.REMINDERS },
  { id: "notifications", label: "Notifications", path: "/notifications", icon: Bell, requiredModule: UI_MODULES.NOTIFICATIONS, subscriptionModule: "NOTIFICATIONS" },
  { id: "cashier", label: "Cashier", path: "/cashier", icon: Banknote, subscriptionModule: "BILLING", requiredModule: UI_MODULES.BILLING },
  { id: "invoice-reports", label: "Invoice Reports", path: "/admin/invoice-reports", icon: FileText, isAdminOnly: true, subscriptionModule: "REPORTS", requiredModule: UI_MODULES.REPORTS },
  { id: "master-procedures", label: "Master Procedures", path: "/admin/master-procedures", icon: Clipboard, isAdminOnly: true, requiredModule: UI_MODULES.PROCEDURES },
  { id: "feedback", label: "Patient Feedback", path: "/hospital/feedback", icon: MessageSquare, isAdminOnly: true },
];

const doctorNavItems = [
  { id: "doctorDashboard", label: "Dashboard", path: "/doctor-dashboard", icon: LayoutDashboard, requiredModule: UI_MODULES.DASHBOARD },
  { id: "Attendance", label: "Attendance", path: "/doctor-attendance", icon: Clock, requiredModule: UI_MODULES.ATTENDANCE },
  { id: "FulfilledRecords", label: "Fulfilled Records", path: "/fulfilled-records", icon: Users, requiredModule: UI_MODULES.PATIENTS },
  { id: "Gallery", label: "Patient Gallery", path: "/patient-gallery", icon: Users, requiredModule: UI_MODULES.GALLERY },
  { id: "Copilot", label: "Copilot", path: "/copilot", icon: Sparkles, subscriptionModule: "AI_ANALYSIS" },
  { id: "CancellationRequests", label: "Cancel Requests", path: "/CancellationRequests", icon: Bell, requiredModule: UI_MODULES.CANCELLATION_REQUESTS },
];

import { 
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider 
} from "@/components/ui/tooltip";

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const { hospitalInfo } = useHospital();
  const { hasModule, loading: permissionsLoading } = usePermissions();
  const { isModuleDisabled, loading: subscriptionLoading } = useSubscription();

  const isRoleMatch = (roles, targetRoles) => {
    if (Array.isArray(roles)) {
      return roles.some(r => targetRoles.includes(r?.toLowerCase()));
    }
    return targetRoles.includes(user?.role?.toLowerCase()) || 
           (user?.designation_group && targetRoles.includes(user.designation_group.toLowerCase()));
  };

  const hasDoctorRole = isRoleMatch(user?.roles || user?.role, ["doctor"]);
  const isAdminRole = isRoleMatch(user?.roles || user?.role, ["admin", "tenant_admin", "hospital_admin"]);
  const isSoloPractice = hospitalInfo?.is_solo_practice === true;
  
  let filteredNavItems = [];

  if (isSoloPractice && isAdminRole && hasDoctorRole) {
    // Solo Practice Mode: Merge Admin and Doctor interfaces + hide staff management modules
    const hiddenInSolo = ["doctors", "leave-management", "attendance-management"];
    const merged = navigationItems
      .filter(item => !hiddenInSolo.includes(item.id))
      .map(item => item.id === "dashboard" ? { ...item, label: "Admin Dashboard" } : item);
    
    doctorNavItems.forEach(item => {
        // Skip redundant or hidden items
        if (item.id === "Attendance" || hiddenInSolo.includes(item.id)) return;
        
        if (!merged.find(m => m.id === item.id)) {
            // Rename for clarity in solo mode
            const newItem = item.id === "doctorDashboard" ? { ...item, label: "Doctor Dashboard" } : item;
            merged.push(newItem);
        }
    });
    filteredNavItems = merged;
  } else if (hasDoctorRole && !isAdminRole) {
    filteredNavItems = doctorNavItems;
  } else {
    filteredNavItems = navigationItems;
  }

  const visibleNavItems = filteredNavItems.map(item => {
    const isModuleRestricted = item.subscriptionModule && isModuleDisabled(item.subscriptionModule);
    
    // Soft gate: specifically for AI_ANALYSIS, show as locked instead of hiding
    if (item.id === 'Copilot' && isModuleRestricted) {
      return { ...item, isLocked: true };
    }
    
    // Hard gate: hide everything else that is disabled
    if (isModuleRestricted) return null;
    
    return item;
  }).filter(item => {
    if (!item) return false;

    // 2. Hide everything else during loading to prevent flashing/gated UI leakage
    if (permissionsLoading || subscriptionLoading) return false;

    // 3. Admin-only restriction
    if (item.isAdminOnly) {
      if (!isAdminRole) return false;
    }

    // 4. RBAC (requiredModule)
    if (!item.requiredModule) return true;
    return hasModule(item.requiredModule);
  });

  const isActive = (path) => {
    if (path === location.pathname) return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 ${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo Section with Hover Toggle */}
          <div className="relative group h-16 flex items-center px-4 border-b border-gray-100 dark:border-gray-800 transition-all duration-300">
            <div className={`flex items-center gap-3 w-full ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
              <div className={`relative flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}>
                {/* Logo Container */}
                <div className={`flex-shrink-0 h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center overflow-hidden shadow-sm transition-opacity duration-200 ${isCollapsed ? 'group-hover:opacity-0' : ''}`}>
                  {hospitalInfo?.logo ? (
                    <img src={hospitalInfo.logo} alt="Logo" className="h-full w-full object-contain bg-white" />
                  ) : (
                    <Stethoscope className="h-5 w-5 text-white" />
                  )}
                </div>

                {!isCollapsed && (
                  <span className="font-bold text-gray-900 dark:text-white truncate animate-in fade-in slide-in-from-left-2 duration-300">
                    {hospitalInfo?.name || "MedAssist"}
                  </span>
                )}

                {/* Collapsed Hover Toggle (Replaces Logo) */}
                {isCollapsed && (
                  <button 
                    onClick={onToggleCollapse}
                    className="absolute inset-0 flex items-center justify-center h-9 w-9 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 active:scale-95 z-10"
                    title="Expand Sidebar"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                )}
              </div>

              {/* Expanded Desktop Toggle Button */}
              {!isCollapsed && (
                <button 
                  onClick={onToggleCollapse}
                  className="hidden lg:flex items-center justify-center h-7 w-7 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200 hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
                  title="Collapse Sidebar"
                >
                  <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400 rotate-180" />
                </button>
              )}
            </div>
            
            <button onClick={onClose} className="lg:hidden absolute top-1/2 -translate-y-1/2 right-2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-6 space-y-1 custom-scrollbar">
            {permissionsLoading || subscriptionLoading ? (
              /* Skeleton Loader */
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-3`}>
                  <div className="h-5 w-5 rounded bg-gray-200 dark:bg-gray-800 animate-pulse flex-shrink-0" />
                  {!isCollapsed && (
                    <div className="ml-3 h-4 w-32 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
                  )}
                </div>
              ))
            ) : (
              visibleNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                               const NavButton = (
                  <button
                    onClick={() => {
                      if (item.isLocked) return;
                      navigate(item.path);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    disabled={item.isLocked}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 rounded-lg text-sm font-medium transition-all group ${
                      active 
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                        : item.isLocked 
                          ? "text-gray-400 cursor-not-allowed opacity-60"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
                      <Icon className={`h-5 w-5 flex-shrink-0 ${active ? "text-blue-600 dark:text-blue-400" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"}`} />
                      {!isCollapsed && (
                        <span className="truncate animate-in fade-in slide-in-from-left-2 duration-300 ml-3">{item.label}</span>
                      )}
                    </div>
                    {!isCollapsed && active && <ChevronRight className="h-4 w-4 animate-in fade-in zoom-in duration-300" />}
                    {!isCollapsed && item.isLocked && <Shield className="h-3.5 w-3.5 text-orange-500 animate-pulse" />}
                  </button>
                );

                const tooltipMessage = item.isLocked 
                  ? "Your plan doesn't have AI features, please upgrade to access clinical copilot features." 
                  : item.label;

                return isCollapsed ? (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      {NavButton}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {tooltipMessage}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <div key={item.id}>
                    {item.isLocked ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {NavButton}
                        </TooltipTrigger>
                        <TooltipContent side="top" className="font-semibold bg-gradient-to-r from-orange-600 to-amber-600 border-none text-white shadow-2xl px-4 py-2 text-sm max-w-xs leading-relaxed animate-in slide-in-from-bottom-2">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {tooltipMessage}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      NavButton
                    )}
                  </div>
                );
              })
            )}
          </nav>
        </div>
      </aside>
    </TooltipProvider>
  );
}


