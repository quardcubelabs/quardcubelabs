import { NextRequest, NextResponse } from "next/server"
import { getCorporateBondById } from "@/lib/bonds-crawler"
import { encryptData } from "@/lib/crypto-vault"

export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await getCorporateBondById(id)

    if (!result.bond) {
      return NextResponse.json(
        { success: false, error: "Corporate bond not found" },
        { status: 404 }
      )
    }

    // Encrypt payload with AES-256-GCM
    const encryptedPayload = await encryptData(result)

    return NextResponse.json({
      success: true,
      encrypted: true,
      payload: encryptedPayload,
    })
  } catch (error: any) {
    console.error("Bond Detail API Error:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to retrieve bond details" },
      { status: 500 }
    )
  }
}
