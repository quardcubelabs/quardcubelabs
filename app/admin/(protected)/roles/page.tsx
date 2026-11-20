"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import { CardTitleIcon } from "@/components/admin/card-title-icon"
import AdminLoading from "@/components/admin/admin-loading"
import {
  getRoles,
  updateRolePermissions,
  createRole,
  createPermission,
  getCustomPermissions,
  type CustomPermissionItem,
} from "@/lib/role-actions"
import { PERMISSION_CATEGORIES, LEGACY_PERMISSION_ALIASES } from "@/lib/role-constants"
import { getStaffMembers } from "@/lib/staff-actions"
import type { RoleDefinition, AdminRoleType, StaffMember } from "@/lib/erp/types"
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Users,
  Check,
  Layers,
  Sparkles,
  Info,
  Shield,
  SlidersHorizontal,
  Plus,
  Eye,
  IdCard,
  Building2,
  Phone,
  Mail,
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
  type AdminTableColumn,
  type AdminTableAction,
} from "@/components/admin/ui"

const ROLE_THEMES: Record<AdminRoleType, { gradient: string; text: string; bg: string; border: string }> = {
  owner_admin: {
    gradient: "from-teal-500 to-emerald-600",
    text: "text-teal",
    bg: "bg-teal/10",
    border: "border-teal/30",
  },
  manager: {
    gradient: "from-blue-600 to-indigo-700",
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
  accountant: {
    gradient: "from-purple-600 to-pink-600",
    text: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
  },
  stock_manager: {
    gradient: "from-amber-500 to-orange-600",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  cashier: {
    gradient: "from-emerald-500 to-teal-700",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
}

export default function RolesPermissionsPage() {
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [roles, setRoles] = useState<RoleDefinition[]>([])
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [customPerms, setCustomPerms] = useState<CustomPermissionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRoleId, setSelectedRoleId] = useState<AdminRoleType>("owner_admin")
  const [activePermissions, setActivePermissions] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // New Role modal state
  const [isNewRoleOpen, setIsNewRoleOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [newRoleSlug, setNewRoleSlug] = useState("")
  const [newRoleDescription, setNewRoleDescription] = useState("")
  const [newRoleBadge, setNewRoleBadge] = useState("")
  const [isCreatingRole, setIsCreatingRole] = useState(false)

  // New Privilege modal state
  const [isNewPrivilegeOpen, setIsNewPrivilegeOpen] = useState(false)
  const [newPrivSlug, setNewPrivSlug] = useState("")
  const [newPrivName, setNewPrivName] = useState("")
  const [newPrivDescription, setNewPrivDescription] = useState("")
  const [newPrivCategory, setNewPrivCategory] = useState("Sales & Commercial Operations")
  const [isCreatingPrivilege, setIsCreatingPrivilege] = useState(false)

  // Assigned staff detail state
  const [viewingStaff, setViewingStaff] = useState<StaffMember | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [roleData, staffData, permData] = await Promise.all([
        getRoles(),
        getStaffMembers(),
        getCustomPermissions(),
      ])
      setRoles(roleData || [])
      setStaffList(staffData || [])
      setCustomPerms(permData || [])

      const normalizePerms = (list: string[]) =>
        Array.from(
          new Set(
            list.map((p) =>
              p in LEGACY_PERMISSION_ALIASES
                ? (LEGACY_PERMISSION_ALIASES as Record<string, string>)[p]
                : p
            )
          )
        )

      const initialRole = roleData?.find((r) => r.id === selectedRoleId) || roleData?.[0]
      if (initialRole) {
        setSelectedRoleId(initialRole.id)
        setActivePermissions(normalizePerms(initialRole.permissions || []))
      }
      setHasChanges(false)
    } catch (err: any) {
      toast({ title: "Error Loading Roles", description: err.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoleName.trim()) {
      toast({ title: "Validation Error", description: "Role display name is required.", variant: "destructive" })
      return
    }
    const slug = (newRoleSlug || newRoleName).toLowerCase().replace(/[^a-z0-9_]/g, "_").trim()
    setIsCreatingRole(true)
    try {
      const res = await createRole({
        id: slug,
        name: newRoleName.trim(),
        description: newRoleDescription.trim(),
        badge: newRoleBadge.trim() || newRoleName.trim().toUpperCase(),
        permissions: [],
      })
      if (res.success && res.role) {
        toast({
          title: "Role Created Successfully",
          description: `Custom role "${res.role.name}" is now active in the security matrix.`,
        })
        setRoles((prev) => [...prev, res.role!])
        setSelectedRoleId(res.role.id as AdminRoleType)
        setActivePermissions([])
        setIsNewRoleOpen(false)
        setNewRoleName("")
        setNewRoleSlug("")
        setNewRoleDescription("")
        setNewRoleBadge("")
      } else {
        toast({ title: "Role Creation Failed", description: res.error || "Could not save role.", variant: "destructive" })
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setIsCreatingRole(false)
    }
  }

  const handleCreatePrivilege = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPrivName.trim()) {
      toast({ title: "Validation Error", description: "Privilege display name is required.", variant: "destructive" })
      return
    }
    const slug = (newPrivSlug || newPrivName).toLowerCase().replace(/[^a-z0-9_:]/g, ":").trim()
    setIsCreatingPrivilege(true)
    try {
      const res = await createPermission({
        id: slug,
        name: newPrivName.trim(),
        description: newPrivDescription.trim(),
        category: newPrivCategory.trim(),
      })
      if (res.success && res.permission) {
        toast({
          title: "Privilege Registered",
          description: `Permission "${res.permission.name}" (${res.permission.id}) registered.`,
        })
        setCustomPerms((prev) => [...prev, res.permission!])
        setIsNewPrivilegeOpen(false)
        setNewPrivName("")
        setNewPrivSlug("")
        setNewPrivDescription("")
      } else {
        toast({ title: "Privilege Registration Failed", description: res.error || "Could not register privilege.", variant: "destructive" })
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setIsCreatingPrivilege(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSelectRole = (roleId: AdminRoleType) => {
    setSelectedRoleId(roleId)
    const roleObj = roles.find((r) => r.id === roleId)
    if (roleObj) {
      const normalizePerms = (list: string[]) =>
        Array.from(
          new Set(
            list.map((p) =>
              p in LEGACY_PERMISSION_ALIASES
                ? (LEGACY_PERMISSION_ALIASES as Record<string, string>)[p]
                : p
            )
          )
        )
      setActivePermissions(normalizePerms(roleObj.permissions || []))
    }
    setHasChanges(false)
  }

  const handleTogglePermission = (permId: string) => {
    if (selectedRoleId === "owner_admin") {
      toast({
        title: "Owner / Admin Permissions Locked",
        description: "Owner/Admin inherently maintains all master system permissions.",
      })
      return
    }

    let updated: string[]
    if (activePermissions.includes(permId)) {
      updated = activePermissions.filter((id) => id !== permId)
    } else {
      updated = [...activePermissions, permId]
    }

    setActivePermissions(updated)
    setHasChanges(true)
  }

  const handleToggleCategory = (categoryPermIds: string[]) => {
    if (selectedRoleId === "owner_admin") return

    const allSelected = categoryPermIds.every((id) => activePermissions.includes(id))
    let updated: string[]

    if (allSelected) {
      // Uncheck all in category
      updated = activePermissions.filter((id) => !categoryPermIds.includes(id))
    } else {
      // Check all in category
      const merged = new Set([...activePermissions, ...categoryPermIds])
      updated = Array.from(merged)
    }

    setActivePermissions(updated)
    setHasChanges(true)
  }

  const handleSavePermissions = async () => {
    setIsSaving(true)
    try {
      await updateRolePermissions(selectedRoleId, activePermissions)
      toast({
        title: "Permissions Updated",
        description: `Security permissions for ${currentRole?.name} saved successfully.`,
      })
      setHasChanges(false)

      // update local state
      setRoles((prev) =>
        prev.map((r) => (r.id === selectedRoleId ? { ...r, permissions: activePermissions } : r))
      )
    } catch (err: any) {
      toast({ title: "Save Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const currentRole = roles.find((r) => r.id === selectedRoleId)
  const currentRoleStaff = staffList.filter((s) => s.role === selectedRoleId)

  const allCategories = useMemo(() => {
    const list = PERMISSION_CATEGORIES.map((cat) => ({
      ...cat,
      permissions: [...cat.permissions],
    }))

    customPerms.forEach((cp) => {
      const existing = list.find((c) => c.category.toLowerCase() === cp.category.toLowerCase())
      if (existing) {
        if (!existing.permissions.some((p) => p.id === cp.id)) {
          existing.permissions.push({ id: cp.id, name: cp.name, description: cp.description })
        }
      } else {
        list.push({
          category: cp.category,
          description: "Custom administrative and operational privileges",
          permissions: [{ id: cp.id, name: cp.name, description: cp.description }],
        })
      }
    })
    return list
  }, [customPerms])

  const totalSystemPermissions = allCategories.reduce((acc, cat) => acc + cat.permissions.length, 0)

  const staffColumns: AdminTableColumn<StaffMember>[] = [
    {
      key: "member",
      header: "Member",
      render: (s) => <AdminPrimaryCell icon={Users} title={s.full_name} subtitle={s.staff_code} />,
    },
    {
      key: "branch",
      header: "Branch",
      hidden: "sm",
      render: (s) => <AdminMutedText>{s.branch_name}</AdminMutedText>,
    },
    {
      key: "status",
      header: "Status",
      render: (s) => (
        <AdminStatusBadge
          status={s.status}
          label={s.status === "active" ? "Active" : s.status === "on_leave" ? "On Leave" : "Inactive"}
        />
      ),
    },
  ]

  const staffActions: AdminTableAction<StaffMember>[] = [
    {
      key: "view",
      label: "View Assigned Member",
      icon: Eye,
      variant: "view",
      onClick: (s) => {
        setViewingStaff(s)
        setIsViewOpen(true)
      },
    },
  ]

  if (isLoading) {
    return <AdminLoading message="Loading role security matrix..." />
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="Roles & Permissions"
        subtitle="Configure role access levels across POS, Invoicing, Inventory, Procurement, Financials, and Staff management."
        icon={ShieldCheck}
        addLabel="Save"
        onAdd={handleSavePermissions}
        actions={
          <>
            <Button
              size="sm"
              onClick={() => setIsNewRoleOpen(true)}
              className="rounded-xl font-bold h-10 px-3.5 gap-1.5 border-2 border-navy/20 bg-white text-navy hover:bg-teal-50"
            >
              <Plus className="w-4 h-4" />
              New Role
            </Button>
            <Button
              size="sm"
              onClick={() => setIsNewPrivilegeOpen(true)}
              className="rounded-xl font-bold h-10 px-3.5 gap-1.5 border-2 border-navy/20 bg-white text-navy hover:bg-teal-50"
            >
              <KeyRound className="w-4 h-4" />
              <span className="hidden sm:inline">New Privilege</span>
              <span className="sm:hidden">Privilege</span>
            </Button>
          </>
        }
      />

      <AdminStats
        columns={4}
        items={[
          { title: "Defined Roles", value: `${roles.length || 5} Roles`, icon: KeyRound },
          { title: "Active Assignments", value: `${staffList.length} Staff`, icon: Users },
          { title: "Security Policies", value: `${totalSystemPermissions} Rules`, icon: Lock },
          { title: "Protected Modules", value: `${allCategories.length} Categories`, icon: Layers },
        ]}
      />

      <AdminFilterBar>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <label className="text-xs sm:text-sm font-black whitespace-nowrap">
                Configuring Role:
              </label>
            </div>
            <div className="w-full sm:w-[280px]">
              <AdminSelect
                value={selectedRoleId}
                onValueChange={(val) => handleSelectRole(val as AdminRoleType)}
                options={roles.map((r) => ({
                  value: r.id,
                  label: `${r.name} (${staffList.filter((s) => s.role === r.id).length} Assigned)`,
                }))}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <AdminPill>
              Granted: <span className="font-black text-emerald-500">{activePermissions.length}</span>
              <span className="opacity-60"> / {totalSystemPermissions}</span>
            </AdminPill>
            {selectedRoleId === "owner_admin" && (
              <AdminPill className="uppercase tracking-wider">Full Root Authority</AdminPill>
            )}
            {hasChanges && (
              <span className="bg-amber-500 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded animate-pulse">
                Unsaved Changes
              </span>
            )}
          </div>
        </div>
      </AdminFilterBar>

      {/* 4. PERMISSIONS MATRIX & ASSIGNED STAFF SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: PERMISSION CATEGORIES MATRIX */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            className={cn(
              "rounded-2xl sm:rounded-3xl border shadow-sm overflow-hidden",
              isDark ? "bg-[#0a1033] border-none" : "bg-white border-2 border-navy/20"
            )}
          >
            <CardHeader className={cn("p-4 sm:p-5 pb-3 border-b", isDark ? "border-slate-800" : "border-navy/15")}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className={cn("text-base font-black flex items-center gap-2.5", isDark ? "text-white" : "text-navy")}>
                    <CardTitleIcon icon={Lock} isDark={isDark} />
                    Permission Matrix for{" "}
                    <span className={isDark ? "text-teal" : "text-navy font-black underline decoration-teal decoration-2 underline-offset-4"}>
                      {currentRole?.name}
                    </span>
                  </CardTitle>
                  <CardDescription className={cn("text-xs", isDark ? "text-slate-400" : "text-navy/70")}>
                    {activePermissions.length} of {totalSystemPermissions} system permissions granted.
                  </CardDescription>
                </div>
                {hasChanges && (
                  <span className="bg-amber-500 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse">
                    Unsaved Changes
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-5">
              {allCategories.map((cat, catIdx) => {
                const catPermIds = cat.permissions.map((p) => p.id)
                const enabledCount = catPermIds.filter((id) => activePermissions.includes(id)).length
                const allEnabled = enabledCount === catPermIds.length

                return (
                  <div
                    key={catIdx}
                    className={cn(
                      "p-4 rounded-2xl border transition-all",
                      isDark ? "bg-[#080d2a] border-slate-800" : "bg-slate-50/80 border-2 border-navy/15"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className={cn("font-black text-xs uppercase tracking-wider flex items-center gap-1.5", isDark ? "text-white" : "text-navy")}>
                          <Sparkles className={cn("w-3.5 h-3.5", isDark ? "text-teal" : "text-navy")} />
                          {cat.category}
                        </h4>
                        <p className={cn("text-[10.5px] mt-0.5", isDark ? "text-slate-400" : "text-navy/60")}>
                          {cat.description}
                        </p>
                      </div>

                      {selectedRoleId !== "owner_admin" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleCategory(catPermIds)}
                          className={cn(
                            "h-7 text-[10.5px] font-bold rounded-lg px-2",
                            isDark ? "hover:bg-slate-800 text-teal" : "hover:bg-navy/10 text-navy"
                          )}
                        >
                          {allEnabled ? "Deselect All" : "Select All"}
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {cat.permissions.map((p) => {
                        const isChecked = activePermissions.includes(p.id)

                        return (
                          <div
                            key={p.id}
                            onClick={() => handleTogglePermission(p.id)}
                            className={cn(
                              "p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all",
                              isChecked
                                ? isDark
                                  ? "bg-teal/15 border-teal/40 text-white"
                                  : "bg-teal/15 border-2 border-navy text-navy"
                                : isDark
                                  ? "bg-[#060a22] border-slate-800 text-slate-400 hover:border-slate-700"
                                  : "bg-white border-2 border-navy/15 text-navy/80 hover:border-navy/40"
                            )}
                          >
                            <div
                              className={cn(
                                "w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all",
                                isChecked
                                  ? isDark
                                    ? "bg-teal text-navy font-black shadow-2xs"
                                    : "bg-navy text-white font-black shadow-2xs"
                                  : isDark
                                    ? "border border-slate-700 bg-slate-800"
                                    : "border-2 border-navy/20 bg-slate-100"
                              )}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            <div className="space-y-0.5">
                              <p className={cn("text-xs font-bold leading-tight", isChecked ? (isDark ? "text-white" : "text-navy font-black") : "")}>
                                {p.name}
                              </p>
                              <p className={cn("text-[10px] line-clamp-1 leading-tight", isDark ? "text-slate-400" : "text-navy/60")}>
                                {p.description}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: ASSIGNED STAFF MEMBERS & SECURITY OVERVIEW */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between px-1 pb-2">
              <h3 className="text-sm font-black flex items-center gap-2">
                <Users className="w-4 h-4" />
                Assigned Personnel
              </h3>
              <AdminPill>{currentRoleStaff.length} Members</AdminPill>
            </div>
            <AdminTable
              columns={staffColumns}
              data={currentRoleStaff}
              rowKey={(s) => s.id}
              actions={staffActions}
              onRowClick={(s) => {
                setViewingStaff(s)
                setIsViewOpen(true)
              }}
              emptyIcon={Users}
              emptyTitle="No assigned staff"
              emptyDescription={`No staff members currently assigned to ${currentRole?.name}.`}
            />
          </div>

          <Card
            className={cn(
              "rounded-2xl sm:rounded-3xl border shadow-sm p-4 sm:p-5",
              isDark ? "bg-[#080d2a] border-slate-800" : "bg-slate-50 border-2 border-navy/15"
            )}
          >
            <div className="flex items-start gap-3">
              <Info className={cn("w-5 h-5 shrink-0 mt-0.5", isDark ? "text-teal" : "text-navy")} />
              <div className="space-y-1 text-xs">
                <h5 className={cn("font-bold", isDark ? "text-white" : "text-navy")}>
                  Role-Based Access Enforcement
                </h5>
                <p className={cn("text-[11px] leading-relaxed", isDark ? "text-slate-400" : "text-navy/70")}>
                  Permissions are synchronized in real-time across POS devices, web dashboards, and mobile views. Any changes to a role immediately govern what actions staff members can execute.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <AdminFormModal
        open={isNewRoleOpen}
        onOpenChange={setIsNewRoleOpen}
        icon={Plus}
        title="Define New System Role"
        description="Create a custom RBAC access role with specific permission privileges."
        onSubmit={handleCreateRole}
        isSubmitting={isCreatingRole}
        size="md"
        createLabel="Create Role"
        submitLabel="Create Role"
      >
        <AdminFormField label="Role Name" required>
          <AdminInput
            placeholder="e.g. Operations Supervisor"
            value={newRoleName}
            onChange={(e) => {
              setNewRoleName(e.target.value)
              if (!newRoleSlug) {
                setNewRoleSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))
              }
            }}
          />
        </AdminFormField>
        <AdminFormGrid>
          <AdminFormField label="Role Key / Identifier" required>
            <AdminInput
              monospace
              placeholder="e.g. supervisor"
              value={newRoleSlug}
              onChange={(e) => setNewRoleSlug(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Badge Tag">
            <AdminInput
              monospace
              placeholder="e.g. SUPERVISOR"
              value={newRoleBadge}
              onChange={(e) => setNewRoleBadge(e.target.value)}
            />
          </AdminFormField>
        </AdminFormGrid>
        <AdminFormField label="Description">
          <AdminInput
            placeholder="Briefly describe responsibilities and authority..."
            value={newRoleDescription}
            onChange={(e) => setNewRoleDescription(e.target.value)}
          />
        </AdminFormField>
      </AdminFormModal>

      <AdminFormModal
        open={isNewPrivilegeOpen}
        onOpenChange={setIsNewPrivilegeOpen}
        icon={KeyRound}
        title="Register New System Privilege"
        description="Define a new permission action that can be selectively granted across roles."
        onSubmit={handleCreatePrivilege}
        isSubmitting={isCreatingPrivilege}
        size="md"
        createLabel="Register Privilege"
        submitLabel="Register Privilege"
      >
        <AdminFormField label="Privilege Display Name" required>
          <AdminInput
            placeholder="e.g. Manage CCTV Deployments"
            value={newPrivName}
            onChange={(e) => {
              setNewPrivName(e.target.value)
              if (!newPrivSlug) {
                setNewPrivSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_:]/g, ":"))
              }
            }}
          />
        </AdminFormField>
        <AdminFormField label="Permission Key / Identifier (Slug)" required>
          <AdminInput
            monospace
            placeholder="e.g. cctv:manage"
            value={newPrivSlug}
            onChange={(e) => setNewPrivSlug(e.target.value)}
          />
        </AdminFormField>
        <AdminFormField label="Module Category">
          <AdminSelect
            value={newPrivCategory}
            onValueChange={setNewPrivCategory}
            options={[
              ...PERMISSION_CATEGORIES.map((c) => ({ value: c.category, label: c.category })),
              { value: "Custom Operational Privileges", label: "Custom Operational Privileges" },
            ]}
          />
        </AdminFormField>
        <AdminFormField label="Description">
          <AdminInput
            placeholder="What operational scope does this permission grant?"
            value={newPrivDescription}
            onChange={(e) => setNewPrivDescription(e.target.value)}
          />
        </AdminFormField>
      </AdminFormModal>

      <AdminDetailModal
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        icon={Users}
        title={viewingStaff?.full_name || "Assigned Staff"}
        subtitle={`${viewingStaff?.staff_code || ""} • ${viewingStaff?.branch_name || ""}`}
        badge={viewingStaff && <AdminStatusBadge status={viewingStaff.status} label={viewingStaff.status === "on_leave" ? "On Leave" : undefined} />}
        size="md"
        sections={[
          {
            key: "identity",
            title: "Member Identity",
            icon: IdCard,
            fields: [
              { label: "Full Name", value: viewingStaff?.full_name || "—" },
              { label: "Staff Code", value: <AdminPill>{viewingStaff?.staff_code || "—"}</AdminPill> },
              { label: "Email", value: viewingStaff?.email || "—" },
              { label: "Phone", value: viewingStaff?.phone || "—" },
            ],
          },
          {
            key: "assignment",
            title: "Role Assignment",
            icon: Shield,
            fields: [
              { label: "Role", value: currentRole?.name || viewingStaff?.role || "—" },
              { label: "Branch", value: viewingStaff?.branch_name || "—" },
              { label: "Branch ID", value: viewingStaff?.branch_id || "—" },
              { label: "Status", value: viewingStaff?.status || "—" },
            ],
          },
          {
            key: "contact",
            title: "Contact",
            icon: Building2,
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
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
