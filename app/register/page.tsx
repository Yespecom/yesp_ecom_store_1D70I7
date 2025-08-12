"use client"

import type React from "react"
import { useState } from "react"
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
import { ArrowLeft, Phone, Shield, User, AlertCircle, Mail } from "lucide-react"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    otp: "",
    acceptTerms: false,
    rememberMe: false,
  })
  const [step, setStep] = useState<"details" | "otp">("details")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const router = useRouter()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.name.trim()) {
      setError("Please enter your full name")
      setLoading(false)
      return
    }

    if (!formData.email.trim()) {
      setError("Please enter your email address")
      setLoading(false)
      return
    }

    if (!isValidE164Phone(formData.phone)) {
      setError("Please enter a valid phone number with country code (e.g., +919876543210)")
      setLoading(false)
      return
    }

    if (!formData.acceptTerms) {
      setError("Please accept the terms and conditions")
      setLoading(false)
      return
    }

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
        formData.name,
        formData.email,
      )

      if (result.success && result.token && result.customer) {
        console.log("Registration successful")
        // Store authentication data
        localStorage.setItem("auth_token", result.token)
        localStorage.setItem("user_data", JSON.stringify(result.customer))

        // Trigger storage event for header update
        window.dispatchEvent(new Event("storage"))
        router.push("/?welcome=true")
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
    setConfirmationResult(null)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Left Side - Hero Image */}
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
              Create your account with just your phone number and discover premium fashion.
            </p>
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Exclusive access to premium collections</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Early access to sales and new arrivals</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Personalized style recommendations</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Free shipping on orders above ₹999</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Back to Home */}
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              {/* Logo */}
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
                {step === "details" ? "Enter your details to get started" : "Enter the OTP sent to your phone"}
              </CardDescription>

              {/* Progress Indicator */}
              <div className="flex items-center justify-center space-x-2 mt-6">
                <div className={`w-8 h-2 rounded-full ${step === "details" ? "bg-black" : "bg-gray-200"}`}></div>
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

              {/* Firebase Configuration Warning */}
              {error.includes("authorized domain") && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-2">Firebase Configuration Required</p>
                      <p className="mb-2">To enable phone authentication, please:</p>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>Go to Firebase Console → Authentication → Settings</li>
                        <li>Add your domain to "Authorized domains"</li>
                        <li>Enable Phone authentication in Sign-in methods</li>
                        <li>Configure your Firebase project settings</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {step === "details" && (
                <form onSubmit={handleSendOtp} className="space-y-6">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="pl-10 h-12 border-gray-200 focus:border-black focus:ring-black rounded-lg"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  {/* Email Field */}
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
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>

                  {/* Phone Field */}
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

                  {/* Firebase reCAPTCHA Container */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Security Verification</Label>
                    <div
                      id="recaptcha-container"
                      className="flex justify-center min-h-[78px] items-center border border-gray-200 rounded-lg bg-gray-50"
                    ></div>
                    <p className="text-xs text-gray-500">Complete the security check to continue</p>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="terms"
                        checked={formData.acceptTerms}
                        onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked as boolean })}
                        className="mt-1 rounded border-gray-300"
                      />
                      <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                        I agree to the{" "}
                        <Link href="/terms" className="text-black hover:underline font-medium">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-black hover:underline font-medium">
                          Privacy Policy
                        </Link>
                      </Label>
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
                  </div>

                  {/* Send OTP Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
                    disabled={loading}
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
                  {/* User Details Display */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm text-gray-600">Creating account for:</p>
                    <p className="font-medium text-gray-900">{formData.name}</p>
                    <p className="font-medium text-gray-900">{formData.email}</p>
                    <p className="font-medium text-gray-900">{formData.phone}</p>
                    <p className="text-xs text-green-600 mt-1">✅ Real SMS sent via Firebase</p>
                  </div>

                  {/* OTP Field */}
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
                        onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                        className="pl-10 h-12 border-gray-200 focus:border-black focus:ring-black rounded-lg text-center text-lg tracking-widest"
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>
                    <p className="text-xs text-gray-500">Enter the 6-digit code from your SMS</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-4">
                    <Button
                      type="submit"
                      className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
                      disabled={loading}
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
                        onClick={handleBackToDetails}
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

              {/* Sign In Link */}
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
