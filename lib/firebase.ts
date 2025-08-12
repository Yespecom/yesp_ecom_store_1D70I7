"use client"

import { initializeApp, type FirebaseApp } from "firebase/app"
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, type Auth, type ConfirmationResult } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAMTB1AYYiCPL2nL22D96eF1TET3fe80iM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-ABCDEFGHIJ",
}

let app: FirebaseApp
let auth: Auth

// Initialize Firebase only on client side
if (typeof window !== "undefined") {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
}

export { auth }

// Create reCAPTCHA verifier
export const createRecaptchaVerifier = (containerId = "recaptcha-container") => {
  if (typeof window === "undefined" || !auth) {
    throw new Error("Firebase auth not initialized")
  }

  return new RecaptchaVerifier(auth, containerId, {
    size: "normal",
    callback: (response: string) => {
      console.log("✅ reCAPTCHA solved:", response.substring(0, 20) + "...")
    },
    "expired-callback": () => {
      console.log("❌ reCAPTCHA expired")
    },
    "error-callback": (error: any) => {
      console.error("❌ reCAPTCHA error:", error)
    },
  })
}

export { signInWithPhoneNumber, type ConfirmationResult }
