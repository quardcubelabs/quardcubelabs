import { MetadataRoute } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://quardcube.vercel.app"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/products.xml"],
        disallow: ["/admin/", "/api/", "/auth/"],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/products.xml", "/api/feeds/google-merchant"],
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
