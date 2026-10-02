"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { AdminLoading } from "@/components/admin"
import { cn } from "@/lib/utils"
import { getRoles, updateRolePermissions } from "@/lib/role-actions"
import { PERMISSION_CATEGORIES } from "@/lib/role-constants"
import { getStaffMembers } from "@/lib/staff-actions"
import { RoleDefinition, AdminRoleType, StaffMember } from "@/lib/erp/types"
import {
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Lock,
  KeyRound,
  Users,
  Save,
  Check,
  X,
  AlertTriangle,
  Layers,
  ChevronRight,
  Sparkles,
  Info
} from "lucide-react"

const ROLE_THEMES: Record<AdminRoleType, { gradient: string; text: string; bg: string; border: string }> = {
  owner_admin: {
    gradient: "from-teal-500 to-emerald-600",
    text: "text-teal",
    bg: "bg-teal/10",
    border: "border-teal/30"
  },
  manager: {
    gradient: "from-blue-600 to-indigo-700",
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30"
  },
  accountant: {
    gradient: "from-purple-600 to-pink-600",
    text: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30"
  },
  stock_manager: {
    gradient: "from-amber-500 to-orange-600",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30"
  },
  cashier: {
    gradient: "from-emerald-500 to-teal-700",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30"
  }
}

