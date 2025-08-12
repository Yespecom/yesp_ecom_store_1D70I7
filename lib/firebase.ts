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

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
const auth: Auth = getAuth(app)

// Set language code for SMS
auth.languageCode = "en"

// Create reCAPTCHA verifier
export const createRecaptchaVerifier = (containerId: string) => {
  if (typeof window === "undefined") return null

  // Clear any existing reCAPTCHA
  const container = document.getElementById(containerId)
  if (container) {
    container.innerHTML = ""
  }

  return new RecaptchaVerifier(auth, containerId, {
    size: "normal",
    callback: (response: any) => {
      console.log("✅ reCAPTCHA solved:", response)
    },
    "expired-callback": () => {
      console.log("❌ reCAPTCHA expired")
    },
  })
}

export { auth, signInWithPhoneNumber }
export default app
