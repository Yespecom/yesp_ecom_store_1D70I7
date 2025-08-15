"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/lib/cart-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { toast } from "sonner"
import {
  Truck,
  Shield,
  ArrowLeft,
  Smartphone,
  CreditCard,
  Lock,
  CheckCircle,
  MapPin,
  User,
  Mail,
  Phone,
  Home,
  Package,
  Star,
} from "lucide-react"
import { apiClient } from "@/lib/api"

interface PhonePeConfig {
  enabled: boolean
  merchantId: string
  appId: string
  environment: "sandbox" | "production"
}

interface PaymentConfig {
  codEnabled: boolean
  onlinePaymentEnabled: boolean
  phonepe: PhonePeConfig
  supportedMethods: Array<{
    id: string
    name: string
    description: string
    enabled: boolean
  }>
}

export default function CheckoutPage() {
  const router = useRouter()
  const { state: cartState, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null)
  const [cartLoaded, setCartLoaded] = useState(false)

  const [formData, setFormData] = useState({
    // Shipping Information
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  })

  useEffect(() => {
    if (cartState !== undefined) {
      setCartLoaded(true)

      if (cartState.items && cartState.items.length === 0) {
        console.log("🛒 Cart is empty, redirecting to products")
        toast.error("Your cart is empty")
        router.push("/products")
        return
      }
    }
  }, [cartState, router])

  useEffect(() => {
    if (!cartLoaded) return

    const checkAuthentication = () => {
      const token = localStorage.getItem("auth_token")
      const userData = localStorage.getItem("user_data")

      console.log("🔐 Checking authentication:", { hasToken: !!token, hasUserData: !!userData })

      if (!token) {
        console.log("❌ No auth token found, redirecting to login")
        toast.error("Please login to continue with checkout")
        router.push("/login?redirect=/checkout")
        return
      }

      setIsAuthenticated(true)
      setCheckingAuth(false)

      if (userData) {
        try {
          const user = JSON.parse(userData)
          console.log("👤 Loading user data:", user)
          setFormData((prev) => ({
            ...prev,
            firstName: user.name?.split(" ")[0] || "",
            lastName: user.name?.split(" ").slice(1).join(" ") || "",
            email: user.email || "",
            phone: user.phone || "",
          }))
        } catch (error) {
          console.error("Error loading user data:", error)
        }
      }
    }

    checkAuthentication()
  }, [cartLoaded, router])

  useEffect(() => {
    const loadPhonePeConfig = async () => {
      try {
        console.log("🔧 Loading PhonePe configuration...")
        const response = await apiClient.getPhonePeConfig()
        console.log("💳 PhonePe config loaded:", response)

        if (response.success && response.data?.config) {
          setPaymentConfig(response.data.config)
        }
      } catch (error) {
        console.error("Failed to load PhonePe config:", error)
        // Set default fallback config
        setPaymentConfig({
          codEnabled: true,
          onlinePaymentEnabled: true,
          phonepe: {
            enabled: true,
            merchantId: "PGTESTPAYUAT",
            appId: "83ff1e32-3d2e-4a9a-8ccc-d4a0c8c0c0c0",
            environment: "sandbox",
          },
          supportedMethods: [
            {
              id: "phonepe",
              name: "Online Payment",
              description: "Pay securely with UPI, Cards, Net Banking",
              enabled: true,
            },
          ],
        })
      }
    }

    if (isAuthenticated) {
      loadPhonePeConfig()
    }
  }, [isAuthenticated])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const calculateTotals = () => {
    const subtotal = cartState?.total || 0
    const shipping = 0 // Always free shipping
    const tax = subtotal * 0.18 // 18% GST
    const total = subtotal + shipping + tax
    return { subtotal, shipping, tax, total }
  }

  const handlePhonePePayment = async (orderData: any, localOrderData: any) => {
    if (!paymentConfig?.phonepe?.enabled) {
      throw new Error("PhonePe not available")
    }

    const { total } = calculateTotals()

    try {
      console.log("💳 Initiating PhonePe payment...")

      // Create PhonePe order
      const phonePeOrderData = {
        ...orderData,
        amount: Math.round(total * 100), // Amount in paise
        customerInfo: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
        },
      }

      const response = await apiClient.createPhonePeOrder(phonePeOrderData)

      if (response.success && response.data?.paymentUrl) {
        console.log("✅ PhonePe order created, redirecting to payment page...")

        // Store order data locally before redirecting
        const updatedLocalOrderData = {
          ...localOrderData,
          paymentMethod: "online",
          paymentStatus: "pending",
          phonePeTransactionId: response.data.transactionId,
        }

        localStorage.setItem("lastOrder", JSON.stringify(updatedLocalOrderData))
        localStorage.setItem(
          "pendingPayment",
          JSON.stringify({
            transactionId: response.data.transactionId,
            orderData: updatedLocalOrderData,
          }),
        )

        // Redirect to PhonePe payment page
        window.location.href = response.data.paymentUrl

        return {
          success: true,
          order: updatedLocalOrderData,
          message: "Redirecting to PhonePe payment page...",
        }
      } else {
        throw new Error(response.message || "Failed to create PhonePe order")
      }
    } catch (error) {
      console.error("❌ PhonePe payment failed:", error)
      throw error
    }
  }

  const handlePayNow = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        console.log("❌ No auth token, redirecting to login")
        toast.error("Please login to continue")
        router.push("/login?redirect=/checkout")
        return
      }

      const requiredFields = ["firstName", "lastName", "email", "phone", "address", "city", "state", "pincode"]
      const missingFields = requiredFields.filter((field) => !formData[field as keyof typeof formData])

      if (missingFields.length > 0) {
        toast.error("Please fill in all required fields")
        setLoading(false)
        return
      }

      if (!paymentConfig?.phonepe?.enabled) {
        toast.error("Payment gateway is not available. Please try again.")
        setLoading(false)
        return
      }

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const orderData = {
        items: (cartState.items || []).map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
        })),
        shippingAddress: {
          name: `${formData.firstName} ${formData.lastName}`,
          street: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.pincode,
          country: formData.country,
        },
        paymentMethod: "phonepe", // Changed from razorpay to phonepe
        notes: `Email: ${formData.email}, Phone: ${formData.phone}`,
      }

      const { subtotal, shipping, tax, total } = calculateTotals()

      const localOrderData = {
        orderNumber,
        items: (cartState.items || []).map((item) => ({
          productId: item.product._id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          total: item.product.price * item.quantity,
          thumbnail: item.product.thumbnail,
        })),
        total,
        subtotal,
        shipping,
        tax,
        shippingAddress: {
          name: `${formData.firstName} ${formData.lastName}`,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          phone: formData.phone,
          email: formData.email,
          country: formData.country,
        },
        paymentMethod: "online",
        status: "confirmed",
        paymentStatus: "pending",
        createdAt: new Date().toISOString(),
        notes: `Email: ${formData.email}, Phone: ${formData.phone}`,
      }

      localStorage.setItem("lastOrder", JSON.stringify(localOrderData))
      console.log("Order saved locally:", localOrderData)

      console.log("💳 Opening PhonePe payment...")
      const response = await handlePhonePePayment(orderData, localOrderData)
      console.log("Payment response:", response)

      // PhonePe will redirect to payment page, so we don't need to handle success here
      // The success will be handled by the callback URL
    } catch (error) {
      console.error("Payment processing failed:", error)

      if (error.message?.includes("Access denied") || error.message?.includes("Please login")) {
        console.log("❌ Authentication error, redirecting to login")
        toast.error("Session expired. Please login again.")
        router.push("/login?redirect=/checkout")
        return
      }

      if (error.message === "Payment cancelled by user") {
        toast.error("Payment was cancelled. Please try again.")
      } else {
        toast.error("Payment failed. Please try again.", {
          description: "If the problem persists, please contact support.",
          duration: 5000,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth || !cartLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            {checkingAuth ? "Checking authentication..." : "Loading checkout..."}
          </p>
          <p className="text-gray-400 text-sm mt-2">Please wait while we prepare your checkout</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (!cartState || !cartState.items || cartState.items.length === 0) {
    return null
  }

  const { subtotal, shipping, tax, total } = calculateTotals()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 sm:mb-8 hover:bg-white/80 border border-gray-200 shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shopping
        </Button>

        <div className="mb-6 sm:mb-8 hidden sm:block">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
              </div>
              <span className="ml-2 text-sm font-medium text-black">Cart</span>
            </div>
            <div className="w-16 h-0.5 bg-black"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-black">Checkout</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="ml-2 text-sm font-medium text-gray-500">Confirmation</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Shipping Information */}
            <Card className="border shadow-sm bg-white">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-lg flex items-center justify-center">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Shipping Information</CardTitle>
                    <CardDescription className="text-sm">Where should we deliver your order?</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="border-gray-200 focus:border-black focus:ring-black h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="border-gray-200 focus:border-black focus:ring-black h-11"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="border-gray-200 focus:border-black focus:ring-black h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="border-gray-200 focus:border-black focus:ring-black h-11"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700 flex items-center">
                    <Home className="h-4 w-4 mr-1" />
                    Street Address *
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="border-gray-200 focus:border-black focus:ring-black h-11"
                    placeholder="Enter your full address"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                      City *
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="border-gray-200 focus:border-black focus:ring-black h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                      State *
                    </Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="border-gray-200 focus:border-black focus:ring-black h-11"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pincode" className="text-sm font-medium text-gray-700">
                      Pincode *
                    </Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="border-gray-200 focus:border-black focus:ring-black h-11"
                      placeholder="6-digit pincode"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                      Country
                    </Label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      className="border-gray-200 bg-gray-50 h-11"
                      disabled
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="border shadow-sm bg-white">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-lg flex items-center justify-center">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Payment Method</CardTitle>
                    <CardDescription className="text-sm">Choose your preferred payment option</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {paymentConfig?.phonepe?.enabled ? (
                  <div className="space-y-4">
                    <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-50 p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-full flex items-center justify-center">
                          <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-base sm:text-lg">PhonePe Secure Payment</h3>
                          <p className="text-gray-600 text-sm">Pay with UPI, Cards, Net Banking, and Digital Wallets</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              SSL Secured
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="bg-purple-100 text-purple-800 border-purple-200 text-xs"
                            >
                              PhonePe Gateway
                            </Badge>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Trusted by millions</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start space-x-3">
                        <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">100% Secure Payment</h4>
                          <p className="text-gray-600 text-xs mt-1">
                            Your payment information is encrypted and secure. Powered by PhonePe's trusted gateway.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-4 sm:p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-gray-400 border-t-black rounded-full animate-spin flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">Loading payment options...</p>
                      <p className="text-sm text-gray-600">Please wait while we configure your payment methods</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-4 sm:space-y-6">
            <Card className="border shadow-sm bg-white lg:sticky lg:top-4">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-lg flex items-center justify-center">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Order Summary</CardTitle>
                    <CardDescription className="text-sm">
                      {cartState.items.length} item{cartState.items.length > 1 ? "s" : ""} in your cart
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                {/* Items */}
                <div className="space-y-3 sm:space-y-4 max-h-48 sm:max-h-64 overflow-y-auto">
                  {cartState.items.map((item) => (
                    <div key={item.product._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="relative flex-shrink-0">
                        <img
                          src={item.product.thumbnail || "/placeholder.svg?height=60&width=60"}
                          alt={item.product.name}
                          className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg object-cover"
                        />
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 sm:h-6 sm:w-6 rounded-full p-0 flex items-center justify-center bg-black text-white text-xs">
                          {item.quantity}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 truncate">{item.product.name}</h4>
                        <p className="text-xs sm:text-sm text-gray-500">₹{item.product.price.toLocaleString()} each</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-sm text-gray-900">
                          ₹{(item.product.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (GST 18%)</span>
                    <span className="font-medium">₹{tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base sm:text-lg font-bold">
                    <span>Total</span>
                    <span className="text-black">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                  <div className="text-center">
                    <p className="font-medium text-green-800 text-sm">Free Shipping</p>
                    <p className="text-green-600 text-xs">Delivered in 3-5 business days</p>
                  </div>
                </div>

                <Button
                  onClick={handlePayNow}
                  disabled={loading || !paymentConfig?.phonepe?.enabled}
                  className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-black hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing Payment...</span>
                    </div>
                  ) : !paymentConfig?.phonepe?.enabled ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading Gateway...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>Pay with PhonePe - ₹{total.toFixed(2)}</span>
                    </div>
                  )}
                </Button>

                {!paymentConfig?.phonepe?.enabled && (
                  <p className="text-center text-sm text-gray-500">Preparing secure payment gateway...</p>
                )}

                <div className="flex items-center justify-center space-x-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>SSL Secured</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Lock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>256-bit Encryption</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
