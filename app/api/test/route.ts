import { NextResponse } from 'next/server'

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not Found", { status: 404 })
  }

  return NextResponse.json({ 
    message: 'API route working',
    timestamp: new Date().toISOString() 
  })
}