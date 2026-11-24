import { NextRequest, NextResponse } from "next/server";
import { getShopDisplaySettings, updateShopDisplaySettings } from "@/lib/shop-settings";
import { verifyAdminSession } from "@/lib/admin-auth";

export async function GET() {
  try {
    const settings = await getShopDisplaySettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to get shop display settings:", error);
    return NextResponse.json({ showStockBadges: false }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { isAdmin } = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
    }

    const body = await req.json();
    const { showStockBadges } = body;

    if (typeof showStockBadges !== "boolean") {
      return NextResponse.json({ error: "showStockBadges must be a boolean" }, { status: 400 });
    }

    const updated = await updateShopDisplaySettings({ showStockBadges });
    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error("Failed to update shop display settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
