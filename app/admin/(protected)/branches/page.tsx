"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminLoading from "@/components/admin/admin-loading"
import { getBranches, createBranch, updateBranch, toggleBranchStatus, deleteBranch } from "@/lib/branch-actions"
import type { Branch, StaffMember } from "@/lib/erp/types"
import { getStaffMembers } from "@/lib/staff-actions"
import {
  Store,
  Plus,
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  Boxes,
  CheckCircle2,
  Trash2,
  Edit,
  Globe,
  Eye,
  ExternalLink,
  ShieldCheck,
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

const TANZANIA_REGIONS_CITIES: Record<string, string[]> = {
  "Dar es Salaam": ["Dar es Salaam", "Ilala", "Kinondoni", "Temeke", "Kigamboni", "Ubungo"],
  Arusha: ["Arusha", "Karatu", "Monduli", "Longido", "Meru", "Ngorongoro"],
  Dodoma: ["Dodoma", "Bahi", "Chamwino", "Chemba", "Kondoa", "Kongwa", "Mpwapwa"],
  Mwanza: ["Mwanza", "Ilemela", "Nyamagana", "Magu", "Misungwi", "Sengerema", "Ukerewe"],
  Kilimanjaro: ["Moshi", "Hai", "Siha", "Rombo", "Mwanga", "Same"],
  Mbeya: ["Mbeya", "Chunya", "Kyela", "Mbarali", "Rungwe"],
  Morogoro: ["Morogoro", "Kilosa", "Kilombero", "Gairo", "Mvomero", "Ulanga", "Malinyi"],
  Tanga: ["Tanga", "Muheza", "Korogwe", "Lushoto", "Pangani", "Handeni", "Kilindi", "Mkinga"],
  Zanzibar: ["Zanzibar City", "Stone Town", "Urban West", "North A", "North B", "Central", "South", "Wete", "Chake Chake", "Mkoani"],
  Tabora: ["Tabora", "Nzega", "Igunga", "Urambo", "Sikonge", "Uyui", "Kaliua"],
  Kigoma: ["Kigoma", "Kasulu", "Kibondo", "Buhigwe", "Uvinza", "Kakonko"],
  Iringa: ["Iringa", "Mufindi", "Kilolo"],
  Kagera: ["Bukoba", "Muleba", "Karagwe", "Kyerwa", "Biharamulo", "Ngara", "Missenyi"],
  Mara: ["Musoma", "Tarime", "Bunda", "Rorya", "Serengeti", "Butiama"],
  Shinyanga: ["Shinyanga", "Kahama", "Kishapu"],
  Manyara: ["Babati", "Hanang", "Kiteto", "Mbulu", "Simanjiro"],
  Singida: ["Singida", "Iramba", "Manyoni", "Ikungi", "Mkalama"],
  Ruvuma: ["Songea", "Mbinga", "Namtumbo", "Nyasa", "Tunduru"],
  Rukwa: ["Sumbawanga", "Kalambo", "Nkasi"],
  Pwani: ["Kibaha", "Bagamoyo", "Kisarawe", "Mkuranga", "Rufiji", "Mafia"],
  Lindi: ["Lindi", "Kilwa", "Liwale", "Nachingwea", "Ruangwa"],
  Mtwara: ["Mtwara", "Masasi", "Newala", "Nanyumbu", "Tandahimba"],
  Geita: ["Geita", "Bukombe", "Chato", "Mbogwe", "Nyang'hwale"],
  Simiyu: ["Bariadi", "Busega", "Itilima", "Maswa", "Meatu"],
  Njombe: ["Njombe", "Makambako", "Ludewa", "Wanging'ombe"],
  Katavi: ["Mpanda", "Mlele"],
  Songwe: ["Vwawa", "Tunduma", "Mbozi", "Ileje", "Momba"],
}

interface ManagerOption {
  id: string
  full_name: string
  role?: string
  phone?: string
  email?: string
}

export default function BranchesPage() {
  const { toast } = useToast()

  const [branches, setBranches] = useState<Branch[]>([])
  const [staffList, setStaffList] = useState<StaffMember[]>([])
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

  // Delete & View state
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null)
  const [viewingBranch, setViewingBranch] = useState<Branch | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [branchesData, staffData] = await Promise.all([
        getBranches(),
        getStaffMembers(),
      ])
      setBranches(branchesData || [])
      setStaffList(staffData || [])
    } catch (err: any) {
      toast({ title: "Error Loading Branches", description: err.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion)
    const availableCities = TANZANIA_REGIONS_CITIES[newRegion] || []
    if (availableCities.length > 0) {
      setCity(availableCities[0])
    }
  }

  const handleManagerChange = (val: string) => {
    if (val === "__none__") {
      setManagerName("")
      return
    }
    setManagerName(val)
    const selectedStaff = staffList.find((m) => m.full_name === val)
    if (selectedStaff) {
      if (!phone || phone === "+255") {
        setPhone(selectedStaff.phone || "+255")
      }
      if (!email) {
        setEmail(selectedStaff.email || "")
      }
    }
  }

  const citiesForCurrentRegion = TANZANIA_REGIONS_CITIES[region] || [city]
  const cityOptions = Array.from(new Set([...citiesForCurrentRegion, city].filter(Boolean)))

  const managerOptions: ManagerOption[] = Array.from(
    new Map<string, ManagerOption>([
      ...staffList.map((s) => [s.full_name, { id: s.id, full_name: s.full_name, role: s.role, phone: s.phone, email: s.email }] as [string, ManagerOption]),
      ...(managerName && managerName !== "__none__"
        ? [[managerName, { id: "custom", full_name: managerName, role: "manager", phone: "", email: "" }] as [string, ManagerOption]]
        : []),
    ]).values()
  )

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
    setManagerName(b.manager_name || "")
    setPhone(b.phone || "")
    setEmail(b.email || "")
    setAddress(b.address || "")
    setCity(b.city || "Dar es Salaam")
    setRegion(b.region || "Dar es Salaam")
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
      const payload = {
        name,
        code,
        manager_name: managerName,
        phone,
        email,
        address,
        city,
        region,
        is_main: isMain,
        is_active: isActive,
      }
      if (editingBranch) {
        await updateBranch(editingBranch.id, payload)
        toast({ title: "Branch Updated", description: `${name} has been updated successfully.` })
      } else {
        await createBranch(payload)
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
        description: `${branchName} status changed to ${updated ? "Active" : "Inactive"}.`,
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
      setIsViewOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtered list
  const filteredBranches = branches.filter((b) => {
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
  const activeLocations = branches.filter((b) => b.is_active).length
  const totalStaffAcross = branches.reduce((sum, b) => sum + (b.staff_count || 0), 0)
  const totalInventoryValuation = branches.reduce((sum, b) => sum + (b.inventory_val || 0), 0)

  if (isLoading) {
    return <AdminLoading message="Loading branch locations..." />
  }

  const columns: AdminTableColumn<Branch>[] = [
    {
      key: "branch",
      header: "Branch Code & Name",
      render: (b) => (
        <AdminPrimaryCell
          icon={b.is_main ? Building2 : Store}
          title={b.name}
          subtitle={b.code}
          href={`/admin/branches/${b.id}`}
          badge={
            b.is_main ? (
              <span className="bg-teal text-navy text-[9px] font-black uppercase px-1.5 py-0.5 rounded whitespace-nowrap">
                HQ
              </span>
            ) : undefined
          }
        />
      ),
    },
    {
      key: "manager",
      header: "Manager In Charge",
      hidden: "sm",
      render: (b) => (
        <div className="min-w-0">
          <p className="font-bold text-xs truncate">{b.manager_name || "Unassigned"}</p>
          <AdminMutedText>Store Manager</AdminMutedText>
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      hidden: "md",
      render: (b) => (
        <div className="min-w-0">
          <span className="flex items-center gap-1 font-bold text-xs">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            {b.city}, {b.region}
          </span>
          <AdminMutedText className="block truncate max-w-[180px]">{b.address}</AdminMutedText>
        </div>
      ),
    },
    {
      key: "staff",
      header: "Staff",
      hidden: "sm",
      align: "center",
      render: (b) => <AdminPill>{b.staff_count || 0} Staff</AdminPill>,
    },
    {
      key: "status",
      header: "Status",
      hidden: "sm",
      align: "center",
      render: (b) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(b.id, b.name)}
          title="Click to toggle active status"
          className="cursor-pointer"
        >
          <AdminStatusBadge status={b.is_active ? "active" : "inactive"} />
        </button>
      ),
    },
  ]

  const actions: AdminTableAction<Branch>[] = [
    {
      key: "view",
      label: "View Branch Details",
      icon: Eye,
      variant: "view",
      onClick: (b) => {
        setViewingBranch(b)
        setIsViewOpen(true)
      },
    },
    {
      key: "analytics",
      label: "View Branch Analytics & Details",
      icon: ExternalLink,
      variant: "soft",
      href: (b) => `/admin/branches/${b.id}`,
      mobile: false,
    },
    {
      key: "edit",
      label: "Edit Branch",
      icon: Edit,
      variant: "edit",
      onClick: handleOpenEdit,
    },
    {
      key: "delete",
      label: "Delete Branch",
      icon: Trash2,
      variant: "delete",
      hide: (b) => b.is_main,
      onClick: (b) => setBranchToDelete(b),
    },
  ]

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="Branch"
        accent="Management"
        subtitle="Configure physical retail branches, warehouses, regional distribution hubs, and team staffing."
        icon={Store}
        onRefresh={loadData}
        refreshing={isLoading}
        onAdd={handleOpenCreate}
        addLabel="Add New Branch"
        actions={<AdminPill className="uppercase tracking-wider">Multi-Outlet</AdminPill>}
      />

      <AdminStats
        columns={4}
        items={[
          { title: "Total Locations", value: totalLocations.toString(), icon: Store },
          { title: "Active Outlets", value: activeLocations.toString(), icon: CheckCircle2 },
          { title: "Branch Staff", value: totalStaffAcross.toString(), icon: Users },
          { title: "Network Inventory", value: `TZS ${(totalInventoryValuation / 1000000).toFixed(1)}M`, icon: Boxes },
        ]}
      />

      <AdminFilterBar
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search branch name, code, manager, city..."
        selects={[
          {
            value: statusFilter,
            onValueChange: setStatusFilter,
            placeholder: "Filter Status",
            allLabel: "All Outlets",
            options: [
              { value: "active", label: "Active Only" },
              { value: "inactive", label: "Inactive Only" },
              { value: "main", label: "Main HQ Only" },
            ],
          },
        ]}
      />

      <AdminTable
        columns={columns}
        data={filteredBranches}
        rowKey={(b) => b.id}
        actions={actions}
        emptyIcon={Store}
        emptyTitle="No branches found"
        emptyDescription="Try changing your search terms or add a new branch outlet."
      />

      <AdminFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        icon={Store}
        title={editingBranch ? "Edit Branch Location" : "Add New Branch Outlet"}
        description="Fill in the branch identity, physical address, and store manager credentials."
        onSubmit={handleSave}
        isSubmitting={isSaving}
        isEdit={!!editingBranch}
        createLabel="Create Branch"
        editLabel="Save Changes"
        size="lg"
      >
        <AdminFormGrid>
          <AdminFormField label="Branch Name" required className="sm:col-span-2">
            <AdminInput
              required
              placeholder="e.g. City Mall Flagship Store"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Branch Code" required>
            <AdminInput
              required
              monospace
              placeholder="BR-HQ01"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Manager In Charge">
            <AdminSelect
              value={managerName || "__none__"}
              onValueChange={handleManagerChange}
              options={[
                { value: "__none__", label: "-- None (Unassigned) --" },
                ...managerOptions.map((m) => ({
                  value: m.full_name,
                  label: `${m.full_name}${m.role ? ` (${m.role.replace("_", " ")})` : ""}`,
                })),
              ]}
            />
          </AdminFormField>
          <AdminFormField label="Contact Phone">
            <AdminInput
              monospace
              placeholder="+255 754 123 456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Branch Email">
            <AdminInput
              type="email"
              placeholder="branch@quardcubelabs.co.tz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Physical Street Address" className="sm:col-span-2">
            <AdminInput
              placeholder="Plot 14, 1st Floor, Bibi Titi Road"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Region" required>
            <AdminSelect
              value={region}
              onValueChange={handleRegionChange}
              options={Object.keys(TANZANIA_REGIONS_CITIES).map((reg) => ({ value: reg, label: reg }))}
            />
          </AdminFormField>
          <AdminFormField label="City / Municipality" required>
            <AdminSelect
              value={city}
              onValueChange={setCity}
              options={cityOptions.map((c) => ({ value: c, label: c }))}
            />
          </AdminFormField>
        </AdminFormGrid>

        <div className="flex flex-wrap items-center gap-4 pt-1">
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
      </AdminFormModal>

      <AdminDetailModal
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        icon={viewingBranch?.is_main ? Building2 : Store}
        title={viewingBranch?.name || "Branch Details"}
        subtitle={`${viewingBranch?.code || ""} • ${viewingBranch?.city || ""}, ${viewingBranch?.region || ""}`}
        badge={
          viewingBranch && (
            <span className="flex items-center gap-1.5">
              {viewingBranch.is_main && <AdminPill>HQ</AdminPill>}
              <AdminStatusBadge status={viewingBranch.is_active ? "active" : "inactive"} />
            </span>
          )
        }
        size="lg"
        headerActions={
          viewingBranch && (
            <Button variant="outline" size="sm" asChild className="font-bold rounded-xl h-10 px-4">
              <a href={`/admin/branches/${viewingBranch.id}`}>
                <ExternalLink className="w-4 h-4 mr-1.5" />
                Analytics
              </a>
            </Button>
          )
        }
        sections={[
          {
            key: "identity",
            title: "Branch Identity",
            icon: IdCard,
            span: 2,
            fields: [
              { label: "Branch Name", value: viewingBranch?.name || "—" },
              { label: "Branch Code", value: <AdminPill>{viewingBranch?.code || "—"}</AdminPill> },
              { label: "Manager", value: viewingBranch?.manager_name || "Unassigned" },
              { label: "Main HQ", value: viewingBranch?.is_main ? "Yes" : "No" },
            ],
          },
          {
            key: "location",
            title: "Physical Location",
            icon: MapPin,
            fields: [
              { label: "Street Address", value: viewingBranch?.address || "—" },
              { label: "City", value: viewingBranch?.city || "—" },
              { label: "Region", value: viewingBranch?.region || "—" },
              { label: "Branch ID", value: <AdminMutedText className="font-mono">{viewingBranch?.id || "—"}</AdminMutedText> },
            ],
          },
          {
            key: "contact",
            title: "Contact & Operations",
            icon: Phone,
            fields: [
              { label: "Phone", value: viewingBranch?.phone || "—" },
              { label: "Email", value: viewingBranch?.email || "—" },
              { label: "Staff Count", value: viewingBranch?.staff_count || 0 },
              { label: "Active", value: viewingBranch?.is_active ? "Active" : "Inactive" },
            ],
          },
          {
            key: "inventory",
            title: "Inventory Valuation",
            icon: Boxes,
            content: (
              <div className="space-y-2">
                <p className="text-lg font-black">
                  TZS {((viewingBranch?.inventory_val || 0) / 1000000).toFixed(1)}M
                </p>
                <AdminMutedText>
                  Use the branch analytics page for stock movements and valuation details.
                </AdminMutedText>
              </div>
            ),
          },
          {
            key: "reach",
            title: "Regional Reach",
            icon: Globe,
            fields: [
              { label: "Region", value: viewingBranch?.region || "—" },
              { label: "City / Municipality", value: viewingBranch?.city || "—" },
              { label: "Network Status", value: viewingBranch?.is_active ? "Operational" : "Offline" },
              { label: "Access Level", value: viewingBranch?.is_main ? "Headquarters" : "Outlet" },
            ],
          },
          {
            key: "sync",
            title: "Sync & Oversight",
            icon: ShieldCheck,
            fields: [
              { label: "Manager Assigned", value: viewingBranch?.manager_name ? "Yes" : "No" },
              { label: "Contact Available", value: viewingBranch?.phone || viewingBranch?.email ? "Yes" : "No" },
              { label: "HQ Designated", value: viewingBranch?.is_main ? "Yes" : "No" },
              { label: "Outlet Active", value: viewingBranch?.is_active ? "Yes" : "No" },
            ],
          },
        ]}
        onEdit={() => {
          if (viewingBranch) {
            setIsViewOpen(false)
            handleOpenEdit(viewingBranch)
          }
        }}
        editLabel="Edit Branch"
        onDelete={() => {
          if (viewingBranch && !viewingBranch.is_main) setBranchToDelete(viewingBranch)
        }}
        deleteLabel="Delete Branch"
      />

      <AdminConfirmDialog
        open={!!branchToDelete}
        onOpenChange={(open) => {
          if (!open) setBranchToDelete(null)
        }}
        title="Confirm Branch Deletion"
        description={
          <>
            Are you sure you want to delete <span className="font-bold text-red-400">{branchToDelete?.name}</span>?
            This action cannot be undone.
          </>
        }
        confirmLabel="Delete Branch"
        isSubmitting={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
