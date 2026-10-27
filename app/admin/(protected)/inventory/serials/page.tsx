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
      {/* Top Banner */}
      <div
        className={cn(
          "p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 mb-6 transition-all duration-300",
          isDark
            ? "bg-[#0a1033] border-none text-white shadow-none"
            : "bg-teal text-navy"
        )}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div
              className={cn(
                "w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 shadow-md",
                isDark
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                  : "bg-navy text-teal border border-navy/20"
              )}
            >
              <Cpu className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-0.5 sm:mb-1 truncate">
                Hardware Serials &amp;{" "}
                <span
                  className={cn(
                    isDark ? "text-teal-400" : "text-white",
                    "drop-shadow-sm"
                  )}
                >
                  Warranties
                </span>
              </h1>
              <p
                className={cn(
                  "text-xs sm:text-sm font-medium line-clamp-1 sm:line-clamp-none",
                  isDark ? "text-teal-300" : "text-navy/90"
                )}
              >
                Unit-level hardware serialization, MAC address tracking, and warranty life-cycles
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5 sm:gap-3 shrink-0 w-full sm:w-auto">
            <Button
              onClick={loadData}
              variant="outline"
              size="sm"
              className={cn(
                "rounded-lg sm:rounded-xl h-8 sm:h-11 px-2.5 sm:px-4 font-bold text-xs sm:text-sm border shadow-sm transition-all active:scale-95 flex-1 sm:flex-none justify-center",
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-white border-white/20"
                  : "bg-white/80 hover:bg-white text-navy border-navy/20"
              )}
            >
              <RefreshCw className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              onClick={() => setIsRegisterOpen(true)}
              className={cn(
                "font-bold rounded-lg sm:rounded-xl h-8 sm:h-11 text-xs sm:text-sm px-3 sm:px-5 gap-1.5 sm:gap-2 shadow-lg transition-all active:scale-95 flex-1 sm:flex-none justify-center shrink-0",
                isDark
                  ? "bg-teal-500 hover:bg-teal-600 text-slate-950 font-black"
                  : "bg-navy hover:bg-navy/90 text-white"
              )}
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Register Serial Number</span>
              <span className="sm:hidden">Register</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card
          className={cn(
            "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
            isDark
              ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]"
              : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
          )}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", isDark ? "text-slate-400" : "text-navy/60")}>
                Tracked Units
              </p>
              <h3 className={cn("text-lg sm:text-2xl font-black font-mono", isDark ? "text-white" : "text-navy")}>
                {totalUnits}
              </h3>
              <p className={cn("text-[11px] font-medium mt-1", isDark ? "text-slate-500" : "text-navy/50")}>
                Total serialized assets
              </p>
            </div>
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                isDark
                  ? "bg-teal-400/10 border-teal-400/30 text-teal-300"
                  : "bg-teal-100/80 border-navy/15 text-navy"
              )}
            >
              <Cpu className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
            isDark
              ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]"
              : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
          )}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", isDark ? "text-slate-400" : "text-navy/60")}>
                In Stock &amp; Ready
              </p>
              <h3 className="text-lg sm:text-2xl font-black font-mono text-emerald-500">
                {inStockUnits}
              </h3>
              <p className={cn("text-[11px] font-medium mt-1", isDark ? "text-slate-500" : "text-navy/50")}>
                Available for dispatch
              </p>
            </div>
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                isDark
                  ? "bg-emerald-400/10 border-emerald-400/30 text-emerald-300"
                  : "bg-emerald-100/80 border-emerald-400/30 text-emerald-600"
              )}
            >
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
            isDark
              ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]"
              : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
          )}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", isDark ? "text-slate-400" : "text-navy/60")}>
                Sold &amp; Deployed
              </p>
              <h3 className="text-lg sm:text-2xl font-black font-mono text-teal-600 dark:text-teal-400">
                {deployedUnits}
              </h3>
              <p className={cn("text-[11px] font-medium mt-1", isDark ? "text-slate-500" : "text-navy/50")}>
                Under client warranty
              </p>
            </div>
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                isDark
                  ? "bg-teal-400/10 border-teal-400/30 text-teal-300"
                  : "bg-teal-100/80 border-navy/15 text-navy"
              )}
            >
              <Package className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
            isDark
              ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]"
              : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
          )}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", isDark ? "text-slate-400" : "text-navy/60")}>
                RMA &amp; Diagnostic
              </p>
              <h3 className="text-lg sm:text-2xl font-black font-mono text-amber-500">
                {rmaUnits}
              </h3>
              <p className={cn("text-[11px] font-medium mt-1", isDark ? "text-slate-500" : "text-navy/50")}>
                Bench test or vendor return
              </p>
            </div>
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                isDark
                  ? "bg-amber-400/10 border-amber-400/30 text-amber-300"
                  : "bg-amber-100/80 border-amber-400/30 text-amber-600"
              )}
            >
              <Wrench className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search */}
      <Card
        className={cn(
          "rounded-2xl p-4 mb-6 transition-all duration-300",
          isDark ? "bg-[#0a1033] border-none shadow-none" : "bg-white border-2 border-navy/20 shadow-sm"
        )}
      >
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4", isDark ? "text-slate-400" : "text-navy/40")} />
            <Input
              placeholder="Search serial number, MAC address, product, customer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10 h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm",
                isDark
                  ? "bg-slate-900/60 border-teal/20 text-white placeholder:text-slate-500 focus:border-teal"
                  : "bg-slate-50 border-navy/20 text-navy placeholder:text-navy/40 focus:border-navy focus:bg-white"
              )}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className={cn(
                  "w-full sm:w-[200px] h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm",
                  isDark
                    ? "bg-slate-900/60 border-teal/20 text-white"
                    : "bg-slate-50 border-navy/20 text-navy"
                )}
              >
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="allocated">Allocated to Order</SelectItem>
                <SelectItem value="sold">Sold &amp; Deployed</SelectItem>
                <SelectItem value="under_repair">Lab Diagnostic</SelectItem>
                <SelectItem value="rma">Vendor RMA</SelectItem>
                <SelectItem value="decommissioned">Decommissioned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Serials Table */}
      <Card
        className={cn(
          "rounded-2xl overflow-hidden transition-all duration-300",
          isDark
            ? "bg-[#080d2a]/80 border-none shadow-lg"
            : "border-2 bg-white border-navy/20 shadow-sm"
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-navy/30 bg-navy text-white text-[11px] sm:text-xs">
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Serial Number</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Hardware Product</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">MAC / Hardware ID</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Warehouse Hub</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Warranty Window</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Customer / Deployment</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-center">Status</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 text-xs sm:text-sm">
              {filteredSerials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-medium">
                    No serialized hardware units found.
                  </td>
                </tr>
              ) : (
                filteredSerials.map(s => {
                  const statusConf = STATUS_CONFIG[s.status] || STATUS_CONFIG.in_stock
                  return (
                    <tr
                      key={s.id}
                      className={cn(
                        "transition-colors",
                        isDark
                          ? "border-b border-navy/20 hover:bg-teal/20 hover:text-white"
                          : "border-b border-navy/10 hover:bg-teal/40 hover:text-navy"
                      )}
                    >
                      <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-mono font-bold text-teal-600 dark:text-teal-400">
                        {s.serial_number}
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-bold">
                        <div className={cn(isDark ? "text-white" : "text-navy")}>{s.product_name}</div>
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-mono text-xs text-slate-400">
                        {s.mac_address || "—"}
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-xs text-slate-500">
                        {s.warehouse_name}
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-xs">
                        <div className="flex items-center gap-1 font-mono font-semibold">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>{s.warranty_months} Months</span>
                        </div>
                        {s.warranty_end_date && (
                          <div className="text-[11px] text-slate-400">Expires: {s.warranty_end_date}</div>
                        )}
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-xs">
                        {s.customer_name ? (
                          <div>
                            <span className="font-bold">{s.customer_name}</span>
                            {s.invoice_number && <div className="text-[11px] font-mono text-slate-400">Inv: {s.invoice_number}</div>}
                          </div>
                        ) : (
                          <span className="text-slate-400">Unallocated</span>
                        )}
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center">
                        <Badge variant="outline" className={cn("text-xs capitalize font-bold rounded-lg px-2.5 py-0.5 border", statusConf.color)}>
                          {statusConf.label}
                        </Badge>
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenStatus(s)}
                          className={cn(
                            "h-8 text-xs font-bold rounded-lg border transition-all active:scale-95",
                            isDark
                              ? "border-teal-400/30 text-teal-300 hover:bg-teal-400/10"
                              : "border-navy/20 text-navy hover:bg-slate-100"
                          )}
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
        <DialogContent className={cn("max-w-md rounded-2xl", isDark ? "bg-[#0a1033] border-teal-500/30 text-white" : "bg-white border-navy/20 text-navy")}>
          <DialogHeader>
            <DialogTitle className={cn("text-xl font-black", isDark ? "text-white" : "text-navy")}>Register Serialized Hardware</DialogTitle>
            <DialogDescription className={isDark ? "text-teal-300" : "text-navy/70"}>
              Assign unique barcode/serial identification and factory warranty terms.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="pName" className={cn("text-xs font-bold", isDark ? "text-slate-300" : "text-navy")}>Product Catalogue Model *</Label>
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
        <DialogContent className={cn("max-w-md rounded-2xl", isDark ? "bg-[#0a1033] border-teal-500/30 text-white" : "bg-white border-navy/20 text-navy")}>
          <DialogHeader>
            <DialogTitle className={cn("text-xl font-black", isDark ? "text-white" : "text-navy")}>Update Unit Lifecycle Status</DialogTitle>
            <DialogDescription className={isDark ? "text-teal-300" : "text-navy/70"}>
              Change deployment, repair, or RMA status of this hardware asset.
            </DialogDescription>
          </DialogHeader>

          {selectedSerial && (
            <form onSubmit={handleSaveStatus} className="space-y-4">
              <div className={cn("p-3 rounded-xl border text-xs space-y-1", isDark ? "border-teal-500/20 bg-slate-900/60" : "border-navy/20 bg-slate-50")}>
                <div className="font-bold text-sm">{selectedSerial.product_name}</div>
                <div className="font-mono font-bold text-teal-600 dark:text-teal-400">Serial: {selectedSerial.serial_number}</div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="statusSelect" className={cn("text-xs font-bold", isDark ? "text-slate-300" : "text-navy")}>Lifecycle Status *</Label>
                <Select value={newStatus} onValueChange={(val: any) => setNewStatus(val)}>
                  <SelectTrigger className={cn("rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-slate-900/60 border-teal/20 text-white" : "bg-slate-50 border-navy/20 text-navy")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_stock">In Stock (Available)</SelectItem>
                    <SelectItem value="allocated">Allocated to Order</SelectItem>
                    <SelectItem value="sold">Sold &amp; Deployed</SelectItem>
                    <SelectItem value="under_repair">Lab Diagnostic / Bench Test</SelectItem>
                    <SelectItem value="rma">Vendor RMA Return</SelectItem>
                    <SelectItem value="decommissioned">Decommissioned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="statusNotes" className={cn("text-xs font-bold", isDark ? "text-slate-300" : "text-navy")}>Diagnostic / Movement Notes</Label>
                <Input
                  id="statusNotes"
                  value={statusNotes}
                  onChange={e => setStatusNotes(e.target.value)}
                  className={cn("rounded-xl border-2 text-xs sm:text-sm", isDark ? "bg-slate-900/60 border-teal/20 text-white placeholder:text-slate-500" : "bg-slate-50 border-navy/20 text-navy placeholder:text-navy/40")}
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button type="button" variant="outline" onClick={() => setIsStatusOpen(false)} className={cn("rounded-xl font-bold", isDark ? "border-white/20 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isStatusSubmitting} className="rounded-xl font-bold bg-[#000080] text-white hover:bg-[#000080]/90 shadow-md">
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
