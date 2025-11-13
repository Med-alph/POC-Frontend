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
    <div className="w-full bg-white shadow-lg border-b border-gray-100">
      <nav className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
        <div onClick={() => navigate("/dashboard")} className="flex items-center space-x-3 cursor-pointer group">
          <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg group-hover:bg-white/30 transition-all duration-200">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white">MedAssist</span>
            <span className="text-xs text-blue-100 font-medium">Healthcare Management</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search patients, doctors..."
              className="pl-10 pr-4 py-2 w-80 bg-white/10 border-white/20 text-white placeholder:text-gray-200 focus:bg-white focus:text-gray-900 focus:placeholder:text-gray-500 transition-all duration-200"
            />
          </div>
          <button className="md:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200">
            <Search className="h-5 w-5 text-white" />
          </button>
          <div className="relative">
            <button
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 group"
              onClick={toggleNotifications}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-white group-hover:scale-110 transition-transform duration-200" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 text-xs font-bold bg-red-500 rounded-full h-4 w-4 flex items-center justify-center border-2 border-blue-700 text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-lg z-50 border border-gray-200">
                <h3 className="font-semibold p-3 border-b border-gray-200 text-gray-800">Notifications</h3>
                {notifications.length === 0 ? (
                  <p className="p-4 text-gray-600 text-sm text-center">No new notifications</p>
                ) : (
                  <ul>
                    {notifications.map((notif, idx) => (
                      <li
                        key={notif.notificationId || idx}
                        className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <div className="text-sm font-medium text-gray-900">{notif.message || "Notification"}</div>
                        <div className="text-xs text-gray-500">
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-white/10 transition-all duration-200 group">
                <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-sm border-2 border-white/30 group-hover:border-white/50 transition-all duration-200">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="hidden lg:block">
                  <div className="text-sm font-semibold text-white">{user?.name || "User"}</div>
                  <div className="text-xs text-white-500">{user?.email || "user@example.com"}</div>
                  <div className="text-xs text-white-600 font-medium capitalize">{user?.role || "Staff"}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-white group-hover:rotate-180 transition-transform duration-200" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 mt-2">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">{user?.name || "User"}</div>
                    <div className="text-xs text-gray-500">{user?.email || "user@example.com"}</div>
                    <div className="text-xs text-blue-600 font-medium capitalize">{user?.role || "Staff"}</div>
                  </div>
                </div>
              </div>
              <DropdownMenuItem className="px-4 py-2 text-gray-700 hover:bg-gray-50">
                <Settings className="h-4 w-4 mr-3" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="px-4 py-2 text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <div className="bg-white border-b border-gray-100">
        <div className="px-6">
          <div className="flex space-x-1 overflow-x-auto">
            {filteredNavItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.path)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${isActive
                      ? "bg-blue-50 text-blue-700 border-b-2 border-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                >
                  <IconComponent className={`h-4 w-4 ${isActive ? "text-blue-700" : "text-gray-500"}`} />
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
