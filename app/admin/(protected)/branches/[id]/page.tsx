"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
import { getBranchDetail } from "@/lib/detail-actions"
import type { BranchDetailData } from "@/lib/detail-types"
import type { AuditLogEntry, StaffMember, Warehouse } from "@/lib/erp/types"
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  Users,
  DollarSign,
  Package,
  TrendingUp,
  Warehouse as WarehouseIcon,
  Activity,
  UserCheck,
  FileText,
  Eye,
  ExternalLink,
} from "lucide-react"

interface BranchDetailPageProps {
  params: Promise<{ id: string }>
}

const comparisonChartConfig: ChartConfig = {
  daily_sales: {
    label: "Daily Sales (TSH)",
    color: "#40E0D0",
  },
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

export default function BranchDetailPage({ params }: BranchDetailPageProps) {
  const resolvedParams = use(params)
  const branchId = resolvedParams.id
  const { isDark } = useAdminTheme()

  const [data, setData] = useState<BranchDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)
  const [selectedAudit, setSelectedAudit] = useState<AuditLogEntry | null>(null)
  const [viewModal, setViewModal] = useState<"staff" | "warehouse" | "audit" | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setIsLoading(true)
      try {
        const res = await getBranchDetail(branchId)
        if (mounted) setData(res)
      } catch (err) {
        console.error("Failed to load branch details:", err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [branchId])

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
            <Building2 className={cn("h-8 w-8", isDark ? "text-teal" : "text-navy")} />
          </div>
          <h2 className="text-2xl font-black mb-2">Branch Not Found</h2>
          <p className="text-sm opacity-70 mb-6">
            No branch outlet matches &quot;{branchId}&quot;. It may have been closed or removed.
          </p>
          <Link href="/admin/branches">
            <Button
              className={cn(
                "font-bold rounded-xl",
                isDark ? "bg-teal text-navy hover:bg-teal-400" : "bg-navy text-white hover:bg-navy/90"
              )}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Branch Network
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  const { branch, staff, roleDistribution, comparison, share, metrics, warehouses, activity } = data

  const PIE_COLORS = isDark
    ? ["#40E0D0", "#38bdf8", "#818cf8", "#a78bfa", "#f472b6", "#34d399"]
    : ["#000080", "#0891b2", "#2563eb", "#7c3aed", "#059669", "#d97706"]

  const staffColumns: AdminTableColumn<StaffMember>[] = [
    {
      key: "member",
      header: "Staff Member",
      render: (s) => (
        <AdminPrimaryCell
          icon={UserCheck}
          title={s.full_name}
          subtitle={`${s.staff_code} • ${s.email}`}
        />
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (s) => <AdminTag title={s.role}>{s.role.replace("_", " ")}</AdminTag>,
    },
    {
      key: "contact",
      header: "Contact",
      hidden: "md",
      render: (s) => (
        <div className="min-w-0 space-y-0.5">
          <p className="truncate max-w-[180px] font-semibold">{s.email}</p>
          <AdminMutedText>{s.phone}</AdminMutedText>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (s) => <AdminStatusBadge status={s.status} />,
    },
  ]

  const staffActions: AdminTableAction<StaffMember>[] = [
    {
      key: "view",
      label: "View Staff Details",
      icon: Eye,
      variant: "view",
      onClick: (s) => {
        setSelectedStaff(s)
        setViewModal("staff")
      },
    },
    {
      key: "profile",
      label: "Open Staff Profile",
      icon: ExternalLink,
      variant: "soft",
      mobile: false,
      href: (s) => `/admin/staff/${s.id}`,
    },
  ]

  const warehouseColumns: AdminTableColumn<Warehouse>[] = [
    {
      key: "name",
      header: "Warehouse",
      render: (w) => (
        <AdminPrimaryCell
          icon={WarehouseIcon}
          title={w.name}
          subtitle={w.address}
        />
      ),
    },
    {
      key: "code",
      header: "Code",
      render: (w) => <AdminPill title={w.code}>{w.code}</AdminPill>,
    },
    {
      key: "city",
      header: "City",
      hidden: "md",
      render: (w) => <AdminPill title={w.city}>{w.city}</AdminPill>,
    },
    {
      key: "manager",
      header: "Manager",
      hidden: "lg",
      render: (w) => <AdminMutedText>{w.manager_name || "Assigned"}</AdminMutedText>,
    },
  ]

  const warehouseActions: AdminTableAction<Warehouse>[] = [
    {
      key: "view",
      label: "View Warehouse Details",
      icon: Eye,
      variant: "view",
      onClick: (w) => {
        setSelectedWarehouse(w)
        setViewModal("warehouse")
      },
    },
  ]

  const auditColumns: AdminTableColumn<AuditLogEntry>[] = [
    {
      key: "user",
      header: "Staff Member",
      render: (l) => (
        <AdminPrimaryCell
          icon={FileText}
          title={l.user_name}
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
      header: "Details",
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

  const staffDetailSections: AdminDetailSectionData[] = selectedStaff
    ? [
        {
          key: "identity",
          title: "Staff Identity",
          icon: UserCheck,
          fields: [
            { label: "Full Name", value: selectedStaff.full_name },
            { label: "Staff Code", value: selectedStaff.staff_code },
            { label: "Role", value: selectedStaff.role.replace("_", " ") },
            { label: "Status", value: <AdminStatusBadge status={selectedStaff.status} /> },
          ],
        },
        {
          key: "contact",
          title: "Contact & Assignment",
          icon: Building2,
          fields: [
            { label: "Email", value: selectedStaff.email },
            { label: "Phone", value: selectedStaff.phone },
            { label: "Branch ID", value: selectedStaff.branch_id },
            { label: "Branch", value: selectedStaff.branch_name },
            { label: "Joined Date", value: new Date(selectedStaff.joined_date).toLocaleDateString() },
            { label: "Last Active", value: selectedStaff.last_active ? new Date(selectedStaff.last_active).toLocaleString() : "—" },
          ],
        },
      ]
    : []

  const warehouseDetailSections: AdminDetailSectionData[] = selectedWarehouse
    ? [
        {
          key: "warehouse",
          title: "Facility Record",
          icon: WarehouseIcon,
          fields: [
            { label: "Name", value: selectedWarehouse.name },
            { label: "Code", value: selectedWarehouse.code },
            { label: "Address", value: selectedWarehouse.address },
            { label: "City", value: selectedWarehouse.city },
            { label: "Region", value: selectedWarehouse.region },
            { label: "Manager", value: selectedWarehouse.manager_name || "Assigned" },
            { label: "Manager Phone", value: selectedWarehouse.manager_phone || "—" },
            { label: "Manager Email", value: selectedWarehouse.manager_email || "—" },
            { label: "Primary Warehouse", value: <AdminBooleanBadge value={selectedWarehouse.is_primary} /> },
            { label: "Active", value: <AdminBooleanBadge value={selectedWarehouse.is_active} /> },
          ],
        },
        {
          key: "stock",
          title: "Stock Position",
          icon: Package,
          fields: [
            { label: "Products", value: selectedWarehouse.total_products ?? "—" },
            { label: "Stock Units", value: selectedWarehouse.total_stock_units ?? "—" },
            { label: "Stock Value", value: selectedWarehouse.total_stock_value !== undefined ? `TSH ${Number(selectedWarehouse.total_stock_value).toLocaleString()}` : "—" },
            { label: "Created", value: selectedWarehouse.created_at ? new Date(selectedWarehouse.created_at).toLocaleString() : "—" },
            { label: "Updated", value: selectedWarehouse.updated_at ? new Date(selectedWarehouse.updated_at).toLocaleString() : "—" },
          ],
        },
      ]
    : []

  const auditDetailSections: AdminDetailSectionData[] = selectedAudit
    ? [
        {
          key: "ledger",
          title: "Audit Ledger Entry",
          icon: FileText,
          fields: [
            { label: "Entry ID", value: selectedAudit.id },
            { label: "Module", value: selectedAudit.module },
            { label: "Action", value: <AdminStatusBadge status={selectedAudit.action} /> },
            { label: "Record ID", value: selectedAudit.record_id },
            { label: "Record Number", value: selectedAudit.record_number || "—" },
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

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden pb-16">
      <AdminPageHeader
        title={branch.name}
        accent="Outlet"
        subtitle={`${branch.address}, ${branch.city}, ${branch.region} • Managed by ${branch.manager_name}`}
        icon={Building2}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="hidden sm:flex items-center gap-1.5">
              <AdminPill title="Branch code">{branch.code}</AdminPill>
              {branch.is_main && (
                <Badge className="bg-amber-500 text-white font-black text-xs uppercase px-2 py-0.5">
                  Main HQ
                </Badge>
              )}
              <AdminStatusBadge
                status={branch.is_active ? "active" : "inactive"}
                label={branch.is_active ? "Active" : "Inactive"}
              />
            </div>
            <Link href="/admin/branches">
              <Button
                variant="outline"
                size="sm"
                className="font-bold rounded-xl h-10 px-3.5 gap-1.5 shadow-sm transition-all border-2 border-navy/20 bg-white text-navy hover:bg-teal-50 dark:border-teal/30 dark:bg-transparent dark:text-teal dark:hover:bg-teal/10"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Branches</span>
              </Button>
            </Link>
            {branch.email && (
              <a href={`mailto:${branch.email}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-bold rounded-xl h-10 px-3.5 gap-1.5 shadow-sm transition-all border-2 border-navy/20 bg-white text-navy hover:bg-teal-50 dark:border-teal/30 dark:bg-transparent dark:text-teal dark:hover:bg-teal/10"
                >
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Email</span>
                </Button>
              </a>
            )}
            {branch.phone && (
              <a href={`tel:${branch.phone}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-bold rounded-xl h-10 px-3.5 gap-1.5 shadow-sm transition-all border-2 border-navy/20 bg-white text-navy hover:bg-teal-50 dark:border-teal/30 dark:bg-transparent dark:text-teal dark:hover:bg-teal/10"
                >
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline">Call</span>
                </Button>
              </a>
            )}
          </div>
        }
      />

      <AdminStats
        items={[
          {
            title: "Daily Sales Run-rate",
            value: `TSH ${Number(branch.daily_sales).toLocaleString()}`,
            icon: TrendingUp,
          },
          {
            title: "Inventory Valuation",
            value: `TSH ${Number(branch.inventory_val).toLocaleString()}`,
            icon: Package,
          },
          {
            title: "Staff Roster",
            value: `${staff.length} Active`,
            icon: Users,
          },
          {
            title: "Productivity / Staff",
            value: `TSH ${Math.round(metrics.salesPerStaff).toLocaleString()}`,
            icon: DollarSign,
          },
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
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <CardTitleIcon icon={TrendingUp} isDark={isDark} />
                <div>
                  <h3 className="text-base sm:text-lg font-black">Network Sales Performance Benchmark</h3>
                  <p className="text-xs opacity-70">Comparing daily revenue across QuardCube branch network</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "font-mono text-xs font-bold",
                  isDark ? "border-teal/30 text-teal" : "border-navy/30 text-navy"
                )}
              >
                {share.sales.toFixed(1)}% of total
              </Badge>
            </div>

            <div className="h-64 sm:h-72 w-full pt-4">
              <ChartContainer config={comparisonChartConfig} className="h-full w-full">
                <BarChart
                  data={comparison}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? "rgba(64, 224, 208, 0.1)" : "rgba(0, 0, 128, 0.08)"}
                  />
                  <XAxis
                    dataKey="name"
                    stroke={isDark ? "#94a3b8" : "#64748b"}
                    fontSize={10}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke={isDark ? "#94a3b8" : "#64748b"}
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="daily_sales" radius={[8, 8, 0, 0]}>
                    {comparison.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.isCurrent
                            ? isDark
                              ? "#40E0D0"
                              : "#000080"
                            : isDark
                            ? "rgba(64, 224, 208, 0.3)"
                            : "rgba(0, 0, 128, 0.2)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </div>

          <div
            className={cn(
              "mt-4 pt-3 border-t flex items-center justify-between text-xs font-semibold opacity-75",
              isDark ? "border-teal/10" : "border-navy/10"
            )}
          >
            <span>Highlighted bar represents this branch</span>
            <span>Annualised Run-rate: TSH {(metrics.annualisedSales / 1_000_000).toFixed(1)}M</span>
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
              <CardTitleIcon icon={Users} isDark={isDark} />
              <div>
                <h3 className="text-base sm:text-lg font-black">Staff Role Mix</h3>
                <p className="text-xs opacity-70">Operational roles stationed at this branch</p>
              </div>
            </div>

            {roleDistribution.length > 0 ? (
              <div className="h-56 sm:h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {roleDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val} staff`, name]}
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
                <Users className="h-8 w-8 mb-2 opacity-40" />
                No staff stationed here
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-navy/10 dark:border-teal/10">
            {roleDistribution.map((r, i) => (
              <div key={r.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="font-semibold truncate max-w-[140px]">{r.name}</span>
                </div>
                <span className="font-mono font-bold opacity-80">{r.value} staff</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Tabs defaultValue="staff" className="space-y-4">
        <TabsList>
          <TabsTrigger value="staff">
            <Users className="h-4 w-4 shrink-0" />
            <span>Branch Staff</span>
            <span className="tab-badge ml-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full">
              {staff.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="warehouses">
            <WarehouseIcon className="h-4 w-4 shrink-0" />
            <span>Regional Warehouses</span>
            <span className="tab-badge ml-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full">
              {warehouses.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 shrink-0" />
            <span>Audit Activity</span>
            <span className="tab-badge ml-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full">
              {activity.total}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="mt-0 space-y-3">
          <DetailSectionHeading
            icon={Users}
            title={`Staff Assigned to ${branch.name}`}
            description="Real-time active headcount stationed at this operational facility"
            badge={`${staff.length} Active Personnel`}
          />
          <AdminTable
            columns={staffColumns}
            data={staff}
            rowKey={(s) => s.id}
            actions={staffActions}
            emptyIcon={Users}
            emptyTitle="No staff assigned"
            emptyDescription="No staff members assigned to this branch yet."
          />
        </TabsContent>

        <TabsContent value="warehouses" className="mt-0 space-y-3">
          <DetailSectionHeading
            icon={WarehouseIcon}
            title={`Warehouses Serving ${branch.city}`}
            description="Supply chain storage facilities mapped to this branch region"
            badge={`${warehouses.length} Storage Nodes`}
          />
          <AdminTable
            columns={warehouseColumns}
            data={warehouses}
            rowKey={(w) => w.id}
            actions={warehouseActions}
            emptyIcon={WarehouseIcon}
            emptyTitle="No regional warehouses"
            emptyDescription={`No regional warehouses currently assigned to ${branch.city}.`}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-0 space-y-3">
          <DetailSectionHeading
            icon={Activity}
            title="Branch Team Operational Ledger"
            description="Audited activities logged by staff members stationed at this branch"
            badge={`${activity.total} Events`}
          />
          <AdminTable
            columns={auditColumns}
            data={activity.recent}
            rowKey={(l) => l.id}
            actions={auditActions}
            emptyIcon={FileText}
            emptyTitle="No audit entries"
            emptyDescription="No audit entries logged by branch staff yet."
          />
        </TabsContent>
      </Tabs>

      <AdminDetailModal
        open={viewModal === "staff"}
        onOpenChange={(open) => {
          if (!open) {
            setViewModal(null)
            setSelectedStaff(null)
          }
        }}
        icon={UserCheck}
        title={selectedStaff?.full_name ?? "Staff Details"}
        badge={selectedStaff ? <AdminStatusBadge status={selectedStaff.status} /> : undefined}
        subtitle={selectedStaff ? `${selectedStaff.staff_code} • ${selectedStaff.role.replace("_", " ")}` : undefined}
        sections={staffDetailSections}
      />

      <AdminDetailModal
        open={viewModal === "warehouse"}
        onOpenChange={(open) => {
          if (!open) {
            setViewModal(null)
            setSelectedWarehouse(null)
          }
        }}
        icon={WarehouseIcon}
        title={selectedWarehouse?.name ?? "Warehouse Details"}
        badge={selectedWarehouse ? <AdminPill>{selectedWarehouse.code}</AdminPill> : undefined}
        subtitle={selectedWarehouse ? `${selectedWarehouse.city}, ${selectedWarehouse.region}` : undefined}
        sections={warehouseDetailSections}
      />

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
    </div>
  )
}
