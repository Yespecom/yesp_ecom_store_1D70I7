"use client"

import { useEffect, forwardRef, useImperativeHandle, useState } from "react"
import { Shield, RefreshCw, CheckCircle } from "lucide-react"

interface RecaptchaProps {
  siteKey: string
  onVerify: (token: string) => void
  onError: (error: string) => void
  onExpired?: () => void
  action?: string // v3 action name
  theme?: "light" | "dark"
  size?: "compact" | "normal" | "invisible"
}

export interface RecaptchaRef {
  reset: () => void
  execute: () => Promise<string>
  resetCaptcha: () => void
}

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void
      render: (
        container: string | HTMLElement,
        parameters: {
          sitekey: string
          callback?: (token: string) => void
          "expired-callback"?: () => void
          "error-callback"?: () => void
          theme?: "light" | "dark"
          size?: "compact" | "normal" | "invisible"
          tabindex?: number
        },
      ) => number
      execute: (siteKey: string, options: { action: string }) => Promise<string>
      reset: (widgetId?: number) => void
      getResponse: (widgetId?: number) => string
    }
  }
}

export const Recaptcha = forwardRef<RecaptchaRef, RecaptchaProps>(
  ({ siteKey, onVerify, onError, onExpired, action = "submit", theme = "light", size = "invisible" }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false)
    const [isExecuting, setIsExecuting] = useState(false)
    const [isVerified, setIsVerified] = useState(false)
    const [lastToken, setLastToken] = useState<string | null>(null)

    useImperativeHandle(ref, () => ({
      reset: () => {
        setIsVerified(false)
        setLastToken(null)
      },
      execute: async () => {
        if (!window.grecaptcha || !siteKey) {
          throw new Error("reCAPTCHA not loaded")
        }

        setIsExecuting(true)
        try {
          const token = await window.grecaptcha.execute(siteKey, { action })
          setLastToken(token)
          setIsVerified(true)
          onVerify(token)
          return token
        } catch (error) {
          console.error("reCAPTCHA execute error:", error)
          onError("reCAPTCHA verification failed")
          throw error
        } finally {
          setIsExecuting(false)
        }
      },
      resetCaptcha: () => {
        setIsVerified(false)
        setLastToken(null)
      },
    }))

    const loadRecaptchaScript = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Check if already loaded
        if (typeof window !== "undefined" && window.grecaptcha) {
          setIsLoaded(true)
          resolve()
          return
        }

        // Check if script already exists
        const existingScript = document.querySelector('script[src*="recaptcha"]')
        if (existingScript) {
          // Wait for it to load
          const checkLoaded = () => {
            if (window.grecaptcha) {
              setIsLoaded(true)
              resolve()
            } else {
              setTimeout(checkLoaded, 100)
            }
          }
          checkLoaded()
          return
        }

        const script = document.createElement("script")
        script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
        script.async = true
        script.defer = true
        script.onload = () => {
          // Wait a bit for grecaptcha to be fully initialized
          setTimeout(() => {
            setIsLoaded(true)
            resolve()
          }, 500)
        }
        script.onerror = () => {
          reject(new Error("Failed to load reCAPTCHA script"))
        }
        document.head.appendChild(script)
      })
    }

    useEffect(() => {
      // Reset state when siteKey changes
      setIsVerified(false)
      setLastToken(null)

      // Validate siteKey
      if (!siteKey || siteKey.trim() === "") {
        onError("reCAPTCHA site key is required")
        return
      }

      console.log("Initializing reCAPTCHA v3 with site key:", siteKey.substring(0, 20) + "...")

      const initRecaptcha = async () => {
        try {
          await loadRecaptchaScript()
          console.log("reCAPTCHA v3 loaded successfully")
        } catch (error) {
          console.error("reCAPTCHA initialization error:", error)
          onError("reCAPTCHA failed to load")
        }
      }

      initRecaptcha()
    }, [siteKey])

    // Auto-execute on load for invisible reCAPTCHA
    useEffect(() => {
      if (isLoaded && size === "invisible" && !isVerified && !isExecuting) {
        const autoExecute = async () => {
          try {
            if (window.grecaptcha && siteKey) {
              setIsExecuting(true)
              const token = await window.grecaptcha.execute(siteKey, { action })
              setLastToken(token)
              setIsVerified(true)
              onVerify(token)
            }
          } catch (error) {
            console.error("Auto-execute reCAPTCHA error:", error)
            onError("reCAPTCHA verification failed")
          } finally {
            setIsExecuting(false)
          }
        }

        // Small delay to ensure everything is ready
        setTimeout(autoExecute, 1000)
      }
    }, [isLoaded, size, isVerified, isExecuting, siteKey, action, onVerify, onError])

    // Show placeholder if no siteKey is provided
    if (!siteKey || siteKey.trim() === "") {
      return (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50/50">
          <Shield className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600 mb-1">Security Verification</p>
          <p className="text-xs text-gray-500">reCAPTCHA v3 configuration required</p>
        </div>
      )
    }

    return (
      <div className="recaptcha-v3-container">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-full transition-colors ${
                  isVerified ? "bg-green-100" : isExecuting ? "bg-blue-100" : "bg-gray-100"
                }`}
              >
                {isExecuting ? (
                  <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                ) : isVerified ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Shield className="h-5 w-5 text-gray-500" />
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-800">
                  {isExecuting ? "Verifying security..." : isVerified ? "Security verified" : "Security check"}
                </p>
                <p className="text-xs text-gray-600">
                  {isExecuting
                    ? "Please wait while we verify you're human"
                    : isVerified
                      ? "Protected by reCAPTCHA v3"
                      : "Powered by Google reCAPTCHA"}
                </p>
              </div>
            </div>

            {isVerified && (
              <div className="flex items-center space-x-1 text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium">Verified</span>
              </div>
            )}
          </div>

          {/* Progress bar for execution */}
          {isExecuting && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div className="bg-blue-600 h-1 rounded-full animate-pulse" style={{ width: "60%" }}></div>
              </div>
            </div>
          )}

          {!isLoaded && (
            <div className="mt-3 flex items-center justify-center text-gray-500">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm">Loading security verification...</span>
            </div>
          )}
        </div>

        {/* reCAPTCHA badge info */}
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">
            This site is protected by reCAPTCHA and the Google{" "}
            <a
              href="https://policies.google.com/privacy"
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>{" "}
            and{" "}
            <a
              href="https://policies.google.com/terms"
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </a>{" "}
            apply.
          </p>
        </div>
      </div>
    )
  },
)

Recaptcha.displayName = "Recaptcha"
