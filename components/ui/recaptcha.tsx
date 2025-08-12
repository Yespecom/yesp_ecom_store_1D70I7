"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "./button"
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
      ready: (callback: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
      render: (container: string | HTMLElement, options: any) => number
      reset: (widgetId?: number) => void
      getResponse: (widgetId?: number) => string
    }
    onRecaptchaLoad: () => void
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
  const scriptLoadedRef = useRef(false)

  useEffect(() => {
    const loadRecaptcha = () => {
      if (scriptLoadedRef.current) return

      // Define the onload callback before loading the script
      window.onRecaptchaLoad = () => {
        setIsLoaded(true)
        renderRecaptcha()
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="recaptcha/api.js"]')
      if (existingScript) {
        if (window.grecaptcha) {
          setIsLoaded(true)
          renderRecaptcha()
        }
        return
      }

      const script = document.createElement("script")
      script.src = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit"
      script.async = true
      script.defer = true
      script.onerror = () => {
        const errorMsg = "Failed to load reCAPTCHA script"
        setError(errorMsg)
        onError?.(errorMsg)
      }

      document.head.appendChild(script)
      scriptLoadedRef.current = true
    }

    const renderRecaptcha = () => {
      if (!window.grecaptcha || !recaptchaRef.current || widgetIdRef.current !== null) {
        return
      }

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
      } catch (err) {
        const errorMsg = "Failed to render reCAPTCHA widget"
        setError(errorMsg)
        onError?.(errorMsg)
      }
    }

    loadRecaptcha()

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
      {!isLoaded && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading reCAPTCHA...
        </div>
      )}

      {error && (
        <div className="text-sm text-destructive mb-2 p-2 bg-destructive/10 rounded">
          {error}
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={resetRecaptcha}
            className="ml-2 p-0 h-auto text-destructive hover:text-destructive/80"
          >
            Try again
          </Button>
        </div>
      )}

      {isLoaded && <div ref={recaptchaRef} className="flex justify-center" />}
    </div>
  )
}

// Simplified hook for v3 invisible reCAPTCHA
export function useRecaptchaV3(siteKey: string) {
  const [isLoaded, setIsLoaded] = useState(false)
  const scriptLoadedRef = useRef(false)

  useEffect(() => {
    if (scriptLoadedRef.current) return

    const loadRecaptcha = () => {
      // Check if script already exists
      const existingScript = document.querySelector(`script[src*="render=${siteKey}"]`)
      if (existingScript) {
        if (window.grecaptcha) {
          window.grecaptcha.ready(() => setIsLoaded(true))
        }
        return
      }

      const script = document.createElement("script")
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
      script.async = true
      script.defer = true
      script.onload = () => {
        window.grecaptcha.ready(() => {
          setIsLoaded(true)
        })
      }
      document.head.appendChild(script)
      scriptLoadedRef.current = true
    }

    loadRecaptcha()
  }, [siteKey])

  const executeRecaptcha = async (action = "submit"): Promise<string> => {
    if (!window.grecaptcha || !isLoaded) {
      throw new Error("reCAPTCHA not loaded")
    }

    try {
      const token = await window.grecaptcha.execute(siteKey, { action })
      return token
    } catch (error) {
      throw new Error("reCAPTCHA verification failed")
    }
  }

  return { isLoaded, executeRecaptcha }
}
