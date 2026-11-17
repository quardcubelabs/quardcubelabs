import { redirect, permanentRedirect } from "next/navigation"

interface LegacyProductPageProps {
  params: Promise<{ id: string }>
}

export default async function LegacyProductPage({ params }: LegacyProductPageProps) {
  const { id } = await params
  // Permanently redirect legacy /shop/product/[id] URLs to canonical /shop/[id]
  permanentRedirect(`/shop/${id}`)
}
