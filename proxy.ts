import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyAdminToken } from "./lib/auth-token"
import { checkRateLimit, getClientIp } from "./lib/security/rate-limiter"

// Complete list of top-level admin paths in app/admin/(protected)
const ADMIN_PATHS = [
  "dashboard",
  "login",
  "accounting",
  "analytics",
  "applications",
  "blogs",
  "bonds",
  "branches",
  "cctv",
  "credit-notes",
  "crm",
  "expenses",
  "help",
  "invoices",
  "orders",
  "positions",
  "products",
  "proforma-invoices",
  "projects",
  "purchases",
  "quotations",
  "receipts",
  "reports",
  "roles",
  "services",
  "settings",
  "staff",
  "suppliers",
  "users",
]

/**
 * The retired inventory pages are folded into Products. Keep old bookmarks working
 * by sending them to the consolidated screens instead of a dead 404.
 */
function legacyInventoryRedirect(pathname: string): string | null {
  if (pathname === "/inventory" || pathname === "/admin/inventory") return "/admin/products"
  if (
    pathname.startsWith("/inventory/serials") ||
    pathname.startsWith("/admin/inventory/serials")
  ) {
    return "/admin/products/serials"
  }
  if (pathname.startsWith("/inventory") || pathname.startsWith("/admin/inventory")) {
    return "/admin/products"
  }
  return null
}

