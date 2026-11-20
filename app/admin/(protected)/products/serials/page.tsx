"use client"

import { useState, useEffect, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminLoading from "@/components/admin/admin-loading"
import {
  AdminDetailModal,
  AdminFilterBar,
  AdminFormField,
  AdminFormGrid,
  AdminFormModal,
  AdminInput,
  AdminMutedText,
  AdminPageHeader,
  AdminPill,
  AdminPrimaryCell,
  AdminSelect,
  AdminStats,
  AdminStatusBadge,
  AdminTable,
  type AdminFilterTab,
  type AdminTableAction,
  type AdminTableColumn,
} from "@/components/admin/ui"
import { getHardwareSerials, registerHardwareSerial, updateSerialStatus } from "@/lib/serial-actions"
import type { HardwareSerial, SerialWarrantyStatus } from "@/lib/erp/inventory-extra-types"
import {
  Cpu,
  Package,
  ShieldCheck,
  Wrench,
  Layers,
  CheckCircle2,
  RotateCcw,
  Clock,
  Eye,
  Barcode,
  Truck,
} from "lucide-react"

const STATUS_CONFIG: Record<SerialWarrantyStatus, { label: string; tone: string }> = {
  in_stock: { label: "In Stock", tone: "available" },
  reserved: { label: "Reserved", tone: "reserved" },
  allocated: { label: "Allocated to Order", tone: "partially_allocated" },
  sold: { label: "Sold & Deployed", tone: "complete" },
  under_warranty: { label: "Under Warranty", tone: "active" },
  warranty_expired: { label: "Warranty Expired", tone: "expired" },
  under_repair: { label: "Lab Diagnostic", tone: "reviewing" },
  rma: { label: "Vendor RMA Return", tone: "returned" },
  rma_returned: { label: "RMA Returned", tone: "resolved" },
  defective: { label: "Defective / Dead on Arrival", tone: "rejected" },
  decommissioned: { label: "Decommissioned", tone: "inactive" },
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "in_stock", label: "In Stock (Available)" },
  { value: "allocated", label: "Allocated to Order" },
  { value: "sold", label: "Sold & Deployed" },
  { value: "under_repair", label: "Lab Diagnostic / Bench Test" },
  { value: "rma", label: "Vendor RMA Return" },
  { value: "decommissioned", label: "Decommissioned" },
]

function statusInfo(status: SerialWarrantyStatus) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.in_stock
}

