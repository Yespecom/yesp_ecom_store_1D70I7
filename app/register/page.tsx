"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Phone, Mail, User, Shield, Sparkles, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { sendFirebaseOTP, verifyFirebaseOTP, cleanupFirebaseAuth } from "@/lib/firebase-auth"
import { formatPhoneNumber, validatePhoneNumber } from "@/lib/otp-auth"

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    otp: "",
    agreeToTerms: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupFirebaseAuth()
    }
  }, [])

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (!validatePhoneNumber(formData.phone)) {
      newErrors.phone = "Please enter a valid Indian phone number"
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSendOTP = async () => {
    if (!validateStep1()) return

    setLoading(true)
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
      console.log("🔍 Verifying OTP for registration...")

      const result = await verifyFirebaseOTP(formData.otp, "registration", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      })

      console.log("✅ Registration successful:", result)
      toast.success("Registration successful!")

      // Redirect to home page
      router.push("/")
    } catch (error: any) {
      console.error("❌ Registration error:", error)
      toast.error(error.message || "Registration failed")
      setErrors({ otp: error.message || "Invalid OTP" })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* reCAPTCHA container */}
      <div id="recaptcha-container"></div>

      <div className="w-full max-w-lg relative z-10">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white relative">
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
                      {step === 1 ? "Join OneofWun" : "Almost There!"}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-indigo-100 text-lg">
                    {step === 1
                      ? "Create your account and discover unique fashion"
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
                {/* Step 1: Personal Information */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center">
                      <User className="h-4 w-4 mr-2 text-indigo-500" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className={`h-14 text-lg rounded-xl border-2 transition-all duration-200 ${
                        errors.name
                          ? "border-red-400 focus:border-red-500 bg-red-50"
                          : "border-gray-200 focus:border-indigo-500 hover:border-gray-300"
                      }`}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 flex items-center">
                        <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-indigo-500" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`h-14 text-lg rounded-xl border-2 transition-all duration-200 ${
                        errors.email
                          ? "border-red-400 focus:border-red-500 bg-red-50"
                          : "border-gray-200 focus:border-indigo-500 hover:border-gray-300"
                      }`}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600 flex items-center">
                        <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-indigo-500" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className={`h-14 text-lg rounded-xl border-2 transition-all duration-200 ${
                        errors.phone
                          ? "border-red-400 focus:border-red-500 bg-red-50"
                          : "border-gray-200 focus:border-indigo-500 hover:border-gray-300"
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-600 flex items-center">
                        <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                    <div className="flex items-start space-x-4">
                      <Checkbox
                        id="terms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                        className={`mt-1 ${errors.agreeToTerms ? "border-red-500" : "border-indigo-300"}`}
                      />
                      <div className="space-y-2">
                        <Label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                          I agree to the{" "}
                          <Link
                            href="/terms"
                            className="text-indigo-600 hover:text-indigo-800 font-semibold underline decoration-2 underline-offset-2"
                          >
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link
                            href="/privacy"
                            className="text-indigo-600 hover:text-indigo-800 font-semibold underline decoration-2 underline-offset-2"
                          >
                            Privacy Policy
                          </Link>
                        </Label>
                        {errors.agreeToTerms && (
                          <p className="text-sm text-red-600 flex items-center">
                            <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                            {errors.agreeToTerms}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      Sending Magic Code...
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
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                      <Shield className="h-10 w-10 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Check Your Messages</h3>
                      <p className="text-gray-600">We've sent a 6-digit verification code to</p>
                      <p className="font-semibold text-indigo-600 text-lg">{formData.phone}</p>
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
                          : "border-gray-200 focus:border-indigo-500 hover:border-gray-300"
                      }`}
                      maxLength={6}
                      autoComplete="one-time-code"
                    />
                    {errors.otp && (
                      <p className="text-sm text-red-600 text-center flex items-center justify-center">
                        <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                        {errors.otp}
                      </p>
                    )}
                  </div>

                  <Alert className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
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
                    className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Creating Your Account...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-3 h-6 w-6" />
                        Complete Registration
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="w-full h-12 border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 bg-transparent rounded-xl font-medium transition-all duration-200"
                  >
                    Resend Code
                  </Button>
                </div>
              </>
            )}

            <div className="text-center pt-6 border-t border-gray-100">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-indigo-600 hover:text-indigo-800 font-semibold underline decoration-2 underline-offset-2"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
