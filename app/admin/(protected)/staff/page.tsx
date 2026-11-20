"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminLoading from "@/components/admin/admin-loading"
import {
  getStaffMembers,
  createStaffMember,
  updateStaffMember,
  toggleStaffStatus,
  deleteStaffMember,
  resetStaffPassword,
  syncAllStaffToAuth,
  getStaffAuthStatusMap,
} from "@/lib/staff-actions"
import { getBranches } from "@/lib/branch-actions"
import type { StaffMember, AdminRoleType, Branch } from "@/lib/erp/types"
import {
  Users,
  Building2,
  CheckCircle2,
  Trash2,
  Edit,
  KeyRound,
  Store,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Shield,
  ShieldCheck,
  ExternalLink,
  UserCheck,
  Mail,
  Phone,
  IdCard,
} from "lucide-react"
import {
  AdminPageHeader,
  AdminStats,
  AdminFilterBar,
  AdminTable,
  AdminPrimaryCell,
  AdminPill,
  AdminMutedText,
  AdminStatusBadge,
  AdminDetailModal,
  AdminFormModal,
  AdminFormGrid,
  AdminFormField,
  AdminInput,
  AdminSelect,
  AdminConfirmDialog,
  type AdminTableColumn,
  type AdminTableAction,
} from "@/components/admin/ui"

const ROLE_CONFIG: Record<AdminRoleType, { label: string; color: string; bg: string }> = {
  owner_admin: { label: "Owner / Admin", color: "text-teal-400 border-teal-500/40", bg: "bg-teal/15" },
  manager: { label: "Manager", color: "text-blue-400 border-blue-500/40", bg: "bg-blue-500/15" },
  accountant: { label: "Accountant", color: "text-purple-400 border-purple-500/40", bg: "bg-purple-500/15" },
  stock_manager: { label: "Stock Manager", color: "text-amber-400 border-amber-500/40", bg: "bg-amber-500/15" },
  cashier: { label: "Cashier", color: "text-emerald-400 border-emerald-500/40", bg: "bg-emerald-500/15" },
}

