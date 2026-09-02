"use client"

import { useEffect, use } from "react"
import AdminInvoiceDetailPage from "../page"

interface PrintPageProps {
  params: Promise<{ id: string }>
}

export default function AdminInvoicePrintPage({ params }: PrintPageProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print()
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  return <AdminInvoiceDetailPage params={params} />
}
