import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailConfig } from '@/lib/email-service'

export async function GET() {
  try {
    console.log('Testing email configuration...')
    console.log('SMTP_HOST:', process.env.SMTP_HOST)
    console.log('SMTP_PORT:', process.env.SMTP_PORT)
    console.log('SMTP_USER:', process.env.SMTP_USER)
    console.log('SMTP_PASSWORD length:', process.env.SMTP_PASSWORD?.length)
    
    const isValid = await verifyEmailConfig()
    
    return NextResponse.json({
      success: isValid,
      message: isValid ? 'Email configuration is valid' : 'Email configuration failed',
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        passwordConfigured: !!process.env.SMTP_PASSWORD
      }
    })
  } catch (error) {
    console.error('Email test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      },
      { status: 500 }
    )
  }
}
