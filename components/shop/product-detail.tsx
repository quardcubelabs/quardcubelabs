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
  Maximize2,
  ShoppingBag,
  Loader2,
  ShieldCheck,
  Cpu,
  Zap,
  Box,
  CheckCircle2,
  Award,
  Info,
  Layers,
  RefreshCw,
  Sparkles,
  BadgeCheck,
  ImageOff,
  Heart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useOrders } from "@/contexts/order-context"
import { useWishlist } from "@/contexts/wishlist-context"
import type { Product } from "@/lib/product-actions"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import ProductCard from "@/components/shop/product-card"
import { useRemoveBgMultiple, isInvalidImageUrl } from "@/hooks/use-remove-bg"

type ProductDetailProps = {
  product: Product
  relatedProducts: Product[]
}

interface ParsedSpec {
  label: string
  value: string
}

export interface ProductConditionInfo {
  isRefurbished: boolean
  tag: "NEW" | "REFURBISHED"
  badgeLabel: string
  badgeColor: string
  pillBg: string
  headline: string
  guarantee: string
  details: string
  warrantyLabel: string
}

export function getProductConditionInfo(product: Product): ProductConditionInfo {
  let isRefurbished = product.condition === "REFURBISHED"
  if (!isRefurbished) {
    const combined = `${product.name} ${product.category} ${product.description || ""} ${(product.features || []).join(" ")}`.toLowerCase()
    if (
      /\b(refurbished|refurb|renewed|pre-owned|preowned|open-box|reconditioned)\b/i.test(combined) ||
      combined.includes("used laptop") ||
      combined.includes("used computer")
    ) {
      isRefurbished = true
    }
  }

  if (isRefurbished) {
    return {
      isRefurbished: true,
      tag: "REFURBISHED",
      badgeLabel: "Certified Refurbished",
      badgeColor: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
      pillBg: "bg-amber-100 text-amber-800 border-amber-300",
      headline: "Certified Refurbished (Grade-A Tested)",
      guarantee: "100% Functionally Inspected & Tested",
      details: "This product is Certified Refurbished. It has been thoroughly inspected, cleaned, tested, and certified to meet original manufacturer performance specifications. Backed by QuardCube hardware testing warranty.",
      warrantyLabel: "QuardCube 6-Month Refurbished Warranty",
    }
  }

  return {
    isRefurbished: false,
    tag: "NEW",
    badgeLabel: "Brand New",
    badgeColor: "bg-navy text-white border-navy/40 shadow-xs",
    pillBg: "bg-navy text-white border-navy",
    headline: "Brand New (Factory Sealed)",
    guarantee: "100% Genuine & Authentic Guaranteed",
    details: "This product is 100% Brand New in original factory sealed packaging. It includes authentic manufacturer warranty and all original manufacturer accessories.",
    warrantyLabel: "Full Manufacturer Warranty Included",
  }
}

