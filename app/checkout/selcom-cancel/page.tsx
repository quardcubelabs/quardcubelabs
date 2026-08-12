"use client"

import { useRouter } from "next/navigation"
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SelcomCancelPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-6">
          <XCircle className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-navy mb-2">Payment Cancelled</h1>
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. No charges were made. You can try again or continue shopping.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/shop")}
            className="flex-1 border-navy/20 text-navy"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
          <Button
            onClick={() => router.push("/checkout")}
            className="flex-1 bg-navy hover:bg-navy/90 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
}
