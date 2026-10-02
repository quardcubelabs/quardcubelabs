"use server"

import { RoleDefinition, AdminRoleType } from "@/lib/erp/types"
import { revalidatePath } from "next/cache"
import { DEFAULT_SYSTEM_ROLES } from "@/lib/role-constants"

let inMemoryRoles: RoleDefinition[] = [...DEFAULT_SYSTEM_ROLES]

export async function getRoles(): Promise<RoleDefinition[]> {
  return inMemoryRoles
}

export async function updateRolePermissions(roleId: AdminRoleType, permissions: string[]): Promise<RoleDefinition | null> {
  const role = inMemoryRoles.find(r => r.id === roleId)
  if (!role) return null

  role.permissions = permissions
  revalidatePath("/admin/roles")
  return role
}

export async function getRoleById(roleId: AdminRoleType): Promise<RoleDefinition | undefined> {
  return inMemoryRoles.find(r => r.id === roleId)
}
