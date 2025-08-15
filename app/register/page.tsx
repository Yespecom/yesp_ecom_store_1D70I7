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
import { ArrowLeft, User, Mail, Phone, Shield, AlertCircle } from "lucide-react"

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

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "+91", // Added country code state with default +91
    phone: "",
    otp: "",
    acceptTerms: false,
  })
  const [step, setStep] = useState<"details" | "phone" | "otp">("details")
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
        console.log("✅ reCAPTCHA v3 ready for registration")
      } catch (error) {
        console.error("❌ Failed to initialize reCAPTCHA v3:", error)
        setRecaptchaReady(false)
      }
    }

    if (step === "phone") {
      initRecaptcha()
    }
  }, [step])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const phoneParam = urlParams.get("phone")
    if (phoneParam) {
      const countryCode = countryCodes.find((c) => phoneParam.startsWith(c.code))
      if (countryCode) {
        setFormData((prev) => ({
          ...prev,
          countryCode: countryCode.code,
          phone: phoneParam.replace(countryCode.code, ""),
        }))
      } else {
        setFormData((prev) => ({ ...prev, phone: phoneParam }))
      }
    }
  }, [])

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.firstName.trim()) {
      setError("First name is required")
      return
    }
    if (!formData.lastName.trim()) {
      setError("Last name is required")
      return
    }
    if (!formData.email.trim()) {
      setError("Email is required")
      return
    }
    if (!formData.phone.trim()) {
      setError("Phone number is required")
      return
    }
    if (!formData.acceptTerms) {
      setError("Please accept the terms and conditions")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address")
      return
    }

    const fullPhoneNumber = `${formData.countryCode}${formData.phone}`
    if (!isValidE164Phone(fullPhoneNumber)) {
      setError("Please enter a valid phone number")
      return
    }

    setStep("phone")
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const fullPhoneNumber = `${formData.countryCode}${formData.phone}`
      console.log("Checking if user already exists...")
      const userCheck = await checkUserExists(fullPhoneNumber)

      if (userCheck.exists) {
        setError("Account already exists. Redirecting to login...")
        setTimeout(() => {
          router.push(`/login?phone=${encodeURIComponent(fullPhoneNumber)}`)
        }, 2000)
        setLoading(false)
        return
      }

      console.log("✅ New user, sending OTP...")
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

    try {
      const fullPhoneNumber = `${formData.countryCode}${formData.phone}`
      console.log("Verifying OTP...")
      const result = await verifyFirebaseOTP(
        confirmationResult,
        formData.otp,
        fullPhoneNumber,
        "registration",
        `${formData.firstName} ${formData.lastName}`,
        formData.email,
      )

      if (result.success && result.token && result.customer) {
        console.log("✅ Registration successful")
        console.log("Customer data:", result.customer)

        localStorage.setItem("auth_token", result.token)
        localStorage.setItem("user_data", JSON.stringify(result.customer))

        window.dispatchEvent(new Event("storage"))

        setError("Registration successful! Welcome to oneofwun!")
        setTimeout(() => {
          router.push("/")
        }, 1500)
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

  const handleBackToDetails = () => {
    setStep("details")
    setError("")
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url("/placeholder.svg?height=800&width=600&text=Join+oneofwun")`,
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="max-w-md text-center">
            <h1 className="text-4xl font-bold mb-6">Join oneofwun</h1>
            <p className="text-lg text-gray-200 mb-8">
              Create your account and discover exclusive fashion collections curated just for you.
            </p>
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Exclusive member-only collections</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Early access to new arrivals</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Personalized style recommendations</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Special member discounts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 sm:mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>

          <Card className="border-0 shadow-lg sm:shadow-xl bg-white/90 sm:bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6 sm:pb-8 px-4 sm:px-6">
              <Link href="/" className="flex items-center justify-center space-x-3 mb-4 sm:mb-6">
                <div className="relative w-10 h-7 sm:w-12 sm:h-8">
                  <Image
                    src="/placeholder.svg?height=32&width=48&text=Logo"
                    alt="oneofwun"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-xl sm:text-2xl font-bold text-gray-900">oneofwun</span>
              </Link>

              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">Create Account</CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600">
                {step === "details" && "Enter your details to get started"}
                {step === "phone" && "We'll send you a verification code"}
                {step === "otp" && "Enter the code sent to your phone"}
              </CardDescription>

              <div className="flex items-center justify-center space-x-2 mt-4 sm:mt-6">
                <div className={`w-5 sm:w-6 h-2 rounded-full ${step === "details" ? "bg-black" : "bg-gray-200"}`}></div>
                <div className={`w-5 sm:w-6 h-2 rounded-full ${step === "phone" ? "bg-black" : "bg-gray-200"}`}></div>
                <div className={`w-5 sm:w-6 h-2 rounded-full ${step === "otp" ? "bg-black" : "bg-gray-200"}`}></div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
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

              {step === "details" && (
                <form onSubmit={handleDetailsSubmit} className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                        First Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="firstName"
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="pl-10 h-12 border-gray-200 focus:border-black focus:ring-black rounded-lg text-base"
                          placeholder="John"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="h-12 border-gray-200 focus:border-black focus:ring-black rounded-lg text-base"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10 h-12 border-gray-200 focus:border-black focus:ring-black rounded-lg text-base"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone Number
                    </Label>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <Select
                        value={formData.countryCode}
                        onValueChange={(value) => setFormData({ ...formData, countryCode: value })}
                      >
                        <SelectTrigger className="w-full sm:w-32 h-12 border-gray-200 focus:border-black focus:ring-black rounded-lg">
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
                          className="pl-10 h-12 border-gray-200 focus:border-black focus:ring-black rounded-lg text-base"
                          placeholder="9876543210"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Enter your phone number without country code</p>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="terms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked as boolean })}
                      className="rounded border-gray-300 mt-1"
                    />
                    <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                      I agree to the{" "}
                      <Link href="/terms" className="text-black hover:text-gray-700 underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-black hover:text-gray-700 underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors text-base"
                  >
                    Continue
                  </Button>
                </form>
              )}

              {step === "phone" && (
                <form onSubmit={handleSendOtp} className="space-y-4 sm:space-y-6">
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-2">
                    <p className="text-sm text-gray-600">Creating account for:</p>
                    <p className="font-medium text-gray-900">
                      {formData.firstName} {formData.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{formData.email}</p>
                    <p className="text-sm text-gray-600">
                      {formData.countryCode}
                      {formData.phone}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Security Protection</Label>
                    <div className="flex items-center justify-center p-3 sm:p-4 border border-gray-200 rounded-lg bg-gray-50">
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
                    <p className="text-xs text-gray-500 text-center leading-relaxed">
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
                    <div id="recaptcha-container" className="hidden"></div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <Button
                      type="submit"
                      className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors text-base"
                      disabled={loading || !recaptchaReady}
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Sending OTP...
                        </div>
                      ) : (
                        "Send Verification Code"
                      )}
                    </Button>

                    <Button
                      type="button"
                      onClick={handleBackToDetails}
                      variant="outline"
                      className="w-full h-12 border-gray-200 hover:bg-gray-50 rounded-lg bg-transparent text-base"
                    >
                      Back to Details
                    </Button>
                  </div>
                </form>
              )}

              {step === "otp" && (
                <form onSubmit={handleVerifyOtp} className="space-y-4 sm:space-y-6">
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-2">
                    <p className="text-sm text-gray-600">Verification code sent to:</p>
                    <p className="font-medium text-gray-900">
                      {formData.countryCode}
                      {formData.phone}
                    </p>
                    <p className="text-xs text-green-600 mt-1">✅ OTP sent</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                      Enter Verification Code
                    </Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="otp"
                        type="text"
                        required
                        value={formData.otp}
                        onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, "") })}
                        className="pl-10 h-12 border-gray-200 focus:border-black focus:ring-black rounded-lg text-center text-lg sm:text-xl tracking-widest"
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>
                    <p className="text-xs text-gray-500">Enter the 6-digit code from your SMS</p>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <Button
                      type="submit"
                      className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors text-base"
                      disabled={loading || formData.otp.length !== 6}
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Creating Account...
                        </div>
                      ) : (
                        "Verify & Create Account"
                      )}
                    </Button>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                      <Button
                        type="button"
                        onClick={handleBackToPhone}
                        variant="outline"
                        className="w-full sm:flex-1 h-12 border-gray-200 hover:bg-gray-50 rounded-lg bg-transparent text-base"
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        onClick={handleResendOtp}
                        variant="outline"
                        className="w-full sm:flex-1 h-12 border-gray-200 hover:bg-gray-50 rounded-lg bg-transparent text-base"
                        disabled={loading}
                      >
                        Resend Code
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              <div className="text-center pt-4 sm:pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link href="/login" className="text-black hover:text-gray-700 font-medium">
                    Sign in here
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
