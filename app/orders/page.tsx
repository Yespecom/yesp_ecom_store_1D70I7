"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Eye,
  Download,
  RefreshCw,
  AlertCircle,
} from "lucide-react"

interface OrderItem {
  product: {
    _id: string
    name: string
    thumbnail: string
    slug?: string
    price: number
  }
  quantity: number
  price: number
}

interface Order {
  _id: string
  orderNumber: string
  status: string
  items: OrderItem[]
  total: number
  subtotal: number
  tax: number
  shipping: number
  discount: number
  shippingAddress: {
    name: string
    address: string
    city: string
    state: string
    pincode: string
    phone: string
  }
  billingAddress: {
    name: string
    address: string
    city: string
    state: string
    pincode: string
    phone: string
  }
  paymentMethod: string
  paymentStatus: string
  trackingNumber?: string
  estimatedDelivery?: string
  createdAt: string
  updatedAt: string
}

interface OrdersResponse {
  success: boolean
  data: {
    orders: Order[]
    pagination: {
      currentPage: number
      totalPages: number
      totalOrders: number
      hasNextPage: boolean
      hasPrevPage: boolean
      limit: number
    }
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)
  const router = useRouter()

  // Using the storeId from the API base URL as requested
  const STORE_ID = "1D70I7"

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (checkAuth()) {
      loadOrders()
    }
  }, [currentPage, statusFilter])

  const checkAuth = () => {
    const token = localStorage.getItem("auth_token")
    if (!token) {
      router.push("/login")
      return false
    }
    return true
  }

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError("")

      const token = localStorage.getItem("auth_token")
      if (!token) {
        router.push("/login")
        return
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      })

      // Corrected API endpoint with storeId, as per documentation
      const response = await fetch(`/api/store/${STORE_ID}/orders?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data: OrdersResponse = await response.json()
        setOrders(data.data.orders)
        setPagination(data.data.pagination)
      } else if (response.status === 401) {
        localStorage.removeItem("auth_token")
        localStorage.removeItem("user_data")
        router.push("/login")
        toast.error("Session expired. Please login again.")
      } else if (response.status === 503) {
        setError("Orders service is currently unavailable. Please try again later.")
        toast.error("Service unavailable")
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || "Failed to load orders")
        toast.error("Failed to load orders")
      }
    } catch (error: any) {
      console.error("Error loading orders:", error)
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        setError("Network error. Please check your connection and try again.")
        toast.error("Network error")
      } else {
        setError("Failed to load orders")
        toast.error("Failed to load orders")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    loadOrders()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />
      case "processing":
        return <Package className="h-4 w-4" />
      case "shipped":
        return <Truck className="h-4 w-4" />
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "processing":
        return "bg-purple-100 text-purple-800"
      case "shipped":
        return "bg-indigo-100 text-indigo-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const filteredOrders = orders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((item) => item.product.name.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const ordersByStatus = {
    all: filteredOrders,
    pending: filteredOrders.filter((order) => order.status === "pending"),
    processing: filteredOrders.filter((order) => order.status === "processing"),
    shipped: filteredOrders.filter((order) => order.status === "shipped"),
    delivered: filteredOrders.filter((order) => order.status === "delivered"),
    cancelled: filteredOrders.filter((order) => order.status === "cancelled"),
  }

  const handleViewOrder = (orderId: string) => {
    router.push(`/orders/${orderId}`)
  }

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      const token = localStorage.getItem("auth_token")
      // Corrected API endpoint with storeId, as per documentation
      const response = await fetch(`https://api.yespstudio.com/api/store/${STORE_ID}/orders/${orderId}/invoice`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `invoice-${orderId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        toast.error("Failed to download invoice")
      }
    } catch (error) {
      console.error("Error downloading invoice:", error)
      toast.error("Failed to download invoice")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 h-32"></div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">Track and manage your orders</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders by order number or product name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleSearch} variant="outline" className="bg-transparent">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button onClick={loadOrders} variant="outline" className="bg-transparent">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium">Unable to load orders</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {!error && (
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-white">
              <TabsTrigger value="all" className="flex items-center space-x-2">
                <span>All</span>
                <Badge variant="secondary" className="ml-1">
                  {ordersByStatus.all.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Pending</span>
                <Badge variant="secondary" className="ml-1">
                  {ordersByStatus.pending.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="processing" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Processing</span>
                <Badge variant="secondary" className="ml-1">
                  {ordersByStatus.processing.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="shipped" className="flex items-center space-x-2">
                <Truck className="h-4 w-4" />
                <span>Shipped</span>
                <Badge variant="secondary" className="ml-1">
                  {ordersByStatus.shipped.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="delivered" className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Delivered</span>
                <Badge variant="secondary" className="ml-1">
                  {ordersByStatus.delivered.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="flex items-center space-x-2">
                <XCircle className="h-4 w-4" />
                <span>Cancelled</span>
                <Badge variant="secondary" className="ml-1">
                  {ordersByStatus.cancelled.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {Object.entries(ordersByStatus).map(([status, statusOrders]) => (
              <TabsContent key={status} value={status}>
                {statusOrders.length > 0 ? (
                  <div className="space-y-4">
                    {statusOrders.map((order) => (
                      <Card key={order._id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center space-x-4">
                              <div>
                                <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                                <p className="text-sm text-gray-500">Placed on {formatDate(order.createdAt)}</p>
                              </div>
                              <Badge className={`${getStatusColor(order.status)} flex items-center space-x-1`}>
                                {getStatusIcon(order.status)}
                                <span className="capitalize">{order.status}</span>
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2 mt-4 md:mt-0">
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-transparent"
                                onClick={() => handleViewOrder(order._id)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-transparent"
                                onClick={() => handleDownloadInvoice(order._id)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Invoice
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Order Items */}
                            <div className="space-y-3">
                              {order.items.map((item, index) => (
                                <div key={index} className="flex items-center space-x-4">
                                  <Image
                                    src={item.product.thumbnail || "/placeholder.svg"}
                                    alt={item.product.name}
                                    width={60}
                                    height={60}
                                    className="rounded-lg object-cover"
                                  />
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                                    <p className="text-sm text-gray-500">
                                      Quantity: {item.quantity} × ₹{item.price.toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Order Summary */}
                            <div className="border-t pt-4">
                              <div className="flex justify-between items-center">
                                <div className="text-sm text-gray-600">
                                  <p>Payment: {order.paymentMethod}</p>
                                  <p>
                                    Delivery: {order.shippingAddress.city}, {order.shippingAddress.state}
                                  </p>
                                  {order.trackingNumber && <p>Tracking: {order.trackingNumber}</p>}
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold">Total: ₹{order.total.toLocaleString()}</p>
                                  <p className="text-sm text-gray-500">
                                    Payment: {order.paymentStatus === "paid" ? "Paid" : "Pending"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Order Actions */}
                            {order.status === "delivered" && (
                              <div className="flex space-x-2 pt-2">
                                <Button size="sm" variant="outline" className="bg-transparent">
                                  Rate & Review
                                </Button>
                                <Button size="sm" variant="outline" className="bg-transparent">
                                  Return/Exchange
                                </Button>
                              </div>
                            )}

                            {order.status === "shipped" && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-800">
                                  📦 Your order is on the way!
                                  {order.estimatedDelivery && (
                                    <> Expected delivery: {formatDate(order.estimatedDelivery)}</>
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No {status !== "all" ? status : ""} orders found
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {searchQuery
                        ? `No orders match your search "${searchQuery}"`
                        : status !== "all"
                          ? `You don't have any ${status} orders`
                          : "You haven't placed any orders yet"}
                    </p>
                    {status === "all" && !searchQuery && (
                      <Link href="/products">
                        <Button className="bg-black hover:bg-gray-800">Start Shopping</Button>
                      </Link>
                    )}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="bg-transparent"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="bg-transparent"
            >
              Next
            </Button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
