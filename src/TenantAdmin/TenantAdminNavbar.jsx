import React from "react";
import { useSelector } from "react-redux";
import { 
  Bell, Menu, LogOut, ChevronDown, 
  Settings, User, HelpCircle, Layout
} from "lucide-react";
import SubscriptionBanner from "../components/SubscriptionBanner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "../contexts/AuthContext";

export default function TenantAdminNavbar({ onMenuClick, tenantInfo }) {
  const user = useSelector((state) => state.auth.user);
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout(true);
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sticky top-0 z-30 transition-colors duration-200">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden"
        >
          <Menu className="h-5 w-5 text-gray-500" />
        </button>

        <div className="hidden sm:flex flex-col">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
            Tenant Management Portal
          </h2>
        </div>
      </div>
      
      <SubscriptionBanner variant="navbar" />

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-all group border border-transparent hover:border-gray-100 dark:hover:border-gray-800">
              <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {user?.name || "User"}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider font-medium">
                  {user?.role || "Tenant Admin"}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-all group-hover:rotate-180" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2 mt-2 rounded-2xl shadow-xl border-gray-100 dark:border-gray-800 animate-in fade-in-0 zoom-in-95">
            <DropdownMenuLabel className="p-3">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 bg-gray-100 dark:bg-gray-800" />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="flex items-center gap-3 p-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            >
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <LogOut className="h-4 w-4" />
              </div>
              <span className="font-bold">Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
