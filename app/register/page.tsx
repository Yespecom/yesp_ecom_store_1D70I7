"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api"
import { ArrowLeft, Phone, User, ShieldCheck, Timer, RotateCw } from "lucide-react"
import { ensureFirebaseApp } from "@/lib/firebase-client"
import type { ConfirmationResult } from "firebase/auth"
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth"

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [info, setInfo] = useState<string>("")

  const [provider, setProvider] = useState<"firebase" | "sms" | null>(null)
  const confirmationResultRef = useRef<ConfirmationResult | null>(null)
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)
  const [resendIn, setResendIn] = useState<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const canSend = useMemo(() => {
    return name.trim().length >= 2 && /^\+?[1-9]\d{7,14}$/.test(phone.trim())
  }, [name, phone])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startResendCountdown = () => {
    setResendIn(60)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setResendIn((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const setupRecaptcha = (auth: any) => {
    if (recaptchaRef.current) return recaptchaRef.current
    recaptchaRef.current = new RecaptchaVerifier(
      "recaptcha-container-register",
      {
        size: "invisible",
      },
      auth,
    )
    return recaptchaRef.current
  }

  const sendOtp = async () => {
    if (!acceptTerms) {
      setError("Please accept the terms and conditions")
      return
    }
    setLoading(true)
    setError("")
    setInfo("")
    try {
      const res: any = await apiClient.requestOtp(phone.trim(), "registration")

      const providerResp = res?.provider || res?.data?.provider || "firebase"
      setProvider(providerResp)

      if (providerResp === "firebase") {
        const config = res?.config || res?.data?.config
        if (!config) {
          throw new Error("Missing Firebase config from server")
        }
        const { auth } = ensureFirebaseApp(config)
        const verifier = setupRecaptcha(auth)
        const confirmation = await signInWithPhoneNumber(auth, phone.trim(), verifier)
        confirmationResultRef.current = confirmation
        setStep(2)
        setInfo("OTP sent. Please check your phone.")
        startResendCountdown()
      } else {
        // Fallback SMS flow
        setStep(2)
        setInfo("OTP sent via SMS. Please enter it below.")
        startResendCountdown()
      }
    } catch (err: any) {
      console.error("Send OTP error:", err)
      setError(err?.message || "Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setInfo("")
    try {
      if (provider === "firebase") {
        const confirmation = confirmationResultRef.current
        if (!confirmation) {
          throw new Error("OTP session expired. Please resend OTP.")
        }
        const cred = await confirmation.confirm(otp.trim())
        const idToken = await cred.user.getIdToken()
        const result: any = await apiClient.verifyFirebaseOtp({
          idToken,
          name: name.trim(),
          rememberMe,
        })

        if (result?.success !== false) {
          // Store a simple header-friendly name if not present
          const headerUser = {
            name: result?.customer?.name || name.trim(),
            phone: phone.trim(),
            email: result?.customer?.email || "",
          }
          localStorage.setItem("user_data", JSON.stringify(headerUser))
          window.dispatchEvent(new Event("storage"))
          router.push("/?welcome=true")
          return
        }
        throw new Error(result?.message || "Registration failed")
      } else {
        // Fallback SMS verification
        const result: any = await apiClient.verifySmsOtp({
          phone: phone.trim(),
          otp: otp.trim(),
          purpose: "registration",
          name: name.trim(),
          rememberMe,
        })
        if (result?.success !== false) {
          window.dispatchEvent(new Event("storage"))
          router.push("/?welcome=true")
          return
        }
        throw new Error(result?.message || "Registration failed")
      }
    } catch (err: any) {
      console.error("Verify OTP error:", err)
      setError(err?.message || "Invalid OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (resendIn > 0 || loading) return
    await sendOtp()
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
              Create your account with your phone and discover premium fashion that defines your unique style.
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

      {/* Right Side - Phone OTP Registration */}
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
                {step === 1 ? "Let’s start with your details" : "We’ve sent an OTP to your phone"}
              </CardDescription>

              {/* Progress Indicator */}
              <div className="flex items-center justify-center space-x-2 mt-6">
                <div className={`w-8 h-2 rounded-full ${step >= 1 ? "bg-black" : "bg-gray-200"}`}></div>
                <div className={`w-8 h-2 rounded-full ${step >= 2 ? "bg-black" : "bg-gray-200"}`}></div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Alerts */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
              )}
              {info && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
                  {info}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 h-12 border-gray-200 focus:border-black focus:ring-black rounded-lg"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  {/* Phone */}
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
                        placeholder="+1 555 123 4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10 h-12 border-gray-200 focus:border-black focus:ring-black rounded-lg"
                      />
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      We&apos;ll send an OTP to verify your number.
                    </p>
                  </div>

                  {/* Terms and Remember */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="terms"
                        checked={acceptTerms}
                        onCheckedChange={(checked) => setAcceptTerms(!!checked)}
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
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(!!checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="remember" className="text-sm text-gray-600">
                        Keep me signed in
                      </Label>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={sendOtp}
                    disabled={!canSend || loading}
                    className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
                  >
                    {loading ? "Sending OTP..." : "Continue"}
                  </Button>

                  <div id="recaptcha-container-register" className="hidden" aria-hidden="true" />
                </div>
              )}

              {step === 2 && (
                <form onSubmit={verifyOtp} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                      Enter OTP
                    </Label>
                    <div className="flex gap-3">
                      <Input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        placeholder="6-digit code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="h-12 border-gray-200 focus:border-black focus:ring-black rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resend}
                        disabled={resendIn > 0 || loading}
                        className="h-12 border-gray-200 hover:bg-gray-50 rounded-lg bg-transparent min-w-[120px]"
                        title={resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP"}
                      >
                        <RotateCw className="h-4 w-4 mr-2" />
                        {resendIn > 0 ? `${resendIn}s` : "Resend"}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Timer className="h-3.5 w-3.5" />
                      Code expires in 10 minutes
                    </p>
                  </div>

                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      onClick={() => {
                        setStep(1)
                        setOtp("")
                        setInfo("")
                        setError("")
                      }}
                      variant="outline"
                      className="flex-1 h-12 border-gray-200 hover:bg-gray-50 rounded-lg bg-transparent"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={otp.trim().length < 4 || loading}
                      className="flex-1 h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
                    >
                      {loading ? "Verifying..." : "Create Account"}
                    </Button>
                  </div>

                  <div id="recaptcha-container-register" className="hidden" aria-hidden="true" />
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
