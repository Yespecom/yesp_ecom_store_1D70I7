"use client"

// Phone number validation
export const isValidE164Phone = (phone: string): boolean => {
  // E.164 format: +[country code][number]
  const e164Regex = /^\+[1-9]\d{1,14}$/
  return e164Regex.test(phone)
}

// Format phone number for display
export const formatPhoneForDisplay = (phone: string): string => {
  if (!phone) return ""

  // Remove + and format for display
  const cleaned = phone.replace(/\D/g, "")

  if (cleaned.length >= 10) {
    // Format as: +XX XXXXX XXXXX
    const countryCode = cleaned.slice(0, -10)
    const number = cleaned.slice(-10)
    const formatted = number.replace(/(\d{5})(\d{5})/, "$1 $2")
    return `+${countryCode} ${formatted}`
  }

  return phone
}

// Mask phone number for security
export const maskPhoneNumber = (phone: string): string => {
  if (!phone) return ""

  if (phone.length <= 4) return phone

  const start = phone.slice(0, 3)
  const end = phone.slice(-2)
  const middle = "*".repeat(phone.length - 5)

  return `${start}${middle}${end}`
}

// Extract country code from phone number
export const getCountryCode = (phone: string): string => {
  if (!phone.startsWith("+")) return ""

  // Common country codes
  const countryCodes = {
    "+1": "US/CA",
    "+44": "UK",
    "+91": "IN",
    "+86": "CN",
    "+81": "JP",
    "+49": "DE",
    "+33": "FR",
    "+39": "IT",
    "+34": "ES",
    "+7": "RU",
    "+55": "BR",
    "+61": "AU",
    "+27": "ZA",
    "+82": "KR",
    "+65": "SG",
    "+60": "MY",
    "+66": "TH",
    "+84": "VN",
    "+62": "ID",
    "+63": "PH",
  }

  // Find matching country code
  for (const [code, country] of Object.entries(countryCodes)) {
    if (phone.startsWith(code)) {
      return country
    }
  }

  return "Unknown"
}

// Debug logging for OTP operations
export const logOTPOperation = (operation: string, data: any) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`🔐 OTP ${operation}:`, data)
  }
}

// Generate a random OTP for testing (development only)
export const generateTestOTP = (): string => {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Test OTP generation is only available in development")
  }

  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Validate OTP format
export const isValidOTP = (otp: string): boolean => {
  return /^\d{6}$/.test(otp)
}
