"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Phone, User, ShieldCheck, Timer, Undo2 } from "lucide-react"
import { isValidE164Phone, requestPhoneOtp, verifyPhoneOtp } from "@/lib/otp-auth"
import { apiClient } from "@/lib/api"

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [info, setInfo] = useState<string>("")
  const [devCode, setDevCode] = useState<string>("")
  const [cooldown, setCooldown] = useState<number>(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  const canResend = useMemo(() => cooldown === 0, [cooldown])

  const handleRequestOtp = async () => {
    setError("")
    setInfo("")
    setDevCode("")
    if (!isValidE164Phone(phone)) {
      setError("Enter a valid phone e.g., +919234567890")
      return
    }
    setLoading(true)
    try {
      const res = await requestPhoneOtp({ phone, purpose: "registration", channel: "sms" })
      setInfo(res.message || "OTP sent")
      if (res.dev?.code) setDevCode(res.dev.code)
      setStep(2)
      setCooldown(60)
    } catch (e: any) {
      const code = e?.code
      if (code === "OTP_RATE_LIMIT_EXCEEDED") {
        setCooldown(600)
        setError("Too many requests. Please retry after 10 minutes.")
      } else {
        setError(e?.message || "Failed to send OTP")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setError("")
    setInfo("")
    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit OTP")
      return
    }
    setLoading(true)
    try {
      const displayName = name?.trim() || `Customer ${phone.slice(-4)}`
      const res = await verifyPhoneOtp({
        phone,
        otp,
        purpose: "registration",
        name: displayName,
        rememberMe: true,
      })
      // Save token and user, and sync ApiClient instance
      apiClient.setAuthToken(res.token)
      apiClient.setUserData(res.customer)
      // Trigger storage event for header update
      window.dispatchEvent(new Event("storage"))
      router.push("/?welcome=true")
    } catch (e: any) {
      const code = e?.code
      if (code === "OTP_EXPIRED") {
        setError("OTP expired. Please resend a new code.")
      } else if (code === "INVALID_OTP") {
        setError("Invalid OTP. Please try again.")
      } else if (code === "OTP_RATE_LIMIT_EXCEEDED") {
        setCooldown(600)
        setError("Too many attempts. Please retry after 10 minutes.")
      } else {
        setError(e?.message || "Verification failed. Try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const resetFlow = () => {
    setStep(1)
    setOtp("")
    setError("")
    setInfo("")
    setDevCode("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Left Side - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("/images/models-banner.jpg")' }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="max-w-md text-center">
            <h1 className="text-4xl font-bold mb-6">Join oneofwun</h1>
            <p className="text-lg text-gray-200 mb-8">
              Create your account with your phone number. No passwords needed.
            </p>
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Phone-first account, verify email later in profile</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>OTP valid for 10 minutes</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Fast, secure, and convenient</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <Link href="/" className="flex items-center justify-center space-x-3 mb-6">
                <div className="relative w-12 h-8">
                  <Image src="/images/oneofwun-logo.png" alt="oneofwun" fill className="object-contain" />
                </div>
                <span className="text-2xl font-bold text-gray-900">oneofwun</span>
              </Link>

              <CardTitle className="text-2xl font-bold text-gray-900">Create Account with OTP</CardTitle>
              <CardDescription className="text-gray-600">
                {step === 1 ? "Start with your phone number" : "Enter the 6-digit OTP and your name"}
              </CardDescription>

              <div className="flex items-center justify-center space-x-2 mt-6">
                <div className={`w-8 h-2 rounded-full ${step >= 1 ? "bg-black" : "bg-gray-200"}`}></div>
                <div className={`w-8 h-2 rounded-full ${step >= 2 ? "bg-black" : "bg-gray-200"}`}></div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <div
                  className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm"
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </div>
              )}
              {info && (
                <div
                  className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm"
                  aria-live="polite"
                >
                  {info}
                </div>
              )}
              {devCode && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
                  Dev mode: Use OTP {devCode}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10 h-12 border-gray-200 focus:border-black focus:ring-black rounded-lg"
                        placeholder="+14155552671 or +911234567890"
                      />
                    </div>
                    <p className="text-xs text-gray-500 flex items-center">
                      <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                      We&apos;ll send a 6‑digit OTP. Standard rates apply.
                    </p>
                  </div>

                  <Button
                    onClick={handleRequestOtp}
                    className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Your Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 h-12 border-gray-200 focus:border-black focus:ring-black rounded-lg"
                        placeholder="e.g., Alice"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Optional. We&apos;ll use a friendly default if left blank.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                      One-Time Password
                    </Label>
                    <Input
                      id="otp"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="h-12 border-gray-200 focus:border-black focus:ring-black rounded-lg tracking-widest text-center text-lg"
                      placeholder="••••••"
                      aria-label="Enter 6-digit OTP"
                    />
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="flex items-center">
                        <Timer className="h-3.5 w-3.5 mr-1" />
                        Expires in 10 minutes
                      </span>
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        disabled={!canResend || loading}
                        className={`font-medium ${canResend ? "text-black hover:underline" : "text-gray-400 cursor-not-allowed"}`}
                      >
                        {canResend ? "Resend code" : `Resend in ${cooldown}s`}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleVerifyOtp}
                      className="flex-1 h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg"
                      disabled={loading}
                    >
                      {loading ? "Verifying..." : "Verify & Create Account"}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetFlow} className="h-12 bg-transparent">
                      <Undo2 className="h-4 w-4 mr-2" />
                      Change phone
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500 text-center">
                    Phone-first accounts can add/verify email later in Profile.
                  </div>
                </div>
              )}

              <div className="text-center pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link href="/login" className="text-black hover:text-gray-700 font-medium">
                    Sign in instead
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
