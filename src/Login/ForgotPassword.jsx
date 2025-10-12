import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Mail, Loader2 } from "lucide-react" // 💡 Added Loader2
import { useToast } from "@/components/ui/toast"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { addToast: toast } = useToast()
  const navigate = useNavigate()

  // 💡 Converted to a proper handleSubmit for a <form>
  const handleSubmit = (e) => {
    e.preventDefault() // Prevent default form submission

    if (!email) {
      setError("Please enter your email address.")
      toast({
        title: "Missing Email ❗",
        description: "Enter your registered email address.",
        variant: "destructive",
      })
      return
    }

    // Clear previous errors and start loading
    setError("")
    setLoading(true)

    // Simulated API call for password reset
    setTimeout(() => {
      setLoading(false)
      toast({
        title: "Password Reset Link Sent ✉️",
        description: `Check your inbox (${email}) for a reset link.`,
      })
      // 💡 Added a slight delay before navigation for better UX
      setTimeout(() => {
        navigate("/login")
      }, 500)
    }, 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg p-6 sm:p-8">
        <CardHeader className="space-y-3 pb-6">
          <CardTitle className="text-center text-2xl font-bold">
            Forgot Password
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Enter your email and we’ll send you a reset link
          </CardDescription>
        </CardHeader>

        {/* 💡 Wrapped CardContent in a <form> for better submission handling */}
        <form onSubmit={handleSubmit}> 
          <CardContent className="space-y-6">
            {/* Email Input */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError("")
                }}
                className="pl-11 py-5"
              />
            </div>

            {/* Error message */}
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            {/* Submit Button */}
            <Button
              type="submit" // 💡 Changed to type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 py-5 text-base font-medium"
            >
              {loading ? (
                // 💡 Added rotating loading spinner for better feedback
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>

            {/* Footer */}
            <p className="text-center text-sm text-gray-600 pt-2">
              Remembered your password?{" "}
              <a
                // 💡 Changed from href="/login" to onClick={() => navigate("/login")}
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:underline font-medium cursor-pointer"
              >
                Go back to Login
              </a>
            </p>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}