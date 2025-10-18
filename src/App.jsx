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

// Component to conditionally render Navbar
function AppContent() {
  const location = useLocation()
  
  // Routes that should NOT show the navbar
  const authRoutes = ['/', '/signup', '/forgotpassword']
  const shouldShowNavbar = !authRoutes.includes(location.pathname)

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

        {/* Doctor view routes */}
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor-patient-record/:id" element={<DoctorPatientRecord />} />
        <Route path="/consultation/:id" element={<DoctorConsultation />} />
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
