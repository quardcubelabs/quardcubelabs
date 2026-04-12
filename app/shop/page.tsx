import { Suspense } from "react"
import type { Metadata } from "next"
import Navbar from "@/components/navbar"
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
  
  // Fetch data from Supabase
  const categoriesPromise = getCategories()
  const productsPromise = getProducts()

  // Wait for both promises to resolve
  const [categories, products] = await Promise.all([categoriesPromise, productsPromise])

  // Define the 10 main categories to display in the shop
  const MAIN_CATEGORIES = [
    "Laptops",
    "Desktops",
    "Gaming",
    "Components",
    "Peripherals",
    "Storage",
    "Networking",
    "Gadgets & Accessories",
    "Software",
    "Digital Codes",
  ]

  // Map subcategories to their parent main category
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
    "Tablets": "Gadgets & Accessories",
    "CCTV Cameras": "Gadgets & Accessories",
    "Anti-virus": "Software",
    "Operating Systems": "Software",
    "Office": "Software",
    "Apple Gift Card": "Digital Codes",
  }

  // Only pass the main category names to the shop UI
  const categoryNames = MAIN_CATEGORIES

  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
      <Navbar />

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
