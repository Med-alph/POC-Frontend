import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { getSubdomain, isTenantAdmin, isPlatformAppAdmin, isTenantSuperAdminPortal, isHospitalSubdomain } from "./utils/subdomain";
import { HospitalProvider, useHospital } from "./contexts/HospitalContext";
import { PermissionsProvider } from "./contexts/PermissionsContext";
import { AppAdminAuthProvider } from "./AppAdmin/contexts/AppAdminAuthContext";

// These are kept as eager imports because they are:
// - tiny utility/layout components (Navbar, Sidebar, Footer, Guards)
// - always rendered regardless of route
// - not page-level chunks worth deferring
import Navbar from "./Dashboard/Navbar";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import SessionTimeoutGuard from "./components/SessionTimeoutGuard";
import TermsGuard from "./components/compliance/TermsGuard";
import ErrorBoundary from "./components/ErrorBoundary";

// ─── Sub-App roots (lazy — each is a separate app mode) ──────────────────────
const TenantAdminApp = lazy(() => import("./TenantAdmin/TenantAdminApp"));
const AppAdminApp    = lazy(() => import("./AppAdmin/AppAdminApp"));

// ─── Auth / Public pages ──────────────────────────────────────────────────────
const Login          = lazy(() => import("./Login/Login"));
const ForgotPassword = lazy(() => import("./Login/ForgotPassword"));
const ChangePassword = lazy(() => import("./Login/ChangePassword"));

// ─── Patient appointment-flow pages ──────────────────────────────────────────
const LandingPage        = lazy(() => import("./AppoinmentFlow/LandingPage"));
const PatientDetails     = lazy(() => import("./AppoinmentFlow/PatientDetails"));
const OTPVerification    = lazy(() => import("./AppoinmentFlow/OTPVerification"));
const AppointmentPage    = lazy(() => import("./AppoinmentFlow/SimpleAppointmentPage"));
const ConfirmationPage   = lazy(() => import("./AppoinmentFlow/ConfirmationPage"));
const PatientDetailsForm = lazy(() => import("./AppoinmentFlow/PatientDetailsForm"));
const PatientDashboard   = lazy(() => import("./AppoinmentFlow/PatientDashboard"));
const AuthCallback       = lazy(() => import("./AppoinmentFlow/AuthCallback"));

// ─── Compliance pages ─────────────────────────────────────────────────────────
const PrivacyPolicyPage  = lazy(() => import("./components/compliance/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./components/compliance/TermsOfServicePage"));

// ─── Core hospital app pages ──────────────────────────────────────────────────
const Dashboard      = lazy(() => import("./Dashboard/Dashboard"));
const Patients       = lazy(() => import("./Patients/Patients"));
const Doctors        = lazy(() => import("./Doctors/Doctors"));
const Appointments   = lazy(() => import("./Appointments/Appointments"));
const Reminders      = lazy(() => import("./Reminders/Reminders"));
const Notifications  = lazy(() => import("./Dashboard/Notifications"));
const TenantListPage = lazy(() => import("./Owner/TenantList/TenantList"));

// ─── Staff / Admin pages ──────────────────────────────────────────────────────
const StaffListPage          = lazy(() => import("./Staff/StaffList"));
const AdminDashboard         = lazy(() => import("./Admin/AdminDashboard"));
const RolesManagement        = lazy(() => import("./Admin/RolesManagement"));
const PermissionsManagement  = lazy(() => import("./Admin/PermissionsManagement"));
const StaffRoleAssignment    = lazy(() => import("./Admin/StaffRoleAssignment"));
const LeaveManagement        = lazy(() => import("./Admin/LeaveManagement"));
const AdminAttendanceManagement = lazy(() => import("./Admin/AdminAttendanceManagement"));
const MasterProcedures       = lazy(() => import("./Admin/MasterProcedures"));
const MasterVaccines         = lazy(() => import("./Admin/MasterVaccines"));
const FeedbackAnalytics      = lazy(() => import("./Admin/FeedbackAnalytics"));

