import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { CartProvider } from "@/lib/cart-context"
import { WishlistProvider } from "@/lib/wishlist-context"
import { Toaster } from "@/components/ui/sonner"
import { Header } from "@/components/layout/header"
import { ChunkErrorHandler } from "@/components/chunk-error-handler"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "OneofWun - Unique Fashion That Makes You One of One | Premium Streetwear India",
    template: "%s | OneofWun",
  },
  description:
    "Discover unique fashion that makes you one of one. Shop premium streetwear, trendy t-shirts, and lifestyle products in India. Fresh & trendy summer collection now available.",
  keywords: [
    "unique fashion india",
    "premium streetwear",
    "trendy t-shirts",
    "summer collection",
    "fresh and trendy",
    "exclusive designs india",
    "fashion accessories",
    "lifestyle products",
    "one of one fashion",
    "designer clothing india",
    "streetwear brand",
    "fashion boutique india",
    "oversized t-shirts",
    "graphic tees",
    "indian fashion brand",
  ],
  authors: [{ name: "OneofWun" }],
  creator: "OneofWun",
  publisher: "OneofWun",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://oneofwun.in"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png" },
      { url: "/apple-touch-icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://oneofwun.in",
    siteName: "OneofWun",
    title: "OneofWun - Unique Fashion That Makes You One of One | Premium Streetwear India",
    description:
      "Discover unique fashion that makes you one of one. Shop premium streetwear, trendy t-shirts, and summer essentials in India. Fresh & trendy collection available now.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "OneofWun Summer Collection - Premium Streetwear India",
      },
      {
        url: "/og-image-square.jpg",
        width: 1200,
        height: 1200,
        alt: "OneofWun Fashion Brand - Unique Streetwear",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OneofWun - Unique Fashion That Makes You One of One",
    description:
      "Shop premium streetwear and trendy t-shirts in India. Fresh & trendy summer collection now available at OneofWun.",
    images: ["/twitter-image.jpg"],
    creator: "@oneofwun",
    site: "@oneofwun",
  },
  verification: {
    google: "your-google-verification-code",
  },
  category: "fashion",
  classification: "Business",
  other: {
    "theme-color": "#dc2626",
    "color-scheme": "light",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "OneofWun",
    "application-name": "OneofWun",
    "msapplication-TileColor": "#dc2626",
    "msapplication-config": "/browserconfig.xml",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "OneofWun",
              description: "Unique fashion that makes you one of one - Premium streetwear brand in India",
              url: "https://oneofwun.in",
              logo: "https://oneofwun.in/logo.png",
              sameAs: [
                "https://instagram.com/oneofwun",
                "https://twitter.com/oneofwun",
                "https://facebook.com/oneofwun",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer service",
                email: "hello@oneofwun.in",
              },
              address: {
                "@type": "PostalAddress",
                addressCountry: "IN",
              },
              areaServed: "IN",
              currenciesAccepted: "INR",
              paymentAccepted: ["Credit Card", "Debit Card", "UPI", "Net Banking"],
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        <ChunkErrorHandler />
        <CartProvider>
          <WishlistProvider>
            <Header />
            {children}
            <Toaster />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  )
}
