// Minimal client for storefront OTP auth endpoints

type OtpPurpose = "login" | "registration"
type OtpChannel = "sms" | "call"

export interface OtpRequestResponse {
  message: string
  provider: "twilio-verify" | "sms" | "fast2sms" | "dev"
  status?: "pending"
  purpose: OtpPurpose
  expiresIn: string
  dev?: { code?: string }
}

export interface OtpVerifySuccess {
  message: string
  method: "phone_otp"
  token: string
  customer: {
    id: string
    name: string
    email?: string | null
    phone: string
    totalSpent?: number
    totalOrders?: number
    addresses?: any[]
    preferences?: any
    tier?: string
  }
  storeId: string
  tenantId: string
  tokenInfo: {
    issuedAt: string
    expiresAt: string
    ttlSeconds: number
  }
  expiresIn: string
}

export interface ApiError extends Error {
  status?: number
  code?: string
  details?: any
}

const STORE_ID = "1D70I7"

function makeError(message: string, status?: number, code?: string, details?: any): ApiError {
  const err = new Error(message) as ApiError
  err.status = status
  err.code = code
  err.details = details
  return err
}

export function isValidE164Phone(phone: string) {
  // E.164 must start with + and be 8-15 digits total (excluding plus)
  // Examples: +14155552671, +911234567890
  return /^\+[1-9]\d{7,14}$/.test(phone)
}

export async function requestPhoneOtp(params: {
  phone: string
  purpose?: OtpPurpose
  channel?: OtpChannel
}): Promise<OtpRequestResponse> {
  const { phone, purpose = "login", channel = "sms" } = params

  if (!phone) throw makeError("Phone is required", 400, "MISSING_PHONE")
  if (!isValidE164Phone(phone))
    throw makeError("Invalid phone format. Use E.164 like +14155552671", 400, "INVALID_PHONE")
  if (!["login", "registration"].includes(purpose)) {
    throw makeError("Invalid purpose. Use 'login' or 'registration'", 400, "INVALID_PURPOSE")
  }

  const res = await fetch(`/api/store/${STORE_ID}/auth/otp/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, purpose, channel }),
  })

  const text = await res.text()
  let data: any = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    // noop
  }

  if (!res.ok) {
    const code =
      data?.code ||
      (res.status === 429 ? "OTP_RATE_LIMIT_EXCEEDED" : res.status === 400 ? "INVALID_REQUEST" : "OTP_REQUEST_ERROR")
    const message = data?.message || `OTP request failed (${res.status})`
    const err = makeError(message, res.status, code, data)
    throw err
  }

  // Normalize provider in dev as 'dev' if dev code is provided
  if (data?.dev?.code && !data?.provider) {
    data.provider = "dev"
  }

  return data as OtpRequestResponse
}

export async function verifyPhoneOtp(params: {
  phone: string
  otp: string
  purpose?: OtpPurpose
  name?: string
  rememberMe?: boolean
}): Promise<OtpVerifySuccess> {
  const { phone, otp, purpose = "login", name, rememberMe } = params

  if (!phone || !otp) throw makeError("Missing phone or otp", 400, "MISSING_FIELDS")
  if (!isValidE164Phone(phone)) throw makeError("Invalid phone format", 400, "INVALID_PHONE")
  if (!/^\d{6}$/.test(otp)) throw makeError("OTP must be 6 digits", 400, "INVALID_OTP_FORMAT")
  if (!["login", "registration"].includes(purpose)) {
    throw makeError("Invalid purpose. Use 'login' or 'registration'", 400, "INVALID_PURPOSE")
  }

  const res = await fetch(`/api/store/${STORE_ID}/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp, purpose, name, rememberMe }),
  })

  const text = await res.text()
  let data: any = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    // noop
  }

  if (!res.ok) {
    const code =
      data?.code ||
      (res.status === 400
        ? data?.message?.includes("expired")
          ? "OTP_EXPIRED"
          : "INVALID_OTP"
        : res.status === 429
          ? "OTP_RATE_LIMIT_EXCEEDED"
          : "OTP_VERIFY_ERROR")
    const message = data?.message || `OTP verification failed (${res.status})`
    const err = makeError(message, res.status, code, data)
    throw err
  }

  return data as OtpVerifySuccess
}
