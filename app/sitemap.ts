import { MetadataRoute } from "next"
import { createServerClient } from "@/lib/supabase"
import { getCanonicalSiteUrl } from "@/lib/site-config"

const SITE_URL = getCanonicalSiteUrl()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServerClient()

  // 1. Fetch all products
  const { data: products } = await supabase
    .from("products")
    .select("id, category, name, updated_at")
    .order("id")

  // 2. Fetch all services
  const { data: services } = await supabase
    .from("services")
    .select("id, slug, updated_at, status")
    .eq("status", "active")
    .order("order_index")

  // 3. Fetch all blog posts
  const { data: blogs } = await supabase
    .from("blogs")
    .select("slug, updated_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })

  // Static core and trust pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/services`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/projects`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/careers`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/quote`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/return-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/cookie-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ]

  // Category landing pages for deep Google indexability
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
    "CCTV Cameras",
    "Gadgets & Accessories",
  ]

  const categoryPages: MetadataRoute.Sitemap = MAIN_CATEGORIES.map((cat) => ({
    url: `${SITE_URL}/shop?category=${encodeURIComponent(cat)}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.85,
  }))

  // Service landing pages (AI Automation, Web Design, CCTV, Networking, Software Dev, IT Support)
  const servicePages: MetadataRoute.Sitemap = (services || []).map((service) => ({
    url: `${SITE_URL}/services/${service.slug || service.id}`,
    lastModified: service.updated_at ? new Date(service.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }))

  // Individual Product landing pages
  const productPages: MetadataRoute.Sitemap = (products || []).map((product) => ({
    url: `${SITE_URL}/shop/${product.id}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }))

  // Blog pages
  const blogPages: MetadataRoute.Sitemap = (blogs || []).map((blog) => ({
    url: `${SITE_URL}/blog/${blog.slug}`,
    lastModified: blog.updated_at ? new Date(blog.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  return [...staticPages, ...categoryPages, ...servicePages, ...productPages, ...blogPages]
}
