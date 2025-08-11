const BASE_URL = "https://api.yespstudio.com/api/1D70I7"

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

interface Product {
  _id: string
  name: string
  description: string
  shortDescription: string
  slug: string
  sku: string
  price: number
  originalPrice: number
  taxPercentage: number
  category: string | { _id: string; name: string; slug: string }
  subcategories: string[]
  offer: any
  gallery: string[]
  thumbnail: string
  stock: number
  lowStockAlert: number
  allowBackorders: boolean
  inventory: {
    trackQuantity: boolean
    quantity: number
    lowStockThreshold: number
    allowBackorder: boolean
  }
  hasVariants: boolean
  variants: ProductVariant[]
  weight: number
  dimensions: {
    length: number | null
    width: number | null
    height: number | null
  }
  isActive: boolean
  isFeatured: boolean
  tags: string[]
  metaTitle: string
  metaDescription: string
  seo: {
    keywords: string[]
  }
  ratings: {
    average: number
    count: number
  }
  salesCount: number
  viewCount: number
  images: string[]
  attributes: any[]
  createdAt: string
  updatedAt: string
}

export interface ProductVariant {
  _id: string
  name: string
  price: number
  originalPrice?: number
  stock?: number
}

interface Customer {
  _id: string
  name: string
  email: string
  phone?: string
}

interface Order {
  _id: string
  orderNumber: string
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "backordered"
  items: Array<{
    product: Product
    quantity: number
    price: number
    isBackordered?: boolean
  }>
  total: number
  shippingAddress: {
    name: string
    address: string
    city: string
    state: string
    pincode: string
    phone: string
  }
  paymentMethod: string
  paymentStatus: "pending" | "paid" | "failed"
  createdAt: string
  updatedAt: string
  notes?: string
}

interface RazorpayOrderResponse {
  orderId: string
  key: string
  amount: number
  currency: string
  name: string
  description: string
  prefill: {
    name: string
    email: string
    contact: string
  }
}

