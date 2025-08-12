"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react"

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

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current !== null && window.grecaptcha) {
          try {
            window.grecaptcha.reset(widgetIdRef.current)
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
                onVerify(token)
              },
              "expired-callback": () => {
                console.log("reCAPTCHA expired")
                if (onExpired) onExpired()
              },
              "error-callback": () => {
                console.log("reCAPTCHA error callback")
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
      }
    }, [siteKey])

    // Show placeholder if no siteKey is provided
    if (!siteKey || siteKey.trim() === "") {
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
          <p className="text-sm">reCAPTCHA site key not configured</p>
          <p className="text-xs mt-1">Please set NEXT_PUBLIC_RECAPTCHA_SITE_KEY environment variable</p>
        </div>
      )
    }

    return (
      <div className="recaptcha-container">
        <div ref={containerRef} className="g-recaptcha" />
        {!isLoaded && (
          <div className="flex items-center justify-center p-4 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
            Loading reCAPTCHA...
          </div>
        )}
      </div>
    )
  },
)

Recaptcha.displayName = "Recaptcha"
