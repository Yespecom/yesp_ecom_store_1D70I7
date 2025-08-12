"use client"

// Phone number validation and formatting utilities
export const isValidE164Phone = (phone: string): boolean => {
  // E.164 format: +[country code][number]
  const e164Regex = /^\+[1-9]\d{1,14}$/
  return e164Regex.test(phone)
}

export const formatPhoneForDisplay = (phone: string): string => {
  // Remove the + and format for display
  if (phone.startsWith("+")) {
    const cleaned = phone.substring(1)
    if (cleaned.length >= 10) {
      // Format as: +XX XXXXX XXXXX
      const countryCode = cleaned.substring(0, cleaned.length - 10)
      const number = cleaned.substring(cleaned.length - 10)
      const part1 = number.substring(0, 5)
      const part2 = number.substring(5)
      return `+${countryCode} ${part1} ${part2}`
    }
  }
  return phone
}

export const maskPhoneNumber = (phone: string): string => {
  if (phone.length < 4) return phone
  const visible = phone.substring(0, 3) + phone.substring(phone.length - 2)
  const masked = "*".repeat(phone.length - 5)
  return visible.substring(0, 3) + masked + visible.substring(3)
}

export const getCountryCodeFromPhone = (phone: string): string => {
  if (!phone.startsWith("+")) return ""

  // Common country codes
  const countryCodes: { [key: string]: string } = {
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
    "+52": "MX",
    "+61": "AU",
    "+82": "KR",
    "+65": "SG",
    "+60": "MY",
    "+66": "TH",
    "+84": "VN",
    "+62": "ID",
    "+63": "PH",
  }

  // Try to match country codes (longest first)
  const sortedCodes = Object.keys(countryCodes).sort((a, b) => b.length - a.length)

  for (const code of sortedCodes) {
    if (phone.startsWith(code)) {
      return countryCodes[code]
    }
  }

  return "Unknown"
}

// Debug logging utility
export const logOTPDebug = (message: string, data?: any) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`🔐 OTP Debug: ${message}`, data || "")
  }
}
