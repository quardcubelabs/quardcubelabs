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
import { getStaffMembers, createStaffMember, updateStaffMember, toggleStaffStatus, deleteStaffMember } from "@/lib/staff-actions"
import { getBranches } from "@/lib/branch-actions"
import { StaffMember, AdminRoleType, Branch } from "@/lib/erp/types"
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit,
  UserCheck,
  Clock,
  KeyRound,
  Store,
  User
} from "lucide-react"

const ROLE_CONFIG: Record<AdminRoleType, { label: string; color: string; bg: string }> = {
  owner_admin: { label: "Owner / Admin", color: "text-teal-400 border-teal-500/40", bg: "bg-teal/15" },
  manager: { label: "Manager", color: "text-blue-400 border-blue-500/40", bg: "bg-blue-500/15" },
  accountant: { label: "Accountant", color: "text-purple-400 border-purple-500/40", bg: "bg-purple-500/15" },
  stock_manager: { label: "Stock Manager", color: "text-amber-400 border-amber-500/40", bg: "bg-amber-500/15" },
  cashier: { label: "Cashier", color: "text-emerald-400 border-emerald-500/40", bg: "bg-emerald-500/15" }
}

export default function StaffPage() {
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [branchFilter, setBranchFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Create & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [fullName, setFullName] = useState("")
  const [staffCode, setStaffCode] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("+255")
  const [selectedRole, setSelectedRole] = useState<AdminRoleType>("cashier")
  const [selectedBranchId, setSelectedBranchId] = useState("")
  const [status, setStatus] = useState<"active" | "inactive" | "on_leave">("active")

  // Delete State
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [staffData, branchData] = await Promise.all([
        getStaffMembers(),
        getBranches()
      ])
      setStaffList(staffData || [])
      setBranches(branchData || [])
      if (branchData && branchData.length > 0 && !selectedBranchId) {
        setSelectedBranchId(branchData[0].id)
      }
    } catch (err: any) {
      toast({ title: "Error Loading Staff", description: err.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenCreate = () => {
    setEditingStaff(null)
    setFullName("")
    setStaffCode(`STF-${staffList.length + 101}`)
    setEmail("")
    setPhone("+255")
    setSelectedRole("cashier")
    setSelectedBranchId(branches[0]?.id || "br-01")
    setStatus("active")
    setIsModalOpen(true)
  }

  const handleOpenEdit = (s: StaffMember) => {
    setEditingStaff(s)
    setFullName(s.full_name)
    setStaffCode(s.staff_code)
    setEmail(s.email)
    setPhone(s.phone)
    setSelectedRole(s.role)
    setSelectedBranchId(s.branch_id)
    setStatus(s.status)
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) {
      toast({ title: "Validation Error", description: "Full Name and Email are required.", variant: "destructive" })
      return
    }

    const branchObj = branches.find(b => b.id === selectedBranchId)
    const branchName = branchObj ? branchObj.name : "QuardCube HQ"

    setIsSaving(true)
    try {
      if (editingStaff) {
        await updateStaffMember(editingStaff.id, {
          full_name: fullName,
          staff_code: staffCode,
          email,
          phone,
          role: selectedRole,
          branch_id: selectedBranchId,
          branch_name: branchName,
          status
        })
        toast({ title: "Staff Updated", description: `${fullName} has been updated.` })
      } else {
        await createStaffMember({
          full_name: fullName,
          staff_code: staffCode,
          email,
          phone,
          role: selectedRole,
          branch_id: selectedBranchId,
          branch_name: branchName,
          status
        })
        toast({ title: "Staff Registered", description: `${fullName} added to the team.` })
      }

      setIsModalOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: "Save Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleStatus = async (id: string, name: string) => {
    try {
      const newStatus = await toggleStaffStatus(id)
      toast({
        title: "Status Changed",
        description: `${name} is now ${newStatus === "active" ? "Active" : "Inactive"}.`
      })
      loadData()
    } catch (err: any) {
      toast({ title: "Action Failed", description: err.message, variant: "destructive" })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!staffToDelete) return
    setIsDeleting(true)
    try {
      await deleteStaffMember(staffToDelete.id)
      toast({ title: "Staff Member Removed", description: `${staffToDelete.full_name} was deleted.` })
      setStaffToDelete(null)
      loadData()
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtered list
  const filteredStaff = staffList.filter(s => {
    const matchesSearch =
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.staff_code.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === "all" || s.role === roleFilter
    const matchesBranch = branchFilter === "all" || s.branch_id === branchFilter
    const matchesStatus = statusFilter === "all" || s.status === statusFilter

    return matchesSearch && matchesRole && matchesBranch && matchesStatus
  })

  // KPI calculations
  const totalStaff = staffList.length
  const activeStaff = staffList.filter(s => s.status === "active").length
  const totalBranchesRepresented = new Set(staffList.map(s => s.branch_id)).size
  const totalRolesRepresented = new Set(staffList.map(s => s.role)).size

  if (isLoading) {
    return <AdminLoading message="Loading staff and personnel..." />
  }

  return (
    <div className="space-y-6">
      {/* 1. SIGNATURE TEAL HEADER BANNER */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 text-navy transition-all duration-300",
        isDark ? "bg-[#0a1033] border border-teal/20 text-white" : "bg-teal"
      )}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
              isDark ? "bg-teal/20 text-teal" : "bg-navy text-white"
            )}>
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  Staff & Team Management
                </h1>
                <Badge className={cn("text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider", isDark ? "bg-teal/20 text-teal border-teal/30" : "bg-navy text-white")}>
                  Active Roster
                </Badge>
              </div>
              <p className={cn("text-xs sm:text-sm font-medium mt-0.5", isDark ? "text-slate-300" : "text-navy/80")}>
                Manage employee profiles, role assignments (Admin, Manager, Accountant, Stock Manager, Cashier), and branch affiliations.
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
              <span>Add Staff Member</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. TOP 4 KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className={cn("rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group overflow-hidden border shadow-sm", isDark ? "bg-[#060a22] border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-slate-400" : "text-navy/60")}>Total Staff</p>
              <h3 className={cn("text-xl sm:text-2xl font-black", isDark ? "text-white" : "text-navy")}>{totalStaff}</h3>
              <p className="text-[11px] text-teal font-medium flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> Registered Personnel
              </p>
            </div>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform", isDark ? "bg-teal/20 text-teal" : "bg-teal/10 text-teal-700")}>
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn("rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group overflow-hidden border shadow-sm", isDark ? "bg-[#060a22] border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-slate-400" : "text-navy/60")}>Active On Duty</p>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-500">{activeStaff}</h3>
              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Authorized System Access
              </p>
            </div>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform", isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600")}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn("rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group overflow-hidden border shadow-sm", isDark ? "bg-[#060a22] border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-slate-400" : "text-navy/60")}>Roles Active</p>
              <h3 className={cn("text-xl sm:text-2xl font-black", isDark ? "text-white" : "text-navy")}>{totalRolesRepresented}</h3>
              <p className="text-[11px] text-teal font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> 5 Defined Roles
              </p>
            </div>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform", isDark ? "bg-purple-500/20 text-purple-400" : "bg-purple-50 text-purple-600")}>
              <KeyRound className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn("rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group overflow-hidden border shadow-sm", isDark ? "bg-[#060a22] border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-slate-400" : "text-navy/60")}>Branches Staffed</p>
              <h3 className={cn("text-xl sm:text-2xl font-black", isDark ? "text-white" : "text-navy")}>{totalBranchesRepresented}</h3>
              <p className="text-[11px] text-teal font-medium flex items-center gap-1">
                <Store className="w-3 h-3" /> Multi-Branch Allocation
              </p>
            </div>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform", isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-50 text-blue-600")}>
              <Building2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. SEARCH & FILTER TOOLBAR */}
      <Card className={cn("rounded-2xl border shadow-sm", isDark ? "bg-[#060a22] border-slate-800" : "bg-white border-slate-200")}>
        <CardContent className="p-4 flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="relative w-full lg:w-72">
            <Search className={cn("absolute left-3 top-2.5 h-4 w-4", isDark ? "text-slate-400" : "text-navy/50")} />
            <Input
              placeholder="Search staff name, code, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn("pl-9 h-9 text-xs rounded-xl border", isDark ? "bg-[#080d2a] border-slate-700 text-white placeholder:text-slate-500" : "bg-slate-50 border-slate-200 text-navy")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full lg:w-auto">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className={cn("h-9 text-xs rounded-xl border", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-navy")}>
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent className={cn("rounded-xl", isDark ? "bg-[#0a1033] border-slate-700 text-white" : "bg-white")}>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="owner_admin">Owner / Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
                <SelectItem value="stock_manager">Stock Manager</SelectItem>
                <SelectItem value="cashier">Cashier</SelectItem>
              </SelectContent>
            </Select>

            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className={cn("h-9 text-xs rounded-xl border", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-navy")}>
                <SelectValue placeholder="Filter by Branch" />
              </SelectTrigger>
              <SelectContent className={cn("rounded-xl", isDark ? "bg-[#0a1033] border-slate-700 text-white" : "bg-white")}>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={cn("h-9 text-xs rounded-xl border", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-navy")}>
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent className={cn("rounded-xl", isDark ? "bg-[#0a1033] border-slate-700 text-white" : "bg-white")}>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 4. STAFF DATA TABLE */}
      <Card className={cn("rounded-2xl sm:rounded-3xl border shadow-sm overflow-hidden", isDark ? "bg-[#060a22] border-slate-800" : "bg-white border-slate-200")}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy text-white text-[11px] font-black uppercase tracking-wider">
              <tr>
                <th className="p-4 pl-6">Staff Member</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Branch Location</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4">Last Activity</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-slate-100")}>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <Users className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                    <p className={cn("font-bold text-sm", isDark ? "text-slate-300" : "text-navy")}>No staff members found</p>
                    <p className="text-xs text-slate-500 mt-1">Try modifying your filters or add a new team member.</p>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((s) => {
                  const roleMeta = ROLE_CONFIG[s.role] || { label: s.role, color: "text-slate-400", bg: "bg-slate-500/10" }
                  const initials = s.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

                  return (
                    <tr key={s.id} className={cn("transition-colors", isDark ? "hover:bg-slate-800/40 text-slate-200" : "hover:bg-slate-50/80 text-navy")}>
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-xs",
                            isDark ? "bg-teal/20 text-teal border border-teal/40" : "bg-navy text-white"
                          )}>
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{s.full_name}</div>
                            <span className="font-mono text-[11px] text-slate-400">{s.staff_code}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <Badge className={cn("text-[10px] font-black uppercase px-2 py-0.5 border shadow-2xs", roleMeta.color, roleMeta.bg)}>
                          {roleMeta.label}
                        </Badge>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-medium text-[11.5px]">
                          <Store className="w-3.5 h-3.5 text-teal shrink-0" />
                          <span>{s.branch_name}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-mono text-[11px] flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{s.phone}</span>
                        </div>
                        <div className="text-[10.5px] text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[150px]">{s.email}</span>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-[11px] text-slate-400">
                        {s.joined_date}
                      </td>

                      <td className="p-4">
                        <div className="text-[11px] flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3 text-teal" />
                          <span>{s.last_active || "Recent"}</span>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(s.id, s.full_name)}
                          className="cursor-pointer"
                          title="Click to toggle status"
                        >
                          <Badge className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full transition-all",
                            s.status === "active"
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : s.status === "on_leave"
                              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                              : "bg-slate-500/20 text-slate-500 border border-slate-500/30"
                          )}>
                            {s.status === "active" ? "Active" : s.status === "on_leave" ? "On Leave" : "Inactive"}
                          </Badge>
                        </button>
                      </td>

                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(s)}
                            className={cn("h-8 w-8 p-0 rounded-lg", isDark ? "hover:bg-teal/20 text-teal" : "hover:bg-slate-100 text-navy")}
                            title="Edit Staff Member"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setStaffToDelete(s)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-red-500/20 text-red-500"
                            title="Delete Staff Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 5. ADD / EDIT STAFF MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className={cn("max-w-lg p-4 sm:p-6 rounded-2xl sm:rounded-3xl", isDark ? "bg-[#0a1033] text-white border-teal/20" : "bg-white text-navy")}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-teal" />
              {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
            </DialogTitle>
            <DialogDescription className={cn("text-xs", isDark ? "text-slate-300" : "text-navy/70")}>
              Assign employee role, assigned branch outlet, and security status.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold">Full Name *</Label>
                <Input
                  required
                  placeholder="e.g. David Kimaro"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={cn("h-9 text-xs rounded-xl border", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-navy")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Staff ID / Code</Label>
                <Input
                  required
                  placeholder="STF-101"
                  value={staffCode}
                  onChange={(e) => setStaffCode(e.target.value)}
                  className={cn("h-9 text-xs rounded-xl font-mono uppercase border", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-navy")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Role Assignment *</Label>
                <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val as AdminRoleType)}>
                  <SelectTrigger className={cn("h-9 text-xs rounded-xl border", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-navy")}>
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent className={cn("rounded-xl", isDark ? "bg-[#0a1033] border-slate-700 text-white" : "bg-white")}>
                    <SelectItem value="owner_admin">Owner / Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="stock_manager">Stock Manager</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold">Branch Location *</Label>
                <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                  <SelectTrigger className={cn("h-9 text-xs rounded-xl border", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-navy")}>
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent className={cn("rounded-xl", isDark ? "bg-[#0a1033] border-slate-700 text-white" : "bg-white")}>
                    {branches.map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Work Email *</Label>
                <Input
                  type="email"
                  required
                  placeholder="staff@quardcubelabs.co.tz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn("h-9 text-xs rounded-xl border", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-navy")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Phone Number</Label>
                <Input
                  placeholder="+255 762 112 233"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={cn("h-9 text-xs rounded-xl font-mono border", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-navy")}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold">Status</Label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger className={cn("h-9 text-xs rounded-xl border", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-navy")}>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className={cn("rounded-xl", isDark ? "bg-[#0a1033] border-slate-700 text-white" : "bg-white")}>
                    <SelectItem value="active">Active (Full Access)</SelectItem>
                    <SelectItem value="inactive">Inactive (Suspended)</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
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
                  isDark ? "bg-teal hover:bg-teal-400 text-navy" : "bg-navy hover:bg-brand-red text-white"
                )}
              >
                {isSaving ? "Saving..." : editingStaff ? "Save Changes" : "Create Staff"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!staffToDelete} onOpenChange={(open) => !open && setStaffToDelete(null)}>
        <DialogContent className={cn("max-w-md rounded-2xl", isDark ? "bg-[#0a1033] text-white border-red-500/30" : "bg-white text-navy")}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-500 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Remove Staff Member
            </DialogTitle>
            <DialogDescription className={cn("text-xs", isDark ? "text-slate-300" : "text-navy/70")}>
              Are you sure you want to remove <span className="font-bold text-red-400">{staffToDelete?.full_name}</span> ({staffToDelete?.staff_code})?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStaffToDelete(null)}
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
              {isDeleting ? "Deleting..." : "Delete Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
