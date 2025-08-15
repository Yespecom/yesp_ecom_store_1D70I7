"use client"

import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth"
import type { Auth } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const validateFirebaseConfig = () => {
  const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"]
  const missing = requiredKeys.filter((key) => !firebaseConfig[key as keyof typeof firebaseConfig])

  if (missing.length > 0) {
    console.error("❌ Missing Firebase configuration:", missing)
    return false
  }
  return true
}

// Initialize Firebase only if config is valid
let app: any = null
let auth: Auth | null = null

if (validateFirebaseConfig()) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  auth = getAuth(app)
  // Set language code for SMS
  auth.languageCode = "en"
} else {
  console.error("❌ Firebase not initialized due to missing configuration")
}

let currentRecaptchaVerifier: RecaptchaVerifier | null = null
let recaptchaV3Instance: any = null
let recaptchaV3Ready = false

export const initializeRecaptchaV3 = (): Promise<boolean> => {
  if (typeof window === "undefined") {
    console.error("❌ Cannot initialize reCAPTCHA v3: not in browser environment")
    return Promise.resolve(false)
  }

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
  if (!siteKey) {
    console.error("❌ reCAPTCHA v3 site key not configured")
    return Promise.resolve(false)
  }

  // Return existing instance if already ready
  if (recaptchaV3Ready && window.grecaptcha) {
    return Promise.resolve(true)
  }

  return new Promise((resolve) => {
    try {
      // Check if script already exists
      const existingScript = document.querySelector(`script[src*="recaptcha/api.js"]`)
      if (existingScript) {
        existingScript.remove()
      }

      const script = document.createElement("script")
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
      script.async = true
      script.defer = true

      script.onload = () => {
        if (window.grecaptcha) {
          window.grecaptcha.ready(() => {
            recaptchaV3Instance = window.grecaptcha
            recaptchaV3Ready = true
            console.log("✅ reCAPTCHA v3 initialized successfully")
            resolve(true)
          })
        } else {
          console.error("❌ reCAPTCHA v3 failed to load")
          resolve(false)
        }
      }

      script.onerror = () => {
        console.error("❌ Failed to load reCAPTCHA v3 script")
        resolve(false)
      }

      document.head.appendChild(script)
    } catch (error) {
      console.error("❌ Error initializing reCAPTCHA v3:", error)
      resolve(false)
    }
  })
}

export const getRecaptchaV3Token = async (action = "phone_auth"): Promise<string | null> => {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

  if (!siteKey) {
    console.error("❌ reCAPTCHA v3 site key not configured")
    return null
  }

  if (!recaptchaV3Ready || !window.grecaptcha) {
    console.log("🔄 Initializing reCAPTCHA v3...")
    const initialized = await initializeRecaptchaV3()
    if (!initialized) {
      return null
    }
  }

  try {
    const token = await window.grecaptcha.execute(siteKey, { action })
    console.log("✅ reCAPTCHA v3 token generated for action:", action)
    return token
  } catch (error) {
    console.error("❌ Error getting reCAPTCHA v3 token:", error)
    return null
  }
}

export const createRecaptchaVerifier = (containerId: string) => {
  if (typeof window === "undefined" || !auth) {
    console.error("❌ Cannot create reCAPTCHA: window or auth not available")
    return null
  }

  try {
    // Clear any existing reCAPTCHA verifier
    if (currentRecaptchaVerifier) {
      try {
        currentRecaptchaVerifier.clear()
      } catch (error) {
        console.warn("⚠️ Error clearing previous reCAPTCHA:", error)
      }
      currentRecaptchaVerifier = null
    }

    // Clear container content
    const container = document.getElementById(containerId)
    if (container) {
      container.innerHTML = ""
    } else {
      console.error(`❌ reCAPTCHA container '${containerId}' not found`)
      return null
    }

    // Create new invisible reCAPTCHA verifier
    currentRecaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: (response: any) => {
        console.log("✅ reCAPTCHA v2 solved")
      },
      "expired-callback": () => {
        console.log("❌ reCAPTCHA v2 expired")
      },
      "error-callback": (error: any) => {
        console.error("❌ reCAPTCHA v2 error:", error)
      },
    })

    return currentRecaptchaVerifier
  } catch (error) {
    console.error("❌ Error creating reCAPTCHA verifier:", error)
    return null
  }
}

export const clearRecaptchaVerifier = () => {
  if (currentRecaptchaVerifier) {
    try {
      currentRecaptchaVerifier.clear()
      currentRecaptchaVerifier = null
      console.log("✅ reCAPTCHA verifier cleared")
    } catch (error) {
      console.warn("⚠️ Error clearing reCAPTCHA verifier:", error)
    }
  }
}

export { auth, signInWithPhoneNumber }
export default app
