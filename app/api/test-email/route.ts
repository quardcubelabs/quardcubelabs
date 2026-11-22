import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailConfig } from '@/lib/email-service'
import { verifyAdminSession } from '@/lib/admin-auth'

export async function GET() {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 })
    }

    const isValid = await verifyEmailConfig()
    
    return NextResponse.json({
      success: isValid,
      message: isValid ? 'Email configuration is valid' : 'Email configuration failed',
      config: {
        hostConfigured: !!process.env.SMTP_HOST,
        portConfigured: !!process.env.SMTP_PORT,
        userConfigured: !!process.env.SMTP_USER,
        passwordConfigured: !!process.env.SMTP_PASSWORD,
        smtp2goApiConfigured: !!process.env.SMTP2GO_API_KEY
      }
    })
  } catch (error) {
    console.error('Email test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Email diagnostic service encountered an error'
      },
      { status: 500 }
    )
  }
}
