import { MetadataRoute } from "next"
import { getCanonicalSiteUrl } from "@/lib/site-config"

const SITE_URL = getCanonicalSiteUrl()

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/products.xml", "/shop/"],
        disallow: ["/admin/", "/auth/"],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/products.xml", "/api/feeds/", "/api/product-feed", "/shop/"],
        disallow: ["/admin/", "/auth/"],
      },
      {
        userAgent: "Storebot-Google",
        allow: ["/", "/shop/"],
        disallow: ["/admin/", "/auth/"],
      },
      {
        userAgent: "Google-StoreBot",
        allow: ["/", "/shop/"],
        disallow: ["/admin/", "/auth/"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
