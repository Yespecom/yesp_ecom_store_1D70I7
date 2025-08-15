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

    // Create new reCAPTCHA verifier
    currentRecaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "normal",
      callback: (response: any) => {
        console.log("✅ reCAPTCHA solved:", response ? "Success" : "Failed")
      },
      "expired-callback": () => {
        console.log("❌ reCAPTCHA expired - please refresh")
      },
      "error-callback": (error: any) => {
        console.error("❌ reCAPTCHA error:", error)
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
