import { Bell, ChevronDown, LogOut, Home, Users, Stethoscope, Calendar, Clock, Settings, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearCredentials } from "../features/auth/authSlice";
import { useNotifications } from "../hooks/useNotifications";
import toast from "react-hot-toast";
import notificationsAPI from "../api/notifications";

const navigationItems = [
  { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: Home },
  { id: "patients", label: "Patients", path: "/patients", icon: Users },
  { id: "doctors", label: "Doctors", path: "/doctors", icon: Stethoscope },
  { id: "appointments", label: "Appointments", path: "/appointments", icon: Calendar },
  { id: "reminders", label: "Reminders", path: "/reminders", icon: Clock },
  { id: "notifications", label: "Notifications", path: "/notifications", icon: Bell },
];

const doctorNavItems = [
  { id: "doctorDashboard", label: "Doctor-dashboard", path: "/doctor-dashboard", icon: Home },
  { id: "Attendance", label: "Attendance", path: "/doctor-attendance", icon: Clock },
  { id: "FulfilledRecords", label: "Fulfilled Patient Records", path: "/fulfilled-records", icon: Users },
  { id: "CancellationRequests", label: "Cancellation Requests", path: "/CancellationRequests", icon: Bell },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [activeTab, setActiveTab] = useState("");
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  
  // Use the new notifications hook
  const { notifications, counts, markAsRead, dismissAll } = useNotifications({
    autoFetch: true,
    limit: 10,
    filter: 'all',
  });

  useEffect(() => {
    const currentPath = location.pathname;
    const allNavItems = [...navigationItems, ...doctorNavItems];
    const activeItem = allNavItems.find((item) => item.path === currentPath);
    setActiveTab(activeItem?.id || "");
  }, [location.pathname]);


  const handleLogout = () => {
    dispatch(clearCredentials());
    navigate("/");
  };

  const handleTabClick = (path) => {
    navigate(path);
    setShowNotifDropdown(false);
  };

  const filteredNavItems = user?.designation_group?.toLowerCase() === "doctor" ? doctorNavItems : navigationItems;
  const unreadCount = counts?.unread || 0;

  const toggleNotifications = () => {
    setShowNotifDropdown((prev) => !prev);
  };
  
  const handleNotificationClick = async (notif) => {
    console.log("Notification clicked:", notif);
    
    // Just mark as read, don't navigate
    setShowNotifDropdown(false);
    
    // Mark as read if unread
    if (notif.status !== "read" && notif.id) {
      try {
        await markAsRead(notif.id);
      } catch (e) {
        toast.error("Failed to mark notification as read");
        console.error("markAsRead error:", e);
      }
    }
  };


  return (
    <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <nav className="w-full flex items-center justify-between px-6 lg:px-8 h-16 bg-white dark:bg-gray-900">
        <div onClick={() => navigate("/dashboard")} className="flex items-center gap-3 cursor-pointer">
          <div className="h-9 w-9 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
            <Stethoscope className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-gray-900 dark:text-white">MedAssist</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Healthcare Management</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              className="relative p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={toggleNotifications}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 text-xs font-semibold bg-red-600 rounded-full h-4 w-4 flex items-center justify-center text-white text-[10px]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-96 max-h-[500px] overflow-hidden bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                  <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        Notifications
                        {unreadCount > 0 && (
                          <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-medium">
                            {unreadCount} new
                          </span>
                        )}
                      </h3>
                      <button
                        onClick={() => setShowNotifDropdown(false)}
                        className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <Bell className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No new notifications</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {notifications.slice(0, 10).map((notif, idx) => {
                          const isUnread = notif.status === 'unread';
                          return (
                            <li
                              key={notif.id || idx}
                              className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                                isUnread ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                              }`}
                              onClick={() => handleNotificationClick(notif)}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${
                                  isUnread ? 'bg-blue-600' : 'bg-transparent'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm font-medium mb-1 ${
                                    isUnread 
                                      ? 'text-gray-900 dark:text-white' 
                                      : 'text-gray-700 dark:text-gray-300'
                                  }`}>
                                    {notif.title || "Notification"}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                    {notif.body || ""}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {notif.created_at ? new Date(notif.created_at).toLocaleString() : ""}
                                  </div>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {notifications.length > 0 && (
                      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between gap-2">
                        {notifications.length > 10 && (
                          <button
                            onClick={() => {
                              navigate("/notifications");
                              setShowNotifDropdown(false);
                            }}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View all notifications
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            try {
                              await dismissAll();
                              setShowNotifDropdown(false);
                            } catch (e) {
                              console.error("Failed to clear all notifications:", e);
                            }
                          }}
                          className="text-sm text-red-600 dark:text-red-400 hover:underline ml-auto"
                        >
                          Clear all
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="h-8 w-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </span>
                </div>
                <div className="hidden lg:block">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name || "User"}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{user?.role || "Staff"}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 mt-2 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2">
              <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name || "User"}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || "user@example.com"}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium capitalize mt-0.5">{user?.role || "Staff"}</div>
                  </div>
                </div>
              </div>
              <DropdownMenuItem className="px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer transition-colors">
                <Settings className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="px-3 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md cursor-pointer transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {filteredNavItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.path)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-md font-medium text-sm transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <IconComponent className={`h-4 w-4 ${
                    isActive 
                      ? "text-white" 
                      : "text-gray-500 dark:text-gray-400"
                  }`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
