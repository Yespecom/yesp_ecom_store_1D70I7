"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/products/product-card"
import { Loader2 } from "lucide-react"
import { apiClient, type Product } from "@/lib/api"

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFeaturedProducts()
  }, [])

  const loadFeaturedProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      // Try to get featured products first - limit to 3
      let response = await apiClient.getProducts({ featured: true, limit: 3 })
      if (response.success && response.data.products.length > 0) {
        setProducts(response.data.products)
      } else {
        // Fallback to regular products sorted by creation date - limit to 3
        response = await apiClient.getProducts({
          limit: 3,
          sortBy: "createdAt",
          sortOrder: "desc",
        })
        if (response.success) {
          setProducts(response.data.products)
        } else {
          setError("Failed to load products")
        }
      }
    } catch (error: any) {
      console.error("Error loading featured products:", error)
      setError(error.message || "Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Featured Products</h2>
            {/* <p className="text-lg sm:text-xl text-gray-600">Discover our handpicked selection of premium products</p> */}
          </div>
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              onClick={loadFeaturedProducts}
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600 bg-transparent"
            >
              Try Again
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Featured Products</h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our handpicked selection of premium products, carefully chosen for their quality, style, and value.
          </p>
        </div>

        {/* Products Grid - 3 columns with wider cards */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No products available at the moment.</p>
            <p className="text-sm text-gray-400">Please check back later for new arrivals.</p>
          </div>
        )}
      </div>
    </section>
  )
}
