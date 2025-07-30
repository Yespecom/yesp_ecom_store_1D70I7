// Debug utility to test API endpoints directly

export class ApiDebugger {
  private baseUrl = "https://api.yespstudio.com/api/1D70I7"

  async testEndpoint(endpoint: string, params?: Record<string, any>) {
    const url = new URL(`${this.baseUrl}${endpoint}`)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, value.toString())
        }
      })
    }

    console.log("🧪 Testing endpoint:", url.toString())

    try {
      const response = await fetch(url.toString())
      const data = await response.json()

      console.log("📡 Response Status:", response.status)
      console.log("📦 Response Data:", data)

      return { success: response.ok, status: response.status, data }
    } catch (error) {
      console.error("❌ Request failed:", error)
      return { success: false, error }
    }
  }

  // Test all product endpoints
  async testAllEndpoints() {
    console.log("🚀 Testing all API endpoints...")

    // Test basic connection
    await this.testEndpoint("/")

    // Test products endpoint
    await this.testEndpoint("/products", { limit: 5 })

    // Test featured products
    await this.testEndpoint("/featured", { limit: 3 })

    // Test categories
    await this.testEndpoint("/categories", { includeProductCount: true })

    // Test search
    await this.testEndpoint("/search", { q: "shirt" })

    console.log("✅ All endpoint tests completed")
  }
}

// Usage in browser console:
// const debugger = new ApiDebugger()
// debugger.testAllEndpoints()
