import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { setCredentials } from "../features/auth/authSlice"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Mail, Lock, Eye, EyeOff, Shield } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import tenantsuperadminapi from "../api/tenantsuperadminapi"
import { complianceAPI } from "@/api/complianceapi"

export default function TenantAdminLogin() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Password reset flow state
  const [resetMode, setResetMode] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { addToast: toast } = useToast()

  // Store temporary tokens/information from initial login needed for reset api
  const [resetToken, setResetToken] = useState(null)
  const [userId, setUserId] = useState(null)

  // Handle initial admin login
  const handleLogin = async () => {
    setError("")
    setLoading(true)

    try {
      const response = await tenantsuperadminapi.login({ email, password })

      if (response.access_token && response.user) {
        if (response.user.mustChangePassword) {
          // Enter reset password mode
          setResetMode(true)
          setResetToken(response.access_token) // use access_token for auth to reset
          setUserId(response.user.id)
          toast({
            title: "Password Reset Required",
            description: "Please set a new password before accessing the admin panel.",
            variant: "warning",
          })
          setLoading(false)
          return
        }

        const userPermissions = response.user.permissions || []
        const isSuperAdmin =
          userPermissions.includes("roles:manage") || response.user.role === "superadmin"
        const isAdmin =
          userPermissions.includes("staff:assign_roles") || response.user.role === "admin"


        if (!isSuperAdmin && !isAdmin) {
          throw new Error("Access denied. Admin privileges required.")
        }

        // Store complete response in Redux (including uiModules)
        dispatch(setCredentials(response))

        toast({
          title: "Admin Login Successful 🎉",
          description: `Welcome ${response.user.name}, redirecting to admin panel...`,
        })

        setTimeout(() => {
          if (isSuperAdmin) {
            navigate("/dashboard")
          } else {
            // Non-tenant admin staff shouldn't really be here, but just in case
            navigate("/dashboard")
          }
        }, 1500)
      } else {
        throw new Error("Login failed - invalid response format")
      }
    } catch (error) {
      setError(error.message || "Invalid email or password")
      toast({
        title: "Admin Login Failed ❌",
        description: error.message || "Please check your credentials.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle password reset submission
  const handlePasswordReset = async () => {
    setError("")

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (!userId || !resetToken) {
      setError("Missing reset credentials, please login again.")
      return
    }

    setLoading(true)
    try {
      // Call API to update password - pass resetToken for auth
      await tenantsuperadminapi.resetPassword(userId, { newPassword }, resetToken)

      toast({
        title: "Password Reset Successful 🎉",
        description: "You can now log in with your new password.",
      })

      // Reset states and go back to login form
      setResetMode(false)
      setPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setResetToken(null)
      setUserId(null)
    } catch (error) {
      setError(error.message || "Failed to reset password.")
      toast({
        title: "Password Reset Failed ❌",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (resetMode) {
        handlePasswordReset()
      } else {
        handleLogin()
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-4 pb-6 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {resetMode ? "Reset Your Password" : "Admin Portal"}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {resetMode
              ? "Set a new password to continue"
              : "Sign in to access the admin dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!resetMode ? (
            <>
              {/* Email Input */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="email"
                  placeholder="Admin Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-11 py-5 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-11 pr-11 py-5 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* New Password Input */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-11 pr-11 py-5 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Confirm Password Input */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-11 pr-11 py-5 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
            </>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <Button
            onClick={resetMode ? handlePasswordReset : handleLogin}
            disabled={
              loading ||
              (!resetMode && (!email.trim() || !password.trim())) ||
              (resetMode && (!newPassword.trim() || !confirmPassword.trim()))
            }
            className="w-full bg-blue-600 hover:bg-blue-700 py-5 text-base font-medium disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{resetMode ? "Resetting..." : "Signing in..."}</span>
              </div>
            ) : (
              resetMode ? "Reset Password" : "Sign In"
            )}
          </Button>

          {/* Back to regular login */}
        </CardContent>
      </Card>
    </div>
  )
}
