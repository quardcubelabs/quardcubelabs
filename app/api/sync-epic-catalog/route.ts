import { NextRequest, NextResponse } from 'next/server'
import { synchronizeOriginCatalog } from '@/lib/origin-scraper'
import { verifyAdminSession } from '@/lib/admin-auth'

export const maxDuration = 180 // allow up to 3 minutes for catalog scrape and origin sync

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
    const originDomain = typeof body.originDomain === 'string' ? body.originDomain : 'all'
    const batchLimit = typeof body.batchLimit === 'number' ? body.batchLimit : 100

    const result = await synchronizeOriginCatalog({
      dryRun,
      originDomain,
      batchLimit,
      userEmail: user?.email,
      userName: user?.staffMember?.full_name || user?.name || user?.email,
      branchId: user?.staffMember?.branch_id,
      branchName: user?.staffMember?.branch_name,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to synchronize catalog with origin websites' },
        { status: 500 }
      )
    }

    // Format compatibility response for both epicSyncResult and originSyncResult formats
    const formattedResult = {
      ...result,
      summary: {
        totalInDatabase: result.summary.totalInDatabase,
        scrapedFromEpic: result.summary.scanned,
        matched: result.summary.matchedWithOrigin,
        updated: result.summary.pricesUpdated,
        added: result.summary.markedInStock,
        unlisted: result.summary.markedOutOfStock + result.summary.removedFromOrigin,
        unchanged: result.summary.unchanged,
        ...result.summary,
      },
      updatedProducts: result.priceUpdates.map(p => ({
        id: p.id,
        name: p.name,
        oldPrice: p.oldPrice,
        newPrice: p.newPrice,
        rawEpicPrice: p.rawOriginPrice || 0,
        difference: p.priceDifference,
        sourceDomain: p.sourceDomain,
      })),
      unlistedProducts: result.outOfStockProducts.concat(result.removedProducts).map(p => ({
        id: p.id,
        name: p.name,
        price: p.newPrice,
        category: p.sourceDomain,
        stock: p.newStock,
        reason: p.isRemovedFromOrigin ? 'Removed from origin site' : 'Marked Out of Stock on origin site',
      })),
      addedProducts: result.stockUpdates.filter(s => s.inStock).map(p => ({
        id: p.id,
        name: p.name,
        category: p.sourceDomain,
        price: p.newPrice,
        rawEpicPrice: p.rawOriginPrice || 0,
        stock: p.newStock,
        epicUrl: p.sourceUrl,
      })),
    }

    return NextResponse.json(formattedResult)
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
    const originDomain = searchParams.get('origin') || 'all'

    const result = await synchronizeOriginCatalog({
      dryRun,
      originDomain,
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
