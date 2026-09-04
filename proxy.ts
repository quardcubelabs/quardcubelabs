import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  // Only apply proxy to admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Allow access to admin login page
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next()
    }

    // Check admin authentication using request.cookies
    const adminSession = request.cookies.get('admin-session')
    
    if (adminSession?.value !== 'true') {
      // Redirect to admin login
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*'
}
