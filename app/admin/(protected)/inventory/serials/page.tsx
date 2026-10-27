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
import { getHardwareSerials, registerHardwareSerial, updateSerialStatus } from "@/lib/serial-actions"
import { HardwareSerial, SerialWarrantyStatus } from "@/lib/erp/inventory-extra-types"
import {
  Cpu,
  Plus,
  Search,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Building2,
  Calendar,
  Layers,
  Wrench,
  Package
} from "lucide-react"

const STATUS_CONFIG: Record<SerialWarrantyStatus, { label: string; color: string }> = {
  in_stock: { label: "In Stock", color: "border-emerald-500/30 text-emerald-500 bg-emerald-500/10" },
  reserved: { label: "Reserved", color: "border-purple-500/30 text-purple-500 bg-purple-500/10" },
  allocated: { label: "Allocated to Order", color: "border-blue-500/30 text-blue-500 bg-blue-500/10" },
  sold: { label: "Sold & Deployed", color: "border-teal-500/30 text-teal-500 bg-teal-500/10" },
  under_warranty: { label: "Under Warranty", color: "border-teal-500/30 text-teal-400 bg-teal-500/10" },
  warranty_expired: { label: "Warranty Expired", color: "border-orange-500/30 text-orange-500 bg-orange-500/10" },
  under_repair: { label: "Lab Diagnostic", color: "border-amber-500/30 text-amber-500 bg-amber-500/10" },
  rma: { label: "Vendor RMA Return", color: "border-rose-500/30 text-rose-500 bg-rose-500/10" },
  rma_returned: { label: "RMA Returned", color: "border-pink-500/30 text-pink-500 bg-pink-500/10" },
  defective: { label: "Defective / Dead on Arrival", color: "border-red-500/30 text-red-500 bg-red-500/10" },
  decommissioned: { label: "Decommissioned", color: "border-slate-500/30 text-slate-400 bg-slate-500/10" }
}