export default function HardwareSerialsPage() {
  const { toast } = useToast()

  const [serials, setSerials] = useState<HardwareSerial[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // View Modal
  const [selectedViewSerial, setSelectedViewSerial] = useState<HardwareSerial | null>(null)

  // Register Modal
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [productName, setProductName] = useState("Hikvision 4K AcuSense ColorVu IP Dome Camera")
  const [serialNumber, setSerialNumber] = useState("")
  const [macAddress, setMacAddress] = useState("")
  const [warehouseName, setWarehouseName] = useState("QuardCube Central Hub — Kigamboni")
  const [supplierName, setSupplierName] = useState("Hikvision East Africa Logistics")
  const [warrantyMonths, setWarrantyMonths] = useState(24)
  const [notes, setNotes] = useState("")

  // Status Change Modal
  const [selectedSerial, setSelectedSerial] = useState<HardwareSerial | null>(null)
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<SerialWarrantyStatus>("in_stock")
  const [statusNotes, setStatusNotes] = useState("")
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getHardwareSerials()
      setSerials(data)
    } catch {
      toast({
        title: "Error",
        description: "Failed to load hardware serial numbers.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    if (!serialNumber || !productName) {
      toast({ title: "Validation Error", description: "Product and serial number are required.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const today = new Date().toISOString().split("T")[0]
      const endDate = new Date(Date.now() + warrantyMonths * 30 * 86400000).toISOString().split("T")[0]

      await registerHardwareSerial({
        product_id: 1,
        product_name: productName,
        serial_number: serialNumber.trim(),
        mac_address: macAddress.trim() || undefined,
        warehouse_id: "wh-dar-main",
        warehouse_name: warehouseName,
        status: "in_stock",
        supplier_id: "sup-01",
        supplier_name: supplierName,
        purchase_date: today,
        warranty_months: warrantyMonths,
        warranty_start_date: today,
        warranty_end_date: endDate,
        notes,
      })

      toast({ title: "Unit Registered", description: `Serial number ${serialNumber} entered into inventory ledger.` })
      setIsRegisterOpen(false)
      setSerialNumber("")
      setMacAddress("")
      setNotes("")
      loadData()
    } catch {
      toast({ title: "Registration Error", description: "Failed to register serial number.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenStatus = (item: HardwareSerial) => {
    setSelectedSerial(item)
    setNewStatus(item.status)
    setStatusNotes(item.notes || "")
    setIsStatusOpen(true)
  }

  const handleSaveStatus = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedSerial) return
    setIsStatusSubmitting(true)
    try {
      await updateSerialStatus(selectedSerial.id, newStatus, statusNotes)
      toast({ title: "Status Updated", description: `Serial ${selectedSerial.serial_number} updated to ${newStatus}.` })
      setIsStatusOpen(false)
      loadData()
    } catch {
      toast({ title: "Update Error", description: "Could not update status.", variant: "destructive" })
    } finally {
      setIsStatusSubmitting(false)
    }
  }

  const filteredSerials = serials.filter((s) => {
    const matchesSearch =
      s.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.mac_address && s.mac_address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customer_name && s.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === "all" || s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Metrics (sub-labels folded into titles — AdminStats has no subtitle slot)
  const totalUnits = serials.length
  const inStockUnits = serials.filter((s) => s.status === "in_stock").length
  const deployedUnits = serials.filter((s) => s.status === "sold" || s.status === "allocated").length
  const rmaUnits = serials.filter((s) => s.status === "rma" || s.status === "under_repair").length

  const statusTabs: AdminFilterTab[] = [
    { key: "all", label: "All Units", icon: Layers, count: serials.length },
    { key: "in_stock", label: "In Stock", icon: Package, count: serials.filter((s) => s.status === "in_stock").length },
    { key: "allocated", label: "Allocated", icon: CheckCircle2, count: serials.filter((s) => s.status === "allocated").length },
    { key: "sold", label: "Sold & Deployed", icon: ShieldCheck, count: serials.filter((s) => s.status === "sold").length },
    { key: "under_repair", label: "Lab Diagnostic", icon: Wrench, count: serials.filter((s) => s.status === "under_repair").length },
    { key: "rma", label: "Vendor RMA", icon: RotateCcw, count: serials.filter((s) => s.status === "rma").length },
  ]

  const columns: AdminTableColumn<HardwareSerial>[] = [
    {
      key: "serial_number",
      header: "Serial # & Hardware",
      render: (s) => (
        <AdminPrimaryCell
          icon={Cpu}
          title={s.serial_number}
          subtitle={s.product_name}
        />
      ),
    },
    {
      key: "mac_address",
      header: "MAC Address",
      hidden: "md",
      render: (s) => <AdminMutedText className="font-mono">{s.mac_address || "—"}</AdminMutedText>,
    },
    {
      key: "warehouse_name",
      header: "Warehouse Hub",
      hidden: "lg",
      render: (s) => <AdminPill title={s.warehouse_name}>{s.warehouse_name}</AdminPill>,
    },
    {
      key: "warranty",
      header: "Warranty",
      hidden: "sm",
      render: (s) => (
        <div className="min-w-0 font-mono text-xs">
          <div className="flex items-center gap-1 font-semibold">
            <Clock className="h-3 w-3 text-teal" />
            <span>{s.warranty_months} Mos</span>
          </div>
          {s.warranty_end_date && (
            <AdminMutedText className="block font-mono">Exp: {s.warranty_end_date}</AdminMutedText>
          )}
        </div>
      ),
    },
    {
      key: "deployment",
      header: "Deployment",
      render: (s) =>
        s.customer_name ? (
          <div className="min-w-0">
            <span className="block max-w-[130px] truncate font-bold sm:max-w-[170px]" title={s.customer_name}>
              {s.customer_name}
            </span>
            {s.invoice_number && (
              <AdminMutedText className="block font-mono">Inv: {s.invoice_number}</AdminMutedText>
            )}
          </div>
        ) : (
          <AdminMutedText>Unallocated Stock</AdminMutedText>
        ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (s) => {
        const info = statusInfo(s.status)
        return <AdminStatusBadge status={info.tone} label={info.label} />
      },
    },
  ]

  const actions: AdminTableAction<HardwareSerial>[] = [
    {
      key: "view",
      label: "View Serial Details",
      icon: Eye,
      variant: "view",
      onClick: (s) => setSelectedViewSerial(s),
    },
    {
      key: "status",
      label: "Update Lifecycle Status",
      icon: Wrench,
      variant: "soft",
      mobile: false,
      onClick: handleOpenStatus,
    },
  ]

  if (isLoading && serials.length === 0) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <AdminLoading />
      </div>
    )
  }

  const viewedStatus = selectedViewSerial ? statusInfo(selectedViewSerial.status) : null

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="Hardware Serial"
        accent="& Warranty Tracking"
        subtitle="CCTV cameras, NVRs, biometric terminals, and factory RMA lifecycle records"
        icon={Cpu}
        onRefresh={loadData}
        refreshing={isLoading}
        onAdd={() => setIsRegisterOpen(true)}
        addLabel="Register Hardware Unit"
      />

      <AdminStats
        columns={4}
        items={[
          { title: "Total Serialized Units (Ledger)", value: totalUnits.toString(), icon: Cpu },
          { title: "Available in Stock (Ready)", value: inStockUnits.toString(), icon: Package },
          { title: "Sold & Deployed (Warranties)", value: deployedUnits.toString(), icon: ShieldCheck },
          { title: "RMA & Diagnostics (Bench)", value: rmaUnits.toString(), icon: Wrench },
        ]}
      />

      <AdminFilterBar
        tabs={statusTabs}
        tabValue={statusFilter}
        onTabChange={setStatusFilter}
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search serial number, MAC address, product, customer name..."
      />

      <AdminTable
        columns={columns}
        data={filteredSerials}
        rowKey={(s) => s.id}
        actions={actions}
        emptyIcon={Cpu}
        emptyTitle="No serialized hardware units found"
        emptyDescription="Try adjusting your filters or search keyword"
      />

      {/* View Serial Details Modal */}
      <AdminDetailModal
        open={!!selectedViewSerial}
        onOpenChange={(open) => !open && setSelectedViewSerial(null)}
        icon={Cpu}
        title={selectedViewSerial?.product_name || "Hardware Unit"}
        subtitle={
          selectedViewSerial
            ? `Warehouse: ${selectedViewSerial.warehouse_name} • Supplier: ${selectedViewSerial.supplier_name || "Factory Direct"}`
            : undefined
        }
        badge={
          selectedViewSerial && viewedStatus ? (
            <AdminStatusBadge status={viewedStatus.tone} label={viewedStatus.label} />
          ) : undefined
        }
        size="xl"
        sections={[
          {
            key: "identifiers",
            title: "Hardware Identifiers",
            icon: Barcode,
            fields: [
              {
                label: "Serial Number",
                value: <span className="font-mono font-bold text-teal">{selectedViewSerial?.serial_number || "—"}</span>,
              },
              {
                label: "MAC Address",
                value: <span className="font-mono font-bold">{selectedViewSerial?.mac_address || "Not Applicable"}</span>,
              },
              { label: "Registered Date", value: selectedViewSerial?.purchase_date || "Factory Stock" },
              { label: "Warehouse", value: selectedViewSerial?.warehouse_name || "—" },
              { label: "Supplier", value: selectedViewSerial?.supplier_name || "Factory Direct" },
            ],
          },
          {
            key: "warranty",
            title: "Warranty & Deployment",
            icon: ShieldCheck,
            fields: [
              { label: "Warranty Duration", value: `${selectedViewSerial?.warranty_months || 0} Months` },
              { label: "Warranty Expiration", value: <span className="font-mono font-bold">{selectedViewSerial?.warranty_end_date || "Active"}</span> },
              { label: "Deployment Customer", value: selectedViewSerial?.customer_name || "Internal Stock" },
              { label: "Invoice Number", value: selectedViewSerial?.invoice_number || "—" },
              { label: "Lifecycle Status", value: viewedStatus?.label || "—" },
            ],
          },
          ...(selectedViewSerial?.notes
            ? [
                {
                  key: "notes",
                  title: "Quality & Diagnostic Notes",
                  icon: Truck,
                  span: 3 as const,
                  content: <AdminMutedText>{selectedViewSerial.notes}</AdminMutedText>,
                },
              ]
            : []),
        ]}
        footerActions={
          selectedViewSerial ? (
            <Button
              type="button"
              onClick={() => {
                const serial = selectedViewSerial
                setSelectedViewSerial(null)
                handleOpenStatus(serial)
              }}
              className="gap-1.5 rounded-xl font-bold"
            >
              <Wrench className="h-4 w-4 text-teal" />
              Update Status
            </Button>
          ) : undefined
        }
      />

      {/* Register Unit Modal */}
      <AdminFormModal
        open={isRegisterOpen}
        onOpenChange={setIsRegisterOpen}
        icon={Barcode}
        title="Register Serialized Hardware"
        description="Assign unique barcode/serial identification and factory warranty terms."
        onSubmit={handleRegister}
        isSubmitting={isSubmitting}
        size="md"
        createLabel="Save Serial Record"
      >
        <AdminFormGrid>
          <AdminFormField label="Product Model" required className="sm:col-span-2">
            <AdminInput required value={productName} onChange={(e) => setProductName(e.target.value)} />
          </AdminFormField>

          <AdminFormField label="Serial Number" required>
            <AdminInput
              monospace
              required
              placeholder="e.g. DS-2CD-99120"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
            />
          </AdminFormField>

          <AdminFormField label="MAC Address">
            <AdminInput
              monospace
              placeholder="e.g. A4:14:37:88:9B:12"
              value={macAddress}
              onChange={(e) => setMacAddress(e.target.value)}
            />
          </AdminFormField>

          <AdminFormField label="Warehouse Hub">
            <AdminInput value={warehouseName} onChange={(e) => setWarehouseName(e.target.value)} />
          </AdminFormField>

          <AdminFormField label="Warranty (Months)">
            <AdminInput
              monospace
              type="number"
              value={warrantyMonths}
              onChange={(e) => setWarrantyMonths(Number(e.target.value) || 12)}
            />
          </AdminFormField>

          <AdminFormField label="Supplier Name" className="sm:col-span-2">
            <AdminInput value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
          </AdminFormField>

          <AdminFormField label="QC Notes / Bench Verification" className="sm:col-span-2">
            <AdminInput
              placeholder="e.g. Passed bench power-on and firmware check"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </AdminFormField>
        </AdminFormGrid>
      </AdminFormModal>

      {/* Update Status Modal */}
      <AdminFormModal
        open={isStatusOpen}
        onOpenChange={setIsStatusOpen}
        icon={Wrench}
        title="Update Unit Lifecycle Status"
        description="Change deployment, repair, or RMA status of this hardware asset."
        onSubmit={handleSaveStatus}
        isSubmitting={isStatusSubmitting}
        size="md"
        createLabel="Update Status"
      >
        {selectedSerial && (
          <AdminFormGrid>
            <div className="sm:col-span-2 rounded-xl border border-navy/20 bg-slate-50 p-3.5 text-xs dark:border-teal/30 dark:bg-[#080d2a]">
              <div className="font-bold text-sm">{selectedSerial.product_name}</div>
              <div className="font-mono font-bold text-teal">Serial: {selectedSerial.serial_number}</div>
            </div>

            <AdminFormField label="Lifecycle Status" required className="sm:col-span-2">
              <AdminSelect
                value={newStatus}
                onValueChange={(value) => setNewStatus(value as SerialWarrantyStatus)}
                options={STATUS_OPTIONS}
              />
            </AdminFormField>

            <AdminFormField label="Diagnostic / Movement Notes" className="sm:col-span-2">
              <AdminInput value={statusNotes} onChange={(e) => setStatusNotes(e.target.value)} />
            </AdminFormField>
          </AdminFormGrid>
        )}
      </AdminFormModal>
    </div>
  )
}
