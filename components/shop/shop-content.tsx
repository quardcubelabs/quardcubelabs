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

  // Hooks
  const { toast } = useToast()
  const { user, isLoading: authLoading } = useAuth()
  const { addOrder } = useOrders()
  const router = useRouter()

  // Helper: check if a product belongs to a main category (including its subcategories)
  const productMatchesCategory = (product: Product, category: string) => {
    if (category === "All") return true
    if (product.category === category) return true
    // Check if the product's category is a subcategory of the selected main category
    return subcategoryMap[product.category] === category
  }

  // Filter products when component mounts or initial category changes
  useEffect(() => {
    if (initialCategory && initialCategory !== "All") {
      const filtered = initialProducts.filter((product) => productMatchesCategory(product, initialCategory))
      setFilteredProducts(filtered)
      setActiveCategory(initialCategory)
    } else {
      setFilteredProducts(initialProducts)
    }
  }, [initialCategory, initialProducts])

  // Filter products when category or search query changes
  const filterProducts = () => {
    let filtered = [...products]

    // Filter by category (including subcategories)
    if (activeCategory !== "All") {
      filtered = filtered.filter((product) => productMatchesCategory(product, activeCategory))
    }

    // Filter by search query
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

  // Update filtered products when category changes
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
    setShowFilters(false)

    // Update filtered products
    let filtered = [...products]

    if (category !== "All") {
      filtered = filtered.filter((product) => productMatchesCategory(product, category))
    }

    // Also apply search filter if there's a search query
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

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    // Update filtered products
    let filtered = [...products]

    // Apply category filter (including subcategories)
    if (activeCategory !== "All") {
      filtered = filtered.filter((product) => productMatchesCategory(product, activeCategory))
    }

    // Apply search filter
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

  // Bulk order functions
  const updateBulkQuantity = (productId: number, quantity: number) => {
    const product = products.find(p => p.id === productId)
    // Only allow bulk ordering for physical products
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
      // Convert bulk items to order items format
      const orderItems = getBulkItemsArray().map(({ product, quantity }) => ({
        id: String(product.id),
        name: product.name,
        quantity: quantity,
        price: Number(product.price),
        image: product.image
      }))

      const total = getBulkTotal()

      // Get customer info from user metadata
      const customerInfo = {
        name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Customer',
        email: user?.email || '',
        address: user?.user_metadata?.address || 'Address not provided',
        phone: user?.user_metadata?.phone || ''
      }

      await addOrder(orderItems, total, customerInfo)

      toast({
        title: "Bulk order placed successfully!",
        description: `Your order with ${bulkItems.size} different products has been placed. Check your email for invoice details.`,
        duration: 5000,
      })

      // Clear bulk order and exit bulk mode
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
      {/* Mobile search and filter toggle */}
      <div className="flex items-center justify-between mb-4 md:hidden">
        <div className="relative flex-1 mr-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy/50 h-4 w-4" />
          <Input
            type="search"
            placeholder="Search products..."
            className="pl-10 bg-white/70 border-navy/20 focus:border-navy rounded-full w-full"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2 border-navy/20 text-navy" onClick={toggleFilters}>
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Mobile filters drawer */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 z-[60] md:hidden" onClick={toggleFilters}>
          <div
            className="absolute right-0 top-0 bottom-0 w-3/4 max-w-xs bg-white p-4 z-[70]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Filters</h3>
              <Button variant="ghost" size="sm" onClick={toggleFilters}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-2">
              {categories.map((category, index) => (
                <Button
                  key={index}
                  variant={activeCategory === category ? "default" : "outline"}
                  className={`w-full justify-start ${
                    activeCategory === category
                      ? "bg-navy hover:bg-navy/90 text-white border-0"
                      : "text-navy border-navy/20 hover:text-navy hover:border-navy"
                  }`}
                  onClick={() => handleCategoryChange(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Desktop sidebar filters */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-32">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy/50 h-4 w-4" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-10 bg-white/70 border-navy/20 focus:border-navy rounded-full w-full"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            <h3 className="font-bold text-lg mb-3">Categories</h3>
            <div className="space-y-2">
              {categories.map((category, index) => (
                <Button
                  key={index}
                  variant={activeCategory === category ? "default" : "outline"}
                  className={`w-full justify-start ${
                    activeCategory === category
                      ? "bg-navy hover:bg-navy/90 text-white border-0"
                      : "text-navy border-navy/20 hover:text-white hover:border-brand-red"
                  }`}
                  onClick={() => handleCategoryChange(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Products grid */}
        <div className="flex-1">
          {/* Shop Header with Bulk Order Toggle - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
            <div className="flex items-center gap-2 sm:gap-4">
              <h2 className="text-base sm:text-xl font-bold text-navy">
                {activeCategory === "All" ? "All Products" : activeCategory}
              </h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Only show bulk order for physical products */}
              {filteredProducts.some(product => product.type === 'physical') && (
                <Button
                  variant={isBulkMode ? "default" : "outline"}
                  onClick={toggleBulkMode}
                  size="sm"
                  className={`text-xs sm:text-sm h-8 sm:h-10 px-3 sm:px-4 ${
                    isBulkMode
                      ? "bg-navy hover:bg-navy/90 text-white"
                      : "border-navy/20 text-navy hover:bg-navy hover:text-white"
                  }`}
                >
                  {isBulkMode ? (
                    <>
                      <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Exit Bulk Mode</span>
                      <span className="sm:hidden">Exit Bulk</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Bulk Order</span>
                      <span className="sm:hidden">Bulk</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
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
            <div className="text-center py-16">
              <h3 className="text-xl font-medium mb-2">No products found</h3>
              <p className="text-navy/70">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Order Summary - Floating Panel - Mobile Optimized */}
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
                    <p className="font-medium text-sm text-navy truncate">
                      {product.name}
                    </p>
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
