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
import { 
  getStaffMembers, 
  createStaffMember, 
  updateStaffMember, 
  toggleStaffStatus, 
  deleteStaffMember,
  resetStaffPassword,
  sendStaffInvite,
  syncAllStaffToAuth,
  getStaffAuthStatusMap
} from "@/lib/staff-actions"
import { getBranches } from "@/lib/branch-actions"
import { StaffMember, AdminRoleType, Branch } from "@/lib/erp/types"
import {
  Users,
  Plus,
  Search,
  RefreshCw,
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
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Send,
  Copy,
  Shield,
  ShieldCheck,
  Zap
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
  const [authStatusMap, setAuthStatusMap] = useState<Record<string, { exists: boolean }>>({})
  const [isSyncingAuth, setIsSyncingAuth] = useState(false)
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
  
  // Password & Auth States
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [sendInvite, setSendInvite] = useState(false)

  // Reset Password Modal State
  const [staffForPasswordReset, setStaffForPasswordReset] = useState<StaffMember | null>(null)
  const [resetPasswordInput, setResetPasswordInput] = useState("")
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isSendingInvite, setIsSendingInvite] = useState<string | null>(null)

  // Delete State
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*"
    let generated = "QC@"
    for (let i = 0; i < 7; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return generated
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [staffData, branchData, authMap] = await Promise.all([
        getStaffMembers(),
        getBranches(),
        getStaffAuthStatusMap()
      ])
      setStaffList(staffData || [])
      setBranches(branchData || [])
      setAuthStatusMap(authMap || {})
      if (branchData && branchData.length > 0 && !selectedBranchId) {
        setSelectedBranchId(branchData[0].id)
      }
    } catch (err: any) {
      toast({ title: "Error Loading Staff", description: err.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncAuth = async () => {
    setIsSyncingAuth(true)
    try {
      const res = await syncAllStaffToAuth()
      if (res.errors.length > 0) {
        toast({
          title: "Supabase Auth Sync Completed with Notices",
          description: `Created: ${res.created}, Updated: ${res.updated}. Notices: ${res.errors.join(", ")}`,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Supabase Auth Synced",
          description: `Successfully synchronized ${res.total} staff members into Supabase Auth. (${res.created} new created, ${res.updated} updated).`
        })
      }
      await loadData()
    } catch (err: any) {
      toast({
        title: "Sync Error",
        description: err.message || "Failed to sync staff with Supabase Auth.",
        variant: "destructive"
      })
    } finally {
      setIsSyncingAuth(false)
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
    setPassword(generateRandomPassword())
    setShowPassword(true)
    setSendInvite(true)
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
    setPassword("")
    setShowPassword(false)
    setSendInvite(false)
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) {
      toast({ title: "Validation Error", description: "Full Name and Email are required.", variant: "destructive" })
      return
    }

    if (!editingStaff && password && password.trim().length < 6) {
      toast({ title: "Validation Error", description: "Password must be at least 6 characters.", variant: "destructive" })
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
          status,
          ...(password ? { password: password.trim() } : {})
        })
        toast({ 
          title: "Staff Updated", 
          description: password ? `${fullName} profile & password updated.` : `${fullName} has been updated.` 
        })
      } else {
        await createStaffMember({
          full_name: fullName,
          staff_code: staffCode,
          email,
          phone,
          role: selectedRole,
          branch_id: selectedBranchId,
          branch_name: branchName,
          status,
          password: password.trim() || undefined,
          send_invite: sendInvite
        })
        toast({ 
          title: "Staff Member Registered", 
          description: password 
            ? `${fullName} registered with login credentials.` 
            : `${fullName} added to the team.` 
        })
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

  const handleSendInviteAction = async (staff: StaffMember) => {
    setIsSendingInvite(staff.id)
    try {
      const result = await sendStaffInvite(staff.email)
      if (result.success) {
        toast({
          title: "Invitation Sent",
          description: `Login setup link was sent to ${staff.email}.`
        })
      } else {
        toast({
          title: "Invite Failed",
          description: result.error || "Could not send invite email.",
          variant: "destructive"
        })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setIsSendingInvite(null)
    }
  }

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staffForPasswordReset) return
    if (!resetPasswordInput || resetPasswordInput.trim().length < 6) {
      toast({ title: "Invalid Password", description: "Password must be at least 6 characters.", variant: "destructive" })
      return
    }

    setIsResetting(true)
    try {
      const result = await resetStaffPassword(staffForPasswordReset.email, resetPasswordInput)
      if (result.success) {
        toast({
          title: "Password Updated",
          description: `Login password for ${staffForPasswordReset.full_name} was successfully updated.`
        })
        setStaffForPasswordReset(null)
        setResetPasswordInput("")
      } else {
        toast({
          title: "Password Reset Failed",
          description: result.error || "Unable to reset password.",
          variant: "destructive"
        })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setIsResetting(false)
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

  const statCards = [
    { title: "Total Staff", value: totalStaff.toString(), icon: Users },
    { title: "Active On Duty", value: activeStaff.toString(), icon: CheckCircle2 },
    { title: "Roles Active", value: `${totalRolesRepresented} Roles`, icon: KeyRound },
    { title: "Branches Covered", value: `${totalBranchesRepresented} Outlets`, icon: Store }
  ]

  if (isLoading && staffList.length === 0) {
    return <AdminLoading message="Loading staff and personnel..." />
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={cn("text-2xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
            Staff & Personnel Management
          </h1>
          <p className={cn("text-xs font-medium mt-1", isDark ? "text-slate-300" : "text-navy/70")}>
            Manage team members, branch assignments, credentials, and role-based access control.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className={cn("rounded-xl font-bold gap-2 text-xs", isDark ? "border-slate-700 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-navy/5")}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncAuth}
            disabled={isSyncingAuth}
            className={cn("rounded-xl font-bold gap-2 text-xs border-teal-500/40 text-teal hover:bg-teal/10")}
            title="Auto-sync all staff members into Supabase Auth database"
          >
            <ShieldCheck className={cn("w-3.5 h-3.5", isSyncingAuth && "animate-spin text-teal")} />
            {isSyncingAuth ? "Syncing Auth..." : "Sync Supabase Auth"}
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className={cn("rounded-xl font-black gap-2 text-xs shadow-md", isDark ? "bg-teal hover:bg-teal-400 text-navy" : "bg-navy hover:bg-navy/90 text-white")}
          >
            <Plus className="w-4 h-4" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx} className={cn("rounded-2xl border transition-all", isDark ? "bg-[#080d2a] border-slate-800" : "bg-white border-slate-200 shadow-sm")}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className={cn("text-[11px] font-bold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                    {stat.title}
                  </p>
                  <p className={cn("text-xl font-black mt-1", isDark ? "text-white" : "text-navy")}>
                    {stat.value}
                  </p>
                </div>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isDark ? "bg-teal/15 text-teal" : "bg-navy/10 text-navy")}>
                  <Icon className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 3. SEARCH & FILTERS */}
      <Card className={cn("rounded-2xl border", isDark ? "bg-[#080d2a] border-slate-800" : "bg-white border-slate-200 shadow-sm")}>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search staff name, code, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn("pl-9 h-9 text-xs rounded-xl", isDark ? "bg-[#0a1033] border-slate-700 text-white" : "bg-slate-50 border-2 border-navy/20 focus:border-navy text-navy")}
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className={cn("h-9 text-xs rounded-xl", isDark ? "bg-[#0a1033] border-slate-700 text-white" : "bg-slate-50 border-2 border-navy/20 focus:border-navy text-navy")}>
                <SelectValue placeholder="All Roles" />
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
              <SelectTrigger className={cn("h-9 text-xs rounded-xl", isDark ? "bg-[#0a1033] border-slate-700 text-white" : "bg-slate-50 border-2 border-navy/20 focus:border-navy text-navy")}>
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent className={cn("rounded-xl", isDark ? "bg-[#0a1033] border-slate-700 text-white" : "bg-white")}>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map(b => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={cn("h-9 text-xs rounded-xl", isDark ? "bg-[#0a1033] border-slate-700 text-white" : "bg-slate-50 border-2 border-navy/20 focus:border-navy text-navy")}>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className={cn("rounded-xl", isDark ? "bg-[#0a1033] border-slate-700 text-white" : "bg-white")}>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 4. STAFF DIRECTORY TABLE */}
      <Card className={cn("rounded-2xl sm:rounded-3xl border shadow-md overflow-hidden", isDark ? "bg-[#0a1033] border-none" : "bg-white border-2 border-navy/20")}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-navy text-white text-xs font-black uppercase tracking-wider border-b-2 border-navy/30">
              <tr>
                <th className="py-3.5 px-4 md:px-6">
                  <span className="hidden sm:inline">Staff Member</span>
                  <span className="sm:hidden">Staff</span>
                </th>
                <th className="py-3.5 px-3 md:px-4">
                  <span className="hidden sm:inline">Role Assignment</span>
                  <span className="sm:hidden">Role</span>
                </th>
                <th className="py-3.5 px-3 md:px-4">
                  <span className="hidden md:inline">Branch Outlet</span>
                  <span className="md:hidden">Branch</span>
                </th>
                <th className="py-3.5 px-3 md:px-4">
                  <span className="hidden sm:inline">Contact Info</span>
                  <span className="sm:hidden">Contact</span>
                </th>
                <th className="py-3.5 px-3 md:px-4">
                  <span className="hidden lg:inline">Supabase Auth</span>
                  <span className="lg:hidden">Auth</span>
                </th>
                <th className="py-3.5 px-3 md:px-4 text-center">
                  <span className="hidden sm:inline">Status</span>
                  <span className="sm:hidden">Stat</span>
                </th>
                <th className="py-3.5 px-4 md:px-6 text-right">
                  <span className="hidden sm:inline">Actions</span>
                  <span className="sm:hidden">Act</span>
                </th>
              </tr>
            </thead>

            <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-navy/10")}>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Users className="w-10 h-10 mx-auto text-navy/40 dark:text-teal-400/50 mb-2 opacity-50" />
                    <p className={cn("font-bold text-sm", isDark ? "text-slate-300" : "text-navy")}>No staff members found</p>
                    <p className={cn("text-xs mt-1", isDark ? "text-slate-400" : "text-navy/70")}>Try changing search filters or create a new team member.</p>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((s) => {
                  const roleMeta = ROLE_CONFIG[s.role] || { label: s.role, color: "text-slate-400 border-slate-500/40", bg: "bg-slate-500/15" }
                  const emailKey = (s.email || "").toLowerCase().trim()
                  const isAuthSynced = !!authStatusMap[emailKey]?.exists

                  return (
                    <tr key={s.id} className={cn("transition-colors", isDark ? "hover:bg-teal/20 text-slate-200" : "hover:bg-teal/40 text-navy")}>
                      <td className="py-3.5 md:py-4 px-4 md:px-6">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0", isDark ? "bg-teal/20 text-teal border border-teal/30" : "bg-navy text-white")}>
                            {s.full_name.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className={cn("font-black text-sm truncate", isDark ? "text-white" : "text-navy")}>{s.full_name}</p>
                            <span className={cn("font-mono text-[11px] font-bold block", isDark ? "text-teal-400" : "text-navy/70")}>{s.staff_code}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 md:py-4 px-3 md:px-4 whitespace-nowrap">
                        <Badge className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-lg border shadow-none", roleMeta.bg, roleMeta.color)}>
                          <Shield className="w-3 h-3 mr-1 inline" />
                          {roleMeta.label}
                        </Badge>
                      </td>

                      <td className="py-3.5 md:py-4 px-3 md:px-4">
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <Building2 className={cn("w-3.5 h-3.5 shrink-0", isDark ? "text-teal" : "text-navy")} />
                          <span className={cn("truncate max-w-[150px]", isDark ? "text-slate-200" : "text-navy")}>{s.branch_name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 md:py-4 px-3 md:px-4">
                        <div className="space-y-0.5">
                          <div className={cn("flex items-center gap-1.5 font-mono text-xs font-semibold", isDark ? "text-slate-300" : "text-navy")}>
                            <Mail className={cn("w-3 h-3 shrink-0", isDark ? "text-teal" : "text-navy/70")} />
                            <span className="truncate max-w-[170px]">{s.email}</span>
                          </div>
                          <div className={cn("flex items-center gap-1.5 font-mono text-[11px] font-medium", isDark ? "text-slate-400" : "text-navy/75")}>
                            <Phone className={cn("w-3 h-3 shrink-0", isDark ? "text-teal" : "text-navy/70")} />
                            <span>{s.phone}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 md:py-4 px-3 md:px-4 whitespace-nowrap">
                        {isAuthSynced ? (
                          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                            <ShieldCheck className="w-3 h-3 mr-1 inline text-emerald-400" />
                            Auth Active
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                            <Zap className="w-3 h-3 mr-1 inline text-amber-400" />
                            Auto-Sync
                          </Badge>
                        )}
                      </td>

                      <td className="py-3.5 md:py-4 px-3 md:px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(s.id, s.full_name)}
                          className="cursor-pointer"
                          title="Click to toggle status"
                        >
                          <Badge className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full transition-all shadow-none",
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

                      <td className="py-3.5 md:py-4 px-4 md:px-6 pr-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setStaffForPasswordReset(s)
                              setResetPasswordInput(generateRandomPassword())
                              setShowResetPassword(true)
                            }}
                            className={cn("h-8 w-8 p-0 rounded-lg", isDark ? "hover:bg-amber-500/20 text-amber-400" : "hover:bg-amber-100 text-amber-700")}
                            title="Reset / Set Login Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendInviteAction(s)}
                            disabled={isSendingInvite === s.id}
                            className={cn("h-8 w-8 p-0 rounded-lg", isDark ? "hover:bg-sky-500/20 text-sky-400" : "hover:bg-sky-100 text-sky-700")}
                            title="Send Activation / Login Email"
                          >
                            <Send className={cn("w-3.5 h-3.5", isSendingInvite === s.id && "animate-spin")} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(s)}
                            className={cn("h-8 w-8 p-0 rounded-lg", isDark ? "hover:bg-teal/20 text-teal" : "hover:bg-navy/10 text-navy")}
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
        <DialogContent className={cn("max-w-lg p-4 sm:p-6 rounded-2xl sm:rounded-3xl max-h-[90vh] overflow-y-auto", isDark ? "bg-[#0a1033] text-white border-none" : "bg-white text-navy border-2 border-navy/20")}>
          <DialogHeader>
            <DialogTitle className={cn("text-lg font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
              <UserCheck className={cn("w-5 h-5", isDark ? "text-teal" : "text-navy")} />
              {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
            </DialogTitle>
            <DialogDescription className={cn("text-xs", isDark ? "text-slate-300" : "text-navy/70")}>
              Assign employee role, branch outlet, and authentication login credentials.
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
                  className={cn("h-9 text-xs rounded-xl", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-2 border-navy/20 focus:border-navy text-navy")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Staff ID / Code</Label>
                <Input
                  required
                  placeholder="STF-101"
                  value={staffCode}
                  onChange={(e) => setStaffCode(e.target.value)}
                  className={cn("h-9 text-xs rounded-xl font-mono uppercase", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-2 border-navy/20 focus:border-navy text-navy")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Role Assignment *</Label>
                <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val as AdminRoleType)}>
                  <SelectTrigger className={cn("h-9 text-xs rounded-xl", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-2 border-navy/20 focus:border-navy text-navy")}>
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
                  <SelectTrigger className={cn("h-9 text-xs rounded-xl", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-2 border-navy/20 focus:border-navy text-navy")}>
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
                <Label className="text-xs font-bold">Work Email (Login ID) *</Label>
                <Input
                  type="email"
                  required
                  placeholder="staff@quardcubelabs.co.tz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn("h-9 text-xs rounded-xl", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-2 border-navy/20 focus:border-navy text-navy")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Phone Number</Label>
                <Input
                  placeholder="+255 762 112 233"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={cn("h-9 text-xs rounded-xl font-mono", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-2 border-navy/20 focus:border-navy text-navy")}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold">Status</Label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger className={cn("h-9 text-xs rounded-xl", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-2 border-navy/20 focus:border-navy text-navy")}>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className={cn("rounded-xl", isDark ? "bg-[#0a1033] border-slate-700 text-white" : "bg-white")}>
                    <SelectItem value="active">Active (Full Access)</SelectItem>
                    <SelectItem value="inactive">Inactive (Suspended)</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Login Credentials Section */}
              <div className={cn("p-3.5 rounded-2xl sm:col-span-2 space-y-3 border", isDark ? "bg-[#080d2a]/80 border-slate-800" : "bg-slate-50 border-slate-200")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className={cn("w-4 h-4", isDark ? "text-teal" : "text-navy")} />
                    <Label className="text-xs font-bold">
                      {editingStaff ? "Update Login Password (Optional)" : "Initial Login Password *"}
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newPass = generateRandomPassword()
                      setPassword(newPass)
                      setShowPassword(true)
                    }}
                    className={cn("h-7 px-2 text-[11px] font-bold gap-1 rounded-lg", isDark ? "hover:bg-teal/20 text-teal" : "hover:bg-navy/10 text-navy")}
                  >
                    <Sparkles className="w-3 h-3" />
                    Auto-Generate
                  </Button>
                </div>

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={editingStaff ? "Leave blank to keep existing password" : "Enter minimum 6 characters"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn("h-9 text-xs rounded-xl pr-16 font-mono", isDark ? "bg-[#0a1033] border-slate-700 text-white" : "bg-white border-2 border-navy/20 focus:border-navy text-navy")}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {password && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(password)
                          toast({ title: "Copied", description: "Password copied to clipboard." })
                        }}
                        className="text-slate-400 hover:text-white p-1"
                        title="Copy Password"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {!editingStaff && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="sendInviteCheckbox"
                      checked={sendInvite}
                      onChange={(e) => setSendInvite(e.target.checked)}
                      className="rounded accent-teal cursor-pointer"
                    />
                    <label htmlFor="sendInviteCheckbox" className={cn("text-[11px] cursor-pointer", isDark ? "text-slate-300" : "text-slate-600")}>
                      Send activation link to staff work email upon creation
                    </label>
                  </div>
                )}
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
                {isSaving ? "Saving..." : editingStaff ? "Save Changes" : "Create Staff & Credentials"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. RESET PASSWORD MODAL */}
      <Dialog open={!!staffForPasswordReset} onOpenChange={(open) => !open && setStaffForPasswordReset(null)}>
        <DialogContent className={cn("max-w-md rounded-2xl sm:rounded-3xl", isDark ? "bg-[#0a1033] text-white border-none" : "bg-white text-navy border-2 border-navy/20")}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              Reset Staff Password
            </DialogTitle>
            <DialogDescription className={cn("text-xs", isDark ? "text-slate-300" : "text-navy/70")}>
              Set a new login password for <span className="font-bold text-white">{staffForPasswordReset?.full_name}</span> ({staffForPasswordReset?.email}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetPasswordSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">New Login Password *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setResetPasswordInput(generateRandomPassword())
                    setShowResetPassword(true)
                  }}
                  className={cn("h-6 px-2 text-[11px] font-bold gap-1 rounded-lg", isDark ? "text-teal hover:bg-teal/20" : "text-navy hover:bg-navy/10")}
                >
                  <Sparkles className="w-3 h-3" />
                  Generate
                </Button>
              </div>

              <div className="relative">
                <Input
                  required
                  type={showResetPassword ? "text" : "password"}
                  placeholder="Enter new password (min 6 chars)"
                  value={resetPasswordInput}
                  onChange={(e) => setResetPasswordInput(e.target.value)}
                  className={cn("h-9 text-xs rounded-xl pr-16 font-mono", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-slate-50 border-2 border-navy/20 text-navy")}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {resetPasswordInput && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(resetPasswordInput)
                        toast({ title: "Copied", description: "Password copied to clipboard." })
                      }}
                      className="text-slate-400 hover:text-white p-1"
                      title="Copy Password"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    {showResetPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStaffForPasswordReset(null)}
                className={cn("rounded-xl font-bold", isDark ? "border-slate-700 text-white" : "border-navy/20 text-navy")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isResetting}
                className={cn("rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-black")}
              >
                {isResetting ? "Updating..." : "Confirm & Save Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 7. DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!staffToDelete} onOpenChange={(open) => !open && setStaffToDelete(null)}>
        <DialogContent className={cn("max-w-md rounded-2xl", isDark ? "bg-[#0a1033] text-white border-red-500/30" : "bg-white text-navy border-2 border-navy/20")}>
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