export default function HardwareSerialsPage() {
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [serials, setSerials] = useState<HardwareSerial[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

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
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
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
        notes
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

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSerial) return
    setIsStatusSubmitting(true)
    try {
      await updateSerialStatus(selectedSerial.id, newStatus, statusNotes)
      toast({ title: "Status Updated", description: `Unit ${selectedSerial.serial_number} marked as ${newStatus}.` })
      setIsStatusOpen(false)
      loadData()
    } catch {
      toast({ title: "Update Failed", description: "Could not update status.", variant: "destructive" })
    } finally {
      setIsStatusSubmitting(false)
    }
  }

  const filteredSerials = serials.filter(s => {
    const matchesSearch =
      s.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.mac_address && s.mac_address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.customer_name && s.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === "all" || s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Metrics
  const totalUnits = serials.length
  const inStockUnits = serials.filter(s => s.status === "in_stock").length
  const deployedUnits = serials.filter(s => s.status === "sold").length
  const rmaUnits = serials.filter(s => s.status === "under_repair" || s.status === "rma").length

  if (isLoading && serials.length === 0) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <AdminLoading />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#000080] to-[#40E0D0] text-white shadow-lg shadow-[#000080]/20">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hardware Serials & Warranties</h1>
            <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
              Unit-level hardware serialization, MAC address tracking, and warranty life-cycles
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className={cn(isDark ? "border-slate-800 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-100")}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsRegisterOpen(true)}
            className="bg-[#000080] text-white hover:bg-[#000080]/90 shadow-md shadow-[#000080]/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Register Serial Number
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4">
            <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
              Tracked Units
            </span>
            <div className="mt-2 text-2xl font-bold">
              {totalUnits}
            </div>
            <p className="mt-1 text-xs text-slate-400">Total serialized assets</p>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4">
            <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
              In Stock & Ready
            </span>
            <div className="mt-2 text-2xl font-bold text-emerald-500">
              {inStockUnits}
            </div>
            <p className="mt-1 text-xs text-emerald-500">Available for customer dispatch</p>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4">
            <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
              Sold & Deployed
            </span>
            <div className="mt-2 text-2xl font-bold text-teal-500">
              {deployedUnits}
            </div>
            <p className="mt-1 text-xs text-teal-500">Under client warranty</p>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4">
            <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
              RMA & Diagnostic
            </span>
            <div className="mt-2 text-2xl font-bold text-amber-500">
              {rmaUnits}
            </div>
            <p className="mt-1 text-xs text-amber-500">Bench test or vendor return</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className={cn("absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", isDark ? "text-slate-500" : "text-slate-400")} />
          <Input
            placeholder="Search serial number, MAC address, product, customer..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={cn("pl-9", isDark ? "bg-[#0d0d12]/60 border-slate-800" : "bg-white border-slate-200")}
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={cn("w-[200px]", isDark ? "bg-[#0d0d12]/60 border-slate-800" : "bg-white border-slate-200")}>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="allocated">Allocated to Order</SelectItem>
              <SelectItem value="sold">Sold & Deployed</SelectItem>
              <SelectItem value="under_repair">Lab Diagnostic</SelectItem>
              <SelectItem value="rma">Vendor RMA</SelectItem>
              <SelectItem value="decommissioned">Decommissioned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Serials Table */}
      <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={cn("border-b text-xs uppercase font-semibold", isDark ? "border-slate-800 bg-slate-900/50 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-600")}>
              <tr>
                <th className="px-4 py-3">Serial Number</th>
                <th className="px-4 py-3">Hardware Product</th>
                <th className="px-4 py-3">MAC / Hardware ID</th>
                <th className="px-4 py-3">Warehouse Hub</th>
                <th className="px-4 py-3">Warranty Window</th>
                <th className="px-4 py-3">Customer / Deployment</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSerials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No serialized hardware units found.
                  </td>
                </tr>
              ) : (
                filteredSerials.map(s => {
                  const statusConf = STATUS_CONFIG[s.status] || STATUS_CONFIG.in_stock
                  return (
                    <tr key={s.id} className={isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50"}>
                      <td className="px-4 py-3 font-mono font-semibold text-primary">
                        {s.serial_number}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {s.product_name}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">
                        {s.mac_address || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {s.warehouse_name}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="flex items-center gap-1 font-mono">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>{s.warranty_months} Months</span>
                        </div>
                        {s.warranty_end_date && (
                          <div className="text-[11px] text-slate-400">Expires: {s.warranty_end_date}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {s.customer_name ? (
                          <div>
                            <span className="font-semibold">{s.customer_name}</span>
                            {s.invoice_number && <div className="text-[11px] font-mono text-slate-400">Inv: {s.invoice_number}</div>}
                          </div>
                        ) : (
                          <span className="text-slate-400">Unallocated</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className={cn("text-xs capitalize font-normal border", statusConf.color)}>
                          {statusConf.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenStatus(s)}
                          className="h-7 text-xs text-[#000080] dark:text-[#40E0D0] hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Wrench className="mr-1 h-3 w-3" />
                          Update
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Register Unit Modal */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className={cn("max-w-md", isDark ? "bg-[#0d0d12] border-slate-800 text-slate-100" : "bg-white border-slate-200")}>
          <DialogHeader>
            <DialogTitle>Register Serialized Hardware</DialogTitle>
            <DialogDescription className={isDark ? "text-slate-400" : "text-slate-500"}>
              Assign unique barcode/serial identification and factory warranty terms.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="pName" className="text-xs">Product Catalogue Model *</Label>
              <Input
                id="pName"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="sNum" className="text-xs">Serial Number *</Label>
                <Input
                  id="sNum"
                  placeholder="e.g. DS-2CD-99120"
                  value={serialNumber}
                  onChange={e => setSerialNumber(e.target.value)}
                  className={isDark ? "bg-slate-900 border-slate-800 font-mono" : "border-slate-200 font-mono"}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mac" className="text-xs">MAC Address</Label>
                <Input
                  id="mac"
                  placeholder="e.g. A4:14:37:88:9B:12"
                  value={macAddress}
                  onChange={e => setMacAddress(e.target.value)}
                  className={isDark ? "bg-slate-900 border-slate-800 font-mono" : "border-slate-200 font-mono"}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="wh" className="text-xs">Warehouse / Depot</Label>
                <Input
                  id="wh"
                  value={warehouseName}
                  onChange={e => setWarehouseName(e.target.value)}
                  className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="wMonths" className="text-xs">Warranty Duration (Months)</Label>
                <Input
                  id="wMonths"
                  type="number"
                  value={warrantyMonths}
                  onChange={e => setWarrantyMonths(Number(e.target.value) || 12)}
                  className={isDark ? "bg-slate-900 border-slate-800 font-mono" : "border-slate-200 font-mono"}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes" className="text-xs">QC Notes / Bench Verification</Label>
              <Input
                id="notes"
                placeholder="e.g. Passed bench power-on and firmware check"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsRegisterOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#000080] text-white hover:bg-[#000080]/90">
                {isSubmitting ? "Registering..." : "Save Serial Record"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Status Modal */}
      <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
        <DialogContent className={cn("max-w-md", isDark ? "bg-[#0d0d12] border-slate-800 text-slate-100" : "bg-white border-slate-200")}>
          <DialogHeader>
            <DialogTitle>Update Unit Lifecycle Status</DialogTitle>
            <DialogDescription className={isDark ? "text-slate-400" : "text-slate-500"}>
              Change deployment, repair, or RMA status of this hardware asset.
            </DialogDescription>
          </DialogHeader>

          {selectedSerial && (
            <form onSubmit={handleSaveStatus} className="space-y-4">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-500/5 text-xs space-y-1">
                <div className="font-bold text-sm">{selectedSerial.product_name}</div>
                <div className="font-mono text-primary">Serial: {selectedSerial.serial_number}</div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="statusSelect" className="text-xs">Lifecycle Status *</Label>
                <Select value={newStatus} onValueChange={(val: any) => setNewStatus(val)}>
                  <SelectTrigger className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_stock">In Stock (Available)</SelectItem>
                    <SelectItem value="allocated">Allocated to Order</SelectItem>
                    <SelectItem value="sold">Sold & Deployed</SelectItem>
                    <SelectItem value="under_repair">Lab Diagnostic / Bench Test</SelectItem>
                    <SelectItem value="rma">Vendor RMA Return</SelectItem>
                    <SelectItem value="decommissioned">Decommissioned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="statusNotes" className="text-xs">Diagnostic / Movement Notes</Label>
                <Input
                  id="statusNotes"
                  value={statusNotes}
                  onChange={e => setStatusNotes(e.target.value)}
                  className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsStatusOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isStatusSubmitting} className="bg-[#000080] text-white hover:bg-[#000080]/90">
                  {isStatusSubmitting ? "Updating..." : "Update Status"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
