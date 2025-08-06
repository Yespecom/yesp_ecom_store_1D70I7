"use client"
import type React from "react"
import { createContext, useContext, useReducer, useEffect, useCallback } from "react"
import type { Product as ApiProduct, ProductVariant as ApiProductVariant } from "./api" // Assuming these types are defined in your lib/api.ts
import { toast } from "sonner" // Ensure toast is imported if used for notifications

// Extend Product type for wishlist items to include selected variant details
interface WishlistItem extends ApiProduct {
  selectedVariant?: ApiProductVariant // The specific variant added to wishlist
}

interface WishlistState {
  items: WishlistItem[]
}

type WishlistAction =
  | { type: "TOGGLE_ITEM"; payload: { product: ApiProduct; selectedVariant?: ApiProductVariant | null } }
  | { type: "REMOVE_ITEM"; payload: { productId: string; variantId?: string } } // Added variantId for unique removal
  | { type: "CLEAR_WISHLIST" }
  | { type: "LOAD_WISHLIST"; payload: WishlistState }

const initialState: WishlistState = {
  items: [],
}

const wishlistReducer = (state: WishlistState, action: WishlistAction): WishlistState => {
  switch (action.type) {
    case "TOGGLE_ITEM": {
      const { product, selectedVariant } = action.payload
      // Determine the unique identifier for the item (product ID + variant ID if applicable)
      const itemId = selectedVariant ? `${product._id}-${selectedVariant._id}` : product._id
      const existingItemIndex = state.items.findIndex((item) => {
        const existingItemId = item.selectedVariant ? `${item._id}-${item.selectedVariant._id}` : item._id
        return existingItemId === itemId
      })
      let updatedItems: WishlistItem[]
      if (existingItemIndex > -1) {
        // Item exists, remove it
        updatedItems = state.items.filter((item, index) => index !== existingItemIndex)
      } else {
        // Item does not exist, add it
        // Determine the price, original price, and stock based on selected variant or base product
        const itemPrice = selectedVariant?.price ?? product.price
        const itemOriginalPrice = selectedVariant?.originalPrice ?? product.originalPrice
        const itemStock = selectedVariant?.stock ?? product.stock
        const wishlistItem: WishlistItem = {
          ...product,
          price: itemPrice, // Use variant price
          originalPrice: itemOriginalPrice, // Use variant original price
          stock: itemStock, // Use variant stock
          selectedVariant: selectedVariant || undefined, // Store the variant object
        }
        updatedItems = [...state.items, wishlistItem]
      }
      return { ...state, items: updatedItems }
    }
    case "REMOVE_ITEM": {
      const { productId, variantId } = action.payload
      const newItems = state.items.filter((item) => {
        const itemUniqueId = item.selectedVariant ? `${item._id}-${item.selectedVariant._id}` : item._id
        const targetUniqueId = variantId ? `${productId}-${variantId}` : productId
        return itemUniqueId !== targetUniqueId
      })
      return {
        items: newItems,
      }
    }
    case "CLEAR_WISHLIST":
      return initialState
    case "LOAD_WISHLIST":
      return action.payload
    default:
      return state
  }
}

interface WishlistContextType {
  state: WishlistState
  toggleItem: (product: ApiProduct, selectedVariant?: ApiProductVariant | null) => void
  removeItem: (productId: string, variantId?: string) => void // Added for explicit removal
  clearWishlist: () => void
  isInWishlist: (productId: string, variantId?: string) => boolean
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(wishlistReducer, initialState)

  // Load wishlist from localStorage on initial mount
  useEffect(() => {
    try {
      const storedWishlist = localStorage.getItem("wishlist")
      if (storedWishlist) {
        dispatch({ type: "LOAD_WISHLIST", payload: JSON.parse(storedWishlist) })
      }
    } catch (error) {
      console.error("Failed to load wishlist from localStorage:", error)
      localStorage.removeItem("wishlist")
    }
  }, [])

  // Save wishlist to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem("wishlist", JSON.stringify(state))
    } catch (error) {
      console.error("Failed to save wishlist to localStorage:", error)
    }
  }, [state])

  const toggleItem = useCallback((product: ApiProduct, selectedVariant?: ApiProductVariant | null) => {
    dispatch({ type: "TOGGLE_ITEM", payload: { product, selectedVariant } })
  }, [])

  const removeItem = useCallback((productId: string, variantId?: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { productId, variantId } })
  }, [])

  const clearWishlist = useCallback(() => {
    dispatch({ type: "CLEAR_WISHLIST" })
  }, [])

  const isInWishlist = useCallback(
    (productId: string, variantId?: string) => {
      return state.items.some((item) => {
        const itemUniqueId = item.selectedVariant ? `${item._id}-${item.selectedVariant._id}` : item._id
        const targetUniqueId = variantId ? `${productId}-${variantId}` : productId
        return itemUniqueId === targetUniqueId
      })
    },
    [state.items],
  )

  return (
    <WishlistContext.Provider value={{ state, toggleItem, removeItem, clearWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}
