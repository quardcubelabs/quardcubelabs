"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { AdminLoading } from "@/components/admin"
import { cn } from "@/lib/utils"
import { getBranches, createBranch, updateBranch, toggleBranchStatus, deleteBranch } from "@/lib/branch-actions"
import { Branch } from "@/lib/erp/types"
import {
  Store,
  Plus,
  Search,
  RefreshCw,
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  Boxes,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit,
  ShieldCheck,
  Globe
} from "lucide-react"

export default function BranchesPage() {
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Create & Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [managerName, setManagerName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("Dar es Salaam")
  const [region, setRegion] = useState("Dar es Salaam")
  const [isMain, setIsMain] = useState(false)
  const [isActive, setIsActive] = useState(true)

  // Delete confirmation
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getBranches()
      setBranches(data || [])
    } catch (err: any) {
      toast({ title: "Error Loading Branches", description: err.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenCreate = () => {
    setEditingBranch(null)
    setName("")
    setCode(`BR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`)
    setManagerName("")
    setPhone("+255")
    setEmail("")
    setAddress("")
    setCity("Dar es Salaam")
    setRegion("Dar es Salaam")
    setIsMain(false)
    setIsActive(true)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (b: Branch) => {
    setEditingBranch(b)
    setName(b.name)
    setCode(b.code)
    setManagerName(b.manager_name)
    setPhone(b.phone)
    setEmail(b.email)
    setAddress(b.address)
    setCity(b.city)
    setRegion(b.region)
    setIsMain(b.is_main)
    setIsActive(b.is_active)
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast({ title: "Validation Error", description: "Branch name is required.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id, {
          name,
          code,
          manager_name: managerName,
          phone,
          email,
          address,
          city,
          region,
          is_main: isMain,
          is_active: isActive
        })
        toast({ title: "Branch Updated", description: `${name} has been updated successfully.` })
      } else {
        await createBranch({
          name,
          code,
          manager_name: managerName,
          phone,
          email,
          address,
          city,
          region,
          is_main: isMain,
          is_active: isActive
        })
        toast({ title: "Branch Created", description: `${name} registered successfully.` })
      }

      setIsModalOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: "Save Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleStatus = async (id: string, branchName: string) => {
    try {
      const updated = await toggleBranchStatus(id)
      toast({
        title: updated ? "Branch Activated" : "Branch Deactivated",
        description: `${branchName} status changed to ${updated ? "Active" : "Inactive"}.`
      })
      loadData()
    } catch (err: any) {
      toast({ title: "Action Failed", description: err.message, variant: "destructive" })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!branchToDelete) return
    setIsDeleting(true)
    try {
      await deleteBranch(branchToDelete.id)
      toast({ title: "Branch Deleted", description: `${branchToDelete.name} has been removed.` })
      setBranchToDelete(null)
      loadData()
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtered list
  const filteredBranches = branches.filter(b => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.manager_name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && b.is_active) ||
      (statusFilter === "inactive" && !b.is_active) ||
      (statusFilter === "main" && b.is_main)

    return matchesSearch && matchesStatus
  })

  // KPI calculations
  const totalLocations = branches.length
  const activeLocations = branches.filter(b => b.is_active).length
  const totalStaffAcross = branches.reduce((sum, b) => sum + (b.staff_count || 0), 0)
  const totalInventoryValuation = branches.reduce((sum, b) => sum + (b.inventory_val || 0), 0)

  const statCards = [
    { title: "Total Locations", value: totalLocations.toString(), icon: Store },
    { title: "Active Outlets", value: activeLocations.toString(), icon: CheckCircle2 },
    { title: "Branch Staff", value: totalStaffAcross.toString(), icon: Users },
    { title: "Network Inventory", value: `TZS ${(totalInventoryValuation / 1000000).toFixed(1)}M`, icon: Boxes },
  ]

  if (isLoading) {
    return <AdminLoading message="Loading branch locations..." />
  }

  return (
    <div className="space-y-6">
      {/* 1. SIGNATURE HEADER BANNER */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 text-navy transition-all duration-300",
        isDark ? "bg-[#0a1033] border-none text-white shadow-none" : "bg-teal"
      )}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
              isDark ? "bg-teal/20 text-teal" : "bg-navy text-white"
            )}>
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  Branch Management
                </h1>
                <Badge className={cn("text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider", isDark ? "bg-teal/20 text-teal border-teal/30" : "bg-navy text-white")}>
                  Multi-Outlet
                </Badge>
              </div>
              <p className={cn("text-xs sm:text-sm font-medium mt-0.5", isDark ? "text-slate-300" : "text-navy/80")}>
                Configure physical retail branches, warehouses, regional distribution hubs, and team staffing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className={cn(
                "rounded-xl font-bold h-9 gap-1.5 shadow-sm transition-all",
                isDark ? "border-teal/30 text-teal hover:bg-teal/10" : "border-navy/30 text-navy hover:bg-navy/10 bg-white/40"
              )}
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className={cn(
                "font-black rounded-xl h-9 gap-1.5 shadow-md transition-all",
                isDark ? "bg-teal hover:bg-teal-400 text-navy" : "bg-navy hover:bg-brand-red text-white"
              )}
            >
              <Plus className="w-4 h-4" />
              <span>Add New Branch</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. TOP 4 KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat, idx) => (
          <Card
            key={idx}
            className={cn(
              "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
              isDark 
                ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]" 
                : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
            )}
          >
            <CardContent className="p-3.5 sm:p-4.5 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className={cn("text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1 truncate block", isDark ? "text-teal-400/80" : "text-navy/70")}>
                  {stat.title}
                </p>
                <span className={cn("text-lg sm:text-xl xl:text-2xl font-black truncate block leading-tight tracking-tight", isDark ? "text-white" : "text-navy")}>
                  {stat.value}
                </span>
              </div>
              <div className={cn(
                "w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                isDark 
                  ? "bg-navy border-teal/30 text-teal group-hover:bg-navy/80" 
                  : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
              )}>
                <stat.icon className={cn("h-5 w-5 shrink-0", isDark ? "text-teal" : "")} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. SEARCH & FILTERS TOOLBAR */}
      <Card className={cn("rounded-2xl border shadow-sm", isDark ? "bg-[#0a1033] border-none" : "bg-white border-2 border-navy/20")}>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className={cn("absolute left-3 top-2.5 h-4 w-4", isDark ? "text-slate-400" : "text-navy/50")} />
            <Input
              placeholder="Search branch name, code, manager, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn("pl-9 h-9 text-xs rounded-xl", isDark ? "bg-[#080d2a] border-slate-700 text-white placeholder:text-slate-500" : "bg-slate-50 border-2 border-navy/20 focus:border-navy text-navy")}
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={cn("h-9 text-xs rounded-xl w-full sm:w-44", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-2 border-navy/20 focus:border-navy text-navy")}>
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent className={cn("rounded-xl", isDark ? "bg-[#0a1033] border-slate-700 text-white" : "bg-white")}>
                <SelectItem value="all">All Outlets</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
                <SelectItem value="main">Main HQ Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 4. BRANCHES DATA TABLE */}
      <Card className={cn("rounded-2xl sm:rounded-3xl border shadow-sm overflow-hidden", isDark ? "bg-[#0a1033] border-none" : "bg-white border-2 border-navy/20")}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy text-white text-[11px] font-black uppercase tracking-wider">
              <tr>
                <th className="p-4 pl-6">Branch Code & Name</th>
                <th className="p-4">Manager In Charge</th>
                <th className="p-4">Location & Address</th>
                <th className="p-4">Contact</th>
                <th className="p-4 text-center">Staff</th>
                <th className="p-4">Stock Valuation</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-slate-100")}>
              {filteredBranches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <Store className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                    <p className={cn("font-bold text-sm", isDark ? "text-slate-300" : "text-navy")}>No branches found</p>
                    <p className="text-xs text-slate-500 mt-1">Try changing your search terms or add a new branch outlet.</p>
                  </td>
                </tr>
              ) : (
                filteredBranches.map((b) => (
                  <tr key={b.id} className={cn("transition-colors", isDark ? "hover:bg-slate-800/40 text-slate-200" : "hover:bg-slate-50/80 text-navy")}>
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs", b.is_main ? (isDark ? "bg-teal text-navy font-black" : "bg-teal text-navy") : (isDark ? "bg-slate-800 text-teal" : "bg-slate-100 text-navy"))}>
                          {b.is_main ? <Building2 className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm">{b.name}</span>
                            {b.is_main && (
                              <Badge className="bg-teal text-navy text-[9px] font-black uppercase px-1.5 py-0 shadow-xs">
                                HQ
                              </Badge>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-slate-400">{b.code}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-medium">{b.manager_name}</div>
                      <span className="text-[10.5px] text-slate-400">Store Manager</span>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1 text-[11.5px]">
                        <MapPin className={cn("w-3.5 h-3.5 shrink-0", isDark ? "text-teal" : "text-navy/60")} />
                        <span className="font-medium">{b.city}, {b.region}</span>
                      </div>
                      <div className="text-[10.5px] text-slate-400 truncate max-w-[180px]">{b.address}</div>
                    </td>

                    <td className="p-4">
                      <div className="font-mono text-[11px] flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{b.phone}</span>
                      </div>
                      <div className="text-[10.5px] text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[140px]">{b.email}</span>
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <Badge variant="outline" className={cn("font-bold text-xs px-2.5 py-0.5 rounded-full", isDark ? "border-teal/40 text-teal bg-teal/10" : "border-navy/20 text-navy bg-slate-50")}>
                        {b.staff_count || 0} Staff
                      </Badge>
                    </td>

                    <td className="p-4">
                      <div className="font-bold font-mono text-[12px]">
                        TZS {(b.inventory_val || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        ~ TZS {(b.daily_sales || 0).toLocaleString()}/day
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(b.id, b.name)}
                        className="cursor-pointer"
                        title="Click to toggle active status"
                      >
                        <Badge className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full transition-all", b.is_active ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" : "bg-slate-500/20 text-slate-500 border border-slate-500/30")}>
                          {b.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </button>
                    </td>

                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(b)}
                          className={cn("h-8 w-8 p-0 rounded-lg", isDark ? "hover:bg-teal/20 text-teal" : "hover:bg-navy/10 text-navy")}
                          title="Edit Branch"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!b.is_main && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setBranchToDelete(b)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-red-500/20 text-red-500"
                            title="Delete Branch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 5. ADD / EDIT BRANCH MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className={cn("max-w-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl", isDark ? "bg-[#0a1033] text-white border-none" : "bg-white text-navy border-2 border-navy/20")}>
          <DialogHeader>
            <DialogTitle className={cn("text-lg font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
              <Store className={cn("w-5 h-5", isDark ? "text-teal" : "text-navy")} />
              {editingBranch ? "Edit Branch Location" : "Add New Branch Outlet"}
            </DialogTitle>
            <DialogDescription className={cn("text-xs", isDark ? "text-slate-300" : "text-navy/70")}>
              Fill in the branch identity, physical address, and store manager credentials.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold">Branch Name *</Label>
                <Input
                  required
                  placeholder="e.g. City Mall Flagship Store"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn("h-9 text-xs rounded-xl", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-2 border-navy/20 focus:border-navy text-navy")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Branch Code *</Label>
                <Input
                  required
                  placeholder="BR-HQ01"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={cn("h-9 text-xs rounded-xl font-mono uppercase", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-2 border-navy/20 focus:border-navy text-navy")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Manager In Charge</Label>
                <Input
                  placeholder="e.g. Sarah Kweka"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  className={cn("h-9 text-xs rounded-xl", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-2 border-navy/20 focus:border-navy text-navy")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Contact Phone</Label>
                <Input
                  placeholder="+255 754 123 456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={cn("h-9 text-xs rounded-xl font-mono", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-2 border-navy/20 focus:border-navy text-navy")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Branch Email</Label>
                <Input
                  type="email"
                  placeholder="branch@quardcubelabs.co.tz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn("h-9 text-xs rounded-xl", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-2 border-navy/20 focus:border-navy text-navy")}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold">Physical Street Address</Label>
                <Input
                  placeholder="Plot 14, 1st Floor, Bibi Titi Road"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={cn("h-9 text-xs rounded-xl", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-2 border-navy/20 focus:border-navy text-navy")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">City</Label>
                <Input
                  placeholder="Dar es Salaam"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={cn("h-9 text-xs rounded-xl", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-2 border-navy/20 focus:border-navy text-navy")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Region</Label>
                <Input
                  placeholder="Dar es Salaam"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className={cn("h-9 text-xs rounded-xl", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-2 border-navy/20 focus:border-navy text-navy")}
                />
              </div>

              <div className="flex items-center gap-4 sm:col-span-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={isMain}
                    onChange={(e) => setIsMain(e.target.checked)}
                    className="rounded text-navy focus:ring-navy"
                  />
                  <span>Designate as Main Headquarter (HQ)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-navy focus:ring-navy"
                  />
                  <span>Active Outlet</span>
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className={cn("rounded-xl font-bold", isDark ? "border-slate-700 text-white" : "border-navy/20 text-navy")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className={cn(
                  "font-black rounded-xl gap-1.5 shadow-md",
                  isDark ? "bg-teal hover:bg-teal-400 text-navy" : "bg-navy hover:bg-navy/90 text-white"
                )}
              >
                {isSaving ? "Saving..." : editingBranch ? "Save Changes" : "Create Branch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!branchToDelete} onOpenChange={(open) => !open && setBranchToDelete(null)}>
        <DialogContent className={cn("max-w-md rounded-2xl", isDark ? "bg-[#0a1033] text-white border-red-500/30" : "bg-white text-navy border-2 border-navy/20")}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-500 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Confirm Branch Deletion
            </DialogTitle>
            <DialogDescription className={cn("text-xs", isDark ? "text-slate-300" : "text-navy/70")}>
              Are you sure you want to delete <span className="font-bold text-red-400">{branchToDelete?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBranchToDelete(null)}
              className={cn("rounded-xl font-bold", isDark ? "border-slate-700 text-white" : "border-navy/20 text-navy")}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleDeleteConfirm}
              className="rounded-xl font-bold"
            >
              {isDeleting ? "Deleting..." : "Delete Branch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