export function sanitizeProductText(text?: string | null): string {
  if (!text || typeof text !== "string") return ""
  return text
    .replace(/Genuine product sourced from [^.]*\.?\s*(Includes standard manufacturer warranty\.?)?/gi, "")
    .replace(/sourced from (?:Epic Computers|Epic|Maisha Computers|Maisha|Laptop City|laptopcitystore|[^,.;\n]+)/gi, "")
    .replace(/\b(?:Epic Computers|epiccomputers(?:\.co\.tz)?|maishacomputers(?:\.com)?|laptopcitystore(?:\.co\.tz)?)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function parseSpecsAndDescription(
  name: string,
  category: string,
  rawDesc: string,
  rawFeatures: string[] = [],
  conditionInfo?: ProductConditionInfo
) {
  const text = sanitizeProductText((rawDesc || "").replace(/<[^>]*>?/gm, "").trim())
  const specs: ParsedSpec[] = []
  let introParagraph = ""

  const addSpec = (label: string, value: string) => {
    const l = sanitizeProductText(label || "").replace(/^[-*•\s]+/, "").replace(/:$/, "").trim()
    const v = sanitizeProductText(value || "")
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

  // Ensure condition is present in specs
  if (conditionInfo) {
    if (!specs.some((s) => s.label.toLowerCase() === "condition")) {
      specs.unshift({ label: "Condition", value: conditionInfo.headline })
    }
    if (!specs.some((s) => s.label.toLowerCase().includes("warranty"))) {
      specs.push({ label: "Warranty Coverage", value: conditionInfo.warrantyLabel })
    }
  }

  // Ensure specs is never empty
  if (specs.length === 0) {
    addSpec("Product Model", name)
    addSpec("Category", category)
    addSpec("Hardware Grade", conditionInfo?.isRefurbished ? "Grade-A Certified Enterprise" : "Genuine Commercial / Enterprise Grade")
    addSpec("Condition", conditionInfo ? conditionInfo.headline : "Brand New / 100% Original")
    addSpec("Warranty", conditionInfo ? conditionInfo.warrantyLabel : "Official Manufacturer Warranty Included")
  }

  return { specs, introParagraph, rawDescription: text }
}

export default function ProductDetail({ product, relatedProducts }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({})
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const { addOrder } = useOrders()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const isWishlisted = isInWishlist(product.id)
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { toast } = useToast()

  const conditionInfo = getProductConditionInfo(product)

  // Parse specifications from the current description & features
  const { specs, introParagraph, rawDescription } = parseSpecsAndDescription(
    product.name,
    product.category,
    product.description,
    product.features,
    conditionInfo
  )

  // Generate image swatches - filter out placeholders, favicons, or broken links
  const productImages = (() => {
    const list = [
      product.image,
      ...(product.swatchImages || []),
    ].filter((img): img is string => Boolean(img) && !isInvalidImageUrl(img))

    const unique = Array.from(new Set(list))
    return unique
  })()

  // Remove backgrounds from all product images
  const { getUrl: getBgRemovedUrl, isProcessing: isBgProcessing } = useRemoveBgMultiple(productImages)

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
        description: "The requested quantity exceeds available stock.",
        variant: "destructive",
      })
      return
    }

    setIsPlacingOrder(true)
    try {
      await addOrder(
        [{
          id: String(product.id),
          name: product.name,
          quantity,
          price: product.price,
          image: product.image || "",
        }],
        product.price * quantity,
        {
          name: user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Customer",
          email: user?.email || "",
          address: user?.user_metadata?.address || "",
          phone: user?.user_metadata?.phone || "",
        }
      )

      toast({
        title: "Order placed successfully!",
        description: `${quantity}x ${product.name} - we'll contact you to confirm payment and delivery.`,
      })

      router.push("/orders")
    } catch (error) {
      console.error("Error placing order:", error)
      toast({
        title: "Could not place order",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPlacingOrder(false)
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
              {/* Image Gallery with Swatches */}
              <div className="flex gap-4">
                {/* Thumbnail Swatches - Left Side (only if more than 1 image) */}
                {productImages.length > 1 && (
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
                        {!brokenImages[img] ? (
                          <Image
                            src={getBgRemovedUrl(img)}
                            alt={`${product.name} view ${index + 1}`}
                            fill
                            className="object-contain"
                            style={{ backgroundColor: 'transparent' }}
                            unoptimized
                            onError={() => setBrokenImages((prev) => ({ ...prev, [img]: true }))}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-50 text-navy/30">
                            <ImageOff className="h-4 w-4" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Main Image or Empty Icon */}
                <div className="flex-1 relative rounded-2xl border-2 border-navy/20 overflow-hidden group min-h-[300px] sm:min-h-[420px] flex items-center justify-center bg-white" style={{ backgroundColor: 'transparent' }}>
                  {isBgProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/50">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-navy border-t-transparent" />
                    </div>
                  )}
                  {productImages.length > 0 && !brokenImages[productImages[selectedImageIndex]] ? (
                    <>
                      <Image
                        src={getBgRemovedUrl(productImages[selectedImageIndex])}
                        alt={product.name}
                        width={600}
                        height={600}
                        className="w-full h-auto object-contain"
                        style={{ backgroundColor: 'transparent' }}
                        unoptimized
                        onError={() => setBrokenImages((prev) => ({ ...prev, [productImages[selectedImageIndex]]: true }))}
                      />
                      {/* Fullscreen Button */}
                      <button
                        onClick={() => setIsZoomed(true)}
                        className="absolute bottom-4 right-4 p-2 bg-white/80 rounded-lg border border-navy/20 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white cursor-pointer z-10"
                        title="View Fullscreen"
                        aria-label="View Fullscreen"
                      >
                        <Maximize2 className="h-5 w-5 text-navy" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full min-h-[300px] sm:min-h-[420px] flex flex-col items-center justify-center text-navy/40 bg-slate-50/70 p-6 select-none">
                      <div className="w-16 h-16 rounded-2xl bg-navy/5 border border-navy/10 flex items-center justify-center mb-2 shadow-2xs">
                        <ImageOff className="h-8 w-8 text-navy/45" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-navy/60 tracking-wider uppercase">
                        No Image Available
                      </span>
                      <span className="text-2xs text-navy/40 mt-1">
                        Product visuals will be updated shortly
                      </span>
                    </div>
                  )}

                  {/* Wishlist Button on Product Detail Image */}
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product)}
                    aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    className={`absolute top-3.5 right-3.5 z-10 h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-md backdrop-blur-xs cursor-pointer ${
                      isWishlisted
                        ? "bg-brand-red text-white border border-brand-red shadow-brand-red/30 scale-105"
                        : "bg-white/90 hover:bg-white text-navy/70 hover:text-brand-red border border-navy/15 hover:border-brand-red/40"
                    }`}
                    title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                  >
                    <Heart
                      className={`h-5 w-5 transition-transform active:scale-125 stroke-[2] ${
                        isWishlisted ? "fill-white text-white" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <Badge className="bg-brand-red text-white border-0 font-bold px-3 py-1 text-xs">{product.category}</Badge>
              <Badge
                variant="outline"
                className={`font-black uppercase tracking-wider text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs border ${conditionInfo.badgeColor}`}
              >
                {conditionInfo.isRefurbished ? (
                  <RefreshCw className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                ) : (
                  <BadgeCheck className="w-3.5 h-3.5 shrink-0 text-brand-red" />
                )}
                <span>{conditionInfo.badgeLabel}</span>
              </Badge>
            </div>
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

            <div className="mb-6">
              <div className="flex items-center">
                {product.stock > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-navy text-white border border-navy/40 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    In Stock
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-brand-red text-white border border-brand-red/40 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-white/80" />
                    Out of Stock
                  </span>
                )}
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

              {/* Order & Wishlist Buttons */}
              <div className="flex flex-row items-center gap-2 sm:gap-2.5">
                <Button
                  className="bg-navy hover:bg-brand-red text-white rounded-full text-xs sm:text-sm h-9 sm:h-10 px-4 sm:px-6 flex-1 cursor-pointer"
                  onClick={handleOrderNow}
                  disabled={product.stock === 0 || isLoading || isPlacingOrder}
                >
                  {isPlacingOrder ? (
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 animate-spin" />
                  ) : (
                    <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                  )}
                  {isPlacingOrder ? "Placing Order..." : "Order Now"}
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className={`rounded-full h-9 sm:h-10 px-3 sm:px-3.5 border-2 transition-all cursor-pointer ${
                    isWishlisted
                      ? "bg-brand-red text-white border-brand-red hover:bg-brand-red/90 hover:text-white shadow-xs"
                      : "border-navy/20 text-navy hover:border-brand-red hover:text-brand-red bg-white"
                  }`}
                  title={isWishlisted ? "In Wishlist (click to remove)" : "Save to Wishlist"}
                >
                  <Heart className={`h-4 w-4 ${isWishlisted ? "fill-white text-white" : ""}`} />
                  <span className="hidden sm:inline ml-1 text-xs font-bold">
                    {isWishlisted ? "Saved" : "Wishlist"}
                  </span>
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
                      <Info className="w-4 h-4 text-navy" />
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
                      <div className="p-3.5 rounded-xl border-2 border-navy bg-teal/15 text-navy flex items-start gap-3 transition-all shadow-xs">
                        <Cpu className="w-5 h-5 text-navy shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-xs sm:text-sm font-bold text-navy block">
                            Optimized Performance
                          </strong>
                          <span className="text-xs text-navy/80">
                            Engineered for high-speed responsiveness, smooth multitasking, and sustained workload stability.
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border-2 border-navy bg-teal/15 text-navy flex items-start gap-3 transition-all shadow-xs">
                        <ShieldCheck className="w-5 h-5 text-navy shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-xs sm:text-sm font-bold text-navy block">
                            Durable & Certified Build
                          </strong>
                          <span className="text-xs text-navy/80">
                            Built with premium materials and thermal standards to guarantee long-term dependability.
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border-2 border-navy bg-teal/15 text-navy flex items-start gap-3 transition-all shadow-xs">
                        <Zap className="w-5 h-5 text-navy shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-xs sm:text-sm font-bold text-navy block">
                            Energy & Power Efficient
                          </strong>
                          <span className="text-xs text-navy/80">
                            Modern power architecture provides optimal output while reducing heat and energy draw.
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border-2 border-navy bg-teal/15 text-navy flex items-start gap-3 transition-all shadow-xs">
                        <Layers className="w-5 h-5 text-navy shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-xs sm:text-sm font-bold text-navy block">
                            Universal Compatibility
                          </strong>
                          <span className="text-xs text-navy/80">
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
                          QuardCube {conditionInfo.isRefurbished ? "Certified Refurbished" : "Verified Genuine"} Guarantee
                        </strong>
                        <span className="text-xs text-navy/75">
                          {conditionInfo.isRefurbished
                            ? "Thoroughly tested and restored to full original operation, inspected before delivery, and supported by local warranty services in Tanzania."
                            : "Every product is 100% authentic, inspected before delivery, and supported by local warranty services in Tanzania."}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* What's In The Box */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-navy uppercase tracking-wider mb-2.5 flex items-center gap-2">
                      <Box className="w-4 h-4 text-navy" />
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
                  <div className="pb-3 border-b border-navy/10">
                    <h3 className="text-base sm:text-lg font-bold text-navy flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-navy" />
                      Technical Specifications & Hardware Details
                    </h3>
                    <p className="text-xs text-navy/60 mt-0.5">
                      Comprehensive technical metrics and verified hardware parameters
                    </p>
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
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          {item.label}
                        </span>
                        <span className="text-navy font-semibold sm:col-span-2 mt-0.5 sm:mt-0 break-words">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Certified Hardware Badge Footer */}
                  <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-navy/70 border-t border-navy/10">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Original Manufacturer Certified
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Standard Warranty Protection
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
              unoptimized
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
                  unoptimized
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
