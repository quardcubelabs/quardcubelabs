"use client"

import { Package } from "lucide-react"
import { useOrders } from "@/contexts/order-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function OrdersIcon() {
  const { orders } = useOrders()

  return (
    <Link href="/orders">
      <Button variant="ghost" className="relative p-1 sm:p-2">
        <Package className="h-5 w-5 sm:h-6 sm:w-6 text-navy" />
        {orders.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-brand-red text-[9px] sm:text-[10px] font-bold text-white">
            {orders.length}
          </span>
        )}
      </Button>
    </Link>
  )
} 