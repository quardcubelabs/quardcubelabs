"use server"

import { StaffMember, AdminRoleType } from "@/lib/erp/types"
import { createServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import fs from "fs"
import path from "path"

const STAFF_STORAGE = path.join(process.cwd(), "db", "staff_data.json")

const DEFAULT_STAFF: StaffMember[] = [
  {
    id: "stf-01",
    staff_code: "STF-101",
    full_name: "Framani Mwamba",
    email: "framani@quardcubelabs.co.tz",
    phone: "+255623893383",
    role: "owner_admin",
    branch_id: "br-01",
    branch_name: "QuardCube HQ & Innovation Hub",
    status: "active",
    joined_date: "2024-01-15",
    last_active: "Just now"
  },
  {
    id: "stf-02",
    staff_code: "STF-102",
    full_name: "Sarah Kweka",
    email: "sarah.k@quardcubelabs.co.tz",
    phone: "+255754123456",
    role: "manager",
    branch_id: "br-02",
    branch_name: "City Mall Flagship Store",
    status: "active",
    joined_date: "2024-03-10",
    last_active: "10 mins ago"
  },
  {
    id: "stf-03",
    staff_code: "STF-103",
    full_name: "David Kimaro",
    email: "david.k@quardcubelabs.co.tz",
    phone: "+255762112233",
    role: "accountant",
    branch_id: "br-01",
    branch_name: "QuardCube HQ & Innovation Hub",
    status: "active",
    joined_date: "2024-02-01",
    last_active: "25 mins ago"
  },
  {
    id: "stf-04",
    staff_code: "STF-104",
    full_name: "Bakari Juma",
    email: "bakari.j@quardcubelabs.co.tz",
    phone: "+255788990011",
    role: "stock_manager",
    branch_id: "br-03",
    branch_name: "Kariakoo Wholesale Depot",
    status: "active",
    joined_date: "2024-04-18",
    last_active: "1 hour ago"
  },
  {
    id: "stf-05",
    staff_code: "STF-105",
    full_name: "Amina Rashid",
    email: "amina.r@quardcubelabs.co.tz",
    phone: "+255714556677",
    role: "cashier",
    branch_id: "br-02",
    branch_name: "City Mall Flagship Store",
    status: "active",
    joined_date: "2024-06-01",
    last_active: "5 mins ago"
  },
  {
    id: "stf-06",
    staff_code: "STF-106",
    full_name: "Grace Mollel",
    email: "grace.m@quardcubelabs.co.tz",
    phone: "+255762334455",
    role: "manager",
    branch_id: "br-04",
    branch_name: "Arusha Northern Branch",
    status: "active",
    joined_date: "2024-05-12",
    last_active: "2 hours ago"
  },
  {
    id: "stf-07",
    staff_code: "STF-107",
    full_name: "Kelvin Mushi",
    email: "kelvin.m@quardcubelabs.co.tz",
    phone: "+255755889900",
    role: "cashier",
    branch_id: "br-01",
    branch_name: "QuardCube HQ & Innovation Hub",
    status: "active",
    joined_date: "2024-07-20",
    last_active: "15 mins ago"
  },
  {
    id: "stf-08",
    staff_code: "STF-108",
    full_name: "Neema Lyimo",
    email: "neema.l@quardcubelabs.co.tz",
    phone: "+255768223344",
    role: "cashier",
    branch_id: "br-03",
    branch_name: "Kariakoo Wholesale Depot",
    status: "active",
    joined_date: "2024-08-10",
    last_active: "30 mins ago"
  }
]

async function readFallbackStaff(): Promise<StaffMember[]> {
  try {
    if (fs.existsSync(STAFF_STORAGE)) {
      const data = await fs.promises.readFile(STAFF_STORAGE, "utf-8")
      return JSON.parse(data) || DEFAULT_STAFF
    }
  } catch {}
  return DEFAULT_STAFF
}

async function writeFallbackStaff(staff: StaffMember[]): Promise<void> {
  try {
    const dir = path.dirname(STAFF_STORAGE)
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true })
    }
    await fs.promises.writeFile(STAFF_STORAGE, JSON.stringify(staff, null, 2), "utf-8")
  } catch {}
}

export async function getStaffMembers(): Promise<StaffMember[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("staff_members")
      .select("*")
      .order("staff_code", { ascending: true })

    if (!error && data && data.length > 0) {
      await writeFallbackStaff(data as StaffMember[])
      return data as StaffMember[]
    }

    // Auto-seed if table is empty
    if (!error && data && data.length === 0) {
      try {
        await supabase.from("staff_members").upsert(DEFAULT_STAFF)
        return DEFAULT_STAFF
      } catch {}
    }
  } catch (err) {
    console.warn("Supabase staff fetch error:", err)
  }

  const local = await readFallbackStaff()
  if (local.length === 0) {
    await writeFallbackStaff(DEFAULT_STAFF)
    return DEFAULT_STAFF
  }
  return local
}

