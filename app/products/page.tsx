"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import { ProductCard } from "@/components/products/product-card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Search, Grid, List, ChevronLeft, ChevronRight } from "lucide-react"
import type { Product } from "@/lib/api"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const searchParams = useSearchParams()
  const router = useRouter()
  const limit = 12

  useEffect(() => {
    // Get initial params from URL
    const search = searchParams.get("search") || ""
    const sort = searchParams.get("sort") || "createdAt"
    const order = (searchParams.get("order") as "asc" | "desc") || "desc"
    const page = Number.parseInt(searchParams.get("page") || "1")

    setSearchQuery(search)
    setSortBy(sort)
    setSortOrder(order)
    setCurrentPage(page)

    loadProducts({ search, sort, order, page })
  }, [searchParams])

  const loadProducts = async (params?: {
    search?: string
    sort?: string
    order?: "asc" | "desc"
    page?: number
  }) => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = {
        search: params?.search || searchQuery,
        sortBy: params?.sort || sortBy,
        sortOrder: params?.order || sortOrder,
        page: params?.page || currentPage,
        limit,
      }

      console.log("🔍 Loading products with params:", queryParams)

      const response = await apiClient.getProducts(queryParams)

      if (response && response.success && response.data) {
        setProducts(response.data.products || [])
        setTotalProducts(response.data.totalProducts || 0)
        setTotalPages(response.data.totalPages || 1)
        setCurrentPage(response.data.currentPage || 1)
      } else {
        setProducts([])
        setTotalProducts(0)
        setTotalPages(1)
      }
    } catch (error: any) {
      console.error("💥 Error fetching products:", error)
      setError(error.message || "Failed to fetch products")
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const updateURL = (params: Record<string, string | number>) => {
    const url = new URL(window.location.href)
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value.toString())
      } else {
        url.searchParams.delete(key)
      }
    })
    router.push(url.pathname + url.search)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    updateURL({ search: searchQuery, sort: sortBy, order: sortOrder, page: "1" })
  }

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy)
    setCurrentPage(1)
    updateURL({ search: searchQuery, sort: newSortBy, order: sortOrder, page: "1" })
  }

  const handleOrderChange = (newOrder: "asc" | "desc") => {
    setSortOrder(newOrder)
    setCurrentPage(1)
    updateURL({ search: searchQuery, sort: sortBy, order: newOrder, page: "1" })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateURL({ search: searchQuery, sort: sortBy, order: sortOrder, page: page.toString() })
  }

  const clearSearch = () => {
    setSearchQuery("")
    setCurrentPage(1)
    updateURL({ search: "", sort: sortBy, order: sortOrder, page: "1" })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Products</h1>
          <p className="text-muted-foreground">Discover our complete collection of premium products</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </form>

                {/* Sort Options */}
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Date Added</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="ratings.average">Rating</SelectItem>
                      <SelectItem value="salesCount">Popularity</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortOrder} onValueChange={handleOrderChange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descending</SelectItem>
                      <SelectItem value="asc">Ascending</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View Mode Toggle */}
                  <div className="flex border rounded-md">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="rounded-r-none"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-l-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Active Filters */}
              {searchQuery && (
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchQuery}
                    <button onClick={clearSearch} className="ml-1 hover:text-destructive">
                      ×
                    </button>
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Summary */}
        {!loading && (
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">
              {totalProducts > 0
                ? `Showing ${(currentPage - 1) * limit + 1}-${Math.min(currentPage * limit, totalProducts)} of ${totalProducts} products`
                : "No products found"}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div
            className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}
          >
            {Array.from({ length: limit }).map((_, index) => (
              <Card key={index}>
                <Skeleton className="aspect-square" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-6 w-1/3 mb-3" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={() => loadProducts()} variant="outline">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Grid/List */}
        {!loading && !error && products.length > 0 && (
          <div
            className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}
          >
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? `No products found for "${searchQuery}"` : "No products available"}
                </p>
                {searchQuery && (
                  <Button onClick={clearSearch} variant="outline">
                    Clear Search
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
