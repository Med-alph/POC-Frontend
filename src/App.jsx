// src/App.jsx
import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"

import Dashboard from "./Dashboard/Dashboard"
import Patients from "./Patients/Patients"
import Login from "./Login/Login"
import Signup from "./Login/Signup"

function App() {
  return (
    <Router>
      <div className="min-h-svh flex flex-col">
        <Routes>
          {/* Auth Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* App Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
