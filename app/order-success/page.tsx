"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Package, MapPin, CreditCard, Clock, RefreshCw, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"

interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  total: number
  thumbnail?: string
}

interface OrderData {
  orderNumber: string
  status: string
  paymentStatus: string
  items: OrderItem[]
  total: number
  subtotal: number
  shipping: number
  tax: number
  shippingAddress: {
    name: string
    address: string
    city: string
    state: string
    pincode: string
    phone: string
    email: string
    country: string
  }
  paymentMethod: string
  paymentId?: string
  createdAt: string
  notes?: string
}

export default function OrderSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get("orderNumber")

  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingOrders, setPendingOrders] = useState<any[]>([])
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (!orderNumber) {
      router.push("/products")
      return
    }

    loadOrderData()
    loadPendingOrders()
  }, [orderNumber, router])

  const loadOrderData = () => {
    try {
      // First try to load from localStorage (most recent)
      const lastOrder = localStorage.getItem("lastOrder")
      if (lastOrder) {
        const parsedOrder = JSON.parse(lastOrder)
        if (parsedOrder.orderNumber === orderNumber) {
          setOrderData(parsedOrder)
          setLoading(false)
          return
        }
      }

      // If not found in localStorage, try to fetch from API
      fetchOrderFromAPI()
    } catch (error) {
      console.error("Error loading order data:", error)
      setLoading(false)
    }
  }

  const fetchOrderFromAPI = async () => {
    try {
      const response = await apiClient.getOrder(orderNumber!)
      if (response.success && response.data) {
        setOrderData(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch order from API:", error)
      toast.error("Could not load order details")
    } finally {
      setLoading(false)
    }
  }

  const loadPendingOrders = () => {
    try {
      const pending = JSON.parse(localStorage.getItem("pendingOrders") || "[]")
      setPendingOrders(pending)
    } catch (error) {
      console.error("Error loading pending orders:", error)
    }
  }

  const handleSyncOrders = async () => {
    setSyncing(true)
    try {
      const result = await apiClient.retryPendingOrders()
      if (result.synced > 0) {
        toast.success(`Successfully synced ${result.synced} orders to database`)
        loadPendingOrders() // Refresh pending orders list
      } else if (result.pending === 0) {
        toast.success("All orders are already synced")
      } else {
        toast.info(`${result.pending} orders still pending sync`)
      }
    } catch (error) {
      console.error("Sync failed:", error)
      toast.error("Failed to sync orders")
    } finally {
      setSyncing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "shipped":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "success":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading order details...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50">

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
              <p className="text-gray-600 mb-6">We couldn't find an order with number: {orderNumber}</p>
              <Button onClick={() => router.push("/products")}>Continue Shopping</Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">
            Thank you for your purchase. Your order has been received and is being processed.
          </p>
        </div>

        {/* Pending Orders Alert */}
        {pendingOrders.length > 0 && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">{pendingOrders.length} order(s) pending database sync</p>
                    <p className="text-sm text-yellow-700">Orders are saved locally and will be synced automatically</p>
                  </div>
                </div>
                <Button onClick={handleSyncOrders} disabled={syncing} variant="outline" size="sm">
                  {syncing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync Now
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
                <CardDescription>Order #{orderData.orderNumber}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Order Status</span>
                  <Badge className={getStatusColor(orderData.status)}>
                    {orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Payment Status</span>
                  <Badge className={getPaymentStatusColor(orderData.paymentStatus)}>
                    {orderData.paymentStatus.charAt(0).toUpperCase() + orderData.paymentStatus.slice(1)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Order Date</span>
                  <span className="text-sm font-medium">
                    {new Date(orderData.createdAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {orderData.paymentId && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Payment ID</span>
                    <span className="text-sm font-mono">{orderData.paymentId}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderData.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <img
                        src={item.thumbnail || "/placeholder.svg?height=60&width=60"}
                        alt={item.name}
                        className="h-15 w-15 rounded object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity} × ₹{item.price.toLocaleString()}
                        </p>
                      </div>
                      <p className="font-medium">₹{item.total.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{orderData.shippingAddress.name}</p>
                  <p>{orderData.shippingAddress.address}</p>
                  <p>
                    {orderData.shippingAddress.city}, {orderData.shippingAddress.state}{" "}
                    {orderData.shippingAddress.pincode}
                  </p>
                  <p>{orderData.shippingAddress.country}</p>
                  <p className="pt-2">
                    <span className="text-gray-600">Phone:</span> {orderData.shippingAddress.phone}
                  </p>
                  <p>
                    <span className="text-gray-600">Email:</span> {orderData.shippingAddress.email}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{orderData.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{orderData.shipping === 0 ? "Free" : `₹${orderData.shipping}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (GST 18%)</span>
                    <span>₹{orderData.tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>₹{orderData.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="capitalize">{orderData.paymentMethod}</p>
                {orderData.paymentMethod === "razorpay" && (
                  <p className="text-sm text-gray-600 mt-1">Secure online payment via Razorpay</p>
                )}
              </CardContent>
            </Card>

            {/* Order Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Order Confirmed</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        ["processing", "shipped", "delivered"].includes(orderData.status.toLowerCase())
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    <span className="text-sm">Processing</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        ["shipped", "delivered"].includes(orderData.status.toLowerCase())
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    <span className="text-sm">Shipped</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        orderData.status.toLowerCase() === "delivered" ? "bg-green-500" : "bg-gray-300"
                      }`}
                    ></div>
                    <span className="text-sm">Delivered</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button onClick={() => router.push("/products")} className="w-full">
                Continue Shopping
              </Button>
              <Button onClick={() => router.push("/orders")} variant="outline" className="w-full">
                View All Orders
              </Button>
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        {orderData.notes && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Order Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{orderData.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Support Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              If you have any questions about your order, please contact our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" size="sm">
                Contact Support
              </Button>
              <Button variant="outline" size="sm">
                Track Order
              </Button>
              <Button variant="outline" size="sm">
                Download Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}
