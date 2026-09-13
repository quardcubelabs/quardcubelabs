import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Valid top-level admin paths inside the app/admin structure
const ADMIN_PATHS = [
  "dashboard",
  "login",
  "analytics",
  "applications",
  "blogs",
  "bonds",
  "cctv",
  "invoices",
  "orders",
  "positions",
  "products",
  "projects",
  "quotations",
  "reports",
  "services",
  "settings",
  "users",
]

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get("host") || ""
  
  // Extract clean hostname without port
  const host = hostname.split(":")[0].toLowerCase()
  const isAdminSubdomain = host.startsWith("admin.")
  const isLocalDev = host === "localhost" || host === "127.0.0.1" || process.env.NODE_ENV !== "production"

  // -------------------------------------------------------------
  // 1. ADMIN SUBDOMAIN (e.g. admin.quardcubelabs.co.tz, admin.localhost:3000)
  // -------------------------------------------------------------
  if (isAdminSubdomain) {
    // Root URL on admin subdomain -> rewrites to /admin/login so the login portal opens immediately
    if (url.pathname === "" || url.pathname === "/") {
      url.pathname = "/admin/login"
      return NextResponse.rewrite(url)
    }

    // Direct /admin/* requests on the subdomain are passed through
    if (url.pathname.startsWith("/admin")) {
      return NextResponse.next()
    }

    // Get the first path segment (e.g. "/orders/123" -> "orders")
    const segments = url.pathname.split("/").filter(Boolean)
    const firstSegment = segments[0]

    // If it's a known admin section, rewrite internally to /admin/<path>
    if (ADMIN_PATHS.includes(firstSegment)) {
      url.pathname = `/admin${url.pathname}`
      return NextResponse.rewrite(url)
    }

    // All other consumer paths (e.g. /shop, /about, /cart) are not found on the admin subdomain
    url.pathname = "/not-found"
    return NextResponse.rewrite(url, { status: 404 })
  }

  // -------------------------------------------------------------
  // 2. LOCAL DEVELOPMENT CONVENIENCE
  // -------------------------------------------------------------
  // During local development (localhost:3000), allow accessing /admin directly
  // so you can develop and test without needing local DNS modifications.
  if (isLocalDev && (url.pathname === "/admin" || url.pathname.startsWith("/admin/"))) {
    return NextResponse.next()
  }

  // -------------------------------------------------------------
  // 3. PRODUCTION MAIN DOMAIN (quardcubelabs.co.tz)
  // -------------------------------------------------------------
  // In production, block /admin on the main domain completely with a 404 (no redirect).
  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
    url.pathname = "/not-found"
    return NextResponse.rewrite(url, { status: 404 })
  }

  // Allow all normal public website routes
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api/* (API endpoints)
     * - /_next/* (Next.js static assets and image optimizer)
     * - Static assets (*.svg, *.png, *.jpg, *.jpeg, *.webp, *.ico, *.pdf, *.json, etc.)
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|pdf)$).*)",
  ],
}
