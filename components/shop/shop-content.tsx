"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import ProductCard from "@/components/shop/product-card"
import { Button } from "@/components/ui/button"
import {
  Search,
  Filter,
  X,
  ShoppingCart,
  Package,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Layers,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Tag,
  DollarSign,
  ArrowUpDown,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { useOrders } from "@/contexts/order-context"
import { useRouter } from "next/navigation"
import HydrationSafe from "@/components/hydration-safe"
import ProductGridColumnsPicker, { GRID_COLUMN_CLASSES } from "@/components/product-grid-columns-picker"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/product-actions"

type ShopContentProps = {
  initialProducts: Product[]
  categories: string[]
  initialCategory?: string
  subcategoryMap?: Record<string, string>
  showStockBadges?: boolean
}

type BulkOrderItem = {
  product: Product
  quantity: number
}

const ITEMS_PER_PAGE = 24

const POPULAR_BRANDS = [
  "HP",
  "Dell",
  "Lenovo",
  "Apple",
  "Asus",
  "Acer",
  "Canon",
  "Epson",
  "Hikvision",
  "Dahua",
  "TP-Link",
  "Samsung",
  "SanDisk",
  "Toshiba",
  "Brother",
  "Logitech",
  "Sony",
  "Microsoft",
  "Intel",
  "AMD",
]

const PRICE_PRESETS = [
  { id: "all", label: "All Prices", min: 0, max: 0 },
  { id: "under-500k", label: "Under 500k", min: 0, max: 500000 },
  { id: "500k-1.2m", label: "500k - 1.2M", min: 500000, max: 1200000 },
  { id: "1.2m-2.5m", label: "1.2M - 2.5M", min: 1200000, max: 2500000 },
  { id: "above-2.5m", label: "Above 2.5M", min: 2500000, max: 0 },
]

export default function ShopContent({
  initialProducts,
  categories,
  initialCategory = "All",
  subcategoryMap = {},
  showStockBadges = false,
}: ShopContentProps) {
  // Navigation & Category State
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarTab, setSidebarTab] = useState<"categories" | "filters">("categories")
  const [showFilters, setShowFilters] = useState(false)

  // Filter States
  const [pricePreset, setPricePreset] = useState("all")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [conditionFilter, setConditionFilter] = useState<"ALL" | "NEW" | "REFURBISHED">("ALL")
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "name-asc">("featured")

  // Bulk Order & View States
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [bulkItems, setBulkItems] = useState<Map<number, number>>(new Map())
  const [products] = useState<Product[]>(initialProducts)
  const [currentPage, setCurrentPage] = useState(1)
  const [gridColumns, setGridColumns] = useState(3)
  const [isPlacingBulkOrder, setIsPlacingBulkOrder] = useState(false)

  const { toast } = useToast()
  const { user, isLoading: authLoading } = useAuth()
  const { addOrder } = useOrders()
  const router = useRouter()

  // Match category helper
  const productMatchesCategory = (product: Product, category: string) => {
    if (category === "All") return true
    if (product.category === category) return true
    return subcategoryMap[product.category] === category
  }

  // Match brand helper
  const matchesBrand = (product: Product, brand: string) => {
    const regex = new RegExp(`(^|[^a-zA-Z0-9])${brand}([^a-zA-Z0-9]|$)`, "i")
    return regex.test(product.name) || regex.test(product.description || "")
  }

  // Match condition helper
  const matchesCondition = (product: Product, condition: "ALL" | "NEW" | "REFURBISHED") => {
    if (condition === "ALL") return true
    const text = `${product.name} ${product.description || ""}`.toLowerCase()
    const isRefurb =
      text.includes("refurbished") ||
      text.includes("renewed") ||
      product.category.toLowerCase().includes("refurbished")
    if (condition === "REFURBISHED") return isRefurb
    if (condition === "NEW") return !isRefurb
    return true
  }

  // Synchronize category if prop changes
  useEffect(() => {
    if (initialCategory && initialCategory !== activeCategory) {
      setActiveCategory(initialCategory)
      setCurrentPage(1)
    }
  }, [initialCategory])

  // Compute available brands with product counts in the active category context
  const availableBrandsWithCounts = useMemo(() => {
    const categoryProducts =
      activeCategory === "All"
        ? products
        : products.filter((p) => productMatchesCategory(p, activeCategory))

    return POPULAR_BRANDS.map((brand) => {
      const count = categoryProducts.filter((p) => matchesBrand(p, brand)).length
      return { brand, count }
    }).filter((b) => b.count > 0 || selectedBrands.includes(b.brand))
  }, [products, activeCategory, selectedBrands])

  // Count active non-category filters
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (minPrice || maxPrice || pricePreset !== "all") count++
    if (selectedBrands.length > 0) count += selectedBrands.length
    if (conditionFilter !== "ALL") count++
    if (inStockOnly) count++
    if (sortBy !== "featured") count++
    return count
  }, [minPrice, maxPrice, pricePreset, selectedBrands, conditionFilter, inStockOnly, sortBy])

  // Master Unified Filter Pipeline: Category + Search + Price + Brand + Condition + InStock + Sort
  const filteredProducts = useMemo(() => {
    let list = products

    // 1. Category Filter
    if (activeCategory !== "All") {
      list = list.filter((p) => productMatchesCategory(p, activeCategory))
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
      )
    }

    // 3. Price Filter
    const minVal = parseFloat(minPrice)
    const maxVal = parseFloat(maxPrice)
    if (!isNaN(minVal) && minVal > 0) {
      list = list.filter((p) => Number(p.price) >= minVal)
    }
    if (!isNaN(maxVal) && maxVal > 0) {
      list = list.filter((p) => Number(p.price) <= maxVal)
    }

    // 4. Brand Filter
    if (selectedBrands.length > 0) {
      list = list.filter((p) =>
        selectedBrands.some((brand) => matchesBrand(p, brand))
      )
    }

    // 5. Condition Filter
    if (conditionFilter !== "ALL") {
      list = list.filter((p) => matchesCondition(p, conditionFilter))
    }

    // 6. Availability Filter
    if (inStockOnly) {
      list = list.filter((p) => p.stock > 0)
    }

    // 7. Sort
    if (sortBy === "price-asc") {
      list = [...list].sort((a, b) => Number(a.price) - Number(b.price))
    } else if (sortBy === "price-desc") {
      list = [...list].sort((a, b) => Number(b.price) - Number(a.price))
    } else if (sortBy === "name-asc") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    }

    return list
  }, [
    products,
    activeCategory,
    searchQuery,
    minPrice,
    maxPrice,
    selectedBrands,
    conditionFilter,
    inStockOnly,
    sortBy,
  ])

  // Handlers
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
    setCurrentPage(1)
    if (showFilters) setShowFilters(false)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const toggleBrand = (brand: string) => {
    setCurrentPage(1)
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    )
  }

  const handlePricePreset = (preset: typeof PRICE_PRESETS[number]) => {
    setPricePreset(preset.id)
    setCurrentPage(1)
    if (preset.id === "all") {
      setMinPrice("")
      setMaxPrice("")
    } else {
      setMinPrice(preset.min > 0 ? preset.min.toString() : "")
      setMaxPrice(preset.max > 0 ? preset.max.toString() : "")
    }
  }

  const handleCustomPriceChange = (min: string, max: string) => {
    setPricePreset("custom")
    setMinPrice(min)
    setMaxPrice(max)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setPricePreset("all")
    setMinPrice("")
    setMaxPrice("")
    setSelectedBrands([])
    setConditionFilter("ALL")
    setInStockOnly(false)
    setSortBy("featured")
    setCurrentPage(1)
  }

  const handleClearAll = () => {
    setActiveCategory("All")
    setSearchQuery("")
    handleResetFilters()
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  // Bulk Order Operations
  const updateBulkQuantity = (productId: number, quantity: number) => {
    const product = products.find((p) => p.id === productId)
    if (!product || product.type !== "physical") return
    const newBulkItems = new Map(bulkItems)
    if (quantity > 0) {
      newBulkItems.set(productId, quantity)
    } else {
      newBulkItems.delete(productId)
    }
    setBulkItems(newBulkItems)
  }

  const getBulkQuantity = (productId: number) => {
    return bulkItems.get(productId) || 0
  }

  const getBulkTotal = () => {
    let total = 0
    bulkItems.forEach((quantity, productId) => {
      const product = products.find((p) => p.id === productId && p.type === "physical")
      if (product) {
        total += Number(product.price) * quantity
      }
    })
    return total
  }

  const getBulkItemsArray = () => {
    const items: BulkOrderItem[] = []
    bulkItems.forEach((quantity, productId) => {
      const product = products.find((p) => p.id === productId && p.type === "physical")
      if (product) {
        items.push({ product, quantity })
      }
    })
    return items
  }

  const clearBulkOrder = () => {
    setBulkItems(new Map())
  }

  const toggleBulkMode = () => {
    setIsBulkMode(!isBulkMode)
    if (isBulkMode) {
      clearBulkOrder()
    }
  }

  const handleBulkOrderSubmit = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to place bulk orders.",
        variant: "destructive",
      })
      router.push("/auth/login")
      return
    }

    const items = getBulkItemsArray()
    if (items.length === 0) {
      toast({
        title: "No items selected",
        description: "Please add quantities to at least one product.",
        variant: "destructive",
      })
      return
    }

    setIsPlacingBulkOrder(true)
    try {
      const orderItems = items.map(({ product, quantity }) => ({
        id: String(product.id),
        name: product.name,
        quantity,
        price: Number(product.price),
        image: product.image,
      }))

      const total = getBulkTotal()

      const customerInfo = {
        name: user.user_metadata?.full_name || user.email || "Valued Customer",
        email: user.email || "",
        phone: user.user_metadata?.phone || "",
        address: user.user_metadata?.address || "",
      }

      await addOrder(orderItems, total, customerInfo)

      toast({
        title: "Bulk Order placed successfully!",
        description: `Order with ${items.length} product(s) placed. Check your orders page.`,
        duration: 5000,
      })

      clearBulkOrder()
      setIsBulkMode(false)
      router.push("/orders")
    } catch (error) {
      console.error("Bulk order submission error:", error)
      toast({
        title: "Error placing bulk order",
        description: "There was a problem submitting your bulk order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPlacingBulkOrder(false)
    }
  }

  // Sidebar Tabs & Content Renderer (shared between Desktop sticky card & Mobile drawer)
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Interactive Tabs Header: Categories vs Filters */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-3 border border-navy/10 shrink-0">
        <button
          type="button"
          onClick={() => setSidebarTab("categories")}
          className={cn(
            "flex-1 py-2 px-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
            sidebarTab === "categories"
              ? "bg-navy text-white shadow-sm"
              : "text-navy/70 hover:text-navy hover:bg-white/60"
          )}
        >
          <Layers className={cn("h-3.5 w-3.5", sidebarTab === "categories" ? "text-teal" : "text-navy/60")} />
          <span>Categories</span>
        </button>

        <button
          type="button"
          onClick={() => setSidebarTab("filters")}
          className={cn(
            "flex-1 py-2 px-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
            sidebarTab === "filters"
              ? "bg-navy text-white shadow-sm"
              : "text-navy/70 hover:text-navy hover:bg-white/60"
          )}
        >
          <Filter className={cn("h-3.5 w-3.5", sidebarTab === "filters" ? "text-brand-red" : "text-navy/60")} />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="h-4 min-w-4 px-1 rounded-full bg-brand-red text-white text-[10px] font-black flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Categories View */}
      {sidebarTab === "categories" && (
        <div className="overflow-y-auto pr-1 space-y-1.5 flex-1 min-h-0 scrollbar-thin scrollbar-thumb-teal/50 scrollbar-track-transparent">
          {/* All Products Option */}
          <button
            type="button"
            onClick={() => handleCategoryChange("All")}
            className={cn(
              "w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-between group cursor-pointer",
              activeCategory === "All" ? "bg-navy text-white shadow-sm" : "text-navy hover:bg-teal/20"
            )}
          >
            <span className="truncate">All Products</span>
            <span
              className={cn(
                "text-xs px-2.5 py-0.5 rounded-full font-bold bg-navy text-white transition-all",
                activeCategory === "All" ? "ring-2 ring-white/60 shadow-sm" : "shadow-xs"
              )}
            >
              {products.length}
            </span>
          </button>

          {/* Category Items */}
          {categories.map((cat, idx) => {
            const count = products.filter((p) => productMatchesCategory(p, cat)).length
            const isActive = activeCategory === cat
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={cn(
                  "w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-between group cursor-pointer",
                  isActive ? "bg-navy text-white shadow-sm" : "text-navy hover:bg-teal/20"
                )}
              >
                <span className="truncate">{cat}</span>
                <span
                  className={cn(
                    "text-xs px-2.5 py-0.5 rounded-full font-bold bg-navy text-white transition-all",
                    isActive ? "ring-2 ring-white/60 shadow-sm" : "shadow-xs"
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Tab 2: Filters View (Work concurrently with Categories) */}
      {sidebarTab === "filters" && (
        <div className="overflow-y-auto pr-1 space-y-4 flex-1 min-h-0 scrollbar-thin scrollbar-thumb-teal/50 scrollbar-track-transparent text-xs text-navy">
          {/* Active Context Banner */}
          <div className="bg-teal/15 border border-teal/40 rounded-xl p-2.5 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-navy/60 block">Scope Category:</span>
              <span className="font-extrabold text-navy truncate block">{activeCategory}</span>
            </div>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-brand-red hover:underline flex items-center gap-1 shrink-0"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold uppercase text-[11px] tracking-wider text-navy flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-brand-red" />
                Price (TZS)
              </span>
              {(minPrice || maxPrice) && (
                <button
                  type="button"
                  onClick={() => {
                    setMinPrice("")
                    setMaxPrice("")
                    setPricePreset("all")
                    setCurrentPage(1)
                  }}
                  className="text-[10px] text-brand-red hover:underline font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Price Presets */}
            <div className="grid grid-cols-2 gap-1.5">
              {PRICE_PRESETS.map((preset) => {
                const isSelected = pricePreset === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePricePreset(preset)}
                    className={cn(
                      "py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center border cursor-pointer",
                      isSelected
                        ? "bg-navy text-white border-navy shadow-xs"
                        : "bg-white text-navy/80 border-navy/15 hover:bg-slate-50"
                    )}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>

            {/* Custom Min/Max Inputs */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1">
                <label className="text-[10px] text-navy/60 font-semibold block mb-0.5">Min TZS</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => handleCustomPriceChange(e.target.value, maxPrice)}
                  className="h-8 text-xs bg-white border-navy/20 rounded-lg"
                />
              </div>
              <span className="text-navy/40 font-bold pt-4">-</span>
              <div className="flex-1">
                <label className="text-[10px] text-navy/60 font-semibold block mb-0.5">Max TZS</label>
                <Input
                  type="number"
                  placeholder="Any"
                  value={maxPrice}
                  onChange={(e) => handleCustomPriceChange(minPrice, e.target.value)}
                  className="h-8 text-xs bg-white border-navy/20 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Brand Filter */}
          <div className="space-y-2 border-t border-navy/10 pt-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold uppercase text-[11px] tracking-wider text-navy flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-brand-red" />
                Brand
              </span>
              {selectedBrands.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBrands([])
                    setCurrentPage(1)
                  }}
                  className="text-[10px] text-brand-red hover:underline font-bold"
                >
                  Clear ({selectedBrands.length})
                </button>
              )}
            </div>

            {availableBrandsWithCounts.length > 0 ? (
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-teal/40">
                {availableBrandsWithCounts.map(({ brand, count }) => {
                  const isChecked = selectedBrands.includes(brand)
                  return (
                    <label
                      key={brand}
                      className={cn(
                        "flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors text-xs font-semibold select-none",
                        isChecked ? "bg-navy/10 text-navy font-bold" : "hover:bg-slate-50 text-navy/80"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleBrand(brand)}
                          className="h-4 w-4 rounded border-navy/40 data-[state=checked]:bg-navy data-[state=checked]:border-navy"
                        />
                        <span>{brand}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-navy/10 text-navy font-bold">
                        {count}
                      </span>
                    </label>
                  )
                })}
              </div>
            ) : (
              <p className="text-[11px] text-navy/60 italic">No specific brand filters in this category.</p>
            )}
          </div>

          {/* Condition Filter */}
          <div className="space-y-2 border-t border-navy/10 pt-3">
            <span className="font-extrabold uppercase text-[11px] tracking-wider text-navy block">
              Item Condition
            </span>
            <div className="grid grid-cols-3 gap-1">
              {(["ALL", "NEW", "REFURBISHED"] as const).map((cond) => {
                const isSelected = conditionFilter === cond
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => {
                      setConditionFilter(cond)
                      setCurrentPage(1)
                    }}
                    className={cn(
                      "py-1.5 px-1.5 rounded-lg text-[10px] font-black transition-all text-center border cursor-pointer",
                      isSelected
                        ? "bg-navy text-white border-navy shadow-xs"
                        : "bg-white text-navy/70 border-navy/15 hover:bg-slate-50"
                    )}
                  >
                    {cond === "ALL" ? "All" : cond === "NEW" ? "Brand New" : "Refurbished"}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Stock Availability Filter */}
          <div className="border-t border-navy/10 pt-3">
            <label className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-50 border border-navy/10 cursor-pointer select-none">
              <span className="text-xs font-bold text-navy">In-Stock Only</span>
              <Checkbox
                checked={inStockOnly}
                onCheckedChange={(c) => {
                  setInStockOnly(!!c)
                  setCurrentPage(1)
                }}
                className="h-4 w-4 rounded border-navy/40 data-[state=checked]:bg-navy data-[state=checked]:border-navy"
              />
            </label>
          </div>

          {/* Sort By Filter */}
          <div className="space-y-2 border-t border-navy/10 pt-3">
            <span className="font-extrabold uppercase text-[11px] tracking-wider text-navy flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-brand-red" />
              Sort Order
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "featured", label: "Featured" },
                { id: "price-asc", label: "Price: Low → High" },
                { id: "price-desc", label: "Price: High → Low" },
                { id: "name-asc", label: "Alphabetical" },
              ].map((s) => {
                const isSelected = sortBy === s.id
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSortBy(s.id as any)
                      setCurrentPage(1)
                    }}
                    className={cn(
                      "py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all text-center border cursor-pointer",
                      isSelected
                        ? "bg-navy text-white border-navy shadow-xs"
                        : "bg-white text-navy/70 border-navy/15 hover:bg-slate-50"
                    )}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Mobile filters drawer toggle button */}
      <div className="flex md:hidden justify-between items-center mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFilters}
          className="bg-white border-2 border-navy/20 text-navy font-bold rounded-xl h-10 px-4 shadow-sm flex items-center gap-2"
        >
          <Filter className="h-4 w-4 text-brand-red" />
          <span>
            {sidebarTab === "categories" ? "Category: " : "Filters: "}
            <strong className="text-brand-red">{activeCategory}</strong>
            {activeFiltersCount > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full bg-brand-red text-white text-[11px] font-black">
                +{activeFiltersCount}
              </span>
            )}
          </span>
        </Button>
      </div>

      {/* Mobile filters drawer */}
      {showFilters && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-[70] md:hidden" onClick={toggleFilters}>
          <div
            className="absolute left-0 top-0 bottom-0 w-4/5 max-w-xs bg-white p-5 z-[80] shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 mb-3 border-b border-navy/10">
              <h3 className="font-extrabold text-base text-navy flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-brand-red" />
                Browse Catalog
              </h3>
              <Button variant="ghost" size="sm" onClick={toggleFilters} className="rounded-full h-8 w-8 p-0 text-navy">
                <X className="h-5 w-5" />
              </Button>
            </div>
            {renderSidebarContent()}
          </div>
        </div>
      )}

      {/* Main Shop Layout: Left Sidebar + Products Content */}
      <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start relative">
        {/* Desktop Left-side Categories & Filters Card */}
        <aside className="hidden md:block w-64 lg:w-72 flex-shrink-0 sticky top-24 lg:top-28 z-0">
          <div className="bg-white border-2 border-navy/20 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col h-[calc(100vh-8.5rem)]">
            {renderSidebarContent()}
          </div>
        </aside>

        {/* Right-side Products Area */}
        <div id="shop-products-top" className="flex-1 min-w-0 w-full relative z-10 scroll-mt-24">
          {/* Shop Top Control Bar */}
          <div className="flex flex-col gap-3 mb-4 bg-white border-2 border-navy/20 p-3.5 sm:p-4 rounded-2xl shadow-md">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              {/* Search Bar */}
              <div className="relative w-full sm:flex-1">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-teal h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search products by name, description..."
                  className="pl-10 bg-white border border-teal focus:border-teal focus:ring-1 focus:ring-teal rounded-full w-full text-navy placeholder:text-navy/50 h-10"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>

              {/* Action Buttons: Bulk Mode & Grid Picker */}
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                {filteredProducts.some((product) => product.type === "physical") && (
                  <Button
                    variant={isBulkMode ? "default" : "outline"}
                    onClick={toggleBulkMode}
                    size="sm"
                    className={`text-xs sm:text-sm h-10 px-4 rounded-full font-bold transition-all ${
                      isBulkMode
                        ? "bg-navy hover:bg-navy/90 text-white"
                        : "border-2 border-navy/20 text-navy hover:bg-navy hover:text-white"
                    }`}
                  >
                    {isBulkMode ? (
                      <>
                        <Package className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>Exit Bulk Mode</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>Bulk Order</span>
                      </>
                    )}
                  </Button>
                )}

                <ProductGridColumnsPicker
                  value={gridColumns}
                  onChange={setGridColumns}
                  className="shrink-0"
                />
              </div>
            </div>

            {/* Active Filters Chips Bar (Category + Brands + Price + Condition) */}
            {(activeCategory !== "All" || activeFiltersCount > 0 || searchQuery) && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-navy/10 text-xs">
                <span className="text-[11px] font-bold text-navy/60 mr-1">Active:</span>

                {/* Category Chip */}
                {activeCategory !== "All" && (
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("All")}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-navy bg-teal/30 hover:bg-teal/50 px-2.5 py-1 rounded-full transition-colors"
                    title="Remove category filter"
                  >
                    <span>Category: {activeCategory}</span>
                    <X className="h-3 w-3 text-navy/70" />
                  </button>
                )}

                {/* Selected Brands Chips */}
                {selectedBrands.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => toggleBrand(brand)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-navy hover:bg-navy/80 px-2.5 py-1 rounded-full transition-colors"
                    title={`Remove brand ${brand}`}
                  >
                    <span>{brand}</span>
                    <X className="h-3 w-3 text-white/70" />
                  </button>
                ))}

                {/* Price Chip */}
                {(minPrice || maxPrice) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMinPrice("")
                      setMaxPrice("")
                      setPricePreset("all")
                      setCurrentPage(1)
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-navy bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-full transition-colors"
                  >
                    <span>
                      Price: {minPrice ? `≥ ${Number(minPrice).toLocaleString()}` : ""}
                      {minPrice && maxPrice ? " & " : ""}
                      {maxPrice ? `≤ ${Number(maxPrice).toLocaleString()}` : ""} TZS
                    </span>
                    <X className="h-3 w-3 text-navy/70" />
                  </button>
                )}

                {/* Condition Chip */}
                {conditionFilter !== "ALL" && (
                  <button
                    type="button"
                    onClick={() => {
                      setConditionFilter("ALL")
                      setCurrentPage(1)
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-brand-red hover:bg-brand-red/90 px-2.5 py-1 rounded-full transition-colors"
                  >
                    <span>{conditionFilter === "NEW" ? "Brand New" : "Refurbished"}</span>
                    <X className="h-3 w-3 text-white/70" />
                  </button>
                )}

                {/* In Stock Only Chip */}
                {inStockOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      setInStockOnly(false)
                      setCurrentPage(1)
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full transition-colors"
                  >
                    <span>In Stock Only</span>
                    <X className="h-3 w-3 text-emerald-700" />
                  </button>
                )}

                {/* Search Term Chip */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-navy bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full transition-colors"
                  >
                    <span>Search: &ldquo;{searchQuery}&rdquo;</span>
                    <X className="h-3 w-3 text-navy/70" />
                  </button>
                )}

                {/* Clear All Button */}
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[11px] font-extrabold text-brand-red hover:underline ml-auto flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Clear All</span>
                </button>
              </div>
            )}
          </div>

          {/* Products grid */}
          <div>
            {filteredProducts.length > 0 ? (
              <>
                <div className={cn("grid gap-3 sm:gap-6", GRID_COLUMN_CLASSES[gridColumns])}>
                  {filteredProducts
                    .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                    .map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.02 }}
                      >
                        <ProductCard
                          product={product}
                          isBulkMode={isBulkMode}
                          bulkQuantity={getBulkQuantity(product.id)}
                          onBulkQuantityChange={updateBulkQuantity}
                          showStockBadge={showStockBadges}
                        />
                      </motion.div>
                    ))}
                </div>

                {/* Pagination Controls */}
                {Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) > 1 && (() => {
                  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
                  const goToPage = (page: number) => {
                    const target = Math.max(1, Math.min(totalPages, page))
                    setCurrentPage(target)
                    const el = document.getElementById("shop-products-top")
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                  }

                  // Calculate page numbers with ellipsis
                  const pageNumbers: (number | string)[] = []
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i)
                  } else {
                    pageNumbers.push(1)
                    if (currentPage > 3) pageNumbers.push("...")
                    const start = Math.max(2, currentPage - 1)
                    const end = Math.min(totalPages - 1, currentPage + 1)
                    for (let i = start; i <= end; i++) pageNumbers.push(i)
                    if (currentPage < totalPages - 2) pageNumbers.push("...")
                    pageNumbers.push(totalPages)
                  }

                  return (
                    <div className="mt-8 flex justify-center">
                      <div className="inline-flex items-center gap-1 sm:gap-2 flex-wrap justify-center bg-white border-2 border-navy/20 p-2 sm:p-2.5 rounded-full shadow-sm max-w-full">
                        {/* First & Prev */}
                        <button
                          type="button"
                          onClick={() => goToPage(1)}
                          disabled={currentPage === 1}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-navy font-bold hover:bg-teal/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="First Page"
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-navy font-bold hover:bg-teal/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Previous Page"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>

                        {/* Number buttons */}
                        {pageNumbers.map((p, idx) => {
                          if (p === "...") {
                            return (
                              <span key={`ellipsis-${idx}`} className="px-1 text-navy/50 font-bold text-xs sm:text-sm select-none">
                                ...
                              </span>
                            )
                          }
                          const pageNum = p as number
                          const isActive = pageNum === currentPage
                          return (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => goToPage(pageNum)}
                              className={cn(
                                "min-w-[2rem] sm:min-w-[2.25rem] h-8 sm:h-9 px-2 rounded-full text-xs sm:text-sm font-extrabold transition-all",
                                isActive
                                  ? "bg-navy text-white shadow-sm ring-2 ring-navy/20"
                                  : "text-navy hover:bg-teal/30"
                              )}
                            >
                              {pageNum}
                            </button>
                          )
                        })}

                        {/* Next & Last */}
                        <button
                          type="button"
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-navy font-bold hover:bg-teal/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Next Page"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => goToPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-navy font-bold hover:bg-teal/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Last Page"
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </button>

                        <div className="hidden sm:block pl-2 pr-1 border-l border-navy/20 text-xs font-bold text-navy/70">
                          {currentPage} / {totalPages} ({filteredProducts.length} items)
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </>
            ) : (
              <div className="text-center py-16 bg-white border-2 border-navy/20 rounded-2xl shadow-sm p-6 sm:p-10">
                <div className="w-16 h-16 rounded-full bg-teal/20 text-navy flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-brand-red" />
                </div>
                <h3 className="text-xl font-bold text-navy mb-2">No matching products found</h3>
                <p className="text-sm text-navy/70 max-w-md mx-auto mb-6">
                  We couldn&apos;t find products matching your selected category and filter combination.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {activeFiltersCount > 0 && (
                    <Button
                      onClick={handleResetFilters}
                      variant="outline"
                      className="border-2 border-navy font-bold rounded-xl"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset Filters
                    </Button>
                  )}
                  {activeCategory !== "All" && (
                    <Button
                      onClick={() => handleCategoryChange("All")}
                      className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl"
                    >
                      Show All Categories
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating bulk order panel */}
      {isBulkMode && (
        <HydrationSafe>
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t-2 border-navy/20 p-3 sm:p-4 shadow-2xl z-50 transition-transform duration-300">
            <div className="container mx-auto px-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 max-w-4xl mx-auto">
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                  <div>
                    <span className="text-xs text-navy/70 font-semibold block">Total Selected Items</span>
                    <span className="text-lg sm:text-xl font-extrabold text-navy">
                      {Array.from(bulkItems.values()).reduce((sum, q) => sum + q, 0)} items
                    </span>
                  </div>
                  <div className="h-8 w-px bg-navy/20 hidden sm:block"></div>
                  <div>
                    <span className="text-xs text-navy/70 font-semibold block">Estimated Total</span>
                    <span className="text-lg sm:text-xl font-extrabold text-brand-red">
                      TZS {getBulkTotal().toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearBulkOrder}
                    disabled={bulkItems.size === 0 || isPlacingBulkOrder}
                    className="flex-1 sm:flex-none border-navy/20 font-bold rounded-xl"
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={handleBulkOrderSubmit}
                    disabled={bulkItems.size === 0 || isPlacingBulkOrder}
                    className="flex-1 sm:flex-none bg-navy hover:bg-navy/90 text-white font-bold rounded-xl shadow-md"
                  >
                    {isPlacingBulkOrder ? "Submitting..." : "Submit Bulk Order"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </HydrationSafe>
      )}
    </div>
  )
}
