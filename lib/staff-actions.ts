"use server"

import { StaffMember, AdminRoleType } from "@/lib/erp/types"
import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

let inMemoryStaff: StaffMember[] = [
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

export async function getStaffMembers(): Promise<StaffMember[]> {
  try {
    const { data, error } = await supabase
      .from("staff_members")
      .select("*")
      .order("staff_code", { ascending: true })

    if (error || !data || data.length === 0) {
      return inMemoryStaff
    }

    return data as StaffMember[]
  } catch {
    return inMemoryStaff
  }
}

export async function createStaffMember(data: Partial<StaffMember>): Promise<StaffMember> {
  const codeNum = inMemoryStaff.length + 101
  const newStaff: StaffMember = {
    id: `stf-${Date.now()}`,
    staff_code: data.staff_code || `STF-${codeNum}`,
    full_name: data.full_name || "New Team Member",
    email: data.email || `staff${codeNum}@quardcubelabs.co.tz`,
    phone: data.phone || "+255623893383",
    role: (data.role as AdminRoleType) || "cashier",
    branch_id: data.branch_id || "br-01",
    branch_name: data.branch_name || "QuardCube HQ & Innovation Hub",
    status: data.status || "active",
    joined_date: data.joined_date || new Date().toISOString().split("T")[0],
    last_active: "Registered just now"
  }

  inMemoryStaff.unshift(newStaff)

  try {
    await supabase.from("staff_members").insert(newStaff)
  } catch (err) {
    console.warn("Staff saved to memory:", err)
  }

  revalidatePath("/admin/staff")
  return newStaff
}

export async function updateStaffMember(id: string, updates: Partial<StaffMember>): Promise<StaffMember | null> {
  const idx = inMemoryStaff.findIndex(s => s.id === id)
  if (idx === -1) return null

  inMemoryStaff[idx] = {
    ...inMemoryStaff[idx],
    ...updates
  }

  try {
    await supabase.from("staff_members").update(updates).eq("id", id)
  } catch (err) {
    console.warn("Staff updated in memory:", err)
  }

  revalidatePath("/admin/staff")
  return inMemoryStaff[idx]
}

export async function toggleStaffStatus(id: string): Promise<string> {
  const staff = inMemoryStaff.find(s => s.id === id)
  if (!staff) return "inactive"

  const newStatus = staff.status === "active" ? "inactive" : "active"
  await updateStaffMember(id, { status: newStatus })
  return newStatus
}

export async function deleteStaffMember(id: string): Promise<boolean> {
  inMemoryStaff = inMemoryStaff.filter(s => s.id !== id)

  try {
    await supabase.from("staff_members").delete().eq("id", id)
  } catch (err) {
    console.warn("Staff deleted from memory:", err)
  }

  revalidatePath("/admin/staff")
  return true
}
