"use client"
import type React from "react"

import { useState, useEffect, useCallback } from "react" // Added useCallback
import { useSearchParams, useRouter } from "next/navigation" // Added useSearchParams
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  LucideSearch,
  X,
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { apiClient } from "@/lib/api"
import { ProductCard } from "@/components/products/product-card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Skeleton } from "@/components/ui/skeleton"
import type { Product } from "@/lib/api"

// Interfaces
interface Category {
  _id: string
  name: string
}

interface Offer {
  _id: string
  name: string
  type: string
  value: number
}

interface Toast {
  id: string
  title: string
  description?: string
  type: "success" | "error" | "warning" | "info"
  duration?: number
}

interface ProductVariant {
  _id?: string
  name: string
  options: { attributeName: string; value: string }[] // Changed to non-optional
  price: string
  originalPrice?: string
  stock?: string
  sku: string
  isActive: boolean
  image: string
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.yespstudio.com"

// Utility functions for safe string conversion
const safeToString = (value: any): string => {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  if (typeof value === "number") return value.toString()
  if (typeof value === "boolean") return value.toString()
  return String(value)
}

const safeToNumber = (value: any): number => {
  if (value === null || value === undefined || value === "") return 0
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

// Toast Notification Component
function ToastNotification({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id)
    }, toast.duration || 5000)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  const getToastStyles = () => {
    switch (toast.type) {
      case "success":
        return "bg-white border-l-4 border-green-500 shadow-lg"
      case "error":
        return "bg-white border-l-4 border-red-500 shadow-lg"
      case "warning":
        return "bg-white border-l-4 border-yellow-500 shadow-lg"
      case "info":
        return "bg-white border-l-4 border-blue-500 shadow-lg"
      default:
        return "bg-white border-l-4 border-gray-500 shadow-lg"
    }
  }

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className={`${getToastStyles()} rounded-lg p-4 mb-3 animate-in slide-in-from-right-full duration-300`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
          {toast.description && <p className="text-sm text-gray-600 mt-1">{toast.description}</p>}
        </div>
        <button onClick={() => onRemove(toast.id)} className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Toast Container Component
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-sm">
      {toasts.map((toast) => (
        <ToastNotification key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [apiErrors, setApiErrors] = useState<{ [key: string]: string }>({})
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Form data state
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    shortDescription: "",
    description: "",
    price: "",
    originalPrice: "", // This will be MRP
    taxPercentage: "",
    stock: "",
    lowStockAlert: "5",
    allowBackorders: false,
    category: "",
    offer: "none",
    weight: "",
    dimensions: {
      length: "",
      width: "",
      height: "",
    },
    metaTitle: "",
    metaDescription: "",
    hasVariants: false,
    variants: [] as ProductVariant[],
    trackQuantity: true,
    variantAttributes: [] as { name: string; values: string[] }[],
  })
  const [images, setImages] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams() // Added useSearchParams for client-side product page
  const limit = 12 // Products per page for client-side display

  // Variant Dialog State
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [variantImageUploadKey, setVariantImageUploadKey] = useState(0)

  // Toast functions
  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const showToast = (title: string, description?: string, type: Toast["type"] = "info") => {
    addToast({ title, description, type })
  }

  // Enhanced API error handling with better logging
  const handleApiError = (endpoint: string, response: Response, data?: any): string => {
    console.error(`❌ API Error for ${endpoint}:`, {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      // Stringify data for better console readability if it's an object
      data: typeof data === "object" && data !== null ? JSON.stringify(data, null, 2) : data,
      headers: Object.fromEntries(response.headers.entries()),
    })
    let errorMessage = "Something went wrong. Please try again."
    if (data?.error) {
      errorMessage = data.error
    } else if (data?.message) {
      errorMessage = data.message
    } else if (data?.details) {
      if (Array.isArray(data.details)) {
        errorMessage = data.details.map((detail: any) => detail.message || detail).join(", ")
      } else if (typeof data.details === "string") {
        errorMessage = data.details
      } else if (typeof data.details === "object") {
        const validationErrors = Object.entries(data.details)
          .map(([field, error]) => `${field}: ${error}`)
          .join(", ")
        errorMessage = validationErrors || "Validation failed"
      }
    } else if (data?.errors) {
      if (Array.isArray(data.errors)) {
        errorMessage = data.errors.map((error: any) => error.message || error).join(", ")
      } else if (typeof data.errors === "object") {
        const validationErrors = Object.entries(data.errors)
          .map(([field, error]) => `${field}: ${error}`)
          .join(", ")
        errorMessage = validationErrors || "Validation failed"
      }
    } else {
      switch (response.status) {
        case 400:
          errorMessage = "Bad request. Please check your data and try again."
          break
        case 401:
          errorMessage = "Authentication failed. Please log in again."
          localStorage.removeItem("token")
          router.push("/login")
          break
        case 403:
          errorMessage = "You don't have permission to perform this action."
          break
        case 404:
          errorMessage = "The requested resource was not found."
          break
        case 409:
          errorMessage = "Conflict. Resource already exists or there's a duplicate."
          break
        case 422:
          errorMessage = "Validation failed. Please check your input."
          break
        case 429:
          errorMessage = "Too many requests. Please wait a moment and try again."
          break
        case 500:
          errorMessage = "Server error. Please try again later."
          break
        default:
          errorMessage = `Request failed with status ${response.status}. Please try again.`
      }
    }
    return errorMessage
  }

  // Enhanced API request function
  const makeApiRequest = async (
    url: string,
    options: RequestInit = {},
    retries = 2,
  ): Promise<{ response: Response; data: any }> => {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No authentication token found. Please log in.")
    }

    const defaultHeaders: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    }

    // Only set Content-Type to application/json if body is not FormData
    if (!(options.body instanceof FormData)) {
      defaultHeaders["Content-Type"] = "application/json"
    }

    const defaultOptions: RequestInit = {
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      ...options,
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, defaultOptions)
        const responseText = await response.text()
        let data
        try {
          data = responseText ? JSON.parse(responseText) : {}
        } catch (parseError) {
          console.error(`❌ JSON parse error:`, parseError)
          if (response.ok) {
            data = {} // If response is OK but JSON is invalid, treat as empty object
          } else {
            throw new Error(`Invalid JSON response: ${responseText}`)
          }
        }

        if (!response.ok) {
          const errorMessage = handleApiError(url, response, data)
          if (attempt === retries) {
            throw new Error(errorMessage)
          }
          showToast("API Error", `Retrying... (${attempt + 1}/${retries})`, "warning")
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
          continue
        }
        return { response, data }
      } catch (error) {
        console.error(`❌ Request failed (attempt ${attempt + 1}):`, error)
        if (attempt === retries) {
          throw error
        }
        showToast("Network Error", `Retrying... (${attempt + 1}/${retries})`, "warning")
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
    throw new Error("Max retries exceeded")
  }

