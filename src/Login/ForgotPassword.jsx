import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { authAPI } from "../api/authapi"
import { useToast } from "@/components/ui/toast"
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  KeyRound,
} from "lucide-react"

// ─── Step Indicator ──────────────────────────────────────────────────────────
function StepIndicator({ currentStep }) {
  const steps = [
    { label: "Enter Email", icon: Mail },
    { label: "Verify Code", icon: ShieldCheck },
    { label: "New Password", icon: KeyRound },
  ]

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, idx) => {
        const stepNum = idx + 1
        const isCompleted = currentStep > stepNum
        const isActive = currentStep === stepNum
        const Icon = step.icon

        return (
          <React.Fragment key={stepNum}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 font-bold text-sm
                  ${isCompleted ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : ""}
                  ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-100" : ""}
                  ${!isCompleted && !isActive ? "bg-gray-100 text-gray-400 border-2 border-gray-200" : ""}
                `}
              >
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide ${
                  isActive ? "text-blue-600" : isCompleted ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`h-0.5 w-12 mx-1 mb-5 rounded-full transition-all duration-500 ${
                  currentStep > stepNum ? "bg-emerald-400" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── OTP Input Boxes ──────────────────────────────────────────────────────────
function OTPBoxes({ value, onChange, disabled }) {
  const inputs = useRef([])
  const otpArr = Array.from({ length: 6 }, (_, i) => value[i] || "")

  const handleChange = (e, idx) => {
    const digits = e.target.value.replace(/\D/g, "")
    if (!digits) {
      // User cleared this box
      const newOtp = [...otpArr]
      newOtp[idx] = ""
      onChange(newOtp.join(""))
      return
    }
    // Take last digit — handles the 2-char value when replacing a filled box
    const digit = digits.slice(-1)
    const newOtp = [...otpArr]
    newOtp[idx] = digit
    onChange(newOtp.join(""))
    if (idx < 5) inputs.current[idx + 1]?.focus()
  }

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      e.preventDefault()
      if (otpArr[idx]) {
        // Box has a value — clear it, stay here
        const newOtp = [...otpArr]
        newOtp[idx] = ""
        onChange(newOtp.join(""))
      } else if (idx > 0) {
        // Box is already empty — go back and clear previous
        const newOtp = [...otpArr]
        newOtp[idx - 1] = ""
        onChange(newOtp.join(""))
        inputs.current[idx - 1]?.focus()
      }
    }
    if (e.key === "ArrowLeft" && idx > 0) inputs.current[idx - 1]?.focus()
    if (e.key === "ArrowRight" && idx < 5) inputs.current[idx + 1]?.focus()
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length) {
      const newOtp = Array.from({ length: 6 }, (_, i) => pasted[i] || "")
      onChange(newOtp.join(""))
      inputs.current[Math.min(pasted.length, 5)]?.focus()
    }
    e.preventDefault()
  }

  const handleFocus = (e) => {
    // Select text so typing immediately replaces the existing digit
    e.target.select()
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => (inputs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={otpArr[idx]}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onFocus={handleFocus}
          disabled={disabled}
          autoFocus={idx === 0}
          className={`
            text-center text-lg font-bold rounded-xl border-2 outline-none transition-all duration-200
            ${otpArr[idx] ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-gray-50 text-gray-800"}
            focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          style={{ width: "2.75rem", height: "3.25rem" }}
        />
      ))}
    </div>
  )
}

// ─── Password Strength Bar ────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
    { label: "Special character", ok: /[^A-Za-z0-9]/.test(password) },
  ]
  const strength = checks.filter((c) => c.ok).length

  const colors = ["bg-gray-200", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-emerald-500"]
  const labels = ["", "Weak", "Fair", "Good", "Strong"]

  if (!password) return null

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < strength ? colors[strength] : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold ${strength <= 1 ? "text-red-500" : strength <= 2 ? "text-orange-500" : strength === 3 ? "text-yellow-600" : "text-emerald-600"}`}>
          {labels[strength]}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${c.ok ? "bg-emerald-500" : "bg-gray-300"}`} />
            <span className={`text-[11px] ${c.ok ? "text-emerald-700" : "text-gray-400"}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ForgotPassword() {
  const navigate = useNavigate()
  const { addToast: toast } = useToast()

  // Step state: 1 = email, 2 = otp, 3 = new password, 4 = success
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Form data
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Resend timer
  const [resendTimer, setResendTimer] = useState(0)
  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setTimeout(() => setResendTimer((prev) => prev - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  // ── Step 1: Request OTP ──
  const handleRequestOTP = async (e) => {
    e?.preventDefault()
    if (!email.trim()) {
      toast({ title: "Email required", description: "Please enter your registered email address.", variant: "destructive" })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      await authAPI.requestPasswordReset(email)
      toast({ title: "OTP Sent ✉️", description: "If an account exists for this email, a code has been sent." })
      setResendTimer(60)
      setStep(2)
    } catch (err) {
      // Still show generic success so we don't leak whether email exists
      toast({ title: "OTP Sent ✉️", description: "If an account exists for this email, a code has been sent." })
      setResendTimer(60)
      setStep(2)
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Verify OTP ──
  const handleVerifyOTP = async (e) => {
    e?.preventDefault()
    if (otp.length !== 6) {
      toast({ title: "Enter the code", description: "Please enter the full 6-digit code.", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      await authAPI.verifyResetOtp({ email, otp })
      toast({ title: "Code verified ✅", description: "Your identity has been confirmed. Set a new password below." })
      setStep(3)
    } catch (err) {
      toast({
        title: "Invalid or expired code",
        description: err.message || "The code is incorrect or has expired. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // ── Resend OTP ──
  const handleResend = async () => {
    if (resendTimer > 0) return
    setLoading(true)
    try {
      await authAPI.requestPasswordReset(email)
      toast({ title: "Code resent ✉️", description: "A fresh 6-digit code has been sent to your email." })
      setOtp("")
      setResendTimer(60)
    } catch {
      toast({ title: "Code resent ✉️", description: "A fresh 6-digit code has been sent to your email." })
      setOtp("")
      setResendTimer(60)
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3: Reset Password ──
  const handleResetPassword = async (e) => {
    e?.preventDefault()

    if (newPassword.length < 8) {
      toast({ title: "Weak password", description: "Password must be at least 8 characters.", variant: "destructive" })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure both password fields match.", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      await authAPI.resetPassword({ email, otp, newPassword })
      toast({ title: "Password updated 🎉", description: "Your password has been successfully changed. Please login." })
      setStep(4)
    } catch (err) {
      toast({
        title: "Reset failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4">
      {/* Decorative background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl shadow-blue-100/60 border border-white/50 p-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">

          {/* Back to login (steps 1-3) */}
          {step < 4 && (
            <button
              onClick={() => (step === 1 ? navigate("/") : setStep((s) => s - 1))}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              {step === 1 ? "Back to Login" : "Go back"}
            </button>
          )}

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                {step === 1 && <Mail className="w-5 h-5 text-white" />}
                {step === 2 && <ShieldCheck className="w-5 h-5 text-white" />}
                {step === 3 && <KeyRound className="w-5 h-5 text-white" />}
                {step === 4 && <CheckCircle2 className="w-5 h-5 text-white" />}
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {step === 1 && "Forgot Password"}
                {step === 2 && "Check your email"}
                {step === 3 && "Set new password"}
                {step === 4 && "All done!"}
              </h1>
            </div>
            <p className="text-sm text-gray-500 ml-[52px]">
              {step === 1 && "Enter your email and we'll send you a 6-digit code."}
              {step === 2 && `We sent a code to ${email}`}
              {step === 3 && "Choose a strong new password for your account."}
              {step === 4 && "Your password has been successfully updated."}
            </p>
          </div>

          {/* Step indicator */}
          {step < 4 && <StepIndicator currentStep={step} />}

          {/* ── STEP 1: Email ── */}
          {step === 1 && (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white placeholder-gray-400"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  "Send verification code"
                )}
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 text-center">
                  Enter the 6-digit code
                </label>
                <OTPBoxes value={otp} onChange={setOtp} disabled={loading} />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify code"
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-sm">
                <span className="text-gray-500">Didn't receive it?</span>
                {resendTimer > 0 ? (
                  <span className="text-gray-400 font-medium">Resend in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="text-blue-600 font-semibold hover:underline disabled:opacity-50"
                  >
                    Resend code
                  </button>
                )}
              </div>
            </form>
          )}

          {/* ── STEP 3: New Password ── */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* New Password */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white placeholder-gray-400"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrength password={newPassword} />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-10 pr-11 py-3 text-sm rounded-xl border-2 focus:outline-none focus:ring-2 transition-all bg-white placeholder-gray-400 ${
                      confirmPassword && confirmPassword !== newPassword
                        ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                        : "border-gray-200 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-500 font-medium mt-1">Passwords do not match</p>
                )}
                {confirmPassword && confirmPassword === newPassword && (
                  <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || newPassword !== confirmPassword || newPassword.length < 8}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Updating password...
                  </>
                ) : (
                  "Reset password"
                )}
              </button>
            </form>
          )}

          {/* ── STEP 4: Success ── */}
          {step === 4 && (
            <div className="text-center space-y-5 py-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-200 animate-in zoom-in-75 duration-500">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-gray-800">Password updated!</h2>
                <p className="text-sm text-gray-500">
                  You can now login to your account with your new password.
                </p>
              </div>
              <button
                onClick={() => navigate("/")}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>

        {/* Footer text */}
        {step < 4 && (
          <p className="text-center text-xs text-gray-400 mt-4">
            Remembered your password?{" "}
            <button onClick={() => navigate("/")} className="text-blue-500 hover:underline font-medium">
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  )
}