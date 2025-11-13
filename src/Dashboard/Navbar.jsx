import { Input } from "@/components/ui/input"
import { Bell, ChevronDown, Search, LogOut, Home, Users, Stethoscope, Calendar, Clock, Settings, CoinsIcon } from "lucide-react"
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
import useAdminNotifications from "../hooks/useAdminNotifications";
import toast from "react-hot-toast";
import notificationAPI from "../api/notificationapi";

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
  const notifications = useAdminNotifications(user?.id);
  const [unreadIds, setUnreadIds] = useState([]);

  useEffect(() => {
    const currentPath = location.pathname;
    const allNavItems = [...navigationItems, ...doctorNavItems];
    const activeItem = allNavItems.find((item) => item.path === currentPath);
    setActiveTab(activeItem?.id || "");
  }, [location.pathname]);

  useEffect(() => {
    console.log("Notifications updated:", notifications);
    const unread = notifications.filter(n => n.status !== "read").map(n => n.notificationId);
    setUnreadIds(unread);
    console.log("Unread notifications count computed:", unread.length);
  }, [notifications]);


  const handleLogout = () => {
    dispatch(clearCredentials());
    navigate("/");
  };

  const handleTabClick = (path) => {
    navigate(path);
    setShowNotifDropdown(false);
  };

  const filteredNavItems = user?.designation_group?.toLowerCase() === "doctor" ? doctorNavItems : navigationItems;
  const unreadCount = unreadIds.length;

  const toggleNotifications = () => {
    setShowNotifDropdown((prev) => !prev);
  };
  const handleNotificationClick = async (notif) => {
    console.log("Notification clicked:", notif);
    navigate("/notifications");
    setShowNotifDropdown(false);
    if (notif.status !== "read" && notif.notificationId) {
      try {
        await notificationAPI.markAsRead(notif.notificationId);
        setUnreadIds((prev) => {
          const updated = prev.filter(id => id !== notif.notificationId);
          console.log("Updated unreadIds after markAsRead:", updated);
          return updated;
        });
      } catch (e) {
        toast.error("Failed to mark notification as read");
        console.error("markAsRead error:", e);
      }
    }
  };


  return (
    <div className="w-full bg-white dark:bg-gray-900 shadow-xl border-b border-gray-200 dark:border-gray-800">
      <nav className="w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 shadow-lg">
        <div onClick={() => navigate("/dashboard")} className="flex items-center space-x-3 cursor-pointer group">
          <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300 shadow-lg">
            <Stethoscope className="h-7 w-7" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white tracking-tight">MedAssist</span>
            <span className="text-xs text-blue-100 font-medium">Healthcare Management</span>
          </div>
        </div>
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-4 top-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 -translate-y-1/2 z-10" />
            <Input
              type="text"
              placeholder="Search patients, doctors..."
              className="pl-12 pr-4 py-2.5 w-80 bg-white/15 backdrop-blur-sm border-white/30 text-white placeholder:text-blue-100 focus:bg-white focus:text-gray-900 focus:placeholder:text-gray-500 focus:border-white/50 transition-all duration-300 rounded-xl shadow-lg hover:bg-white/20"
            />
          </div>
          <button className="md:hidden p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 shadow-md">
            <Search className="h-5 w-5 text-white" />
          </button>
          <div className="relative">
            <button
              className="relative p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 group shadow-md"
              onClick={toggleNotifications}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-white group-hover:scale-110 transition-transform duration-200" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 text-xs font-bold bg-red-500 rounded-full h-5 w-5 flex items-center justify-center border-2 border-white text-white shadow-lg animate-pulse">
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
                <div className="absolute right-0 mt-3 w-96 max-h-[500px] overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 border border-gray-200 dark:border-gray-700 animate-in fade-in-0 zoom-in-95">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notifications
                        {unreadCount > 0 && (
                          <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-bold">
                            {unreadCount} new
                          </span>
                        )}
                      </h3>
                      <button
                        onClick={() => setShowNotifDropdown(false)}
                        className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                        aria-label="Close"
                      >
                        ✖
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No new notifications</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {notifications.map((notif, idx) => {
                          const isUnread = unreadIds.includes(notif.notificationId);
                          return (
                            <li
                              key={notif.notificationId || idx}
                              className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all ${
                                isUnread ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                              }`}
                              onClick={() => handleNotificationClick(notif)}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                                  isUnread ? 'bg-blue-600' : 'bg-transparent'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm font-semibold mb-1 ${
                                    isUnread 
                                      ? 'text-gray-900 dark:text-white' 
                                      : 'text-gray-700 dark:text-gray-300'
                                  }`}>
                                    {notif.message || "Notification"}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ""}
                                  </div>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-3 cursor-pointer p-2 rounded-xl hover:bg-white/10 transition-all duration-200 group">
                <div className="h-11 w-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-base border-2 border-white/30 group-hover:border-white/50 group-hover:scale-110 transition-all duration-200 shadow-lg">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="hidden lg:block">
                  <div className="text-sm font-bold text-white">{user?.name || "User"}</div>
                  <div className="text-xs text-blue-100">{user?.email || "user@example.com"}</div>
                  <div className="text-xs text-blue-200 font-medium capitalize">{user?.role || "Staff"}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-white group-hover:rotate-180 transition-transform duration-200" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 mt-2 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2">
              <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-t-xl -mx-2 -mt-2 mb-2">
                <div className="flex items-center space-x-3">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-bold text-gray-900 dark:text-white truncate">{user?.name || "User"}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{user?.email || "user@example.com"}</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold capitalize mt-1">{user?.role || "Staff"}</div>
                  </div>
                </div>
              </div>
              <DropdownMenuItem className="px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all cursor-pointer">
                <Settings className="h-5 w-5 mr-3 text-blue-600 dark:text-blue-400" />
                <span className="font-medium">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all cursor-pointer"
              >
                <LogOut className="h-5 w-5 mr-3" />
                <span className="font-medium">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {filteredNavItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.path)}
                  className={`flex items-center space-x-2 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 whitespace-nowrap relative group ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <IconComponent className={`h-5 w-5 transition-all duration-300 ${
                    isActive 
                      ? "text-white" 
                      : "text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                  }`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-b-xl" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
