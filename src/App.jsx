import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Dashboard from "./Dashboard/Dashboard";
import Patients from "./Patients/Patients";
import Login from "./Login/Login";
// import Signup from "./Login/Signup"; // Commented out - not needed for now
import Doctors from "./Doctors/Doctors";
import Appointments from "./Appointments/Appointments";
import Reminders from "./Reminders/Reminders";
import ForgotPassword from "./Login/ForgotPassword";

import TenantListPage from "./Owner/TenantList/TenantList";
import Navbar from "./Dashboard/Navbar";
import StaffListPage from "./Staff/StaffList";
import DoctorDashboard from "./Dashboard/DoctorDashboard";
import DoctorPatientRecord from "./Patients/PatientRecords/DoctorPatientRecord";
import DoctorConsultation from "./Doctors/DoctorConsultation";
import DoctorAttendance from "./Dashboard/DoctorAttendance";

// Doctor Appointment components
import DoctorAttendancePage from "./Doctors/Attendance/AttendancePage"
import DermImageComparison from "./Gallery/PatientGallery"
import DynamicPatientGallery from "./Gallery/DynamicPatientGallery"
import PatientImagesPage from "./Gallery/PatientImagesPage"

import AdminLogin from "./Admin/AdminLogin";
import AdminDashboard from "./Admin/AdminDashboard";
import RolesManagement from "./Admin/RolesManagement";
import PermissionsManagement from "./Admin/PermissionsManagement";
import StaffRoleAssignment from "./Admin/StaffRoleAssignment";
import ProtectedRoute from "./components/ProtectedRoute";

// App Admin Components
import { AppAdminAuthProvider } from "./AppAdmin/contexts/AppAdminAuthContext";
import AppAdminLogin from "./AppAdmin/Login/AppAdminLogin";
import AppAdminProtectedRoute from "./AppAdmin/components/AppAdminProtectedRoute";
import AppAdminDashboard from "./AppAdmin/Dashboard/AppAdminDashboard";

import PatientDetails from "./AppoinmentFlow/PatientDetails";
import OTPVerification from "./AppoinmentFlow/OTPVerification";
import AppointmentPage from "./AppoinmentFlow/SimpleAppointmentPage";
import ConfirmationPage from "./AppoinmentFlow/ConfirmationPage";
import LandingPage from "./AppoinmentFlow/LandingPage";
import PatientDetailsForm from "./AppoinmentFlow/PatientDetailsForm";
import FulfilledRecords from "./Doctors/FulfilledRecords";
import CopilotPage from "./Doctors/CopilotPage";
import TenantAdminLogin from "./TenantAdmin/TenantAdminLogin";
import TenantAdminDashboard from "./TenantAdmin/TenantAdminDashboard";
import Notifications from "./Dashboard/Notifications";
import DoctorCancellationRequests from "./Doctors/DoctorCancellationRequests";
import LeaveManagement from "./Admin/LeaveManagement";
import AdminAttendanceManagement from "./Admin/AdminAttendanceManagement";

import BillingPage from "./Billing/BillingMainPage";
import PatientDashboard from "./AppoinmentFlow/PatientDashboard";
import AuthCallback from "./AppoinmentFlow/AuthCallback";

// Inventory Management
import InventoryLayout from "./Inventory/InventoryLayout";
import InventoryDashboard from "./Inventory/InventoryDashboard";
import ItemsPage from "./Inventory/ItemsPage";
import CategoriesPage from "./Inventory/CategoriesPage";
import TransactionsPage from "./Inventory/TransactionsPage";

// Permissions Context
import { PermissionsProvider } from "./contexts/PermissionsContext";

// Compliance Components
import PrivacyPolicyPage from "./components/compliance/PrivacyPolicyPage";
import TermsOfServicePage from "./components/compliance/TermsOfServicePage";
import TermsGuard from "./components/compliance/TermsGuard";
import HospitalConsentManagement from "./components/compliance/HospitalConsentManagement";
import EmailTemplateManagement from "./components/email-templates/EmailTemplateManagement";

// Footer Component
import Footer from "./components/Footer";

