import { NextResponse } from "next/server"
import { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Only apply middleware to admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Allow access to admin login page
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next()
    }

    // Check admin authentication using request.cookies (Edge-compatible)
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
