import React, { useState } from "react"
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

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg p-6 sm:p-8">
        <CardHeader className="space-y-3 pb-6">
          <CardTitle className="text-center text-2xl font-bold">Welcome Back</CardTitle>
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
              className="pl-11 py-5"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
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

          {/* Login Button */}
          <Button className="w-full bg-blue-600 hover:bg-blue-700 py-5 text-base font-medium">
            Login
          </Button>

          {/* Footer Links */}
          <p className="text-center text-sm text-gray-600 pt-2">
            Don’t have an account?{" "}
            <a href="/signup" className="text-blue-600 hover:underline font-medium">
              Sign up
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
