import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyAdminToken } from "@/lib/auth-token"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Extract admin session token from cookie or Authorization header
  const authHeader = request.headers.get("authorization")
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null
  const cookieToken = request.cookies.get("admin-session")?.value
  const token = cookieToken || bearerToken

  const session = await verifyAdminToken(token)
  const isAuthenticated = !!session

  // 1. Enforce protection on all /api/admin routes (JSON 401 for APIs)
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

  // 2. Enforce protection on all /admin UI pages
  if (pathname.startsWith("/admin")) {
    const isLoginPage = pathname === "/admin/login"

    // If not authenticated and trying to access protected admin page
    if (!isAuthenticated && !isLoginPage) {
      const loginUrl = new URL("/admin/login", request.url)
      loginUrl.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // If already authenticated and trying to access the login page
    if (isAuthenticated && isLoginPage) {
      const redirectTo = request.nextUrl.searchParams.get("redirectTo") || "/admin/dashboard"
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
  ],
}

