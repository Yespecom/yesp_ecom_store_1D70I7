"use client"

import type React from "react"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Truck,
  AlertCircle,
  FileText,
  CreditCard,
  Shield,
} from "lucide-react"

export default function ReturnsPage() {
  const [returnForm, setReturnForm] = useState({
    orderNumber: "",
    email: "",
    reason: "",
    description: "",
    refundMethod: "original",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setReturnForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success("Return request submitted successfully! We'll send you a confirmation email shortly.")
      setReturnForm({
        orderNumber: "",
        email: "",
        reason: "",
        description: "",
        refundMethod: "original",
      })
    } catch (error) {
      toast.error("Failed to submit return request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <RotateCcw className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Returns & Exchanges</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Not completely satisfied with your purchase? We're here to help with easy returns and exchanges.
          </p>
        </div>

        <Tabs defaultValue="policy" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-white">
            <TabsTrigger value="policy" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Return Policy</span>
            </TabsTrigger>
            <TabsTrigger value="process" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Return Process</span>
            </TabsTrigger>
            <TabsTrigger value="request" className="flex items-center space-x-2">
              <RotateCcw className="h-4 w-4" />
              <span>Start Return</span>
            </TabsTrigger>
          </TabsList>

          {/* Return Policy Tab */}
          <TabsContent value="policy" className="space-y-6">
            {/* Quick Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span>10-Day Return Guarantee</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 mb-1">10 Days</h3>
                    <p className="text-sm text-gray-600">Return window from delivery date</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Truck className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 mb-1">Free Pickup</h3>
                    <p className="text-sm text-gray-600">We'll arrange pickup at no cost</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <CreditCard className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 mb-1">Quick Refunds</h3>
                    <p className="text-sm text-gray-600">Refunds processed within 5-7 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Eligible Items */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span>Returnable Items</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Clothing and accessories</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Electronics (in original packaging)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Home and garden items</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Books and media</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Sports and outdoor equipment</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span>Non-Returnable Items</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <span>Personal care and hygiene products</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <span>Perishable goods</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <span>Custom or personalized items</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <span>Digital downloads</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <span>Gift cards</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Return Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Return Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-blue-600 text-sm font-semibold">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Original Condition</h3>
                      <p className="text-gray-600">
                        Items must be unused, unworn, and in the same condition as received with all original tags and
                        packaging.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-blue-600 text-sm font-semibold">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Time Limit</h3>
                      <p className="text-gray-600">Returns must be initiated within 10 days of the delivery date.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-blue-600 text-sm font-semibold">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Proof of Purchase</h3>
                      <p className="text-gray-600">
                        Original receipt or order confirmation is required for all returns.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Return Process Tab */}
          <TabsContent value="process" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>How Returns Work</CardTitle>
                <p className="text-gray-600">Follow these simple steps to return your item</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold">1</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">Initiate Return Request</h3>
                      <p className="text-gray-600 mb-3">
                        Start your return by filling out our return form with your order details and reason for return.
                      </p>
                      <Badge className="bg-blue-100 text-blue-800">Takes 2 minutes</Badge>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 font-semibold">2</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">Get Return Label</h3>
                      <p className="text-gray-600 mb-3">
                        We'll email you a prepaid return shipping label and pickup instructions within 24 hours.
                      </p>
                      <Badge className="bg-green-100 text-green-800">Free shipping</Badge>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 font-semibold">3</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">Pack & Schedule Pickup</h3>
                      <p className="text-gray-600 mb-3">
                        Pack your item securely in the original packaging and schedule a pickup or drop it off at a
                        courier location.
                      </p>
                      <Badge className="bg-purple-100 text-purple-800">Convenient pickup</Badge>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-600 font-semibold">4</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">Processing & Refund</h3>
                      <p className="text-gray-600 mb-3">
                        Once we receive your item, we'll inspect it and process your refund within 5-7 business days.
                      </p>
                      <Badge className="bg-orange-100 text-orange-800">Quick processing</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Refund Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Refund Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Original Payment Method</h3>
                    <p className="text-gray-600 text-sm mb-2">
                      Refund will be credited back to your original payment method (credit card, UPI, etc.)
                    </p>
                    <p className="text-green-600 text-sm font-medium">Processing time: 5-7 business days</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Store Credit</h3>
                    <p className="text-gray-600 text-sm mb-2">
                      Get instant store credit that can be used for future purchases
                    </p>
                    <p className="text-blue-600 text-sm font-medium">Processing time: Instant</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Start Return Tab */}
          <TabsContent value="request" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Return Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Start Your Return</CardTitle>
                    <p className="text-gray-600">Fill out the form below to initiate your return request</p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-2">
                            Order Number *
                          </label>
                          <Input
                            id="orderNumber"
                            name="orderNumber"
                            type="text"
                            required
                            value={returnForm.orderNumber}
                            onChange={handleInputChange}
                            placeholder="ORD-2024-001"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address *
                          </label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={returnForm.email}
                            onChange={handleInputChange}
                            placeholder="your.email@example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                          Reason for Return *
                        </label>
                        <select
                          id="reason"
                          name="reason"
                          required
                          value={returnForm.reason}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        >
                          <option value="">Select a reason</option>
                          <option value="defective">Defective/Damaged item</option>
                          <option value="wrong-item">Wrong item received</option>
                          <option value="size-fit">Size/Fit issues</option>
                          <option value="not-as-described">Not as described</option>
                          <option value="changed-mind">Changed my mind</option>
                          <option value="quality">Quality concerns</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                          Description *
                        </label>
                        <Textarea
                          id="description"
                          name="description"
                          required
                          rows={4}
                          value={returnForm.description}
                          onChange={handleInputChange}
                          placeholder="Please provide details about the issue or reason for return..."
                          className="resize-none"
                        />
                      </div>

                      <div>
                        <label htmlFor="refundMethod" className="block text-sm font-medium text-gray-700 mb-2">
                          Preferred Refund Method
                        </label>
                        <select
                          id="refundMethod"
                          name="refundMethod"
                          value={returnForm.refundMethod}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        >
                          <option value="original">Original payment method</option>
                          <option value="store-credit">Store credit</option>
                        </select>
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Submit Return Request
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Help Section */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Need Help?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Can't find your order?</p>
                        <p className="text-gray-600 text-xs">
                          Check your email for the order confirmation or contact support.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Multiple items to return?</p>
                        <p className="text-gray-600 text-xs">
                          Submit separate requests for each item you want to return.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Questions about eligibility?</p>
                        <p className="text-gray-600 text-xs">Review our return policy or contact our support team.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-900 mb-2">Still have questions?</h3>
                      <p className="text-gray-600 text-sm mb-4">Our support team is here to help</p>
                      <Button variant="outline" className="w-full bg-transparent">
                        Contact Support
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  )
}
