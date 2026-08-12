"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Star, Minus, Plus, ArrowLeft, Check, Maximize2, ShoppingCart, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCart } from "@/contexts/cart-context"
import type { Product } from "@/lib/product-actions"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import ProductCard from "@/components/shop/product-card"
import { useRemoveBgMultiple } from "@/hooks/use-remove-bg"

type ProductDetailProps = {
  product: Product
  relatedProducts: Product[]
}

export default function ProductDetail({ product, relatedProducts }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const { addToCart, openCart } = useCart()
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { toast } = useToast()

  // Generate image swatches - use swatchImages if available, fallback to main image
  // If swatchImages exist, only include the main image if it's not already in the swatch set
  const productImages = (() => {
    const mainImg = product.image || "/placeholder.svg"
    if (product.swatchImages && product.swatchImages.length > 0) {
      const swatches = product.swatchImages.filter(Boolean)
      const mainAlreadyInSwatches = swatches.some(s => s === mainImg)
      if (mainAlreadyInSwatches) {
        return swatches
      }
      return [mainImg, ...swatches]
    }
    return [mainImg]
  })()

  // Remove backgrounds from all product images
  const { getUrl: getBgRemovedUrl, isProcessing: isBgProcessing } = useRemoveBgMultiple(productImages)

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

    if (quantity > product.stock) {
      toast({
        title: "Insufficient stock",
        description: `Only ${product.stock} items available in stock.`,
        variant: "destructive",
      })
      return
    }

    for (let i = 0; i < quantity; i++) {
      addToCart(product)
    }

    toast({
      title: "Added to cart!",
      description: `${quantity}x ${product.name} added to your cart.`,
    })

    router.push("/checkout")
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
              {/* Image Gallery with Swatches */}
              <div className="flex gap-4">
                {/* Thumbnail Swatches - Left Side */}
                <div className="flex flex-col gap-3">
                  {productImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 overflow-hidden transition-all duration-200 ${
                        selectedImageIndex === index 
                          ? "border-navy ring-2 ring-navy/30" 
                          : "border-navy/20 hover:border-navy/50"
                      }`}
                      style={{ backgroundColor: 'transparent' }}
                    >
                      <Image
                        src={getBgRemovedUrl(img)}
                        alt={`${product.name} view ${index + 1}`}
                        fill
                        className="object-contain"
                        style={{ backgroundColor: 'transparent' }}
                        unoptimized={getBgRemovedUrl(img).startsWith('data:')}
                      />
                    </button>
                  ))}
                </div>

                {/* Main Image */}
                <div className="flex-1 relative rounded-2xl border-2 border-navy/20 overflow-hidden group" style={{ backgroundColor: 'transparent' }}>
                  {isBgProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/50">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-navy border-t-transparent" />
                    </div>
                  )}
                  <Image
                    src={getBgRemovedUrl(productImages[selectedImageIndex])}
                    alt={product.name}
                    width={600}
                    height={600}
                    className="w-full h-auto object-contain"
                    style={{ backgroundColor: 'transparent' }}
                    unoptimized={getBgRemovedUrl(productImages[selectedImageIndex]).startsWith('data:')}
                  />
                  {/* Fullscreen Button */}
                  <button
                    onClick={() => setIsZoomed(true)}
                    className="absolute top-4 right-4 p-2 bg-white/80 rounded-lg border border-navy/20 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  >
                    <Maximize2 className="h-5 w-5 text-navy" />
                  </button>
                </div>
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

              {/* Cart & Order Buttons - Side by Side */}
              <div className="flex flex-row justify-between">
                <Button
                  variant="outline"
                  className="border-navy text-navy hover:bg-navy hover:text-white rounded-full text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 w-auto"
                  onClick={() => {
                    if (product.stock === 0) return
                    for (let i = 0; i < quantity; i++) addToCart(product)
                    toast({ title: "Added to cart!", description: `${quantity}x ${product.name} added to your cart.`, duration: 3000 })
                    openCart()
                  }}
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Cart
                </Button>
                <Button
                  className="bg-navy hover:bg-brand-red text-white rounded-full text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 w-auto"
                  onClick={handleBuyNow}
                  disabled={product.stock === 0 || isLoading}
                >
                  <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Buy
                </Button>
              </div>
            </div>

            <Tabs defaultValue="description" className="w-full">
              <TabsList className="bg-navy/5 border border-navy/10 rounded-xl w-full grid grid-cols-3 p-1">
                <TabsTrigger value="description" className="rounded-lg text-xs sm:text-sm py-2.5 transition-all duration-200 data-[state=active]:bg-navy data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-navy/10">
                  Description
                </TabsTrigger>
                <TabsTrigger value="specifications" className="rounded-lg text-xs sm:text-sm py-2.5 transition-all duration-200 data-[state=active]:bg-navy data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-navy/10">
                  Specs
                </TabsTrigger>
                <TabsTrigger value="shipping" className="rounded-lg text-xs sm:text-sm py-2.5 transition-all duration-200 data-[state=active]:bg-navy data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-navy/10">
                  Shipping
                </TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="mt-4">
                <div className="p-4 sm:p-6 bg-white rounded-2xl border border-navy/10 shadow-sm">
                  <p className="text-navy/80 text-sm sm:text-base">{product.description}</p>
                </div>
              </TabsContent>
              <TabsContent value="specifications" className="mt-4">
                <div className="p-4 sm:p-6 bg-white rounded-2xl border border-navy/10 shadow-sm">
                  <ul className="space-y-2">
                    {product.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 sm:h-5 sm:w-5 text-brand-red flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>
              <TabsContent value="shipping" className="mt-4">
                <div className="p-6 bg-white rounded-2xl border border-navy/10 shadow-sm">
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

      {/* Fullscreen Image Modal */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <Image
              src={productImages[selectedImageIndex]}
              alt={product.name}
              width={1200}
              height={1200}
              className="w-full h-auto object-contain rounded-lg"
            />
          </div>
          {/* Thumbnail navigation in modal */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {productImages.map((img, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImageIndex(index)
                }}
                className={`relative w-12 h-12 rounded-lg border-2 overflow-hidden transition-all duration-200 ${
                  selectedImageIndex === index 
                    ? "border-white ring-2 ring-white/30" 
                    : "border-white/30 hover:border-white/60"
                }`}
              >
                <Image
                  src={img}
                  alt={`${product.name} view ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
