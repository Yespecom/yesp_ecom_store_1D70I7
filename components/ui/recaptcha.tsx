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
  action?: string
  className?: string
}

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
      render: (container: string | HTMLElement, options: any) => number
      reset: (widgetId?: number) => void
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
  action = "submit",
  className = "",
}: RecaptchaProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recaptchaRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<number | null>(null)

  useEffect(() => {
    // Load reCAPTCHA script
    const loadRecaptcha = () => {
      if (window.grecaptcha) {
        setIsLoaded(true)
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
      script.onerror = () => {
        setError("Failed to load reCAPTCHA")
        onError?.("Failed to load reCAPTCHA")
      }
      document.head.appendChild(script)
    }

    loadRecaptcha()
  }, [siteKey, onError])

  const executeRecaptcha = async () => {
    if (!window.grecaptcha || !isLoaded) {
      const errorMsg = "reCAPTCHA not loaded"
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const token = await window.grecaptcha.execute(siteKey, { action })
      onVerify(token)
    } catch (err) {
      const errorMsg = "reCAPTCHA verification failed"
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const renderVisibleRecaptcha = () => {
    if (!window.grecaptcha || !recaptchaRef.current) return

    try {
      widgetIdRef.current = window.grecaptcha.render(recaptchaRef.current, {
        sitekey: siteKey,
        theme,
        size,
        callback: onVerify,
        "error-callback": () => {
          const errorMsg = "reCAPTCHA verification failed"
          setError(errorMsg)
          onError?.(errorMsg)
        },
        "expired-callback": () => {
          onExpired?.()
          setError("reCAPTCHA expired, please try again")
        },
      })
    } catch (err) {
      const errorMsg = "Failed to render reCAPTCHA"
      setError(errorMsg)
      onError?.(errorMsg)
    }
  }

  const resetRecaptcha = () => {
    if (window.grecaptcha && widgetIdRef.current !== null) {
      window.grecaptcha.reset(widgetIdRef.current)
    }
    setError(null)
  }

  // For invisible reCAPTCHA (v3)
  if (action && action !== "submit") {
    return (
      <div className={className}>
        {!isLoaded && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading reCAPTCHA...
          </div>
        )}
        {error && <div className="text-sm text-destructive">{error}</div>}
        {isLoaded && (
          <Button type="button" onClick={executeRecaptcha} disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify with reCAPTCHA
          </Button>
        )}
      </div>
    )
  }

  // For visible reCAPTCHA (v2)
  return (
    <div className={className}>
      {!isLoaded && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading reCAPTCHA...
        </div>
      )}
      {error && (
        <div className="text-sm text-destructive mb-2">
          {error}
          <Button type="button" variant="link" size="sm" onClick={resetRecaptcha} className="ml-2 p-0 h-auto">
            Try again
          </Button>
        </div>
      )}
      {isLoaded && (
        <div>
          <div ref={recaptchaRef} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={renderVisibleRecaptcha}
            className="mt-2 bg-transparent"
          >
            Show reCAPTCHA
          </Button>
        </div>
      )}
    </div>
  )
}

// Hook for easier usage
export function useRecaptcha(siteKey: string) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (window.grecaptcha) {
      setIsLoaded(true)
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
  }, [siteKey])

  const executeRecaptcha = async (action = "submit"): Promise<string | null> => {
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