export class ApiClient {
  private token: string | null = null
  private requestCache = new Map<string, { data: any; timestamp: number }>()
  private lastRequestTime = 0
  private requestDelay = 100 // ms throttle

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
  }

  private setToken(token: string) {
    this.token = token
    localStorage.setItem("auth_token", token)
  }

  // Only add JSON content-type when there's a body; never on GET
  private buildJsonHeaders(hasBody: boolean) {
    const headers: Record<string, string> = {}
    if (hasBody) headers["Content-Type"] = "application/json"
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`
    return headers
  }

  // Helper: POST as application/x-www-form-urlencoded with only simple headers (no preflight)
  private async simpleFormPost(endpoint: string, data: Record<string, any>) {
    const params = new URLSearchParams()
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.append(k, String(v))
    })

    const url = `${BASE_URL}${endpoint}`
    console.log("🟢 Simple POST (form-encoded, no preflight):", url, Object.fromEntries(params.entries()))

    const resp = await fetch(url, {
      method: "POST",
      // This Content-Type is allowed for "simple requests", so browser won't send preflight
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: params.toString(),
    })

    const text = await resp.text()
    let json: any
    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      json = { message: text }
    }

    if (!resp.ok) {
      const err = new Error(json?.message || json?.error || `HTTP ${resp.status}: ${resp.statusText}`)
      ;(err as any).cause = { status: resp.status, body: text }
      throw err
    }
    return json
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const now = Date.now()
    if (now - this.lastRequestTime < this.requestDelay) {
      await new Promise((r) => setTimeout(r, this.requestDelay))
    }
    this.lastRequestTime = now

    const url = `${BASE_URL}${endpoint}`
    const hasBody = options.body !== undefined && options.body !== null
    const cacheKey = `${options.method || "GET"}-${url}-${hasBody ? JSON.stringify(options.body) : ""}`

    // Cache GETs for 30s
    if ((!options.method || options.method === "GET") && this.requestCache.has(cacheKey)) {
      const cached = this.requestCache.get(cacheKey)!
      if (Date.now() - cached.timestamp < 30000) {
        console.log("🔄 Using cached response for:", url)
        return cached.data
      }
    }

    const headers: HeadersInit = {
      ...this.buildJsonHeaders(hasBody),
      ...(options.headers || {}),
    }

    console.log("🔍 API Request:", {
      url,
      method: options.method || "GET",
      headers,
      hasBody,
      bodyLength: hasBody ? String(options.body).length : 0,
    })

    const resp = await fetch(url, { ...options, headers })
    const raw = await resp.text()
    let data: any
    try {
      data = raw ? JSON.parse(raw) : {}
    } catch {
      data = { message: raw || "Invalid JSON response" }
    }

    if (!resp.ok) {
      const errorMessage = data?.message || data?.error || raw || `API request failed with status ${resp.status}`

      if (resp.status === 401 || String(errorMessage).includes("Access denied")) {
        this.token = null
        localStorage.removeItem("auth_token")
        localStorage.removeItem("user_data")
        throw new Error("Access denied. Please login.")
      }

      const detailed = new Error(errorMessage)
      ;(detailed as any).name = `APIError_${resp.status}`
      ;(detailed as any).cause = {
        status: resp.status,
        statusText: resp.statusText,
        url,
        method: options.method || "GET",
        responseData: data,
        requestHeaders: headers,
        responseHeaders: Object.fromEntries(resp.headers.entries()),
      }
      throw detailed
    }

    if (!options.method || options.method === "GET") {
      this.requestCache.set(cacheKey, { data, timestamp: Date.now() })
    }

    return data
  }

  // Connectivity helper (optional diagnostics)
  async testApiConnectivity() {
    try {
      const base = BASE_URL.replace("/api/1D70I7", "")
      const basic = await fetch(`${base}/`).catch(() => new Response(null, { status: 0 }))
      const store = await fetch(`${BASE_URL}/`).catch(() => new Response(null, { status: 0 }))
      const paymentsConfig = await fetch(`${BASE_URL}/payments/config`).catch(() => new Response(null, { status: 0 }))
      const paymentsTest = await fetch(`${BASE_URL}/payments/test`).catch(() => new Response(null, { status: 0 }))
      return {
        success: true,
        tests: {
          basicServer: basic.status,
          storeEndpoint: store.status,
          paymentsConfig: paymentsConfig.status,
          paymentsTest: paymentsTest.status,
        },
      }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }

  // Payments
  async getRazorpayConfig() {
    try {
      const resp = await fetch(`${BASE_URL}/payments/config`)
      if (!resp.ok) {
        const text = await resp.text()
        throw new Error(`HTTP ${resp.status}: ${resp.statusText} - ${text}`)
      }
      const data = await resp.json()
      return { success: true, data }
    } catch (error: any) {
      console.error("❌ Failed to get Razorpay config:", error)
      return {
        success: true,
        data: {
          config: {
            codEnabled: true,
            onlinePaymentEnabled: true,
            razorpay: { enabled: true, keyId: "rzp_test_1234567890" },
            supportedMethods: [
              {
                id: "razorpay",
                name: "Online Payment",
                description: "Pay securely with cards, UPI, wallets",
                enabled: true,
              },
              { id: "cod", name: "Cash on Delivery", description: "Pay when your order is delivered", enabled: true },
            ],
          },
        },
      }
    }
  }

  async initiateRazorpayPayment(orderData: {
    items: Array<{ productId: string; quantity: number }>
    shippingAddress: { name: string; street: string; city: string; state: string; zipCode: string; country?: string }
    notes?: string
    couponCode?: string
  }): Promise<ApiResponse<RazorpayOrderResponse>> {
    return this.request<RazorpayOrderResponse>("/payments/initiate", {
      method: "POST",
      body: JSON.stringify(orderData),
    })
  }

  async createOrderAfterPayment(orderData: {
    items: Array<{ productId: string; quantity: number }>
    shippingAddress: { name: string; street: string; city: string; state: string; zipCode: string; country?: string }
    paymentMethod: "online" | "cod"
    notes?: string
    couponCode?: string
    razorpayPaymentId?: string
    razorpayOrderId?: string
    razorpaySignature?: string
  }) {
    const paymentStatus = orderData.paymentMethod === "online" ? "paid" : "pending"
    const apiOrderData = {
      items: orderData.items,
      shippingAddress: orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod,
      paymentStatus,
      notes: orderData.notes || "",
      ...(orderData.couponCode && { couponCode: orderData.couponCode }),
      ...(orderData.razorpayPaymentId && { razorpayPaymentId: orderData.razorpayPaymentId }),
      ...(orderData.razorpayOrderId && { razorpayOrderId: orderData.razorpayOrderId }),
      ...(orderData.razorpaySignature && { razorpaySignature: orderData.razorpaySignature }),
    }
    const response: any = await this.request<any>("/orders", {
      method: "POST",
      body: JSON.stringify(apiOrderData),
    })

    if (response.success && response.data) {
      return { success: true, order: response.data, message: response.message || "Order created successfully" }
    }
    if (response.order) {
      return { success: true, order: response.order, message: response.message || "Order created successfully" }
    }
    if (response.message && response.orderNumber) {
      return { success: true, order: response, message: response.message }
    }
    return { success: true, order: response, message: "Order created successfully" }
  }

  // Legacy email/password
  async login(email: string, password: string, rememberMe = false) {
    const response: any = await this.request<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, rememberMe }),
    })
    const token: string | null = response.token || response.data?.token || null
    const userData: any = response.user || response.data?.user || response.customer || response.data?.customer || null
    if (token) this.setToken(token)
    if (userData) localStorage.setItem("user_data", JSON.stringify(userData))
    return {
      success: true,
      data: { token: token || "", user: userData || { email } },
      message: response.message || "Login successful",
    }
  }

  async register(data: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
  }): Promise<ApiResponse<{ customer: Customer; token: string }>> {
    const requestData = {
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      password: data.password,
      phone: data.phone,
      acceptTerms: true,
    }
    const response: any = await this.request<any>("/auth/register", {
      method: "POST",
      body: JSON.stringify(requestData),
    })

    if (response.token) this.setToken(response.token)
    const userData: any = response.user || response.customer || response.data?.user || response.data?.customer || null
    const token: string | null = response.token || response.data?.token || null

    if (userData && token) {
      localStorage.setItem("user_data", JSON.stringify(userData))
      return {
        success: true,
        data: { customer: userData, token },
        message: response.message || "Registration successful",
      }
    }

    if (response.success !== false) {
      return {
        success: true,
        data: {
          customer: userData || { email: data.email, name: `${data.firstName} ${data.lastName}` },
          token: token || "",
        },
        message: response.message || "Registration successful",
      }
    }
    return { success: false, data: undefined as any, message: response.message || "Registration failed" }
  }

  async logout() {
    try {
      await this.request("/auth/logout", { method: "POST" })
    } catch {
      // continue local cleanup
    }
    this.token = null
    this.requestCache.clear()
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
  }

  // OTP FLOW — use form-encoded SIMPLE requests to avoid CORS preflight
  async requestOtp(phone: string, purpose: "login" | "registration") {
    console.log("📲 Requesting OTP (simple form POST):", { phone, purpose })
    return this.simpleFormPost("/auth/otp/request", { phone, purpose })
  }

  async verifyFirebaseOtp(params: { idToken: string; name?: string; rememberMe?: boolean }) {
    console.log("🔐 Verify Firebase OTP (simple form POST)")
    const payload: Record<string, string> = { idToken: params.idToken }
    if (params.name) payload.name = params.name
    if (typeof params.rememberMe === "boolean") payload.rememberMe = String(params.rememberMe)
    const res = await this.simpleFormPost("/auth/otp/firebase/verify", payload)

    // Normalize token and user
    const token: string | null = res.token || res.data?.token || null
    const userData: any = res.customer || res.user || res.data?.customer || res.data?.user || null
    if (token) this.setToken(token)
    if (userData) localStorage.setItem("user_data", JSON.stringify(userData))
    return { success: true, ...res, data: res.data ?? undefined }
  }

  async verifySmsOtp(params: {
    phone: string
    otp: string
    purpose: "login" | "registration"
    name?: string
    rememberMe?: boolean
  }) {
    console.log("🔐 Verify SMS OTP (simple form POST)")
    const payload: Record<string, string> = {
      phone: params.phone,
      otp: params.otp,
      purpose: params.purpose,
    }
    if (params.name) payload.name = params.name
    if (typeof params.rememberMe === "boolean") payload.rememberMe = String(params.rememberMe)
    const res = await this.simpleFormPost("/auth/otp/verify", payload)

    const token: string | null = res.token || res.data?.token || null
    const userData: any = res.customer || res.user || res.data?.customer || res.data?.user || null
    if (token) this.setToken(token)
    if (userData) localStorage.setItem("user_data", JSON.stringify(userData))
    return { success: true, ...res, data: res.data ?? undefined }
  }

  async getFirebaseStatus() {
    console.log("🔥 Get Firebase status (GET without JSON headers)")
    const url = `${BASE_URL}/auth/otp/firebase/status`
    const resp = await fetch(url, { method: "GET" })
    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`Firebase status failed: HTTP ${resp.status} - ${text}`)
    }
    return await resp.json()
  }

  async getFirebaseConfig() {
    console.log("🔥 Get Firebase config (GET without JSON headers)")
    const url = `${BASE_URL}/auth/otp/firebase/config`
    const resp = await fetch(url, { method: "GET" })
    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`Firebase config failed: HTTP ${resp.status} - ${text}`)
    }
    return await resp.json()
  }

  // Product APIs
  async getProducts(params?: {
    category?: string
    search?: string
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: "asc" | "desc"
    minPrice?: number
    maxPrice?: number
    featured?: boolean
    inStock?: boolean
  }) {
    const safeParams = { ...params, limit: Math.min(params?.limit || 12, 50) }
    const q = new URLSearchParams()
    Object.entries(safeParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null) q.append(k, String(v))
    })

    const response: any = await this.request<any>(`/products?${q.toString()}`)

    if (response.products && Array.isArray(response.products)) {
      return {
        success: true,
        data: {
          products: response.products,
          totalProducts: response.pagination?.totalProducts || response.products.length,
          totalPages: response.pagination?.totalPages || 1,
          currentPage: response.pagination?.currentPage || 1,
          pagination: response.pagination,
        },
      }
    }

    let products: any[] = []
    let totalProducts = 0
    let totalPages = 1
    let currentPage = 1

    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        products = response.data
        totalProducts = products.length
      } else if (response.data.products && Array.isArray(response.data.products)) {
        products = response.data.products
        totalProducts = response.data.totalProducts || response.data.total || products.length
        totalPages = response.data.totalPages || Math.ceil(totalProducts / (safeParams?.limit || 12))
        currentPage = response.data.currentPage || safeParams?.page || 1
      }
    } else if (Array.isArray(response)) {
      products = response
      totalProducts = products.length
    }

    return { success: true, data: { products, totalProducts, totalPages, currentPage } }
  }

  async getProduct(productId: string) {
    return this.request<Product>(`/products/${productId}`)
  }

  async getProductBySlug(slug: string) {
    try {
      const response: any = await this.request<any>("/products?limit=50")
      let products: any[] = []
      if (response.products && Array.isArray(response.products)) {
        products = response.products
      } else if (response.success && response.data) {
        if (Array.isArray(response.data)) products = response.data
        else if (response.data.products && Array.isArray(response.data.products)) products = response.data.products
      } else if (Array.isArray(response)) {
        products = response
      }

      const product = products.find((p: Product) => p.slug === slug)
      if (product) return { success: true, data: product }
      throw new Error("Product not found")
    } catch {
      const byId = await this.request<Product>(`/products/${slug}`)
      return byId
    }
  }

  async getFeaturedProducts(limit = 8) {
    const response: any = await this.request<any>(`/featured?limit=${Math.min(limit, 20)}`)
    let products: any[] = []
    if (response.data) {
      products = Array.isArray(response.data) ? response.data : response.data.products || []
    } else if (Array.isArray(response)) {
      products = response
    }
    return { success: true, data: products }
  }

  async searchProducts(query: string, filters?: any) {
    const params = new URLSearchParams({ q: query })
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.append(k, String(v))
      })
    }
    return this.request<{ products: Product[]; totalProducts: number; totalPages: number; currentPage: number }>(
      `/search?${params.toString()}`,
    )
  }

  async getCategories(includeProductCount = false) {
    return this.request<Array<{ _id: string; name: string; productCount?: number }>>(
      `/categories?includeProductCount=${includeProductCount}`,
    )
  }

  async getProfile() {
    return this.request<Customer>("/profile")
  }

  async updateProfile(data: Partial<Customer>) {
    return this.request<Customer>("/profile", { method: "PUT", body: JSON.stringify(data) })
  }

  async getOrders(params?: {
    page?: number
    limit?: number
    status?: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
  }) {
    const q = new URLSearchParams()
    if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && q.append(k, String(v)))
    return this.request<{ orders: Order[]; totalOrders: number; totalPages: number; currentPage: number }>(
      `/orders?${q.toString()}`,
    )
  }

  async getOrder(orderId: string) {
    return this.request<Order>(`/orders/${orderId}`)
  }

  async getStoreInfo() {
    return this.request("/")
  }

  async getOffers(type?: string, active?: boolean) {
    const q = new URLSearchParams()
    if (type) q.append("type", type)
    if (active !== undefined) q.append("active", String(active))
    return this.request(`/offers?${q.toString()}`)
  }

  // Cart
  async addToCart(productId: string, quantity = 1) {
    return this.request("/cart/add", { method: "POST", body: JSON.stringify({ productId, quantity }) })
  }
  async getCart() {
    return this.request("/cart")
  }
  async updateCartItem(productId: string, quantity: number) {
    return this.request("/cart/update", { method: "PUT", body: JSON.stringify({ productId, quantity }) })
  }
  async removeFromCart(productId: string) {
    return this.request("/cart/remove", { method: "DELETE", body: JSON.stringify({ productId }) })
  }
  async clearCart() {
    return this.request("/cart/clear", { method: "DELETE" })
  }

  // Wishlist
  async addToWishlist(productId: string) {
    return this.request("/wishlist/add", { method: "POST", body: JSON.stringify({ productId }) })
  }
  async getWishlist() {
    return this.request("/wishlist")
  }
  async removeFromWishlist(productId: string) {
    return this.request("/wishlist/remove", { method: "DELETE", body: JSON.stringify({ productId }) })
  }

  // Reviews
  async getProductReviews(productId: string, params?: { page?: number; limit?: number }) {
    const q = new URLSearchParams()
    if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && q.append(k, String(v)))
    return this.request(`/products/${productId}/reviews?${q.toString()}`)
  }
  async addProductReview(productId: string, reviewData: { rating: number; comment: string; title?: string }) {
    return this.request(`/products/${productId}/reviews`, { method: "POST", body: JSON.stringify(reviewData) })
  }

  // Addresses
  async getAddresses() {
    return this.request("/addresses")
  }
  async addAddress(addressData: {
    name: string
    phone: string
    address: string
    city: string
    state: string
    pincode: string
    country: string
    isDefault?: boolean
  }) {
    return this.request("/addresses", { method: "POST", body: JSON.stringify(addressData) })
  }
  async updateAddress(
    addressId: string,
    addressData: Partial<{
      name: string
      phone: string
      address: string
      city: string
      state: string
      pincode: string
      country: string
      isDefault: boolean
    }>,
  ) {
    return this.request(`/addresses/${addressId}`, { method: "PUT", body: JSON.stringify(addressData) })
  }
  async deleteAddress(addressId: string) {
    return this.request(`/addresses/${addressId}`, { method: "DELETE" })
  }

  // Coupons
  async validateCoupon(couponCode: string, cartTotal: number) {
    return this.request("/coupons/validate", { method: "POST", body: JSON.stringify({ couponCode, cartTotal }) })
  }
  async getCoupons() {
    return this.request("/coupons")
  }
}

export const apiClient = new ApiClient()
export const api = apiClient
export type { Product, Customer, Order, RazorpayOrderResponse, ProductVariant }
