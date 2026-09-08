import { NextRequest, NextResponse } from "next/server"
import { crawlBondsAndNews, type StockExchangeCode } from "@/lib/bonds-crawler"
import { encryptData } from "@/lib/crypto-vault"

export const dynamic = "force-dynamic"
export const maxDuration = 30 // Support up to 30s for web scraping

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const forceRefresh = searchParams.get("refresh") === "true"
    const exchange = searchParams.get("exchange") as StockExchangeCode | "ALL" | null
    const region = searchParams.get("region")
    const sector = searchParams.get("sector")
    const search = searchParams.get("search")?.toLowerCase()

    const result = await crawlBondsAndNews(forceRefresh)

    let filteredBonds = result.bonds

    if (exchange && exchange !== "ALL") {
      filteredBonds = filteredBonds.filter((b) => b.exchange === exchange)
    }

    if (region && region !== "all") {
      filteredBonds = filteredBonds.filter((b) => b.region.toLowerCase().includes(region.toLowerCase()))
    }

    if (sector && sector !== "all") {
      filteredBonds = filteredBonds.filter((b) => b.sector.toLowerCase() === sector.toLowerCase())
    }

    if (search) {
      filteredBonds = filteredBonds.filter(
        (b) =>
          b.issuer.toLowerCase().includes(search) ||
          b.ticker.toLowerCase().includes(search) ||
          b.country.toLowerCase().includes(search) ||
          b.isin.toLowerCase().includes(search) ||
          b.exchange.toLowerCase().includes(search) ||
          b.exchangeName.toLowerCase().includes(search)
      )
    }

    const responsePayload = {
      ...result,
      bonds: filteredBonds,
      totalFiltered: filteredBonds.length,
    }

    // Encrypt payload with AES-256-GCM
    const encryptedPayload = await encryptData(responsePayload)

    return NextResponse.json({
      success: true,
      encrypted: true,
      payload: encryptedPayload,
    })
  } catch (error: any) {
    console.error("Bonds API Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to retrieve corporate bonds data",
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const result = await crawlBondsAndNews(true)

    return NextResponse.json({
      success: true,
      data: result,
      message: "Multi-exchange corporate bonds telemetry recrawled and synchronized successfully.",
    })
  } catch (error: any) {
    console.error("Bonds API Refresh Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to refresh bonds crawler telemetry",
      },
      { status: 500 }
    )
  }
}
