import React from "react";
import { 
  CalendarDays, UserCircle2, Bell, Phone, Image, X, ChevronRight, Stethoscope, FileText, CreditCard
} from "lucide-react";
import { useHospital } from "@/contexts/HospitalContext";
import { 
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider 
} from "@/components/ui/tooltip";

const patientTabs = [
  { id: "appointments", label: "Appointments", icon: CalendarDays },
  { id: "records", label: "My Records", icon: FileText },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "reminders", label: "Reminders", icon: Bell },
  { id: "calls", label: "Calls", icon: Phone },
  { id: "images", label: "Images", icon: Image },
  { id: "profile", label: "Profile", icon: UserCircle2 },
];

export default function PatientSidebar({ isOpen, onClose, isCollapsed, onToggleCollapse, activeTab, onTabChange }) {
  const { hospitalInfo } = useHospital();

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
          {/* Logo Section */}
          <div className="relative group h-16 flex items-center px-4 border-b border-gray-100 dark:border-gray-800 transition-all duration-300">
            <div className={`flex items-center gap-3 w-full ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
              <div className={`relative flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}>
                <div className={`flex-shrink-0 h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center overflow-hidden shadow-sm transition-opacity duration-200 ${isCollapsed ? 'group-hover:opacity-0' : ''}`}>
                  {hospitalInfo?.logo ? (
                    <img src={hospitalInfo.logo} alt="Logo" className="h-full w-full object-contain bg-white p-1" />
                  ) : (
                    <Stethoscope className="h-5 w-5 text-white" />
                  )}
                </div>

                {!isCollapsed && (
                  <span className="font-bold text-gray-900 dark:text-white truncate animate-in fade-in slide-in-from-left-2 duration-300">
                    {hospitalInfo?.name || "Patient Portal"}
                  </span>
                )}

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
            {patientTabs.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              
              const NavButton = (
                <button
                  onClick={() => {
                    onTabChange(item.id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 rounded-lg text-sm font-medium transition-all group ${
                    active 
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
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
                </button>
              );

              return isCollapsed ? (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    {NavButton}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <div key={item.id}>{NavButton}</div>
              );
            })}
          </nav>
        </div>
      </aside>
    </TooltipProvider>
  );
}