export default function StaffPage() {
  const { toast } = useToast()

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

  // Delete & View State
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null)
  const [viewingStaff, setViewingStaff] = useState<StaffMember | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
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
        getStaffAuthStatusMap(),
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
          variant: "destructive",
        })
      } else {
        toast({
          title: "Supabase Auth Synced",
          description: `Successfully synchronized ${res.total} staff members into Supabase Auth. (${res.created} new created, ${res.updated} updated).`,
        })
      }
      await loadData()
    } catch (err: any) {
      toast({
        title: "Sync Error",
        description: err.message || "Failed to sync staff with Supabase Auth.",
        variant: "destructive",
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

    const branchObj = branches.find((b) => b.id === selectedBranchId)
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
          ...(password ? { password: password.trim() } : {}),
        })
        toast({
          title: "Staff Updated",
          description: password ? `${fullName} profile & password updated.` : `${fullName} has been updated.`,
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
          send_invite: sendInvite,
        })
        toast({
          title: "Staff Member Registered",
          description: password
            ? `${fullName} registered with login credentials.`
            : `${fullName} added to the team.`,
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
        description: `${name} is now ${newStatus === "active" ? "Active" : "Inactive"}.`,
      })
      loadData()
    } catch (err: any) {
      toast({ title: "Action Failed", description: err.message, variant: "destructive" })
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
          description: `Login password for ${staffForPasswordReset.full_name} was successfully updated.`,
        })
        setStaffForPasswordReset(null)
        setResetPasswordInput("")
      } else {
        toast({
          title: "Password Reset Failed",
          description: result.error || "Unable to reset password.",
          variant: "destructive",
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
      setIsViewOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtered list
  const filteredStaff = staffList.filter((s) => {
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
  const activeStaff = staffList.filter((s) => s.status === "active").length
  const totalBranchesRepresented = new Set(staffList.map((s) => s.branch_id)).size
  const totalRolesRepresented = new Set(staffList.map((s) => s.role)).size

  const isAuthSynced = (s: StaffMember) => !!authStatusMap[(s.email || "").toLowerCase().trim()]?.exists

  if (isLoading && staffList.length === 0) {
    return <AdminLoading message="Loading staff and personnel..." />
  }

  const columns: AdminTableColumn<StaffMember>[] = [
    {
      key: "staff",
      header: "Staff Member",
      render: (s) => (
        <AdminPrimaryCell
          icon={Users}
          title={s.full_name}
          subtitle={s.staff_code}
          href={`/admin/staff/${s.id}`}
        />
      ),
    },
    {
      key: "role",
      header: "Role Assignment",
      render: (s) => {
        const roleMeta = ROLE_CONFIG[s.role] || {
          label: s.role,
          color: "text-slate-400 border-slate-500/40",
          bg: "bg-slate-500/15",
        }
        return (
          <AdminPill className={roleMeta.bg} title={roleMeta.label}>
            <Shield className="w-2.5 h-2.5 mr-1 inline" />
            {roleMeta.label}
          </AdminPill>
        )
      },
    },
    {
      key: "branch",
      header: "Branch Outlet",
      hidden: "md",
      render: (s) => (
        <span className="flex items-center gap-1.5 font-bold text-xs">
          <Building2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate max-w-[150px]">{s.branch_name}</span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      hidden: "sm",
      align: "center",
      render: (s) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(s.id, s.full_name)}
          title="Click to toggle status"
          className="cursor-pointer"
        >
          <AdminStatusBadge
            status={s.status === "on_leave" ? "pending" : s.status}
            label={s.status === "active" ? "Active" : s.status === "on_leave" ? "On Leave" : "Inactive"}
          />
        </button>
      ),
    },
  ]

  const actions: AdminTableAction<StaffMember>[] = [
    {
      key: "view",
      label: "View Staff Details",
      icon: Eye,
      variant: "view",
      onClick: (s) => {
        setViewingStaff(s)
        setIsViewOpen(true)
      },
    },
    {
      key: "profile",
      label: "View Staff Profile & Analytics",
      icon: ExternalLink,
      variant: "soft",
      href: (s) => `/admin/staff/${s.id}`,
      mobile: false,
    },
    {
      key: "password",
      label: "Reset / Set Login Password",
      icon: KeyRound,
      variant: "soft",
      mobile: false,
      onClick: (s) => {
        setStaffForPasswordReset(s)
        setResetPasswordInput(generateRandomPassword())
        setShowResetPassword(true)
      },
    },
    {
      key: "edit",
      label: "Edit Staff Member",
      icon: Edit,
      variant: "edit",
      onClick: handleOpenEdit,
    },
    {
      key: "delete",
      label: "Delete Staff Member",
      icon: Trash2,
      variant: "delete",
      onClick: (s) => setStaffToDelete(s),
    },
  ]

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden pb-12">
      <AdminPageHeader
        title="Staff & Personnel"
        accent="Management"
        subtitle="Manage team members, branch assignments, credentials, and role-based access control."
        icon={Users}
        onRefresh={loadData}
        refreshing={isLoading}
        onAdd={handleOpenCreate}
        addLabel="Add Staff Member"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncAuth}
            disabled={isSyncingAuth}
            title="Auto-sync all staff members into Supabase Auth database"
            className="font-bold rounded-xl h-10 px-3.5 gap-1.5 border-2"
          >
            <ShieldCheck className={`w-4 h-4 ${isSyncingAuth ? "animate-spin text-teal" : ""}`} />
            <span className="hidden sm:inline">{isSyncingAuth ? "Syncing..." : "Sync Auth"}</span>
          </Button>
        }
      />

      <AdminStats
        columns={4}
        items={[
          { title: "Total Staff", value: totalStaff.toString(), icon: Users },
          { title: "Active On Duty", value: activeStaff.toString(), icon: CheckCircle2 },
          { title: "Roles Active", value: `${totalRolesRepresented} Roles`, icon: KeyRound },
          { title: "Branches Covered", value: `${totalBranchesRepresented} Outlets`, icon: Store },
        ]}
      />

      <AdminFilterBar
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search staff name, code, email, phone..."
        selects={[
          {
            value: roleFilter,
            onValueChange: setRoleFilter,
            placeholder: "All Roles",
            allLabel: "All Roles",
            options: (Object.keys(ROLE_CONFIG) as AdminRoleType[]).map((role) => ({
              value: role,
              label: ROLE_CONFIG[role].label,
            })),
          },
          {
            value: branchFilter,
            onValueChange: setBranchFilter,
            placeholder: "All Branches",
            allLabel: "All Branches",
            options: branches.map((b) => ({ value: b.id, label: b.name })),
          },
          {
            value: statusFilter,
            onValueChange: setStatusFilter,
            placeholder: "All Statuses",
            allLabel: "All Statuses",
            options: [
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "on_leave", label: "On Leave" },
            ],
          },
        ]}
      />

      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-lg sm:text-xl font-bold">Staff Directory</h2>
          <p className="text-xs font-semibold text-navy/70 dark:text-teal-400">
            {filteredStaff.length} team members registered
          </p>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={filteredStaff}
        rowKey={(s) => s.id}
        actions={actions}
        emptyIcon={Users}
        emptyTitle="No staff members found"
        emptyDescription="Try changing search filters or create a new team member."
      />

      <AdminFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        icon={UserCheck}
        title={editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
        description="Assign employee role, branch outlet, and authentication login credentials."
        onSubmit={handleSave}
        isSubmitting={isSaving}
        isEdit={!!editingStaff}
        createLabel="Create Staff & Credentials"
        editLabel="Save Changes"
        size="md"
      >
        <AdminFormGrid>
          <AdminFormField label="Full Name" required className="sm:col-span-2">
            <AdminInput
              required
              placeholder="e.g. David Kimaro"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Staff ID / Code" required>
            <AdminInput
              required
              monospace
              placeholder="STF-101"
              value={staffCode}
              onChange={(e) => setStaffCode(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Role Assignment" required>
            <AdminSelect
              value={selectedRole}
              onValueChange={(val) => setSelectedRole(val as AdminRoleType)}
              options={(Object.keys(ROLE_CONFIG) as AdminRoleType[]).map((role) => ({
                value: role,
                label: ROLE_CONFIG[role].label,
              }))}
            />
          </AdminFormField>
          <AdminFormField label="Branch Location" required className="sm:col-span-2">
            <AdminSelect
              value={selectedBranchId}
              onValueChange={setSelectedBranchId}
              options={branches.map((b) => ({
                value: b.id,
                label: `${b.name} (${b.city})`,
              }))}
            />
          </AdminFormField>
          <AdminFormField label="Work Email (Login ID)" required>
            <AdminInput
              type="email"
              required
              placeholder="staff@quardcubelabs.co.tz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Phone Number">
            <AdminInput
              monospace
              placeholder="+255 762 112 233"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Status" className="sm:col-span-2">
            <AdminSelect
              value={status}
              onValueChange={(val) => setStatus(val as typeof status)}
              options={[
                { value: "active", label: "Active (Full Access)" },
                { value: "inactive", label: "Inactive (Suspended)" },
                { value: "on_leave", label: "On Leave" },
              ]}
            />
          </AdminFormField>
        </AdminFormGrid>

        <div className="space-y-3 rounded-xl border-2 border-navy/20 p-3.5 dark:border-teal/30">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <p className="text-xs font-bold uppercase tracking-wider">
                {editingStaff ? "Update Login Password (Optional)" : "Initial Login Password *"}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setPassword(generateRandomPassword())
                setShowPassword(true)
              }}
              className="h-7 px-2.5 text-[11px] font-bold gap-1 rounded-lg"
            >
              <Sparkles className="w-3 h-3" />
              Auto-Generate
            </Button>
          </div>

          <div className="relative">
            <AdminInput
              type={showPassword ? "text" : "password"}
              className="pr-20"
              monospace
              placeholder={editingStaff ? "Leave blank to keep existing password" : "Enter minimum 6 characters"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
                title={showPassword ? "Hide password" : "Show password"}
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
                className="rounded accent-teal cursor-pointer h-4 w-4"
              />
              <label htmlFor="sendInviteCheckbox" className="text-xs font-medium cursor-pointer select-none">
                Send activation link to staff work email upon creation
              </label>
            </div>
          )}
        </div>
      </AdminFormModal>

      <AdminFormModal
        open={!!staffForPasswordReset}
        onOpenChange={(open) => {
          if (!open) setStaffForPasswordReset(null)
        }}
        icon={KeyRound}
        title="Reset Staff Password"
        description={`Set a new login password for ${staffForPasswordReset?.full_name || ""} (${staffForPasswordReset?.email || ""}).`}
        onSubmit={handleResetPasswordSubmit}
        isSubmitting={isResetting}
        size="sm"
        submitLabel="Confirm & Save Password"
      >
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setResetPasswordInput(generateRandomPassword())
              setShowResetPassword(true)
            }}
            className="h-6 px-2 text-[11px] font-bold gap-1 rounded-lg"
          >
            <Sparkles className="w-3 h-3" />
            Generate
          </Button>
        </div>
        <div className="relative">
          <AdminInput
            required
            monospace
            type={showResetPassword ? "text" : "password"}
            placeholder="Enter new password (min 6 chars)"
            value={resetPasswordInput}
            onChange={(e) => setResetPasswordInput(e.target.value)}
            className="pr-20"
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
              title={showResetPassword ? "Hide password" : "Show password"}
            >
              {showResetPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </AdminFormModal>

      <AdminDetailModal
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        icon={Users}
        title={viewingStaff?.full_name || "Staff Details"}
        subtitle={`${viewingStaff?.staff_code || ""} • ${viewingStaff ? ROLE_CONFIG[viewingStaff.role]?.label || viewingStaff.role : ""}`}
        badge={viewingStaff && <AdminStatusBadge status={viewingStaff.status === "on_leave" ? "pending" : viewingStaff.status} label={viewingStaff.status === "on_leave" ? "On Leave" : undefined} />}
        size="lg"
        headerActions={
          viewingStaff && (
            <Button variant="outline" size="sm" asChild className="font-bold rounded-xl h-10 px-4">
              <a href={`/admin/staff/${viewingStaff.id}`}>
                <ExternalLink className="w-4 h-4 mr-1.5" />
                Full Profile
              </a>
            </Button>
          )
        }
        sections={[
          {
            key: "identity",
            title: "Staff Identity",
            icon: IdCard,
            span: 2,
            fields: [
              { label: "Full Name", value: viewingStaff?.full_name || "—" },
              { label: "Staff Code", value: <AdminPill>{viewingStaff?.staff_code || "—"}</AdminPill> },
              { label: "Email", value: viewingStaff?.email || "—" },
              { label: "Phone", value: viewingStaff?.phone || "—" },
            ],
          },
          {
            key: "assignment",
            title: "Role & Branch Assignment",
            icon: Building2,
            fields: [
              {
                label: "Role",
                value: viewingStaff ? ROLE_CONFIG[viewingStaff.role]?.label || viewingStaff.role : "—",
              },
              { label: "Branch", value: viewingStaff?.branch_name || "—" },
              { label: "Branch ID", value: viewingStaff?.branch_id || "—" },
              { label: "Status", value: viewingStaff?.status?.replace("_", " ") || "—" },
            ],
          },
          {
            key: "auth",
            title: "Authentication & Access",
            icon: ShieldCheck,
            fields: [
              {
                label: "Supabase Auth",
                value: viewingStaff ? (isAuthSynced(viewingStaff) ? "Synced" : "Not synced") : "—",
              },
              { label: "Login Email", value: viewingStaff?.email || "—" },
            ],
          },
          {
            key: "contact",
            title: "Contact Actions",
            icon: Mail,
            content: (
              <div className="flex flex-wrap gap-2">
                {viewingStaff?.email && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${viewingStaff.email}`}>
                      <Mail className="w-4 h-4 mr-1.5" /> Email
                    </a>
                  </Button>
                )}
                {viewingStaff?.phone && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${viewingStaff.phone}`}>
                      <Phone className="w-4 h-4 mr-1.5" /> Call
                    </a>
                  </Button>
                )}
                <AdminMutedText>Use the toolbar to reset passwords or sync auth accounts.</AdminMutedText>
              </div>
            ),
          },
        ]}
        onEdit={() => {
          if (viewingStaff) {
            setIsViewOpen(false)
            handleOpenEdit(viewingStaff)
          }
        }}
        editLabel="Edit Staff"
        onDelete={() => {
          if (viewingStaff) setStaffToDelete(viewingStaff)
        }}
        deleteLabel="Remove Staff"
      />

      <AdminConfirmDialog
        open={!!staffToDelete}
        onOpenChange={(open) => {
          if (!open) setStaffToDelete(null)
        }}
        title="Remove Staff Member"
        description={
          <>
            Are you sure you want to remove <span className="font-bold text-rose-400">{staffToDelete?.full_name}</span>{" "}
            ({staffToDelete?.staff_code})? This will revoke access permissions immediately.
          </>
        }
        confirmLabel="Delete Member"
        isSubmitting={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
