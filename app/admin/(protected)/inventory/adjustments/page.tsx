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
import { getStockAdjustments, createStockAdjustment } from "@/lib/stock-adjustment-actions"
import { StockAdjustment, StockAdjustmentReason } from "@/lib/erp/inventory-extra-types"
import {
  ClipboardList,
  Plus,
  Search,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Scale,
  Building2,
  Calendar,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Eye,
  FileText,
  Boxes,
  RotateCcw
} from "lucide-react"

const ADJUSTMENT_REASONS: StockAdjustmentReason[] = [
  "Physical Stocktake Count Discrepancy",
  "Damage / Breakage",
  "Theft / Shrinkage",
  "Demonstration / Internal Lab Use",
  "Supplier Return / RMA"
]

export default function StockAdjustmentsPage() {
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [reasonFilter, setReasonFilter] = useState<string>("all")

  // View modal
  const [selectedAdjustment, setSelectedAdjustment] = useState<StockAdjustment | null>(null)

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [productName, setProductName] = useState("Hikvision 4K AcuSense ColorVu IP Dome Camera")
  const [warehouseName, setWarehouseName] = useState("QuardCube Central Hub — Kigamboni")
  const [previousQty, setPreviousQty] = useState<number>(45)
  const [quantityAdjusted, setQuantityAdjusted] = useState<number>(-1)
  const [unitCost, setUnitCost] = useState<number>(285000)
  const [reason, setReason] = useState<StockAdjustmentReason>("Physical Stocktake Count Discrepancy")
  const [notes, setNotes] = useState("")

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getStockAdjustments()
      setAdjustments(data)
    } catch {
      toast({
        title: "Error",
        description: "Failed to load stock adjustments.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productName || quantityAdjusted === 0) {
      toast({ title: "Validation Error", description: "Product and non-zero adjustment delta are required.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      await createStockAdjustment({
        product_id: 1,
        product_name: productName,
        warehouse_id: "wh-dar-main",
        warehouse_name: warehouseName,
        previous_quantity: previousQty,
        quantity_adjusted: quantityAdjusted,
        unit_cost: unitCost,
        reason,
        notes
      })

      toast({
        title: "Stock Adjusted",
        description: `Variance recorded. Inventory ledger and General Ledger updated.`
      })
      setIsCreateOpen(false)
      setNotes("")
      loadData()
    } catch {
      toast({ title: "Adjustment Error", description: "Could not apply stock adjustment.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredAdjustments = adjustments.filter(a => {
    const matchesSearch =
      a.adjustment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.reason.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesReason = reasonFilter === "all" || a.reason === reasonFilter
    return matchesSearch && matchesReason
  })

  // Metrics
  const totalAdjustmentsCount = adjustments.length
  const totalValuationImpact = adjustments.reduce((s, a) => s + a.total_value_impact, 0)
  const shrinkageLoss = adjustments.filter(a => a.quantity_adjusted < 0).reduce((s, a) => s + a.total_value_impact, 0)
  const countDiscrepancies = adjustments.filter(a => a.reason.includes("Physical Stocktake")).length

  if (isLoading && adjustments.length === 0) {
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
              <ClipboardList className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-0.5 sm:mb-1 truncate">
                Stock Adjustments &amp;{" "}
                <span
                  className={cn(
                    isDark ? "text-teal-400" : "text-white",
                    "drop-shadow-sm"
                  )}
                >
                  Audits
                </span>
              </h1>
              <p
                className={cn(
                  "text-xs sm:text-sm font-semibold line-clamp-1 sm:line-clamp-none",
                  isDark ? "text-teal-300" : "text-navy/90"
                )}
              >
                Physical inventory audits, shrinkage write-offs, and warehouse stock corrections
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5 sm:gap-3 shrink-0 w-full sm:w-auto">
            <Button
              onClick={loadData}
              variant="outline"
              size="sm"
              className={cn(
                "rounded-xl h-8 sm:h-11 px-2.5 sm:px-4 font-bold text-xs sm:text-sm border shadow-sm transition-all active:scale-95 flex-1 sm:flex-none justify-center",
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-white border-white/20"
                  : "bg-white/80 hover:bg-white text-navy border-navy/20"
              )}
            >
              <RefreshCw className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-8 sm:h-11 text-xs sm:text-sm px-3 sm:px-5 gap-1.5 sm:gap-2 shadow-lg transition-all active:scale-95 flex-1 sm:flex-none justify-center shrink-0"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">New Stock Adjustment</span>
              <span className="sm:hidden">New Adjustment</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
        {[
          { title: "Total Adjustments", value: totalAdjustmentsCount.toString(), icon: ClipboardList, color: "text-blue-500", sub: "Recorded stock vouchers" },
          { title: "Net Valuation Impact", value: `TZS ${totalValuationImpact.toLocaleString()}`, icon: Scale, color: totalValuationImpact < 0 ? "text-rose-500" : "text-emerald-500", sub: "Inventory book variance" },
          { title: "Shrinkage & Loss", value: `TZS ${Math.abs(shrinkageLoss).toLocaleString()}`, icon: TrendingDown, color: "text-rose-500", sub: "Damages & write-offs" },
          { title: "Stocktake Variances", value: countDiscrepancies.toString(), icon: AlertTriangle, color: "text-amber-500", sub: "Physical count delta" }
        ].map((stat, idx) => (
          <Card
            key={idx}
            className={cn(
              "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group overflow-hidden",
              isDark
                ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]"
                : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
            )}
          >
            <CardContent className="p-3 sm:p-4.5 flex items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <p className={cn("text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5 sm:mb-1 truncate block", isDark ? "text-teal-400/80" : "text-navy/70")}>
                  {stat.title}
                </p>
                <span className={cn("text-xs sm:text-sm lg:text-base font-black truncate block font-mono leading-tight tracking-tight", isDark ? "text-white" : "text-navy")}>
                  {stat.value}
                </span>
                <p className={cn("text-[10px] font-medium mt-0.5 sm:mt-1 truncate opacity-70", isDark ? "text-slate-300" : "text-navy/60")}>
                  {stat.sub}
                </p>
              </div>
              <div
                className={cn(
                  "w-9 h-9 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                  isDark
                    ? "bg-navy border-teal/30 text-teal group-hover:bg-navy/80"
                    : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
                )}
              >
                <stat.icon className={cn("h-4 w-4 sm:h-5 sm:w-5 shrink-0", isDark ? "text-teal" : "")} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter and Search */}
      <Card
        className={cn(
          "rounded-2xl p-3 sm:p-4 transition-all duration-300 space-y-3",
          isDark ? "bg-[#0a1033] border-none shadow-none" : "bg-white border-2 border-navy/20 shadow-sm"
        )}
      >
        {/* Reason Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: "all", label: "All Audits", icon: Layers, count: adjustments.length },
            { key: "Physical Stocktake Count Discrepancy", label: "Stocktake Discrepancy", icon: ClipboardList, count: adjustments.filter(a => a.reason.includes("Physical Stocktake")).length },
            { key: "Damage / Breakage", label: "Damage & Breakage", icon: AlertTriangle, count: adjustments.filter(a => a.reason.includes("Damage")).length },
            { key: "Theft / Shrinkage", label: "Theft & Shrinkage", icon: TrendingDown, count: adjustments.filter(a => a.reason.includes("Theft")).length },
            { key: "Demonstration / Internal Lab Use", label: "Internal Lab Use", icon: Boxes, count: adjustments.filter(a => a.reason.includes("Lab Use")).length },
            { key: "Supplier Return / RMA", label: "Supplier RMA", icon: RotateCcw, count: adjustments.filter(a => a.reason.includes("RMA")).length }
          ].map((tab) => {
            const isSelected = reasonFilter === tab.key
            const Icon = tab.icon

            return (
              <button
                key={tab.key}
                onClick={() => setReasonFilter(tab.key)}
                className={cn(
                  "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer",
                  isSelected
                    ? "bg-navy text-white shadow-md"
                    : isDark 
                      ? "text-slate-300 hover:bg-teal-400/10 hover:text-teal-300" 
                      : "text-navy/70 hover:bg-teal-50 hover:text-navy"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isSelected ? "text-white" : isDark ? "text-slate-400" : "text-navy/60")} />
                <span>{tab.label}</span>
                <span className={cn(
                  "ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors",
                  isSelected 
                    ? "bg-white/20 text-white"
                    : isDark ? "bg-slate-800 text-slate-300" : "bg-navy/10 text-navy"
                )}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="pt-1">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal h-4 w-4" />
            <Input
              placeholder="Search adjustment number, product name, warehouse hub, or notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10 h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm",
                isDark
                  ? "bg-[#080d2a] border-teal/30 text-white placeholder:text-slate-500 focus-visible:ring-teal/30"
                  : "bg-white border-navy/20 text-navy placeholder:text-navy/40 focus-visible:ring-navy/20"
              )}
            />
          </div>
        </div>
      </Card>

      {/* Adjustments Table */}
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
              <tr className="border-b border-navy/30 bg-navy text-white text-[10px] sm:text-xs">
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black uppercase tracking-wider text-left">Adjustment #</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black uppercase tracking-wider text-left">Product Name</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black uppercase tracking-wider text-left hidden md:table-cell">Warehouse Hub</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black uppercase tracking-wider text-center">Previous Qty</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black uppercase tracking-wider text-center">Adjustment</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black uppercase tracking-wider text-center">New Qty</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black uppercase tracking-wider text-right">Valuation Impact</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black uppercase tracking-wider text-left hidden sm:table-cell">Reason Code</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 text-xs sm:text-sm">
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-navy/60 dark:text-slate-400">
                    <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40 text-navy dark:text-teal" />
                    <p className="font-bold text-base">No inventory adjustments found</p>
                    <p className="text-xs font-medium mt-1">Try adjusting your filters or search keyword</p>
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map(adj => (
                  <tr
                    key={adj.id}
                    className={cn(
                      "transition-colors duration-150",
                      isDark
                        ? "hover:bg-teal/20 hover:text-white"
                        : "hover:bg-teal/40 hover:text-navy"
                    )}
                  >
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-mono font-bold text-teal">
                      {adj.adjustment_number}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-bold">
                      <div className={cn(isDark ? "text-white" : "text-navy")}>{adj.product_name}</div>
                      {adj.notes && <div className="text-[11px] text-slate-400 font-normal">{adj.notes}</div>}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-xs opacity-75 hidden md:table-cell">
                      {adj.warehouse_name}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center font-mono font-semibold">
                      {adj.previous_quantity}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center font-mono font-black">
                      <span className={adj.quantity_adjusted < 0 ? "text-rose-500" : "text-emerald-500"}>
                        {adj.quantity_adjusted > 0 ? `+${adj.quantity_adjusted}` : adj.quantity_adjusted}
                      </span>
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center font-mono font-bold">
                      {adj.new_quantity}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right font-mono font-black">
                      <span className={adj.total_value_impact < 0 ? "text-rose-500" : "text-emerald-500"}>
                        TZS {adj.total_value_impact.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 hidden sm:table-cell">
                      <Badge variant="outline" className={cn("text-[10px] sm:text-xs font-semibold rounded-lg px-2.5 py-0.5 border", isDark ? "border-teal-500/30 text-teal-300 bg-teal-500/10" : "border-navy/20 text-navy bg-slate-50")}>
                        {adj.reason}
                      </Badge>
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedAdjustment(adj)}
                        className={cn(
                          "h-8 px-2.5 text-xs font-bold rounded-xl border shadow-xs transition-all active:scale-95",
                          isDark ? "border-teal/30 hover:bg-teal/20 text-white" : "border-navy/20 hover:bg-teal-50 text-navy"
                        )}
                        title="View Adjustment Audit"
                      >
                        <Eye className="h-3.5 w-3.5 sm:mr-1" />
                        <span className="hidden sm:inline">Audit</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Adjustment Audit Modal */}
      <Dialog open={!!selectedAdjustment} onOpenChange={(open) => !open && setSelectedAdjustment(null)}>
        <DialogContent className={cn("max-w-2xl", isDark ? "bg-[#0a1033] border-2 border-teal/30 text-white" : "bg-white border-2 border-navy text-navy")}>
          {selectedAdjustment && (
            <div className="space-y-6">
              {/* Header Navigation Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-navy/10 dark:border-teal/20 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-inner", isDark ? "bg-teal/20 text-teal" : "bg-navy text-white")}>
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-md bg-teal/20 text-teal border border-teal/30">
                        {selectedAdjustment.adjustment_number}
                      </span>
                      <h2 className={cn("text-xl sm:text-2xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
                        Stock Adjustment Audit
                      </h2>
                    </div>
                    <p className={cn("text-xs sm:text-sm font-medium mt-0.5", isDark ? "text-slate-300" : "text-navy/70")}>
                      Warehouse: <span className="font-bold">{selectedAdjustment.warehouse_name}</span> • Auditor: <span className="font-bold">{selectedAdjustment.performed_by}</span>
                    </p>
                  </div>
                </div>

                <Badge className={cn("font-bold text-xs px-3 py-1 rounded-lg", selectedAdjustment.quantity_adjusted < 0 ? "bg-rose-500 text-white" : "bg-emerald-500 text-white")}>
                  {selectedAdjustment.quantity_adjusted < 0 ? "Stock Reduction" : "Stock Inflow"}
                </Badge>
              </div>

              {/* Product and Impact Banner */}
              <div className={cn(
                "p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
                isDark ? "bg-teal/15 border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
              )}>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider opacity-70 block">Product</span>
                  <div className="font-black text-base sm:text-lg tracking-tight mt-0.5">
                    {selectedAdjustment.product_name}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black uppercase tracking-wider opacity-70 block">Valuation Impact</span>
                  <div className={cn("font-mono font-black text-xl sm:text-2xl mt-0.5", selectedAdjustment.total_value_impact < 0 ? "text-rose-500" : "text-emerald-500")}>
                    TZS {selectedAdjustment.total_value_impact.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Stock Movement Details */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl border border-navy/20 dark:border-teal/20 text-center">
                <div>
                  <span className="text-xs opacity-70 uppercase tracking-wider block">Previous Qty</span>
                  <span className="font-mono font-bold text-lg">{selectedAdjustment.previous_quantity} Units</span>
                </div>
                <div>
                  <span className="text-xs opacity-70 uppercase tracking-wider block">Adjustment Delta</span>
                  <span className={cn("font-mono font-black text-lg", selectedAdjustment.quantity_adjusted < 0 ? "text-rose-500" : "text-emerald-500")}>
                    {selectedAdjustment.quantity_adjusted > 0 ? `+${selectedAdjustment.quantity_adjusted}` : selectedAdjustment.quantity_adjusted} Units
                  </span>
                </div>
                <div>
                  <span className="text-xs opacity-70 uppercase tracking-wider block">New Book Stock</span>
                  <span className="font-mono font-bold text-lg text-teal">{selectedAdjustment.new_quantity} Units</span>
                </div>
              </div>

              {/* Audit Details */}
              <div className={cn("p-4 rounded-xl border space-y-2", isDark ? "bg-[#080d2a] border-teal/20" : "bg-slate-50 border-navy/20")}>
                <div className="flex justify-between items-center text-xs">
                  <span className="opacity-70 font-semibold">Reason Classification:</span>
                  <span className="font-bold">{selectedAdjustment.reason}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="opacity-70 font-semibold">Inventory Unit Cost:</span>
                  <span className="font-mono font-bold">TZS {selectedAdjustment.unit_cost.toLocaleString()}</span>
                </div>
                {selectedAdjustment.notes && (
                  <div className="pt-2 border-t border-navy/10 dark:border-teal/20 text-xs">
                    <span className="opacity-70 font-semibold block mb-0.5">Auditor Narrative:</span>
                    <p className="italic opacity-90">{selectedAdjustment.notes}</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <DialogFooter className="border-t border-navy/10 dark:border-teal/20 pt-4 flex flex-row justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedAdjustment(null)}
                  className={cn("rounded-xl font-bold h-10 px-5", isDark ? "border-teal/30 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Adjustment Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={cn("max-w-md", isDark ? "bg-[#0a1033] border-2 border-teal/30 text-white" : "bg-white border-2 border-navy text-navy")}>
          <DialogHeader>
            <DialogTitle className={cn("text-lg sm:text-xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
              Perform Physical Stock Adjustment
            </DialogTitle>
            <DialogDescription className={cn("text-xs sm:text-sm font-medium", isDark ? "text-slate-300" : "text-navy/70")}>
              Records stock variance, creates a movement record, and posts general ledger write-off journal.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="pName" className="text-xs font-bold uppercase tracking-wider">Product *</Label>
              <Input
                id="pName"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                className={cn("h-10 sm:h-11 rounded-xl border-2 text-xs sm:text-sm font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wh" className="text-xs font-bold uppercase tracking-wider">Warehouse Location</Label>
              <Input
                id="wh"
                value={warehouseName}
                onChange={e => setWarehouseName(e.target.value)}
                className={cn("h-10 sm:h-11 rounded-xl border-2 text-xs sm:text-sm font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prevQty" className="text-xs font-bold uppercase tracking-wider">Current Book Stock</Label>
                <Input
                  id="prevQty"
                  type="number"
                  value={previousQty}
                  onChange={e => setPreviousQty(Number(e.target.value) || 0)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-mono text-xs sm:text-sm font-bold", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adjDelta" className="text-xs font-bold uppercase tracking-wider">Adjustment Delta (+/-) *</Label>
                <Input
                  id="adjDelta"
                  type="number"
                  value={quantityAdjusted}
                  onChange={e => setQuantityAdjusted(Number(e.target.value) || 0)}
                  className={cn(
                    "h-10 sm:h-11 rounded-xl border-2 font-mono font-black text-xs sm:text-sm",
                    isDark ? "bg-[#080d2a] border-teal/30" : "bg-white border-navy/20",
                    quantityAdjusted < 0 ? "text-rose-500" : "text-emerald-500"
                  )}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cost" className="text-xs font-bold uppercase tracking-wider">Unit Cost (TZS)</Label>
                <Input
                  id="cost"
                  type="number"
                  value={unitCost}
                  onChange={e => setUnitCost(Number(e.target.value) || 0)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-mono text-xs sm:text-sm font-bold", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">New Book Quantity</Label>
                <div className={cn("h-10 sm:h-11 px-3 py-2 rounded-xl border-2 font-mono font-black text-sm flex items-center", isDark ? "border-teal/30 bg-[#080d2a] text-teal" : "border-navy/20 bg-slate-50 text-navy")}>
                  {previousQty + quantityAdjusted} Units
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reasonSelect" className="text-xs font-bold uppercase tracking-wider">Reason for Adjustment *</Label>
              <Select value={reason} onValueChange={(val: any) => setReason(val)}>
                <SelectTrigger className={cn("h-10 sm:h-11 rounded-xl border-2 font-semibold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"}>
                  {ADJUSTMENT_REASONS.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider">Audit Notes / Narrative</Label>
              <Input
                id="notes"
                placeholder="e.g. Broken lens detected during quarterly shelf count"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white placeholder:text-slate-500" : "bg-white border-navy/20 text-navy placeholder:text-navy/40")}
              />
            </div>

            <DialogFooter className="pt-3 border-t border-navy/10 dark:border-teal/20 flex flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className={cn("rounded-xl font-bold h-10 px-5", isDark ? "border-teal/30 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-5 gap-1.5 shadow-md"
              >
                {isSubmitting ? "Adjusting..." : "Post Adjustment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