export interface CreateStaffInput extends Partial<StaffMember> {
  password?: string
  send_invite?: boolean
}

export async function getStaffMemberById(id: string): Promise<StaffMember | null> {
  const staff = await getStaffMembers()
  return staff.find(s => s.id === id || s.staff_code === id || s.email === id) || null
}

export async function createStaffMember(data: CreateStaffInput): Promise<StaffMember> {
  const existingStaff = await getStaffMembers()
  const codeNum = existingStaff.length + 101
  const cleanEmail = (data.email || `staff${codeNum}@quardcubelabs.co.tz`).trim().toLowerCase()
  const cleanFullName = (data.full_name || "New Team Member").trim()
  const staffRole = (data.role as AdminRoleType) || "cashier"

  const newStaff: StaffMember = {
    id: `stf-${Date.now()}`,
    staff_code: data.staff_code || `STF-${codeNum}`,
    full_name: cleanFullName,
    email: cleanEmail,
    phone: data.phone || "+255623893383",
    role: staffRole,
    branch_id: data.branch_id || "br-01",
    branch_name: data.branch_name || "QuardCube HQ & Innovation Hub",
    status: data.status || "active",
    joined_date: data.joined_date || new Date().toISOString().split("T")[0],
    last_active: "Just now"
  }

  try {
    const supabase = createServerClient()
    await supabase.from("staff_members").insert(newStaff)

    // Handle authentication credentials provision in Supabase Auth
    if (data.password && data.password.trim().length >= 6) {
      try {
        const { data: usersData } = await supabase.auth.admin.listUsers()
        const existingUser = usersData?.users?.find(u => u.email?.toLowerCase() === cleanEmail)
        
        let authUserId = ""
        if (existingUser) {
          authUserId = existingUser.id
          await supabase.auth.admin.updateUserById(existingUser.id, {
            password: data.password.trim(),
            email_confirm: true,
            user_metadata: {
              full_name: cleanFullName,
              phone: newStaff.phone,
              role: staffRole,
              branch_id: newStaff.branch_id,
              branch_name: newStaff.branch_name,
              staff_code: newStaff.staff_code,
            },
            app_metadata: {
              role: staffRole
            }
          })
        } else {
          const { data: createdAuth, error: authError } = await supabase.auth.admin.createUser({
            email: cleanEmail,
            password: data.password.trim(),
            email_confirm: true,
            user_metadata: {
              full_name: cleanFullName,
              phone: newStaff.phone,
              role: staffRole,
              branch_id: newStaff.branch_id,
              branch_name: newStaff.branch_name,
              staff_code: newStaff.staff_code,
            },
            app_metadata: {
              role: staffRole
            }
          })
          if (createdAuth?.user) {
            authUserId = createdAuth.user.id
          }
          if (authError) {
            console.warn("[StaffActions] Supabase createUser warning:", authError.message)
          }
        }

        if (authUserId) {
          await supabase.from("profiles").upsert({
            id: authUserId,
            email: cleanEmail,
            full_name: cleanFullName,
            role: staffRole,
            updated_at: new Date().toISOString()
          }, { onConflict: "id" })
        }
      } catch (authErr) {
        console.warn("[StaffActions] Failed provisioning auth user for staff:", authErr)
      }
    } else if (data.send_invite) {
      try {
        await supabase.auth.admin.inviteUserByEmail(cleanEmail, {
          data: {
            full_name: cleanFullName,
            role: staffRole,
            phone: newStaff.phone,
            branch_id: newStaff.branch_id,
            branch_name: newStaff.branch_name,
            staff_code: newStaff.staff_code,
          }
        })
      } catch (inviteErr) {
        console.warn("[StaffActions] Failed sending staff invite email:", inviteErr)
      }
    }
  } catch (err) {
    console.warn("Staff saved to DB fallback:", err)
  }

  const list = await readFallbackStaff()
  list.unshift(newStaff)
  await writeFallbackStaff(list)

  revalidatePath("/admin/staff")
  return newStaff
}

