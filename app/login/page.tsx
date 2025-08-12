"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Phone, Shield, LogIn, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { sendFirebaseOTP, verifyFirebaseOTP, cleanupFirebaseAuth } from "@/lib/firebase-auth"
import { formatPhoneNumber, validatePhoneNumber } from "@/lib/otp-auth"

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    phone: "",
    otp: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupFirebaseAuth()
    }
  }, [])

  const handleSendOTP = async () => {
    if (!formData.phone.trim()) {
      setErrors({ phone: "Phone number is required" })
      return
    }

    if (!validatePhoneNumber(formData.phone)) {
      setErrors({ phone: "Please enter a valid Indian phone number" })
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const formattedPhone = formatPhoneNumber(formData.phone)
      console.log("📱 Sending OTP to:", formattedPhone)

      await sendFirebaseOTP(formattedPhone)
      setFormData((prev) => ({ ...prev, phone: formattedPhone }))
      setStep(2)
      toast.success("OTP sent successfully!")
    } catch (error: any) {
      console.error("❌ Send OTP error:", error)
      toast.error(error.message || "Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!formData.otp.trim()) {
      setErrors({ otp: "Please enter the OTP" })
      return
    }

    if (formData.otp.length !== 6) {
      setErrors({ otp: "OTP must be 6 digits" })
      return
    }

    setLoading(true)
    setErrors({})

    try {
      console.log("🔍 Verifying Firebase OTP for login...")

      const result = await verifyFirebaseOTP(formData.otp, "login")

      console.log("✅ Login successful:", result)
      toast.success("Login successful!")

      // Redirect to home page
      router.push("/")
    } catch (error: any) {
      console.error("❌ Login error:", error)
      toast.error(error.message || "Login failed")
      setErrors({ otp: error.message || "Invalid OTP" })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleBackToStep1 = () => {
    setStep(1)
    setFormData((prev) => ({ ...prev, otp: "" }))
    setErrors({})
    cleanupFirebaseAuth()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-teal-300/10 to-emerald-300/10 rounded-full blur-3xl"></div>
      </div>

      {/* reCAPTCHA container */}
      <div id="recaptcha-container"></div>

      <div className="w-full max-w-lg relative z-10">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                {step === 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToStep1}
                    className="p-2 hover:bg-white/20 rounded-full text-white border-white/20"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
                <div className="flex-1 text-center">
                  <div className="flex items-center justify-center mb-3">
                    <Sparkles className="h-8 w-8 mr-2" />
                    <CardTitle className="text-3xl font-bold">
                      {step === 1 ? "Welcome Back" : "Verify & Login"}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-emerald-100 text-lg">
                    {step === 1
                      ? "Sign in to your OneofWun account"
                      : "Enter the verification code we sent to your phone"}
                  </CardDescription>
                </div>
                <div className="w-8" />
              </div>

              {/* Enhanced progress indicator */}
              <div className="flex items-center justify-center space-x-3">
                <div
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${step >= 1 ? "bg-white shadow-lg" : "bg-white/30"}`}
                />
                <div
                  className={`w-12 h-1 rounded-full transition-all duration-300 ${step >= 2 ? "bg-white" : "bg-white/30"}`}
                />
                <div
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${step >= 2 ? "bg-white shadow-lg" : "bg-white/30"}`}
                />
              </div>
            </div>
          </div>

          <CardContent className="p-8 space-y-8">
            {step === 1 ? (
              <>
                {/* Step 1: Phone Number */}
                <div className="space-y-6">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto">
                      <Phone className="h-10 w-10 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Enter Your Phone Number</h3>
                      <p className="text-gray-600">We'll send you a secure verification code</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="phone"
                      className="text-sm font-semibold text-gray-700 flex items-center justify-center"
                    >
                      <Phone className="h-4 w-4 mr-2 text-emerald-500" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className={`h-16 text-lg text-center rounded-xl border-2 transition-all duration-200 ${
                        errors.phone
                          ? "border-red-400 focus:border-red-500 bg-red-50"
                          : "border-gray-200 focus:border-emerald-500 hover:border-gray-300"
                      }`}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleSendOTP()
                        }
                      }}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-600 text-center flex items-center justify-center">
                        <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                    <div className="flex items-center justify-center space-x-2 text-emerald-700">
                      <Shield className="h-5 w-5" />
                      <span className="text-sm font-medium">Secure & Fast Authentication</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-3 h-6 w-6" />
                      Send Verification Code
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                {/* Step 2: OTP Verification */}
                <div className="space-y-6">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto">
                      <Shield className="h-10 w-10 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Check Your Messages</h3>
                      <p className="text-gray-600">We've sent a 6-digit verification code to</p>
                      <p className="font-semibold text-emerald-600 text-lg">{formData.phone}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="otp" className="text-sm font-semibold text-gray-700 text-center block">
                      Enter Verification Code
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="• • • • • •"
                      value={formData.otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                        handleInputChange("otp", value)
                      }}
                      className={`text-center text-2xl font-bold h-16 rounded-xl border-2 tracking-widest ${
                        errors.otp
                          ? "border-red-400 focus:border-red-500 bg-red-50"
                          : "border-gray-200 focus:border-emerald-500 hover:border-gray-300"
                      }`}
                      maxLength={6}
                      autoComplete="one-time-code"
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && formData.otp.length === 6) {
                          handleVerifyOTP()
                        }
                      }}
                    />
                    {errors.otp && (
                      <p className="text-sm text-red-600 text-center flex items-center justify-center">
                        <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                        {errors.otp}
                      </p>
                    )}
                  </div>

                  <Alert className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl">
                    <AlertDescription className="text-sm text-blue-800 text-center">
                      <strong>Didn't receive the code?</strong> Check your messages or wait a moment before requesting a
                      new one.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={handleVerifyOTP}
                    disabled={loading || formData.otp.length !== 6}
                    className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Signing You In...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-3 h-6 w-6" />
                        Sign In to Account
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="w-full h-12 border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 bg-transparent rounded-xl font-medium transition-all duration-200"
                  >
                    Resend Code
                  </Button>
                </div>
              </>
            )}

            <div className="text-center pt-6 border-t border-gray-100">
              <p className="text-gray-600">
                Don't have an account?{" "}
                <Link
                  href="/register"
                  className="text-emerald-600 hover:text-emerald-800 font-semibold underline decoration-2 underline-offset-2"
                >
                  Create one here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
