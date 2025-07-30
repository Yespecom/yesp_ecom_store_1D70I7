import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Users, Award, Heart } from "lucide-react"
import Link from "next/link"

const stats = [
  {
    icon: Users,
    number: "10K+",
    label: "Happy Customers",
  },
  {
    icon: Award,
    number: "5+",
    label: "Years Experience",
  },
  {
    icon: Heart,
    number: "99%",
    label: "Customer Satisfaction",
  },
]

export function AboutSection() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content */}
          <div className="space-y-6">
            <div>
              <Badge className="bg-red-100 text-red-600 hover:bg-red-100 mb-4">About OneofWun</Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Crafting Unique Fashion for Every Individual
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                At OneofWun, we believe everyone deserves to express their unique style. Our carefully curated
                collection features premium quality clothing and accessories that help you stand out from the crowd.
              </p>
              <p className="text-base text-gray-600 leading-relaxed">
                From trendy streetwear to elegant formal wear, we offer diverse styles that cater to every personality
                and occasion. Quality, comfort, and style are at the heart of everything we do.
              </p>
            </div>

            {/* Stats */}
            

            {/* CTA Button */}
          
          </div>

          {/* Image */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
              <img
                src="/images/models-banner.jpg"
                alt="About OneofWun - Fashion Collection"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Floating Card */}
            <div className="absolute -bottom-6 -left-6 bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Heart className="h-6 w-6 text-red-600 fill-current" />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">Premium Quality</div>
                  <div className="text-sm text-gray-600">Handpicked Materials</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
