"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function OfferBanner() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <section className="relative h-[160px] sm:h-[180px] md:h-[200px] bg-gray-400 overflow-hidden rounded-lg mx-4 md:mx-8 mt-4 mb-8">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url("/images/models-banner.jpg")`,
          filter: "brightness(0.7)",
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full text-center text-white px-4">
        <div className="max-w-3xl">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4">Grand Opening Sale!</h2>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3 mb-6">
            <span className="text-sm sm:text-base">Get</span>
          
            <span className="text-sm sm:text-base"> FREE Shipping above ₹999</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
         

            <Button
              onClick={() => router.push("/products")}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
            >
              Shop Now
            </Button>
          </div>
        </div>
      </div>

      {/* Corner Badges */}

    </section>
  )
}
