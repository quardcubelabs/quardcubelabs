import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyAdminToken } from "@/lib/auth-token"

// Top-level admin routes in the app/admin structure
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

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone()
  const { pathname } = request.nextUrl
  const hostname = request.headers.get("host") || ""
  
  // Extract hostname without port (e.g. admin.quardcubelabs.co.tz or admin.localhost:3000)
  const host = hostname.split(":")[0].toLowerCase()
  const isAdminSubdomain = host.startsWith("admin.")
  const isLocalDev = host === "localhost" || host === "127.0.0.1" || process.env.NODE_ENV !== "production"

  // Verify Admin Session Token (cookie or Bearer header)
  const authHeader = request.headers.get("authorization")
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null
  const cookieToken = request.cookies.get("admin-session")?.value
  const token = cookieToken || bearerToken

  const session = await verifyAdminToken(token)
  const isAuthenticated = !!session

  // -------------------------------------------------------------
  // 1. API ADMIN ROUTE PROTECTION (/api/admin/*)
  // -------------------------------------------------------------
  if (pathname.startsWith("/api/admin")) {
    if (!isAuthenticated) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Valid admin authentication token or session required to access admin endpoints.",
          code: "UNAUTHORIZED_ADMIN_ACCESS",
        },
        { status: 401 }
      )
    }
    return NextResponse.next()
  }

  // -------------------------------------------------------------
  // 2. ADMIN SUBDOMAIN (e.g. admin.quardcubelabs.co.tz, admin.localhost)
  // -------------------------------------------------------------
  if (isAdminSubdomain) {
    // Root URL: When searching admin.quardcubelabs.co.tz
    if (pathname === "" || pathname === "/") {
      if (isAuthenticated) {
        url.pathname = "/admin/dashboard"
        return NextResponse.rewrite(url)
      } else {
        // Show login page immediately
        url.pathname = "/admin/login"
        return NextResponse.rewrite(url)
      }
    }

    // Direct /login path on subdomain
    if (pathname === "/login") {
      if (isAuthenticated) {
        const redirectTo = request.nextUrl.searchParams.get("redirectTo") || "/dashboard"
        return NextResponse.redirect(new URL(redirectTo, request.url))
      }
      url.pathname = "/admin/login"
      return NextResponse.rewrite(url)
    }

    // Direct /admin/* paths on subdomain
    if (pathname.startsWith("/admin")) {
      const isLoginPage = pathname === "/admin/login"
      if (!isAuthenticated && !isLoginPage) {
        const loginUrl = new URL("/admin/login", request.url)
        loginUrl.searchParams.set("redirectTo", pathname)
        return NextResponse.redirect(loginUrl)
      }
      if (isAuthenticated && isLoginPage) {
        const redirectTo = request.nextUrl.searchParams.get("redirectTo") || "/admin/dashboard"
        return NextResponse.redirect(new URL(redirectTo, request.url))
      }
      return NextResponse.next()
    }

    // First segment check (e.g. /orders -> "orders")
    const segments = pathname.split("/").filter(Boolean)
    const firstSegment = segments[0]

    if (ADMIN_PATHS.includes(firstSegment)) {
      if (!isAuthenticated) {
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("redirectTo", pathname)
        return NextResponse.redirect(loginUrl)
      }
      url.pathname = `/admin${pathname}`
      return NextResponse.rewrite(url)
    }

    // Consumer pages (e.g. /shop, /about, /cart) are not found on admin subdomain
    url.pathname = "/not-found"
    return NextResponse.rewrite(url, { status: 404 })
  }

  // -------------------------------------------------------------
  // 3. LOCAL DEVELOPMENT CONVENIENCE (localhost:3000)
  // -------------------------------------------------------------
  if (isLocalDev && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
    const isLoginPage = pathname === "/admin/login"
    if (!isAuthenticated && !isLoginPage) {
      const loginUrl = new URL("/admin/login", request.url)
      loginUrl.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(loginUrl)
    }
    if (isAuthenticated && isLoginPage) {
      const redirectTo = request.nextUrl.searchParams.get("redirectTo") || "/admin/dashboard"
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    return NextResponse.next()
  }

  // -------------------------------------------------------------
  // 4. PRODUCTION MAIN DOMAIN (quardcubelabs.co.tz)
  // -------------------------------------------------------------
  // Completely hide /admin on main domain with 404 (no redirect)
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    url.pathname = "/not-found"
    return NextResponse.rewrite(url, { status: 404 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api/* (except /api/admin/* which is handled above)
     * - /_next/* (Next.js internals: static files and image optimizer)
     * - Static media files
     */
    "/((?!api/(?!admin)|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|pdf)$).*)",
  ],
}
