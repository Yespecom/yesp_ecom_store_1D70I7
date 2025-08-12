"use client"

import { auth, createRecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "./firebase"

export interface FirebaseAuthResult {
  success: boolean
  confirmationResult?: ConfirmationResult
  error?: string
}

export interface FirebaseVerifyResult {
  success: boolean
  token?: string
  customer?: any
  error?: string
}

export async function sendFirebaseOTP(phone: string): Promise<FirebaseAuthResult> {
  try {
    if (!auth) {
      throw new Error("Firebase auth not initialized")
    }

    console.log("📱 Sending OTP via Firebase to:", phone)

    // Create reCAPTCHA verifier
    const recaptchaVerifier = createRecaptchaVerifier("recaptcha-container")

    // Send OTP via Firebase (this sends REAL SMS)
    const confirmationResult = await signInWithPhoneNumber(auth, phone, recaptchaVerifier)

    console.log("✅ Firebase OTP sent successfully")

    return {
      success: true,
      confirmationResult,
    }
  } catch (error: any) {
    console.error("❌ Error sending Firebase OTP:", error)
    return {
      success: false,
      error: error.message || "Failed to send OTP",
    }
  }
}

export async function verifyFirebaseOTP(
  confirmationResult: ConfirmationResult,
  otp: string,
  phone: string,
  purpose: "login" | "registration",
  name?: string,
): Promise<FirebaseVerifyResult> {
  try {
    console.log("🔍 Verifying Firebase OTP...")

    // Verify OTP with Firebase
    const result = await confirmationResult.confirm(otp)

    // Get Firebase ID token
    const idToken = await result.user.getIdToken()

    console.log("✅ Firebase OTP verified, sending to server...")

    // Send ID token to your server
    const response = await fetch(`https://api.yespstudio.com/api/1D70I7/firebase-otp/verify-firebase-token`, {
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
      console.log("✅ Authentication successful:", data)

      return {
        success: true,
        token: data.token,
        customer: data.customer,
      }
    } else {
      throw new Error(data.error || "Authentication failed")
    }
  } catch (error: any) {
    console.error("❌ Error verifying Firebase OTP:", error)
    return {
      success: false,
      error: error.message || "Failed to verify OTP",
    }
  }
}
