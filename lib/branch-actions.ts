"use server"

import { Branch } from "@/lib/erp/types"
import { createServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import fs from "fs"
import path from "path"

const BRANCHES_STORAGE = path.join(process.cwd(), "db", "branches_data.json")

const DEFAULT_BRANCHES: Branch[] = [
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

async function readFallbackBranches(): Promise<Branch[]> {
  try {
    if (fs.existsSync(BRANCHES_STORAGE)) {
      const data = await fs.promises.readFile(BRANCHES_STORAGE, "utf-8")
      return JSON.parse(data) || DEFAULT_BRANCHES
    }
  } catch {}
  return DEFAULT_BRANCHES
}

async function writeFallbackBranches(branches: Branch[]): Promise<void> {
  try {
    const dir = path.dirname(BRANCHES_STORAGE)
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true })
    }
    await fs.promises.writeFile(BRANCHES_STORAGE, JSON.stringify(branches, null, 2), "utf-8")
  } catch {}
}

export async function getBranches(): Promise<Branch[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("branches")
      .select("*")
      .order("is_main", { ascending: false })
      .order("name", { ascending: true })

    if (!error && data && data.length > 0) {
      // Sync local cache
      await writeFallbackBranches(data as Branch[])
      return data as Branch[]
    }

    // Auto-seed if database table is available but empty
    if (!error && data && data.length === 0) {
      try {
        await supabase.from("branches").upsert(DEFAULT_BRANCHES)
        return DEFAULT_BRANCHES
      } catch {}
    }
  } catch (err) {
    console.warn("Supabase branches fetch error:", err)
  }

  const local = await readFallbackBranches()
  if (local.length === 0) {
    await writeFallbackBranches(DEFAULT_BRANCHES)
    return DEFAULT_BRANCHES
  }
  return local
}

export async function getBranchById(id: string): Promise<Branch | null> {
  const branches = await getBranches()
  return branches.find(b => b.id === id || b.code === id) || null
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

  try {
    const supabase = createServerClient()
    if (newBranch.is_main) {
      await supabase.from("branches").update({ is_main: false }).neq("id", newBranch.id)
    }
    await supabase.from("branches").insert(newBranch)
  } catch (err) {
    console.warn("Branch saved to DB fallback:", err)
  }

  const list = await readFallbackBranches()
  if (newBranch.is_main) {
    list.forEach(b => { b.is_main = false })
  }
  list.unshift(newBranch)
  await writeFallbackBranches(list)

  revalidatePath("/admin/branches")
  return newBranch
}

export async function updateBranch(id: string, updates: Partial<Branch>): Promise<Branch | null> {
  const list = await readFallbackBranches()
  const idx = list.findIndex(b => b.id === id)
  if (idx === -1 && !id) return null

  if (updates.is_main) {
    list.forEach(b => { b.is_main = false })
  }

  const updated: Branch = {
    ...(list[idx] || {}),
    ...updates,
    id: id,
    updated_at: new Date().toISOString()
  } as Branch

  if (idx !== -1) {
    list[idx] = updated
  } else {
    list.unshift(updated)
  }
  await writeFallbackBranches(list)

  try {
    const supabase = createServerClient()
    if (updates.is_main) {
      await supabase.from("branches").update({ is_main: false }).neq("id", id)
    }
    await supabase.from("branches").update(updates).eq("id", id)
  } catch (err) {
    console.warn("Branch updated in DB fallback:", err)
  }

  revalidatePath("/admin/branches")
  return updated
}

export async function toggleBranchStatus(id: string): Promise<boolean> {
  const branches = await getBranches()
  const branch = branches.find(b => b.id === id)
  if (!branch) return false

  const newStatus = !branch.is_active
  await updateBranch(id, { is_active: newStatus })
  return newStatus
}

export async function deleteBranch(id: string): Promise<boolean> {
  try {
    const supabase = createServerClient()
    await supabase.from("branches").delete().eq("id", id)
  } catch (err) {
    console.warn("Branch deleted from DB fallback:", err)
  }

  const list = await readFallbackBranches()
  const filtered = list.filter(b => b.id !== id)
  await writeFallbackBranches(filtered)

  revalidatePath("/admin/branches")
  return true
}
