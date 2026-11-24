import { MetadataRoute } from "next"
import { getCanonicalSiteUrl } from "@/lib/site-config"

const SITE_URL = getCanonicalSiteUrl()

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/shop",
          "/services",
          "/blog",
          "/about",
          "/contact",
          "/quote",
          "/projects",
          "/careers",
          "/sitemap.xml",
          "/products.xml",
          "/api/feeds/",
          "/api/product-feed",
        ],
        disallow: [
          "/admin/",
          "/auth/",
          "/checkout/",
          "/orders/",
          "/thank-you",
          "/api/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: [
          "/",
          "/shop",
          "/services",
          "/blog",
          "/about",
          "/contact",
          "/quote",
          "/projects",
          "/sitemap.xml",
          "/products.xml",
          "/api/feeds/",
          "/api/product-feed",
        ],
        disallow: ["/admin/", "/auth/", "/checkout/", "/orders/"],
      },
      {
        userAgent: "Google-StoreBot",
        allow: ["/", "/shop", "/products.xml", "/api/feeds/"],
        disallow: ["/admin/", "/auth/", "/checkout/", "/orders/"],
      },
      {
        userAgent: "Storebot-Google",
        allow: ["/", "/shop", "/products.xml", "/api/feeds/"],
        disallow: ["/admin/", "/auth/", "/checkout/", "/orders/"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/"],
        disallow: ["/admin/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
