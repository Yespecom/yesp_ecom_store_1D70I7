"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Phone, MessageSquare } from "lucide-react"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    phone: "",
    otp: "",
  })
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)
  const [error, setError] = useState("")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!otpSent) {
        await sendOTP()
        return
      }

      if (!formData.otp) {
        setError("Please enter the OTP")
        setLoading(false)
        return
      }

      // Mock OTP verification - replace with actual API
      await new Promise((resolve) => setTimeout(resolve, 1000))
      if (formData.otp === "123456") {
        // Mock OTP for demo
        window.dispatchEvent(new Event("storage"))
        router.push("/")
      } else {
        setError("Invalid OTP. Please try again.")
      }
    } catch (error: any) {
      setError(error.message || "Login failed")
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
            backgroundImage: `url("/images/models-banner.jpg")`,
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="max-w-md text-center">
            <h1 className="text-4xl font-bold mb-6">Welcome Back</h1>
            <p className="text-lg text-gray-200 mb-8">
              Sign in to your oneofwun account with your phone number and continue your fashion journey with us.
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold">10K+</div>
                <div className="text-gray-300">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">500+</div>
                <div className="text-gray-300">Premium Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">4.9★</div>
                <div className="text-gray-300">Customer Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
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

              <CardTitle className="text-2xl font-bold text-gray-900">Sign In</CardTitle>
              <CardDescription className="text-gray-600">
                {otpSent ? "Enter the OTP sent to your phone" : "Enter your phone number to continue"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                    {error}
                  </div>
                )}

                {/* Phone Number Field */}
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
                  </div>
                </div>

                {/* OTP Field */}
                {otpSent && (
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

                {/* Sign In Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {!otpSent ? "Sending OTP..." : "Verifying..."}
                    </div>
                  ) : !otpSent ? (
                    "Send OTP"
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              {/* Sign Up Link */}
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

          {/* Footer */}
          <div className="text-center mt-8 text-xs text-gray-500">
            <p>
              By signing in, you agree to our{" "}
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
