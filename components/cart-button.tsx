"use client"

import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/cart-context"
import { Badge } from "@/components/ui/badge"

export default function CartButton() {
  const { getCartItemsCount, toggleCart } = useCart()
  const itemsCount = getCartItemsCount()

  return (
    <Button
      variant="outline"
      size="sm"
      className="relative text-navy border-navy/20 hover:bg-brand-red hover:text-white hover:border-brand-red"
      onClick={toggleCart}
    >
      <ShoppingCart className="h-4 w-4" />
      <span className="hidden sm:inline ml-2">Cart</span>
      {itemsCount > 0 && (
        <Badge 
          className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-brand-red text-white text-xs"
        >
          {itemsCount > 99 ? "99+" : itemsCount}
        </Badge>
      )}
    </Button>
  )
}