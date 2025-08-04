import { createServerClient } from "@/lib/supabase"

export type SystemSettings = {
  general: {
    siteName: string
    siteDescription: string
    contactEmail: string
    supportEmail: string
    timezone: string
    language: string
    currency: string
  }
  appearance: {
    theme: string
    primaryColor: string
    logoUrl: string
    faviconUrl: string
    customCSS: string
  }
  notifications: {
    orderNotifications: boolean
    lowStockAlerts: boolean
    userRegistration: boolean
    paymentAlerts: boolean
    systemUpdates: boolean
    emailDigest: boolean
  }
  security: {
    twoFactorAuth: boolean
    sessionTimeout: boolean
    timeoutDuration: number
    maxLoginAttempts: number
    passwordMinLength: number
    requireStrongPassword: boolean
  }
  payment: {
    stripeEnabled: boolean
    paypalEnabled: boolean
    vodacomEnabled: boolean
    testMode: boolean
    currency: string
    taxRate: number
  }
  email: {
    provider: string
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpSecure: boolean
    fromName: string
    fromEmail: string
  }
}

const SETTINGS_ID = "main" // single row for all settings

export async function getSystemSettings(): Promise<{ settings: SystemSettings | null, error: string | null }> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("system_settings")
    .select("settings")
    .eq("id", SETTINGS_ID)
    .single()
  if (error) return { settings: null, error: error.message }
  return { settings: data?.settings || null, error: null }
}

export async function saveSystemSettings(settings: SystemSettings): Promise<{ success: boolean, error: string | null }> {
  const supabase = createServerClient()
  const { error } = await supabase
    .from("system_settings")
    .upsert({ id: SETTINGS_ID, settings }, { onConflict: "id" })
  if (error) return { success: false, error: error.message }
  return { success: true, error: null }
}
