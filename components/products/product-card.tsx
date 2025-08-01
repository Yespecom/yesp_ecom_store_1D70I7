"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingCart, Star } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useWishlist } from "@/lib/wishlist-context"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import type { Product as ApiProduct, ProductVariant as ApiProductVariant } from "@/lib/api"

interface ProductCardProps {
  product: ApiProduct
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, isInCart } = useCart()
  const { toggleItem, isInWishlist } = useWishlist()
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<ApiProductVariant | null>(null)

  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0])
    } else {
      setSelectedVariant(null)
    }
  }, [product.variants])

  const displayPrice = selectedVariant ? selectedVariant.price : product.price
  const displayOriginalPrice = selectedVariant ? selectedVariant.originalPrice : product.originalPrice
  const displayThumbnail = selectedVariant?.images?.[0] || product.thumbnail || "/placeholder.svg?height=300&width=400"
  const displayStock = selectedVariant ? selectedVariant.stock : product.stock

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsAddingToCart(true)
    try {
      addItem(product, 1, selectedVariant) // Pass selectedVariant to cart
      toast.success(`${product.name} added to cart!`)
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast.error("Failed to add item to cart")
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
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

  const inCart = isInCart(product._id, selectedVariant?._id)
  const inWishlist = isInWishlist(product._id)

  return (
    <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white w-full max-w-sm mx-auto">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
          <img
            src={displayThumbnail || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-3 right-3 h-9 w-9 rounded-full backdrop-blur-sm transition-all duration-200 ${
              inWishlist
                ? "bg-red-100/90 text-red-600 hover:bg-red-200/90"
                : "bg-white/90 hover:bg-white text-gray-600 hover:text-red-600"
            }`}
            onClick={handleToggleWishlist}
          >
            <Heart className={`h-4 w-4 ${inWishlist ? "fill-current" : ""}`} />
          </Button>
          {/* Stock Status */}
          {displayStock <= 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="bg-white text-gray-900 font-medium px-3 py-1 rounded-md text-sm">Out of Stock</div>
            </div>
          )}
          {/* Hover Description Overlay */}
          {product.shortDescription && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-white text-sm leading-relaxed line-clamp-3">{product.shortDescription}</p>
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-5 space-y-4">
        <Link href={`/products/${product.slug}`}>
          <div className="space-y-3">
            {/* Product Name */}
            <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-gray-700 transition-colors leading-tight text-base">
              {product.name}
            </h3>
            {/* Rating */}
            {product.ratings && product.ratings.count > 0 && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.ratings.average) ? "text-yellow-400 fill-current" : "text-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">({product.ratings.count})</span>
              </div>
            )}
            {/* Price */}
            <div className="flex items-baseline space-x-2">
              <span className="font-bold text-xl text-gray-900">{formatCurrency(displayPrice)}</span>
              {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                <span className="text-sm text-gray-400 line-through">{formatCurrency(displayOriginalPrice)}</span>
              )}
            </div>
          </div>
        </Link>
        {/* Variant Selector */}
        {product.variants && product.variants.length > 0 && (
          <Select
            value={selectedVariant?._id || ""}
            onValueChange={(variantId) => {
              const variant = product.variants?.find((v) => v._id === variantId)
              if (variant) {
                setSelectedVariant(variant)
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Variant">
                {selectedVariant ? selectedVariant.options.map((attr) => attr.value).join(" / ") : "Select Variant"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {product.variants.map((variant) => (
                <SelectItem key={variant._id} value={variant._id}>
                  {variant.options.map((attr) => attr.value).join(" / ")} - {formatCurrency(variant.price)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          disabled={isAddingToCart || displayStock <= 0}
          className={`w-full h-11 font-semibold transition-all duration-200 ${
            inCart
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
              : "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg"
          }`}
          variant={inCart ? "secondary" : "default"}
        >
          {isAddingToCart ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Adding...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4" />
              <span>{inCart ? "In Cart" : displayStock <= 0 ? "Out of Stock" : "Add to Cart"}</span>
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
