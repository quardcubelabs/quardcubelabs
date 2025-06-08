"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import ProductCard from "@/components/shop/product-card"
import { Button } from "@/components/ui/button"
import { Search, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { Product } from "@/lib/product-actions"

type ShopContentProps = {
  initialProducts: Product[]
  categories: string[]
}

export default function ShopContent({ initialProducts, categories }: ShopContentProps) {
  const [activeCategory, setActiveCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [products, setProducts] = useState(initialProducts)
  const [filteredProducts, setFilteredProducts] = useState(initialProducts)

  // Filter products when category or search query changes
  const filterProducts = () => {
    let filtered = [...products]

    // Filter by category
    if (activeCategory !== "All") {
      filtered = filtered.filter((product) => product.category === activeCategory)
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
      filtered = filtered.filter((product) => product.category === category)
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

    // Apply category filter
    if (activeCategory !== "All") {
      filtered = filtered.filter((product) => product.category === activeCategory)
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
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={toggleFilters}>
          <div
            className="absolute right-0 top-0 bottom-0 w-3/4 max-w-xs bg-white p-4 z-50"
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

        {/* Products grid */}
        <div className="flex-1">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <ProductCard product={product} />
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
    </>
  )
}