function AppContent() {
  const location = useLocation();

  // Routes that should NOT show the navbar
  const authRoutes = [
    "/", "/forgotpassword", "/admin/login", "/tenantadmin/dashboard", "/tenantadmin/login", "/app-admin/login"
  ];

  const adminRoutes = [
    "/admin/login", "/admin/dashboard", "/admin/roles", "/admin/permissions", "/admin/staffs",
    "/landing", "/patient-details", "/otp-verification", "/appointment", "/confirmation", "/patient-details-form"
  ];

  const patientRoutes = [
    "/landing", "/otp-verification", "/appointment", "/confirmation", "/patient-details", "/patient-details-form"
  ];

  // Compliance pages should not show navbar or be wrapped by TermsGuard
  const complianceRoutes = [
    "/privacy-policy", "/terms-of-service"
  ];

  const shouldHideMainNavbar = [
    "/patient-dashboard",
  ];

  const shouldShowNavbar =
    !authRoutes.includes(location.pathname) &&
    !adminRoutes.includes(location.pathname) &&
    !location.pathname.startsWith('/app-admin') && // Hide navbar for all app-admin routes
    !patientRoutes.includes(location.pathname) &&
    !shouldHideMainNavbar.includes(location.pathname) &&
    !complianceRoutes.includes(location.pathname); // Hide navbar on compliance pages

  const shouldShowFooter = shouldShowNavbar; // Show footer wherever navbar is shown

  // Check if current route should be wrapped by TermsGuard
  const shouldUseTermsGuard =
    !authRoutes.includes(location.pathname) &&
    !complianceRoutes.includes(location.pathname) &&
    !location.pathname.startsWith('/app-admin');

  return (
    <div className="min-h-svh flex flex-col">
      {shouldShowNavbar && <Navbar />}
      <div className="flex-1">
        {shouldUseTermsGuard ? (
          <TermsGuard>
            <Routes>
              {/* App Routes - Protected by TermsGuard */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/doctors" element={<Doctors />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/leave-management" element={<LeaveManagement />} />
              <Route path="/reminders" element={<Reminders />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/CancellationRequests" element={<DoctorCancellationRequests />} />
              <Route path="/TenantListPage" element={<TenantListPage />} />
              <Route path="/Staffs" element={<StaffListPage />} />
              <Route
                path="/hospital/consent"
                element={
                  <ProtectedRoute requiredPermissions={['HOSPITAL_ADMIN']}>
                    <HospitalConsentManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hospital/email-notifications"
                element={
                  <ProtectedRoute requiredPermissions={['HOSPITAL_ADMIN']}>
                    <EmailTemplateManagement />
                  </ProtectedRoute>
                }
              />

              {/* Inventory Management Routes */}
              <Route path="/inventory" element={<InventoryLayout />}>
                <Route index element={<InventoryDashboard />} />
                <Route path="dashboard" element={<InventoryDashboard />} />
                <Route path="items" element={<ItemsPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="transactions" element={<TransactionsPage />} />
              </Route>

              {/* Doctor view routes */}
              <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
              <Route path="/doctor-attendance" element={<DoctorAttendance />} />
              <Route path="/doctor-patient-record/:patientId" element={<DoctorPatientRecord />} />
              <Route path="/fulfilled-records" element={<FulfilledRecords />} />
              <Route path="/patient-gallery" element={<DynamicPatientGallery />} />
              <Route path="/patient-images/:patientId" element={<PatientImagesPage />} />
              <Route path="/copilot" element={<CopilotPage />} />

              <Route path="/consultation/:appointmentId" element={<DoctorConsultation />} />

              {/* Admin routes */}

              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute requiredPermissions={['staff:assign_roles']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/roles"
                element={
                  <ProtectedRoute requireSuperAdmin={true}>
                    <RolesManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/permissions"
                element={
                  <ProtectedRoute requireSuperAdmin={true}>
                    <PermissionsManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/staffs"
                element={
                  <ProtectedRoute requiredPermissions={['staff:assign_roles']}>
                    <StaffRoleAssignment />
                  </ProtectedRoute>
                }
              />
              <Route path="/admin/attendance" element={<AdminAttendanceManagement />} />

              {/* Appointment Flow Routes */}
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/patient-details" element={<PatientDetails />} />
              <Route path="/otp-verification" element={<OTPVerification />} />
              <Route path="/appointment" element={<AppointmentPage />} />
              <Route path="/confirmation" element={<ConfirmationPage />} />
              <Route path="/patient-details-form" element={<PatientDetailsForm />} />
              <Route path="/patient-dashboard" element={<PatientDashboard />} />
              <Route path="/auth-callback" element={<AuthCallback />} />

              {/* Billing */}
              <Route path="/billing/:appoinmentid" element={<BillingPage />} />
            </Routes>
          </TermsGuard>
        ) : (
          <Routes>
            {/* Auth Routes - No TermsGuard */}
            <Route path="/" element={<Login />} />
            <Route path="/forgotpassword" element={<ForgotPassword />} />
            <Route path="/tenantadmin/login" element={<TenantAdminLogin />} />
            <Route path="/tenantadmin/dashboard" element={<TenantAdminDashboard />} />
            <Route path="/app-admin/login" element={<AppAdminLogin />} />
            <Route path="/app-admin/*" element={
              <AppAdminProtectedRoute>
                <AppAdminDashboard />
              </AppAdminProtectedRoute>
            } />

            {/* Compliance Routes - No TermsGuard, No Navbar */}
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          </Routes>
        )}
      </div>
      {shouldShowFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AppAdminAuthProvider>
      <PermissionsProvider>
        <Router>
          <AppContent />
          <Toaster position="top-right" />
        </Router>
      </PermissionsProvider>
    </AppAdminAuthProvider>
  );
}

export default App;