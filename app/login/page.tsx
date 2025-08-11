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
import { ArrowLeft, Phone, ShieldCheck, Timer, RotateCw } from "lucide-react"
import { ensureFirebaseApp } from "@/lib/firebase-client"
import type { ConfirmationResult } from "firebase/auth"
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth"

export default function LoginPage() {
  const router = useRouter()

  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
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
    return /^\+?[1-9]\d{7,14}$/.test(phone.trim())
  }, [phone])

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
      "recaptcha-container-login",
      {
        size: "invisible",
      },
      auth,
    )
    return recaptchaRef.current
  }

  const sendOtp = async () => {
    setLoading(true)
    setError("")
    setInfo("")
    try {
      const res: any = await apiClient.requestOtp(phone.trim(), "login")

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
        // Fallback SMS handled by backend provider (e.g., MSG91)
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
          rememberMe,
        })

        if (result?.success !== false) {
          // storage event triggers header state update
          window.dispatchEvent(new Event("storage"))
          router.push("/?welcome=true")
          return
        }
        throw new Error(result?.message || "Login failed")
      } else {
        // Fallback SMS verification
        const result: any = await apiClient.verifySmsOtp({
          phone: phone.trim(),
          otp: otp.trim(),
          purpose: "login",
          rememberMe,
        })
        if (result?.success !== false) {
          window.dispatchEvent(new Event("storage"))
          router.push("/?welcome=true")
          return
        }
        throw new Error(result?.message || "Login failed")
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
            <h1 className="text-4xl font-bold mb-6">Welcome Back</h1>
            <p className="text-lg text-gray-200 mb-8">
              Sign in with your phone number to continue your fashion journey with us.
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

      {/* Right Side - Phone OTP Login */}
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

              <CardTitle className="text-2xl font-bold text-gray-900">Sign In with Phone</CardTitle>
              <CardDescription className="text-gray-600">
                Enter your phone number, we&apos;ll send you a one-time code
              </CardDescription>
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

              {/* Step 1: Phone */}
              {step === 1 && (
                <div className="space-y-6">
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

                  <div className="flex items-center space-x-2">
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

                  <Button
                    type="button"
                    onClick={sendOtp}
                    disabled={!canSend || loading}
                    className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
                  >
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </Button>

                  <div id="recaptcha-container-login" className="hidden" aria-hidden="true" />
                </div>
              )}

              {/* Step 2: OTP */}
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

                  <Button
                    type="submit"
                    disabled={otp.trim().length < 4 || loading}
                    className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
                  >
                    {loading ? "Verifying..." : "Verify & Sign In"}
                  </Button>

                  <div id="recaptcha-container-login" className="hidden" aria-hidden="true" />
                </form>
              )}

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-black hover:text-gray-700 font-medium">
                      Create one
                    </Link>
                  </span>
                </div>
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