export default function RolesPermissionsPage() {
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [roles, setRoles] = useState<RoleDefinition[]>([])
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRoleId, setSelectedRoleId] = useState<AdminRoleType>("owner_admin")
  const [activePermissions, setActivePermissions] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [roleData, staffData] = await Promise.all([
        getRoles(),
        getStaffMembers()
      ])
      setRoles(roleData || [])
      setStaffList(staffData || [])

      const initialRole = roleData?.find(r => r.id === selectedRoleId) || roleData?.[0]
      if (initialRole) {
        setSelectedRoleId(initialRole.id)
        setActivePermissions(initialRole.permissions || [])
      }
      setHasChanges(false)
    } catch (err: any) {
      toast({ title: "Error Loading Roles", description: err.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSelectRole = (roleId: AdminRoleType) => {
    setSelectedRoleId(roleId)
    const roleObj = roles.find(r => r.id === roleId)
    if (roleObj) {
      setActivePermissions(roleObj.permissions || [])
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
      updated = activePermissions.filter(id => id !== permId)
    } else {
      updated = [...activePermissions, permId]
    }

    setActivePermissions(updated)
    setHasChanges(true)
  }

  const handleToggleCategory = (categoryPermIds: string[]) => {
    if (selectedRoleId === "owner_admin") return

    const allSelected = categoryPermIds.every(id => activePermissions.includes(id))
    let updated: string[]

    if (allSelected) {
      // Uncheck all in category
      updated = activePermissions.filter(id => !categoryPermIds.includes(id))
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
        description: `Security permissions for ${currentRole?.name} saved successfully.`
      })
      setHasChanges(false)

      // update local state
      setRoles(prev => prev.map(r => r.id === selectedRoleId ? { ...r, permissions: activePermissions } : r))
    } catch (err: any) {
      toast({ title: "Save Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const currentRole = roles.find(r => r.id === selectedRoleId)
  const currentRoleStaff = staffList.filter(s => s.role === selectedRoleId)
  const totalSystemPermissions = PERMISSION_CATEGORIES.reduce((acc, cat) => acc + cat.permissions.length, 0)

  const statCards = [
    { title: "Defined Roles", value: "5 Roles", icon: KeyRound },
    { title: "Active Assignments", value: `${staffList.length} Staff`, icon: Users },
    { title: "Security Policies", value: `${totalSystemPermissions} Rules`, icon: Lock },
    { title: "Protected Modules", value: "5 Modules", icon: Layers },
  ]

  if (isLoading) {
    return <AdminLoading message="Loading role security matrix..." />
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
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  Roles & Permissions
                </h1>
                <Badge className={cn("text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider", isDark ? "bg-teal/20 text-teal border-teal/30" : "bg-navy text-white")}>
                  Security Matrix
                </Badge>
              </div>
              <p className={cn("text-xs sm:text-sm font-medium mt-0.5", isDark ? "text-slate-300" : "text-navy/80")}>
                Configure role access levels across POS, Invoicing, Inventory, Procurement, Financials, and Staff management.
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
              disabled={!hasChanges || isSaving || selectedRoleId === "owner_admin"}
              onClick={handleSavePermissions}
              className={cn(
                "font-black rounded-xl h-9 gap-1.5 shadow-md transition-all",
                isDark ? "bg-teal hover:bg-teal-400 text-navy" : "bg-navy hover:bg-navy/90 text-white",
                !hasChanges && "opacity-60 cursor-not-allowed"
              )}
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Role Matrix"}</span>
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

      {/* 3. ROLE SELECTOR FOLDER TABS & CONNECTED CONTENT CONTAINER */}
      <div className="space-y-0 relative">
        <div className="relative z-10 flex items-end gap-1.5 overflow-x-auto pb-0 w-full px-0 -mb-[2px]">
          {roles.map((r, idx) => {
            const isSelected = r.id === selectedRoleId
            const isFirst = idx === 0
            const assignedCount = staffList.filter(s => s.role === r.id).length

            return (
              <button
                key={r.id}
                onClick={() => handleSelectRole(r.id)}
                className={cn(
                  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer",
                  isSelected && isFirst
                    ? "rounded-tl-2xl sm:rounded-tl-3xl rounded-tr-xl sm:rounded-tr-2xl"
                    : "rounded-t-xl sm:rounded-t-2xl",
                  isSelected
                    ? cn(
                        "font-black border-2 border-b-0 border-navy/20 dark:border-teal/30 z-20 shadow-none",
                        isDark ? "bg-[#0c1833] text-teal" : "bg-[#e6f7f5] text-navy"
                      )
                    : "bg-transparent text-navy/70 hover:text-navy dark:text-slate-400 dark:hover:text-white border-0 hover:bg-teal-500/10 z-0"
                )}
              >
                {isSelected && (
                  <>
                    {/* Left concave fillet curve (only for non-first tabs) */}
                    {!isFirst && (
                      <span className="absolute -bottom-[2px] -left-[12px] w-[12px] h-[12px] overflow-hidden pointer-events-none z-20">
                        <svg className="w-[12px] h-[12px]" viewBox="0 0 12 12" fill="none">
                          <path d="M12 0C12 6.627 6.627 12 0 12H12V0Z" fill={isDark ? "#0c1833" : "#e6f7f5"} />
                          <path d="M0 12C6.627 12 12 6.627 12 0" stroke="currentColor" strokeWidth="2" className="text-navy/20 dark:text-teal/30" />
                        </svg>
                      </span>
                    )}
                    {/* Right concave fillet curve */}
                    <span className="absolute -bottom-[2px] -right-[12px] w-[12px] h-[12px] overflow-hidden pointer-events-none z-20">
                      <svg className="w-[12px] h-[12px]" viewBox="0 0 12 12" fill="none">
                        <path d="M0 0C0 6.627 5.373 12 12 12H0V0Z" fill={isDark ? "#0c1833" : "#e6f7f5"} />
                        <path d="M0 0C0 6.627 5.373 12 12 12" stroke="currentColor" strokeWidth="2" className="text-navy/20 dark:text-teal/30" />
                      </svg>
                    </span>
                    {/* Bottom bridge to erase content card top border under active tab */}
                    <span className={cn("absolute -bottom-[3px] -left-[2px] -right-[2px] h-[6px] z-30 pointer-events-none", isDark ? "bg-[#0c1833]" : "bg-[#e6f7f5]")} />
                  </>
                )}
                <KeyRound className={cn("h-4 w-4 shrink-0 relative z-40", isSelected ? "text-navy dark:text-teal" : "text-navy/60 dark:text-slate-400")} />
                <span className="relative z-40">{r.name}</span>
                <span className={cn(
                  "ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold relative z-40 transition-colors",
                  isSelected 
                    ? isDark ? "bg-teal text-navy font-black" : "bg-navy text-white font-bold"
                    : isDark ? "bg-teal/20 text-teal" : "bg-teal-100/80 text-navy"
                )}>
                  {assignedCount}
                </span>
              </button>
            )
          })}
        </div>

        {/* Main Tab Content Container with 4-Corner Rounded Border */}
        <div className={cn(
          "border-2 border-navy/20 dark:border-teal/30 p-4 sm:p-5 shadow-sm space-y-4 relative z-0",
          selectedRoleId === roles[0]?.id
            ? "rounded-b-2xl sm:rounded-b-3xl rounded-tr-2xl sm:rounded-tr-3xl rounded-tl-none" 
            : "rounded-2xl sm:rounded-3xl",
          isDark ? "bg-[#0c1833]" : "bg-[#e6f7f5]"
        )}>
          {/* 4. PERMISSIONS MATRIX & ASSIGNED STAFF SPLIT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: PERMISSION CATEGORIES MATRIX */}
            <div className="lg:col-span-2 space-y-4">
          <Card className={cn("rounded-2xl sm:rounded-3xl border shadow-sm overflow-hidden", isDark ? "bg-[#0a1033] border-none" : "bg-white border-2 border-navy/20")}>
            <CardHeader className={cn("p-4 sm:p-5 pb-3 border-b", isDark ? "border-slate-800" : "border-navy/15")}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className={cn("text-base font-black flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                    <Lock className={cn("w-4 h-4", isDark ? "text-teal" : "text-navy")} />
                    Permission Matrix for <span className={isDark ? "text-teal" : "text-navy font-black underline decoration-teal decoration-2 underline-offset-4"}>{currentRole?.name}</span>
                  </CardTitle>
                  <CardDescription className={cn("text-xs", isDark ? "text-slate-400" : "text-navy/70")}>
                    {activePermissions.length} of {totalSystemPermissions} system permissions granted.
                  </CardDescription>
                </div>
                {hasChanges && (
                  <Badge className="bg-amber-500 text-black text-[10px] font-black uppercase px-2 py-0.5 animate-pulse">
                    Unsaved Changes
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-5">
              {PERMISSION_CATEGORIES.map((cat, catIdx) => {
                const catPermIds = cat.permissions.map(p => p.id)
                const enabledCount = catPermIds.filter(id => activePermissions.includes(id)).length
                const allEnabled = enabledCount === catPermIds.length

                return (
                  <div key={catIdx} className={cn("p-4 rounded-2xl border transition-all", isDark ? "bg-[#080d2a] border-slate-800" : "bg-slate-50/80 border-2 border-navy/15")}>
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
                          className={cn("h-7 text-[10.5px] font-bold rounded-lg px-2", isDark ? "hover:bg-slate-800 text-teal" : "hover:bg-navy/10 text-navy")}
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
                            <div className={cn(
                              "w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all",
                              isChecked
                                ? isDark ? "bg-teal text-navy font-black shadow-2xs" : "bg-navy text-white font-black shadow-2xs"
                                : isDark
                                ? "border border-slate-700 bg-slate-800"
                                : "border-2 border-navy/20 bg-slate-100"
                            )}>
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
          <Card className={cn("rounded-2xl sm:rounded-3xl border shadow-sm", isDark ? "bg-[#0a1033] border-none" : "bg-white border-2 border-navy/20")}>
            <CardHeader className={cn("p-4 sm:p-5 pb-3 border-b", isDark ? "border-slate-800" : "border-navy/15")}>
              <div className="flex items-center justify-between">
                <CardTitle className={cn("text-sm font-black flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                  <Users className={cn("w-4 h-4", isDark ? "text-teal" : "text-navy")} />
                  Assigned Personnel
                </CardTitle>
                <Badge variant="outline" className={cn("text-[10px] font-bold", isDark ? "border-slate-700 text-slate-300" : "border-navy/20 text-navy")}>
                  {currentRoleStaff.length} Members
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-3">
              {currentRoleStaff.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-slate-400 font-medium">No staff members currently assigned to {currentRole?.name}.</p>
                </div>
              ) : (
                currentRoleStaff.map((s) => (
                  <div
                    key={s.id}
                    className={cn(
                      "p-3 rounded-xl border flex items-center justify-between gap-3",
                      isDark ? "bg-[#080d2a] border-slate-800" : "bg-slate-50 border-2 border-navy/15"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0",
                        isDark ? "bg-teal/20 text-teal" : "bg-navy text-white"
                      )}>
                        {s.full_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className={cn("font-bold text-xs truncate", isDark ? "text-white" : "text-navy")}>
                          {s.full_name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {s.branch_name}
                        </p>
                      </div>
                    </div>

                    <Badge className={cn(
                      "text-[9px] font-bold px-1.5 py-0 shrink-0",
                      s.status === "active" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-slate-500/20 text-slate-500"
                    )}>
                      {s.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className={cn("rounded-2xl sm:rounded-3xl border shadow-sm p-4 sm:p-5", isDark ? "bg-[#080d2a] border-slate-800" : "bg-slate-50 border-2 border-navy/15")}>
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
      </div>
      </div>
    </div>
  )
}
