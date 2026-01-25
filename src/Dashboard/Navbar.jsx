import { Bell, ChevronDown, LogOut, Home, Users, Stethoscope, Calendar, Clock, Settings, X, Package, Sparkles, MessageSquare, Shield, Mail, Banknote } from "lucide-react"
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
import notificationAPI from "../api/notificationapi";
import socketService from "../services/socketService";
import toast from "react-hot-toast";
import CopilotChat from "../components/CopilotChat";
import { usePermissions } from "../contexts/PermissionsContext";
import { UI_MODULES } from "../constants/Constant";
import { useHospital } from "../contexts/HospitalContext";

const navigationItems = [
  { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: Home, requiredModule: UI_MODULES.DASHBOARD },
  { id: "patients", label: "Patients", path: "/patients", icon: Users, requiredModule: UI_MODULES.PATIENTS },
  { id: "doctors", label: "Doctors", path: "/doctors", icon: Stethoscope, requiredModule: UI_MODULES.DOCTORS },
  { id: "appointments", label: "Appointments", path: "/appointments", icon: Calendar, requiredModule: UI_MODULES.APPOINTMENTS },
  { id: "inventory", label: "Inventory", path: "/inventory", icon: Package, requiredModule: UI_MODULES.INVENTORY },
  { id: "leave-management", label: "Leave Management", path: "/leave-management", icon: Calendar, requiredModule: UI_MODULES.LEAVE_MANAGEMENT },
  { id: "attendance-management", label: "Attendance Management", path: "/admin/attendance", icon: Clock, requiredModule: UI_MODULES.ATTENDANCE },
  { id: "reminders", label: "Reminders", path: "/reminders", icon: Clock, requiredModule: UI_MODULES.REMINDERS },
  { id: "notifications", label: "Notifications", path: "/notifications", icon: Bell, requiredModule: UI_MODULES.NOTIFICATIONS },
  { id: "cashier", label: "Cashier", path: "/cashier", icon: Banknote },
];

