"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import AdminLoading from "@/components/admin/admin-loading"
import { CardTitleIcon } from "@/components/admin/card-title-icon"
import {
  AdminPageHeader,
  AdminStats,
  AdminTable,
  AdminPrimaryCell,
  AdminPill,
  AdminTag,
  AdminMutedText,
  AdminStatusBadge,
  AdminBooleanBadge,
  AdminDetailModal,
  type AdminTableColumn,
  type AdminTableAction,
  type AdminDetailSectionData,
} from "@/components/admin/ui"
import { getStaffDetail } from "@/lib/detail-actions"
import type { StaffDetailData } from "@/lib/detail-types"
import type { AuditLogEntry, StaffMember } from "@/lib/erp/types"
import { PERMISSION_CATEGORIES, LEGACY_PERMISSION_ALIASES } from "@/lib/role-constants"
import {
  ArrowLeft,
  UserCheck,
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  Activity,
  Clock,
  KeyRound,
  ExternalLink,
  Users,
  TrendingUp,
  Check,
  Lock,
  Layers,
  FileText,
  Eye,
} from "lucide-react"

const activityChartConfig: ChartConfig = {
  count: {
    label: "Actions",
    color: "#40E0D0",
  },
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface PermissionView {
  id: string
  name: string
  description: string
  category: string
}

interface VelocityPoint {
  key: string
  label: string
  fullLabel: string
  count: number
  dateNum?: number
  dayNum?: number
}

function DetailSectionHeading({
  icon: Icon,
  title,
  description,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  badge?: React.ReactNode
}) {
  const { isDark } = useAdminTheme()
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black",
            isDark ? "bg-teal text-navy" : "bg-navy text-white"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-black leading-tight">{title}</h3>
          <p
            className={cn(
              "text-[11px] font-medium mt-0.5",
              isDark ? "text-slate-300" : "text-navy/70"
            )}
          >
            {description}
          </p>
        </div>
      </div>
      {badge && (
        <Badge
          variant="outline"
          className={cn(
            "font-mono text-xs font-bold self-start sm:self-auto",
            isDark ? "border-teal/40 text-teal bg-teal/10" : "border-navy text-navy bg-white"
          )}
        >
          {badge}
        </Badge>
      )}
    </div>
  )
}

