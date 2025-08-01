import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { verifyAdminSession } from "@/lib/admin-auth"

export async function middleware(request: NextRequest) {
  // Only apply middleware to admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Allow access to admin login page
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next()
    }

    // Check admin authentication for all other admin routes
    try {
      const { isAdmin } = await verifyAdminSession()
      
      if (!isAdmin) {
        // Redirect to admin login
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
    } catch (error) {
      console.error("Middleware authentication error:", error)
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*'
}
