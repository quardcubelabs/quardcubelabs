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

export async function createRole(data: {
  id: string
  name: string
  description: string
  badge?: string
  permissions?: string[]
}): Promise<{ success: boolean; role?: RoleDefinition; error?: string }> {
  try {
    const slug = data.id.toLowerCase().replace(/[^a-z0-9_]/g, "_").trim()
    if (!slug) return { success: false, error: "Invalid role identifier" }
    if (!data.name?.trim()) return { success: false, error: "Role name is required" }

    const roles = await getRoles()
    if (roles.some(r => r.id === slug)) {
      return { success: false, error: "A role with this identifier already exists" }
    }

    const newRole: RoleDefinition = {
      id: slug as AdminRoleType,
      name: data.name.trim(),
      description: data.description?.trim() || `Custom ${data.name.trim()} role`,
      badge: data.badge?.trim() || data.name.trim().toUpperCase(),
      permissions: data.permissions || []
    }

    try {
      const supabase = createServerClient()
      await supabase.from("system_roles").insert({
        id: newRole.id,
        name: newRole.name,
        description: newRole.description,
        badge: newRole.badge,
        permissions: newRole.permissions,
        is_system: false,
        created_at: new Date().toISOString()
      })
    } catch (err) {
      console.warn("Supabase insert role fallback:", err)
    }

    const list = await readFallbackRoles()
    list.push(newRole)
    await writeFallbackRoles(list)

    revalidatePath("/admin/roles")
    return { success: true, role: newRole }
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to create role" }
  }
}

const PERMISSIONS_STORAGE = path.join(process.cwd(), "db", "custom_permissions.json")

export interface CustomPermissionItem {
  id: string
  name: string
  description: string
  category: string
}

export async function getCustomPermissions(): Promise<CustomPermissionItem[]> {
  try {
    if (fs.existsSync(PERMISSIONS_STORAGE)) {
      const data = await fs.promises.readFile(PERMISSIONS_STORAGE, "utf-8")
      return JSON.parse(data) || []
    }
  } catch {}
  return []
}

export async function createPermission(data: {
  id: string
  name: string
  description: string
  category: string
}): Promise<{ success: boolean; permission?: CustomPermissionItem; error?: string }> {
  try {
    const slug = data.id.toLowerCase().replace(/[^a-z0-9_:]/g, ":").trim()
    if (!slug) return { success: false, error: "Invalid permission identifier" }
    if (!data.name?.trim()) return { success: false, error: "Permission name is required" }

    const list = await getCustomPermissions()
    if (list.some(p => p.id === slug)) {
      return { success: false, error: "A privilege with this slug already exists" }
    }

    const newPerm: CustomPermissionItem = {
      id: slug,
      name: data.name.trim(),
      description: data.description?.trim() || "",
      category: data.category?.trim() || "General Custom Privileges"
    }

    list.push(newPerm)

    const dir = path.dirname(PERMISSIONS_STORAGE)
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true })
    }
    await fs.promises.writeFile(PERMISSIONS_STORAGE, JSON.stringify(list, null, 2), "utf-8")

    revalidatePath("/admin/roles")
    return { success: true, permission: newPerm }
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to create privilege" }
  }
}
