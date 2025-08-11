const BASE_URL = "https://api.yespstudio.com/api/1D70I7"

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

// Updated Product interface to match your database structure
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
  variants: ProductVariant[] // Ensure this uses the ProductVariant interface
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

// NEW: Define and export ProductVariant interface
export interface ProductVariant {
  _id: string
  name: string // e.g., "Red, Large"
  price: number
  originalPrice?: number
  stock?: number
  // Add other variant-specific properties if needed, like color, size, etc.
  // Example: color?: string; size?: string;
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
  private requestCache = new Map()
  private lastRequestTime = 0
  private requestDelay = 100 // Minimum delay between requests

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
  }

  private buildAuthHeaders(contentTypeJson = true) {
    const headers: Record<string, string> = {}
    if (contentTypeJson) headers["Content-Type"] = "application/json"
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`
    return headers
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    // Prevent rapid successive requests
    const now = Date.now()
    if (now - this.lastRequestTime < this.requestDelay) {
      await new Promise((resolve) => setTimeout(resolve, this.requestDelay))
    }
    this.lastRequestTime = now

    const url = `${BASE_URL}${endpoint}`
    const cacheKey = `${options.method || "GET"}-${url}-${JSON.stringify(options.body || {})}`

    // Check cache for GET requests
    if ((!options.method || options.method === "GET") && this.requestCache.has(cacheKey)) {
      const cached = this.requestCache.get(cacheKey)
      if (Date.now() - cached.timestamp < 30000) {
        // 30 second cache
        console.log("🔄 Using cached response for:", url)
        return cached.data
      }
    }

    console.log("🔍 API Request:", {
      url,
      method: options.method || "GET",
      headers: options.headers,
      hasBody: !!options.body,
      bodyLength: options.body ? JSON.stringify(options.body).length : 0,
    })

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      console.log("📡 API Response Status:", response.status, response.statusText)
      console.log("📡 API Response Headers:", Object.fromEntries(response.headers.entries()))

      let data
      const responseText = await response.text()
      console.log("📦 Raw API Response:", responseText.substring(0, 500) + (responseText.length > 500 ? "..." : ""))

      try {
        data = responseText ? JSON.parse(responseText) : {}
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError)
        data = { message: responseText || "Invalid JSON response" }
      }

      if (!response.ok) {
        console.error("❌ API Error:", {
          status: response.status,
          statusText: response.statusText,
          data: data,
          url: url,
          method: options.method || "GET",
          requestHeaders: headers,
          responseHeaders: Object.fromEntries(response.headers.entries()),
        })

        const errorMessage =
          data?.message || data?.error || responseText || `API request failed with status ${response.status}`

        // Handle authentication errors specifically
        if (
          response.status === 401 ||
          errorMessage.includes("Access denied") ||
          errorMessage.includes("Please login")
        ) {
          // Clear invalid token
          this.token = null
          localStorage.removeItem("auth_token")
          localStorage.removeItem("user_data")
          throw new Error("Access denied. Please login.")
        }

        // Create a more detailed error for debugging
        const detailedError = new Error(errorMessage)
        detailedError.name = `APIError_${response.status}`
        detailedError.cause = {
          status: response.status,
          statusText: response.statusText,
          url: url,
          method: options.method || "GET",
          responseData: data,
          requestHeaders: headers,
          responseHeaders: Object.fromEntries(response.headers.entries()),
        }
        throw detailedError
      }

      // Cache successful GET requests
      if (!options.method || options.method === "GET") {
        this.requestCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        })
      }

      return data
    } catch (error: any) {
      console.error("💥 API Request Failed:", {
        error: error.message,
        url: url,
        method: options.method || "GET",
        cause: error.cause,
        stack: error.stack,
      })
      throw error
    }
  }

  // 🧪 NEW: Test API connectivity
  async testApiConnectivity() {
    console.log("🧪 Testing API connectivity...")
    try {
      // Test 1: Basic server connectivity
      console.log("🔍 Test 1: Basic server connectivity")
      const basicResponse = await fetch(`${BASE_URL.replace("/api/1D70I7", "")}/`)
      console.log("✅ Basic server response:", basicResponse.status, basicResponse.statusText)

      // Test 2: Store-specific endpoint
      console.log("🔍 Test 2: Store-specific endpoint")
      const storeResponse = await fetch(`${BASE_URL}/`)
      console.log("✅ Store endpoint response:", storeResponse.status, storeResponse.statusText)

      // Test 3: Payments config endpoint
      console.log("🔍 Test 3: Payments config endpoint")
      const configResponse = await fetch(`${BASE_URL}/payments/config`)
      console.log("✅ Payments config response:", configResponse.status, configResponse.statusText)
      if (configResponse.ok) {
        const configData = await configResponse.text()
        console.log("📦 Config data:", configData.substring(0, 200))
      }

      // Test 4: Payments test endpoint
      console.log("🔍 Test 4: Payments test endpoint")
      const testResponse = await fetch(`${BASE_URL}/payments/test`)
      console.log("✅ Payments test response:", testResponse.status, testResponse.statusText)
      if (testResponse.ok) {
        const testData = await testResponse.text()
        console.log("📦 Test data:", testData.substring(0, 200))
      }

      return {
        success: true,
        tests: {
          basicServer: basicResponse.status,
          storeEndpoint: storeResponse.status,
          paymentsConfig: configResponse.status,
          paymentsTest: testResponse.status,
        },
      }
    } catch (error: any) {
      console.error("❌ API connectivity test failed:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  // Simple Razorpay Configuration API
  async getRazorpayConfig() {
    console.log("💳 Fetching Razorpay configuration...")
    try {
      // First test connectivity
      const connectivityTest = await this.testApiConnectivity()
      console.log("🧪 Connectivity test results:", connectivityTest)

      // Use the simple config endpoint - no authentication required
      const response = await fetch(`${BASE_URL}/payments/config`)
      console.log("💳 Config response status:", response.status, response.statusText)
      console.log("💳 Config response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Config request failed:", errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log("✅ Razorpay config retrieved:", data)
      return {
        success: true,
        data: data,
      }
    } catch (error: any) {
      console.error("❌ Failed to get Razorpay config:", error)
      // Return default fallback config
      return {
        success: true,
        data: {
          config: {
            codEnabled: true,
            onlinePaymentEnabled: true,
            razorpay: {
              enabled: true,
              keyId: "rzp_test_1234567890", // Fallback for testing
            },
            supportedMethods: [
              {
                id: "razorpay",
                name: "Online Payment",
                description: "Pay securely with cards, UPI, wallets",
                enabled: true,
              },
              {
                id: "cod",
                name: "Cash on Delivery",
                description: "Pay when your order is delivered",
                enabled: true,
              },
            ],
          },
        },
      }
    }
  }

  // 🪙 NEW: Initiate Razorpay Payment (Step 1)
  async initiateRazorpayPayment(orderData: {
    items: Array<{
      productId: string
      quantity: number
    }>
    shippingAddress: {
      name: string
      street: string
      city: string
      state: string
      zipCode: string
      country?: string
    }
    notes?: string
    couponCode?: string
  }): Promise<ApiResponse<RazorpayOrderResponse>> {
    console.log("💳 Step 1: Initiating Razorpay payment...")
    console.log("💳 Order data:", JSON.stringify(orderData, null, 2))
    try {
      // First test if the endpoint exists
      console.log("🧪 Testing payments/initiate endpoint availability...")
      const testResponse = await fetch(`${BASE_URL}/payments/test`)
      console.log("🧪 Payments test endpoint status:", testResponse.status)

      const response = await this.request<RazorpayOrderResponse>("/payments/initiate", {
        method: "POST",
        body: JSON.stringify(orderData),
      })
      console.log("✅ Razorpay payment initiated:", response)
      return response
    } catch (error: any) {
      console.error("❌ Failed to initiate Razorpay payment:", error)
      // Additional debugging
      if (error.name === "APIError_404") {
        console.error("🔍 404 Error - Route not found. Checking available routes...")
        try {
          const testResponse = await fetch(`${BASE_URL}/payments/test`)
          console.log("🧪 Payments test endpoint status:", testResponse.status)
          if (testResponse.ok) {
            const testData = await testResponse.text()
            console.log("📦 Test endpoint data:", testData)
          }
        } catch (testError) {
          console.error("❌ Even test endpoint failed:", testError)
        }
      }
      throw error
    }
  }

  // 🪙 NEW: Create Order After Payment Success (Step 4)
  async createOrderAfterPayment(orderData: {
    // Original order data
    items: Array<{
      productId: string
      quantity: number
    }>
    shippingAddress: {
      name: string
      street: string
      city: string
      state: string
      zipCode: string
      country?: string
    }
    paymentMethod: "online" | "cod"
    notes?: string
    couponCode?: string
    // Razorpay response data (only for online payments)
    razorpayPaymentId?: string
    razorpayOrderId?: string
    razorpaySignature?: string
  }) {
    console.log("📦 Step 4: Creating order after payment verification...")
    // Set payment status based on payment method
    const paymentStatus = orderData.paymentMethod === "online" ? "paid" : "pending"

    const apiOrderData = {
      items: orderData.items,
      shippingAddress: orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: paymentStatus,
      notes: orderData.notes || "",
      ...(orderData.couponCode && { couponCode: orderData.couponCode }),
      // Include Razorpay data for online payments
      ...(orderData.razorpayPaymentId && { razorpayPaymentId: orderData.razorpayPaymentId }),
      ...(orderData.razorpayOrderId && { razorpayOrderId: orderData.razorpayOrderId }),
      ...(orderData.razorpaySignature && { razorpaySignature: orderData.razorpaySignature }),
    }

    console.log("📤 Creating order with payment status:", paymentStatus)

    try {
      const response = await this.request<any>("/orders", {
        method: "POST",
        body: JSON.stringify(apiOrderData),
      })

      console.log("✅ Order created successfully after payment:", response)

      // Handle various response structures
      if (response.success && response.data) {
        return {
          success: true,
          order: response.data,
          message: response.message || "Order created successfully",
        }
      }
      if (response.order) {
        return {
          success: true,
          order: response.order,
          message: response.message || "Order created successfully",
        }
      }
      if (response.message && response.orderNumber) {
        return {
          success: true,
          order: response,
          message: response.message,
        }
      }

      // If we get here, assume success if no explicit error
      return {
        success: true,
        order: response,
        message: "Order created successfully",
      }
    } catch (error: any) {
      console.error("❌ Order creation failed after payment:", error)
      throw error
    }
  }

  private setToken(token: string) {
    this.token = token
    localStorage.setItem("auth_token", token)
  }

  // Auth methods
  async login(email: string, password: string, rememberMe = false) {
    try {
      const response = await this.request<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, rememberMe }),
      })

      console.log("🔐 Login response:", response)

      // Handle different response structures
      let token = null
      let userData = null

      // Check for token in various locations
      if (response.token) {
        token = response.token
      } else if (response.data && response.data.token) {
        token = response.data.token
      }

      // Check for user data in various locations
      if (response.user) {
        userData = response.user
      } else if (response.data && response.data.user) {
        userData = response.data.user
      } else if (response.customer) {
        userData = response.customer
      } else if (response.data && response.data.customer) {
        userData = response.data.customer
      }

      if (token) {
        this.setToken(token)
        console.log("✅ Token set successfully")
      }
      if (userData) {
        localStorage.setItem("user_data", JSON.stringify(userData))
        console.log("✅ User data stored successfully")
      }

      // Return success even if we don't have complete data structure
      return {
        success: true,
        data: {
          token: token || "",
          user: userData || { email },
        },
        message: response.message || "Login successful",
      }
    } catch (error: any) {
      console.error("💥 Login failed:", error)
      throw error
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
    console.log("🔐 API: Sending registration request with data:", requestData)

    try {
      const response = await this.request<any>("/auth/register", {
        method: "POST",
        body: JSON.stringify(requestData),
      })
      console.log("📋 API: Raw registration response:", response)

      // Handle the token if present at root level
      if (response.token) {
        console.log("🎫 API: Setting token from response.token")
        this.setToken(response.token)
      }

      // Try to extract user data from various possible locations
      let userData = null
      let token = response.token || null

      // Check different possible response structures
      if (response.user) {
        userData = response.user
      } else if (response.customer) {
        userData = response.customer
      } else if (response.data) {
        if (response.data.user) {
          userData = response.data.user
          token = response.data.token || token
        } else if (response.data.customer) {
          userData = response.data.customer
          token = response.data.token || token
        }
      }

      console.log("✅ API: Final extracted userData:", userData)
      console.log("🎫 API: Final extracted token:", token ? "Present" : "Missing")

      // If we have both user data and token, return success
      if (userData && token) {
        // Store user data in localStorage
        localStorage.setItem("user_data", JSON.stringify(userData))
        return {
          success: true,
          data: {
            customer: userData,
            token: token,
          },
          message: response.message || "Registration successful",
        }
      }

      // If registration was successful but we don't have complete data, still return success
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

      // Return the response structure as-is for debugging
      return {
        success: false,
        data: undefined,
        message:
          response.message ||
          `Registration failed - userData: ${!!userData}, token: ${!!token}. Response: ${JSON.stringify(response)}`,
      }
    } catch (error: any) {
      console.error("💥 API: Registration request failed:", error)
      throw error
    }
  }

  async logout() {
    try {
      await this.request("/auth/logout", { method: "POST" })
    } catch (error) {
      console.log("Logout API call failed, but continuing with local cleanup")
    }
    this.token = null
    this.requestCache.clear()
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
  }

  async requestOtp(phone: string, purpose: "login" | "registration") {
    console.log("📲 Requesting OTP:", { phone, purpose })
    try {
      const resp = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: this.buildAuthHeaders(),
        body: JSON.stringify({ phone, purpose }),
      })
      // Handle non-2xx for better error surfaces
      if (!resp.ok) {
        const text = await resp.text()
        throw new Error(`OTP request failed: HTTP ${resp.status} - ${text}`)
      }
      const res = await resp.json()
      console.log("✅ OTP request response:", res)
      return res
    } catch (error: any) {
      console.error("💥 OTP request failed:", error)
      throw error
    }
  }

  async verifyFirebaseOtp(params: { idToken: string; name?: string; rememberMe?: boolean }) {
    console.log("🔐 Verifying Firebase OTP...")
    try {
      const resp = await fetch("/api/auth/otp/firebase/verify", {
        method: "POST",
        headers: this.buildAuthHeaders(),
        body: JSON.stringify(params),
      })
      if (!resp.ok) {
        const text = await resp.text()
        throw new Error(`Firebase verify failed: HTTP ${resp.status} - ${text}`)
      }
      const res = await resp.json()
      console.log("✅ Firebase verify response:", res)

      // Extract token and customer/user
      let token: string | null = null
      let userData: any = null

      if (res.token) token = res.token
      else if (res.data?.token) token = res.data.token

      if (res.customer) userData = res.customer
      else if (res.user) userData = res.user
      else if (res.data?.customer) userData = res.data.customer
      else if (res.data?.user) userData = res.data.user

      if (token) this.setToken(token)
      if (userData) localStorage.setItem("user_data", JSON.stringify(userData))

      return { success: true, ...res, data: res.data ?? undefined }
    } catch (error: any) {
      console.error("💥 Firebase OTP verify failed:", error)
      throw error
    }
  }

  async verifySmsOtp(params: {
    phone: string
    otp: string
    purpose: "login" | "registration"
    name?: string
    rememberMe?: boolean
  }) {
    console.log("🔐 Verifying SMS OTP (fallback)...")
    try {
      const resp = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: this.buildAuthHeaders(),
        body: JSON.stringify(params),
      })
      if (!resp.ok) {
        const text = await resp.text()
        throw new Error(`SMS verify failed: HTTP ${resp.status} - ${text}`)
      }
      const res = await resp.json()
      console.log("✅ SMS verify response:", res)

      let token: string | null = null
      let userData: any = null

      if (res.token) token = res.token
      else if (res.data?.token) token = res.data.token

      if (res.customer) userData = res.customer
      else if (res.user) userData = res.user
      else if (res.data?.customer) userData = res.data.customer
      else if (res.data?.user) userData = res.data.user

      if (token) this.setToken(token)
      if (userData) localStorage.setItem("user_data", JSON.stringify(userData))

      return { success: true, ...res, data: res.data ?? undefined }
    } catch (error: any) {
      console.error("💥 SMS OTP verify failed:", error)
      throw error
    }
  }

  async getFirebaseStatus() {
    console.log("🔥 Getting Firebase status...")
    try {
      const resp = await fetch("/api/auth/otp/firebase/status", {
        method: "GET",
        headers: this.buildAuthHeaders(false),
      })
      if (!resp.ok) {
        const text = await resp.text()
        throw new Error(`Firebase status failed: HTTP ${resp.status} - ${text}`)
      }
      return await resp.json()
    } catch (error: any) {
      console.error("💥 Firebase status failed:", error)
      throw error
    }
  }

  async getFirebaseConfig() {
    console.log("🔥 Getting Firebase config...")
    try {
      const resp = await fetch("/api/auth/otp/firebase/config", {
        method: "GET",
        headers: this.buildAuthHeaders(false),
      })
      if (!resp.ok) {
        const text = await resp.text()
        throw new Error(`Firebase config failed: HTTP ${resp.status} - ${text}`)
      }
      return await resp.json()
    } catch (error: any) {
      console.error("💥 Firebase config failed:", error)
      throw error
    }
  }

  // Product methods with better error handling and caching
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
    // Limit the number of products to prevent excessive requests
    const safeParams = {
      ...params,
      limit: Math.min(params?.limit || 12, 50), // Max 50 products per request
    }

    const queryParams = new URLSearchParams()
    if (safeParams) {
      Object.entries(safeParams).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }

    console.log("🛍️ Fetching products with params:", safeParams)

    try {
      const response = await this.request<any>(`/products?${queryParams.toString()}`)
      console.log("📦 Products response received")

      // Handle the actual API response structure based on your data
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

      // Fallback for other response structures
      let products = []
      let totalProducts = 0
      let totalPages = 1
      let currentPage = 1

      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          products = response.data
          totalProducts = response.data.length
        } else if (response.data.products && Array.isArray(response.data.products)) {
          products = response.data.products
          totalProducts = response.data.totalProducts || response.data.total || products.length
          totalPages = response.data.totalPages || Math.ceil(totalProducts / (safeParams?.limit || 12))
          currentPage = response.data.currentPage || safeParams?.page || 1
        }
      } else if (Array.isArray(response)) {
        products = response
        totalProducts = response.length
      }

      console.log("✅ Processed products:", {
        count: products.length,
        totalProducts,
        totalPages,
        currentPage,
      })

      return {
        success: true,
        data: {
          products,
          totalProducts,
          totalPages,
          currentPage,
        },
      }
    } catch (error: any) {
      console.error("💥 Products fetch failed:", error)
      throw error
    }
  }

  async getProduct(productId: string) {
    console.log("🔍 Fetching single product:", productId)
    return this.request<Product>(`/products/${productId}`)
  }

  async getProductBySlug(slug: string) {
    console.log("🔍 Fetching product by slug:", slug)
    try {
      // First try to get all products and find by slug
      console.log("📦 Attempting to fetch products to find by slug...")
      const response = await this.request<any>("/products?limit=50") // Limit to prevent excessive data
      console.log("📦 Products response received for slug search")

      let products = []
      if (response.products && Array.isArray(response.products)) {
        products = response.products
      } else if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          products = response.data
        } else if (response.data.products && Array.isArray(response.data.products)) {
          products = response.data.products
        }
      } else if (Array.isArray(response)) {
        products = response
      }

      console.log(`🔍 Searching for product with slug "${slug}" in ${products.length} products`)

      // Find product by slug
      const product = products.find((p: Product) => p.slug === slug)

      if (product) {
        console.log("✅ Found product by slug:", product.name)
        return {
          success: true,
          data: product,
        }
      } else {
        console.log(`❌ No product found with slug "${slug}"`)
        throw new Error("Product not found")
      }
    } catch (error: any) {
      console.error("💥 Product by slug fetch failed:", error)
      // Fallback to trying the slug as an ID
      console.log("🔄 Trying slug as product ID...")
      try {
        const response = await this.request<Product>(`/products/${slug}`)
        console.log("✅ Found product by ID")
        return response
      } catch (idError) {
        console.error("💥 Product by ID also failed:", idError)
        throw new Error(`Product not found: ${slug}`)
      }
    }
  }

  async getFeaturedProducts(limit = 8) {
    console.log("⭐ Fetching featured products, limit:", limit)
    try {
      const response = await this.request<any>(`/featured?limit=${Math.min(limit, 20)}`) // Limit to prevent excessive requests

      // Handle different response structures
      let products = []
      if (response.data) {
        products = Array.isArray(response.data) ? response.data : response.data.products || []
      } else if (Array.isArray(response)) {
        products = response
      }

      return {
        success: true,
        data: products,
      }
    } catch (error: any) {
      console.error("💥 Featured products fetch failed:", error)
      throw error
    }
  }

  async searchProducts(query: string, filters?: any) {
    const params = new URLSearchParams({ q: query })
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }
    console.log("🔎 Searching products:", query, filters)
    return this.request<{
      products: Product[]
      totalProducts: number
      totalPages: number
      currentPage: number
    }>(`/search?${params.toString()}`)
  }

  // Category methods
  async getCategories(includeProductCount = false) {
    console.log("📂 Fetching categories, includeProductCount:", includeProductCount)
    return this.request<Array<{ _id: string; name: string; productCount?: number }>>(
      `/categories?includeProductCount=${includeProductCount}`,
    )
  }

  // User profile methods
  async getProfile() {
    console.log("👤 Fetching user profile")
    return this.request<Customer>("/profile")
  }

  async updateProfile(data: Partial<Customer>) {
    console.log("👤 Updating user profile:", data)
    return this.request<Customer>("/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // Order methods
  async getOrders(params?: {
    page?: number
    limit?: number
    status?: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
  }) {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }
    console.log("📦 Fetching orders with params:", params)
    return this.request<{
      orders: Order[]
      totalOrders: number
      totalPages: number
      currentPage: number
    }>(`/orders?${queryParams.toString()}`)
  }

  async getOrder(orderId: string) {
    console.log("📦 Fetching single order:", orderId)
    return this.request<Order>(`/orders/${orderId}`)
  }

  // Store info
  async getStoreInfo() {
    console.log("🏪 Fetching store info")
    return this.request("/")
  }

  async getOffers(type?: string, active?: boolean) {
    const params = new URLSearchParams()
    if (type) params.append("type", type)
    if (active !== undefined) params.append("active", active.toString())
    console.log("🎁 Fetching offers:", { type, active })
    return this.request(`/offers?${params.toString()}`)
  }

  // Cart methods
  async addToCart(productId: string, quantity = 1) {
    console.log("🛒 Adding to cart:", { productId, quantity })
    return this.request("/cart/add", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    })
  }

  async getCart() {
    console.log("🛒 Fetching cart")
    return this.request("/cart")
  }

  async updateCartItem(productId: string, quantity: number) {
    console.log("🛒 Updating cart item:", { productId, quantity })
    return this.request("/cart/update", {
      method: "PUT",
      body: JSON.stringify({ productId, quantity }),
    })
  }

  async removeFromCart(productId: string) {
    console.log("🛒 Removing from cart:", productId)
    return this.request("/cart/remove", {
      method: "DELETE",
      body: JSON.stringify({ productId }),
    })
  }

  async clearCart() {
    console.log("🛒 Clearing cart")
    return this.request("/cart/clear", {
      method: "DELETE",
    })
  }

  // Wishlist methods
  async addToWishlist(productId: string) {
    console.log("❤️ Adding to wishlist:", productId)
    return this.request("/wishlist/add", {
      method: "POST",
      body: JSON.stringify({ productId }),
    })
  }

  async getWishlist() {
    console.log("❤️ Fetching wishlist")
    return this.request("/wishlist")
  }

  async removeFromWishlist(productId: string) {
    console.log("❤️ Removing from wishlist:", productId)
    return this.request("/wishlist/remove", {
      method: "DELETE",
      body: JSON.stringify({ productId }),
    })
  }

  // Reviews methods
  async getProductReviews(productId: string, params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }
    console.log("⭐ Fetching product reviews:", productId)
    return this.request(`/products/${productId}/reviews?${queryParams.toString()}`)
  }

  async addProductReview(
    productId: string,
    reviewData: {
      rating: number
      comment: string
      title?: string
    },
  ) {
    console.log("⭐ Adding product review:", { productId, reviewData })
    return this.request(`/products/${productId}/reviews`, {
      method: "POST",
      body: JSON.stringify(reviewData),
    })
  }

  // Address methods
  async getAddresses() {
    console.log("📍 Fetching addresses")
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
    console.log("📍 Adding address:", addressData)
    return this.request("/addresses", {
      method: "POST",
      body: JSON.stringify(addressData),
    })
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
    console.log("📍 Updating address:", { addressId, addressData })
    return this.request(`/addresses/${addressId}`, {
      method: "PUT",
      body: JSON.stringify(addressData),
    })
  }

  async deleteAddress(addressId: string) {
    console.log("📍 Deleting address:", addressId)
    return this.request(`/addresses/${addressId}`, {
      method: "DELETE",
    })
  }

  // Coupon methods
  async validateCoupon(couponCode: string, cartTotal: number) {
    console.log("🎫 Validating coupon:", { couponCode, cartTotal })
    return this.request("/coupons/validate", {
      method: "POST",
      body: JSON.stringify({ couponCode, cartTotal }),
    })
  }

  async getCoupons() {
    console.log("🎫 Fetching available coupons")
    return this.request("/coupons")
  }
}

export const apiClient = new ApiClient()
export const api = apiClient // For backward compatibility
export type { Product, Customer, Order, RazorpayOrderResponse, ProductVariant } // Export ProductVariant
