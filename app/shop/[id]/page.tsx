import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import ProductDetail from "@/components/shop/product-detail"
import { getProductById, getProductsByCategory } from "@/lib/product-actions"

interface ProductDetailPageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const productId = Number(params.id)
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

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const productId = Number(params.id)

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

      <ProductDetail product={product} relatedProducts={filteredRelatedProducts} />

      <Footer />
    </main>
  )
}
