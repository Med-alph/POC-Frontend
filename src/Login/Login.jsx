import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { setCredentials } from "../features/auth/authSlice"
import { authAPI } from "../api/AuthAPI"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/components/ui/toast"; // ✅ shadcn 

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { addToast: toast } = useToast()

  const handleLogin = async () => {
    try {
      setError("")

      const response = await authAPI.login({ email, password })

      if (response.access_token && response.user) {
        // Store token and user data in Redux
        dispatch(setCredentials({
          access_token: response.access_token,
          user: response.user
        }))

        toast({
          title: "Login Successful 🎉",
          description: `Welcome back ${response.user.name}, redirecting to dashboard...`,
        })
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
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg p-6 sm:p-8">
        <CardHeader className="space-y-3 pb-6">
          <CardTitle className="text-center text-2xl font-bold">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Login to continue to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* New position for Forgot Password? */}
          <div className="flex justify-end -mt-3"> {/* Adjust margin to reduce space above link */}
            <a
              href="/forgotpassword"
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Forgot Password?
            </a>
          </div>

          {/* Error message */}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 py-5 text-base font-medium"
          >
            Login
          </Button>

          {/* Footer Links */}
          <div className="text-center text-sm text-gray-600 pt-2 space-y-2">
            <p>
              Don't have an account?{" "}
              <a
                href="/signup"
                className="text-blue-600 hover:underline font-medium"
              >
                Sign up
              </a>
            </p>
            <p>
              <a
                href="/tenantadmin/login"
                className="text-gray-500 hover:text-gray-700 hover:underline font-medium"
              >
                Tenant Admin Login
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}