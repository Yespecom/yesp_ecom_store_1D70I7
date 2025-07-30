import { Truck, RotateCcw, Shield, Star } from "lucide-react"

const features = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On orders above ₹999",
    color: "text-red-600",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "30-day hassle-free returns",
    color: "text-red-600",
  },
  {
    icon: Shield,
    title: "Secure Payment",
    description: "100% secure checkout",
    color: "text-red-600",
  },
  {
    icon: Star,
    title: "Premium Quality",
    description: "Handpicked materials",
    color: "text-red-600",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="text-center group">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-white rounded-full shadow-sm group-hover:shadow-md transition-shadow duration-200">
                    <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${feature.color}`} />
                  </div>
                </div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 leading-tight">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 leading-relaxed px-1 sm:px-0">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
