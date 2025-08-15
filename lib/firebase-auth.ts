"use client"

import {
  auth,
  createRecaptchaVerifier,
  clearRecaptchaVerifier,
  signInWithPhoneNumber,
  getRecaptchaV3Token,
} from "./firebase"
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
      return {
        success: false,
        error: "Firebase authentication is not properly configured. Please check your environment variables.",
      }
    }

    clearRecaptchaVerifier()

    // Wait a bit for DOM to be ready
    await new Promise((resolve) => setTimeout(resolve, 100))

    let recaptchaVerifier = null

    try {
      const v3Token = await getRecaptchaV3Token("phone_auth")
      if (v3Token) {
        console.log("✅ Using reCAPTCHA v3 token")
        // For v3, we still need a verifier but can use invisible mode
        recaptchaVerifier = createRecaptchaVerifier("recaptcha-container")
      }
    } catch (v3Error) {
      console.warn("⚠️ reCAPTCHA v3 failed, falling back to v2:", v3Error)
    }

    // Fallback to v2 if v3 didn't work
    if (!recaptchaVerifier) {
      recaptchaVerifier = createRecaptchaVerifier("recaptcha-container")
    }

    if (!recaptchaVerifier) {
      return {
        success: false,
        error: "Failed to initialize security verification. Please refresh the page and try again.",
      }
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
      errorMessage = "Security verification failed. Please complete the reCAPTCHA and try again."
    } else if (error.code === "auth/invalid-phone-number") {
      errorMessage = "Invalid phone number format. Please use international format (e.g., +919876543210)"
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many requests. Please wait a few minutes before trying again."
    } else if (error.code === "auth/quota-exceeded") {
      errorMessage = "SMS quota exceeded. Please try again later."
    } else if (error.code === "auth/unauthorized-domain") {
      errorMessage = "This domain is not authorized for Firebase authentication. Please contact support."
    } else if (error.code === "auth/app-not-authorized") {
      errorMessage = "App not authorized for Firebase authentication. Please contact support."
    } else if (error.message?.includes("reCAPTCHA")) {
      errorMessage = "reCAPTCHA verification failed. Please refresh the page and try again."
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

    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return {
        success: false,
        error: "Please enter a valid 6-digit OTP code",
      }
    }

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

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const response = await fetch("https://api.yespstudio.com/api/1D70I7/firebase-otp/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

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
    } catch (fetchError: any) {
      clearTimeout(timeoutId)

      if (fetchError.name === "AbortError") {
        throw new Error("Request timed out. Please check your internet connection and try again.")
      }
      throw fetchError
    }
  } catch (error: any) {
    console.error("❌ Error verifying Firebase OTP:", error)

    let errorMessage = "Failed to verify OTP"

    if (error.code === "auth/invalid-verification-code") {
      errorMessage = "Invalid OTP code. Please check the code and try again."
    } else if (error.code === "auth/code-expired") {
      errorMessage = "OTP code has expired. Please request a new code."
    } else if (error.code === "auth/session-expired") {
      errorMessage = "Session expired. Please start over."
    } else if (error.message?.includes("timeout") || error.message?.includes("network")) {
      errorMessage = "Network error. Please check your connection and try again."
    } else if (error.message?.includes("server")) {
      errorMessage = "Server error. Please try again in a few moments."
    } else if (error.message) {
      errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
