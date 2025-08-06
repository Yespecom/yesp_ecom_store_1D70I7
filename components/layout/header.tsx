"use client"
import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet" // Added SheetDescription
import { Search, ShoppingCart, Heart, User, Menu, X, Plus, Minus, LogOut, Package, UserCircle, Trash2 } from 'lucide-react'
import { useCart } from "@/lib/cart-context"
import { toast } from "sonner"

// New: Define ProductVariant interface
interface ProductVariant {
  _id: string
  name: string // e.g., "Red, Large"
  price: number
  originalPrice?: number
  stock?: number
  // Add other variant-specific properties if needed, like color, size, etc.
}

interface WishlistItem {
  _id: string // Product ID
  name: string // Product Name
  description?: string
  shortDescription?: string
  slug: string
  sku?: string
  price: number // This should be the price of the selected variant, or base product price
  originalPrice?: number // This should be the original price of the selected variant, or base product original price
  category?: {
    _id: string
    name: string
    slug: string
  }
  gallery?: string[]
  thumbnail: string
  stock?: number // This should be the stock of the selected variant, or base product stock
  isActive?: boolean
  isFeatured?: boolean
  tags?: string[]
  ratings?: {
    average: number
    count: number
  }
  salesCount?: number
  viewCount?: number
  createdAt?: string
  updatedAt?: string
  selectedVariant?: ProductVariant // New: Stores details of the chosen variant
}

interface LocalWishlist {
  items: WishlistItem[]
}

// Infer CartProduct and CartItem structure based on useCart context and new variant concept
interface CartProduct {
  _id: string
  name: string
  price: number
  thumbnail: string
  slug: string
  description?: string
  shortDescription?: string
  stock?: number
  category?: { _id: string; name: string; slug: string }
  selectedVariant?: ProductVariant // New: The specific variant added to cart
}

// Assuming useCart's state.items is an array of this structure
interface CartItem {
  product: CartProduct
  quantity: number
}

