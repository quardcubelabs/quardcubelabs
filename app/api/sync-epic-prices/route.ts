import { NextRequest, NextResponse } from 'next/server'
import { syncAllProductPrices } from '@/lib/epic-scraper'
import { verifyAdminSession } from '@/lib/admin-auth'

export const maxDuration = 120 // allow up to 2 minutes for full catalog scrape

export async function POST(request: NextRequest) {
  try {
    const { isAdmin, user } = await verifyAdminSession()
    
    // Parse body if present
    const body = await request.json().catch(() => ({}))
    const dryRun = Boolean(body.dryRun)

    const result = await syncAllProductPrices({
      dryRun,
      userEmail: user?.email,
      userName: user?.staffMember?.full_name || user?.name || user?.email,
      branchId: user?.staffMember?.branch_id,
      branchName: user?.staffMember?.branch_name,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to sync prices with Epic Computers' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in sync-epic-prices POST:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dryRun = searchParams.get('apply') !== 'true'

    const result = await syncAllProductPrices({ dryRun })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in sync-epic-prices GET:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
