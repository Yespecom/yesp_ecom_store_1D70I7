import Link from "next/link"
import Image from "next/image"
import { Facebook, Twitter, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-200 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-12 h-8">
              <Image src="/images/oneofwun-logo.png" alt="oneofwun" fill className="object-contain" />
            </div>
            <span className="text-xl font-bold text-gray-900">oneofwun</span>
          </Link>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <Link href="/about" className="hover:text-black transition-colors">
              About
            </Link>
            <Link href="/contact" className="hover:text-black transition-colors">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-black transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-black transition-colors">
              Terms
            </Link>
            <Link href="/returns" className="hover:text-black transition-colors">
              Returns
            </Link>
          </div>

          {/* Social Media */}
          <div className="flex gap-3">
            <Button size="icon" variant="ghost" className="text-gray-400 hover:text-black hover:bg-gray-50">
              <Instagram className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="text-gray-400 hover:text-black hover:bg-gray-50">
              <Facebook className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="text-gray-400 hover:text-black hover:bg-gray-50">
              <Twitter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Newsletter */}
        <div className="text-center mb-6">
          <p className="text-gray-600 mb-3 text-sm">Stay updated with our latest collections</p>
          <div className="flex max-w-md mx-auto gap-2">
            <Input
              placeholder="Enter your email"
              className="flex-1 border-gray-300 focus:border-black focus:ring-black"
            />
            <Button className="bg-black hover:bg-gray-800 px-6">Subscribe</Button>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-6">
          <p>© 2025 oneofwun. All rights reserved</p>
        </div>
      </div>
    </footer>
  )
}
