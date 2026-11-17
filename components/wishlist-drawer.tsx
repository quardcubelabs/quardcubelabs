"use client"

import React, { useEffect } from "react"
import { X, Heart, ShoppingBag, Trash2, ArrowRight, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useWishlist } from "@/contexts/wishlist-context"
import { useCart } from "@/contexts/cart-context"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function WishlistDrawer() {
  const { items, isOpen, closeWishlist, removeFromWishlist, clearWishlist } = useWishlist()
  const { addToCart, openCart } = useCart()
  const router = useRouter()

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeWishlist()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, closeWishlist])

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleMoveToCart = (product: any) => {
    addToCart(product)
    removeFromWishlist(product.id)
    closeWishlist()
    openCart()
  }

  const handleAddAllToCart = () => {
    const inStockItems = items.filter((p) => (p.stock || 0) > 0)
    inStockItems.forEach((product) => {
      addToCart(product)
    })
    closeWishlist()
    openCart()
  }

  return (
    <>
      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[65] transition-opacity animate-in fade-in"
        onClick={closeWishlist}
        aria-hidden="true"
      />

      {/* Slide-out Drawer */}
      <aside
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-white z-[75] shadow-2xl flex flex-col border-l-2 border-navy/15 transition-transform duration-300 ease-in-out animate-in slide-in-from-right"
        role="dialog"
        aria-label="Saved Wishlist Items"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b-2 border-navy/10 bg-teal/15">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red">
              <Heart className="w-5 h-5 fill-brand-red text-brand-red" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-navy leading-tight flex items-center gap-2">
                My Wishlist
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-navy text-white">
                  {items.length}
                </span>
              </h2>
              <p className="text-[11px] text-navy/60 font-semibold">
                Saved items to purchase later
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeWishlist}
            className="w-8 h-8 rounded-full border border-navy/20 flex items-center justify-center text-navy hover:text-brand-red hover:bg-white transition-colors"
            aria-label="Close Wishlist"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-teal/20 border-2 border-navy/20 flex items-center justify-center text-navy mb-4 shadow-sm">
                <Heart className="w-8 h-8 text-navy/40" />
              </div>
              <h3 className="text-lg font-black text-navy mb-1.5">Your wishlist is empty</h3>
              <p className="text-xs sm:text-sm text-navy/70 max-w-xs mb-6">
                Explore our catalog and click the heart icon on any product to save your favorites for later.
              </p>
              <Button
                onClick={() => {
                  closeWishlist()
                  router.push("/shop")
                }}
                className="bg-navy text-white hover:bg-teal hover:text-navy border-2 border-navy font-bold rounded-xl px-5 py-2.5 shadow-sm transition-all"
              >
                Browse Shop <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          ) : (
            items.map((product) => {
              const isOutOfStock = (product.stock || 0) === 0
              const priceNum = Number(product.price) || 0

              return (
                <div
                  key={product.id}
                  className="group relative p-3 sm:p-3.5 rounded-2xl border-2 border-navy/15 bg-white hover:border-navy hover:shadow-md transition-all flex gap-3 items-center"
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/shop/${product.id}`}
                    onClick={closeWishlist}
                    className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl border border-navy/15 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-102 transition-transform"
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain p-1"
                        loading="lazy"
                      />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-navy/30" />
                    )}
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Badge className="bg-brand-red text-white text-[9px] font-bold px-1.5 py-0 rounded">
                        {product.category}
                      </Badge>
                      {isOutOfStock ? (
                        <span className="text-[9px] font-bold text-brand-red uppercase">
                          Sold Out
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-emerald-600 uppercase">
                          In Stock
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/shop/${product.id}`}
                      onClick={closeWishlist}
                      className="block font-bold text-xs sm:text-sm text-navy hover:text-brand-red transition-colors line-clamp-1"
                      title={product.name}
                    >
                      {product.name}
                    </Link>

                    <p className="text-xs sm:text-sm font-black text-navy mt-1">
                      TZS {priceNum.toLocaleString()}
                    </p>

                    {/* Move to Cart button */}
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMoveToCart(product)}
                        disabled={isOutOfStock}
                        className="text-[11px] font-bold px-3 py-1 rounded-lg bg-navy text-white hover:bg-teal hover:text-navy border border-navy transition-all flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        Move to Cart
                      </button>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-navy/40 hover:text-brand-red hover:bg-red-50 transition-colors"
                    title="Remove from wishlist"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t-2 border-navy/10 bg-slate-50/70 space-y-2.5">
            <Button
              onClick={handleAddAllToCart}
              className="w-full bg-navy text-white hover:bg-teal hover:text-navy border-2 border-navy font-bold rounded-xl py-2.5 shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Add All to Cart
            </Button>
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={clearWishlist}
                className="text-navy/60 hover:text-brand-red font-semibold transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Wishlist
              </button>
              <button
                type="button"
                onClick={() => {
                  closeWishlist()
                  router.push("/shop")
                }}
                className="text-navy font-bold hover:underline flex items-center gap-1"
              >
                Continue Shopping <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
