"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight, MessageSquareQuote } from "lucide-react"
import type { Service } from "@/types/database"

interface QuoteProps {
  service: Service
}

export default function ServiceQuote({ service }: QuoteProps) {
  const router = useRouter()

  const handleGetQuote = () => {
    const params = new URLSearchParams()
    if (service.title) params.set("service", service.title)
    if (service.category) params.set("category", service.category)
    router.push(`/contact?${params.toString()}`)
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <Button
        onClick={handleGetQuote}
        className="bg-brand-red hover:bg-brand-red/90 text-white font-semibold flex items-center gap-2 px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
      >
        <MessageSquareQuote className="h-4 w-4" />
        Get Quote
        <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
      <span className="text-xs text-navy/70">
        Our enterprise team will prepare and issue an official quotation tailored to your requirements.
      </span>
    </div>
  )
}
