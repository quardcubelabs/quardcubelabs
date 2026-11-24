import { createServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { assertPermission } from "@/lib/rbac"

export interface ShopDisplaySettings {
  showStockBadges: boolean // Authority toggle: display stock availability badges on shop page
  updatedAt?: string
}

const SETTINGS_ID = "shop_display_settings"

export async function getShopDisplaySettings(): Promise<ShopDisplaySettings> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("system_settings")
      .select("settings, updated_at")
      .eq("id", SETTINGS_ID)
      .maybeSingle()

    if (error || !data || !data.settings) {
      // Default: stock availability badges are hidden on customer shop page
      return {
        showStockBadges: false,
      }
    }

    return {
      showStockBadges: Boolean(data.settings.show_stock_badges),
      updatedAt: data.updated_at,
    }
  } catch (err) {
    console.error("Error reading shop display settings:", err)
    return {
      showStockBadges: false,
    }
  }
}

export async function updateShopDisplaySettings(
  settings: Partial<ShopDisplaySettings>
): Promise<{ success: boolean; settings: ShopDisplaySettings; error?: string }> {
  try {
    await assertPermission("products:manage")
    const supabase = createServerClient()
    
    // Read current first
    const current = await getShopDisplaySettings()
    const updated: ShopDisplaySettings = {
      ...current,
      ...settings,
      updatedAt: new Date().toISOString(),
    }

    const { error } = await supabase.from("system_settings").upsert(
      {
        id: SETTINGS_ID,
        settings: {
          show_stock_badges: updated.showStockBadges,
        },
        updated_at: updated.updatedAt,
      },
      { onConflict: "id" }
    )

    if (error) {
      console.error("Failed to update shop display settings:", error)
      return { success: false, settings: current, error: error.message }
    }

    try {
      revalidatePath("/shop")
      revalidatePath("/admin/products")
    } catch {}

    return { success: true, settings: updated }
  } catch (err: any) {
    console.error("Exception updating shop display settings:", err)
    return {
      success: false,
      settings: { showStockBadges: false },
      error: err?.message || "Failed to save settings",
    }
  }
}
