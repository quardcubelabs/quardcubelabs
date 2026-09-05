import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyAdminToken } from "@/lib/auth-token"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only apply protection to /admin routes
  if (pathname.startsWith("/admin")) {
    const isLoginPage = pathname === "/admin/login"
    
    // Read the admin session cookie containing signed token
    const token = request.cookies.get("admin-session")?.value
    const session = await verifyAdminToken(token)
    const isAuthenticated = !!session

    // 1. If not authenticated and trying to access protected admin page
    if (!isAuthenticated && !isLoginPage) {
      const loginUrl = new URL("/admin/login", request.url)
      // Save the target path so the user can be redirected after successful login
      loginUrl.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // 2. If already authenticated and trying to access the login page
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
  ],
}
