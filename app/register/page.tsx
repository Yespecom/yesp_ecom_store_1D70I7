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
import { sendFirebaseOTP, verifyFirebaseOTP, type ConfirmationResult } from "@/lib/firebase-auth"
import { isValidE164Phone } from "@/lib/otp-auth"
import { ArrowLeft, User, Mail, Phone, Shield, AlertCircle, RefreshCw } from "lucide-react"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
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
    if (step === "phone") {
      const checkRecaptcha = () => {
        const container = document.getElementById("recaptcha-container")
        if (container && container.children.length > 0) {
          setRecaptchaReady(true)
        } else {
          setRecaptchaReady(false)
        }
      }

      checkRecaptcha()
      const interval = setInterval(checkRecaptcha, 1000)

      return () => clearInterval(interval)
    }
  }, [step])

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

    if (!isValidE164Phone(formData.phone)) {
      setError("Please enter a valid phone number with country code (e.g., +919876543210)")
      return
    }

    setStep("phone")
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log("Sending Firebase OTP for registration...")
      const result = await sendFirebaseOTP(formData.phone)

      if (result.success && result.confirmationResult) {
        setConfirmationResult(result.confirmationResult)
        setStep("otp")
        console.log("Firebase OTP sent successfully")
      } else {
        throw new Error(result.error || "Failed to send OTP")
      }
    } catch (error: any) {
      console.error("Firebase OTP request failed:", error)
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
      console.log("Verifying Firebase OTP for registration...")
      const result = await verifyFirebaseOTP(
        confirmationResult,
        formData.otp,
        formData.phone,
        "registration",
        `${formData.firstName} ${formData.lastName}`,
        formData.email,
      )

      if (result.success && result.token && result.customer) {
        console.log("Registration successful")
        localStorage.setItem("auth_token", result.token)
        localStorage.setItem("user_data", JSON.stringify(result.customer))
        window.dispatchEvent(new Event("storage"))
        router.push("/")
      } else {
        throw new Error(result.error || "Failed to verify OTP")
      }
    } catch (error: any) {
      console.error("Firebase OTP verification failed:", error)
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
      const result = await sendFirebaseOTP(formData.phone)

      if (result.success && result.confirmationResult) {
        setConfirmationResult(result.confirmationResult)
        setError("OTP resent successfully!")
        setTimeout(() => setError(""), 3000)
      } else {
        throw new Error(result.error || "Failed to resend OTP")
      }
    } catch (error: any) {
      console.error("Firebase OTP resend failed:", error)
      setError(error.message || "Failed to resend OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshRecaptcha = () => {
    const container = document.getElementById("recaptcha-container")
    if (container) {
      container.innerHTML = ""
      setRecaptchaReady(false)
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
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

              <CardTitle className="text-2xl font-bold text-gray-900">Create Account</CardTitle>
              <CardDescription className="text-gray-600">
                {step === "details" && "Enter your details to get started"}
                {step === "phone" && "We'll send you a verification code"}
                {step === "otp" && "Enter the code sent to your phone"}
              </CardDescription>

              <div className="flex items-center justify-center space-x-2 mt-6">
                <div className={`w-6 h-2 rounded-full ${step === "details" ? "bg-black" : "bg-gray-200"}`}></div>
                <div className={`w-6 h-2 rounded-full ${step === "phone" ? "bg-black" : "bg-gray-200"}`}></div>
                <div className={`w-6 h-2 rounded-full ${step === "otp" ? "bg-black" : "bg-gray-200"}`}></div>
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

              {step === "details" && (
                <form onSubmit={handleDetailsSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
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
                          className="pl-10 h-12 border-gray-200 focus:border-black focus:ring-black rounded-lg"
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
                        className="h-12 border-gray-200 focus:border-black focus:ring-black rounded-lg"
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
                        className="pl-10 h-12 border-gray-200 focus:border-black focus:ring-black rounded-lg"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="pl-10 h-12 border-gray-200 focus:border-black focus:ring-black rounded-lg"
                        placeholder="+919876543210"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Enter your phone number with country code</p>
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
                    className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
                  >
                    Continue
                  </Button>
                </form>
              )}

              {step === "phone" && (
                <form onSubmit={handleSendOtp} className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm text-gray-600">Creating account for:</p>
                    <p className="font-medium text-gray-900">
                      {formData.firstName} {formData.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{formData.email}</p>
                    <p className="text-sm text-gray-600">{formData.phone}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-700">Security Verification</Label>
                      {!recaptchaReady && (
                        <Button
                          type="button"
                          onClick={handleRefreshRecaptcha}
                          variant="ghost"
                          size="sm"
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Refresh
                        </Button>
                      )}
                    </div>
                    <div
                      id="recaptcha-container"
                      className="flex justify-center min-h-[78px] items-center border border-gray-200 rounded-lg bg-gray-50"
                    >
                      {!recaptchaReady && (
                        <div className="text-center text-gray-500 text-sm">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto mb-2"></div>
                          Loading security verification...
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">Complete the security check to send OTP</p>
                      {recaptchaReady && <span className="text-xs text-green-600">✅ Ready</span>}
                    </div>
                  </div>

                  <div className="space-y-4">
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
                        "Send Verification Code"
                      )}
                    </Button>

                    <Button
                      type="button"
                      onClick={handleBackToDetails}
                      variant="outline"
                      className="w-full h-12 border-gray-200 hover:bg-gray-50 rounded-lg bg-transparent"
                    >
                      Back to Details
                    </Button>
                  </div>
                </form>
              )}

              {step === "otp" && (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm text-gray-600">Verification code sent to:</p>
                    <p className="font-medium text-gray-900">{formData.phone}</p>
                    <p className="text-xs text-green-600 mt-1">✅ Real SMS sent via Firebase</p>
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
                          Creating Account...
                        </div>
                      ) : (
                        "Verify & Create Account"
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
                        Resend Code
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              <div className="text-center pt-6 border-t border-gray-100">
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
