"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, ShoppingCart, Star, ArrowLeft, Plus, Minus, Truck, Shield, RotateCcw } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useWishlist } from "@/lib/wishlist-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { toast } from "sonner"
import { apiClient, type Product, type ProductVariant } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [displayPrice, setDisplayPrice] = useState(0)
  const [displayOriginalPrice, setDisplayOriginalPrice] = useState<number | undefined>(undefined)
  const [displayStock, setDisplayStock] = useState(0)
  const [displayImages, setDisplayImages] = useState<string[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const { addItem, isInCart, getItemQuantity } = useCart()
  const { toggleItem, isInWishlist } = useWishlist()

  // Function to update displayed product details based on selected variant
  const updateDisplayBasedOnSelection = (variant: ProductVariant | null) => {
    if (variant) {
      setDisplayPrice(variant.price)
      setDisplayOriginalPrice(variant.originalPrice)
      setDisplayStock(variant.stock)
      setDisplayImages(variant.images && variant.images.length > 0 ? variant.images : product?.gallery || [])
    } else if (product) {
      // Fallback to base product details if no variant is selected or product has no variants
      setDisplayPrice(product.price)
      setDisplayOriginalPrice(product.originalPrice)
      setDisplayStock(product.stock)
      setDisplayImages(
        product.gallery && product.gallery.length > 0 ? product.gallery : product.thumbnail ? [product.thumbnail] : [],
      )
    }
    setSelectedImageIndex(0) // Reset image to first one when variant changes
    setQuantity(1) // Reset quantity when variant changes
  }

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiClient.getProductBySlug(slug)
        if (response.success && response.data) {
          setProduct(response.data)
          if (response.data.variants && response.data.variants.length > 0) {
            setSelectedVariant(response.data.variants[0]) // Select first variant by default
            updateDisplayBasedOnSelection(response.data.variants[0])
          } else {
            setSelectedVariant(null) // No variants
            updateDisplayBasedOnSelection(null) // Use base product details
          }
        } else {
          setError("Product not found")
        }
      } catch (err) {
        console.error("Error fetching product:", err)
        setError("Failed to load product")
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchProduct()
    }
  }, [slug])

  useEffect(() => {
    // This effect ensures display values update if product or selectedVariant changes
    // (e.g., after initial fetch or if product data is refreshed)
    updateDisplayBasedOnSelection(selectedVariant)
  }, [product, selectedVariant])

  const handleAddToCart = async () => {
    if (!product) return

    // Determine which item to add to cart (variant or base product)
    const itemToAdd = selectedVariant || product

    setIsAddingToCart(true)
    try {
      addItem(product, quantity, selectedVariant) // Pass selectedVariant to cart context
      toast.success(`${itemToAdd.name} added to cart!`)
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast.error("Failed to add item to cart")
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleToggleWishlist = () => {
    if (!product) return
    try {
      toggleItem(product)
      if (isInWishlist(product._id)) {
        toast.success("Removed from wishlist")
      } else {
        toast.success("Added to wishlist")
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error)
      toast.error("Failed to update wishlist")
    }
  }

  const handleVariantChange = (variantId: string) => {
    const variant = product?.variants?.find((v) => v._id === variantId)
    if (variant) {
      setSelectedVariant(variant)
    }
  }

  const currentImages = displayImages.length > 0 ? displayImages : ["/placeholder.svg?height=600&width=600"]
  const discountPercentage = displayOriginalPrice
    ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)
    : 0
  const inCart = isInCart(product?._id, selectedVariant?._id)
  const inWishlist = isInWishlist(product?._id)
  const cartQuantity = getItemQuantity(product?._id, selectedVariant?._id)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="aspect-square bg-gray-300 rounded-lg"></div>
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-300 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                <div className="h-20 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <Button onClick={() => router.push("/products")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square overflow-hidden rounded-lg border">
              <img
                src={currentImages[selectedImageIndex] || "/placeholder.svg?height=600&width=600"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Thumbnail Images */}
            {currentImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {currentImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square overflow-hidden rounded border-2 ${
                      selectedImageIndex === index ? "border-primary" : "border-gray-200"
                    }`}
                  >
                    <img
                      src={image || "/placeholder.svg?height=150&width=150"}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Product Info */}
          <div className="space-y-6">
            {/* Title and Rating */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              {product.ratings && product.ratings.count > 0 && (
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(product.ratings.average) ? "text-yellow-400 fill-current" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {product.ratings.average.toFixed(1)} ({product.ratings.count} reviews)
                  </span>
                </div>
              )}
              {product.shortDescription && <p className="text-gray-600">{product.shortDescription}</p>}
            </div>
            {/* Price */}
            <div className="flex items-center space-x-4">
              <span className="text-3xl font-bold text-gray-900">{formatCurrency(displayPrice)}</span>
              {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                <>
                  <span className="text-xl text-gray-500 line-through">{formatCurrency(displayOriginalPrice)}</span>
                  <Badge className="bg-red-500 hover:bg-red-600">-{discountPercentage}% OFF</Badge>
                </>
              )}
            </div>
            {/* Stock Status */}
            <div className="text-sm font-medium">
              {displayStock > 0 ? (
                <span className="text-green-600">In Stock ({displayStock} available)</span>
              ) : (
                <span className="text-red-600">Out of Stock</span>
              )}
            </div>
            {/* Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="flex items-center space-x-4">
                <span className="font-medium">Variant:</span>
                <Select value={selectedVariant?._id || ""} onValueChange={handleVariantChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Variant">
                      {selectedVariant
                        ? selectedVariant.options.map((attr) => attr.value).join(" / ")
                        : "Select Variant"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {product.variants.map((variant) => (
                      <SelectItem key={variant._id} value={variant._id}>
                        {variant.options.map((attr) => attr.value).join(" / ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* Quantity Selector */}
            {displayStock > 0 && (
              <div className="flex items-center space-x-4">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.min(displayStock, quantity + 1))}
                    disabled={quantity >= displayStock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {cartQuantity > 0 && <span className="text-sm text-gray-600">({cartQuantity} in cart)</span>}
              </div>
            )}
            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button
                onClick={handleAddToCart}
                disabled={isAddingToCart || displayStock <= 0}
                className="flex-1"
                size="lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {isAddingToCart
                  ? "Adding..."
                  : displayStock <= 0
                    ? "Out of Stock"
                    : inCart
                      ? "Add More"
                      : "Add to Cart"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleToggleWishlist}
                className={inWishlist ? "text-red-600 border-red-600" : ""}
              >
                <Heart className={`h-5 w-5 ${inWishlist ? "fill-current" : ""}`} />
              </Button>
            </div>
            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Truck className="h-4 w-4" />
                <span>Free Shipping</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="h-4 w-4" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <RotateCcw className="h-4 w-4" />
                <span>Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
        {/* Product Details Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="description" className="w-full">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      {product.description || "No description available."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  )
}
