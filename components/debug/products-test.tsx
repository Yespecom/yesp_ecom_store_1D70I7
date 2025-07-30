"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function ProductsTest() {
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testProductsEndpoint = async () => {
    setLoading(true)
    setResponse(null)

    try {
      const baseUrl = "https://api.yespstudio.com/api/1D70I7"
      const url = `${baseUrl}/products?limit=5`

      console.log("🧪 Testing products endpoint:", url)

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("📡 Response status:", res.status, res.statusText)

      const data = await res.json()
      console.log("📦 Response data:", data)

      setResponse({
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        data: data,
        url: url,
      })
    } catch (error: any) {
      console.error("💥 Request failed:", error)
      setResponse({
        error: error.message || "Request failed",
        url: `https://api.yespstudio.com/api/1D70I7/products?limit=5`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto mb-8">
      <CardHeader>
        <CardTitle>🔧 Products API Test</CardTitle>
        <p className="text-sm text-gray-600">Test the products endpoint directly</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testProductsEndpoint} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
          {loading ? "Testing..." : "Test Products Endpoint"}
        </Button>

        {response && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={response.ok ? "default" : "destructive"}>
                {response.status || "ERROR"} {response.statusText}
              </Badge>
              {response.ok && <Badge variant="secondary">Success</Badge>}
            </div>

            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
              <strong>URL:</strong> {response.url}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(response.data || response.error, null, 2)}
              </pre>
            </div>

            {response.data && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Analysis:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Response type: {Array.isArray(response.data) ? "Array" : typeof response.data}</li>
                  {response.data.success !== undefined && (
                    <li>• Has success field: {response.data.success ? "✅ true" : "❌ false"}</li>
                  )}
                  {response.data.data && (
                    <li>
                      • Has data field: ✅ ({Array.isArray(response.data.data) ? "Array" : typeof response.data.data})
                    </li>
                  )}
                  {response.data.products && <li>• Has products field: ✅ ({response.data.products.length} items)</li>}
                  {Array.isArray(response.data) && <li>• Direct array: ✅ ({response.data.length} items)</li>}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
