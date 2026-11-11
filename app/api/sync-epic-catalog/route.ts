import { NextRequest, NextResponse } from 'next/server'
import { synchronizeEpicCatalog } from '@/lib/epic-scraper'
import { verifyAdminSession } from '@/lib/admin-auth'

export const maxDuration = 180 // allow up to 3 minutes for full catalog scrape and db sync

export async function POST(request: NextRequest) {
  try {
    const { isAdmin, user } = await verifyAdminSession()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin privileges required to synchronize catalog' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const dryRun = Boolean(body.dryRun)

    const result = await synchronizeEpicCatalog({
      dryRun,
      userEmail: user?.email,
      userName: user?.staffMember?.full_name || user?.name || user?.email,
      branchId: user?.staffMember?.branch_id,
      branchName: user?.staffMember?.branch_name,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to synchronize catalog with Epic Computers' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in sync-epic-catalog POST:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { isAdmin, user } = await verifyAdminSession()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin privileges required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const dryRun = searchParams.get('apply') !== 'true'

    const result = await synchronizeEpicCatalog({
      dryRun,
      userEmail: user?.email,
      userName: user?.staffMember?.full_name || user?.name || user?.email,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in sync-epic-catalog GET:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
