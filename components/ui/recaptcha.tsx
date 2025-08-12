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
      if (!containerRef.current || !window.grecaptcha) return

      try {
        window.grecaptcha.ready(() => {
          if (!containerRef.current) return

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
        })
      } catch (error) {
        console.error("reCAPTCHA render error:", error)
        onError("Failed to render reCAPTCHA")
      }
    }

    useEffect(() => {
      const initRecaptcha = async () => {
        try {
          await loadRecaptchaScript()
          renderRecaptcha()
        } catch (error) {
          console.error("reCAPTCHA initialization error:", error)
          onError("reCAPTCHA failed to load")
        }
      }

      initRecaptcha()

      return () => {
        // Cleanup is handled by the script removal when component unmounts
        if (widgetIdRef.current !== null && window.grecaptcha) {
          try {
            window.grecaptcha.reset(widgetIdRef.current)
          } catch (error) {
            console.error("reCAPTCHA cleanup error:", error)
          }
        }
      }
    }, [siteKey])

    return (
      <div className="recaptcha-container">
        <div ref={containerRef} className="g-recaptcha" />
      </div>
    )
  },
)

Recaptcha.displayName = "Recaptcha"