export default function StaffDetailPage() {
  const routeParams = useParams()
  const staffId = (routeParams?.id as string) || ""
  const { isDark } = useAdminTheme()
  const [mounted, setMounted] = useState(false)

  const [data, setData] = useState<StaffDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [selectedAudit, setSelectedAudit] = useState<AuditLogEntry | null>(null)
  const [selectedPermission, setSelectedPermission] = useState<PermissionView | null>(null)
  const [selectedPeer, setSelectedPeer] = useState<StaffMember | null>(null)
  const [viewModal, setViewModal] = useState<"audit" | "permission" | "peer" | null>(null)

  // Operational Velocity timeframe and date selectors
  const [timeframe, setTimeframe] = useState<"12months" | "30days" | "week">("30days")
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear())
  const [selectedWeek, setSelectedWeek] = useState<number>(() => {
    const day = new Date().getDate()
    return Math.min(5, Math.max(1, Math.ceil(day / 7)))
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!staffId) return
    let isCancelled = false
    async function load() {
      setIsLoading(true)
      try {
        const res = await getStaffDetail(staffId)
        if (!isCancelled) setData(res)
      } catch (err) {
        console.error("Failed to load staff details:", err)
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      isCancelled = true
    }
  }, [staffId])

  // Memoized permission mappings for exact matching with roles & permissions page
  const allPermissionDefs = useMemo(() => {
    const map = new Map<string, PermissionView>()
    PERMISSION_CATEGORIES.forEach((cat) => {
      cat.permissions.forEach((p) => {
        map.set(p.id, { ...p, category: cat.category })
      })
    })
    return map
  }, [])

  const allowedPermissions: PermissionView[] = useMemo(() => {
    const perms = data?.role?.permissions || []
    const seen = new Set<string>()
    const result: PermissionView[] = []

    for (const rawId of perms) {
      const canonicalId = (rawId in LEGACY_PERMISSION_ALIASES)
        ? (LEGACY_PERMISSION_ALIASES as Record<string, string>)[rawId]
        : rawId
      if (seen.has(canonicalId)) continue

      const def = allPermissionDefs.get(canonicalId)
      if (def) {
        seen.add(canonicalId)
        result.push(def)
      }
    }
    return result
  }, [data?.role?.permissions, allPermissionDefs])

  // Velocity chart data computation based on timeframe
  const velocityData: VelocityPoint[] = useMemo(() => {
    if (!data) return []
    const allLogs = data.audit.allLogs || data.audit.recent || []

    if (timeframe === "12months") {
      return MONTH_SHORT.map((m, idx) => ({
        key: `m-${idx}`,
        label: m,
        fullLabel: `${MONTH_NAMES[idx]} ${selectedYear}`,
        count: 0,
      })).map((item, idx) => {
        allLogs.forEach((log) => {
          const d = new Date(log.created_at)
          if (!isNaN(d.getTime()) && d.getFullYear() === selectedYear && d.getMonth() === idx) {
            item.count += 1
          }
        })
        return item
      })
    }

    if (timeframe === "week") {
      const startDay = (selectedWeek - 1) * 7 + 1
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
      const list: VelocityPoint[] = []
      for (let i = 0; i < 7; i++) {
        const dNum = startDay + i
        if (dNum <= daysInMonth) {
          const dObj = new Date(selectedYear, selectedMonth, dNum)
          const dayName = DAY_NAMES[dObj.getDay()]
          list.push({
            key: `w-${dNum}`,
            label: `${dayName} ${dNum}`,
            fullLabel: `${dayName}, ${dNum} ${MONTH_NAMES[selectedMonth]} ${selectedYear}`,
            count: 0,
            dateNum: dNum,
          })
        }
      }
      allLogs.forEach((log) => {
        const d = new Date(log.created_at)
        if (
          !isNaN(d.getTime()) &&
          d.getFullYear() === selectedYear &&
          d.getMonth() === selectedMonth
        ) {
          const dNum = d.getDate()
          const match = list.find((item) => item.dateNum === dNum)
          if (match) match.count += 1
        }
      })
      return list
    }

    // Default: "30days"
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    const list: VelocityPoint[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      list.push({
        key: `d-${d}`,
        label: `${d}`,
        fullLabel: `${d} ${MONTH_NAMES[selectedMonth]} ${selectedYear}`,
        count: 0,
        dayNum: d,
      })
    }
    allLogs.forEach((log) => {
      const d = new Date(log.created_at)
      if (
        !isNaN(d.getTime()) &&
        d.getFullYear() === selectedYear &&
        d.getMonth() === selectedMonth
      ) {
        const day = d.getDate()
        if (day >= 1 && day <= daysInMonth) {
          list[day - 1].count += 1
        }
      }
    })
    return list
  }, [data, timeframe, selectedYear, selectedMonth, selectedWeek])

  const totalVelocityEvents = useMemo(() => {
    return velocityData.reduce((sum, item) => sum + item.count, 0)
  }, [velocityData])

  if (isLoading) return <AdminLoading />

  if (!data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card
          className={cn(
            "max-w-md w-full p-8 text-center rounded-3xl border-2 shadow-xl",
            isDark
              ? "bg-[#0a1033] border-teal/20 text-white"
              : "bg-white border-navy/20 text-navy"
          )}
        >
          <div
            className={cn(
              "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center border shadow-sm",
              isDark
                ? "bg-navy text-teal border-teal/30"
                : "bg-teal text-navy border-teal/40"
            )}
          >
            <UserCheck className={cn("h-8 w-8", isDark ? "text-teal" : "text-navy")} />
          </div>
          <h2 className="text-2xl font-black mb-2">Staff Member Not Found</h2>
          <p className="text-sm opacity-70 mb-6">
            No profile matches the identifier &quot;{staffId}&quot;. It may have been removed.
          </p>
          <Link href="/admin/staff">
            <Button
              className={cn(
                "font-bold rounded-xl",
                isDark ? "bg-teal text-navy hover:bg-teal-400" : "bg-navy text-white hover:bg-navy/90"
              )}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Staff Register
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  const { staff, branch, role, permissionCoverage, peers, tenureDays, audit } = data

  const PIE_COLORS = isDark
    ? ["#40E0D0", "#38bdf8", "#818cf8", "#a78bfa", "#f472b6", "#34d399"]
    : ["#000080", "#0891b2", "#2563eb", "#7c3aed", "#059669", "#d97706"]

  const auditColumns: AdminTableColumn<AuditLogEntry>[] = [
    {
      key: "record",
      header: "Record / Ref",
      render: (l) => (
        <AdminPrimaryCell
          icon={FileText}
          title={l.record_number || l.record_id.slice(0, 10)}
          subtitle={l.user_email}
        />
      ),
    },
    {
      key: "module",
      header: "Module",
      render: (l) => <AdminPill title={l.module}>{l.module}</AdminPill>,
    },
    {
      key: "action",
      header: "Action",
      hidden: "sm",
      render: (l) => <AdminStatusBadge status={l.action} />,
    },
    {
      key: "description",
      header: "Description",
      render: (l) => <AdminMutedText className="block max-w-md truncate">{l.description}</AdminMutedText>,
    },
    {
      key: "timestamp",
      header: "Timestamp",
      align: "right",
      render: (l) => (
        <span className="font-mono text-[11px] opacity-80 whitespace-nowrap">
          {new Date(l.created_at).toLocaleString()}
        </span>
      ),
    },
  ]

  const auditActions: AdminTableAction<AuditLogEntry>[] = [
    {
      key: "view",
      label: "View Audit Entry",
      icon: Eye,
      variant: "view",
      onClick: (l) => {
        setSelectedAudit(l)
        setViewModal("audit")
      },
    },
  ]

  const permissionColumns: AdminTableColumn<PermissionView>[] = [
    {
      key: "name",
      header: "Permission",
      render: (p) => (
        <AdminPrimaryCell
          icon={Check}
          title={p.name}
          subtitle={p.category}
        />
      ),
    },
    {
      key: "category",
      header: "Category",
      hidden: "md",
      render: (p) => <AdminTag title={p.category}>{p.category}</AdminTag>,
    },
    {
      key: "description",
      header: "Description",
      render: (p) => <AdminMutedText>{p.description}</AdminMutedText>,
    },
  ]

  const permissionActions: AdminTableAction<PermissionView>[] = [
    {
      key: "view",
      label: "View Permission Details",
      icon: Eye,
      variant: "view",
      onClick: (p) => {
        setSelectedPermission(p)
        setViewModal("permission")
      },
    },
  ]

  const peerColumns: AdminTableColumn<StaffMember>[] = [
    {
      key: "peer",
      header: "Colleague",
      render: (p) => (
        <AdminPrimaryCell
          icon={UserCheck}
          title={p.full_name}
          subtitle={`${p.role} • ${p.staff_code}`}
        />
      ),
    },
    {
      key: "branch",
      header: "Branch",
      hidden: "md",
      render: (p) => <AdminPill title={p.branch_name}>{p.branch_name}</AdminPill>,
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (p) => <AdminStatusBadge status={p.status} />,
    },
  ]

  const peerActions: AdminTableAction<StaffMember>[] = [
    {
      key: "view",
      label: "View Colleague Details",
      icon: Eye,
      variant: "view",
      onClick: (p) => {
        setSelectedPeer(p)
        setViewModal("peer")
      },
    },
    {
      key: "profile",
      label: "Open Staff Profile",
      icon: ExternalLink,
      variant: "soft",
      mobile: false,
      href: (p) => `/admin/staff/${p.id}`,
    },
  ]

  const auditDetailSections: AdminDetailSectionData[] = selectedAudit
    ? [
        {
          key: "ledger",
          title: "Audit Ledger Entry",
          icon: FileText,
          fields: [
            { label: "Entry ID", value: selectedAudit.id },
            { label: "Record Number", value: selectedAudit.record_number || "—" },
            { label: "Record ID", value: selectedAudit.record_id },
            { label: "Module", value: selectedAudit.module },
            { label: "Action", value: <AdminStatusBadge status={selectedAudit.action} /> },
            { label: "User", value: selectedAudit.user_name },
            { label: "User Email", value: selectedAudit.user_email },
            { label: "Branch", value: selectedAudit.branch_name || selectedAudit.branch_id || "—" },
            { label: "IP Address", value: selectedAudit.ip_address || "—" },
            { label: "Timestamp", value: new Date(selectedAudit.created_at).toLocaleString() },
          ],
        },
        {
          key: "narrative",
          title: "Action Description",
          icon: Activity,
          span: 2,
          content: (
            <p className="text-xs leading-relaxed opacity-90 whitespace-pre-wrap">
              {selectedAudit.description}
            </p>
          ),
        },
      ]
    : []

  const permissionDetailSections: AdminDetailSectionData[] = selectedPermission
    ? [
        {
          key: "permission",
          title: "Security Permission",
          icon: KeyRound,
          fields: [
            { label: "Permission ID", value: selectedPermission.id },
            { label: "Name", value: selectedPermission.name },
            { label: "Category", value: selectedPermission.category },
            { label: "Role", value: role?.name || staff.role },
          ],
        },
        {
          key: "scope",
          title: "Authorization Scope",
          icon: ShieldCheck,
          span: 2,
          content: (
            <p className="text-xs leading-relaxed opacity-90">{selectedPermission.description}</p>
          ),
        },
        ...(role
          ? [
              {
                key: "role",
                title: "Assigned Role",
                icon: ShieldCheck,
                fields: [
                  { label: "Role ID", value: role.id },
                  { label: "Name", value: role.name },
                  { label: "Description", value: role.description },
                  { label: "System Role", value: <AdminBooleanBadge value={role.is_system} /> },
                  { label: "Role Staff Count", value: role.staff_count ?? "—" },
                  { label: "Permissions Granted", value: allowedPermissions.length },
                  { label: "Permissions Available", value: permissionCoverage.total },
                ],
              } as AdminDetailSectionData,
            ]
          : []),
      ]
    : []

  const peerDetailSections: AdminDetailSectionData[] = selectedPeer
    ? [
        {
          key: "peer",
          title: "Branch Colleague",
          icon: Users,
          fields: [
            { label: "Full Name", value: selectedPeer.full_name },
            { label: "Staff Code", value: selectedPeer.staff_code },
            { label: "Role", value: selectedPeer.role },
            { label: "Branch", value: selectedPeer.branch_name },
            { label: "Status", value: <AdminStatusBadge status={selectedPeer.status} /> },
            { label: "Email", value: selectedPeer.email },
            { label: "Phone", value: selectedPeer.phone },
            { label: "Joined Date", value: new Date(selectedPeer.joined_date).toLocaleDateString() },
            { label: "Last Active", value: selectedPeer.last_active ? new Date(selectedPeer.last_active).toLocaleString() : "—" },
          ],
        },
      ]
    : []

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden pb-16">
      <AdminPageHeader
        title={staff.full_name}
        accent="Profile"
        subtitle={`${role?.name || staff.role} • ${staff.branch_name} • Joined ${new Date(staff.joined_date).toLocaleDateString()}`}
        icon={UserCheck}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="hidden sm:flex items-center gap-1.5">
              <AdminPill title="Staff code">{staff.staff_code}</AdminPill>
              <AdminStatusBadge status={staff.status} />
            </div>
            <Link href="/admin/staff">
              <Button
                variant="outline"
                size="sm"
                className="font-bold rounded-xl h-10 px-3.5 gap-1.5 shadow-sm transition-all border-2 border-navy/20 bg-white text-navy hover:bg-teal-50 dark:border-teal/30 dark:bg-transparent dark:text-teal dark:hover:bg-teal/10"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Staff</span>
              </Button>
            </Link>
            <a href={`mailto:${staff.email}`}>
              <Button
                variant="outline"
                size="sm"
                className="font-bold rounded-xl h-10 px-3.5 gap-1.5 shadow-sm transition-all border-2 border-navy/20 bg-white text-navy hover:bg-teal-50 dark:border-teal/30 dark:bg-transparent dark:text-teal dark:hover:bg-teal/10"
              >
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">Email</span>
              </Button>
            </a>
            <a href={`tel:${staff.phone}`}>
              <Button
                variant="outline"
                size="sm"
                className="font-bold rounded-xl h-10 px-3.5 gap-1.5 shadow-sm transition-all border-2 border-navy/20 bg-white text-navy hover:bg-teal-50 dark:border-teal/30 dark:bg-transparent dark:text-teal dark:hover:bg-teal/10"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Call</span>
              </Button>
            </a>
            {branch && (
              <Link href={`/admin/branches/${branch.id}`}>
                <Button
                  size="sm"
                  className="font-bold rounded-xl h-10 px-4 shadow-md transition-all active:scale-95 gap-2 bg-navy hover:bg-navy/90 text-white dark:bg-teal dark:text-navy dark:hover:bg-teal-400"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Branch Hub</span>
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <AdminStats
        items={[
          { title: "Audit Trail Events", value: `${audit.total} events`, icon: Activity },
          { title: "Selected Period Activity", value: `${totalVelocityEvents} actions`, icon: TrendingUp },
          {
            title: "RBAC Permissions",
            value: `${allowedPermissions.length}/${permissionCoverage.total} active`,
            icon: ShieldCheck,
          },
          { title: "Service Tenure", value: `${tenureDays} Days`, icon: Clock },
        ]}
      />

      {/* Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card
          className={cn(
            "lg:col-span-2 rounded-2xl sm:rounded-3xl border-2 p-5 sm:p-6 shadow-md flex flex-col justify-between",
            isDark
              ? "bg-[#0a1033] border-teal/20 text-white"
              : "bg-white border-navy/20 text-navy"
          )}
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <CardTitleIcon icon={TrendingUp} isDark={isDark} />
                <div>
                  <h3 className="text-base sm:text-lg font-black">
                    {timeframe === "12months"
                      ? "12-Month Operational Velocity"
                      : timeframe === "week"
                      ? "Weekly Operational Velocity"
                      : "30-Day Operational Velocity"}
                  </h3>
                  <p className="text-xs opacity-70">
                    Live system audit telemetry recorded for {staff.full_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Select
                  value={timeframe}
                  onValueChange={(val: "12months" | "30days" | "week") => setTimeframe(val)}
                >
                  <SelectTrigger
                    className={cn(
                      "h-9 px-3 rounded-xl font-bold text-xs shadow-xs min-w-[125px]",
                      isDark
                        ? "bg-[#080d2a] border-slate-700 text-teal hover:border-teal/50"
                        : "bg-slate-50 border-2 border-navy/30 text-navy hover:bg-slate-100"
                    )}
                  >
                    <SelectValue placeholder="Select Range" />
                  </SelectTrigger>
                  <SelectContent
                    className={cn(
                      "rounded-xl p-1 shadow-xl",
                      isDark ? "bg-[#0a1033] border-slate-700 text-white" : "bg-white border-2 border-navy/20"
                    )}
                  >
                    <SelectItem value="12months" className="text-xs font-bold rounded-lg cursor-pointer">
                      A Year
                    </SelectItem>
                    <SelectItem value="30days" className="text-xs font-bold rounded-lg cursor-pointer">
                      30 Days
                    </SelectItem>
                    <SelectItem value="week" className="text-xs font-bold rounded-lg cursor-pointer">
                      A Week
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Badge
                  variant="outline"
                  className={cn(
                    "font-mono text-xs font-bold h-9 px-2.5 flex items-center justify-center shrink-0",
                    isDark ? "border-teal/30 text-teal" : "border-navy/30 text-navy"
                  )}
                >
                  {totalVelocityEvents} events
                </Badge>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full pt-2">
              {mounted ? (
                <ChartContainer config={activityChartConfig} className="h-full w-full">
                  <AreaChart
                    data={velocityData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="staffActivityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={isDark ? "#40E0D0" : "#000080"}
                          stopOpacity={0.6}
                        />
                        <stop
                          offset="95%"
                          stopColor={isDark ? "#40E0D0" : "#000080"}
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? "rgba(64, 224, 208, 0.1)" : "rgba(0, 0, 128, 0.08)"}
                    />
                    <XAxis
                      dataKey="label"
                      stroke={isDark ? "#94a3b8" : "#64748b"}
                      fontSize={timeframe === "30days" ? 9 : 11}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis
                      stroke={isDark ? "#94a3b8" : "#64748b"}
                      fontSize={11}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(_, payload) => {
                            const item = payload?.[0]?.payload
                            return item?.fullLabel || item?.label || "Activity"
                          }}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke={isDark ? "#40E0D0" : "#000080"}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#staffActivityGrad)"
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <span className="text-xs opacity-50">Loading visualization...</span>
                </div>
              )}
            </div>
          </div>

          <div
            className={cn(
              "mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs font-semibold opacity-75",
              isDark ? "border-teal/10" : "border-navy/10"
            )}
          >
            <span>Telemetry Source: Database Audit Trail</span>
            <span>
              Last activity:{" "}
              {audit.lastActionAt
                ? new Date(audit.lastActionAt).toLocaleString()
                : staff.last_active || "Never"}
            </span>
          </div>
        </Card>

        <Card
          className={cn(
            "rounded-2xl sm:rounded-3xl border-2 p-5 sm:p-6 shadow-md flex flex-col justify-between",
            isDark
              ? "bg-[#0a1033] border-teal/20 text-white"
              : "bg-white border-navy/20 text-navy"
          )}
        >
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <CardTitleIcon icon={Layers} isDark={isDark} />
              <div>
                <h3 className="text-base sm:text-lg font-black">Module Distribution</h3>
                <p className="text-xs opacity-70">Operational footprint by ERP entity</p>
              </div>
            </div>

            {mounted && audit.byModule.length > 0 ? (
              <div className="h-56 sm:h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={audit.byModule}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {audit.byModule.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val} actions`, name]}
                      contentStyle={{
                        borderRadius: "1rem",
                        fontWeight: "bold",
                        backgroundColor: isDark ? "#0c1833" : "#ffffff",
                        borderColor: isDark ? "#40E0D0" : "#000080",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-center opacity-60 text-xs">
                <Activity className="h-8 w-8 mb-2 opacity-40" />
                No module records logged yet
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-navy/10 dark:border-teal/10">
            {audit.byModule.slice(0, 4).map((m, i) => (
              <div key={m.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="font-semibold truncate max-w-[140px]">{m.name}</span>
                </div>
                <span className="font-mono font-bold opacity-80">{m.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit">
            <Activity className="h-4 w-4 shrink-0" />
            <span>Audit Ledger</span>
            <span className="tab-badge ml-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full">
              {audit.total}
            </span>
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Role & RBAC</span>
            <span className="tab-badge ml-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full">
              {allowedPermissions.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="peers">
            <Users className="h-4 w-4 shrink-0" />
            <span>Branch Peers</span>
            <span className="tab-badge ml-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full">
              {peers.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="mt-0 space-y-3">
          <DetailSectionHeading
            icon={Activity}
            title="Live Audit Ledger & Action Trace"
            description={`Every action executed by ${staff.full_name} is permanently tracked for governance`}
            badge={`${audit.recent.length} Records Shown`}
          />
          <AdminTable
            columns={auditColumns}
            data={audit.recent}
            rowKey={(l) => l.id}
            actions={auditActions}
            emptyIcon={FileText}
            emptyTitle="No audit entries"
            emptyDescription="No audit entries recorded for this account yet."
          />
        </TabsContent>

        <TabsContent value="permissions" className="mt-0 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <DetailSectionHeading
              icon={KeyRound}
              title="Role & RBAC Security Permissions"
              description={`Security capabilities authorized for ${staff.full_name} under role: ${role?.name || staff.role}`}
              badge={`${allowedPermissions.length} / ${permissionCoverage.total} Allowed`}
            />
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Link href="/admin/roles">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs font-bold border-2 h-8 px-2.5 border-navy/20 text-navy hover:bg-teal-50 dark:border-teal/30 dark:text-teal dark:hover:bg-teal/10"
                >
                  Manage Roles
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          {allowedPermissions.length === 0 ? (
            <div
              className={cn(
                "py-12 text-center rounded-2xl border flex flex-col items-center justify-center p-6 space-y-2",
                isDark ? "bg-[#060a22]/70 border-teal/20" : "bg-white/80 border-navy/20"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mb-1",
                  isDark ? "bg-teal/20 text-teal" : "bg-navy/10 text-navy"
                )}
              >
                <Lock className="w-6 h-6" />
              </div>
              <p className={cn("text-sm font-bold", isDark ? "text-white" : "text-navy")}>
                No Permissions Authorized
              </p>
              <p className={cn("text-xs max-w-sm", isDark ? "text-slate-400" : "text-navy/70")}>
                This staff member has not been authorized with any security permissions in Roles &amp; Permissions for {role?.name || staff.role}.
              </p>
            </div>
          ) : (
            <AdminTable
              columns={permissionColumns}
              data={allowedPermissions}
              rowKey={(p) => p.id}
              actions={permissionActions}
              emptyIcon={ShieldCheck}
              emptyTitle="No permissions granted"
              emptyDescription="This role has no security permissions configured."
            />
          )}
        </TabsContent>

        <TabsContent value="peers" className="mt-0 space-y-3">
          <DetailSectionHeading
            icon={Users}
            title={`Colleagues at ${staff.branch_name}`}
            description={`Staff assigned to the same operational branch (${peers.length} active peers)`}
            badge={`${peers.length} Peers`}
          />
          <AdminTable
            columns={peerColumns}
            data={peers}
            rowKey={(p) => p.id}
            actions={peerActions}
            emptyIcon={Users}
            emptyTitle="No branch colleagues"
            emptyDescription="No other staff members assigned to this branch."
          />
        </TabsContent>
      </Tabs>

      <AdminDetailModal
        open={viewModal === "audit"}
        onOpenChange={(open) => {
          if (!open) {
            setViewModal(null)
            setSelectedAudit(null)
          }
        }}
        icon={FileText}
        title={selectedAudit?.record_number || selectedAudit?.record_id || "Audit Entry"}
        badge={selectedAudit ? <AdminStatusBadge status={selectedAudit.action} /> : undefined}
        subtitle={selectedAudit ? `${selectedAudit.module} • ${selectedAudit.user_name}` : undefined}
        sections={auditDetailSections}
      />

      <AdminDetailModal
        open={viewModal === "permission"}
        onOpenChange={(open) => {
          if (!open) {
            setViewModal(null)
            setSelectedPermission(null)
          }
        }}
        icon={KeyRound}
        title={selectedPermission?.name ?? "Permission Details"}
        subtitle={selectedPermission?.category}
        sections={permissionDetailSections}
      />

      <AdminDetailModal
        open={viewModal === "peer"}
        onOpenChange={(open) => {
          if (!open) {
            setViewModal(null)
            setSelectedPeer(null)
          }
        }}
        icon={Users}
        title={selectedPeer?.full_name ?? "Colleague Details"}
        badge={selectedPeer ? <AdminStatusBadge status={selectedPeer.status} /> : undefined}
        subtitle={selectedPeer ? `${selectedPeer.role} • ${selectedPeer.staff_code}` : undefined}
        sections={peerDetailSections}
      />
    </div>
  )
}
