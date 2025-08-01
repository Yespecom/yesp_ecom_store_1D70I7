import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, AlertTriangle } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-lg text-gray-600 mb-4">Please read these terms carefully before using our services.</p>
          <Badge className="bg-green-100 text-green-800">Last updated: June 30, 2025</Badge>
        </div>

        {/* Important Notice */}
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-orange-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-2">Important Notice</h3>
                <p className="text-orange-800 text-sm">
                  By accessing and using OneofWun's website and services, you agree to be bound by these Terms of
                  Service. If you do not agree to these terms, please do not use our services.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                These Terms of Service ("Terms") govern your use of the OneofWun website, mobile application, and
                related services (collectively, the "Service") operated by OneofWun ("we," "us," or "our").
              </p>
              <p className="text-gray-600">
                By accessing or using our Service, you agree to be bound by these Terms. These Terms apply to all
                visitors, users, and others who access or use the Service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Description of Service</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">OneofWun provides an e-commerce platform that allows users to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Browse and purchase products from our catalog</li>
                <li>Create and manage user accounts</li>
                <li>Track orders and manage returns</li>
                <li>Access customer support services</li>
                <li>Receive promotional communications (with consent)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. User Accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Account Creation</h3>
                <p className="text-gray-600">
                  To access certain features of our Service, you must create an account. You agree to provide accurate,
                  current, and complete information during registration and to update such information to keep it
                  accurate, current, and complete.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Account Security</h3>
                <p className="text-gray-600">
                  You are responsible for safeguarding your account credentials and for all activities that occur under
                  your account. You must notify us immediately of any unauthorized use of your account.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Account Termination</h3>
                <p className="text-gray-600">
                  We reserve the right to suspend or terminate your account at any time for violations of these Terms or
                  for any other reason at our sole discretion.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Orders and Payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Order Acceptance</h3>
                <p className="text-gray-600">
                  All orders are subject to acceptance by us. We reserve the right to refuse or cancel any order for any
                  reason, including but not limited to product availability, errors in pricing or product information,
                  or suspected fraudulent activity.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Pricing</h3>
                <p className="text-gray-600">
                  All prices are listed in Indian Rupees (INR) and are subject to change without notice. We strive to
                  ensure pricing accuracy, but errors may occur. In case of pricing errors, we will contact you before
                  processing your order.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Payment</h3>
                <p className="text-gray-600">
                  Payment must be made at the time of order placement. We accept various payment methods including
                  credit cards, debit cards, UPI, and cash on delivery (where available). All payments are processed
                  securely through our payment partners.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Shipping and Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                We will make reasonable efforts to deliver products within the estimated timeframe. However, delivery
                times are estimates and not guarantees. Delivery may be delayed due to factors beyond our control,
                including but not limited to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4 mb-4">
                <li>Weather conditions</li>
                <li>Natural disasters</li>
                <li>Transportation strikes</li>
                <li>Government restrictions</li>
                <li>Incorrect or incomplete delivery information</li>
              </ul>
              <p className="text-gray-600">
                Risk of loss and title for products pass to you upon delivery to the carrier.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Returns and Refunds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Return Policy</h3>
                <p className="text-gray-600">
                  We accept returns within 10 days of delivery for most products. Items must be in original condition
                  with tags attached and in original packaging. Some items may not be eligible for return due to hygiene
                  or safety reasons.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Refund Process</h3>
                <p className="text-gray-600">
                  Refunds will be processed to the original payment method within 5-10 business days after we receive
                  and inspect the returned item. Shipping charges are non-refundable unless the return is due to our
                  error.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Prohibited Uses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">You may not use our Service:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                <li>
                  To violate any international, federal, provincial, or state regulations, rules, laws, or local
                  ordinances
                </li>
                <li>
                  To infringe upon or violate our intellectual property rights or the intellectual property rights of
                  others
                </li>
                <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                <li>To submit false or misleading information</li>
                <li>To upload or transmit viruses or any other type of malicious code</li>
                <li>To collect or track personal information of others</li>
                <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
                <li>For any obscene or immoral purpose</li>
                <li>To interfere with or circumvent security features of the Service</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                The Service and its original content, features, and functionality are and will remain the exclusive
                property of OneofWun and its licensors. The Service is protected by copyright, trademark, and other
                laws. Our trademarks and trade dress may not be used in connection with any product or service without
                our prior written consent.
              </p>
              <p className="text-gray-600">
                You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly
                perform, republish, download, store, or transmit any of the material on our Service without our prior
                written consent.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Disclaimers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                The information on this Service is provided on an "as is" basis. To the fullest extent permitted by law,
                this Company:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Excludes all representations and warranties relating to this Service and its contents</li>
                <li>
                  Excludes all liability for damages arising out of or in connection with your use of this Service
                </li>
                <li>Does not warrant that the Service will be constantly available or available at all</li>
                <li>
                  Does not warrant that the information on this Service is complete, true, accurate, or non-misleading
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                In no event shall OneofWun, nor its directors, employees, partners, agents, suppliers, or affiliates, be
                liable for any indirect, incidental, special, consequential, or punitive damages, including without
                limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of
                the Service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Governing Law</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                These Terms shall be interpreted and governed by the laws of India. Any disputes arising under these
                Terms shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>12. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a
                revision is material, we will try to provide at least 30 days notice prior to any new terms taking
                effect. What constitutes a material change will be determined at our sole discretion.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  )
}
