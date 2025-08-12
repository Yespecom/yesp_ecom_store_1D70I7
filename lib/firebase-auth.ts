"use client"

import { auth, createRecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "./firebase"

export type { ConfirmationResult }

interface FirebaseOTPResult {
  success: boolean
  confirmationResult?: ConfirmationResult
  error?: string
}

interface FirebaseVerifyResult {
  success: boolean
  token?: string
  customer?: any
  error?: string
}

export const sendFirebaseOTP = async (phoneNumber: string): Promise<FirebaseOTPResult> => {
  try {
    console.log("📱 Sending OTP via Firebase to:", phoneNumber)

    if (!auth) {
      throw new Error("Firebase auth not initialized")
    }

    // Create reCAPTCHA verifier
    const recaptchaVerifier = createRecaptchaVerifier("recaptcha-container")

    // Send OTP via Firebase
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)

    return {
      success: true,
      confirmationResult,
    }
  } catch (error: any) {
    console.error("❌ Error sending Firebase OTP:", error)

    let errorMessage = "Failed to send OTP"

    if (error.code === "auth/captcha-check-failed") {
      errorMessage = "Security verification failed. Please ensure you're accessing from an authorized domain."
    } else if (error.code === "auth/invalid-phone-number") {
      errorMessage = "Invalid phone number format"
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many requests. Please try again later."
    } else if (error.message) {
      errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

export const verifyFirebaseOTP = async (
  confirmationResult: ConfirmationResult,
  otp: string,
  phone: string,
  purpose: string,
  name?: string,
): Promise<FirebaseVerifyResult> => {
  try {
    console.log("🔍 Verifying Firebase OTP...")

    // Verify OTP with Firebase
    const result = await confirmationResult.confirm(otp)

    // Get Firebase ID token
    const idToken = await result.user.getIdToken()

    console.log("✅ Firebase OTP verified, sending to server...")

    // Send ID token to your server for verification
    const response = await fetch("/api/1D70I7/firebase-otp/verify-firebase-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: phone,
        firebaseIdToken: idToken,
        purpose: purpose,
        name: name,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      console.log("✅ Server verification successful:", data)
      return {
        success: true,
        token: data.token,
        customer: data.customer,
      }
    } else {
      throw new Error(data.error || "Server verification failed")
    }
  } catch (error: any) {
    console.error("❌ Error verifying Firebase OTP:", error)

    let errorMessage = "Failed to verify OTP"

    if (error.code === "auth/invalid-verification-code") {
      errorMessage = "Invalid OTP code"
    } else if (error.code === "auth/code-expired") {
      errorMessage = "OTP code has expired"
    } else if (error.message) {
      errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
