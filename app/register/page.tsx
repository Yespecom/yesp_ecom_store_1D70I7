"use client"

import type React from "react"

import type { ReactElement } from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api"
import { ArrowLeft, User, Phone, MessageSquare } from "lucide-react"

export default function RegisterPage(): ReactElement {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    otp: "",
    acceptTerms: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState(1)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)
  const router = useRouter()

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [otpTimer])

  const sendOTP = async () => {
    if (!formData.phone) {
      setError("Please enter your phone number")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Mock API call - replace with actual OTP service
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setOtpSent(true)
      setOtpTimer(60)
      setError("")
    } catch (error: any) {
      setError("Failed to send OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const verifyOTP = async () => {
    if (!formData.otp) {
      setError("Please enter the OTP")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Mock OTP verification - replace with actual API
      await new Promise((resolve) => setTimeout(resolve, 1000))
      if (formData.otp === "123456") {
        // Mock OTP for demo
        setPhoneVerified(true)
        setStep(3)
        setError("")
      } else {
        setError("Invalid OTP. Please try again.")
      }
    } catch (error: any) {
      setError("OTP verification failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name.trim()) {
        setError("Please enter your full name")
        return
      }
      setError("")
      setStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (step === 2) {
      if (!otpSent) {
        await sendOTP()
        return
      }
      await verifyOTP()
      return
    }

    if (step === 3) {
      if (!formData.acceptTerms) {
        setError("Please accept the terms and conditions")
        return
      }

      setLoading(true)
      setError("")

      try {
        // Split name into first and last name
        const nameParts = formData.name.trim().split(" ")
        const firstName = nameParts[0] || ""
        const lastName = nameParts.slice(1).join(" ") || ""

        const response = await apiClient.register({
          firstName: firstName,
          lastName: lastName,
          phone: formData.phone,
        })

        if (response.success && response.data) {
          // Store user data for immediate header update
          const userData = {
            name: formData.name,
            phone: formData.phone,
          }
          localStorage.setItem("user_data", JSON.stringify(userData))

          // Trigger storage event for header update
          window.dispatchEvent(new Event("storage"))

          // Redirect to home page
          router.push("/?welcome=true")
        } else {
          setError(response.message || "Registration failed")
        }
      } catch (error: any) {
        console.error("Registration error:", error)
        setError(error.message || "Registration failed")
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Left Side - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url("/images/models-banner.jpg")`,
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="max-w-md text-center">
            <h1 className="text-4xl font-bold mb-6">Join oneofwun</h1>
            <p className="text-lg text-gray-200 mb-8">
              Create your account with just your phone number and discover premium fashion that defines your unique
              style.
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
                  <Image src="/images/oneofwun-logo.png" alt="oneofwun" fill className="object-contain" />
                </div>
                <span className="text-2xl font-bold text-gray-900">oneofwun</span>
              </Link>

              <CardTitle className="text-2xl font-bold text-gray-900">Create Account</CardTitle>
              <CardDescription className="text-gray-600">
                {step === 1
                  ? "Let's start with your basic information"
                  : step === 2
                    ? otpSent
                      ? "Enter the OTP sent to your phone"
                      : "Verify your phone number"
                    : "Complete your account setup"}
              </CardDescription>

              <div className="flex items-center justify-center space-x-2 mt-6">
                <div className={`w-6 h-2 rounded-full ${step >= 1 ? "bg-black" : "bg-gray-200"}`}></div>
                <div className={`w-6 h-2 rounded-full ${step >= 2 ? "bg-black" : "bg-gray-200"}`}></div>
                <div className={`w-6 h-2 rounded-full ${step >= 3 ? "bg-black" : "bg-gray-200"}`}></div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                    {error}
                  </div>
                )}

                {step === 1 && (
                  <>
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

                    {/* Next Button */}
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
                    >
                      Continue
                    </Button>
                  </>
                )}

                {step === 2 && (
                  <>
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
                          placeholder="+91 98765 43210"
                          disabled={otpSent}
                        />
                        {phoneVerified && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* OTP Field */}
                    {otpSent && !phoneVerified && (
                      <div className="space-y-2">
                        <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                          Enter OTP
                        </Label>
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            id="otp"
                            type="text"
                            required
                            maxLength={6}
                            value={formData.otp}
                            onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, "") })}
                            className="pl-10 h-12 border-gray-200 focus:border-black focus:ring-black rounded-lg text-center text-lg tracking-widest"
                            placeholder="123456"
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">OTP sent to {formData.phone}</span>
                          {otpTimer > 0 ? (
                            <span className="text-gray-500">Resend in {otpTimer}s</span>
                          ) : (
                            <button
                              type="button"
                              onClick={sendOTP}
                              className="text-black hover:text-gray-700 font-medium"
                              disabled={loading}
                            >
                              Resend OTP
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(1)}
                        className="flex-1 h-12 border-gray-200 hover:bg-gray-50 rounded-lg"
                        disabled={loading}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            {!otpSent ? "Sending..." : "Verifying..."}
                          </div>
                        ) : !otpSent ? (
                          "Send OTP"
                        ) : (
                          "Verify OTP"
                        )}
                      </Button>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
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
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(2)}
                        className="flex-1 h-12 border-gray-200 hover:bg-gray-50 rounded-lg"
                        disabled={loading}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
                        disabled={loading || !formData.acceptTerms}
                      >
                        {loading ? (
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Creating Account...
                          </div>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </form>

              {/* Sign In Link */}
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

          {/* Footer */}
          <div className="text-center mt-8 text-xs text-gray-500">
            <p>
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-black hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-black hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
