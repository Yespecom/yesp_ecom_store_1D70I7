"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react"

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
    const scriptLoadedRef = useRef(false)

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current !== null && window.grecaptcha) {
          window.grecaptcha.reset(widgetIdRef.current)
        }
      },
      execute: () => {
        if (widgetIdRef.current !== null && window.grecaptcha) {
          window.grecaptcha.execute(widgetIdRef.current)
        }
      },
    }))

    const loadRecaptchaScript = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (scriptLoadedRef.current || (typeof window !== "undefined" && window.grecaptcha)) {
          scriptLoadedRef.current = true
          resolve()
          return
        }

        const script = document.createElement("script")
        script.src = "https://www.google.com/recaptcha/api.js"
        script.async = true
        script.defer = true
        script.onload = () => {
          scriptLoadedRef.current = true
          resolve()
        }
        script.onerror = () => {
          reject(new Error("Failed to load reCAPTCHA script"))
        }
        document.head.appendChild(script)
      })
    }

    const renderRecaptcha = () => {
      if (!containerRef.current || !window.grecaptcha || !siteKey) {
        if (!siteKey) {
          onError("reCAPTCHA site key is missing")
        }
        return
      }

      // Clear any existing widget
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }

      try {
        window.grecaptcha.ready(() => {
          if (!containerRef.current || !siteKey) return

          try {
            widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
              sitekey: siteKey,
              callback: (token: string) => {
                onVerify(token)
              },
              "expired-callback": () => {
                if (onExpired) onExpired()
              },
              "error-callback": () => {
                onError("reCAPTCHA verification failed")
              },
              theme,
              size,
              tabindex,
            })
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
      // Validate siteKey
      if (!siteKey || siteKey.trim() === "") {
        onError("reCAPTCHA site key is required")
        return
      }

      const initRecaptcha = async () => {
        try {
          await loadRecaptchaScript()
          // Add a small delay to ensure the script is fully loaded
          setTimeout(() => {
            renderRecaptcha()
          }, 100)
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
      }
    }, [siteKey])

    // Show a placeholder if no siteKey is provided
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
      </div>
    )
  },
)

Recaptcha.displayName = "Recaptcha"
