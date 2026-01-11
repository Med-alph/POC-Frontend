// src/Login/Signup.jsx
import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Mail, User } from "lucide-react"
import { useNavigate } from "react-router-dom"
import TermsAcceptanceCheckbox from "@/components/compliance/TermsAcceptanceCheckbox"
import toast from 'react-hot-toast'

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSignup = () => {
    // Basic validation
    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (!termsAccepted) {
      toast.error("Please accept the Terms of Service and Privacy Policy to continue")
      return
    }

    // TODO: Implement actual signup logic with terms acceptance
    console.log("Signup data:", { ...formData, termsAccepted })
    toast.success("Account created successfully!")
    navigate("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="pb-0">
          <CardTitle className="text-2xl text-center">Sign Up</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {/* Username */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
            <Input
              type="text"
              name="username"
              placeholder="Username"
              className="pl-9 py-2"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
            <Input
              type="email"
              name="email"
              placeholder="Email"
              className="pl-9 py-2"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              className="pr-10 py-2"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              className="pr-10 py-2"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {/* Terms Acceptance */}
          <TermsAcceptanceCheckbox
            checked={termsAccepted}
            onCheckedChange={setTermsAccepted}
            required={true}
            className="py-2"
          />

          {/* Sign Up Button */}
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSignup}
            disabled={!termsAccepted}
          >
            Sign Up
          </Button>

          {/* Login Link */}
          <p className="text-sm text-center text-gray-500">
            Already have an account?{" "}
            <span
              className="text-blue-600 hover:underline cursor-pointer"
              onClick={() => navigate("/")}
            >
              Login
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