// ─── Doctor pages ─────────────────────────────────────────────────────────────
const DoctorDashboard       = lazy(() => import("./Dashboard/DoctorDashboard"));
const DoctorAttendance      = lazy(() => import("./Dashboard/DoctorAttendance"));
const DoctorPatientRecord   = lazy(() => import("./Patients/PatientRecords/DoctorPatientRecord"));
const DoctorConsultation    = lazy(() => import("./Doctors/DoctorConsultation"));
const PatientRecordsList    = lazy(() => import("./Doctors/PatientRecordsList"));
const FulfilledRecords      = lazy(() => import("./Doctors/FulfilledRecords"));
const CopilotPage           = lazy(() => import("./Doctors/CopilotPage"));
const DoctorCancellationRequests = lazy(() => import("./Doctors/DoctorCancellationRequests"));
const ProceduresPage        = lazy(() => import("./Doctors/ProceduresPage"));

// ─── Gallery pages ────────────────────────────────────────────────────────────
const DermImageComparison  = lazy(() => import("./Gallery/PatientGallery"));
const DynamicPatientGallery = lazy(() => import("./Gallery/DynamicPatientGallery"));
const PatientImagesPage    = lazy(() => import("./Gallery/PatientImagesPage"));

// ─── Hospital settings & support ─────────────────────────────────────────────
const HospitalAdminSettings    = lazy(() => import("./Settings/HospitalAdminSettings"));
const HospitalConsentManagement = lazy(() => import("./components/compliance/HospitalConsentManagement"));
const EmailTemplateManagement  = lazy(() => import("./components/email-templates/EmailTemplateManagement"));
const TicketChatPage           = lazy(() => import("./components/support/TicketChatPage"));

// ─── Billing pages ────────────────────────────────────────────────────────────
const BillingPage       = lazy(() => import("./Billing/BillingMainPage"));
const CashierDashboard  = lazy(() => import("./Billing/CashierDashboard"));
const InvoiceReports    = lazy(() => import("./Billing/InvoiceReports"));
const RevenueDashboard  = lazy(() => import("./Billing/RevenueDashboard"));

// ─── Inventory pages ──────────────────────────────────────────────────────────
const InventoryLayout    = lazy(() => import("./Inventory/InventoryLayout"));
const InventoryDashboard = lazy(() => import("./Inventory/InventoryDashboard"));
const ItemsPage          = lazy(() => import("./Inventory/ItemsPage"));
const CategoriesPage     = lazy(() => import("./Inventory/CategoriesPage"));
const TransactionsPage   = lazy(() => import("./Inventory/TransactionsPage"));

// ─── Pharmacy pages ───────────────────────────────────────────────────────────
const PharmacyLayout = lazy(() => import("./Pharmacy/PharmacyLayout"));
const PharmacyQueue  = lazy(() => import("./Pharmacy/PharmacyQueue"));
const OrderDetail    = lazy(() => import("./Pharmacy/OrderDetail"));
const PharmacyStats  = lazy(() => import("./Pharmacy/PharmacyStats"));

// ─── Clinical coding pages ────────────────────────────────────────────────────
const ClinicalCodingLayout = lazy(() => import("./ClinicalCoding/ClinicalCodingLayout"));
const CodingQueue          = lazy(() => import("./ClinicalCoding/CodingQueue"));
const CodingWorkspace      = lazy(() => import("./ClinicalCoding/CodingWorkspace"));

// ─── Page loading fallback ────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );
}

