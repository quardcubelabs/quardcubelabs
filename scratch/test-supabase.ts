import { createServerClient } from "../lib/supabase"

async function main() {
  const supabase = createServerClient()
  const { data: roles } = await supabase.from("system_roles").select("id, name, permissions")
  console.log("Current system_roles permissions:", JSON.stringify(roles, null, 2))
}

main().catch(console.error)