export function Header() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isWishlistOpen, setIsWishlistOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const { state: cartState, removeItem, updateQuantity, clearCart, addItem } = useCart()

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem("user_data")
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }
  }, [])

  // Load wishlist data from localStorage when component mounts or wishlist opens
  useEffect(() => {
    loadWishlistFromStorage()
  }, [])

  useEffect(() => {
    if (isWishlistOpen) {
      loadWishlistFromStorage()
    }
  }, [isWishlistOpen])

  const loadWishlistFromStorage = () => {
    try {
      const wishlistData = localStorage.getItem("wishlist")
      if (wishlistData) {
        const parsedWishlist: LocalWishlist = JSON.parse(wishlistData)
        setWishlistItems(parsedWishlist.items || [])
      } else {
        setWishlistItems([])
      }
    } catch (error) {
      console.error("Error loading wishlist from localStorage:", error)
      setWishlistItems([])
    }
  }

  const updateWishlistStorage = (items: WishlistItem[]) => {
    try {
      const wishlistData: LocalWishlist = { items }
      localStorage.setItem("wishlist", JSON.stringify(wishlistData))
      setWishlistItems(items)
    } catch (error) {
      console.error("Error updating wishlist in localStorage:", error)
      toast.error("Failed to update wishlist")
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
    setUser(null)
    toast.success("Logged out successfully")
    router.push("/")
  }

  // Updated to pass variantId
  const handleQuantityChange = (productId: string, newQuantity: number, variantId?: string) => {
    if (newQuantity <= 0) {
      removeItem(productId, variantId) // Pass variantId here
      toast.success("Item removed from cart")
    } else {
      updateQuantity(productId, newQuantity, variantId) // Pass variantId here
    }
  }

  const handleCheckout = () => {
    setIsCartOpen(false)
    router.push("/checkout")
  }

  const handleAddToCartFromWishlist = (product: WishlistItem) => {
    try {
      // Convert wishlist item to cart-compatible format, passing selectedVariant
      const cartProduct: CartProduct = {
        _id: product._id,
        name: product.name,
        price: getProductPrice(product), // Use the helper to get the correct price
        thumbnail: product.thumbnail,
        slug: product.slug,
        description: product.description,
        shortDescription: product.shortDescription,
        stock: getProductStock(product), // Use the helper to get the correct stock
        category: product.category,
        selectedVariant: product.selectedVariant, // Pass the selected variant details
      }
      addItem(cartProduct, 1, product.selectedVariant) // Pass selectedVariant object to addItem
      toast.success(`${getProductName(product)} added to cart!`)
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast.error("Failed to add item to cart")
    }
  }

  const handleRemoveFromWishlist = (productId: string, productName: string) => {
    try {
      const updatedItems = wishlistItems.filter((item) => item._id !== productId)
      updateWishlistStorage(updatedItems)
      toast.success(`${productName} removed from wishlist`)
    } catch (error) {
      console.error("Error removing from wishlist:", error)
      toast.error("Failed to remove item from wishlist")
    }
  }

  const handleClearWishlist = () => {
    try {
      updateWishlistStorage([])
      toast.success("Wishlist cleared successfully")
    } catch (error) {
      console.error("Error clearing wishlist:", error)
      toast.error("Failed to clear wishlist")
    }
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  // Helper function to get product URL safely
  const getProductUrl = (product: WishlistItem) => {
    if (!product) return "/products"
    return `/products/${product.slug || product._id || "unknown"}`
  }

  // Helper function to safely get product name (now considering variant)
  const getProductName = (product: WishlistItem | CartProduct) => {
    return product?.selectedVariant?.name
      ? `${product.name} (${product.selectedVariant.name})`
      : product?.name || "Unknown Product"
  }

  // Helper function to safely get product price (prioritizes variant price)
  const getProductPrice = (product: WishlistItem | CartProduct) => {
    return product?.selectedVariant?.price ?? product?.price ?? 0
  }

  // Helper function to safely get product original price (prioritizes variant original price)
  const getProductOriginalPrice = (product: WishlistItem | CartProduct) => {
    return product?.selectedVariant?.originalPrice ?? product?.originalPrice
  }

  // Helper function to safely get product stock (prioritizes variant stock)
  const getProductStock = (product: WishlistItem | CartProduct) => {
    return product?.selectedVariant?.stock ?? product?.stock ?? 0
  }

  // Helper function to safely get product thumbnail
  const getProductThumbnail = (product: WishlistItem | CartProduct) => {
    return product?.thumbnail || "/placeholder.svg?height=60&width=60"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-18 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <div className="relative">
              <img src="/images/oneofwun-logo.png" alt="OneofWun" className="h-8 w-auto sm:h-10 object-contain" />
            </div>
            <span className="hidden sm:block font-bold text-xl lg:text-2xl text-gray-900">OneofWun</span>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="search"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-11 border-gray-200 focus:border-black focus:ring-black rounded-full bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
          </form>

          {/* Navigation Icons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Search - Mobile & Tablet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden hover:bg-gray-100">
                  <Search className="h-5 w-5" />
                  <span className="sr-only">Search</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="h-24 border-b">
                <form onSubmit={handleSearch} className="flex w-full mt-4">
                  <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      type="search"
                      placeholder="Search for products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 pr-4 h-11 border-gray-200 focus:border-black focus:ring-black rounded-full"
                      autoFocus
                    />
                  </div>
                </form>
              </SheetContent>
            </Sheet>

            {/* Wishlist Sheet */}
            <Sheet open={isWishlistOpen} onOpenChange={setIsWishlistOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 transition-colors">
                  <Heart className="h-5 w-5" />
                  <span className="sr-only">Wishlist</span>
                  {wishlistItems.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-600 text-white border-0 animate-pulse">
                      {wishlistItems.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg flex flex-col">
                {/* Header */}
                <SheetHeader className="border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center">
                        <Heart className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <SheetTitle className="text-left text-lg font-bold text-gray-900">My Wishlist</SheetTitle>
                        <SheetDescription className="text-left text-sm text-gray-600">
                          Items you've saved for later.
                        </SheetDescription>
                      </div>
                    </div>
                    {wishlistItems.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearWishlist}
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50 h-8 px-3 rounded-full transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear All
                      </Button>
                    )}
                  </div>
                </SheetHeader>

                {/* Content */}
                <div className="flex-1 overflow-y-auto py-4">
                  {wishlistItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mb-6">
                        <Heart className="h-10 w-10 text-red-400" />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-3 text-lg">Your wishlist is empty</h4>
                      <p className="text-gray-500 text-sm mb-6 max-w-xs leading-relaxed">
                        Start adding items you love to keep track of them and purchase later
                      </p>
                      <Button
                        onClick={() => setIsWishlistOpen(false)}
                        asChild
                        className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full px-6"
                      >
                        <Link href="/products">
                          <Package className="h-4 w-4 mr-2" />
                          Browse Products
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {wishlistItems.map((item, index) => (
                        <div
                          key={item._id}
                          className="group relative bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl p-4 transition-all duration-200 hover:shadow-md"
                          style={{
                            animationDelay: `${index * 50}ms`,
                          }}
                        >
                          <div className="flex items-start space-x-4">
                            {/* Product Image */}
                            <Link
                              href={getProductUrl(item)}
                              className="flex-shrink-0 relative"
                              onClick={() => setIsWishlistOpen(false)}
                            >
                              <div className="relative overflow-hidden rounded-lg">
                                <img
                                  src={getProductThumbnail(item) || "/placeholder.svg"}
                                  alt={getProductName(item)}
                                  className="h-20 w-20 object-cover transition-transform duration-200 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-lg" />
                              </div>
                            </Link>

                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <Link
                                href={getProductUrl(item)}
                                className="block"
                                onClick={() => setIsWishlistOpen(false)}
                              >
                                <h4 className="font-semibold text-gray-900 line-clamp-2 hover:text-red-600 transition-colors duration-200 mb-2 leading-tight">
                                  {getProductName(item)} {/* Uses updated helper */}
                                </h4>
                              </Link>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <p className="text-lg font-bold text-gray-900">
                                    ₹{getProductPrice(item).toLocaleString()}
                                  </p>
                                  {getProductOriginalPrice(item) && getProductOriginalPrice(item)! > getProductPrice(item) && (
                                    <p className="text-sm text-gray-500 line-through">
                                      ₹{getProductOriginalPrice(item)!.toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleAddToCartFromWishlist(item)}
                                  className="flex-1 h-9 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white text-xs font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                  <ShoppingCart className="h-3 w-3 mr-1" />
                                  Add to Cart {/* Always show "Add to Cart" */}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveFromWishlist(item._id, getProductName(item))}
                                  className="h-9 w-9 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          {/* Hover Effect Border */}
                          <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-red-100 transition-colors duration-200 pointer-events-none" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {wishlistItems.length > 0 && (
                  <div className="border-t pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{wishlistItems.length}</span> items in wishlist
                      </div>
                      <div className="text-xs text-gray-500">
                        Total value: ₹{wishlistItems.reduce((total, item) => total + getProductPrice(item), 0).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setIsWishlistOpen(false)}
                      className="w-full h-11 border-gray-200 hover:bg-gray-50 rounded-lg"
                    >
                      Continue Shopping
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>

            {/* Cart */}
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-gray-100">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="sr-only">Shopping Cart</span>
                  {cartState.itemCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-black text-white border-0">
                      {cartState.itemCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg flex flex-col">
                <SheetHeader className="border-b pb-4">
                  <SheetTitle className="text-left">
                    Shopping Cart ({cartState.itemCount} {cartState.itemCount === 1 ? "item" : "items"})
                  </SheetTitle>
                  <SheetDescription className="text-left text-sm text-gray-600">
                    Review your items before checkout.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto py-4">
                  {cartState.items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <ShoppingCart className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="font-medium text-gray-900 mb-2">Your cart is empty</h3>
                      <p className="text-gray-500 text-sm mb-6">Add some products to get started</p>
                      <Button onClick={() => setIsCartOpen(false)} asChild className="bg-black hover:bg-gray-800">
                        <Link href="/products">Continue Shopping</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cartState.items
                        .filter((item) => item && item.product) // Filter out invalid items
                        .map((item) => {
                          return (
                            <div
                              // Use a unique key that includes variant ID if present
                              key={
                                item.product.selectedVariant
                                  ? `${item.product._id}-${item.product.selectedVariant._id}`
                                  : item.product._id
                              }
                              className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg bg-gray-50"
                            >
                              <img
                                src={getProductThumbnail(item.product) || "/placeholder.svg"}
                                alt={getProductName(item.product) || "Product"}
                                className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                                  {getProductName(item.product)}{" "}
                                  {/* Display variant name if present */}
                                </h4>
                                <p className="text-sm text-gray-600 mb-3">
                                  ₹{(getProductPrice(item.product) || 0).toLocaleString()}
                                </p>
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center space-x-2 border border-gray-200 rounded-lg bg-white">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleQuantityChange(
                                          item.product._id || "",
                                          item.quantity - 1,
                                          item.product.selectedVariant?._id, // Pass variantId
                                        )
                                      }
                                      className="h-8 w-8 p-0 hover:bg-gray-100"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleQuantityChange(
                                          item.product._id || "",
                                          item.quantity + 1,
                                          item.product.selectedVariant?._id, // Pass variantId
                                        )
                                      }
                                      className="h-8 w-8 p-0 hover:bg-gray-100"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      removeItem(item.product._id || "", item.product.selectedVariant?._id)
                                    }
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-semibold text-gray-900">
                                  ₹{((getProductPrice(item.product) || 0) * item.quantity).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>

                {cartState.items.length > 0 && (
                  <div className="border-t pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">
                        Total: ₹{cartState.total.toLocaleString()}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearCart}
                        className="text-gray-600 hover:text-gray-800 bg-transparent"
                      >
                        Clear Cart
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Button
                        onClick={handleCheckout}
                        className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium"
                      >
                        Proceed to Checkout
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsCartOpen(false)}
                        className="w-full h-12 border-gray-200 hover:bg-gray-50"
                      >
                        Continue Shopping
                      </Button>
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>

            {/* User Menu - Desktop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden sm:flex hover:bg-gray-100">
                  <User className="h-5 w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2">
                {user ? (
                  <>
                    <div className="px-3 py-2 border-b border-gray-100 mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <UserCircle className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/profile" className="flex items-center space-x-2 px-3 py-2">
                        <UserCircle className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/orders" className="flex items-center space-x-2 px-3 py-2">
                        <Package className="h-4 w-4" />
                        <span>Orders</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                      <div className="flex items-center space-x-2 px-3 py-2">
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </div>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/login" className="flex items-center space-x-2 px-3 py-2">
                        <User className="h-4 w-4" />
                        <span>Login</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/register" className="flex items-center space-x-2 px-3 py-2">
                        <UserCircle className="h-4 w-4" />
                        <span>Register</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="sm:hidden hover:bg-gray-100">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader className="border-b pb-4">
                  <SheetTitle className="text-left">Menu</SheetTitle>
                  <SheetDescription className="text-left text-sm text-gray-600">
                    Navigate through the store.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  {user && (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <UserCircle className="h-7 w-7 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{user.name}</p>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <nav className="space-y-2">
                    <Link
                      href="/products"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={closeMobileMenu}
                    >
                      <Package className="h-5 w-5" />
                      <span className="font-medium">Products</span>
                    </Link>
                    {user ? (
                      <>
                        <Link
                          href="/profile"
                          className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          onClick={closeMobileMenu}
                        >
                          <UserCircle className="h-5 w-5" />
                          <span className="font-medium">Profile</span>
                        </Link>
                        <Link
                          href="/orders"
                          className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          onClick={closeMobileMenu}
                        >
                          <Package className="h-5 w-5" />
                          <span className="font-medium">Orders</span>
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout()
                            closeMobileMenu()
                          }}
                          className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full text-left"
                        >
                          <LogOut className="h-5 w-5" />
                          <span className="font-medium">Logout</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          onClick={closeMobileMenu}
                        >
                          <User className="h-5 w-5" />
                          <span className="font-medium">Login</span>
                        </Link>
                        <Link
                          href="/register"
                          className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          onClick={closeMobileMenu}
                        >
                          <UserCircle className="h-5 w-5" />
                          <span className="font-medium">Register</span>
                        </Link>
                      </>
                    )}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
