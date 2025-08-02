"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import type { Product as ApiProduct, ProductVariant as ApiProductVariant } from "./api" // Assuming these types are defined in your lib/api.ts

// Extend Product type for cart items to include selected variant details
interface CartProduct extends ApiProduct {
  selectedVariant?: ApiProductVariant // The specific variant added to cart
}

interface CartItem {
  product: CartProduct
  quantity: number
}

interface CartState {
  items: CartItem[]
  total: number
  itemCount: number
}

type CartAction =
  | {
      type: "ADD_ITEM"
      payload: { product: ApiProduct; quantity?: number; selectedVariant?: ApiProductVariant | null }
    }
  | { type: "REMOVE_ITEM"; payload: { productId: string; variantId?: string } } // Added variantId for unique removal
  | { type: "UPDATE_QUANTITY"; payload: { productId: string; quantity: number; variantId?: string } } // Added variantId for unique update
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: CartState }

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
}

function cartReducer(state: CartState, action: CartAction): CartState {
  console.log("Cart Reducer Action:", action.type, action.payload)
  switch (action.type) {
    case "ADD_ITEM": {
      const { product, quantity = 1, selectedVariant } = action.payload

      // Determine the unique identifier for the item (product ID + variant ID if applicable)
      const itemId = selectedVariant ? `${product._id}-${selectedVariant._id}` : product._id
      console.log("ADD_ITEM: Calculated itemId:", itemId)

      const existingItemIndex = state.items.findIndex((item) => {
        const existingItemId = item.product.selectedVariant
          ? `${item.product._id}-${item.product.selectedVariant._id}`
          : item.product._id
        return existingItemId === itemId
      })

      let newItems: CartItem[]

      // Determine the price, original price, and stock based on selected variant or base product
      const itemPrice = selectedVariant?.price ?? product.price
      const itemOriginalPrice = selectedVariant?.originalPrice ?? product.originalPrice
      const itemStock = selectedVariant?.stock ?? product.stock

      // Create a new product object for the cart item, including variant details
      const cartProduct: CartProduct = {
        ...product,
        price: itemPrice, // Use variant price
        originalPrice: itemOriginalPrice, // Use variant original price
        stock: itemStock, // Use variant stock
        selectedVariant: selectedVariant || undefined, // Store the variant object
      }

      if (existingItemIndex > -1) {
        // Update existing item
        newItems = state.items.map((item, index) =>
          index === existingItemIndex ? { ...item, quantity: item.quantity + quantity } : item,
        )
        console.log("ADD_ITEM: Updating existing item quantity.")
      } else {
        // Add new item
        newItems = [...state.items, { product: cartProduct, quantity }]
        console.log("ADD_ITEM: Adding new item to cart.")
      }

      const total = newItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)

      console.log("ADD_ITEM: New State:", { items: newItems, total, itemCount })
      return {
        items: newItems,
        total,
        itemCount,
      }
    }
    case "REMOVE_ITEM": {
      const { productId, variantId } = action.payload
      console.log("REMOVE_ITEM: Target productId:", productId, "variantId:", variantId)

      const newItems = state.items.filter((item) => {
        const itemUniqueId = item.product.selectedVariant
          ? `${item.product._id}-${item.product.selectedVariant._id}`
          : item.product._id
        const targetUniqueId = variantId ? `${productId}-${variantId}` : productId
        console.log(`  Comparing item: ${itemUniqueId} with target: ${targetUniqueId}`)
        return itemUniqueId !== targetUniqueId
      })
      const total = newItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)

      console.log("REMOVE_ITEM: New State:", { items: newItems, total, itemCount })
      return {
        items: newItems,
        total,
        itemCount,
      }
    }
    case "UPDATE_QUANTITY": {
      const { productId, quantity, variantId } = action.payload
      console.log("UPDATE_QUANTITY: Target productId:", productId, "variantId:", variantId, "new quantity:", quantity)

      if (quantity <= 0) {
        console.log("UPDATE_QUANTITY: Quantity is 0 or less, dispatching REMOVE_ITEM.")
        return cartReducer(state, { type: "REMOVE_ITEM", payload: { productId, variantId } })
      }

      const newItems = state.items.map((item) => {
        const itemUniqueId = item.product.selectedVariant
          ? `${item.product._id}-${item.product.selectedVariant._id}`
          : item.product._id
        const targetUniqueId = variantId ? `${productId}-${variantId}` : productId
        console.log(`  Comparing item: ${itemUniqueId} with target: ${targetUniqueId}`)

        return itemUniqueId === targetUniqueId ? { ...item, quantity } : item
      })
      const total = newItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)

      console.log("UPDATE_QUANTITY: New State:", { items: newItems, total, itemCount })
      return {
        items: newItems,
        total,
        itemCount,
      }
    }
    case "CLEAR_CART":
      console.log("CLEAR_CART: Cart cleared.")
      return initialState
    case "LOAD_CART":
      console.log("LOAD_CART: Cart loaded from storage.", action.payload)
      return action.payload
    default:
      return state
  }
}

