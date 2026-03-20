import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearCredentials } from "../features/auth/authSlice";

import { Bell, ChevronDown, Search, LogOut, Stethoscope, Settings, Loader } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import tenantsuperadminapi from "../api/tenantsuperadminapi"
import HospitalListTable from "./Hospitals/HospitalListTable";
import StaffsRolesTab from "./StaffRoles/StaffsRolesTab";
import HospitalPatinets from "./Patients/HospitalPatients";
import RoleManagement from "./RoleManagement/RoleManagement";
import ProcedureList from "./Procedures/ProcedureList";
import { useAuth } from "../contexts/AuthContext";
import useAdminNotifications from "../hooks/useAdminNotifications";
import SuperAdminSupportTickets from "./SuperAdminSupportTickets";
import { isTenantSuperAdminPortal } from "../utils/subdomain";

export default function TenantAdminDashboard() {
  const NAVBAR_HEIGHT = 84; // height of navbar in px
  const { logout } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [tenantInfo, setTenantInfo] = useState(null);
  const [loadingTenant, setLoadingTenant] = useState(false);
  const [tenantError, setTenantError] = useState(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const tenantId = user?.tenant_id;

  const isTenantSuperAdminUser =
    user?.permissions?.includes("roles:manage") ||
    (typeof user?.role === "string" && user.role.toLowerCase() === "superadmin");

  const tenantSocketRole =
    isTenantSuperAdminPortal() && isTenantSuperAdminUser ? "superadmin" : "";

  useAdminNotifications(user?.id || null, null, {
    tenantId: user?.tenant_id,
    role: tenantSocketRole,
  });

  useEffect(() => {
    if (!tenantId) return;

    const fetchTenantInfo = async () => {
      setLoadingTenant(true);
      setTenantError(null);
      try {
        const data = await tenantsuperadminapi.getTenantInfo(tenantId);
        setTenantInfo(data);
      } catch (error) {
        setTenantError(error.message || "Failed to fetch tenant info");
        setTenantInfo(null);
      } finally {
        setLoadingTenant(false);
      }
    };

    fetchTenantInfo();
  }, [tenantId]);

  const handleLogout = async () => {
    await logout(true);
  };

  const Navbar = () => (
    <div
      className="w-full bg-white shadow-lg border-b border-gray-100 fixed top-0 left-0 z-50"
      style={{ height: NAVBAR_HEIGHT }}
    >
      <nav className="w-full flex items-center justify-between px-6 bg-gradient-to-r from-blue-600 to-blue-700 h-full">
        {/* Logo and Brand */}
        <div
          onClick={() => navigate("/dashboard")}
          className="flex items-center space-x-3 cursor-pointer select-none"
        >
          <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg hover:bg-white/30 transition duration-200">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white">MedAssist</span>
            <span className="text-xs text-blue-100 font-medium">Healthcare Management</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-white/10 transition duration-200 group select-none">
                <div className="h-10 w-10 shrink-0 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-sm border-2 border-white/30 group-hover:border-white/50 transition duration-200">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="hidden lg:block text-left max-w-[150px]">
                  <div className="text-sm font-semibold text-white truncate">{user?.name || "User"}</div>
                  <div className="text-xs text-blue-100 capitalize truncate">{user?.role || "Staff"}</div>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 text-white group-hover:rotate-180 transition duration-200" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px] mt-2">
              <div className="px-4 py-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg border border-blue-200">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{user?.name || "User"}</div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">{user?.email || "user@example.com"}</div>
                    <div className="text-[11px] text-blue-700 font-semibold uppercase tracking-wide mt-1.5">{user?.role || "Staff"}</div>
                  </div>
                </div>
              </div>
              <DropdownMenuItem onClick={handleLogout} className="px-4 py-3 text-red-600 hover:bg-red-50 cursor-pointer flex items-center m-1 rounded-md">
                <LogOut className="h-4 w-4 mr-3" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </div>
  );

  const showSupportTickets = isTenantSuperAdminPortal() && isTenantSuperAdminUser;

  const mainTabs = useMemo(
    () =>
      [
        { id: "overview", label: "Tenant Overview" },
        { id: "hospitals", label: "Hospitals" },
        { id: "procedures", label: "Master Procedures" },
        { id: "hospitals-staffs", label: "Hospitals Staffs" },
        { id: "roles-access", label: "Roles & Access" },
        { id: "hospitals-patients", label: "Hospitals Patients" },
        ...(showSupportTickets ? [{ id: "support-tickets", label: "Support Tickets" }] : []),
      ],
    [showSupportTickets]
  );

  useEffect(() => {
    if (activeTab === "support-tickets" && !showSupportTickets) {
      setActiveTab("overview");
    }
  }, [activeTab, showSupportTickets]);

  const renderTabs = () => (
    <div
      className="bg-white border-b border-gray-100 sticky z-40"
      style={{ top: NAVBAR_HEIGHT }}
    >
      <div className="px-6">
        <div className="flex space-x-1 overflow-x-auto">
          {mainTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 rounded-lg font-medium text-sm transition duration-200 whitespace-nowrap ${isActive
                  ? "bg-blue-50 text-blue-700 border-b-2 border-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderTenantOverview = () => {
    if (loadingTenant) {
      return (
        <div className="flex items-center space-x-2 text-gray-600">
          <Loader className="animate-spin h-5 w-5" />
          <span>Loading tenant details...</span>
        </div>
      );
    }

    if (tenantError) {
      return <p className="text-red-600 font-semibold">Error: {tenantError}</p>;
    }

    if (!tenantInfo) {
      return <p className="text-gray-600">No tenant information available.</p>;
    }

    return (
      <div className="mt-6 max-w-4xl p-6 bg-white rounded-lg shadow space-y-6 text-gray-800">
        <h2 className="text-3xl font-bold border-b pb-3">{tenantInfo.name}</h2>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoItem label="Legal Name" value={tenantInfo.legal_name || "N/A"} />
          <InfoItem label="Type" value={tenantInfo.type || "N/A"} />
          <InfoItem label="Email" value={tenantInfo.email || "N/A"} />
          <InfoItem label="Phone" value={tenantInfo.phone || "N/A"} />
          <InfoItem
            label="Website"
            value={
              tenantInfo.website ? (
                <a href={tenantInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  {tenantInfo.website}
                </a>
              ) : (
                "N/A"
              )
            }
          />
          <InfoItem label="Timezone" value={tenantInfo.timezone || "N/A"} />
          <InfoItem
            label="Working Hours"
            value={
              tenantInfo.working_hours_start && tenantInfo.working_hours_end
                ? `${tenantInfo.working_hours_start} - ${tenantInfo.working_hours_end}`
                : "N/A"
            }
          />
          <InfoItem label="Working Days" value={tenantInfo.working_days?.join(", ") || "N/A"} />
          <InfoItem label="Billing Contact" value={tenantInfo.billing_contact || "N/A"} />
          <InfoItem label="License No." value={tenantInfo.license_no || "N/A"} />
          <InfoItem label="Tax ID" value={tenantInfo.tax_id || "N/A"} />
          <InfoItem label="Status" value={tenantInfo.status || "N/A"} />
        </section>

        <section className="mt-6 border-t pt-4">
          <h3 className="text-xl font-semibold mb-3">Subscription Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PlanInfo label="Plan Type" value={tenantInfo.plan_type || "N/A"} />
            <PlanInfo
              label="Start Date"
              value={tenantInfo.plan_start ? new Date(tenantInfo.plan_start).toLocaleDateString() : "N/A"}
            />
            <PlanInfo
              label="End Date"
              value={tenantInfo.plan_end ? new Date(tenantInfo.plan_end).toLocaleDateString() : "N/A"}
            />
          </div>
        </section>

        <section className="mt-6 border-t pt-4">
          <h3 className="text-xl font-semibold mb-3">Address</h3>
          <address className="not-italic space-y-1 text-gray-700">
            <div>{tenantInfo.address_street || ""}</div>
            <div>
              {tenantInfo.address_city || ""}, {tenantInfo.address_state || ""} {tenantInfo.address_zip || ""}
            </div>
            <div>{tenantInfo.address_country || ""}</div>
          </address>
        </section>
      </div>
    );
  };

  const InfoItem = ({ label, value }) => (
    <div className="flex flex-col">
      <span className="text-sm font-semibold text-gray-500 mb-1">{label}</span>
      <span className="text-base text-gray-800">{value}</span>
    </div>
  );

  const PlanInfo = ({ label, value }) => (
    <div className="p-4 bg-blue-50 rounded-lg shadow-sm hover:shadow-md transition duration-200">
      <span className="block text-gray-500 text-sm mb-1">{label}</span>
      <span className="block font-semibold text-blue-700 text-lg">{value}</span>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderTenantOverview();
      case "hospitals":
        return <HospitalListTable />;
      case "procedures":
        return <ProcedureList />;
      case "hospitals-staffs":
        return <StaffsRolesTab />;
      case "roles-access":
        return <RoleManagement />;
      case "hospitals-patients":
        return <HospitalPatinets />
      case "support-tickets":
        return <SuperAdminSupportTickets />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-[84px]">
      <Navbar />
      {renderTabs()}
      <main className="p-6 max-w-6xl mx-auto">{renderContent()}</main>
    </div>
  );
}
