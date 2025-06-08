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
      router.push("/auth/login")
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
      toast({
        title: "Error placing order",
        description: "There was an error placing your order. Please try again.",
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
        <div className="relative h-40 sm:h-48 overflow-hidden">
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            width={300}
            height={300}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute top-4 left-4">
            <Badge className="bg-brand-red text-white border-0">{product.category}</Badge>
          </div>

          {/* Quick actions overlay */}
          <div
            className={`absolute inset-0 bg-navy/40 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}
          >
            <div className="flex gap-1 sm:gap-2">
              <Button
                size="sm"
                className="bg-white text-navy hover:bg-white/90 rounded-full text-xs sm:text-sm"
                onClick={handleOrderNow}
                disabled={product.stock === 0 || isLoading || isOrdering}
              >
                <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                {isOrdering ? "Ordering..." : "Order Now"}
              </Button>
              <Link href={`/shop/${product.id}`}>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-transparent text-white border-white hover:bg-white/20 rounded-full"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">{product.name}</h3>
          <p className="text-navy/70 text-sm mb-2 line-clamp-2">{product.description}</p>
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg">TZS {product.price.toLocaleString()}</span>
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm ml-1">{product.rating}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
