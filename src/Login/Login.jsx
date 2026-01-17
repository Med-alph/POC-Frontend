import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { setCredentials } from "../features/auth/authSlice"
import { authAPI } from "../api/authapi"
import { complianceAPI } from "@/api/complianceapi"
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
import { useToast } from "@/components/ui/toast"; // ✅ shadcn 
import { Link } from "react-router-dom"

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Password Reset State
  const [resetMode, setResetMode] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { addToast: toast } = useToast()

  const handleLogin = async () => {
    try {
      setError("")
      setIsLoading(true)

      const response = await authAPI.login({ email, password })

      if (response.access_token && response.user) {
        // Store complete response in Redux (including uiModules)
        dispatch(setCredentials(response))

        toast({
          title: "Login Successful 🎉",
          description: `Welcome back ${response.user.name}, redirecting to dashboard...`,
        })
        if (response.user.is_temporary_password) {
          toast({
            title: "Change Password Required",
            description: "Please set a new password to continue.",
            variant: "warning",
          });
          setResetMode(true); // Switch to reset UI in-place
          setIsLoading(false);
          return;
        }

        if (response.user.designation_group?.toLowerCase() === "doctor") {
          setTimeout(() => navigate("/doctor-dashboard"), 1500)
          return
        } else {
          setTimeout(() => navigate("/dashboard"), 1500)
        }

      } else {
        throw new Error("Login failed - invalid response format")
      }
    } catch (error) {
      console.error("Login failed:", error.message)
      setError("Invalid email or password")
      toast({
        title: "Login Failed ❌",
        description: error.message || "Please check your credentials.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

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

    setIsLoading(true)
    try {
      // Call standard change-password API
      // Since we just logged in, the token is already in Redux/localStorage from setCredentials above?
      // Wait, setCredentials was called, so auth token SHOULD be set.
      // However, typical flow implies we are "partially" logged in.
      // But based on handleLogin logic, we called dispatch(setCredentials(response)), so we have a token.

      await authAPI.changePassword({
        currentPassword: password, // The temp password they just typed
        newPassword: newPassword
      });

      toast({
        title: "Password Updated 🎉",
        description: "Your password has been changed. Please login with your new password.",
      })

      // Reset everything and go back to login
      setResetMode(false)
      setPassword("")
      setNewPassword("")
      setConfirmPassword("")
      // Optional: Clear credentials to force re-login with new pass
      // dispatch(clearCredentials()) // If you want them to re-enter credentials

    } catch (error) {
      setError(error.message || "Failed to reset password.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg p-6 sm:p-8">
        <CardHeader className="space-y-3 pb-6">
          <CardTitle className="text-center text-2xl font-bold">
            {resetMode ? "Set New Password" : "Welcome Back"}
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            {resetMode ? "Your temporary password has expired. Please set a new one." : "Login to continue to your account"}
          </CardDescription>

          {/* Compliance Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-blue-800">
                  This system contains confidential medical information. By logging in, you agree to our{" "}
                  <Link to="/privacy-policy" className="underline hover:text-blue-900">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link to="/terms-of-service" className="underline hover:text-blue-900">
                    Terms of Service
                  </Link>.
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Input */}
          {!resetMode ? (
            <>
              {/* Email Input */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 py-5"
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
                  className="pl-11 pr-11 py-5"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                  placeholder="New Password (min 8 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-11 pr-11 py-5"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Confirm Password Input */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-11 pr-11 py-5"
                />
              </div>
            </>
          )}

          {/* New position for Forgot Password? - Only show in login mode */}
          {!resetMode && (
            <div className="flex justify-end -mt-3"> {/* Adjust margin to reduce space above link */}
              <a
                href="/forgotpassword"
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Forgot Password?
              </a>
            </div>
          )}

          {/* Error message */}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          {/* Login Button */}
          <Button
            onClick={resetMode ? handlePasswordReset : handleLogin}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-5 text-base font-medium disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{resetMode ? "Updating Password..." : "Logging in..."}</span>
              </div>
            ) : (
              resetMode ? "Simulate Password Change & Re-Login" : "Login"
            )}
          </Button>

          {/* Footer Links */}
          <div className="text-center text-sm text-gray-600 pt-2 space-y-2">
            {/* <p>
              Don't have an account?{" "}
              <a
                href="/signup"
                className="text-blue-600 hover:underline font-medium"
              >
                Sign up
              </a>
            </p> */}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}