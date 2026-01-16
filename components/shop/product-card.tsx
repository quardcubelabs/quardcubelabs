"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, Package, Eye, Plus, Minus, ShoppingCart, FileText, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useOrders } from "@/contexts/order-context"
import { useCart } from "@/contexts/cart-context"
import type { Product } from "@/lib/product-actions"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"

type ProductCardProps = {
  product: Product
  isBulkMode?: boolean
  bulkQuantity?: number
  onBulkQuantityChange?: (productId: number, quantity: number) => void
}

export default function ProductCard({ product, isBulkMode = false, bulkQuantity = 0, onBulkQuantityChange }: ProductCardProps) {
  const { addOrder } = useOrders()
  const { addToCart, openCart } = useCart()
  const [isHovered, setIsHovered] = useState(false)
  const [isOrdering, setIsOrdering] = useState(false)
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { toast } = useToast()
  
  // Determine if product is physical or service
  const isPhysical = product.type === 'physical'
  const isService = product.type === 'service'

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
      
      // Get customer info from user metadata
      const customerInfo = {
        name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Customer',
        email: user?.email || '',
        address: user?.user_metadata?.address || 'Address not provided',
        phone: user?.user_metadata?.phone || ''
      }
      
      await addOrder(orderItems, total, customerInfo)
      
      toast({
        title: "Order placed successfully!",
        description: "Thank you for your order. Check your email for invoice details and track your order in the Orders section.",
        duration: 5000,
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

  // Add to cart function
  const handleAddToCart = () => {
    if (product.stock === 0) {
      toast({
        title: "Out of stock",
        description: "This product is currently out of stock.",
        variant: "destructive",
      })
      return
    }

    addToCart(product)
    toast({
      title: "Added to cart!",
      description: `${product.name} has been added to your cart.`,
      duration: 3000,
    })
    openCart()
  }

  // Buy now function (direct to checkout)
  const handleBuyNow = () => {
    if (!isLoading && !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to purchase this product.",
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

    // Add to cart and go to checkout
    addToCart(product)
    router.push("/checkout")
  }

  // Get quote function for services
  const handleGetQuote = () => {
    // Generate quotation PDF or redirect to quote form
    const quotationData = {
      productId: product.id,
      productName: product.name,
      productDescription: product.description,
      basePrice: product.price,
      features: product.features
    }
    
    // Store quotation data in localStorage for the quote page
    localStorage.setItem('quotation-request', JSON.stringify(quotationData))
    
    // Redirect to quotation page
    router.push(`/quote/${product.id}`)
  }

  // Bulk order handlers
  const handleBulkQuantityChange = (delta: number) => {
    if (!onBulkQuantityChange) return
    const newQuantity = Math.max(0, Math.min(product.stock, (bulkQuantity || 0) + delta))
    onBulkQuantityChange(product.id, newQuantity)
  }

  const handleBulkQuantityInput = (value: string) => {
    if (!onBulkQuantityChange) return
    const quantity = parseInt(value) || 0
    const clampedQuantity = Math.max(0, Math.min(product.stock, quantity))
    onBulkQuantityChange(product.id, clampedQuantity)
  }

  return (
    <div
      className="group relative h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-full rounded-2xl border-2 border-navy/20 bg-navy/10 overflow-hidden transition-all duration-300 hover:border-navy hover:shadow-lg">
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
            <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="text-white text-center">
                <Eye className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2" />
                <span className="text-xs sm:text-sm font-medium hidden sm:block"></span>
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
          {isBulkMode && isPhysical ? (
            // Bulk Mode: Quantity selector (only for physical products)
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-navy">Quantity:</span>
                <span className="text-xs text-navy/70">Stock: {product.stock}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-navy/20 text-navy hover:bg-navy hover:text-white"
                  onClick={() => handleBulkQuantityChange(-1)}
                  disabled={bulkQuantity <= 0}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="number"
                  min="0"
                  max={product.stock}
                  value={bulkQuantity}
                  onChange={(e) => handleBulkQuantityInput(e.target.value)}
                  className="text-center h-8 w-16 border-navy/20 focus:border-navy"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-navy/20 text-navy hover:bg-navy hover:text-white"
                  onClick={() => handleBulkQuantityChange(1)}
                  disabled={bulkQuantity >= product.stock}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {bulkQuantity > 0 && (
                <div className="text-center">
                  <Badge variant="outline" className="text-navy border-navy/20">
                    Subtotal: TZS {(Number(product.price) * bulkQuantity).toLocaleString()}
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            // Normal Mode: Different buttons based on product type
            <>
              {isService ? (
                // Service products: Only "Get Quote" button
                <Button
                  className="w-full bg-navy hover:bg-brand-red text-white rounded-full text-xs sm:text-sm py-2"
                  onClick={handleGetQuote}
                >
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Get Quote
                </Button>
              ) : (
                // Physical products: "Add to Cart" and "Buy" buttons
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-navy text-navy hover:bg-navy hover:text-white rounded-full text-xs sm:text-sm py-1 sm:py-2"
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                  >
                    <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="ml-1 sm:ml-2">Add to Cart</span>
                  </Button>
                  <Button
                    className="flex-1 bg-navy hover:bg-brand-red text-white rounded-full text-xs sm:text-sm py-1 sm:py-2"
                    onClick={handleBuyNow}
                    disabled={product.stock === 0 || isLoading}
                  >
                    <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="ml-1 sm:ml-2">Buy</span>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
