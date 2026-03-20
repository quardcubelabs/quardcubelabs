import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import ProductDetail from "@/components/shop/product-detail"
import { getProductById, getProductsByCategory } from "@/lib/product-actions"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://quardcube.vercel.app"

interface ProductDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const productId = Number(id)
  const product = await getProductById(productId)

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  return {
    title: `${product.name} | QuardCube Labs`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.image],
    },
  }
}

// Generate JSON-LD structured data for Google
function generateProductJsonLd(product: {
  id: number
  name: string
  description: string
  image: string
  price: number
  stock: number
  category: string
  rating: number
  swatchImages?: string[]
}) {
  const images = [product.image, ...(product.swatchImages || [])].filter(Boolean)

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: images,
    sku: `QCL-${product.id}`,
    mpn: `QCL-${product.id}`,
    brand: {
      "@type": "Brand",
      name: "QuardCubeLabs",
    },
    category: product.category,
    aggregateRating: product.rating > 0 ? {
      "@type": "AggregateRating",
      ratingValue: product.rating.toString(),
      reviewCount: "1",
      bestRating: "5",
      worstRating: "1",
    } : undefined,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/shop/${product.id}`,
      priceCurrency: "TZS",
      price: product.price.toString(),
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      itemCondition: "https://schema.org/NewCondition",
      availability: product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "QuardCubeLabs",
      },
    },
  }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params
  const productId = Number(id)

  // Fetch product from Supabase
  const product = await getProductById(productId)

  if (!product) {
    notFound()
  }

  // Fetch related products (same category, excluding current product)
  const relatedProducts = await getProductsByCategory(product.category)
  const filteredRelatedProducts = relatedProducts.filter((p) => p.id !== productId).slice(0, 4)

  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
      <Navbar />

      {/* Google Product Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateProductJsonLd(product)),
        }}
      />

      <ProductDetail product={product} relatedProducts={filteredRelatedProducts} />

      <Footer />
    </main>
  )
}
