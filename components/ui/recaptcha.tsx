"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

interface RecaptchaProps {
  siteKey: string
  onVerify: (token: string) => void
  onError?: (error: string) => void
  onExpired?: () => void
  theme?: "light" | "dark"
  size?: "compact" | "normal"
  className?: string
}

declare global {
  interface Window {
    grecaptcha: {
      render: (container: string | HTMLElement, options: any) => number
      reset: (widgetId?: number) => void
      getResponse: (widgetId?: number) => string
    }
  }
}

export function Recaptcha({
  siteKey,
  onVerify,
  onError,
  onExpired,
  theme = "light",
  size = "normal",
  className = "",
}: RecaptchaProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recaptchaRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<number | null>(null)

  useEffect(() => {
    // Check if reCAPTCHA script is already loaded
    const checkRecaptcha = () => {
      if (window.grecaptcha && recaptchaRef.current && widgetIdRef.current === null) {
        try {
          widgetIdRef.current = window.grecaptcha.render(recaptchaRef.current, {
            sitekey: siteKey,
            theme,
            size,
            callback: (token: string) => {
              setError(null)
              onVerify(token)
            },
            "error-callback": () => {
              const errorMsg = "reCAPTCHA verification failed"
              setError(errorMsg)
              onError?.(errorMsg)
            },
            "expired-callback": () => {
              const errorMsg = "reCAPTCHA expired, please try again"
              setError(errorMsg)
              onExpired?.()
            },
          })
          setIsLoaded(true)
        } catch (err) {
          const errorMsg = "Failed to render reCAPTCHA widget"
          setError(errorMsg)
          onError?.(errorMsg)
        }
      }
    }

    // If grecaptcha is already available, render immediately
    if (window.grecaptcha) {
      checkRecaptcha()
    } else {
      // Wait for the script to load (it's loaded in layout.tsx)
      const interval = setInterval(() => {
        if (window.grecaptcha) {
          checkRecaptcha()
          clearInterval(interval)
        }
      }, 100)

      // Cleanup interval after 10 seconds
      const timeout = setTimeout(() => {
        clearInterval(interval)
        if (!window.grecaptcha) {
          const errorMsg = "reCAPTCHA failed to load"
          setError(errorMsg)
          onError?.(errorMsg)
        }
      }, 10000)

      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }

    // Cleanup function
    return () => {
      if (widgetIdRef.current !== null && window.grecaptcha) {
        try {
          window.grecaptcha.reset(widgetIdRef.current)
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }, [siteKey, theme, size, onVerify, onError, onExpired])

  const resetRecaptcha = () => {
    if (window.grecaptcha && widgetIdRef.current !== null) {
      try {
        window.grecaptcha.reset(widgetIdRef.current)
        setError(null)
      } catch (err) {
        const errorMsg = "Failed to reset reCAPTCHA"
        setError(errorMsg)
        onError?.(errorMsg)
      }
    }
  }

  const getResponse = () => {
    if (window.grecaptcha && widgetIdRef.current !== null) {
      return window.grecaptcha.getResponse(widgetIdRef.current)
    }
    return ""
  }

  return (
    <div className={className}>
      {!isLoaded && !error && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 border border-gray-200 rounded">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading security verification...
        </div>
      )}

      {error && <div className="text-sm text-red-600 mb-2 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}

      <div ref={recaptchaRef} className="flex justify-center" />
    </div>
  )
}
