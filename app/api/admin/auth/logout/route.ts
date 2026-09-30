import { NextResponse } from "next/server"

export async function POST() {
  try {
    const response = NextResponse.json({ success: true })
    response.cookies.delete("admin-session")
    return response
  } catch (error) {
    console.error("[AdminAuth API] Logout exception:", error)
    return NextResponse.json({ success: false, error: "Logout failed" }, { status: 500 })
  }
}
