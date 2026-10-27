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
  CheckCircle2
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
  const negativeAdjustments = adjustments.filter(a => a.quantity_adjusted < 0).length

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
                Stocktake &amp;{" "}
                <span
                  className={cn(
                    isDark ? "text-teal-400" : "text-white",
                    "drop-shadow-sm"
                  )}
                >
                  Adjustments
                </span>
              </h1>
              <p
                className={cn(
                  "text-xs sm:text-sm font-medium line-clamp-1 sm:line-clamp-none",
                  isDark ? "text-teal-300" : "text-navy/90"
                )}
              >
                Physical stock counting, inventory shrinkage write-downs, and automated GL cost adjustments
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
              onClick={() => setIsCreateOpen(true)}
              className={cn(
                "font-bold rounded-lg sm:rounded-xl h-8 sm:h-11 text-xs sm:text-sm px-3 sm:px-5 gap-1.5 sm:gap-2 shadow-lg transition-all active:scale-95 flex-1 sm:flex-none justify-center shrink-0",
                isDark
                  ? "bg-teal-500 hover:bg-teal-600 text-slate-950 font-black"
                  : "bg-navy hover:bg-navy/90 text-white"
              )}
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">New Stock Adjustment</span>
              <span className="sm:hidden">Adjust</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
                Adjustment Vouchers
              </p>
              <h3 className={cn("text-lg sm:text-2xl font-black font-mono", isDark ? "text-white" : "text-navy")}>
                {totalAdjustmentsCount}
              </h3>
              <p className={cn("text-[11px] font-medium mt-1", isDark ? "text-slate-500" : "text-navy/50")}>
                Physical count audit entries
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
              <ClipboardList className="w-5 h-5" />
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
                Net Valuation Impact
              </p>
              <h3 className={cn("text-lg sm:text-2xl font-black font-mono", totalValuationImpact < 0 ? "text-rose-500" : "text-emerald-500")}>
                TZS {totalValuationImpact.toLocaleString()}
              </h3>
              <p className={cn("text-[11px] font-medium mt-1", isDark ? "text-slate-500" : "text-navy/50")}>
                Inventory asset balance adjustment
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
              <Scale className="w-5 h-5" />
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
                Shrinkage / Write-Downs
              </p>
              <h3 className="text-lg sm:text-2xl font-black font-mono text-amber-500">
                {negativeAdjustments} Units
              </h3>
              <p className={cn("text-[11px] font-medium mt-1", isDark ? "text-slate-500" : "text-navy/50")}>
                Tracked with GL journal audit
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
              <AlertTriangle className="w-5 h-5" />
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
              placeholder="Search adjustment number, item, reason..."
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
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger
                className={cn(
                  "w-full sm:w-[240px] h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm",
                  isDark
                    ? "bg-slate-900/60 border-teal/20 text-white"
                    : "bg-slate-50 border-navy/20 text-navy"
                )}
              >
                <SelectValue placeholder="All Reasons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                {ADJUSTMENT_REASONS.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <tr className="border-b border-navy/30 bg-navy text-white text-[11px] sm:text-xs">
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Adjustment #</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Product Name</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Warehouse Hub</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-center">Previous Qty</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-center">Adjustment</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-center">New Qty</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-right">Valuation Impact</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Reason Code</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-right">Auditor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 text-xs sm:text-sm">
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">
                    No inventory adjustments found.
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map(adj => (
                  <tr
                    key={adj.id}
                    className={cn(
                      "transition-colors",
                      isDark
                        ? "border-b border-navy/20 hover:bg-teal/20 hover:text-white"
                        : "border-b border-navy/10 hover:bg-teal/40 hover:text-navy"
                    )}
                  >
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-mono font-bold text-teal-600 dark:text-teal-400">
                      {adj.adjustment_number}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-bold">
                      <div className={cn(isDark ? "text-white" : "text-navy")}>{adj.product_name}</div>
                      {adj.notes && <div className="text-[11px] text-slate-400 font-normal">{adj.notes}</div>}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-xs text-slate-500">
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
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                      <Badge variant="outline" className={cn("text-xs font-semibold rounded-lg px-2.5 py-0.5 border", isDark ? "border-teal-500/30 text-teal-300 bg-teal-500/10" : "border-navy/20 text-navy bg-slate-50")}>
                        {adj.reason}
                      </Badge>
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right text-xs text-slate-500 font-medium">
                      {adj.performed_by}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Adjustment Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={cn("max-w-md rounded-2xl", isDark ? "bg-[#0a1033] border-teal-500/30 text-white" : "bg-white border-navy/20 text-navy")}>
          <DialogHeader>
            <DialogTitle className={cn("text-xl font-black", isDark ? "text-white" : "text-navy")}>Perform Physical Stock Adjustment</DialogTitle>
            <DialogDescription className={isDark ? "text-teal-300" : "text-navy/70"}>
              Records stock variance, creates a movement record, and posts general ledger write-off journal.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="pName" className={cn("text-xs font-bold", isDark ? "text-slate-300" : "text-navy")}>Product *</Label>
              <Input
                id="pName"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                className={cn("rounded-xl border-2 text-xs sm:text-sm", isDark ? "bg-slate-900/60 border-teal/20 text-white" : "bg-slate-50 border-navy/20 text-navy")}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="wh" className={cn("text-xs font-bold", isDark ? "text-slate-300" : "text-navy")}>Warehouse Location</Label>
              <Input
                id="wh"
                value={warehouseName}
                onChange={e => setWarehouseName(e.target.value)}
                className={cn("rounded-xl border-2 text-xs sm:text-sm", isDark ? "bg-slate-900/60 border-teal/20 text-white" : "bg-slate-50 border-navy/20 text-navy")}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="prevQty" className={cn("text-xs font-bold", isDark ? "text-slate-300" : "text-navy")}>Current Book Stock</Label>
                <Input
                  id="prevQty"
                  type="number"
                  value={previousQty}
                  onChange={e => setPreviousQty(Number(e.target.value) || 0)}
                  className={cn("rounded-xl border-2 font-mono text-xs sm:text-sm", isDark ? "bg-slate-900/60 border-teal/20 text-white" : "bg-slate-50 border-navy/20 text-navy")}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="adjDelta" className={cn("text-xs font-bold", isDark ? "text-slate-300" : "text-navy")}>Adjustment Delta (+/-) *</Label>
                <Input
                  id="adjDelta"
                  type="number"
                  value={quantityAdjusted}
                  onChange={e => setQuantityAdjusted(Number(e.target.value) || 0)}
                  className={cn(
                    "rounded-xl border-2 font-mono font-bold text-xs sm:text-sm",
                    isDark ? "bg-slate-900/60 border-teal/20" : "bg-slate-50 border-navy/20",
                    quantityAdjusted < 0 ? "text-rose-500" : "text-emerald-500"
                  )}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cost" className={cn("text-xs font-bold", isDark ? "text-slate-300" : "text-navy")}>Unit Cost (TZS)</Label>
                <Input
                  id="cost"
                  type="number"
                  value={unitCost}
                  onChange={e => setUnitCost(Number(e.target.value) || 0)}
                  className={cn("rounded-xl border-2 font-mono text-xs sm:text-sm", isDark ? "bg-slate-900/60 border-teal/20 text-white" : "bg-slate-50 border-navy/20 text-navy")}
                />
              </div>
              <div className="space-y-1">
                <Label className={cn("text-xs font-bold", isDark ? "text-slate-300" : "text-navy")}>New Book Quantity</Label>
                <div className={cn("h-10 sm:h-11 px-3 py-2 rounded-xl border-2 font-mono font-black text-sm flex items-center", isDark ? "border-teal/20 bg-slate-900/60 text-teal-400" : "border-navy/20 bg-slate-50 text-navy")}>
                  {previousQty + quantityAdjusted} Units
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="reasonSelect" className={cn("text-xs font-bold", isDark ? "text-slate-300" : "text-navy")}>Reason for Adjustment *</Label>
              <Select value={reason} onValueChange={(val: any) => setReason(val)}>
                <SelectTrigger className={cn("rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-slate-900/60 border-teal/20 text-white" : "bg-slate-50 border-navy/20 text-navy")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADJUSTMENT_REASONS.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes" className={cn("text-xs font-bold", isDark ? "text-slate-300" : "text-navy")}>Audit Notes / Narrative</Label>
              <Input
                id="notes"
                placeholder="e.g. Broken lens detected during quarterly shelf count"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className={cn("rounded-xl border-2 text-xs sm:text-sm", isDark ? "bg-slate-900/60 border-teal/20 text-white placeholder:text-slate-500" : "bg-slate-50 border-navy/20 text-navy placeholder:text-navy/40")}
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className={cn("rounded-xl font-bold", isDark ? "border-white/20 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl font-bold bg-[#000080] text-white hover:bg-[#000080]/90 shadow-md">
                {isSubmitting ? "Adjusting..." : "Post Adjustment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
