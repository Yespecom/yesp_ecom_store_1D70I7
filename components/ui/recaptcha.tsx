"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react"
import { Shield, RefreshCw } from "lucide-react"

interface RecaptchaProps {
  siteKey: string
  onVerify: (token: string) => void
  onError: (error: string) => void
  onExpired?: () => void
  theme?: "light" | "dark"
  size?: "compact" | "normal"
  tabindex?: number
}

export interface RecaptchaRef {
  reset: () => void
  execute: () => void
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
          size?: "compact" | "normal"
          tabindex?: number
        },
      ) => number
      reset: (widgetId?: number) => void
      execute: (widgetId?: number) => void
      getResponse: (widgetId?: number) => string
    }
  }
}

export const Recaptcha = forwardRef<RecaptchaRef, RecaptchaProps>(
  ({ siteKey, onVerify, onError, onExpired, theme = "light", size = "normal", tabindex }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<number | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const [isRendered, setIsRendered] = useState(false)
    const [isVerified, setIsVerified] = useState(false)

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current !== null && window.grecaptcha) {
          try {
            window.grecaptcha.reset(widgetIdRef.current)
            setIsVerified(false)
          } catch (error) {
            console.error("reCAPTCHA reset error:", error)
          }
        }
      },
      execute: () => {
        if (widgetIdRef.current !== null && window.grecaptcha) {
          try {
            window.grecaptcha.execute(widgetIdRef.current)
          } catch (error) {
            console.error("reCAPTCHA execute error:", error)
          }
        }
      },
      resetCaptcha: () => {
        if (widgetIdRef.current !== null && window.grecaptcha) {
          try {
            window.grecaptcha.reset(widgetIdRef.current)
            setIsVerified(false)
          } catch (error) {
            console.error("reCAPTCHA resetCaptcha error:", error)
          }
        }
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
        script.src = "https://www.google.com/recaptcha/api.js"
        script.async = true
        script.defer = true
        script.onload = () => {
          setIsLoaded(true)
          resolve()
        }
        script.onerror = () => {
          reject(new Error("Failed to load reCAPTCHA script"))
        }
        document.head.appendChild(script)
      })
    }

    const renderRecaptcha = () => {
      if (!containerRef.current || !window.grecaptcha || !siteKey || isRendered) {
        return
      }

      // Validate siteKey format
      if (!siteKey.trim() || siteKey.length < 10) {
        onError("Invalid reCAPTCHA site key")
        return
      }

      try {
        window.grecaptcha.ready(() => {
          if (!containerRef.current || isRendered) return

          try {
            // Clear container
            containerRef.current.innerHTML = ""

            widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
              sitekey: siteKey,
              callback: (token: string) => {
                console.log("reCAPTCHA callback triggered with token:", token.substring(0, 20) + "...")
                setIsVerified(true)
                onVerify(token)
              },
              "expired-callback": () => {
                console.log("reCAPTCHA expired")
                setIsVerified(false)
                if (onExpired) onExpired()
              },
              "error-callback": () => {
                console.log("reCAPTCHA error callback")
                setIsVerified(false)
                onError("reCAPTCHA verification failed")
              },
              theme,
              size,
              tabindex,
            })
            setIsRendered(true)
            console.log("reCAPTCHA rendered successfully with widget ID:", widgetIdRef.current)
          } catch (renderError) {
            console.error("reCAPTCHA render error:", renderError)
            onError("Failed to render reCAPTCHA widget")
          }
        })
      } catch (error) {
        console.error("reCAPTCHA initialization error:", error)
        onError("Failed to initialize reCAPTCHA")
      }
    }

    useEffect(() => {
      // Reset rendered state when siteKey changes
      setIsRendered(false)
      setIsVerified(false)

      // Validate siteKey
      if (!siteKey || siteKey.trim() === "") {
        onError("reCAPTCHA site key is required")
        return
      }

      console.log("Initializing reCAPTCHA with site key:", siteKey.substring(0, 20) + "...")

      const initRecaptcha = async () => {
        try {
          await loadRecaptchaScript()
          // Small delay to ensure script is fully initialized
          setTimeout(() => {
            renderRecaptcha()
          }, 200)
        } catch (error) {
          console.error("reCAPTCHA initialization error:", error)
          onError("reCAPTCHA failed to load")
        }
      }

      initRecaptcha()

      return () => {
        // Cleanup
        if (widgetIdRef.current !== null && window.grecaptcha) {
          try {
            window.grecaptcha.reset(widgetIdRef.current)
          } catch (error) {
            console.error("reCAPTCHA cleanup error:", error)
          }
        }
        setIsRendered(false)
        setIsVerified(false)
      }
    }, [siteKey])

    // Show placeholder if no siteKey is provided
    if (!siteKey || siteKey.trim() === "") {
      return (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50/50">
          <Shield className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600 mb-1">Security Verification</p>
          <p className="text-xs text-gray-500">reCAPTCHA configuration required</p>
        </div>
      )
    }

    return (
      <div className="recaptcha-container">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Shield className={`h-5 w-5 ${isVerified ? "text-green-600" : "text-gray-400"}`} />
              <span className="text-sm font-medium text-gray-700">Security Verification</span>
            </div>
            {isVerified && (
              <div className="flex items-center space-x-1 text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-xs font-medium">Verified</span>
              </div>
            )}
          </div>

          <div ref={containerRef} className="g-recaptcha" />

          {!isLoaded && (
            <div className="flex items-center justify-center p-6 text-gray-500">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm">Loading security verification...</span>
            </div>
          )}
        </div>
      </div>
    )
  },
)

Recaptcha.displayName = "Recaptcha"
