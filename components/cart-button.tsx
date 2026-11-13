"use client"

import { useCart } from "@/contexts/cart-context"
import { Badge } from "@/components/ui/badge"

export default function CartButton() {
  const { getCartItemsCount, toggleCart } = useCart()
  const itemsCount = getCartItemsCount()

  return (
    <button
      type="button"
      onClick={toggleCart}
      aria-label="View Shopping Cart"
      className="relative p-2 text-white hover:text-brand-red transition-colors flex items-center justify-center focus:outline-hidden"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 sm:h-6 sm:w-6"
      >
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
        <path d="M2.5 3.5h3l2.6 11.2a1.5 1.5 0 0 0 1.5 1.2h9.4a1.5 1.5 0 0 0 1.5-1.1l2-7.8H6.5" />
      </svg>
      {itemsCount > 0 && (
        <Badge 
          className="absolute -top-1 -right-1 h-4 w-4 sm:h-4.5 sm:w-4.5 rounded-full p-0 flex items-center justify-center bg-brand-red text-white text-[10px] font-bold border-2 border-white pointer-events-none"
        >
          {itemsCount > 99 ? "99+" : itemsCount}
        </Badge>
      )}
    </button>
  )
}