"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface HeroSlide {
  id: number
  title: string
  subtitle: string
  description: string
  primaryButton: string
  badge?: string
  backgroundImage: string
}

const heroSlides: HeroSlide[] = [
  {
    id: 1,
    title: "Summer Collection",
    subtitle: "Fresh & Trendy",
    description: "Light, breezy and perfect for the season. Explore our summer essentials.",
    primaryButton: "Shop Now",
    badge: "NEW",
    backgroundImage: "/images/models-banner.jpg",
  },
  {
    id: 2,
    title: "Premium Fashion",
    subtitle: "oneofwun",
    description: "Discover unique styles that make you stand out from the crowd.",
    primaryButton: "Explore Collection",
    backgroundImage: "/images/models-banner.jpg",
  },
]

export function HeroSection() {
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
  }

  const handleButtonClick = () => {
    router.push("/products")
  }

  const slide = heroSlides[currentSlide]

  return (
    <div className="relative h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] bg-gray-100 overflow-hidden rounded-lg mx-2 sm:mx-4 md:mx-8 mt-2 sm:mt-4">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-gray-400 transition-all duration-1000"
        style={{
          backgroundImage: `url(${slide.backgroundImage})`,
          filter: "brightness(0.6)",
        }}
      />

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full text-center text-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          {slide.badge && (
            <Badge className="mb-3 sm:mb-4 bg-red-600 hover:bg-red-700 text-white border-0 text-xs sm:text-sm px-3 py-1">
              {slide.badge}
            </Badge>
          )}

          <div className="mb-3 sm:mb-4">
            <span className="inline-block bg-red-600 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
              {slide.subtitle}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
            {slide.title}
          </h1>

          <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 text-gray-100 max-w-2xl mx-auto leading-relaxed px-2">
            {slide.description}
          </p>

          {/* Single Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleButtonClick}
              className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 md:px-8 h-9 sm:h-11 md:h-12 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg"
            >
              {slide.primaryButton}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows - Hidden on mobile */}
      <button
        onClick={prevSlide}
        className="hidden sm:block absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2 sm:p-3 transition-all duration-200 backdrop-blur-sm"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
      </button>

      <button
        onClick={nextSlide}
        className="hidden sm:block absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2 sm:p-3 transition-all duration-200 backdrop-blur-sm"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-3">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
              index === currentSlide ? "bg-red-600 scale-110" : "bg-white/60 hover:bg-white/80"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Mobile swipe indicators */}
      <div className="sm:hidden absolute bottom-2 left-1/2 transform -translate-x-1/2">
        <p className="text-white/70 text-xs">Swipe or tap dots to navigate</p>
      </div>
    </div>
  )
}
