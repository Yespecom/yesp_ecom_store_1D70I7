"use client"

import { auth, createRecaptchaVerifier, clearRecaptchaVerifier, signInWithPhoneNumber } from "./firebase"
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

    // Check if we're in the right domain context
    const currentDomain = typeof window !== "undefined" ? window.location.hostname : ""
    console.log("🌐 Current domain:", currentDomain)

    clearRecaptchaVerifier()

    // Wait a bit for DOM to be ready
    await new Promise((resolve) => setTimeout(resolve, 100))

    let recaptchaVerifier = null

    try {
      console.log("🔄 Initializing invisible reCAPTCHA for Firebase...")

      // Use invisible reCAPTCHA v2 which works better with Firebase phone auth
      recaptchaVerifier = createRecaptchaVerifier("recaptcha-container", true) // true for invisible mode

      if (recaptchaVerifier) {
        console.log("✅ Invisible reCAPTCHA initialized successfully")
      }
    } catch (recaptchaError: any) {
      console.warn("⚠️ reCAPTCHA initialization failed:", recaptchaError)

      if (recaptchaError.message?.includes("401") || recaptchaError.message?.includes("Unauthorized")) {
        return {
          success: false,
          error: `reCAPTCHA domain mismatch. Please configure your reCAPTCHA site key for domain: ${currentDomain}. Visit Google reCAPTCHA console to add this domain.`,
        }
      }
    }

    if (!recaptchaVerifier) {
      return {
        success: false,
        error:
          "Failed to initialize security verification. Please check your reCAPTCHA configuration and refresh the page.",
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
      const currentDomain = typeof window !== "undefined" ? window.location.hostname : ""
      errorMessage = `Security verification failed. Your reCAPTCHA site key may not be configured for domain: ${currentDomain}. Please check your reCAPTCHA console settings.`
    } else if (error.code === "auth/invalid-phone-number") {
      errorMessage = "Invalid phone number format. Please use international format (e.g., +919876543210)"
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many requests. Please wait a few minutes before trying again."
    } else if (error.code === "auth/quota-exceeded") {
      errorMessage = "SMS quota exceeded. Please try again later."
    } else if (error.code === "auth/unauthorized-domain") {
      const currentDomain = typeof window !== "undefined" ? window.location.hostname : ""
      errorMessage = `Domain ${currentDomain} is not authorized. Please add this domain to your Firebase project's authorized domains.`
    } else if (error.code === "auth/app-not-authorized") {
      errorMessage = "App not authorized. Please check your Firebase project configuration."
    } else if (error.message?.includes("reCAPTCHA") || error.message?.includes("401")) {
      const currentDomain = typeof window !== "undefined" ? window.location.hostname : ""
      errorMessage = `reCAPTCHA configuration error for domain ${currentDomain}. Please verify your site key is configured correctly.`
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

    const payload: any = {
      phone: phone,
      otp: "FIREBASE_VERIFIED",
      purpose: purpose,
      firebaseIdToken: idToken,
      firebaseVerified: true,
    }

    if (purpose === "registration") {
      payload.name = name || "User"
      payload.email = email || `${phone.replace("+", "")}@temp.oneofwun.com`
      payload.firstName = name?.split(" ")[0] || "User"
      payload.lastName = name?.split(" ").slice(1).join(" ") || ""
      payload.createAccount = true
    }

    console.log("📤 Sending payload to server:", payload)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

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

        const customer = data.customer || data.user || data.data?.customer || data.data?.user

        if (purpose === "login" && !customer && data.error?.includes("not found")) {
          return {
            success: false,
            error: "ACCOUNT_NOT_FOUND", // Special error code for UI handling
          }
        }

        if (customer) {
          // Normalize customer data structure
          const normalizedCustomer = {
            _id: customer._id || customer.id,
            name: customer.name || `${customer.firstName || ""} ${customer.lastName || ""}`.trim(),
            email: customer.email,
            phone: customer.phone || phone,
            firstName: customer.firstName || customer.name?.split(" ")[0] || "User",
            lastName: customer.lastName || customer.name?.split(" ").slice(1).join(" ") || "",
            ...customer,
          }

          return {
            success: true,
            token: data.token,
            customer: normalizedCustomer,
          }
        }

        return {
          success: true,
          token: data.token || "",
          customer: {
            name: name || "User",
            email: email || `${phone.replace("+", "")}@temp.oneofwun.com`,
            phone: phone,
            firstName: name?.split(" ")[0] || "User",
            lastName: name?.split(" ").slice(1).join(" ") || "",
          },
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

export const checkUserExists = async (phone: string): Promise<{ exists: boolean; user?: any }> => {
  try {
    console.log("🔍 Checking if user exists:", phone)

    const response = await fetch("https://api.yespstudio.com/api/1D70I7/auth/check-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    })

    const data = await response.json()

    if (response.ok) {
      return {
        exists: data.exists || false,
        user: data.user || null,
      }
    }

    return { exists: false }
  } catch (error) {
    console.error("❌ Error checking user existence:", error)
    return { exists: false }
  }
}
