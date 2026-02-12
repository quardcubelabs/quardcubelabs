import { MetadataRoute } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://quardcube.vercel.app"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/"],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/api/feeds/google-merchant"],
        disallow: ["/admin/", "/auth/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
