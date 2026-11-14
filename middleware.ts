import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = getClientIp(request.headers)

  // 1. Skip static assets, _next internal files, favicon, etc.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/fonts") ||
    pathname.includes(".") // static files like favicon.ico, robots.txt, etc.
  ) {
    return NextResponse.next()
  }

  // 2. Strict Rate Limiting for Auth & Login Endpoints (Anti-Brute Force / Anti-DDoS)
  const isAuthRoute =
    pathname.startsWith("/api/admin/auth/login") ||
    pathname.startsWith("/auth/login") ||
    pathname.startsWith("/auth/register") ||
    pathname.startsWith("/auth/forgot-password")

  if (isAuthRoute) {
    // Max 12 attempts per minute per IP on login/register endpoints
    const authLimit = checkRateLimit(`auth:${ip}`, 12, 60 * 1000)
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
              "X-RateLimit-Limit": String(authLimit.limit),
              "X-RateLimit-Remaining": "0",
            },
          }
        )
      } else {
        // Return 429 page response
        return new NextResponse(
          `<!DOCTYPE html><html><head><title>Too Many Requests</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>Security Notice: Too Many Requests</h2><p>For your security, please wait ${authLimit.resetInSeconds} seconds before attempting to sign in again.</p></body></html>`,
          {
            status: 429,
            headers: {
              "Content-Type": "text/html",
              "Retry-After": String(authLimit.resetInSeconds),
            },
          }
        )
      }
    }
  }

  // 3. API Global Rate Limiting (Anti-Scraping / Anti-Flooding)
  if (pathname.startsWith("/api/")) {
    // Max 90 API requests per minute per IP
    const apiLimit = checkRateLimit(`api:${ip}`, 90, 60 * 1000)
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

  // 4. DDoS Protection on General Routes (300 requests/minute per IP)
  const generalLimit = checkRateLimit(`gen:${ip}`, 300, 60 * 1000)
  if (!generalLimit.allowed) {
    return new NextResponse(
      "Service temporarily unavailable due to high request volume from this IP. Please wait.",
      {
        status: 429,
        headers: {
          "Retry-After": String(generalLimit.resetInSeconds),
        },
      }
    )
  }

  // 5. Admin Panel Security Gateway
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const adminSession = request.cookies.get("admin-session")
    if (!adminSession?.value) {
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // 6. Process request and apply enterprise security headers & hide server signatures
  const response = NextResponse.next()

  // Remove framework/server identification headers
  response.headers.delete("x-powered-by")
  response.headers.delete("server")
  response.headers.delete("X-AspNet-Version")

  // Enterprise Security Headers
  response.headers.set("X-Frame-Options", "SAMEORIGIN")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  )

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
