"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, Package, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useOrders } from "@/contexts/order-context"
import type { Product } from "@/lib/product-actions"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"

type ProductCardProps = {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addOrder } = useOrders()
  const [isHovered, setIsHovered] = useState(false)
  const [isOrdering, setIsOrdering] = useState(false)
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { toast } = useToast()

  const handleOrderNow = async () => {
    if (!isLoading && !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to place an order.",
        variant: "destructive",
      })
      router.push("/auth/login")
      return
    }

    if (product.stock === 0) {
      toast({
        title: "Out of stock",
        description: "This product is currently out of stock.",
        variant: "destructive",
      })
      return
    }

    setIsOrdering(true)
    try {
      const orderItems = [{
        id: String(product.id),
        name: product.name,
        quantity: 1,
        price: Number(product.price),
        image: product.image
      }]
      
      const total = Number(product.price)
      
      await addOrder(orderItems, total)
      
      toast({
        title: "Order placed successfully!",
        description: "Thank you for your order. We'll process it shortly.",
      })

      router.push("/orders")
    } catch (error) {
      console.error("Error placing order:", error)
      
      let errorMessage = "There was an error placing your order. Please try again."
      
      if (error instanceof Error) {
        if (error.message.includes('SASL_SIGNATURE_MISMATCH')) {
          errorMessage = "Database connection issue. Please try again later."
        } else if (error.message.includes('authentication')) {
          errorMessage = "Authentication error. Please log out and log back in."
        } else if (error.message.includes('network')) {
          errorMessage = "Network error. Please check your connection."
        }
      }
      
      toast({
        title: "Error placing order",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsOrdering(false)
    }
  }

  return (
    <div
      className="group relative h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-full rounded-2xl border-2 border-navy/20 bg-white/50 overflow-hidden transition-all duration-300 hover:border-navy hover:shadow-lg">
        {/* Clickable image and title area */}
        <Link href={`/shop/${product.id}`} className="block">
          <div className="relative h-40 sm:h-48 overflow-hidden cursor-pointer">
            <Image
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              width={300}
              height={300}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute top-4 left-4 hidden sm:block">
              <Badge className="bg-brand-red text-white border-0">{product.category}</Badge>
            </div>
            {/* View Details overlay on hover - Mobile optimized */}
            <div className="absolute inset-0 bg-navy/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="text-white text-center">
                <Eye className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2" />
                <span className="text-xs sm:text-sm font-medium hidden sm:block">View Details</span>
                <span className="text-xs font-medium sm:hidden">View</span>
              </div>
            </div>
          </div>
        </Link>

        <div className="p-2 sm:p-4">
          <Link href={`/shop/${product.id}`} className="block hover:text-navy/80 transition-colors">
            <h3 className="font-semibold text-base sm:text-lg mb-1 line-clamp-1 cursor-pointer">
              {product.name.length > 20 ? `${product.name.substring(0, 20)}...` : product.name}
            </h3>
          </Link>
          <p className="text-navy/70 text-xs sm:text-sm mb-2 line-clamp-2 hidden sm:block">{product.description}</p>
          <div className="flex items-center justify-start gap-x-2 mb-2 sm:mb-3 flex-nowrap">
            <span className="font-bold text-sm sm:text-lg whitespace-nowrap flex-shrink-0">TZS {product.price.toLocaleString()}</span>
            <div className="flex items-center flex-shrink-0">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-yellow-400" />
              <span className="text-xs sm:text-sm ml-1">{product.rating}</span>
            </div>
          </div>
          
          {/* Action buttons - Mobile Optimized */}
          <div className="flex gap-2">
            <Link href={`/shop/${product.id}`} className="flex-1">
              <Button
                variant="outline"
                className="w-full border-navy text-navy hover:bg-navy hover:text-white rounded-full text-xs sm:text-sm py-1 sm:py-2"
              >
                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline ml-1 sm:ml-2">View Details</span>
              </Button>
            </Link>
            <Button
              className="flex-1 bg-navy hover:bg-navy/90 text-white rounded-full text-xs sm:text-sm py-1 sm:py-2"
              onClick={handleOrderNow}
              disabled={product.stock === 0 || isLoading || isOrdering}
            >
              <Package className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="ml-1 sm:ml-2">
                {isOrdering ? "Ordering..." : "Order"}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