// ─── Main hospital app shell ──────────────────────────────────────────────────
function HospitalApp() {
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const authRoutes = ["/", "/forgotpassword", "/change-password", "/admin/login"];

  const adminRoutes = [
    "/admin/login", "/admin/dashboard", "/admin/roles", "/admin/permissions", "/admin/staffs",
    "/landing", "/patient-details", "/otp-verification", "/appointment", "/confirmation", "/patient-details-form"
  ];

  const patientRoutes = [
    "/landing", "/otp-verification", "/appointment", "/confirmation",
    "/patient-details", "/patient-details-form", "/patient-dashboard"
  ];

  const complianceRoutes = ["/privacy-policy", "/terms-of-service"];

  const shouldHideMainNavbar = ["/patient-dashboard"];

  const shouldShowNavbar =
    !authRoutes.includes(location.pathname) &&
    !adminRoutes.includes(location.pathname) &&
    !patientRoutes.includes(location.pathname) &&
    !shouldHideMainNavbar.includes(location.pathname) &&
    !complianceRoutes.includes(location.pathname);

  const shouldShowFooter  = shouldShowNavbar;
  const shouldShowSidebar = shouldShowNavbar;

  const shouldUseTermsGuard =
    !authRoutes.includes(location.pathname) &&
    !complianceRoutes.includes(location.pathname) &&
    !patientRoutes.includes(location.pathname);

  const { hospitalInfo, loading } = useHospital();

  if (loading && isHospitalSubdomain()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!loading && isHospitalSubdomain() && !hospitalInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">404 - Hospital Not Found</h1>
        <p className="text-gray-600">The hospital you are looking for does not exist or has been disabled.</p>
      </div>
    );
  }

  return (
    <div className="min-h-svh flex bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {shouldShowSidebar && (
        <Sidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {shouldShowNavbar && (
          <Navbar onMenuClick={() => {
            if (window.innerWidth < 1024) {
              setIsMobileSidebarOpen(true);
            } else {
              setIsSidebarCollapsed(!isSidebarCollapsed);
            }
          }} />
        )}

        <main className="flex-1">
          {/* All lazy-loaded routes are wrapped in ErrorBoundary + Suspense */}
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              {shouldUseTermsGuard ? (
                <TermsGuard>
                  <Routes>
                    {/* ── Core pages ── */}
                    <Route path="/dashboard"        element={<Dashboard />} />
                    <Route path="/patients"         element={<Patients />} />
                    <Route path="/doctors"          element={<Doctors />} />
                    <Route path="/appointments"     element={<Appointments />} />
                    <Route path="/leave-management" element={<LeaveManagement />} />
                    <Route path="/reminders"        element={<Reminders />} />
                    <Route path="/notifications"    element={<Notifications />} />

                    <Route path="/support/ticket/:ticketId" element={<TicketChatPage />} />
                    <Route path="/CancellationRequests"     element={<DoctorCancellationRequests />} />
                    <Route path="/procedures"               element={<ProceduresPage />} />
                    <Route path="/TenantListPage"           element={<TenantListPage />} />
                    <Route path="/Staffs"                   element={<StaffListPage />} />

                    {/* ── Hospital admin pages (permission-guarded) ── */}
                    <Route path="/hospital/consent" element={
                      <ProtectedRoute requiredPermissions={['HOSPITAL_ADMIN']}>
                        <HospitalConsentManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/hospital/email-notifications" element={
                      <ProtectedRoute requiredPermissions={['HOSPITAL_ADMIN']}>
                        <EmailTemplateManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/hospital/settings" element={
                      <ProtectedRoute requiredPermissions={['HOSPITAL_ADMIN']}>
                        <HospitalAdminSettings />
                      </ProtectedRoute>
                    } />
                    <Route path="/hospital/feedback" element={
                      <ProtectedRoute requiredPermissions={['HOSPITAL_ADMIN']}>
                        <FeedbackAnalytics />
                      </ProtectedRoute>
                    } />

                    {/* ── Inventory (nested layout) ── */}
                    <Route path="/inventory" element={<InventoryLayout />}>
                      <Route index             element={<InventoryDashboard />} />
                      <Route path="dashboard"  element={<InventoryDashboard />} />
                      <Route path="items"      element={<ItemsPage />} />
                      <Route path="categories" element={<CategoriesPage />} />
                      <Route path="transactions" element={<TransactionsPage />} />
                    </Route>

                    {/* ── Pharmacy (nested layout) ── */}
                    <Route path="/pharmacy" element={<PharmacyLayout />}>
                      <Route index                    element={<PharmacyQueue />} />
                      <Route path="queue"             element={<PharmacyQueue />} />
                      <Route path="orders/:orderId"   element={<OrderDetail />} />
                      <Route path="stats"             element={<PharmacyStats />} />
                    </Route>

                    {/* ── Medical Coding (nested layout) ── */}
                    <Route path="/medical-coding" element={<ClinicalCodingLayout />}>
                      <Route index                              element={<CodingQueue />} />
                      <Route path="queue"                      element={<CodingQueue />} />
                      <Route path="workspace/:consultationId"  element={<CodingWorkspace />} />
                    </Route>

                    {/* ── Doctor pages ── */}
                    <Route path="/doctor-dashboard"                  element={<DoctorDashboard />} />
                    <Route path="/doctor-attendance"                 element={<DoctorAttendance />} />
                    <Route path="/doctor-patient-record/:patientId"  element={<DoctorPatientRecord />} />
                    <Route path="/fulfilled-records"                 element={<FulfilledRecords />} />
                    <Route path="/patient-records"                   element={<PatientRecordsList />} />
                    <Route path="/patient-gallery"                   element={<DynamicPatientGallery />} />
                    <Route path="/patient-images/:patientId"         element={<PatientImagesPage />} />
                    <Route path="/copilot"                           element={<CopilotPage />} />
                    <Route path="/consultation/:appointmentId"       element={<DoctorConsultation />} />

                    {/* ── Admin pages ── */}
                    <Route path="/admin/dashboard" element={
                      <ProtectedRoute requiredPermissions={['staff:assign_roles']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/roles" element={
                      <ProtectedRoute requireSuperAdmin={true}>
                        <RolesManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/permissions" element={
                      <ProtectedRoute requireSuperAdmin={true}>
                        <PermissionsManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/staffs" element={
                      <ProtectedRoute requiredPermissions={['staff:assign_roles']}>
                        <StaffRoleAssignment />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/attendance" element={<AdminAttendanceManagement />} />
                    <Route path="/admin/invoice-reports" element={
                      <ProtectedRoute requiredPermissions={['HOSPITAL_ADMIN']}>
                        <InvoiceReports />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/revenue" element={
                      <ProtectedRoute requiredPermissions={['HOSPITAL_ADMIN']}>
                        <RevenueDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/master-procedures" element={
                      <ProtectedRoute requiredPermissions={['HOSPITAL_ADMIN']}>
                        <MasterProcedures />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/clinical-masters" element={
                      <ProtectedRoute requiredPermissions={['HOSPITAL_ADMIN']}>
                        <MasterVaccines />
                      </ProtectedRoute>
                    } />

                    {/* ── Appointment flow ── */}
                    <Route path="/landing"              element={<LandingPage />} />
                    <Route path="/patient-details"      element={<PatientDetails />} />
                    <Route path="/otp-verification"     element={<OTPVerification />} />
                    <Route path="/appointment"          element={<AppointmentPage />} />
                    <Route path="/confirmation"         element={<ConfirmationPage />} />
                    <Route path="/patient-details-form" element={<PatientDetailsForm />} />
                    <Route path="/patient-dashboard"    element={<PatientDashboard />} />
                    <Route path="/auth-callback"        element={<AuthCallback />} />

                    {/* ── Billing ── */}
                    <Route path="/billing/:appoinmentid" element={<BillingPage />} />
                    <Route path="/cashier"               element={<CashierDashboard />} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </TermsGuard>
              ) : (
                <Routes>
                  {/* ── Auth routes (no TermsGuard) ── */}
                  <Route path="/"               element={<Login />} />
                  <Route path="/forgotpassword" element={<ForgotPassword />} />
                  <Route path="/change-password" element={<ChangePassword />} />
                  <Route path="/reset-password"  element={<ForgotPassword />} />

                  {/* ── Patient flow (cookie-based auth, no TermsGuard) ── */}
                  <Route path="/landing"              element={<LandingPage />} />
                  <Route path="/patient-details"      element={<PatientDetails />} />
                  <Route path="/otp-verification"     element={<OTPVerification />} />
                  <Route path="/appointment"          element={<AppointmentPage />} />
                  <Route path="/confirmation"         element={<ConfirmationPage />} />
                  <Route path="/patient-details-form" element={<PatientDetailsForm />} />
                  <Route path="/patient-dashboard"    element={<PatientDashboard />} />
                  <Route path="/auth-callback"        element={<AuthCallback />} />

                  {/* ── Compliance pages (no TermsGuard, no Navbar) ── */}
                  <Route path="/privacy-policy"   element={<PrivacyPolicyPage />} />
                  <Route path="/terms-of-service" element={<TermsOfServicePage />} />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              )}
            </Suspense>
          </ErrorBoundary>
        </main>

        {shouldShowFooter && <Footer />}
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
function App() {
  const isTenantAdminMode = isTenantAdmin() || isTenantSuperAdminPortal();
  const isAppAdminMode    = isPlatformAppAdmin();

  return (
    <AppAdminAuthProvider>
      <PermissionsProvider>
        <Router>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              {isTenantAdminMode ? (
                <TenantAdminApp />
              ) : isAppAdminMode ? (
                <AppAdminApp />
              ) : (
                <HospitalProvider>
                  <HospitalApp />
                </HospitalProvider>
              )}
            </Suspense>
          </ErrorBoundary>
          <Toaster position="top-right" />
          <SessionTimeoutGuard />
        </Router>
      </PermissionsProvider>
    </AppAdminAuthProvider>
  );
}

export default App;
