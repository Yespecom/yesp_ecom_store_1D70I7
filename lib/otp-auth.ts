const OTP_DOMAIN = "https://api.yespstudio.com"
export const STORE_ID = "1D70I7"
const OTP_BASE = `${OTP_DOMAIN}/api/${STORE_ID}/firebase-otp`

export type OtpPurpose = "login" | "registration"
export type OtpChannel = "sms" | "call"

export interface OtpRequestSuccess {
  message: string
  provider: "firebase" | "twilio-verify" | "sms" | "fast2sms" | string
  purpose: OtpPurpose
  status?: "pending" | "sent" | string
  expiresIn?: string
  dev?: {
    code?: string
  }
}

export interface TokenInfo {
  issuedAt: string
  expiresAt: string
  ttlSeconds: number
}

export interface CustomerDTO {
  id: string
  name: string
  email?: string | null
  phone: string
  totalSpent?: number
  totalOrders?: number
  addresses?: any[]
  preferences?: Record<string, any>
  tier?: string
}

export interface OtpVerifySuccess {
  message: string
  method: "phone_otp"
  token: string
  customer: CustomerDTO
  storeId: string
  tenantId: string
  tokenInfo?: TokenInfo
  expiresIn?: string
}

type ErrorWithCode = Error & { code?: string; retryAfter?: number; status?: number }

async function parseError(res: Response): Promise<ErrorWithCode> {
  const err: ErrorWithCode = new Error("Request failed")
  err.status = res.status
  let bodyText = ""
  try {
    bodyText = await res.text()
    const json = bodyText ? JSON.parse(bodyText) : null
    const msg = json?.message || json?.error || res.statusText || "Request failed"
    err.message = msg
    if (json?.code && typeof json.code === "string") {
      err.code = json.code
    } else {
      // Map common statuses to codes if backend doesn't send code
      if (res.status === 400) err.code = "BAD_REQUEST"
      if (res.status === 401) err.code = "UNAUTHORIZED"
      if (res.status === 404) err.code = "NOT_FOUND"
      if (res.status === 429) err.code = "OTP_RATE_LIMIT_EXCEEDED"
      if (res.status >= 500) err.code = "SERVER_ERROR"
    }
  } catch {
    // Non-JSON error payloads (e.g. HTML 404 page)
    err.message = bodyText || res.statusText || `HTTP ${res.status}`
    if (res.status === 404) err.code = "NOT_FOUND"
  }
  const retryAfter = res.headers.get("Retry-After")
  if (retryAfter) {
    const sec = Number.parseInt(retryAfter, 10)
    if (!Number.isNaN(sec)) err.retryAfter = sec
  }
  return err
}

export function isValidE164Phone(input: string): boolean {
  // E.164 allows up to 15 digits. We'll accept 8-15 for practical purposes.
  return /^\+[1-9]\d{7,14}$/.test(input.trim())
}

export async function requestPhoneOtp(params: {
  phone: string
  purpose?: OtpPurpose
  channel?: OtpChannel
  storeId?: string
  name?: string
}): Promise<OtpRequestSuccess> {
  const { phone, purpose = "login", channel = "sms", storeId = STORE_ID, name } = params
  const url = `${OTP_DOMAIN}/api/${storeId}/firebase-otp/send-otp`

  const requestBody: any = {
    phone,
    purpose,
  }

  // Add name for registration
  if (purpose === "registration" && name) {
    requestBody.name = name
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(requestBody),
  })

  if (!res.ok) {
    throw await parseError(res)
  }

  const data = (await res.json()) as OtpRequestSuccess
  return data
}

export async function verifyPhoneOtp(params: {
  phone: string
  otp: string
  purpose?: OtpPurpose
  name?: string
  rememberMe?: boolean
  storeId?: string
}): Promise<OtpVerifySuccess> {
  const { phone, otp, purpose = "login", name, rememberMe = true, storeId = STORE_ID } = params
  const url = `${OTP_DOMAIN}/api/${storeId}/firebase-otp/verify-otp`

  const requestBody: any = {
    phone,
    otp,
    purpose,
    rememberMe,
  }

  // Add name for registration
  if (purpose === "registration" && name) {
    requestBody.name = name
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(requestBody),
  })

  if (!res.ok) {
    throw await parseError(res)
  }

  const data = (await res.json()) as OtpVerifySuccess
  return data
}
