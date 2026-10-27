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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#000080] to-[#40E0D0] text-white shadow-lg shadow-[#000080]/20">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Stocktake & Inventory Adjustments</h1>
            <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
              Physical stock counting, inventory shrinkage write-downs, and automated GL cost adjustments
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
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#000080] text-white hover:bg-[#000080]/90 shadow-md shadow-[#000080]/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Stock Adjustment
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4">
            <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
              Adjustment Vouchers
            </span>
            <div className="mt-2 text-2xl font-bold">
              {totalAdjustmentsCount}
            </div>
            <p className="mt-1 text-xs text-slate-400">Total physical count audit entries</p>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4">
            <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
              Net Valuation Impact
            </span>
            <div className={cn("mt-2 text-2xl font-bold font-mono", totalValuationImpact <= 0 ? "text-rose-500" : "text-emerald-500")}>
              TZS {totalValuationImpact.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-slate-400">Inventory asset balance adjustment</p>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4">
            <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
              Shrinkage / Write-Downs
            </span>
            <div className="mt-2 text-2xl font-bold text-amber-500">
              {negativeAdjustments} Units
            </div>
            <p className="mt-1 text-xs text-amber-500 font-semibold">Tracked with GL journal audit</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className={cn("absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", isDark ? "text-slate-500" : "text-slate-400")} />
          <Input
            placeholder="Search adjustment number, item, reason..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={cn("pl-9", isDark ? "bg-[#0d0d12]/60 border-slate-800" : "bg-white border-slate-200")}
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={reasonFilter} onValueChange={setReasonFilter}>
            <SelectTrigger className={cn("w-[220px]", isDark ? "bg-[#0d0d12]/60 border-slate-800" : "bg-white border-slate-200")}>
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

      {/* Adjustments Table */}
      <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={cn("border-b text-xs uppercase font-semibold", isDark ? "border-slate-800 bg-slate-900/50 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-600")}>
              <tr>
                <th className="px-4 py-3">Adjustment #</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Warehouse Hub</th>
                <th className="px-4 py-3 text-center">Previous Qty</th>
                <th className="px-4 py-3 text-center">Adjustment</th>
                <th className="px-4 py-3 text-center">New Qty</th>
                <th className="px-4 py-3 text-right">Valuation Impact</th>
                <th className="px-4 py-3">Reason Code</th>
                <th className="px-4 py-3 text-right">Auditor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    No inventory adjustments found.
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map(adj => (
                  <tr key={adj.id} className={isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50"}>
                    <td className="px-4 py-3 font-mono font-semibold text-primary">
                      {adj.adjustment_number}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {adj.product_name}
                      {adj.notes && <div className="text-xs text-slate-400 font-normal">{adj.notes}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {adj.warehouse_name}
                    </td>
                    <td className="px-4 py-3 text-center font-mono">
                      {adj.previous_quantity}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold">
                      <span className={adj.quantity_adjusted < 0 ? "text-rose-500" : "text-emerald-500"}>
                        {adj.quantity_adjusted > 0 ? `+${adj.quantity_adjusted}` : adj.quantity_adjusted}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold">
                      {adj.new_quantity}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      <span className={adj.total_value_impact < 0 ? "text-rose-500" : "text-emerald-500"}>
                        TZS {adj.total_value_impact.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs font-normal border-slate-500/30">
                        {adj.reason}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500">
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
        <DialogContent className={cn("max-w-md", isDark ? "bg-[#0d0d12] border-slate-800 text-slate-100" : "bg-white border-slate-200")}>
          <DialogHeader>
            <DialogTitle>Perform Physical Stock Adjustment</DialogTitle>
            <DialogDescription className={isDark ? "text-slate-400" : "text-slate-500"}>
              Records stock variance, creates a movement record, and posts general ledger write-off journal.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="pName" className="text-xs">Product *</Label>
              <Input
                id="pName"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="wh" className="text-xs">Warehouse Location</Label>
              <Input
                id="wh"
                value={warehouseName}
                onChange={e => setWarehouseName(e.target.value)}
                className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="prevQty" className="text-xs">Current Book Stock</Label>
                <Input
                  id="prevQty"
                  type="number"
                  value={previousQty}
                  onChange={e => setPreviousQty(Number(e.target.value) || 0)}
                  className={isDark ? "bg-slate-900 border-slate-800 font-mono" : "border-slate-200 font-mono"}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="adjDelta" className="text-xs">Adjustment Delta (+/-) *</Label>
                <Input
                  id="adjDelta"
                  type="number"
                  value={quantityAdjusted}
                  onChange={e => setQuantityAdjusted(Number(e.target.value) || 0)}
                  className={cn(
                    "font-mono font-bold",
                    isDark ? "bg-slate-900 border-slate-800" : "border-slate-200",
                    quantityAdjusted < 0 ? "text-rose-500" : "text-emerald-500"
                  )}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cost" className="text-xs">Unit Cost (TZS)</Label>
                <Input
                  id="cost"
                  type="number"
                  value={unitCost}
                  onChange={e => setUnitCost(Number(e.target.value) || 0)}
                  className={isDark ? "bg-slate-900 border-slate-800 font-mono" : "border-slate-200 font-mono"}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">New Book Quantity</Label>
                <div className="h-9 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800 font-mono font-bold text-sm bg-slate-500/5">
                  {previousQty + quantityAdjusted} Units
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="reasonSelect" className="text-xs">Reason for Adjustment *</Label>
              <Select value={reason} onValueChange={(val: any) => setReason(val)}>
                <SelectTrigger className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}>
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
              <Label htmlFor="notes" className="text-xs">Audit Notes / Narrative</Label>
              <Input
                id="notes"
                placeholder="e.g. Broken lens detected during quarterly shelf count"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#000080] text-white hover:bg-[#000080]/90">
                {isSubmitting ? "Adjusting..." : "Post Adjustment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
