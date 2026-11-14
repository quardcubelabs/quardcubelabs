"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Star,
  Minus,
  Plus,
  ArrowLeft,
  Check,
  Maximize2,
  ShoppingCart,
  CreditCard,
  ShieldCheck,
  Cpu,
  Zap,
  Box,
  CheckCircle2,
  Award,
  Truck,
  Info,
  Layers,
} from "lucide-react"
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

interface ParsedSpec {
  label: string
  value: string
}

function parseSpecsAndDescription(name: string, category: string, rawDesc: string, rawFeatures: string[] = []) {
  const text = (rawDesc || "").replace(/<[^>]*>?/gm, "").trim()
  const specs: ParsedSpec[] = []
  let introParagraph = ""

  const addSpec = (label: string, value: string) => {
    const l = (label || "").trim().replace(/^[-*•\s]+/, "").replace(/:$/, "").trim()
    const v = (value || "").trim()
    if (l && v && !l.startsWith("__") && !v.startsWith("__")) {
      if (!specs.some((s) => s.label.toLowerCase() === l.toLowerCase())) {
        specs.push({ label: l, value: v })
      }
    }
  }

  // Check for inline standard hardware keywords (even without space before key)
  const keyPattern = /(?:^|[\s.;,]|[a-z0-9])(Processor|CPU Model|CPU|RAM Memory Installed Size|RAM|Memory|Storage|Hard Disk Size|Hard Disk|SSD|Display|Screen Size|Graphics Card Description|Graphics Coprocessor|Graphics|GPU|Operating System|OS|Battery|Color|Weight|Camera|Connectivity|Ports|Print technology|Print resolution(?:\s*\(best\))?|Duplex printing|Duplex|Maximum print area|Monthly duty cycle|Print languages|Printer smart software features|Speed|Interface|Voltage|Capacity)\s*[:]\s*/gi

  const matches: Array<{ key: string; keyIndex: number; valStart: number }> = []
  let match: RegExpExecArray | null
  while ((match = keyPattern.exec(text)) !== null) {
    const key = match[1]
    const fullMatch = match[0]
    const keyIndex = match.index + fullMatch.indexOf(key)
    matches.push({
      key,
      keyIndex,
      valStart: match.index + fullMatch.length,
    })
  }

  if (matches.length >= 2) {
    const firstMatch = matches[0]
    introParagraph = text.substring(0, firstMatch.keyIndex).trim()

    for (let i = 0; i < matches.length; i++) {
      const cur = matches[i]
      const nxt = matches[i + 1]
      const valEnd = nxt ? nxt.keyIndex : text.length
      const val = text.substring(cur.valStart, valEnd).trim().replace(/[;,.\s]+$/, "")
      addSpec(cur.key, val)
    }
  } else {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    const colonLines = lines.filter((l) => l.includes(":") && l.indexOf(":") < 45)

    if (colonLines.length >= 2) {
      lines.forEach((line) => {
        const idx = line.indexOf(":")
        if (idx > 0 && idx < 45) {
          addSpec(line.substring(0, idx), line.substring(idx + 1))
        } else if (line.length > 0 && !line.startsWith("__")) {
          addSpec("Specification", line)
        }
      })
    } else if (lines.length >= 4) {
      let isAlternating = true
      for (let i = 0; i < lines.length - 1; i += 2) {
        if (lines[i].length > 40 || lines[i].endsWith(".")) {
          isAlternating = false
          break
        }
      }
      if (isAlternating) {
        for (let i = 0; i < lines.length; i += 2) {
          if (i + 1 < lines.length) {
            addSpec(lines[i], lines[i + 1])
          } else {
            addSpec("General", lines[i])
          }
        }
      } else {
        lines.forEach((l) => {
          if (!l.startsWith("__")) addSpec("Specification", l)
        })
      }
    } else {
      introParagraph = text
      const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
      sentences.forEach((s) => {
        if (s.includes(":")) {
          const idx = s.indexOf(":")
          addSpec(s.substring(0, idx), s.substring(idx + 1))
        } else if (!s.startsWith("__") && s.length > 0) {
          addSpec("Key Spec", s)
        }
      })
    }
  }

  // Also include any clean features from product.features
  if (Array.isArray(rawFeatures)) {
    rawFeatures.forEach((feat) => {
      if (typeof feat === "string" && feat.trim() && !feat.startsWith("__")) {
        if (feat.includes(":")) {
          const [lbl, val] = feat.split(":")
          addSpec(lbl, val)
        } else {
          addSpec("Feature", feat)
        }
      }
    })
  }

  // Ensure specs is never empty
  if (specs.length === 0) {
    addSpec("Product Model", name)
    addSpec("Category", category)
    addSpec("Hardware Grade", "Genuine Commercial / Enterprise Grade")
    addSpec("Condition", "Brand New / 100% Original")
    addSpec("Warranty", "Official Manufacturer Warranty Included")
  }

  return { specs, introParagraph, rawDescription: text }
}