export async function updateStaffMember(
  id: string, 
  updates: Partial<StaffMember> & { password?: string; send_invite?: boolean }
): Promise<StaffMember | null> {
  const list = await readFallbackStaff()
  const idx = list.findIndex(s => s.id === id || s.staff_code === id)
  if (idx === -1 && !id) return null

  const targetStaff = list[idx]
  const updated: StaffMember = {
    ...(targetStaff || {}),
    ...updates,
    id: id,
    last_active: updates.last_active || "Updated just now"
  } as StaffMember

  if (idx !== -1) {
    list[idx] = updated
  } else {
    list.unshift(updated)
  }
  await writeFallbackStaff(list)

  try {
    const supabase = createServerClient()
    await supabase.from("staff_members").update(updates).eq("id", id)

    // Synchronize updates and optional password changes with Supabase Auth
    const targetEmail = (updated.email || "").trim().toLowerCase()
    if (targetEmail) {
      try {
        const { data: usersData } = await supabase.auth.admin.listUsers()
        const existingUser = usersData?.users?.find(u => u.email?.toLowerCase() === targetEmail)
        
        if (existingUser) {
          const authUpdates: any = {
            user_metadata: {
              full_name: updated.full_name,
              phone: updated.phone,
              role: updated.role,
              branch_id: updated.branch_id,
              branch_name: updated.branch_name,
              staff_code: updated.staff_code,
            },
            app_metadata: {
              role: updated.role
            }
          }
          if (updates.password && updates.password.trim().length >= 6) {
            authUpdates.password = updates.password.trim()
          }

          await supabase.auth.admin.updateUserById(existingUser.id, authUpdates)
          await supabase.from("profiles").upsert({
            id: existingUser.id,
            email: targetEmail,
            full_name: updated.full_name,
            role: updated.role,
            updated_at: new Date().toISOString()
          }, { onConflict: "id" })
        } else if (updates.password && updates.password.trim().length >= 6) {
          // User was not created in Auth before, create now
          await supabase.auth.admin.createUser({
            email: targetEmail,
            password: updates.password.trim(),
            email_confirm: true,
            user_metadata: {
              full_name: updated.full_name,
              phone: updated.phone,
              role: updated.role,
              branch_id: updated.branch_id,
              branch_name: updated.branch_name,
              staff_code: updated.staff_code,
            },
            app_metadata: {
              role: updated.role
            }
          })
        }
      } catch (authErr) {
        console.warn("[StaffActions] Auth sync error on update:", authErr)
      }
    }
  } catch (err) {
    console.warn("Staff updated in DB fallback:", err)
  }

  revalidatePath("/admin/staff")
  return updated
}

export async function resetStaffPassword(emailOrId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!newPassword || newPassword.trim().length < 6) {
      return { success: false, error: "Password must be at least 6 characters." }
    }

    const staff = await getStaffMemberById(emailOrId)
    const targetEmail = (staff?.email || emailOrId).trim().toLowerCase()

    const supabase = createServerClient()
    const { data: usersData } = await supabase.auth.admin.listUsers()
    const existingUser = usersData?.users?.find(u => u.email?.toLowerCase() === targetEmail)

    if (existingUser) {
      const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password: newPassword.trim(),
        email_confirm: true
      })
      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true }
    } else {
      // Create user if not existing in Auth
      const { error } = await supabase.auth.admin.createUser({
        email: targetEmail,
        password: newPassword.trim(),
        email_confirm: true,
        user_metadata: {
          full_name: staff?.full_name || "Staff Member",
          role: staff?.role || "cashier",
          staff_code: staff?.staff_code || ""
        },
        app_metadata: {
          role: staff?.role || "cashier"
        }
      })
      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true }
    }
  } catch (error: any) {
    console.error("[StaffActions] resetStaffPassword error:", error)
    return { success: false, error: error.message || "Failed to reset password." }
  }
}

export async function sendStaffInvite(emailOrId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const staff = await getStaffMemberById(emailOrId)
    const targetEmail = (staff?.email || emailOrId).trim().toLowerCase()

    const supabase = createServerClient()
    const { error } = await supabase.auth.admin.inviteUserByEmail(targetEmail, {
      data: {
        full_name: staff?.full_name || "Staff Member",
        role: staff?.role || "cashier",
        staff_code: staff?.staff_code || ""
      }
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("[StaffActions] sendStaffInvite error:", error)
    return { success: false, error: error.message || "Failed to send invitation email." }
  }
}

export async function toggleStaffStatus(id: string): Promise<string> {
  const staff = await getStaffMemberById(id)
  if (!staff) return "inactive"

  const newStatus = staff.status === "active" ? "inactive" : "active"
  await updateStaffMember(id, { status: newStatus as any })
  return newStatus
}

export async function deleteStaffMember(id: string): Promise<boolean> {
  try {
    const staff = await getStaffMemberById(id)
    const supabase = createServerClient()
    await supabase.from("staff_members").delete().eq("id", id)

    // Also remove auth user if exists
    if (staff?.email) {
      try {
        const { data: usersData } = await supabase.auth.admin.listUsers()
        const existingUser = usersData?.users?.find(u => u.email?.toLowerCase() === staff.email.toLowerCase())
        if (existingUser) {
          await supabase.auth.admin.deleteUser(existingUser.id)
        }
      } catch {}
    }
  } catch (err) {
    console.warn("Staff deleted from DB fallback:", err)
  }

  const list = await readFallbackStaff()
  const filtered = list.filter(s => s.id !== id && s.staff_code !== id)
  await writeFallbackStaff(filtered)

  revalidatePath("/admin/staff")
  return true
}
