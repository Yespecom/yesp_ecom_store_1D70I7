"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingCart, Star } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useWishlist } from "@/lib/wishlist-context"
import { toast } from "sonner"
import type { Product } from "@/lib/api"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, isInCart } = useCart()
  const { toggleItem, isInWishlist } = useWishlist()
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsAddingToCart(true)
    try {
      addItem(product, 1)
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

  const inCart = isInCart(product._id)
  const inWishlist = isInWishlist(product._id)

  return (
    <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white w-full max-w-sm mx-auto">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
          <img
            src={product.thumbnail || "/placeholder.svg?height=300&width=400"}
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
          {product.stock <= 0 && (
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
              <span className="font-bold text-xl text-gray-900">₹{product.price.toLocaleString()}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-gray-400 line-through">₹{product.originalPrice.toLocaleString()}</span>
              )}
            </div>
          </div>
        </Link>

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          disabled={isAddingToCart || product.stock <= 0}
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
              <span>{inCart ? "In Cart" : product.stock <= 0 ? "Out of Stock" : "Add to Cart"}</span>
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
