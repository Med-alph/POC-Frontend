import { Bell, ChevronDown, LogOut, Home, Users, Stethoscope, Calendar, Clock, Settings, X, Package, Sparkles, MessageSquare, Shield, Mail, Monitor, Banknote, FileText, Clipboard, MessageSquareText, Menu } from "lucide-react"

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
import { useAuth } from "../contexts/AuthContext";
import ActiveSessions from "../components/ActiveSessions";
import SupportHubDialog from "../components/support/SupportHubDialog";

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
  { id: "invoice-reports", label: "Invoice Reports", path: "/admin/invoice-reports", icon: FileText, isAdminOnly: true },
  { id: "master-procedures", label: "Master Procedures", path: "/admin/master-procedures", icon: Clipboard, isAdminOnly: true, requiredModule: UI_MODULES.PROCEDURES },
  { id: "feedback", label: "Patient Feedback", path: "/hospital/feedback", icon: MessageSquare, isAdminOnly: true },
];

const doctorNavItems = [
  { id: "doctorDashboard", label: "Doctor-dashboard", path: "/doctor-dashboard", icon: Home, requiredModule: UI_MODULES.DASHBOARD },
  { id: "Attendance", label: "Attendance", path: "/doctor-attendance", icon: Clock, requiredModule: UI_MODULES.ATTENDANCE },
  { id: "FulfilledRecords", label: "Fulfilled Patient Records", path: "/fulfilled-records", icon: Users, requiredModule: UI_MODULES.PATIENTS },
  { id: "Gallery", label: "Patient Gallery", path: "/patient-gallery", icon: Users, requiredModule: UI_MODULES.GALLERY },
  { id: "Copilot", label: "Copilot", path: "/copilot", icon: Sparkles },
  { id: "CancellationRequests", label: "Cancellation Requests", path: "/CancellationRequests", icon: Bell, requiredModule: UI_MODULES.CANCELLATION_REQUESTS },
];

export default function Navbar({ onMenuClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { hospitalInfo } = useHospital();
  const { hasModule, loading: permissionsLoading } = usePermissions();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("");
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showCopilotChat, setShowCopilotChat] = useState(false);
  const [showActiveSessions, setShowActiveSessions] = useState(false);
  const [showSupportHub, setShowSupportHub] = useState(false);

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
  const socketRoleForNotifs = (() => {
    if (!user) return "";
    const rs = typeof user.role === "string" ? user.role.toLowerCase() : "";
    if (rs === "superadmin") return "superadmin";
    if (
      user.role === "Admin" ||
      user.designation_group === "Admin" ||
      user.role === "HOSPITAL_ADMIN" ||
      user.role === "tenant_admin"
    ) {
      return "admin";
    }
    return "";
  })();

  const { notifications, refreshHistory } = useAdminNotifications(
    user?.id || null,
    user?.hospital_id || null,
    { role: socketRoleForNotifs, tenantId: user?.tenant_id }
  );
  const notificationsList = notifications || [];
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
    console.log("Notifications updated:", notificationsList);
    const unread = notificationsList
      .filter(n => n.status !== "read")
      .map((n, idx) => n.notificationId || `socket-${idx}-${n.createdAt}`);
    setUnreadIds(unread);
    console.log("Unread notifications count computed:", unread.length);
  }, [notificationsList]);




  const handleLogout = async () => {
    await logout(true); // Use AuthContext logout which handles session revocation
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
    // 1. Check Admin Only restriction
    if (item.isAdminOnly) {
      const isAdmin = user?.role === 'Admin' || user?.designation_group === 'Admin' || user?.role === 'tenant_admin' || user?.role === 'HOSPITAL_ADMIN';
      if (!isAdmin) return false;
    }

    // 2. Check Module restriction
    if (!item.requiredModule) return true;

    // If permissions are still loading, wait
    if (permissionsLoading) return false;

    // Check if user has permission for this module
    return hasModule(item.requiredModule);
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
      // Just mark as read and close — no navigation
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
    <div className="w-full bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
      <nav className="w-full flex items-center justify-between px-4 lg:px-8 h-16">
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuClick}
            className="p-2 lg:hidden rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle Sidebar"
          >
            <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {isDoctor && (
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
          )}

          <div className="relative">
            <button
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={toggleNotifications}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 text-xs font-semibold bg-red-600 rounded-full h-4 w-4 flex items-center justify-center text-white text-[10px]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)} />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[500px] overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 border border-gray-200 dark:border-gray-700">
                  <div className="border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                       Notifications {unreadCount > 0 && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                    </h3>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notificationsList.length === 0 ? (
                      <div className="py-10 text-center text-gray-500 text-sm">No new notifications</div>
                    ) : (
                      <ul className="divide-y divide-gray-50 dark:divide-gray-800">
                        {notificationsList.slice(0, 10).map((notif, idx) => {
                          const id = notif.notificationId || idx;
                          return (
                            <li key={id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer" onClick={() => handleNotificationClick(notif, idx)}>
                              <p className="text-sm text-gray-800 dark:text-gray-200 mb-1">{notif.message}</p>
                              <p className="text-[10px] text-gray-400">{notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString() : ""}</p>
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
              <div className="flex items-center gap-2 cursor-pointer p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 mt-2">
              <div className="px-3 py-3 border-b">
                <p className="text-sm font-bold truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <DropdownMenuItem onClick={() => setShowActiveSessions(true)}>
                <Monitor className="h-4 w-4 mr-2" /> Active Sessions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowSupportHub(true)}>
                <MessageSquareText className="h-4 w-4 mr-2" /> Support Hub
              </DropdownMenuItem>
              {(user?.role === 'Admin' || user?.designation_group === 'Admin' || user?.role === 'HOSPITAL_ADMIN') && (
                <>
                  <DropdownMenuItem onClick={() => navigate('/hospital/settings')}>
                    <Settings className="h-4 w-4 mr-2" /> Hospital Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/hospital/consent')}>
                    <Shield className="h-4 w-4 mr-2 text-blue-500" /> Manage Patient Consent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/hospital/email-notifications')}>
                    <Mail className="h-4 w-4 mr-2 text-purple-500" /> Email Notifications
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <CopilotChat isOpen={showCopilotChat} onClose={() => setShowCopilotChat(false)} patientId={currentPatientId} />
      <ActiveSessions open={showActiveSessions} onOpenChange={setShowActiveSessions} />
      <SupportHubDialog open={showSupportHub} onOpenChange={setShowSupportHub} user={user} />
    </div>
  );
}
