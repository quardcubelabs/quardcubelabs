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
import ProductCard from "@/components/shop/product-card"

type ProductDetailProps = {
  product: Product
  relatedProducts: Product[]
}

export default function ProductDetail({ product, relatedProducts }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const { addOrder } = useOrders()
  const router = useRouter()
  const { user, isLoading } = useAuth()

  const handleOrderNow = async () => {
    if (!isLoading && !user) {
      router.push("/auth/login")
      return
    }
    // Directly create the order here if needed, or show a message
    // ...
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

            <p className="text-xl font-bold text-navy mb-6">${Number(product.price).toFixed(2)}</p>

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

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 sm:mb-8">
              <div className="flex items-center border-2 border-navy/20 rounded-full overflow-hidden">
                <button
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  className="p-2 text-navy hover:bg-navy/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 font-medium">{quantity}</span>
                <button
                  onClick={incrementQuantity}
                  disabled={quantity >= product.stock}
                  className="p-2 text-navy hover:bg-navy/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button
                className="bg-navy hover:bg-navy/90 text-white rounded-full px-6 sm:px-8 w-full sm:w-auto"
                onClick={handleOrderNow}
                disabled={product.stock === 0 || isLoading}
              >
                <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Order Now
              </Button>
            </div>

            <Tabs defaultValue="description" className="w-full">
              <TabsList className="bg-white/50 border-2 border-navy/20 rounded-full">
                <TabsTrigger value="description" className="rounded-full">
                  Description
                </TabsTrigger>
                <TabsTrigger value="specifications" className="rounded-full">
                  Specifications
                </TabsTrigger>
                <TabsTrigger value="shipping" className="rounded-full">
                  Shipping
                </TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="mt-4">
                <div className="p-6 bg-white/50 rounded-2xl border-2 border-navy/20">
                  <p className="text-navy/80">{product.description}</p>
                </div>
              </TabsContent>
              <TabsContent value="specifications" className="mt-4">
                <div className="p-6 bg-white/50 rounded-2xl border-2 border-navy/20">
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-brand-red flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>
              <TabsContent value="shipping" className="mt-4">
                <div className="p-6 bg-white/50 rounded-2xl border-2 border-navy/20">
                  <p className="text-navy/80">
                    Standard shipping: 3-5 business days
                    <br />
                    Express shipping: 1-2 business days
                    <br />
                    <br />
                    Free shipping on orders over $100.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-24">
            <h2 className="text-2xl font-bold mb-8">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