const doctorNavItems = [
  { id: "doctorDashboard", label: "Doctor-dashboard", path: "/doctor-dashboard", icon: Home, requiredModule: UI_MODULES.DASHBOARD },
  { id: "Attendance", label: "Attendance", path: "/doctor-attendance", icon: Clock, requiredModule: UI_MODULES.ATTENDANCE },
  { id: "FulfilledRecords", label: "Fulfilled Patient Records", path: "/fulfilled-records", icon: Users, requiredModule: UI_MODULES.PATIENTS },
  { id: "Gallery", label: "Patient Gallery", path: "/patient-gallery", icon: Users, requiredModule: UI_MODULES.GALLERY },
  { id: "Copilot", label: "Copilot", path: "/copilot", icon: Sparkles }, { id: "CancellationRequests", label: "Cancellation Requests", path: "/CancellationRequests", icon: Bell, requiredModule: UI_MODULES.CANCELLATION_REQUESTS },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { hospitalInfo } = useHospital();
  const { hasModule, loading: permissionsLoading } = usePermissions();
  const [activeTab, setActiveTab] = useState("");
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showCopilotChat, setShowCopilotChat] = useState(false);

  // Extract patientId from current route
  const getPatientIdFromRoute = () => {
    const path = location.pathname;
    // Check for /doctor-patient-record/:patientId pattern
    const patientRecordMatch = path.match(/\/doctor-patient-record\/([^/]+)/);
    if (patientRecordMatch) {
      return patientRecordMatch[1];
    }
    // Check for /patient-images/:patientId pattern
    const patientImagesMatch = path.match(/\/patient-images\/([^/]+)/);
    if (patientImagesMatch) {
      return patientImagesMatch[1];
    }
    // Check for query params
    const searchParams = new URLSearchParams(location.search);
    const patientIdFromQuery = searchParams.get('patientId');
    if (patientIdFromQuery) {
      return patientIdFromQuery;
    }
    return null;
  };

  const currentPatientId = getPatientIdFromRoute();

  // Connect to notifications for all users (admins and doctors)
  const isAdmin = user?.designation_group?.toLowerCase() !== "doctor";

  // Pass userId and hospitalId for all users to receive notifications
  const notifications = useAdminNotifications(
    user?.id || null,
    user?.hospital_id || null
  );
  const [unreadIds, setUnreadIds] = useState([]);

  useEffect(() => {
    const currentPath = location.pathname;
    const allNavItems = [...navigationItems, ...doctorNavItems];

    // Find active item - check for exact match first, then check if current path starts with item path
    let activeItem = allNavItems.find((item) => item.path === currentPath);

    // If no exact match found, check for parent route matches (e.g., /inventory should be active for /inventory/items)
    if (!activeItem) {
      activeItem = allNavItems.find((item) =>
        currentPath.startsWith(item.path + '/') ||
        (item.path !== '/' && currentPath.startsWith(item.path))
      );
    }

    setActiveTab(activeItem?.id || "");
  }, [location.pathname]);

  useEffect(() => {
    console.log("Notifications updated:", notifications);
    // For socket notifications, use a unique identifier (index or timestamp)
    // since they don't have notificationId yet
    const unread = notifications
      .filter(n => n.status !== "read")
      .map((n, idx) => n.notificationId || `socket-${idx}-${n.createdAt}`);
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

  // Determine navigation items based on role first, then designation_group
  const isDoctor = user?.role?.toLowerCase() === "doctor" ||
    (user?.designation_group?.toLowerCase() === "doctor" && user?.role?.toLowerCase() !== "receptionist");
  const filteredNavItems = isDoctor ? doctorNavItems : navigationItems;

  console.log('User role:', user?.role);
  console.log('User designation_group:', user?.designation_group);
  console.log('Is doctor navigation:', isDoctor);
  console.log('Using nav items:', isDoctor ? 'doctorNavItems' : 'navigationItems');

  // Filter navigation items based on user permissions
  const visibleNavItems = filteredNavItems.filter(item => {
    // If no required module specified, show the item
    if (!item.requiredModule) return true;

    // If permissions are still loading, don't show items that require permissions
    if (permissionsLoading) return false;

    // Check if user has permission for this module
    const hasPermission = hasModule(item.requiredModule);
    console.log(`Navigation item: ${item.label}, Required: ${item.requiredModule}, Has Permission: ${hasPermission}`);
    return hasPermission;
  });

  console.log('All filtered nav items:', filteredNavItems.map(item => item.label));
  console.log('Visible nav items:', visibleNavItems.map(item => item.label));
  console.log('Permissions loading:', permissionsLoading);

  const unreadCount = unreadIds.length;

  const toggleNotifications = () => {
    setShowNotifDropdown((prev) => !prev);
  };
  const handleNotificationClick = async (notif, idx) => {
    console.log("Notification clicked:", notif);

    // 1️⃣ Navigation Logic
    // Normalize type checking (handle both uppercase and lowercase)
    const notifType = (notif.notification_type || notif.notificationType || notif.type || '').toUpperCase();

    const isLeaveRequest =
      notifType === "LEAVE_REQUEST" ||
      notif.leave_request_id;

    const isImageUpload = notifType === "IMAGE_UPLOADED";

    const isSessionReview = notifType === "SESSION_REVIEWED";

    if (isLeaveRequest) {
      navigate("/leave-management");
    } else if (isImageUpload || isSessionReview) {
      // Navigate to patient gallery
      const patientId = notif.metadata?.patient_id || notif.patientId;
      if (patientId) {
        navigate(`/patient-gallery?patientId=${patientId}`);
      } else {
        navigate("/patient-gallery");
      }
    } else {
      navigate("/notifications");
    }

    setShowNotifDropdown(false);

    // 2️⃣ Local unread removal (instant UI update)
    const notifId =
      notif.notificationId ||
      notif.id ||
      `socket-${idx}-${notif.createdAt}`;

    setUnreadIds((prev) => {
      const updated = prev.filter((id) => id !== notifId);
      console.log("Notification marked as read locally:", notifId);
      return updated;
    });

    // 3️⃣ Mark as read in backend
    if (notif.status !== "read" && notif.notificationId) {
      try {
        await notificationAPI.markAsRead(notif.notificationId);
        console.log("✅ Successfully marked as read in backend");
      } catch (e) {
        console.log(
          "⚠️ Could not mark as read in backend (notification may not be in DB yet):",
          e.message
        );
      }
    }
  };



  return (
    <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <nav className="w-full flex items-center justify-between px-6 lg:px-8 h-16 bg-white dark:bg-gray-900">
        <div onClick={() => navigate("/dashboard")} className="flex items-center gap-3 cursor-pointer">
          <div className="h-9 w-9 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 overflow-hidden">
            {hospitalInfo?.logo ? (
              <img src={hospitalInfo.logo} alt={hospitalInfo.name} className="h-full w-full object-contain" />
            ) : (
              <Stethoscope className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-gray-900 dark:text-white">
              {hospitalInfo?.name || "MedAssist"}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {hospitalInfo?.name ? "Healthcare Management" : "Healthcare Management"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Copilot Chat Button */}
          <button
            className="relative p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => setShowCopilotChat(!showCopilotChat)}
            aria-label="Clinical Copilot"
            title={currentPatientId ? "Clinical Copilot" : "Open a patient to use Copilot"}
          >
            <MessageSquare className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            {!currentPatientId && (
              <span className="absolute -top-0.5 -right-0.5 text-xs font-semibold bg-gray-400 rounded-full h-3 w-3 flex items-center justify-center" title="No patient selected" />
            )}
          </button>

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
                        {notifications.map((notif, idx) => {
                          const notifId = notif.notificationId || `socket-${idx}-${notif.createdAt}`;
                          const isUnread = unreadIds.includes(notifId);
                          return (
                            <li
                              key={notifId}
                              className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${isUnread ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                }`}
                              onClick={() => handleNotificationClick(notif, idx)}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${isUnread ? 'bg-blue-600' : 'bg-transparent'
                                  }`} />
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm font-medium mb-1 ${isUnread
                                    ? 'text-gray-900 dark:text-white'
                                    : 'text-gray-700 dark:text-gray-300'
                                    }`}>
                                    {notif.message || "Notification"}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {notif.createdAt ? new Date(notif.createdAt).toLocaleString('en-IN', {
                                      timeZone: 'Asia/Kolkata',
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true
                                    }) : ""}
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
                          onClick={() => {
                            setUnreadIds([]);
                            setShowNotifDropdown(false);
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
              {(user?.role === 'Admin' || user?.designation_group === 'Admin') && (
                <>
                  <DropdownMenuItem
                    onClick={() => navigate('/hospital/settings')}
                    className="px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer transition-colors"
                  >
                    <Settings className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium">Hospital Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate('/hospital/consent')}
                    className="px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer transition-colors"
                  >
                    <Shield className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                    <span className="text-sm font-medium">Manage Patient Consent</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate('/hospital/email-notifications')}
                    className="px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer transition-colors"
                  >
                    <Mail className="h-4 w-4 mr-2 text-purple-500 dark:text-purple-400" />
                    <span className="text-sm font-medium">Email Notifications</span>
                  </DropdownMenuItem>
                </>
              )}
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
      </nav >

      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {visibleNavItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.path)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-md font-medium text-sm transition-colors whitespace-nowrap ${isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                >
                  <IconComponent className={`h-4 w-4 ${isActive
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

      {/* Copilot Chat */}
      <CopilotChat
        patientId={currentPatientId}
        visitId={null}
        isOpen={showCopilotChat}
        onClose={() => setShowCopilotChat(false)}
      />
    </div >
  );
}
