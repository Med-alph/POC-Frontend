import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import TenantAdminSidebar from "./TenantAdminSidebar";
import TenantAdminNavbar from "./TenantAdminNavbar";
import tenantsuperadminapi from "../api/tenantsuperadminapi";
import { Loader2 } from "lucide-react";
import SubscriptionBanner from "../components/SubscriptionBanner";

export default function TenantAdminLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const user = useSelector((state) => state.auth.user);
  const tenantId = user?.tenant_id;
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    const fetchTenantInfo = async () => {
      setLoading(true);
      try {
        const data = await tenantsuperadminapi.getTenantInfo(tenantId);
        setTenantInfo(data);
      } catch (error) {
        console.error("Failed to fetch tenant info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenantInfo();
  }, [tenantId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl shadow-sm">
            <Loader2 className="h-10 w-10 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 animate-pulse uppercase tracking-widest text-[10px]">
            Initializing Management Portal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 transition-colors duration-200 overflow-hidden">
      <TenantAdminSidebar 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        tenantInfo={tenantInfo}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TenantAdminNavbar 
          tenantInfo={tenantInfo}
          onMenuClick={() => {
            if (window.innerWidth < 1024) {
              setIsMobileSidebarOpen(true);
            } else {
              setIsSidebarCollapsed(!isSidebarCollapsed);
            }
          }} 
        />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-gray-50/50 dark:bg-gray-950/50">
          <div className="p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Outlet context={{ tenantInfo }} />
          </div>
        </main>
      </div>
    </div>
  );
}
