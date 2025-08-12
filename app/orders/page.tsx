"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { History, AlertCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

interface OrderItem {
  product: {
    _id: string
    name: string
    thumbnail: string
    slug?: string
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
  paymentMethod: string
  paymentStatus: string
  createdAt: string
}

interface OrdersResponse {
  success: boolean
  message: string
  orders: Order[]
  pagination: {
    currentPage: number
    totalPages: number
    totalOrders: number
    hasNextPage: boolean
    hasPrevPage: boolean
    limit: number
  }
  filters: {
    sortBy: string
    sortOrder: string
  }
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)

  const STORE_ID = "1D70I7" // Hardcoded store ID

  useEffect(() => {
    checkAuthAndLoadOrders()
  }, [currentPage])

  const checkAuthAndLoadOrders = async () => {
    const token = localStorage.getItem("auth_token")
    if (!token) {
      router.push("/login")
      toast.error("Please log in to view your orders.")
      return
    }
    await loadOrders(token)
  }

  const loadOrders = async (token: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(
        `https://api.yespstudio.com/api/${STORE_ID}/orders?page=${currentPage}&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (response.ok) {
        const data: OrdersResponse = await response.json()
        if (data.success) {
          setOrders(data.orders)
          setPagination(data.pagination)
        } else {
          setError(data.message || "Failed to load orders.")
          toast.error(data.message || "Failed to load orders.")
        }
      } else if (response.status === 401) {
        localStorage.removeItem("auth_token")
        localStorage.removeItem("user_data")
        router.push("/login")
        toast.error("Session expired. Please login again.")
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || "Failed to load orders.")
        toast.error(errorData.error || "Failed to load orders.")
      }
    } catch (err: any) {
      console.error("Error loading orders:", err)
      setError("Network error or failed to connect to server.")
      toast.error("Network error or failed to connect to server.")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "secondary"
      case "processing":
        return "default"
      case "shipped":
        return "outline"
      case "delivered":
        return "default"
      case "cancelled":
        return "destructive"
      default:
        return "secondary"
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
          <History className="h-7 w-7 mr-3 text-gray-700" /> My Orders
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium">Error loading orders</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {!error && orders.length === 0 && (
          <div className="text-center py-12">
            <XCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500 mb-6">It looks like you haven&apos;t placed any orders yet.</p>
            <Link href="/products">
              <Button className="bg-black hover:bg-gray-800">Start Shopping</Button>
            </Link>
          </div>
        )}

        {!error && orders.length > 0 && (
          <>
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order._id} className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-semibold">Order #{order.orderNumber}</CardTitle>
                    <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <p className="font-medium text-gray-800">Order Date</p>
                        <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Total</p>
                        <p>₹{order.total.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Payment Status</p>
                        <p>{order.paymentStatus}</p>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Product</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead className="text-center">Quantity</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map((item) => (
                          <TableRow key={item.product._id}>
                            <TableCell>
                              <Link href={`/products/${item.product.slug}`}>
                                <Image
                                  src={item.product.thumbnail || "/placeholder.svg"}
                                  alt={item.product.name}
                                  width={60}
                                  height={60}
                                  className="rounded-md object-cover"
                                />
                              </Link>
                            </TableCell>
                            <TableCell className="font-medium">
                              <Link href={`/products/${item.product.slug}`} className="hover:underline">
                                {item.product.name}
                              </Link>
                            </TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              ₹{(item.price * item.quantity).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="mt-4 text-right">
                      <Link href={`/order-success?orderId=${order._id}`}>
                        <Button variant="outline" className="bg-transparent">
                          View Order Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (pagination.hasPrevPage) setCurrentPage(currentPage - 1)
                      }}
                      className={!pagination.hasPrevPage ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === i + 1}
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage(i + 1)
                        }}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (pagination.hasNextPage) setCurrentPage(currentPage + 1)
                      }}
                      className={!pagination.hasNextPage ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
