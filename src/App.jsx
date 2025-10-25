// src/App.jsx
import React from "react"
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom"

import Dashboard from "./Dashboard/Dashboard"
import Patients from "./Patients/Patients"
import Login from "./Login/Login"
import Signup from "./Login/Signup"
import Doctors from "./Doctors/Doctors"
import Appointments from "./Appointments/Appointments"
import Reminders from "./Reminders/Reminders"
import ForgotPassword from "./Login/ForgotPassword"

import TenantListPage from "./Owner/TenantList/TenantList"
import Navbar from "./Dashboard/Navbar"
import StaffListPage from "./Staff/StaffList"
import DoctorDashboard from "./Dashboard/DoctorDashboard"
import DoctorPatientRecord from "./Patients/PatientRecords/DoctorPatientRecord"
import DoctorConsultation from "./Doctors/DoctorConsultation"

// Doctor Appointment components
import DoctorAttendancePage from "./Doctors/Attendance/AttendancePage"

// Admin components
import AdminLogin from "./Admin/AdminLogin"
import AdminDashboard from "./Admin/AdminDashboard"
import RolesManagement from "./Admin/RolesManagement"
import PermissionsManagement from "./Admin/PermissionsManagement"
import StaffRoleAssignment from "./Admin/StaffRoleAssignment"
import ProtectedRoute from "./components/ProtectedRoute"

// Appoinment flow page
import PatientDetails from "./AppoinmentFlow/PatientDetails"
import OTPVerification from "./AppoinmentFlow/OTPVerification"
import AppointmentPage from "./AppoinmentFlow/AppointmentPage"
import ConfirmationPage from "./AppoinmentFlow/ConfirmationPage"
import LandingPage from "./AppoinmentFlow/LandingPage"
import PatientDetailsForm from "./AppoinmentFlow/PatientDetailsForm"

// Component to conditionally render Navbar
function AppContent() {
  const location = useLocation()



  // Routes that should NOT show the navbar
  const authRoutes = ['/', '/signup', '/forgotpassword', '/admin/login']
  const adminRoutes = ['/admin/login', '/admin/dashboard', '/admin/roles', '/admin/permissions', '/admin/staffs']
  const shouldShowNavbar = !authRoutes.includes(location.pathname) && !adminRoutes.includes(location.pathname)

  return (
    <div className="min-h-svh flex flex-col">
      {shouldShowNavbar && <Navbar />}
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />

        {/* App Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/TenantListPage" element={<TenantListPage />} />
        <Route path="/Staffs" element={<StaffListPage />} />
        <Route path="/doctor-attendance" element={<DoctorAttendancePage />} />

        {/* Doctor view routes */}
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
       <Route path="/doctor-patient-record/:patientId" element={<DoctorPatientRecord />} />

     <Route path="/consultation/:appointmentId" element={<DoctorConsultation />} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
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
        {/* Appointment Flow Routes */}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/patient-details" element={<PatientDetails />} />
        <Route path="/otp-verification" element={<OTPVerification />} />
        <Route path="/appointment" element={<AppointmentPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="/patient-details-form" element={<PatientDetailsForm />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App