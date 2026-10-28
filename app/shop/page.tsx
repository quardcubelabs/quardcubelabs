import { Suspense } from "react"
import type { Metadata } from "next"
import Footer from "@/components/footer"
import ShopContent from "@/components/shop/shop-content"
import Loading from "@/components/loading"
import { getCategories, getProducts } from "@/lib/product-actions"

export const metadata: Metadata = {
  title: "Shop - QuardCubeLabs",
  description: "Browse our wide selection of IT products and services including laptops, desktops, components, gaming systems, and professional IT solutions.",
}

interface ShopPageProps {
  searchParams: Promise<{
    category?: string
  }>
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { category } = await searchParams

  const categoriesPromise = getCategories()
  const productsPromise = getProducts()

  const [categories, products] = await Promise.all([categoriesPromise, productsPromise])

  const MAIN_CATEGORIES = [
    "Laptops",
    "Desktops",
    "Gaming",
    "Components",
    "Peripherals",
    "Storage",
    "Networking",
    "Tablets",
    "UPS",
    "Powerstations",
    "Cash Counting Machines",
    "Software",
    "Digital Codes",
    "Gadgets & Accessories",
  ]

  const SUBCATEGORY_MAP: Record<string, string> = {
    "New Laptops": "Laptops",
    "Refurbished Laptops": "Laptops",
    "All-in-One": "Desktops",
    "Gaming Laptops": "Gaming",
    "Gaming Desktop": "Gaming",
    "Gaming Chairs": "Gaming",
    "Gaming Accessories": "Gaming",
    "Monitors": "Components",
    "Computer Monitors": "Components",
    "Graphics Card": "Components",
    "Motherboard": "Components",
    "RAM Memory": "Components",
    "Processors": "Components",
    "Power Supply": "Components",
    "CPU Cooling": "Components",
    "PC Cases": "Components",
    "PC Case Fans": "Components",
    "Printers": "Peripherals",
    "Keyboard/Mouse": "Peripherals",
    "Headphones & Speakers": "Peripherals",
    "Webcam": "Peripherals",
    "Laptop Bags": "Peripherals",
    "Laptop Chargers": "Peripherals",
    "Cables & Dongles": "Peripherals",
    "Toners and Ink": "Peripherals",
    "Monitor Stands": "Peripherals",
    "Power Banks": "Peripherals",
    "Solid State Drives": "Storage",
    "Internal Hard Drives": "Storage",
    "External Hard Drives": "Storage",
    "USB Flash Disk": "Storage",
    "SD & Micro SD Cards": "Storage",
    "HDD Cases & Racks": "Storage",
    "Routers/Switches": "Networking",
    "WiFi Adapters": "Networking",
    "Smartphones": "Gadgets & Accessories",
    "Tablets": "Tablets",
    "iPads": "Tablets",
    "UPS": "UPS",
    "Power Backup": "UPS",
    "Powerstations": "Powerstations",
    "Portable Power Stations": "Powerstations",
    "Cash Counting Machines": "Cash Counting Machines",
    "Currency Counters": "Cash Counting Machines",
    "Money Counters": "Cash Counting Machines",
    "CCTV Cameras": "Gadgets & Accessories",
    "Software": "Software",
    "Anti-virus": "Software",
    "Operating Systems": "Software",
    "Office": "Software",
    "Digital Codes": "Digital Codes",
    "Apple Gift Card": "Digital Codes",
  }

  const categoryNames = Array.from(
    new Set([
      ...MAIN_CATEGORIES,
      ...(categories || []).map((c) => c.name),
    ])
  )

  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none z-20"></div>

      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">
              Shop Our <span className="gradient-text">Products</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-navy/80 max-w-3xl mx-auto">
              Browse our selection of high-quality technology products designed for businesses of all sizes
            </p>
          </div>

          <Suspense fallback={<Loading />}>
            <ShopContent
              initialProducts={products}
              categories={categoryNames}
              initialCategory={category || "All"}
              subcategoryMap={SUBCATEGORY_MAP}
            />
          </Suspense>
        </div>
      </section>

      <Footer />
    </main>
  )
}
