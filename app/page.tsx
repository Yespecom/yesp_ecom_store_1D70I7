"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { HeroSection } from "@/components/home/hero-section"
import { OfferBanner } from "@/components/layout/offer-banner"
import { FeaturesSection } from "@/components/home/features-section"
import { FeaturedProducts } from "@/components/home/featured-products"
import { Footer } from "@/components/layout/footer"
import {AboutSection} from "@/components/home/about-section"

export default function HomePage() {
  const searchParams = useSearchParams()
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    if (searchParams.get("welcome") === "true") {
      setShowWelcome(true)
      // Auto-hide after 5 seconds
      setTimeout(() => setShowWelcome(false), 5000)
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gray-50">
{/*       <Header /> */}

      {/* Welcome Banner */}
      {showWelcome && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Welcome to oneofwun! Your account has been created successfully.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowWelcome(false)}
              className="text-green-600 hover:text-green-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      <main>
        <HeroSection />
        <FeaturedProducts />
        <FeaturesSection />
        <AboutSection />

        <OfferBanner />
      </main>
      <Footer />
    </div>
  )
}
