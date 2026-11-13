"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, Package, Eye, Plus, Minus, ShoppingCart, FileText, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useOrders } from "@/contexts/order-context"
import { useCart } from "@/contexts/cart-context"
import type { Product } from "@/lib/product-actions"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import CustomerInfoModal from "./customer-info-modal"
import { useRemoveBg } from "@/hooks/use-remove-bg"
import { cn } from "@/lib/utils"

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
  const [showCustomerInfoModal, setShowCustomerInfoModal] = useState(false)
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { toast } = useToast()
  const { displayUrl: bgRemovedImage, isProcessing: isBgProcessing } = useRemoveBg(product.image)

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

    // Show customer info modal before placing order
    setShowCustomerInfoModal(true)
  }

  const handleCustomerInfoSubmit = async (customerInfo: { name: string; email: string; phone: string; address: string }) => {
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
      className="group relative h-full flex flex-col justify-between"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-full rounded-2xl border-2 border-navy/20 bg-white/70 backdrop-blur-xs overflow-hidden transition-all duration-300 hover:border-navy hover:shadow-xl flex flex-col justify-between">
        {/* Clickable Image & Details Area */}
        <div className="flex flex-col">
          <Link href={`/shop/${product.id}`} className="block relative">
            <div className="relative aspect-[1/0.92] sm:aspect-[1.25/1] w-full overflow-hidden cursor-pointer bg-slate-50 dark:bg-slate-800/40 p-1.5 sm:p-2 flex items-center justify-center">
              {isBgProcessing && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/50 backdrop-blur-xs">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-navy border-t-transparent" />
                </div>
              )}
              {bgRemovedImage ? (
                <Image
                  src={bgRemovedImage}
                  alt={product.name}
                  width={300}
                  height={300}
                  className="w-full h-full object-contain p-0.5 transition-transform duration-500 group-hover:scale-105"
                  unoptimized={bgRemovedImage.startsWith('data:')}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-navy/40">
                  <Package className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>
              )}

              {/* Out of Stock badge only if sold out (stock count is private for admin) */}
              {product.stock === 0 && (
                <div className="absolute top-2 right-2">
                  <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-xs backdrop-blur-xs border bg-red-50 text-brand-red border-brand-red/30">
                    Sold Out
                  </span>
                </div>
              )}

              {/* View Details overlay on hover */}
              <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                <div className="text-white text-center flex items-center gap-1.5 bg-navy/85 px-3 py-1.5 rounded-full border border-white/20 shadow-md">
                  <Eye className="h-4 w-4" />
                  <span className="text-xs font-bold">View</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Product Details with uniform standardized height */}
          <div className="px-2.5 sm:px-3.5 pt-2 sm:pt-2.5 pb-0">
            <Link href={`/shop/${product.id}`} className="block hover:text-navy/80 transition-colors">
              <h3
                className="font-bold text-xs sm:text-base text-navy line-clamp-2 leading-snug h-[2.1rem] sm:h-[2.6rem] overflow-hidden"
                title={product.name}
              >
                {product.name}
              </h3>
            </Link>

            {/* Price and Rating Row (Clean, responsive layout with reduced bottom gap) */}
            <div className="flex items-end justify-between gap-1 mt-0.5 mb-1 sm:mb-1.5">
              <div className="min-w-0 flex-1">
                <span className="text-[9px] sm:text-[10px] text-navy/60 font-semibold block uppercase tracking-wider">
                  Price
                </span>
                <span className="font-black text-xs sm:text-base text-navy truncate block">
                  TZS {Number(product.price).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60">
                <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500 fill-amber-500" />
                <span className="text-[10px] sm:text-xs font-bold text-amber-900">{product.rating || 5}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Pin to bottom of card with tighter spacing */}
        <div className="px-2.5 sm:px-3.5 pt-1 pb-2.5 sm:pb-3">
          {isBulkMode && isPhysical ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 border-navy/20 text-navy hover:bg-navy hover:text-white shrink-0"
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
                  className="text-center h-7 sm:h-8 flex-1 min-w-0 text-xs border-navy/20 focus:border-navy p-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 border-navy/20 text-navy hover:bg-navy hover:text-white shrink-0"
                  onClick={() => handleBulkQuantityChange(1)}
                  disabled={bulkQuantity >= product.stock}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {bulkQuantity > 0 && (
                <div className="text-center">
                  <span className="text-[10px] font-bold text-navy truncate block">
                    TZS {(Number(product.price) * bulkQuantity).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <>
              {isService ? (
                <Button
                  className="w-full bg-navy hover:bg-brand-red text-white rounded-xl text-xs sm:text-sm h-8 sm:h-9 font-bold"
                  onClick={handleGetQuote}
                >
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  <span>Get Quote</span>
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  <Button
                    variant="outline"
                    className="border-2 border-navy text-navy hover:bg-navy hover:text-white rounded-xl text-[11px] sm:text-xs h-8 sm:h-9 font-bold px-1 sm:px-3 flex items-center justify-center gap-1 min-w-0"
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    title="Add to Cart"
                  >
                    <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                    <span className="truncate">Cart</span>
                  </Button>
                  <Button
                    className="bg-navy hover:bg-brand-red text-white rounded-xl text-[11px] sm:text-xs h-8 sm:h-9 font-bold px-1 sm:px-3 flex items-center justify-center gap-1 min-w-0"
                    onClick={handleBuyNow}
                    disabled={product.stock === 0 || isLoading}
                    title="Buy Now"
                  >
                    <CreditCard className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                    <span className="truncate">Buy</span>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <CustomerInfoModal
        isOpen={showCustomerInfoModal}
        onClose={() => setShowCustomerInfoModal(false)}
        onSubmit={handleCustomerInfoSubmit}
      />
    </div>
  )
}