interface CartContextType {
  state: CartState
  addItem: (product: ApiProduct, quantity?: number, selectedVariant?: ApiProductVariant | null) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void
  clearCart: () => void
  isInCart: (productId: string, variantId?: string) => boolean
  getItemQuantity: (productId: string, variantId?: string) => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        dispatch({ type: "LOAD_CART", payload: parsedCart })
      } catch (error) {
        console.error("Error loading cart from localStorage:", error)
        // Clear corrupted cart data if parsing fails
        localStorage.removeItem("cart")
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(state))
  }, [state])

  const addItem = (product: ApiProduct, quantity = 1, selectedVariant?: ApiProductVariant | null) => {
    console.log("Dispatching ADD_ITEM:", { product: product._id, variant: selectedVariant?._id, quantity })
    dispatch({ type: "ADD_ITEM", payload: { product, quantity, selectedVariant } })
  }

  const removeItem = (productId: string, variantId?: string) => {
    console.log("Dispatching REMOVE_ITEM:", { productId, variantId })
    dispatch({ type: "REMOVE_ITEM", payload: { productId, variantId } })
  }

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    console.log("Dispatching UPDATE_QUANTITY:", { productId, variantId, quantity })
    dispatch({ type: "UPDATE_QUANTITY", payload: { productId, quantity, variantId } })
  }

  const clearCart = () => {
    console.log("Dispatching CLEAR_CART")
    dispatch({ type: "CLEAR_CART" })
  }

  const isInCart = (productId: string, variantId?: string) => {
    const found = state.items.some((item) => {
      const itemUniqueId = item.product.selectedVariant
        ? `${item.product._id}-${item.product.selectedVariant._id}`
        : item.product._id
      const targetUniqueId = variantId ? `${productId}-${variantId}` : productId
      // console.log(`isInCart: Comparing item: ${itemUniqueId} with target: ${targetUniqueId}`)
      return itemUniqueId === targetUniqueId
    })
    // console.log(`isInCart(${productId}, ${variantId}): ${found}`)
    return found
  }

  const getItemQuantity = (productId: string, variantId?: string) => {
    const item = state.items.find((item) => {
      const itemUniqueId = item.product.selectedVariant
        ? `${item.product._id}-${item.product.selectedVariant._id}`
        : item.product._id
      const targetUniqueId = variantId ? `${productId}-${variantId}` : productId
      // console.log(`getItemQuantity: Comparing item: ${itemUniqueId} with target: ${targetUniqueId}`)
      return itemUniqueId === targetUniqueId
    })
    const quantity = item ? item.quantity : 0
    // console.log(`getItemQuantity(${productId}, ${variantId}): ${quantity}`)
    return quantity
  }

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isInCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