  // Auto-generate SKU function
  const generateSKU = () => {
    const prefix =
      formData.name
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase())
        .join("")
        .slice(0, 3) || "PRD"
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.random().toString(36).substr(2, 3).toUpperCase()
    const newSKU = `${prefix}${timestamp}${random}`
    setFormData((prev) => ({ ...prev, sku: newSKU }))
    showToast("SKU Generated", `New SKU: ${newSKU}`, "success")
  }

  // Auto-generate variant SKU
  const generateVariantSKU = () => {
    if (!editingVariant) return
    const baseSKU = formData.sku || "PRD"
    // Generate variant SKU from options if available, otherwise from name
    const variantOptionString =
      editingVariant.options?.map((opt) => opt.value).join("-") || editingVariant.name || "VAR"
    const variantNamePart = variantOptionString
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 6)
    const timestamp = Date.now().toString().slice(-4)
    const newSKU = `${baseSKU}-${variantNamePart}${timestamp}`
    setEditingVariant((prev) => {
      if (!prev) return null
      return { ...prev, sku: newSKU }
    })
    showToast("Variant SKU Generated", `New SKU: ${newSKU}`, "success")
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchOffers()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, selectedCategory, selectedStatus])

  const fetchProducts = async () => {
    try {
      setApiErrors((prev) => ({ ...prev, products: "" }))
      const { data } = await makeApiRequest(`${API_BASE_URL}/api/admin/products`)
      setProducts(Array.isArray(data) ? data : [])
      showToast("Products Loaded", `Successfully loaded ${Array.isArray(data) ? data.length : 0} products.`, "success")
    } catch (error) {
      console.error("❌ Error fetching products:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch products"
      setApiErrors((prev) => ({ ...prev, products: errorMessage }))
      showToast("Error Loading Products", errorMessage, "error")
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      setApiErrors((prev) => ({ ...prev, categories: "" }))
      const { data } = await makeApiRequest(`${API_BASE_URL}/api/admin/categories`)
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("❌ Error fetching categories:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch categories"
      setApiErrors((prev) => ({ ...prev, categories: errorMessage }))
      showToast("Error Loading Categories", errorMessage, "warning")
      setCategories([])
    }
  }

  const fetchOffers = async () => {
    try {
      setApiErrors((prev) => ({ ...prev, offers: "" }))
      const { data } = await makeApiRequest(`${API_BASE_URL}/api/admin/offers`)
      setOffers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("❌ Error fetching offers:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch offers"
      setApiErrors((prev) => ({ ...prev, offers: errorMessage }))
      showToast("Error Loading Offers", errorMessage, "warning")
      setOffers([])
    }
  }

  const filterProducts = () => {
    let filtered = products
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }
    if (selectedCategory !== "all") {
      filtered = filtered.filter((product) => product.category._id === selectedCategory)
    }
    if (selectedStatus !== "all") {
      if (selectedStatus === "active") {
        filtered = filtered.filter((product) => product.isActive)
      } else if (selectedStatus === "inactive") {
        filtered = filtered.filter((product) => !product.isActive)
      } else if (selectedStatus === "low-stock") {
        filtered = filtered.filter(
          (product) => product.trackQuantity && product.stock !== undefined && product.stock <= product.lowStockAlert,
        )
      } else if (selectedStatus === "out-of-stock") {
        filtered = filtered.filter(
          (product) =>
            product.trackQuantity && product.stock !== undefined && product.stock === 0 && !product.allowBackorders,
        )
      }
    }
    setFilteredProducts(filtered)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | React.ChangeEvent<HTMLTextAreaElement>>) => {
    const { name, value } = e.target
    if (name.startsWith("dimensions.")) {
      const dimensionKey = name.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [dimensionKey]: value,
        },
      }))
    } else {
      setFormData((prev) => {
        const newFormData = { ...prev, [name]: value }
        // Apply pricing validation immediately and synchronously
        if (name === "price" || name === "originalPrice") {
          if (!newFormData.hasVariants) {
            const priceValue = safeToNumber(newFormData.price)
            const originalPriceValue = safeToNumber(newFormData.originalPrice)
            if (newFormData.originalPrice && originalPriceValue <= priceValue) {
              newFormData.originalPrice = "" // Clear MRP
              showToast("Price Adjusted", "MRP was cleared because it must be greater than selling price", "warning")
            }
          }
        }
        return newFormData
      })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => {
      const newFormData = { ...prev, [name]: checked }
      if (name === "hasVariants" && !checked) {
        newFormData.variants = []
        newFormData.variantAttributes = [] // Clear variant attributes if variants are disabled
      }
      return newFormData
    })
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags((prev) => [...prev, tagInput.trim().toLowerCase()])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove))
  }

  // Variant Management Functions
  // This function is now primarily for editing an existing variant's details
  const handleEditVariantClick = (variant: ProductVariant) => {
    const safeVariant: ProductVariant = {
      _id: variant._id,
      name: safeToString(variant.name),
      options:
        variant.options?.map((opt) => ({
          attributeName: safeToString(opt.attributeName),
          value: safeToString(opt.value),
        })) || [],
      price: safeToString(variant.price),
      originalPrice: variant.originalPrice ? safeToString(variant.originalPrice) : "",
      sku: safeToString(variant.sku),
      isActive: Boolean(variant.isActive),
      image: safeToString(variant.image),
    }
    if (formData.trackQuantity && variant.stock !== undefined) {
      safeVariant.stock = safeToString(variant.stock)
    }
    setEditingVariant(safeVariant)
    setVariantImageUploadKey((prev) => prev + 1) // Force re-render ImageUpload
    setIsVariantDialogOpen(true)
  }

  const handleDeleteVariant = (variantToDelete: ProductVariant) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((v) => v._id !== variantToDelete._id && v.sku !== variantToDelete.sku),
    }))
    showToast("Variant Deleted", `Variant '${variantToDelete.name}' has been removed.`, "success")
  }

  const handleVariantFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setEditingVariant((prev) => {
      if (!prev) return null
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }
      if (name === "price" || name === "originalPrice") {
        const priceValue = safeToNumber(updated.price)
        const originalPriceValue = safeToNumber(updated.originalPrice || "")
        if (updated.originalPrice && originalPriceValue <= priceValue) {
          updated.originalPrice = ""
          showToast("Price Adjusted", "MRP was cleared because it must be greater than selling price", "warning")
        }
      }
      return updated
    })
  }

  const handleVariantImageChange = (images: string[]) => {
    setEditingVariant((prev) => {
      if (!prev) return null
      return {
        ...prev,
        image: images.length > 0 ? images[0] : "",
      }
    })
  }

  const handleSaveVariant = () => {
    if (!editingVariant) return

    const requiredFields = ["price", "sku"]
    if (formData.trackQuantity) {
      requiredFields.push("stock")
    }

    const missingFields = requiredFields.filter((field) => {
      const value = editingVariant[field as keyof ProductVariant]
      const stringValue = safeToString(value)

      if (field === "stock" && formData.trackQuantity) {
        const stockNum = safeToNumber(stringValue)
        return stringValue.trim() === "" || isNaN(stockNum) || stockNum < 0
      }
      return !stringValue || stringValue.trim() === ""
    })

    if (missingFields.length > 0) {
      showToast("Validation Error", `Variant fields missing: ${missingFields.join(", ")}. Please fill them.`, "error")
      return
    }

    const editingVariantSku = safeToString(editingVariant.sku).trim().toUpperCase()
    const isDuplicateSKU = formData.variants.some((v) => {
      const variantSku = safeToString(v.sku).trim().toUpperCase()
      return variantSku === editingVariantSku && v._id !== editingVariant._id
    })

    if (isDuplicateSKU) {
      showToast("Duplicate SKU", "This SKU is already used by another variant.", "error")
      return
    }

    const variantToSave: ProductVariant = {
      _id:
        editingVariant._id && !editingVariant._id.startsWith("temp-")
          ? editingVariant._id
          : `temp-${Date.now()}-${Math.random()}`,
      name: safeToString(editingVariant.name).trim(),
      options:
        editingVariant.options?.map((opt) => ({
          attributeName: safeToString(opt.attributeName).trim(),
          value: safeToString(opt.value).trim(),
        })) || [],
      price: safeToString(editingVariant.price),
      originalPrice: editingVariant.originalPrice ? safeToString(editingVariant.originalPrice) : undefined,
      sku: safeToString(editingVariant.sku).trim().toUpperCase(),
      isActive: Boolean(editingVariant.isActive),
      image: safeToString(editingVariant.image),
    }
    if (formData.trackQuantity && editingVariant.stock !== undefined) {
      variantToSave.stock = safeToString(editingVariant.stock)
    }

    setFormData((prev) => {
      const existingIndex = prev.variants.findIndex((v) => v._id === editingVariant._id)
      if (existingIndex !== -1) {
        const updatedVariants = [...prev.variants]
        updatedVariants[existingIndex] = variantToSave
        return { ...prev, variants: updatedVariants }
      } else {
        // This case should ideally not happen if variants are generated, but kept for robustness
        return { ...prev, variants: [...prev.variants, variantToSave] }
      }
    })
    showToast("Variant Saved", `Variant '${safeToString(editingVariant.name)}' has been saved.`, "success")
    setIsVariantDialogOpen(false)
    setEditingVariant(null)
  }

  const validateForm = () => {
    const errors: string[] = []
    if (!formData.name.trim()) {
      errors.push("Product name is required")
    }
    if (!formData.sku.trim()) {
      errors.push("SKU is required")
    }
    if (!formData.shortDescription.trim()) {
      errors.push("Short description is required")
    }
    if (!formData.description.trim()) {
      errors.push("Description is required")
    }
    if (!formData.category) {
      errors.push("Category is required")
    }

    if (!formData.hasVariants) {
      const priceValue = safeToNumber(formData.price)
      if (!formData.price || priceValue <= 0) {
        errors.push("Selling Price must be greater than 0")
      }
      if (formData.originalPrice && formData.originalPrice.trim() !== "") {
        const originalPriceValue = safeToNumber(formData.originalPrice)
        if (isNaN(originalPriceValue) || originalPriceValue <= 0) {
          errors.push("MRP must be a valid positive number")
        } else if (originalPriceValue <= priceValue) {
          errors.push("MRP must be greater than Selling Price")
        }
      }
      if (formData.trackQuantity) {
        const stockValue = safeToNumber(formData.stock)
        if (formData.stock.trim() === "" || isNaN(stockValue) || stockValue < 0) {
          errors.push("Stock quantity cannot be empty, negative, or invalid when quantity tracking is enabled")
        }
      }
      if (!editingProduct && images.length === 0) {
        errors.push("At least one product image is required")
      }
    } else {
      // Validate variant attributes
      if (formData.variantAttributes.length === 0) {
        errors.push("At least one variant attribute (e.g., Size, Color) is required when variants are enabled.")
      } else {
        const missingAttributeFields = formData.variantAttributes.some(
          (attr) => !attr.name.trim() || attr.values.length === 0 || attr.values.some((val) => !val.trim()),
        )
        if (missingAttributeFields) {
          errors.push("All variant attributes must have a name and at least one value.")
        }
        const duplicateAttributeNames =
          new Set(formData.variantAttributes.map((attr) => attr.name.toLowerCase())).size !==
          formData.variantAttributes.length
        if (duplicateAttributeNames) {
          errors.push("Variant attribute names must be unique.")
        }
      }

      if (formData.variants.length === 0) {
        errors.push("At least one variant is required when variants are enabled")
      }
      for (let i = 0; i < formData.variants.length; i++) {
        const variant = formData.variants[i]
        const variantName = safeToString(variant.name)
        if (!variantName || variantName.trim() === "") {
          errors.push(`Variant ${i + 1}: Name is required`)
        }
        const variantPrice = safeToString(variant.price)
        const priceValue = safeToNumber(variantPrice)
        if (!variantPrice || variantPrice.trim() === "" || isNaN(priceValue) || priceValue <= 0) {
          errors.push(`Variant "${variantName}": Valid Selling Price is required`)
        }
        if (formData.trackQuantity) {
          const variantStock = safeToString(variant.stock || "")
          const stockValue = safeToNumber(variantStock)
          if (variantStock.trim() === "" || isNaN(stockValue) || stockValue < 0) {
            errors.push(`Variant "${variantName}": Valid stock quantity is required when quantity tracking is enabled`)
          }
        }
        const variantSku = safeToString(variant.sku)
        if (!variantSku || variantSku.trim() === "") {
          errors.push(`Variant "${variantName}": SKU is required`)
        }
        const currentSku = variantSku.trim().toUpperCase()
        const duplicateSku = formData.variants.find((v, index) => {
          if (index === i) return false
          const otherSku = safeToString(v.sku).trim().toUpperCase()
          return otherSku === currentSku
        })
        if (duplicateSku) {
          errors.push(`Duplicate SKU "${variantSku}" found in variants`)
        }
        const variantOriginalPrice = safeToString(variant.originalPrice || "")
        if (variantOriginalPrice && variantOriginalPrice.trim() !== "") {
          const originalPriceValue = safeToNumber(variantOriginalPrice)
          if (isNaN(originalPriceValue) || originalPriceValue <= 0) {
            errors.push(`Variant "${variantName}": MRP must be a valid positive number`)
          } else if (originalPriceValue <= priceValue) {
            errors.push(`Variant "${variantName}": MRP must be greater than Selling Price`)
          }
        }
        // Validate variant options structure against defined attributes
        const definedAttributes = formData.variantAttributes.map((attr) => attr.name.toLowerCase())
        const variantOptionNames = variant.options.map((opt) => opt.attributeName.toLowerCase())

        if (
          variant.options.length !== definedAttributes.length ||
          !definedAttributes.every((attrName) => variantOptionNames.includes(attrName))
        ) {
          errors.push(`Variant "${variantName}": Options do not match defined variant attributes.`)
        } else {
          const invalidOptionValues = variant.options.some((opt) => {
            const attributeDef = formData.variantAttributes.find(
              (attr) => attr.name.toLowerCase() === opt.attributeName.toLowerCase(),
            )
            return !attributeDef || !attributeDef.values.includes(opt.value)
          })
          if (invalidOptionValues) {
            errors.push(`Variant "${variantName}": One or more option values are invalid for their attribute.`)
          }
        }
      }
      const hasMainImages = images.length > 0
      const hasVariantImages = formData.variants.some((variant) => {
        const variantImage = safeToString(variant.image)
        return variantImage && variantImage.trim() !== ""
      })
      if (!editingProduct && !hasMainImages && !hasVariantImages) {
        errors.push("At least one image is required (either main product images or variant images)")
      }
    }
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      showToast("Validation Error", validationErrors[0], "error")
      return
    }

    setIsSubmitting(true)
    try {
      const submitData = new FormData()

      // Append all form data fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "dimensions") {
          submitData.append(key, JSON.stringify(value))
        } else if (key === "variants") {
          if (formData.hasVariants) {
            const cleanedVariants = formData.variants
              .filter((variant) => {
                // Ensure required fields for variants are present
                const requiredFields = ["name", "price", "sku"]
                if (formData.trackQuantity) {
                  requiredFields.push("stock")
                }
                const isValid = requiredFields.every((field) => {
                  const fieldValue = safeToString(variant[field as keyof ProductVariant])
                  if (field === "stock" && formData.trackQuantity) {
                    const stockNum = safeToNumber(fieldValue)
                    return fieldValue.trim() !== "" && !isNaN(stockNum) && stockNum >= 0
                  }
                  return fieldValue && fieldValue.trim() !== ""
                })
                // Also validate options for variants
                const hasValidOptions =
                  variant.options &&
                  variant.options.length > 0 &&
                  !variant.options.some((opt) => !opt.attributeName.trim() || !opt.value.trim())
                return isValid && hasValidOptions
              })
              .map((variant) => {
                // Convert numeric fields to actual numbers
                const cleanVariant: any = {
                  name: safeToString(variant.name).trim(),
                  options:
                    variant.options?.map((opt) => ({
                      attributeName: safeToString(opt.attributeName).trim(),
                      value: safeToString(opt.value).trim(),
                    })) || [],
                  price: Number.parseFloat(safeToString(variant.price)) || 0,
                  sku: safeToString(variant.sku).trim().toUpperCase(),
                  isActive: Boolean(variant.isActive),
                  image: safeToString(variant.image),
                }
                if (formData.trackQuantity && variant.stock !== undefined) {
                  // Ensure stock is sent as a string to match Mongoose schema's type: String
                  cleanVariant.stock = safeToString(variant.stock)
                } else if (!formData.trackQuantity) {
                  // If quantity is not tracked, ensure stock is not sent for variants
                  delete cleanVariant.stock
                }
                if (variant._id && !variant._id.startsWith("temp-") && variant._id.match(/^[0-9a-fA-F]{24}$/)) {
                  cleanVariant._id = variant._id
                }
                const originalPrice = safeToString(variant.originalPrice || "")
                if (originalPrice.trim() === "") {
                  cleanVariant.originalPrice = undefined // Send undefined to omit from payload if empty
                } else {
                  // Ensure originalPrice is sent as a string to match Mongoose schema's type: String
                  cleanVariant.originalPrice = originalPrice
                }
                return cleanVariant
              })
            submitData.append(key, JSON.stringify(cleanedVariants))
          } else {
            submitData.append(key, JSON.stringify([]))
          }
        } else if (key === "variantAttributes") {
          // Handle variantAttributes
          if (formData.hasVariants) {
            const cleanedAttributes = formData.variantAttributes.filter(
              (attr) => attr.name.trim() && attr.values.length > 0 && !attr.values.some((val) => !val.trim()),
            )
            submitData.append(key, JSON.stringify(cleanedAttributes))
          } else {
            submitData.append(key, JSON.stringify([]))
          }
        } else if (key === "hasVariants" || key === "allowBackorders" || key === "trackQuantity") {
          // Explicitly handle boolean fields
          submitData.append(key, value.toString())
        } else if (value !== null && value !== undefined) {
          const stringValue = safeToString(value)
          if (key === "price") {
            // Always append price. Backend will handle validation and parsing.
            submitData.append(key, stringValue)
          } else if (key === "originalPrice") {
            // Always append originalPrice. Backend will handle validation and parsing.
            submitData.append(key, stringValue)
          } else if (key === "stock") {
            // For main product stock (non-variant, quantity tracked)
            if (formData.trackQuantity && !formData.hasVariants) {
              const stockNum = safeToNumber(value)
              submitData.append(key, stockNum.toString()) // Ensure it's a string
            }
            // If not tracking quantity or has variants, stock is not appended for main product.
          } else if (["taxPercentage", "weight", "lowStockAlert"].includes(key)) {
            const numValue = Number.parseFloat(stringValue)
            if (stringValue.trim() === "") {
              submitData.append(key, "null")
            } else if (!isNaN(numValue)) {
              submitData.append(key, numValue.toString())
            }
          } else {
            submitData.append(key, stringValue)
          }
        }
      })

      submitData.append("tags", JSON.stringify(tags))
      submitData.append("gallery", JSON.stringify(images)) // Send main product images as a JSON array
      if (formData.offer && formData.offer !== "none") {
        submitData.append("offer", formData.offer)
      }

      const url = editingProduct
        ? `${API_BASE_URL}/api/admin/products/${editingProduct._id}`
        : `${API_BASE_URL}/api/admin/products`
      const method = editingProduct ? "PUT" : "POST"

      const { response, data } = await makeApiRequest(url, {
        method,
        body: submitData,
        headers: {
          // Content-Type is automatically set to multipart/form-data when using FormData
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        showToast(
          editingProduct ? "Product Updated" : "Product Created",
          `Product "${data.data?.name || formData.name}" has been ${editingProduct ? "updated" : "created"} successfully.`,
          "success",
        )
        setDialogOpen(false)
        resetForm()
        fetchProducts()
      }
    } catch (error) {
      console.error("❌ Submit error:", error)
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again."
      if (errorMessage.includes("Validation failed")) {
        showToast(
          "Validation Error",
          "Please check all required fields and ensure data is valid. Check the console for detailed error information.",
          "error",
        )
      } else {
        showToast("Error", errorMessage, "error")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleView = (product: Product) => {
    setViewingProduct(product)
    setViewDialogOpen(true)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: safeToString(product.name),
      sku: safeToString(product.sku),
      shortDescription: safeToString(product.shortDescription),
      description: safeToString(product.description),
      price: product.hasVariants ? "" : safeToString(product.price), // Clear if variants
      // FIX: If originalPrice is 0, treat it as empty string to avoid validation issues
      originalPrice:
        !product.hasVariants && product.originalPrice === 0 ? "" : safeToString(product.originalPrice || ""),
      taxPercentage: safeToString(product.taxPercentage || 0),
      stock: product.hasVariants ? "" : safeToString(product.stock || ""), // Clear if variants
      lowStockAlert: safeToString(product.lowStockAlert || 5),
      allowBackorders: Boolean(product.allowBackorders),
      category: safeToString(product.category?._id || ""),
      offer: safeToString(product.offer?._id || "none"),
      weight: safeToString(product.weight || 0),
      dimensions: {
        length: safeToString(product.dimensions?.length || 0),
        width: safeToString(product.dimensions?.width || 0),
        height: safeToString(product.dimensions?.height || 0),
      },
      metaTitle: safeToString(product.metaTitle || ""),
      metaDescription: safeToString(product.metaDescription || ""),
      hasVariants: Boolean(product.hasVariants),
      variants: product.variants
        ? product.variants.map((variant) => ({
            _id: variant._id,
            name: safeToString(variant.name),
            options:
              variant.options?.map((opt) => ({
                attributeName: safeToString(opt.attributeName),
                value: safeToString(opt.value),
              })) || [],
            price: safeToString(variant.price),
            originalPrice: variant.originalPrice ? safeToString(variant.originalPrice) : undefined,
            stock: variant.stock !== undefined ? safeToString(variant.stock) : undefined,
            sku: safeToString(variant.sku),
            isActive: Boolean(variant.isActive),
            image: safeToString(variant.image || ""),
          }))
        : [],
      trackQuantity: product.trackQuantity !== undefined ? Boolean(product.trackQuantity) : true,
      variantAttributes:
        product.variantAttributes?.map((attr) => ({
          name: safeToString(attr.name),
          values: attr.values?.map((val) => safeToString(val)) || [],
        })) || [],
    })
    setImages(product.gallery ? [...product.gallery] : [])
    setTags(product.tags ? [...product.tags] : [])
    setTagInput("")
    setDialogOpen(true)
  }

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return
    try {
      const { response } = await makeApiRequest(`${API_BASE_URL}/api/admin/products/${productId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        showToast("Product Deleted", "Product has been deleted successfully.", "success")
        fetchProducts()
      }
    } catch (error) {
      console.error("❌ Delete error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to delete product"
      showToast("Error", errorMessage, "error")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      shortDescription: "",
      description: "",
      price: "",
      originalPrice: "",
      taxPercentage: "",
      stock: "",
      lowStockAlert: "5",
      allowBackorders: false,
      category: "",
      offer: "none",
      weight: "",
      dimensions: {
        length: "",
        width: "",
        height: "",
      },
      metaTitle: "",
      metaDescription: "",
      hasVariants: false,
      variants: [],
      trackQuantity: true,
      variantAttributes: [], // Reset variant attributes
    })
    setImages([])
    setTags([])
    setTagInput("")
    setEditingProduct(null)
  }

  const getStockStatusColor = (product: Product) => {
    if (!product.trackQuantity) {
      return "bg-blue-50 text-blue-700 border border-blue-200"
    }
    const stock = product.stock || 0
    const lowStockAlert = product.lowStockAlert || 5
    const allowBackorders = product.allowBackorders || false

    if (stock === 0 && !allowBackorders) {
      return "bg-red-50 text-red-700 border border-red-200"
    } else if (stock <= lowStockAlert && stock > 0) {
      return "bg-amber-50 text-amber-700 border border-amber-200"
    } else if (stock > 0) {
      return "bg-green-50 text-green-700 border border-green-200"
    }
    return "bg-gray-50 text-gray-700 border border-gray-200"
  }

  const getStockStatusText = (product: Product) => {
    if (!product.trackQuantity) {
      return "Not Tracked"
    }
    const stock = product.stock || 0
    const lowStockAlert = product.lowStockAlert || 5
    const allowBackorders = product.allowBackorders || false

    if (stock === 0 && !allowBackorders) {
      return "Out of Stock"
    } else if (stock <= lowStockAlert && stock > 0) {
      return "Low Stock"
    } else if (stock > 0) {
      return "In Stock"
    } else if (stock === 0 && allowBackorders) {
      return "Out of Stock (Backorderable)"
    }
    return "Unknown"
  }

  const handleRetry = (type: "products" | "categories" | "offers") => {
    switch (type) {
      case "products":
        fetchProducts()
        break
      case "categories":
        fetchCategories()
        break
      case "offers":
        fetchOffers()
        break
    }
  }

  const handleExportProducts = () => {
    showToast("Export Started", "Product export will be available soon.", "info")
  }

  const handleImportProducts = () => {
    showToast("Import Feature", "Product import will be available soon.", "info")
  }

  // Functions to manage variant attributes
  const handleAddVariantAttribute = () => {
    setFormData((prev) => ({
      ...prev,
      variantAttributes: [...prev.variantAttributes, { name: "", values: [] }],
    }))
  }

  const handleRemoveVariantAttribute = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variantAttributes: prev.variantAttributes.filter((_, i) => i !== index),
    }))
  }

  const handleVariantAttributeNameChange = (index: number, name: string) => {
    setFormData((prev) => {
      const newAttributes = [...prev.variantAttributes]
      newAttributes[index] = { ...newAttributes[index], name }
      return { ...prev, variantAttributes: newAttributes }
    })
  }

  const handleVariantAttributeValuesChange = (index: number, valuesString: string) => {
    setFormData((prev) => {
      const newAttributes = [...prev.variantAttributes]
      newAttributes[index] = {
        ...newAttributes[index],
        values: valuesString
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
      }
      return { ...prev, variantAttributes: newAttributes }
    })
  }

  // Function to generate all possible variant combinations
  const generateVariantCombinations = useCallback(() => {
    if (!formData.hasVariants || formData.variantAttributes.length === 0) {
      showToast("Info", "No variant attributes defined to generate combinations.", "info")
      setFormData((prev) => ({ ...prev, variants: [] }))
      return
    }

    const validAttributes = formData.variantAttributes.filter(
      (attr) => attr.name.trim() && attr.values.length > 0 && !attr.values.some((val) => !val.trim()),
    )

    if (validAttributes.length === 0) {
      showToast("Validation Error", "Please define at least one valid variant attribute with values.", "error")
      setFormData((prev) => ({ ...prev, variants: [] }))
      return
    }

    const newVariants: ProductVariant[] = []

    // Recursive function to generate combinations
    const generate = (index: number, currentCombination: { attributeName: string; value: string }[]) => {
      if (index === validAttributes.length) {
        const variantName = currentCombination.map((opt) => `${opt.attributeName}: ${opt.value}`).join(" / ")
        const existingVariant = formData.variants.find((v) => {
          // Check if a variant with the exact same options already exists
          if (v.options.length !== currentCombination.length) return false
          return currentCombination.every((comboOpt) =>
            v.options.some((vOpt) => vOpt.attributeName === comboOpt.attributeName && vOpt.value === comboOpt.value),
          )
        })

        if (existingVariant) {
          // If variant exists, use its data (e.g., _id, price, stock, image)
          newVariants.push({ ...existingVariant, name: variantName })
        } else {
          // Create a new temporary variant
          newVariants.push({
            _id: `temp-${Date.now()}-${Math.random()}`, // Temporary ID for new variants
            name: variantName,
            options: currentCombination,
            price: "", // Default empty
            originalPrice: "",
            stock: formData.trackQuantity ? "" : undefined, // Default empty if tracking
            sku: "", // Will be auto-generated on save or manually
            isActive: true,
            image: "",
          })
        }
        return
      }

      const currentAttribute = validAttributes[index]
      currentAttribute.values.forEach((value) => {
        generate(index + 1, [...currentCombination, { attributeName: currentAttribute.name, value: value }])
      })
    }

    generate(0, [])

    setFormData((prev) => ({ ...prev, variants: newVariants }))
    showToast("Variants Generated", `Generated ${newVariants.length} variant combinations.`, "success")
  }, [formData.variantAttributes, formData.variants, formData.trackQuantity]) // Added dependencies

  // Client-side product page specific states and functions

  // This useEffect is for the client-side product display, not the admin panel
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
  }, [searchParams]) // Empty dependency array to run once on mount

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

  // Remove AdminLayout and ToastContainer
  // Remove the if (loading) block

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
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
                    <LucideSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
