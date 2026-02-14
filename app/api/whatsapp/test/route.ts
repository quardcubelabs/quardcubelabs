import { NextRequest, NextResponse } from 'next/server'
import { whatsappService } from '@/lib/whatsapp'

export async function GET() {
  try {
    
    // Test basic connection
    const success = await whatsappService.testConnection()
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'WhatsApp integration test successful! Check your WhatsApp for the test message.' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'WhatsApp integration test failed. Check your configuration and logs.' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('WhatsApp test error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'WhatsApp integration test failed with error.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type = 'test' } = await request.json()
    
    let success = false
    let message = ''

    switch (type) {
      case 'signup':
        success = await whatsappService.notifyNewSignup('Test User', 'test@example.com')
        message = 'Test signup notification sent'
        break
        
      case 'purchase':
        success = await whatsappService.notifyNewPurchase(
          'Test Customer',
          'test@example.com',
          [{ name: 'Test Product', quantity: 2, price: 50000 }],
          100000,
          'TEST001'
        )
        message = 'Test purchase notification sent'
        break
        
      case 'quote':
        success = await whatsappService.notifyNewQuoteRequest(
          'Test Client',
          'test@example.com',
          'Web Development',
          'Test project description',
          'TZS 1,000,000'
        )
        message = 'Test quote notification sent'
        break
        
      default:
        success = await whatsappService.testConnection()
        message = 'General test message sent'
    }

    return NextResponse.json({ success, message })
  } catch (error) {
    console.error('WhatsApp test error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}