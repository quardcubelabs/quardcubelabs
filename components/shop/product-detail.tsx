"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Star, Minus, Plus, Package, ArrowLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useOrders } from "@/contexts/order-context"
import type { Product } from "@/lib/product-actions"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import ProductCard from "@/components/shop/product-card"

type ProductDetailProps = {
  product: Product
  relatedProducts: Product[]
}

export default function ProductDetail({ product, relatedProducts }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const [isOrdering, setIsOrdering] = useState(false)
  const { addOrder } = useOrders()
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

    if (quantity > product.stock) {
      toast({
        title: "Insufficient stock",
        description: `Only ${product.stock} items available in stock.`,
        variant: "destructive",
      })
      return
    }

    setIsOrdering(true)
    try {
      const orderItems = [{
        id: String(product.id),
        name: product.name,
        quantity: quantity,
        price: Number(product.price),
        image: product.image
      }]
      
      const total = Number(product.price) * quantity
      
      await addOrder(orderItems, total)
      
      toast({
        title: "Order placed successfully!",
        description: `Added ${quantity} ${product.name}(s) to your orders.`,
      })

      router.push("/orders")
    } catch (error) {
      console.error("Error placing order:", error)
      
      let errorMessage = "There was an error placing your order. Please try again."
      
      if (error instanceof Error) {
        if (error.message.includes('SASL_SIGNATURE_MISMATCH')) {
          errorMessage = "Database connection issue. Please check your internet connection and try again."
        } else if (error.message.includes('authentication')) {
          errorMessage = "Authentication error. Please log out and log back in."
        } else if (error.message.includes('network')) {
          errorMessage = "Network error. Please check your connection."
        } else if (error.message.includes('Failed to create order')) {
          errorMessage = "Unable to process your order right now. Please try again later."
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

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  return (
    <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
      <div className="container mx-auto px-4">
        {/* Breadcrumb Navigation - Mobile Optimized */}
        <nav className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-navy/70 overflow-x-auto">
            <Link href="/" className="hover:text-navy transition-colors whitespace-nowrap">
              Home
            </Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-navy transition-colors whitespace-nowrap">
              Shop
            </Link>
            <span>/</span>
            <Link href={`/shop?category=${product.category}`} className="hover:text-navy transition-colors whitespace-nowrap">
              {product.category}
            </Link>
            <span>/</span>
            <span className="text-navy font-medium truncate">{product.name}</span>
          </div>
        </nav>

        <Link href="/shop" className="inline-flex items-center text-navy hover:text-brand-red transition-colors mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shop
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div className="sticky top-32">
              <div className="rounded-2xl border-2 border-navy/20 bg-white/50 overflow-hidden">
                <Image
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <Badge className="bg-brand-red text-white border-0 mb-4">{product.category}</Badge>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">{product.name}</h1>

            <div className="flex items-center mb-6">
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < Math.floor(product.rating) ? "fill-current" : "fill-none"}`}
                  />
                ))}
              </div>
              <span className="text-navy/70 ml-2">{product.rating.toFixed(1)} rating</span>
            </div>

            <p className="text-2xl sm:text-3xl font-bold text-navy mb-6">
              TZS {Number(product.price).toLocaleString()}
              {quantity > 1 && (
                <span className="text-lg sm:text-xl ml-2 text-navy/70">
                  (Total: TZS {(Number(product.price) * quantity).toLocaleString()})
                </span>
              )}
            </p>

            <p className="text-navy/80 mb-8">{product.description}</p>

            <div className="mb-8">
              <h3 className="font-semibold mb-2">Features:</h3>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-brand-red flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-8">
              <div className="flex items-center">
                <span
                  className={`${product.stock > 10 ? "text-green-600" : product.stock > 0 ? "text-amber-500" : "text-red-500"} font-medium`}
                >
                  {product.stock > 10 ? "In Stock" : product.stock > 0 ? `Only ${product.stock} left` : "Out of Stock"}
                </span>
              </div>
            </div>

            <div className="flex flex-col space-y-4 mb-6 sm:mb-8">
              {/* Quantity and Price Section */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-navy">Quantity:</span>
                <div className="flex items-center border-2 border-navy/20 rounded-full overflow-hidden">
                  <button
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="p-2 text-navy hover:bg-navy/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 font-medium min-w-[3rem] text-center">{quantity}</span>
                  <button
                    onClick={incrementQuantity}
                    disabled={quantity >= product.stock}
                    className="p-2 text-navy hover:bg-navy/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Total Price Display */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-navy">Total:</span>
                <span className="text-xl sm:text-2xl font-bold text-navy">
                  TZS {(product.price * quantity).toLocaleString()}
                </span>
              </div>

              {/* Order Button - Full Width on Mobile */}
              <Button
                className="bg-navy hover:bg-navy/90 text-white rounded-full py-3 sm:py-4 text-lg font-medium w-full"
                onClick={handleOrderNow}
                disabled={product.stock === 0 || isLoading || isOrdering}
              >
                <Package className="h-5 w-5 mr-2" />
                {isOrdering ? "Processing..." : `Order Now - TZS ${(product.price * quantity).toLocaleString()}`}
              </Button>
            </div>

            <Tabs defaultValue="description" className="w-full">
              <TabsList className="bg-white/50 border-2 border-navy/20 rounded-full w-full grid grid-cols-3">
                <TabsTrigger value="description" className="rounded-full text-xs sm:text-sm">
                  Description
                </TabsTrigger>
                <TabsTrigger value="specifications" className="rounded-full text-xs sm:text-sm">
                  Specs
                </TabsTrigger>
                <TabsTrigger value="shipping" className="rounded-full text-xs sm:text-sm">
                  Shipping
                </TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="mt-4">
                <div className="p-4 sm:p-6 bg-white/50 rounded-2xl border-2 border-navy/20">
                  <p className="text-navy/80 text-sm sm:text-base">{product.description}</p>
                </div>
              </TabsContent>
              <TabsContent value="specifications" className="mt-4">
                <div className="p-4 sm:p-6 bg-white/50 rounded-2xl border-2 border-navy/20">
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 sm:h-5 sm:w-5 text-brand-red flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>
              <TabsContent value="shipping" className="mt-4">
                <div className="p-6 bg-white/50 rounded-2xl border-2 border-navy/20">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Shipping Options:</h4>
                      <ul className="space-y-2 text-navy/80">
                        <li>• Standard delivery: 3-5 business days - TZS 5,000</li>
                        <li>• Express delivery: 1-2 business days - TZS 10,000</li>
                        <li>• Same day delivery (Dar es Salaam only): TZS 15,000</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Free Shipping:</h4>
                      <p className="text-navy/80">
                        Free standard shipping on orders over TZS 100,000 within Tanzania mainland.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Coverage:</h4>
                      <p className="text-navy/80">
                        We deliver to all major cities in Tanzania including Dar es Salaam, Dodoma, Arusha, Mwanza, and Mbeya.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-16 sm:mt-24">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {relatedProducts.map((relatedProduct) => (
                <motion.div
                  key={relatedProduct.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: relatedProduct.id * 0.05 }}
                >
                  <ProductCard product={relatedProduct} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
