"use client"

// Phone number validation
export const isValidE164Phone = (phone: string): boolean => {
  const e164Regex = /^\+[1-9]\d{1,14}$/
  return e164Regex.test(phone)
}

// Format phone number for display
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return ""

  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, "")

  // Ensure it starts with +
  if (!cleaned.startsWith("+")) {
    return `+${cleaned}`
  }

  return cleaned
}

// Generate OTP (for testing purposes)
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Validate OTP format
export const isValidOTP = (otp: string): boolean => {
  return /^\d{6}$/.test(otp)
}

// Phone number country codes
export const countryCodes = [
  { code: "+1", country: "US/Canada", flag: "🇺🇸" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
  { code: "+7", country: "Russia", flag: "🇷🇺" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+52", country: "Mexico", flag: "🇲🇽" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
]

// Get country info from phone number
export const getCountryFromPhone = (phone: string) => {
  if (!phone.startsWith("+")) return null

  // Sort by code length (longest first) to match more specific codes first
  const sortedCodes = countryCodes.sort((a, b) => b.code.length - a.code.length)

  for (const country of sortedCodes) {
    if (phone.startsWith(country.code)) {
      return country
    }
  }

  return null
}

// Mask phone number for display
export const maskPhoneNumber = (phone: string): string => {
  if (!phone || phone.length < 4) return phone

  const country = getCountryFromPhone(phone)
  if (!country) return phone

  const number = phone.substring(country.code.length)
  if (number.length <= 4) return phone

  const masked = number.substring(0, 2) + "*".repeat(number.length - 4) + number.substring(number.length - 2)
  return country.code + masked
}

// Debug logging
export const logOTPDebug = (message: string, data?: any) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[OTP Debug] ${message}`, data || "")
  }
}
