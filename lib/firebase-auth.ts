"use client"

import { auth, createRecaptchaVerifier, signInWithPhoneNumber } from "./firebase"
import type { ConfirmationResult } from "firebase/auth"

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

    if (!recaptchaVerifier) {
      throw new Error("Failed to create reCAPTCHA verifier")
    }

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

export const resendFirebaseOTP = async (phoneNumber: string): Promise<FirebaseOTPResult> => {
  try {
    console.log("🔄 Resending OTP via Firebase to:", phoneNumber)

    if (!auth) {
      throw new Error("Firebase auth not initialized")
    }

    // Clear existing reCAPTCHA and create new one
    const container = document.getElementById("recaptcha-container")
    if (container) {
      container.innerHTML = ""
    }

    // Create new reCAPTCHA verifier for resend
    const recaptchaVerifier = createRecaptchaVerifier("recaptcha-container")

    if (!recaptchaVerifier) {
      throw new Error("Failed to create reCAPTCHA verifier for resend")
    }

    // Send OTP via Firebase
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)

    console.log("✅ OTP resent successfully")

    return {
      success: true,
      confirmationResult,
    }
  } catch (error: any) {
    console.error("❌ Error resending Firebase OTP:", error)

    let errorMessage = "Failed to resend OTP"

    if (error.code === "auth/captcha-check-failed") {
      errorMessage = "Security verification failed. Please complete the reCAPTCHA."
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
  email?: string,
): Promise<FirebaseVerifyResult> => {
  try {
    console.log("🔍 Verifying Firebase OTP...")

    // Verify OTP with Firebase
    const result = await confirmationResult.confirm(otp)

    // Get Firebase ID token
    const idToken = await result.user.getIdToken()

    console.log("✅ Firebase OTP verified, sending to server...")

    // For login, don't generate temporary email - let server handle existing account
    const payload: any = {
      phone: phone,
      otp: "FIREBASE_VERIFIED", // Special marker to indicate Firebase verification
      purpose: purpose,
      firebaseIdToken: idToken, // Include Firebase ID token for server verification
      firebaseVerified: true, // Flag to indicate this came from Firebase
    }

    // Only add name and email for registration
    if (purpose === "registration") {
      payload.name = name || "User"
      payload.email = email || `${phone.replace("+", "")}@temp.oneofwun.com`
    } else {
      // For login, let the server find the existing account by phone
      payload.name = name || "User" // Provide fallback name
    }

    console.log("📤 Sending payload to server:", payload)

    // Send to the correct Firebase OTP endpoint
    const response = await fetch("https://api.yespstudio.com/api/1D70I7/firebase-otp/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    console.log("📥 Server response:", data)

    if (response.ok) {
      console.log("✅ Server verification successful:", data)

      // Extract customer data properly
      let customer = data.customer || data.user

      // If customer has temporary email, try to get real data from server response
      if (customer && customer.email && customer.email.includes("@temp.oneofwun.com")) {
        console.log("🔄 Customer has temporary email, checking for real data...")

        // If this is a login and we have better customer data in the response
        if (purpose === "login" && data.existingCustomer) {
          customer = data.existingCustomer
          console.log("✅ Using existing customer data:", customer)
        }
      }

      return {
        success: true,
        token: data.token,
        customer: customer,
      }
    } else {
      throw new Error(data.error || data.message || "Server verification failed")
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
