"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { Product } from "@/types/database"
import { useToast } from "@/components/ui/use-toast"

const STORAGE_KEY = "quardcube_wishlist_v1"

interface WishlistContextType {
  items: Product[]
  isInWishlist: (productId: number) => boolean
  toggleWishlist: (product: Product) => void
  addToWishlist: (product: Product) => void
  removeFromWishlist: (productId: number) => void
  clearWishlist: () => void
  totalCount: number
  isOpen: boolean
  openWishlist: () => void
  closeWishlist: () => void
  toggleWishlistDrawer: () => void
}

const WishlistContext = createContext<WishlistContextType | null>(null)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Product[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const { toast } = useToast()

  // Load from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            setItems(parsed)
          }
        }
      }
    } catch (e) {
      console.warn("Failed to load wishlist from localStorage:", e)
    } finally {
      setIsHydrated(true)
    }
  }, [])

  // Sync to localStorage on update
  useEffect(() => {
    if (!isHydrated) return
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
      }
    } catch (e) {
      console.warn("Failed to persist wishlist to localStorage:", e)
    }
  }, [items, isHydrated])

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue)
          if (Array.isArray(updated)) {
            setItems(updated)
          }
        } catch {
          // ignore corrupted data
        }
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange)
      return () => window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const isInWishlist = useCallback(
    (productId: number): boolean => {
      return items.some((item) => item.id === productId)
    },
    [items]
  )

  const addToWishlist = useCallback(
    (product: Product) => {
      setItems((prev) => {
        if (prev.some((item) => item.id === product.id)) return prev
        return [product, ...prev]
      })
      toast({
        title: "Added to Wishlist",
        description: `${product.name} saved to your wishlist.`,
        duration: 3000,
      })
    },
    [toast]
  )

  const removeFromWishlist = useCallback(
    (productId: number) => {
      let removedName = ""
      setItems((prev) => {
        const found = prev.find((item) => item.id === productId)
        if (found) removedName = found.name
        return prev.filter((item) => item.id !== productId)
      })
      if (removedName) {
        toast({
          title: "Removed from Wishlist",
          description: `${removedName} removed from your wishlist.`,
          duration: 2500,
        })
      }
    },
    [toast]
  )

  const toggleWishlist = useCallback(
    (product: Product) => {
      setItems((prev) => {
        const exists = prev.some((item) => item.id === product.id)
        if (exists) {
          toast({
            title: "Removed from Wishlist",
            description: `${product.name} removed from your wishlist.`,
            duration: 2500,
          })
          return prev.filter((item) => item.id !== product.id)
        } else {
          toast({
            title: "Added to Wishlist",
            description: `${product.name} saved to your wishlist.`,
            duration: 3000,
          })
          return [product, ...prev]
        }
      })
    },
    [toast]
  )

  const clearWishlist = useCallback(() => {
    setItems([])
    toast({
      title: "Wishlist Cleared",
      description: "All items have been removed from your wishlist.",
      duration: 2500,
    })
  }, [toast])

  const openWishlist = useCallback(() => setIsOpen(true), [])
  const closeWishlist = useCallback(() => setIsOpen(false), [])
  const toggleWishlistDrawer = useCallback(() => setIsOpen((prev) => !prev), [])

  return (
    <WishlistContext.Provider
      value={{
        items,
        isInWishlist,
        toggleWishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        totalCount: items.length,
        isOpen,
        openWishlist,
        closeWishlist,
        toggleWishlistDrawer,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}