function applySecurityHeaders(res: NextResponse): NextResponse {
  // Strip framework and server footprint
  res.headers.delete("x-powered-by")
  res.headers.delete("server")
  res.headers.delete("X-AspNet-Version")

  // Enterprise cybersecurity headers
  res.headers.set("X-Frame-Options", "SAMEORIGIN")
  res.headers.set("X-Content-Type-Options", "nosniff")
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  )
  return res
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone()
  const { pathname } = request.nextUrl
  const ip = getClientIp(request.headers)
  const hostname = request.headers.get("host") || ""
  
  // Extract hostname without port (e.g. admin.quardcubelabs.co.tz, quardcubelabs.co.tz, admin.localhost:3000)
  const host = hostname.split(":")[0].toLowerCase()
  const isAdminSubdomain = host.startsWith("admin.")
  const isLocalDev = host === "localhost" || host === "127.0.0.1" || host.endsWith(".local") || process.env.NODE_ENV !== "production"

  // -------------------------------------------------------------
  // 1. RATE LIMITING (Anti-Brute Force, Anti-DDoS, Anti-Scraping)
  // -------------------------------------------------------------
  const isAuthRoute =
    pathname.startsWith("/api/admin/auth/login") ||
    pathname.startsWith("/auth/login") ||
    pathname.startsWith("/auth/register") ||
    pathname.startsWith("/auth/forgot-password")

  if (isAuthRoute) {
    const authLimit = checkRateLimit(`auth:${ip}`, 15, 60 * 1000)
    if (!authLimit.allowed) {
      if (pathname.startsWith("/api/")) {
        return new NextResponse(
          JSON.stringify({
            error: "Too many login attempts. Please wait a minute before trying again.",
            retryAfter: authLimit.resetInSeconds,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(authLimit.resetInSeconds),
            },
          }
        )
      }
      return applySecurityHeaders(
        new NextResponse(
          `<!DOCTYPE html><html><head><title>Too Many Requests</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>Security Notice: Too Many Requests</h2><p>For your security, please wait ${authLimit.resetInSeconds} seconds before attempting to sign in again.</p></body></html>`,
          {
            status: 429,
            headers: {
              "Content-Type": "text/html",
              "Retry-After": String(authLimit.resetInSeconds),
            },
          }
        )
      )
    }
  }

  // API rate limiting
  if (pathname.startsWith("/api/")) {
    const apiLimit = checkRateLimit(`api:${ip}`, 120, 60 * 1000)
    if (!apiLimit.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: "Rate limit exceeded. Please slow down your requests.",
          retryAfter: apiLimit.resetInSeconds,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(apiLimit.resetInSeconds),
          },
        }
      )
    }
  }

  // -------------------------------------------------------------
  // 2. VERIFY ADMIN SESSION TOKEN
  // -------------------------------------------------------------
  const authHeader = request.headers.get("authorization")
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null
  const cookieToken = request.cookies.get("admin-session")?.value
  const token = cookieToken || bearerToken

  // Token verification is async crypto work: only do it where auth can affect routing.
  // Public marketing/shop pages never read isAuthenticated, so skip verification there.
  const needsAdminAuth =
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/admin") ||
    isAdminSubdomain

  const session = needsAdminAuth ? await verifyAdminToken(token) : null
  const isAuthenticated = !!session

  // -------------------------------------------------------------
  // 3. MAIN DOMAIN PRODUCTION ENFORCEMENT:
  // Completely hide /admin and /api/admin/* from the main domain.
  // Probing the main domain returns 404 (Not Found) with no hint.
  // -------------------------------------------------------------
  if (!isAdminSubdomain && !isLocalDev) {
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      url.pathname = "/not-found"
      return applySecurityHeaders(NextResponse.rewrite(url, { status: 404 }))
    }

    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 })
    }
  }

  // Retired inventory URLs -> consolidated product stock screens
  const legacyInventoryPath = legacyInventoryRedirect(pathname)
  if (legacyInventoryPath) {
    return applySecurityHeaders(NextResponse.redirect(new URL(legacyInventoryPath, request.url)))
  }

  // -------------------------------------------------------------
  // 4. API ADMIN ROUTE PROTECTION (/api/admin/*)
  // -------------------------------------------------------------
  if (pathname.startsWith("/api/admin")) {
    // Exclude public auth endpoints
    if (
      pathname === "/api/admin/auth/login" ||
      pathname === "/api/admin/auth/verify" ||
      pathname === "/api/admin/auth/logout" ||
      pathname.startsWith("/api/admin/auth/")
    ) {
      return applySecurityHeaders(NextResponse.next())
    }

    if (!isAuthenticated) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Valid admin authentication token or session required.",
          code: "UNAUTHORIZED_ADMIN_ACCESS",
        },
        { status: 401 }
      )
    }
    return applySecurityHeaders(NextResponse.next())
  }

  // -------------------------------------------------------------
  // 5. ADMIN SUBDOMAIN ROUTING (e.g. admin.quardcubelabs.co.tz, admin.localhost)
  // -------------------------------------------------------------
  if (isAdminSubdomain) {
    // Root URL on admin subdomain
    if (pathname === "" || pathname === "/") {
      if (isAuthenticated) {
        url.pathname = "/admin/dashboard"
        return applySecurityHeaders(NextResponse.rewrite(url))
      } else {
        url.pathname = "/admin/login"
        return applySecurityHeaders(NextResponse.rewrite(url))
      }
    }

    // Direct /login path on subdomain
    if (pathname === "/login") {
      if (isAuthenticated) {
        const redirectTo = request.nextUrl.searchParams.get("redirectTo") || "/dashboard"
        return applySecurityHeaders(NextResponse.redirect(new URL(redirectTo, request.url)))
      }
      url.pathname = "/admin/login"
      return applySecurityHeaders(NextResponse.rewrite(url))
    }

    // Explicit /admin/* paths on subdomain
    if (pathname.startsWith("/admin")) {
      const isLoginPage = pathname === "/admin/login"
      if (!isAuthenticated && !isLoginPage) {
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("redirectTo", pathname.replace(/^\/admin/, "") || "/dashboard")
        return applySecurityHeaders(NextResponse.redirect(loginUrl))
      }
      if (isAuthenticated && isLoginPage) {
        const redirectTo = request.nextUrl.searchParams.get("redirectTo") || "/dashboard"
        return applySecurityHeaders(NextResponse.redirect(new URL(redirectTo, request.url)))
      }
      return applySecurityHeaders(NextResponse.next())
    }

    // Top-level admin subpaths on subdomain (e.g. /dashboard, /products, /orders, /staff)
    const segments = pathname.split("/").filter(Boolean)
    const firstSegment = segments[0]

    if (ADMIN_PATHS.includes(firstSegment)) {
      if (!isAuthenticated) {
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("redirectTo", pathname)
        return applySecurityHeaders(NextResponse.redirect(loginUrl))
      }
      url.pathname = `/admin${pathname}`
      return applySecurityHeaders(NextResponse.rewrite(url))
    }

    // Consumer e-commerce pages (e.g. /shop, /about, /cart) are not found on the admin subdomain
    url.pathname = "/not-found"
    return applySecurityHeaders(NextResponse.rewrite(url, { status: 404 }))
  }

  // -------------------------------------------------------------
  // 6. LOCAL DEVELOPMENT CONVENIENCE (/admin on localhost:3000)
  // -------------------------------------------------------------
  if (isLocalDev && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
    const isLoginPage = pathname === "/admin/login"

    if (!isAuthenticated && !isLoginPage) {
      const loginUrl = new URL("/admin/login", request.url)
      loginUrl.searchParams.set("redirectTo", pathname)
      return applySecurityHeaders(NextResponse.redirect(loginUrl))
    }

    if (isAuthenticated && isLoginPage) {
      const redirectTo = request.nextUrl.searchParams.get("redirectTo") || "/admin/dashboard"
      return applySecurityHeaders(NextResponse.redirect(new URL(redirectTo, request.url)))
    }

    return applySecurityHeaders(NextResponse.next())
  }

  // -------------------------------------------------------------
  // 7. PUBLIC MAIN DOMAIN: PASS THROUGH WITH ENTERPRISE HEADERS
  // -------------------------------------------------------------
  return applySecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api/* (except /api/admin/* which is handled above)
     * - /_next/* (Next.js internals: static files and image optimizer)
     * - Static media and asset files
     */
    "/((?!api/(?!admin)|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|pdf)$).*)",
  ],
}
