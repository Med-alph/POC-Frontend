import { useState, useEffect, useRef } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  Home,
  UserCircle2,
  Settings,
  X,
  CalendarDays,
  Phone,
  Image,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearCredentials } from "../features/auth/authSlice";
import { useNotifications } from "../hooks/useNotifications";
import toast from "react-hot-toast";
import notificationsAPI from "../api/notifications";

const patientNavItems = [
  { id: "patientDashboard", label: "Dashboard", path: "/patient-dashboard", icon: Home },
//   { id: "profile", label: "Profile", path: "/patient-details-form", icon: UserCircle2 },
];

// Tabs for patient flow
const PATIENT_TABS = [
  { key: "appointments", label: "Appointments", icon: CalendarDays },
  { key: "reminders", label: "Reminders", icon: Bell },
  { key: "calls", label: "Calls", icon: Phone },
  { key: "images", label: "Images", icon: Image },
  { key: "profile", label: "Profile", icon: UserCircle2 },
];

export default function PatientNavbar({ patientName, patientRole, activeTab: activeTabProp, onTabChange, patientId }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [activeNavTab, setActiveNavTab] = useState("");
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  
  // Use the new notifications hook - pass patientId if available
  const { notifications, counts, markAsRead, dismissAll, loading: notificationsLoading, refresh: refreshNotifications } = useNotifications({
    autoFetch: true,
    limit: 10,
    filter: 'all',
    userId: patientId, // Pass patient ID directly
  });

  // Track if we've already refreshed for this dropdown open
  const hasRefreshedRef = useRef(false);
  const dropdownOpenTimeRef = useRef(0);

  // Refresh notifications when dropdown opens (only once per open, with debounce)
  useEffect(() => {
    if (showNotifDropdown) {
      const now = Date.now();
      // Only refresh if dropdown just opened (not already open) and not currently loading
      if (!hasRefreshedRef.current && !notificationsLoading && (now - dropdownOpenTimeRef.current > 100)) {
        hasRefreshedRef.current = true;
        dropdownOpenTimeRef.current = now;
        refreshNotifications();
      }
    } else {
      // Reset flag when dropdown closes
      hasRefreshedRef.current = false;
      dropdownOpenTimeRef.current = 0;
    }
  }, [showNotifDropdown, notificationsLoading, refreshNotifications]);

  // Effect to update active tab on path change
  useEffect(() => {
    const currentPath = window.location.pathname;
    const activeItem = patientNavItems.find((item) => item.path === currentPath);
    setActiveNavTab(activeItem?.id || "");
  }, []);

  // Effect to update unreadIds only when notifications change meaningfully
//   useEffect(() => {
//     const unread = notifications
//       .filter((n) => n.status !== "read")
//       .map((n) => n.notificationId);

//     // Only update if values actually changed to avoid infinite loops
//     setUnreadIds((prevUnread) => {
//       if (
//         prevUnread.length === unread.length &&
//         prevUnread.every((id) => unread.includes(id))
//       ) {
//         return prevUnread; // no change
//       }
//       return unread;
//     });
//   }, [notifications]);

  const handleLogout = () => {
    dispatch(clearCredentials());
    navigate("/");
  };

  const handleTabClick = (path) => {
    navigate(path);
    setShowNotifDropdown(false);
  };

  const toggleNotifications = () => {
    const newState = !showNotifDropdown;
    setShowNotifDropdown(newState);
    // Don't refresh here - let the useEffect handle it to avoid multiple calls
  };

  const handleNotificationClick = async (notif) => {
    // Just mark as read, don't navigate
    setShowNotifDropdown(false);
    
    // Mark as read if unread
    if (notif.status !== "read" && notif.id) {
      try {
        await markAsRead(notif.id);
      } catch (e) {
        toast.error("Failed to mark notification as read");
      }
    }
  };

  const unreadCount = counts?.unread || 0;

  return (
    <>
      <div className="w-full fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <nav className="w-full flex items-center justify-between px-6 lg:px-8 h-16 bg-white dark:bg-gray-900">
          <div onClick={() => navigate("/patient-dashboard")} className="flex items-center gap-3 cursor-pointer">
            <div className="h-9 w-9 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
              <UserCircle2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold text-gray-900 dark:text-white">Patient Portal</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Manage Your Health</span>
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
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-80 max-h-[400px] overflow-hidden bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
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
                    <div className="max-h-[350px] overflow-y-auto">
                      {notificationsLoading ? (
                        <div className="text-center py-12 px-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Loading notifications...</p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="text-center py-12 px-4">
                          <Bell className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">No notifications</p>
                          {counts && counts.total > 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                              {counts.total} total ({counts.unread} unread) - Try refreshing
                            </p>
                          )}
                        </div>
                      ) : (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                          {notifications.slice(0, 10).map((notif, idx) => {
                            const isUnread = notif.status === 'unread';
                            return (
                              <li
                                key={notif.id || idx}
                                className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                                  isUnread ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                                }`}
                                onClick={() => handleNotificationClick(notif)}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${
                                      isUnread ? "bg-blue-600" : "bg-transparent"
                                    }`}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div
                                      className={`text-sm font-medium mb-1 ${
                                        isUnread
                                          ? "text-gray-900 dark:text-white"
                                          : "text-gray-700 dark:text-gray-300"
                                      }`}
                                    >
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
                      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            console.log('Manual refresh triggered');
                            refreshNotifications();
                          }}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          disabled={notificationsLoading}
                        >
                          {notificationsLoading ? 'Refreshing...' : 'Refresh'}
                        </button>
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
                        {notifications.length > 0 && (
                          <button
                            onClick={async () => {
                              try {
                                await dismissAll();
                                setShowNotifDropdown(false);
                              } catch (e) {
                                console.error("Failed to clear all notifications:", e);
                                toast.error("Failed to clear notifications");
                              }
                            }}
                            className="text-sm text-red-600 dark:text-red-400 hover:underline ml-auto"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
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
                      {patientName ? patientName.charAt(0).toUpperCase() : "U"}
                    </span>
                  </div>
                  <div className="hidden lg:block">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{patientName || "User"}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{patientRole || "Patient"}</div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 mt-2 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2">
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
              {/* Patient Flow Tabs - Only show if activeTab and onTabChange are provided */}
              {activeTabProp !== undefined && onTabChange && PATIENT_TABS.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTabProp === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => onTabChange(tab.key)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-md font-bold text-sm transition-colors whitespace-nowrap ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <IconComponent className={`h-4 w-4 ${isActive ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="pt-[96px]" /> {/* Spacer for fixed navbar height */}
    </>
  );
}
