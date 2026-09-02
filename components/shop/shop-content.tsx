"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import ProductCard from "@/components/shop/product-card"
import { Button } from "@/components/ui/button"
import { Search, Filter, X, ShoppingCart, Package } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { useOrders } from "@/contexts/order-context"
import { useRouter } from "next/navigation"
import HydrationSafe from "@/components/hydration-safe"
import type { Product } from "@/lib/product-actions"

type ShopContentProps = {
  initialProducts: Product[]
  categories: string[]
  initialCategory?: string
  subcategoryMap?: Record<string, string>
}

type BulkOrderItem = {
  product: Product
  quantity: number
}

export default function ShopContent({ initialProducts, categories, initialCategory = "All", subcategoryMap = {} }: ShopContentProps) {
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [searchQuery, setSearchQuery] = useState("")
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [bulkItems, setBulkItems] = useState<Map<number, number>>(new Map())
  const [showFilters, setShowFilters] = useState(false)
  const [products, setProducts] = useState(initialProducts)
  const [filteredProducts, setFilteredProducts] = useState(initialProducts)
  const [isPlacingBulkOrder, setIsPlacingBulkOrder] = useState(false)

  const { toast } = useToast()
  const { user, isLoading: authLoading } = useAuth()
  const { addOrder } = useOrders()
  const router = useRouter()

  const productMatchesCategory = (product: Product, category: string) => {
    if (category === "All") return true
    if (product.category === category) return true
    return subcategoryMap[product.category] === category
  }

  useEffect(() => {
    if (initialCategory && initialCategory !== "All") {
      const filtered = initialProducts.filter((product) => productMatchesCategory(product, initialCategory))
      setFilteredProducts(filtered)
      setActiveCategory(initialCategory)
    } else {
      setFilteredProducts(initialProducts)
    }
  }, [initialCategory, initialProducts])

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
    setShowFilters(false)
    let filtered = [...products]
    if (category !== "All") {
      filtered = filtered.filter((product) => productMatchesCategory(product, category))
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query),
      )
    }
    setFilteredProducts(filtered)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    let filtered = [...products]
    if (activeCategory !== "All") {
      filtered = filtered.filter((product) => productMatchesCategory(product, activeCategory))
    }
    if (query) {
      const lowercaseQuery = query.toLowerCase()
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(lowercaseQuery) ||
          product.description.toLowerCase().includes(lowercaseQuery) ||
          product.category.toLowerCase().includes(lowercaseQuery),
      )
    }
    setFilteredProducts(filtered)
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  const updateBulkQuantity = (productId: number, quantity: number) => {
    const product = products.find(p => p.id === productId)
    if (!product || product.type !== 'physical') return
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
      const product = products.find(p => p.id === productId && p.type === 'physical')
      if (product) {
        total += Number(product.price) * quantity
      }
    })
    return total
  }

  const getBulkItemsArray = () => {
    const items: BulkOrderItem[] = []
    bulkItems.forEach((quantity, productId) => {
      const product = products.find(p => p.id === productId && p.type === 'physical')
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

  const handleBulkOrderSubmission = async () => {
    if (!authLoading && !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to place an order.",
        variant: "destructive",
      })
      router.push("/auth/login")
      return
    }
    if (bulkItems.size === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to place a bulk order.",
        variant: "destructive",
      })
      return
    }
    setIsPlacingBulkOrder(true)
    try {
      const orderItems = getBulkItemsArray().map(({ product, quantity }) => ({
        id: String(product.id),
        name: product.name,
        quantity: quantity,
        price: Number(product.price),
        image: product.image,
      }))
      const total = getBulkTotal()
      const customerInfo = {
        name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Customer',
        email: user?.email || '',
        address: user?.user_metadata?.address || 'Address not provided',
        phone: user?.user_metadata?.phone || '',
      }
      await addOrder(orderItems, total, customerInfo)
      toast({
        title: "Bulk order placed successfully!",
        description: `Your order with ${bulkItems.size} different products has been placed. Check your email for invoice details.`,
        duration: 5000,
      })
      clearBulkOrder()
      setIsBulkMode(false)
      router.push("/orders")
    } catch (error) {
      console.error("Error placing bulk order:", error)
      let errorMessage = "There was an error placing your bulk order. Please try again."
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
        title: "Error placing bulk order",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsPlacingBulkOrder(false)
    }
  }

  return (
    <>
      {/* Mobile Categories Filter Button */}
      <div className="md:hidden flex items-center justify-between gap-3 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFilters}
          className="bg-white border-2 border-navy/20 text-navy font-bold rounded-xl h-10 px-4 shadow-sm flex items-center gap-2"
        >
          <Filter className="h-4 w-4 text-brand-red" />
          <span>Categories: <strong className="text-brand-red">{activeCategory}</strong></span>
        </Button>
      </div>

      {/* Mobile filters drawer */}
      {showFilters && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-[70] md:hidden" onClick={toggleFilters}>
          <div 
            className="absolute left-0 top-0 bottom-0 w-4/5 max-w-xs bg-white p-5 z-[80] shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-navy/10">
              <h3 className="font-extrabold text-lg text-navy flex items-center gap-2">
                <Filter className="h-5 w-5 text-brand-red" />
                Categories
              </h3>
              <Button variant="ghost" size="sm" onClick={toggleFilters} className="rounded-full h-8 w-8 p-0 text-navy">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="overflow-y-auto space-y-1.5 flex-1 pr-1">
              <button
                type="button"
                onClick={() => handleCategoryChange("All")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-between ${
                  activeCategory === "All" ? "bg-navy text-white shadow-sm" : "text-navy hover:bg-teal/20"
                }`}
              >
                <span>All Products</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold bg-navy text-white ${
                  activeCategory === "All" ? "ring-2 ring-white/60 shadow-sm" : ""
                }`}>
                  {products.length}
                </span>
              </button>
              {categories.map((cat, idx) => {
                const count = products.filter(p => productMatchesCategory(p, cat)).length
                const isActive = activeCategory === cat
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-between ${
                      isActive ? "bg-navy text-white shadow-sm" : "text-navy hover:bg-teal/20"
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold bg-navy text-white ${
                      isActive ? "ring-2 ring-white/60 shadow-sm" : ""
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Shop Layout: Left Sidebar (behind) + Products Content (in front) */}
      <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start relative">
        {/* Desktop Left-side Categories Card - Sticky in view & behind the grid */}
        <aside className="hidden md:block w-64 lg:w-72 flex-shrink-0 sticky top-24 lg:top-28 z-0">
          <div className="bg-white border-2 border-navy/20 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col max-h-[calc(100vh-8rem)]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-navy/10">
              <h3 className="font-extrabold text-base lg:text-lg text-navy flex items-center gap-2">
                <Filter className="h-4 w-4 text-brand-red" />
                Categories
              </h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-navy text-white shadow-xs">
                {products.length} Items
              </span>
            </div>
            
            {/* Independently Scrollable Category List */}
            <div className="overflow-y-auto pr-1 space-y-1.5 flex-1 min-h-0 scrollbar-thin scrollbar-thumb-teal/50 scrollbar-track-transparent">
              {/* All Products Option */}
              <button
                type="button"
                onClick={() => handleCategoryChange("All")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-between group ${
                  activeCategory === "All"
                    ? "bg-navy text-white shadow-sm"
                    : "text-navy hover:bg-teal/20"
                }`}
              >
                <span className="truncate">All Products</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold bg-navy text-white transition-all ${
                  activeCategory === "All" ? "ring-2 ring-white/60 shadow-sm" : "shadow-xs"
                }`}>
                  {products.length}
                </span>
              </button>

              {/* Category Items */}
              {categories.map((cat, idx) => {
                const count = products.filter(p => productMatchesCategory(p, cat)).length
                const isActive = activeCategory === cat
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-between group ${
                      isActive
                        ? "bg-navy text-white shadow-sm"
                        : "text-navy hover:bg-teal/20"
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold bg-navy text-white transition-all ${
                      isActive ? "ring-2 ring-white/60 shadow-sm" : "shadow-xs"
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        {/* Right-side Products Area - In front of the categories card */}
        <div className="flex-1 min-w-0 w-full relative z-10">
          {/* Shop Top Control Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mb-6 bg-white border-2 border-navy/20 p-3.5 sm:p-4 rounded-2xl shadow-md">
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

            {/* Active Category Badge & Bulk Order Toggle Button */}
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              {activeCategory !== "All" && (
                <button
                  type="button"
                  onClick={() => handleCategoryChange("All")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-navy bg-teal/30 hover:bg-teal/50 px-3 py-1.5 rounded-full transition-colors"
                  title="Clear category filter"
                >
                  <span>{activeCategory}</span>
                  <X className="h-3 w-3 text-navy/70" />
                </button>
              )}

              {filteredProducts.some(product => product.type === 'physical') && (
                <Button
                  variant={isBulkMode ? "default" : "outline"}
                  onClick={toggleBulkMode}
                  size="sm"
                  className={`text-xs sm:text-sm h-10 px-4 rounded-xl font-bold transition-all ${
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
            </div>
          </div>

          {/* Products grid */}
          <div>
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                  >
                    <ProductCard
                      product={product}
                      isBulkMode={isBulkMode}
                      bulkQuantity={getBulkQuantity(product.id)}
                      onBulkQuantityChange={updateBulkQuantity}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white border-2 border-navy/20 rounded-2xl p-8 shadow-sm">
                <Package className="mx-auto h-12 w-12 text-navy/40 mb-3" />
                <h3 className="text-xl font-bold text-navy mb-2">No products found</h3>
                <p className="text-navy/70 text-sm">Try adjusting your search query or category filter to find what you're looking for.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Order Summary - Floating Panel */}
      <HydrationSafe>
        {isBulkMode && bulkItems.size > 0 && (
          <div className="fixed bottom-4 left-2 right-2 sm:bottom-6 sm:right-6 sm:left-auto bg-white rounded-2xl shadow-2xl border-2 border-navy/20 p-3 sm:p-4 sm:max-w-sm sm:w-auto z-50">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="font-bold text-sm sm:text-lg text-navy flex items-center gap-1 sm:gap-2">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Bulk Order</span>
                <span className="sm:hidden">Order</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearBulkOrder}
                className="text-navy/60 hover:text-navy hover:bg-navy/10"
              >
                Clear
              </Button>
            </div>
            <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4 max-h-32 sm:max-h-48 overflow-y-auto">
              {getBulkItemsArray().map(({ product, quantity }) => (
                <div key={product.id} className="flex items-center gap-3 p-2 bg-navy/5 rounded-lg">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-navy truncate">{product.name}</p>
                    <p className="text-xs text-navy/70">
                      {quantity} × TZS {product.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-navy">
                      TZS {(Number(product.price) * quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-navy/20 pt-2 sm:pt-3">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="font-bold text-sm sm:text-lg text-navy">Total:</span>
                <span className="font-bold text-sm sm:text-lg text-navy">
                  TZS {getBulkTotal().toLocaleString()}
                </span>
              </div>
              <Button
                className="w-full bg-navy hover:bg-brand-red text-white rounded-full text-xs sm:text-sm h-9 sm:h-10"
                onClick={handleBulkOrderSubmission}
                disabled={isPlacingBulkOrder || authLoading}
              >
                <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                {isPlacingBulkOrder ? "Placing..." : `Place Order (${bulkItems.size})`}
              </Button>
            </div>
          </div>
        )}
      </HydrationSafe>
    </>
  )
}
