"use server"

import { RoleDefinition, AdminRoleType } from "@/lib/erp/types"
import { createServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { DEFAULT_SYSTEM_ROLES } from "@/lib/role-constants"
import fs from "fs"
import path from "path"

const ROLES_STORAGE = path.join(process.cwd(), "db", "roles_data.json")

async function readFallbackRoles(): Promise<RoleDefinition[]> {
  try {
    if (fs.existsSync(ROLES_STORAGE)) {
      const data = await fs.promises.readFile(ROLES_STORAGE, "utf-8")
      return JSON.parse(data) || DEFAULT_SYSTEM_ROLES
    }
  } catch {}
  return DEFAULT_SYSTEM_ROLES
}

async function writeFallbackRoles(roles: RoleDefinition[]): Promise<void> {
  try {
    const dir = path.dirname(ROLES_STORAGE)
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true })
    }
    await fs.promises.writeFile(ROLES_STORAGE, JSON.stringify(roles, null, 2), "utf-8")
  } catch {}
}

export async function getRoles(): Promise<RoleDefinition[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("system_roles")
      .select("*")
      .order("id")

    if (!error && data && data.length > 0) {
      const formatted: RoleDefinition[] = data.map((r: any) => ({
        id: r.id as AdminRoleType,
        name: r.name,
        description: r.description,
        badge: r.badge,
        permissions: Array.isArray(r.permissions) ? r.permissions : (typeof r.permissions === "string" ? JSON.parse(r.permissions) : [])
      }))
      await writeFallbackRoles(formatted)
      return formatted
    }

    // Auto-seed if database table is empty
    if (!error && data && data.length === 0) {
      try {
        await supabase.from("system_roles").upsert(DEFAULT_SYSTEM_ROLES.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description,
          badge: r.badge,
          permissions: r.permissions,
          is_system: true
        })))
        return DEFAULT_SYSTEM_ROLES
      } catch {}
    }
  } catch (err) {
    console.warn("Supabase roles fetch error:", err)
  }

  const local = await readFallbackRoles()
  if (local.length === 0) {
    await writeFallbackRoles(DEFAULT_SYSTEM_ROLES)
    return DEFAULT_SYSTEM_ROLES
  }
  return local
}

export async function updateRolePermissions(roleId: AdminRoleType, permissions: string[]): Promise<RoleDefinition | null> {
  const roles = await getRoles()
  const role = roles.find(r => r.id === roleId)
  if (!role) return null

  role.permissions = permissions

  try {
    const supabase = createServerClient()
    await supabase.from("system_roles").upsert({
      id: role.id,
      name: role.name,
      description: role.description,
      badge: role.badge,
      permissions: permissions,
      updated_at: new Date().toISOString()
    })
  } catch (err) {
    console.warn("Role permissions DB update fallback:", err)
  }

  const list = await readFallbackRoles()
  const idx = list.findIndex(r => r.id === roleId)
  if (idx !== -1) {
    list[idx].permissions = permissions
    await writeFallbackRoles(list)
  }

  revalidatePath("/admin/roles")
  return role
}

export async function getRoleById(roleId: AdminRoleType): Promise<RoleDefinition | undefined> {
  const roles = await getRoles()
  return roles.find(r => r.id === roleId)
}