export default function ProductDetail({ product, relatedProducts }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const { addToCart, openCart } = useCart()
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { toast } = useToast()

  // Parse specifications from the current description & features
  const { specs, introParagraph, rawDescription } = parseSpecsAndDescription(
    product.name,
    product.category,
    product.description,
    product.features
  )

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
        description: "The requested quantity exceeds available stock.",
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

            {/* Short clean overview paragraph */}
            <div className="mb-6 space-y-2">
              <p className="text-navy/80 text-sm sm:text-base leading-relaxed">
                {introParagraph && introParagraph.length > 20
                  ? introParagraph
                  : `High-performance ${product.name} (${product.category}) engineered for reliability, durability, and commercial efficiency.`}
              </p>
              <div className="flex items-center gap-2 text-xs text-navy/70 font-semibold pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Genuine Guaranteed • Official Warranty Included</span>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center">
                <span
                  className={`${product.stock > 0 ? "text-green-600" : "text-red-500"} font-medium`}
                >
                  {product.stock > 0 ? "In Stock" : "Out of Stock"}
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
              <TabsList className="bg-transparent border-b border-navy/15 dark:border-teal/20 w-full justify-start gap-4 sm:gap-6 rounded-none p-0">
                <TabsTrigger value="description">
                  Description
                </TabsTrigger>
                <TabsTrigger value="specifications">
                  Specs
                </TabsTrigger>
                <TabsTrigger value="shipping">
                  Shipping
                </TabsTrigger>
              </TabsList>

              {/* Enhanced Description Tab with Overview, Capabilities & Packaging */}
              <TabsContent value="description" className="mt-4">
                <div className="p-5 sm:p-7 bg-white rounded-2xl border border-navy/10 shadow-sm space-y-6">
                  {/* Commercial Overview */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-navy mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4 text-teal" />
                      Product Overview
                    </h3>
                    <p className="text-navy/80 text-sm sm:text-base leading-relaxed mb-3">
                      {introParagraph && introParagraph.length > 25
                        ? introParagraph
                        : `The ${product.name} is a high-grade ${product.category.toLowerCase()} solution built to handle modern computing and enterprise demands. Designed with quality craftsmanship and proven components, it offers optimal efficiency, dependable operation, and lasting value.`}
                    </p>
                    <p className="text-navy/80 text-sm sm:text-base leading-relaxed">
                      Whether you are deploying this unit for enterprise operations, home office workflows, or professional tasks, the {product.name} integrates effortlessly into your existing hardware ecosystem with standard connectivity and robust build quality.
                    </p>
                  </div>

                  {/* Highlights Grid */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-navy uppercase tracking-wider mb-3">
                      Key Highlights & Capabilities
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl border border-navy/10 bg-slate-50/60 flex items-start gap-3">
                        <Cpu className="w-5 h-5 text-teal shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-xs sm:text-sm font-bold text-navy block">
                            Optimized Performance
                          </strong>
                          <span className="text-xs text-navy/70">
                            Engineered for high-speed responsiveness, smooth multitasking, and sustained workload stability.
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-navy/10 bg-slate-50/60 flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-xs sm:text-sm font-bold text-navy block">
                            Durable & Certified Build
                          </strong>
                          <span className="text-xs text-navy/70">
                            Built with premium materials and thermal standards to guarantee long-term dependability.
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-navy/10 bg-slate-50/60 flex items-start gap-3">
                        <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-xs sm:text-sm font-bold text-navy block">
                            Energy & Power Efficient
                          </strong>
                          <span className="text-xs text-navy/70">
                            Modern power architecture provides optimal output while reducing heat and energy draw.
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-navy/10 bg-slate-50/60 flex items-start gap-3">
                        <Layers className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-xs sm:text-sm font-bold text-navy block">
                            Universal Compatibility
                          </strong>
                          <span className="text-xs text-navy/70">
                            Plug-and-play readiness with standard interfaces, peripherals, and modern operating environments.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QuardCube Guarantee */}
                  <div className="p-4 rounded-xl bg-teal/10 border border-teal/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Award className="w-6 h-6 text-navy shrink-0" />
                      <div>
                        <strong className="text-xs sm:text-sm font-bold text-navy block">
                          QuardCube Verified Genuine Guarantee
                        </strong>
                        <span className="text-xs text-navy/75">
                          Every product is 100% authentic, inspected before delivery, and supported by local warranty services in Tanzania.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* What's In The Box */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-navy uppercase tracking-wider mb-2.5 flex items-center gap-2">
                      <Box className="w-4 h-4 text-teal" />
                      Package Contents
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-navy/80">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>1x {product.name}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Standard Power / Connection Cable</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Quick Start & User Manual</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Official Warranty Card</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              {/* Specs Tab: Features current description & structured specs */}
              <TabsContent value="specifications" className="mt-4">
                <div className="p-5 sm:p-7 bg-white rounded-2xl border border-navy/10 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-navy/10">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-navy flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-teal" />
                        Technical Specifications & Hardware Details
                      </h3>
                      <p className="text-xs text-navy/60 mt-0.5">
                        Comprehensive technical metrics and verified hardware parameters
                      </p>
                    </div>
                    <Badge variant="outline" className="border-navy/20 text-navy font-bold text-xs">
                      {specs.length} Specs Identified
                    </Badge>
                  </div>

                  {/* Clean Structured Table of Specifications */}
                  <div className="divide-y divide-navy/10 rounded-xl border border-navy/15 overflow-hidden bg-white shadow-2xs">
                    {specs.map((item, index) => (
                      <div
                        key={index}
                        className={`grid grid-cols-1 sm:grid-cols-3 py-3 px-4 sm:px-5 text-xs sm:text-sm transition-colors ${
                          index % 2 === 0 ? "bg-slate-50/70" : "bg-white"
                        }`}
                      >
                        <span className="font-extrabold text-navy/80 sm:col-span-1 tracking-wide flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-teal shrink-0" />
                          {item.label}
                        </span>
                        <span className="text-navy font-semibold sm:col-span-2 mt-0.5 sm:mt-0 break-words">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Complete Original Technical Data / Manufacturer Notes */}
                  {rawDescription && (
                    <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-navy/80">
                      <strong className="block text-navy font-extrabold text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-navy" />
                        Original Technical Data Sheet & Specification Notes:
                      </strong>
                      <div className="whitespace-pre-line leading-relaxed text-navy/75">
                        {rawDescription}
                      </div>
                    </div>
                  )}

                  {/* Certified Hardware Badge Footer */}
                  <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-navy/70 border-t border-navy/10">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Original Manufacturer Certified
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Standard Warranty Protection
                    </span>
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-teal" /> Safe & Secure Handling
                    </span>
                  </div>
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
