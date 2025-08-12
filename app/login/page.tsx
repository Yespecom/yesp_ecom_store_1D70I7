"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Phone, Shield } from "lucide-react"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      {/* reCAPTCHA container */}
      <div id="recaptcha-container"></div>

      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex items-center justify-between">
              {step === 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToStep1}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="flex-1 text-center">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {step === 1 ? "Welcome Back" : "Verify Phone"}
                </CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  {step === 1 ? "Sign in to your OneofWun account" : `Enter the 6-digit code sent to ${formData.phone}`}
                </CardDescription>
              </div>
              <div className="w-8" /> {/* Spacer for centering */}
            </div>

            {/* Progress indicator */}
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${step >= 1 ? "bg-black" : "bg-gray-300"}`} />
              <div className={`w-8 h-1 ${step >= 2 ? "bg-black" : "bg-gray-300"}`} />
              <div className={`w-3 h-3 rounded-full ${step >= 2 ? "bg-black" : "bg-gray-300"}`} />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 1 ? (
              <>
                {/* Step 1: Phone Number */}
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Phone className="h-8 w-8 text-black" />
                    </div>
                    <p className="text-sm text-gray-600">Enter your phone number to receive a verification code</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className={`pl-10 h-12 ${errors.phone ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-black"}`}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleSendOTP()
                          }
                        }}
                      />
                    </div>
                    {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
                  </div>
                </div>

                <Button
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-5 w-5" />
                      Send Verification Code
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                {/* Step 2: OTP Verification */}
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-8 w-8 text-black" />
                    </div>
                    <p className="text-sm text-gray-600">We've sent a 6-digit verification code to your phone number</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                      Verification Code
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={formData.otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                        handleInputChange("otp", value)
                      }}
                      className={`text-center text-lg font-mono h-12 ${
                        errors.otp ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-black"
                      }`}
                      maxLength={6}
                      autoComplete="one-time-code"
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && formData.otp.length === 6) {
                          handleVerifyOTP()
                        }
                      }}
                    />
                    {errors.otp && <p className="text-sm text-red-600">{errors.otp}</p>}
                  </div>

                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertDescription className="text-sm text-blue-800">
                      Didn't receive the code? Check your messages or try again in a few moments.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleVerifyOTP}
                    disabled={loading || formData.otp.length !== 6}
                    className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="w-full h-12 border-gray-200 hover:bg-gray-50 bg-transparent"
                  >
                    Resend Code
                  </Button>
                </div>
              </>
            )}

            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/register" className="text-black hover:underline font-medium">
                  Create one
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
