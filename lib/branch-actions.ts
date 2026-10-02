"use server"

import { Branch } from "@/lib/erp/types"
import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

// Fallback in-memory stores for instant speed & resilience
let inMemoryBranches: Branch[] = [
  {
    id: "br-01",
    code: "BR-HQ01",
    name: "QuardCube HQ & Innovation Hub",
    manager_name: "Framani Mwamba",
    phone: "+255623893383",
    email: "hq@quardcubelabs.co.tz",
    address: "Kigamboni Tech Avenue, Plot 42",
    city: "Dar es Salaam",
    region: "Dar es Salaam",
    is_main: true,
    is_active: true,
    staff_count: 8,
    inventory_val: 145000000,
    daily_sales: 12500000,
    created_at: new Date(Date.now() - 365 * 86400000).toISOString()
  },
  {
    id: "br-02",
    code: "BR-CT02",
    name: "City Mall Flagship Store",
    manager_name: "Sarah Kweka",
    phone: "+255754123456",
    email: "citymall@quardcubelabs.co.tz",
    address: "Shop 14, 1st Floor, City Mall, Bibi Titi Rd",
    city: "Dar es Salaam",
    region: "Dar es Salaam",
    is_main: false,
    is_active: true,
    staff_count: 5,
    inventory_val: 85000000,
    daily_sales: 8200000,
    created_at: new Date(Date.now() - 180 * 86400000).toISOString()
  },
  {
    id: "br-03",
    code: "BR-KK03",
    name: "Kariakoo Wholesale Depot",
    manager_name: "Bakari Juma",
    phone: "+255788990011",
    email: "kariakoo@quardcubelabs.co.tz",
    address: "Msimbazi & Uhuru Street Crossing",
    city: "Dar es Salaam",
    region: "Dar es Salaam",
    is_main: false,
    is_active: true,
    staff_count: 6,
    inventory_val: 210000000,
    daily_sales: 18400000,
    created_at: new Date(Date.now() - 90 * 86400000).toISOString()
  },
  {
    id: "br-04",
    code: "BR-AR04",
    name: "Arusha Northern Branch",
    manager_name: "Grace Mollel",
    phone: "+255762334455",
    email: "arusha@quardcubelabs.co.tz",
    address: "Sokoine Road, Opposite Clock Tower",
    city: "Arusha",
    region: "Arusha",
    is_main: false,
    is_active: true,
    staff_count: 4,
    inventory_val: 62000000,
    daily_sales: 5100000,
    created_at: new Date(Date.now() - 45 * 86400000).toISOString()
  }
]

export async function getBranches(): Promise<Branch[]> {
  try {
    const { data, error } = await supabase
      .from("branches")
      .select("*")
      .order("is_main", { ascending: false })
      .order("name", { ascending: true })

    if (error || !data || data.length === 0) {
      return inMemoryBranches
    }

    return data as Branch[]
  } catch {
    return inMemoryBranches
  }
}

export async function createBranch(data: Partial<Branch>): Promise<Branch> {
  const newBranch: Branch = {
    id: `br-${Date.now()}`,
    code: data.code || `BR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    name: data.name || "New Branch",
    manager_name: data.manager_name || "Unassigned",
    phone: data.phone || "+255623893383",
    email: data.email || "branch@quardcubelabs.co.tz",
    address: data.address || "Main Street",
    city: data.city || "Dar es Salaam",
    region: data.region || "Dar es Salaam",
    is_main: Boolean(data.is_main),
    is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    staff_count: data.staff_count || 0,
    inventory_val: data.inventory_val || 0,
    daily_sales: data.daily_sales || 0,
    created_at: new Date().toISOString()
  }

  // If set to main branch, remove main flag from others
  if (newBranch.is_main) {
    inMemoryBranches = inMemoryBranches.map(b => ({ ...b, is_main: false }))
  }

  inMemoryBranches.unshift(newBranch)

  try {
    await supabase.from("branches").insert(newBranch)
  } catch (err) {
    console.warn("Branch saved to memory:", err)
  }

  revalidatePath("/admin/branches")
  return newBranch
}

export async function updateBranch(id: string, updates: Partial<Branch>): Promise<Branch | null> {
  const idx = inMemoryBranches.findIndex(b => b.id === id)
  if (idx === -1) return null

  if (updates.is_main) {
    inMemoryBranches = inMemoryBranches.map(b => ({ ...b, is_main: false }))
  }

  inMemoryBranches[idx] = {
    ...inMemoryBranches[idx],
    ...updates,
    updated_at: new Date().toISOString()
  }

  try {
    await supabase.from("branches").update(updates).eq("id", id)
  } catch (err) {
    console.warn("Branch updated in memory:", err)
  }

  revalidatePath("/admin/branches")
  return inMemoryBranches[idx]
}

export async function toggleBranchStatus(id: string): Promise<boolean> {
  const branch = inMemoryBranches.find(b => b.id === id)
  if (!branch) return false

  const newStatus = !branch.is_active
  await updateBranch(id, { is_active: newStatus })
  return newStatus
}

export async function deleteBranch(id: string): Promise<boolean> {
  inMemoryBranches = inMemoryBranches.filter(b => b.id !== id)

  try {
    await supabase.from("branches").delete().eq("id", id)
  } catch (err) {
    console.warn("Branch deleted from memory:", err)
  }

  revalidatePath("/admin/branches")
  return true
}
