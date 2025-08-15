"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { sendFirebaseOTP, verifyFirebaseOTP, checkUserExists, type ConfirmationResult } from "@/lib/firebase-auth"
import { isValidE164Phone } from "@/lib/otp-auth"
import { initializeRecaptchaV3 } from "@/lib/firebase"
import { ArrowLeft, Phone, Shield, AlertCircle } from "lucide-react"

const countryCodes = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+1", country: "USA", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+7", country: "Russia", flag: "🇷🇺" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
]

export default function LoginPage() {
  const [formData, setFormData] = useState({
    countryCode: "+91", // Added country code state with default +91
    phone: "",
    otp: "",
    rememberMe: false,
  })
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [recaptchaReady, setRecaptchaReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const initRecaptcha = async () => {
      try {
        await initializeRecaptchaV3()
        setRecaptchaReady(true)
        console.log("✅ reCAPTCHA v3 ready for login")
      } catch (error) {
        console.error("❌ Failed to initialize reCAPTCHA v3:", error)
        setRecaptchaReady(false)
      }
    }

    if (step === "phone") {
      initRecaptcha()
    }
  }, [step])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const fullPhoneNumber = `${formData.countryCode}${formData.phone}`

    if (!isValidE164Phone(fullPhoneNumber)) {
      setError("Please enter a valid phone number")
      setLoading(false)
      return
    }

    try {
      console.log("Checking if user exists...")
      const userCheck = await checkUserExists(fullPhoneNumber)

      if (!userCheck.exists) {
        setError("Account not found. Redirecting to registration...")
        setTimeout(() => {
          router.push(`/register?phone=${encodeURIComponent(fullPhoneNumber)}`)
        }, 2000)
        setLoading(false)
        return
      }

      console.log("✅ User exists, sending OTP...")
      const result = await sendFirebaseOTP(fullPhoneNumber)

      if (result.success && result.confirmationResult) {
        setConfirmationResult(result.confirmationResult)
        setStep("otp")
        setError("OTP sent successfully!")
        setTimeout(() => setError(""), 3000)
      } else {
        throw new Error(result.error || "Failed to send OTP")
      }
    } catch (error: any) {
      console.error("OTP request failed:", error)
      setError(error.message || "Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!confirmationResult) {
      setError("Please request OTP first")
      setLoading(false)
      return
    }

    const fullPhoneNumber = `${formData.countryCode}${formData.phone}`

    try {
      console.log("Verifying OTP...")
      const result = await verifyFirebaseOTP(
        confirmationResult,
        formData.otp,
        fullPhoneNumber,
        "login",
        undefined,
        undefined,
      )

      if (!result.success && result.error === "ACCOUNT_NOT_FOUND") {
        setError("Account not found. Redirecting to registration...")
        setTimeout(() => {
          router.push(`/register?phone=${encodeURIComponent(fullPhoneNumber)}`)
        }, 2000)
        setLoading(false)
        return
      }

      if (result.success && result.token && result.customer) {
        console.log("✅ Login successful")
        console.log("Customer data:", result.customer)

        localStorage.setItem("auth_token", result.token)
        localStorage.setItem("user_data", JSON.stringify(result.customer))

        window.dispatchEvent(new Event("storage"))

        setError("Login successful! Redirecting...")
        setTimeout(() => {
          router.push("/")
        }, 1000)
      } else {
        throw new Error(result.error || "Failed to verify OTP")
      }
    } catch (error: any) {
      console.error("OTP verification failed:", error)
      setError(error.message || "Invalid OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleBackToPhone = () => {
    setStep("phone")
    setError("")
    setConfirmationResult(null)
    setRecaptchaReady(false)
  }

  const handleResendOtp = async () => {
    setLoading(true)
    setError("")

    try {
      const fullPhoneNumber = `${formData.countryCode}${formData.phone}`
      const result = await sendFirebaseOTP(fullPhoneNumber)

      if (result.success && result.confirmationResult) {
        setConfirmationResult(result.confirmationResult)
        setError("OTP resent successfully!")
        setTimeout(() => setError(""), 3000)
      } else {
        throw new Error(result.error || "Failed to resend OTP")
      }
    } catch (error: any) {
      console.error("OTP resend failed:", error)
      setError(error.message || "Failed to resend OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshRecaptcha = async () => {
    setRecaptchaReady(false)
    try {
      await initializeRecaptchaV3()
      setRecaptchaReady(true)
      setError("")
    } catch (error) {
      console.error("❌ Failed to refresh reCAPTCHA:", error)
      setError("Failed to refresh security verification")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url("/placeholder.svg?height=800&width=600&text=Welcome+Back")`,
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="max-w-md text-center">
            <h1 className="text-4xl font-bold mb-6">Welcome Back</h1>
            <p className="text-lg text-gray-200 mb-8">
              Sign in to your oneofwun account and continue your fashion journey.
            </p>
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Access your order history</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Track your current orders</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Manage your wishlist</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Get personalized recommendations</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                  <Image
                    src="/placeholder.svg?height=32&width=48&text=Logo"
                    alt="oneofwun"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-2xl font-bold text-gray-900">oneofwun</span>
              </Link>

              <CardTitle className="text-2xl font-bold text-gray-900">Sign In</CardTitle>
              <CardDescription className="text-gray-600">
                {step === "phone" ? "Enter your phone number to continue" : "Enter the OTP sent to your phone"}
              </CardDescription>

              <div className="flex items-center justify-center space-x-2 mt-6">
                <div className={`w-8 h-2 rounded-full ${step === "phone" ? "bg-black" : "bg-gray-200"}`}></div>
                <div className={`w-8 h-2 rounded-full ${step === "otp" ? "bg-black" : "bg-gray-200"}`}></div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <div
                  className={`border px-4 py-3 rounded-lg text-sm flex items-center ${
                    error.includes("successfully")
                      ? "bg-green-50 border-green-200 text-green-600"
                      : "bg-red-50 border-red-200 text-red-600"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-3 ${
                      error.includes("successfully") ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                  {error}
                </div>
              )}

              {(error.includes("authorized domain") || error.includes("not properly configured")) && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-2">Firebase Configuration Issue</p>
                      <p className="mb-2">Authentication is not properly set up. This could be due to:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Missing environment variables</li>
                        <li>Domain not authorized in Firebase Console</li>
                        <li>Phone authentication not enabled</li>
                        <li>Firebase project configuration issues</li>
                      </ul>
                      <p className="mt-2 text-xs">Please contact support if this issue persists.</p>
                    </div>
                  </div>
                </div>
              )}

              {step === "phone" && (
                <form onSubmit={handleSendOtp} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone Number
                    </Label>
                    <div className="flex space-x-2">
                      <Select
                        value={formData.countryCode}
                        onValueChange={(value) => setFormData({ ...formData, countryCode: value })}
                      >
                        <SelectTrigger className="w-32 h-12 border-gray-200 focus:border-black focus:ring-black rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {countryCodes.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              <div className="flex items-center space-x-2">
                                <span>{country.flag}</span>
                                <span>{country.code}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
                          className="pl-10 h-12 border-gray-200 focus:border-black focus:ring-black rounded-lg"
                          placeholder="9876543210"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Enter your phone number without country code</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Security Protection</Label>
                    <div className="flex items-center justify-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                      {recaptchaReady ? (
                        <div className="flex items-center space-x-2 text-green-600 text-sm">
                          <Shield className="h-4 w-4" />
                          <span>Protected by reCAPTCHA v3</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-gray-500 text-sm">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                          <span>Initializing protection...</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      This site is protected by reCAPTCHA and the Google{" "}
                      <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </a>{" "}
                      and{" "}
                      <a href="https://policies.google.com/terms" className="text-blue-600 hover:underline">
                        Terms of Service
                      </a>{" "}
                      apply.
                    </p>
                    {/* Hidden container for Firebase reCAPTCHA */}
                    <div id="recaptcha-container" className="hidden"></div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="remember"
                      checked={formData.rememberMe}
                      onCheckedChange={(checked) => setFormData({ ...formData, rememberMe: checked as boolean })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="remember" className="text-sm text-gray-600">
                      Keep me signed in
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
                    disabled={loading || !recaptchaReady}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Sending OTP...
                      </div>
                    ) : (
                      "Send OTP"
                    )}
                  </Button>
                </form>
              )}

              {step === "otp" && (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm text-gray-600">Signing in with:</p>
                    <p className="font-medium text-gray-900">
                      {formData.countryCode}
                      {formData.phone}
                    </p>
                    <p className="text-xs text-green-600 mt-1">✅ OTP sent</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                      Enter OTP
                    </Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="otp"
                        type="text"
                        required
                        value={formData.otp}
                        onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, "") })}
                        className="pl-10 h-12 border-gray-200 focus:border-black focus:ring-black rounded-lg text-center text-lg tracking-widest"
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>
                    <p className="text-xs text-gray-500">Enter the 6-digit code from your SMS</p>
                  </div>

                  <div className="space-y-4">
                    <Button
                      type="submit"
                      className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
                      disabled={loading || formData.otp.length !== 6}
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Signing In...
                        </div>
                      ) : (
                        "Verify & Sign In"
                      )}
                    </Button>

                    <div className="flex space-x-4">
                      <Button
                        type="button"
                        onClick={handleBackToPhone}
                        variant="outline"
                        className="flex-1 h-12 border-gray-200 hover:bg-gray-50 rounded-lg bg-transparent"
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        onClick={handleResendOtp}
                        variant="outline"
                        className="flex-1 h-12 border-gray-200 hover:bg-gray-50 rounded-lg bg-transparent"
                        disabled={loading}
                      >
                        Resend OTP
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              <div className="text-center pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link href="/register" className="text-black hover:text-gray-700 font-medium">
                    Create one now
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
