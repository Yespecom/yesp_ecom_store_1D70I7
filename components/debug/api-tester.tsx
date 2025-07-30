"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function ApiTester() {
  const [endpoint, setEndpoint] = useState("/products")
  const [params, setParams] = useState("limit=5")
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const baseUrl = "https://api.yespstudio.com/api/1D70I7"

  const testEndpoint = async () => {
    setLoading(true)
    setResponse(null)

    try {
      const url = new URL(`${baseUrl}${endpoint}`)

      // Parse params
      if (params) {
        const paramPairs = params.split("&")
        paramPairs.forEach((pair) => {
          const [key, value] = pair.split("=")
          if (key && value) {
            url.searchParams.append(key, value)
          }
        })
      }

      console.log("Testing URL:", url.toString())

      const res = await fetch(url.toString())
      const data = await res.json()

      setResponse({
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        data: data,
      })
    } catch (error) {
      setResponse({
        error: error.message || "Request failed",
      })
    } finally {
      setLoading(false)
    }
  }

  const quickTests = [
    { name: "All Products", endpoint: "/products", params: "limit=5" },
    { name: "Featured Products", endpoint: "/featured", params: "limit=3" },
    { name: "Categories", endpoint: "/categories", params: "includeProductCount=true" },
    { name: "Search", endpoint: "/search", params: "q=shirt" },
    { name: "Store Info", endpoint: "/", params: "" },
  ]

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>API Endpoint Tester</CardTitle>
        <p className="text-sm text-gray-600">Base URL: {baseUrl}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Test Buttons */}
        <div>
          <h3 className="text-sm font-medium mb-3">Quick Tests:</h3>
          <div className="flex flex-wrap gap-2">
            {quickTests.map((test) => (
              <Button
                key={test.name}
                variant="outline"
                size="sm"
                onClick={() => {
                  setEndpoint(test.endpoint)
                  setParams(test.params)
                }}
                className="bg-transparent"
              >
                {test.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Manual Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Endpoint:</label>
            <Input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="/products"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Parameters:</label>
            <Input
              value={params}
              onChange={(e) => setParams(e.target.value)}
              placeholder="limit=5&page=1"
              className="mt-1"
            />
          </div>
        </div>

        {/* Test Button */}
        <Button onClick={testEndpoint} disabled={loading} className="w-full bg-black hover:bg-gray-800">
          {loading ? "Testing..." : "Test Endpoint"}
        </Button>

        {/* Response Display */}
        {response && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={response.ok ? "default" : "destructive"}>
                {response.status || "ERROR"} {response.statusText}
              </Badge>
              {response.ok && <Badge variant="secondary">Success</Badge>}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
              <pre className="text-xs">{JSON.stringify(response.data || response.error, null, 2)}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
