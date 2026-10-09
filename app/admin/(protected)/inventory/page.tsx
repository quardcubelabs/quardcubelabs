"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { 
  getInventoryOverview, 
  getStockMovements, 
  getWarehouses, 
  recordStockMovement, 
  transferStockBetweenWarehouses 
} from "@/lib/inventory-actions"
import { getProducts } from "@/lib/product-actions"
import { Product } from "@/types/database"
import { Warehouse, StockMovement, StockMovementType } from "@/lib/erp/types"
import {
  Boxes,
  PackageCheck,
  AlertTriangle,
  ArrowRightLeft,
  SlidersHorizontal,
  History,
  Search,
  RefreshCw,
  Plus,
  CheckCircle2,
  DollarSign
} from "lucide-react"

export default function InventoryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [activeTab, setActiveTab] = useState<"stock" | "movements">("stock")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState("all")
  const [movementTypeFilter, setMovementTypeFilter] = useState("all")

  // Overview metrics
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalStockUnits, setTotalStockUnits] = useState(0)
  const [totalStockValue, setTotalStockValue] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [outOfStockCount, setOutOfStockCount] = useState(0)

  // Transfer Modal State
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)
  const [transferProductId, setTransferProductId] = useState<number | null>(null)
  const [transferSourceWh, setTransferSourceWh] = useState("")
  const [transferDestWh, setTransferDestWh] = useState("")
  const [transferQty, setTransferQty] = useState<number>(1)
  const [transferReason, setTransferReason] = useState("")

  // Adjustment Modal State
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [adjustProductId, setAdjustProductId] = useState<number | null>(null)
  const [adjustType, setAdjustType] = useState<StockMovementType>("manual_adjustment")
  const [adjustWh, setAdjustWh] = useState("")
  const [adjustQty, setAdjustQty] = useState<number>(0)
  const [adjustReason, setAdjustReason] = useState("")

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [overview, prodsList, whList, movList] = await Promise.all([
        getInventoryOverview(),
        getProducts(),
        getWarehouses(),
        getStockMovements({ limit: 50 })
      ])

      setTotalProducts(overview.totalProducts)
      setTotalStockUnits(overview.totalStockUnits)
      setTotalStockValue(overview.totalStockValue)
      setLowStockCount(overview.lowStockCount)
      setOutOfStockCount(overview.outOfStockCount)

      setProducts(prodsList || [])
      setWarehouses(whList || [])
      setMovements(movList || [])
    } catch (err: any) {
      toast({ title: "Error Loading Inventory", description: err.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Handle Transfer
  const handleExecuteTransfer = async () => {
    if (!transferProductId || !transferSourceWh || !transferDestWh || transferQty <= 0) {
      toast({ title: "Invalid Input", description: "Select product, source, destination, and valid quantity.", variant: "destructive" })
      return
    }

    const prod = products.find(p => p.id === transferProductId)
    if (!prod) return

    setIsTransferring(true)
    try {
      await transferStockBetweenWarehouses({
        productId: prod.id,
        productName: prod.name,
        sourceWarehouseId: transferSourceWh,
        destinationWarehouseId: transferDestWh,
        quantity: transferQty,
        reason: transferReason || "Standard Warehouse Rebalancing"
      })

      toast({ title: "Stock Transferred", description: `Successfully moved ${transferQty} units of ${prod.name}.` })
      setIsTransferOpen(false)
      setTransferReason("")
      loadData()
    } catch (err: any) {
      toast({ title: "Transfer Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsTransferring(false)
    }
  }

  // Handle Adjustment
  const handleExecuteAdjustment = async () => {
    if (!adjustProductId || adjustQty === 0) {
      toast({ title: "Invalid Input", description: "Select product and enter non-zero adjustment quantity.", variant: "destructive" })
      return
    }

    const prod = products.find(p => p.id === adjustProductId)
    if (!prod) return

    setIsAdjusting(true)
    try {
      await recordStockMovement({
        productId: prod.id,
        productName: prod.name,
        warehouseId: adjustWh || warehouses[0]?.id || "wh-dar-main",
        movementType: adjustType,
        quantity: adjustQty,
        reason: adjustReason || "Audited Manual Adjustment",
        performedBy: "Administrator"
      })

      toast({ title: "Stock Adjusted", description: `Updated ${prod.name} by ${adjustQty > 0 ? "+" : ""}${adjustQty} units.` })
      setIsAdjustOpen(false)
      setAdjustReason("")
      loadData()
    } catch (err: any) {
      toast({ title: "Adjustment Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsAdjusting(false)
    }
  }

  const formatStatNumber = (num: number) => {
    const n = Number(num) || 0
    if (n >= 1_000_000) {
      const millions = n / 1_000_000
      return millions % 1 === 0 ? `${millions.toFixed(0)}M` : `${millions.toFixed(1)}M`
    }
    if (n >= 1_000) {
      const thousands = n / 1_000
      return thousands % 1 === 0 ? `${thousands.toFixed(0)}K` : `${thousands.toFixed(1)}K`
    }
    return n.toLocaleString()
  }

  const formatStatCurrency = (num: number) => {
    const n = Number(num) || 0
    if (n >= 1_000_000) {
      const millions = n / 1_000_000
      const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)
      return `TSH ${formatted}M`
    }
    if (n >= 1_000) {
      const thousands = n / 1_000
      const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)
      return `TSH ${formatted}K`
    }
    return `TSH ${n.toLocaleString()}`
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false
    if (selectedWarehouseFilter === "low_stock") return (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= 5
    if (selectedWarehouseFilter === "out_of_stock") return (Number(p.stock) || 0) === 0
    return true
  })

  const filteredMovements = movements.filter(m => {
    if (movementTypeFilter !== "all" && m.movement_type !== movementTypeFilter) return false
    if (searchQuery) {
      return (
        m.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.movement_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.reason && m.reason.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }
    return true
  })

  const getMovementBadge = (type: StockMovementType) => {
    switch (type) {
      case "purchase_received":
      case "transfer_in":
      case "sales_return":
        return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-bold uppercase">{type.replace(/_/g, " ")}</Badge>
      case "sales_deduction":
      case "transfer_out":
      case "purchase_return":
        return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] font-bold uppercase">{type.replace(/_/g, " ")}</Badge>
      case "damage_loss":
        return <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30 text-[10px] font-bold uppercase">Damage / Loss</Badge>
      default:
        return <Badge variant="outline" className="text-[10px] font-bold uppercase">{type.replace(/_/g, " ")}</Badge>
    }
  }

  if (isLoading) return <AdminLoading />

  return (
    <div className="w-full space-y-6">
      {/* 1. Header Banner */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 mb-6",
        isDark ? "bg-[#0a1033] border-none text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1">
              Inventory <span className={cn(isDark ? "text-teal-400" : "text-white", "drop-shadow-sm")}>& Stock</span>
            </h1>
            <p className={cn("text-sm sm:text-base font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
              Live stock valuation, auditable movements ledger, reorder monitoring, and multi-warehouse transfers
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                if (warehouses.length >= 2) {
                  setTransferSourceWh(warehouses[0].id)
                  setTransferDestWh(warehouses[1].id)
                }
                setIsTransferOpen(true)
              }}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 sm:h-11 px-4 gap-2 shadow-lg transition-all active:scale-95"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Stock Transfer
            </Button>
            <Button
              onClick={() => setIsAdjustOpen(true)}
              className="bg-white hover:bg-teal-50 text-navy font-bold rounded-xl h-10 sm:h-11 px-4 gap-2 shadow-lg transition-all active:scale-95 border-2 border-navy/20"
            >
              <SlidersHorizontal className="h-4 w-4 text-navy" />
              Adjust Stock
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          {
            title: "Total SKUs",
            value: totalProducts.toString(),
            icon: Boxes,
          },
          {
            title: "Stock Units",
            value: formatStatNumber(totalStockUnits),
            icon: PackageCheck,
          },
          {
            title: "Stock Value",
            value: formatStatCurrency(totalStockValue),
            icon: DollarSign,
          },
          {
            title: "Low Stock Alert",
            value: lowStockCount.toString(),
            icon: AlertTriangle,
          },
          {
            title: "Out of Stock",
            value: outOfStockCount.toString(),
            icon: AlertTriangle,
          }
        ].map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card
              key={idx}
              className={cn(
                "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
                isDark 
                  ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]" 
                  : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md",
                idx === 4 ? "col-span-2 lg:col-span-1" : ""
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
                  <Icon className={cn("h-5 w-5 shrink-0", isDark ? "text-teal" : "")} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 3. Navigation Tabs & Connected Content Container */}
      <div className="space-y-0 relative">
        <div className="relative z-10 flex items-end gap-1.5 overflow-x-auto pb-0 w-full px-0 -mb-[2px]">
          <button
            onClick={() => setActiveTab("stock")}
            className={cn(
              "relative inline-flex items-center justify-center gap-2 whitespace-nowrap px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer",
              activeTab === "stock"
                ? "rounded-tl-2xl sm:rounded-tl-3xl rounded-tr-xl sm:rounded-tr-2xl"
                : "rounded-t-xl sm:rounded-t-2xl",
              activeTab === "stock"
                ? cn(
                    "font-black border-2 border-b-0 border-navy/20 dark:border-teal/30 z-20 shadow-none",
                    isDark ? "bg-[#0c1833] text-teal" : "bg-[#e6f7f5] text-navy"
                  )
                : "bg-transparent text-navy/70 hover:text-navy dark:text-slate-400 dark:hover:text-white border-0 hover:bg-teal-500/10 z-0"
            )}
          >
            {activeTab === "stock" && (
              <>
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
            <PackageCheck className={cn("h-4 w-4 shrink-0 relative z-40", activeTab === "stock" ? "text-navy dark:text-teal" : "text-navy/60 dark:text-slate-400")} />
            <span className="relative z-40">Stock Levels</span>
            <span className={cn(
              "text-[11px] px-2 py-0.5 rounded-full font-bold ml-1 relative z-40 transition-colors",
              activeTab === "stock" 
                ? isDark ? "bg-teal text-navy font-black" : "bg-navy text-white font-bold"
                : isDark ? "bg-teal/20 text-teal" : "bg-teal-100/80 text-navy"
            )}>
              {products.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("movements")}
            className={cn(
              "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-t-xl sm:rounded-t-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer",
              activeTab === "movements"
                ? cn(
                    "font-black border-2 border-b-0 border-navy/20 dark:border-teal/30 z-20 shadow-none",
                    isDark ? "bg-[#0c1833] text-teal" : "bg-[#e6f7f5] text-navy"
                  )
                : "bg-transparent text-navy/70 hover:text-navy dark:text-slate-400 dark:hover:text-white border-0 hover:bg-teal-500/10 z-0"
            )}
          >
            {activeTab === "movements" && (
              <>
                <span className="absolute -bottom-[2px] -left-[12px] w-[12px] h-[12px] overflow-hidden pointer-events-none z-20">
                  <svg className="w-[12px] h-[12px]" viewBox="0 0 12 12" fill="none">
                    <path d="M12 0C12 6.627 6.627 12 0 12H12V0Z" fill={isDark ? "#0c1833" : "#e6f7f5"} />
                    <path d="M0 12C6.627 12 12 6.627 12 0" stroke="currentColor" strokeWidth="2" className="text-navy/20 dark:text-teal/30" />
                  </svg>
                </span>
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
            <History className={cn("h-4 w-4 shrink-0 relative z-40", activeTab === "movements" ? "text-navy dark:text-teal" : "text-navy/60 dark:text-slate-400")} />
            <span className="relative z-40">Movements Ledger</span>
            <span className={cn(
              "text-[11px] px-2 py-0.5 rounded-full font-bold ml-1 relative z-40 transition-colors",
              activeTab === "movements" 
                ? isDark ? "bg-teal text-navy font-black" : "bg-navy text-white font-bold"
                : isDark ? "bg-teal/20 text-teal" : "bg-teal-100/80 text-navy"
            )}>
              {movements.length}
            </span>
          </button>
        </div>

        {/* Content Container with 4-Corner Rounded Border */}
        <div className={cn(
          "border-2 border-navy/20 dark:border-teal/30 p-4 sm:p-5 shadow-sm space-y-4 relative z-0",
          activeTab === "stock"
            ? "rounded-b-2xl sm:rounded-b-3xl rounded-tr-2xl sm:rounded-tr-3xl rounded-tl-none" 
            : "rounded-2xl sm:rounded-3xl",
          isDark ? "bg-[#0c1833]" : "bg-[#e6f7f5]"
        )}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/50 dark:text-teal-400/80" />
              <Input
                placeholder={activeTab === "stock" ? "Search product or category..." : "Search movements ledger..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-9 h-10 rounded-xl text-xs sm:text-sm font-medium border-2 border-navy/20 focus:border-navy",
                  isDark ? "bg-[#080d2a] text-white placeholder:text-slate-400 border-slate-700" : "bg-white text-navy placeholder:text-navy/50"
                )}
              />
            </div>

            {activeTab === "stock" ? (
              <Select value={selectedWarehouseFilter} onValueChange={setSelectedWarehouseFilter}>
                <SelectTrigger className={cn(
                  "h-10 rounded-xl text-xs font-bold w-44 border-2 border-navy/20",
                  isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy"
                )}>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="low_stock">Low Stock (≤ 5)</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock (0)</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
                <SelectTrigger className={cn(
                  "h-10 rounded-xl text-xs font-bold w-44 border-2 border-navy/20",
                  isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy"
                )}>
                  <SelectValue placeholder="All Movement Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="purchase_received">Purchase Received</SelectItem>
                  <SelectItem value="sales_deduction">Sales Deduction</SelectItem>
                  <SelectItem value="transfer_out">Transfer Out</SelectItem>
                  <SelectItem value="transfer_in">Transfer In</SelectItem>
                  <SelectItem value="manual_adjustment">Manual Adjustment</SelectItem>
                  <SelectItem value="damage_loss">Damage & Loss</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Button onClick={loadData} variant="outline" size="icon" className={cn("h-10 w-10 rounded-xl border-2 shrink-0", isDark ? "border-slate-700 text-teal-300 hover:bg-teal-400/15" : "border-navy/20 bg-white text-navy hover:bg-teal-50")}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

      {/* 4. Tab 1: Current Stock Table */}
      {activeTab === "stock" && (
        <Card className={cn(
          "rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl",
          isDark ? "bg-[#0a1033] border-none shadow-lg" : "bg-white border-2 border-navy/20 shadow-md hover:border-navy"
        )}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                  <th className="text-left py-3.5 px-4 md:px-6"><span className="hidden sm:inline">Product Name</span><span className="sm:hidden">Product</span></th>
                  <th className="text-left py-3.5 px-3 md:px-4"><span className="hidden sm:inline">Category</span><span className="sm:hidden">Cat.</span></th>
                  <th className="text-right py-3.5 px-3 md:px-4"><span className="hidden sm:inline">Selling Price</span><span className="sm:hidden">Price</span></th>
                  <th className="text-center py-3.5 px-3 md:px-4"><span className="hidden sm:inline">Available Stock</span><span className="sm:hidden">Stock</span></th>
                  <th className="text-left py-3.5 px-3 md:px-4"><span className="hidden sm:inline">Stock Status</span><span className="sm:hidden">Stat</span></th>
                  <th className="text-right py-3.5 px-4 md:px-6"><span className="hidden sm:inline">Quick Actions</span><span className="sm:hidden">Act</span></th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-slate-100")}>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center font-semibold text-navy/60 dark:text-teal-400/80">
                      No stock items found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(p => {
                    const stock = Number(p.stock) || 0
                    return (
                      <tr
                        key={p.id}
                        className={cn(
                          "border-b transition-colors cursor-pointer group",
                          isDark ? "border-teal/10 hover:bg-teal/30 hover:text-white" : "border-navy/10 hover:bg-teal/50 hover:text-navy"
                        )}
                      >
                        <td className="py-3.5 md:py-4 px-4 md:px-6 font-bold flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-navy/10 flex items-center justify-center shrink-0 border border-navy/20 p-1">
                            <img src={p.image || "/placeholder.jpg"} alt={p.name} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <p className={cn("text-xs sm:text-sm font-black", isDark ? "text-white" : "text-navy")}>{p.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">SKU: QCL-PRD-{p.id.toString().padStart(4, "0")}</p>
                          </div>
                        </td>
                        <td className="py-3.5 md:py-4 px-3 md:px-4 whitespace-nowrap">
                          <Badge variant="outline" className={cn("text-xs font-semibold border", isDark ? "border-teal/40 bg-teal/10 text-teal-300" : "border-navy/20 bg-slate-50 text-navy font-bold")}>{p.category}</Badge>
                        </td>
                        <td className="py-3.5 md:py-4 px-3 md:px-4 text-right font-mono font-black text-xs sm:text-sm whitespace-nowrap">
                          TSH {Number(p.price).toLocaleString()}
                        </td>
                        <td className="py-3.5 md:py-4 px-3 md:px-4 text-center whitespace-nowrap">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-black font-mono inline-block",
                            stock === 0 ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : stock <= 5 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          )}>
                            {stock} Units
                          </span>
                        </td>
                        <td className="py-3.5 md:py-4 px-3 md:px-4 whitespace-nowrap">
                          {stock === 0 ? (
                            <span className="text-xs font-bold text-rose-500 flex items-center gap-1">
                              <AlertTriangle className="h-3.5 w-3.5" /> Out of Stock
                            </span>
                          ) : stock <= 5 ? (
                            <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                              <AlertTriangle className="h-3.5 w-3.5" /> Low Stock
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Healthy
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 md:py-4 px-4 md:px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setAdjustProductId(p.id)
                                setAdjustQty(0)
                                setIsAdjustOpen(true)
                              }}
                              className="h-8 px-2.5 text-xs font-bold rounded-xl border-2 border-navy/20 hover:border-navy text-navy"
                            >
                              Adjust
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setTransferProductId(p.id)
                                if (warehouses.length >= 2) {
                                  setTransferSourceWh(warehouses[0].id)
                                  setTransferDestWh(warehouses[1].id)
                                }
                                setIsTransferOpen(true)
                              }}
                              className="h-8 px-2.5 text-xs font-bold bg-navy text-white hover:bg-navy/90 rounded-xl"
                            >
                              Transfer
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 5. Tab 2: Stock Movements Auditable Ledger */}
      {activeTab === "movements" && (
        <Card className={cn(
          "rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl",
          isDark ? "bg-[#0a1033] border-none shadow-lg" : "bg-white border-2 border-navy/20 shadow-md hover:border-navy"
        )}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                  <th className="text-left py-3.5 px-4 md:px-6"><span className="hidden sm:inline">Movement #</span><span className="sm:hidden">Mov #</span></th>
                  <th className="text-left py-3.5 px-3 md:px-4"><span className="hidden sm:inline">Product Name</span><span className="sm:hidden">Product</span></th>
                  <th className="text-left py-3.5 px-3 md:px-4"><span className="hidden sm:inline">Type</span><span className="sm:hidden">Type</span></th>
                  <th className="text-center py-3.5 px-3 md:px-4"><span className="hidden sm:inline">Qty Change</span><span className="sm:hidden">Qty</span></th>
                  <th className="text-center py-3.5 px-3 md:px-4"><span className="hidden sm:inline">Balance (Prev → New)</span><span className="sm:hidden">Balance</span></th>
                  <th className="text-left py-3.5 px-3 md:px-4"><span className="hidden sm:inline">Reason / Reference</span><span className="sm:hidden">Ref</span></th>
                  <th className="text-left py-3.5 px-4 md:px-6"><span className="hidden sm:inline">Date & Time</span><span className="sm:hidden">Date</span></th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-slate-100")}>
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center font-semibold text-navy/60 dark:text-teal-400/80">
                      No stock movement audit records found.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map(m => (
                    <tr
                      key={m.id}
                      className={cn(
                        "border-b transition-colors cursor-pointer group",
                        isDark ? "border-teal/10 hover:bg-teal/30 hover:text-white" : "border-navy/10 hover:bg-teal/50 hover:text-navy"
                      )}
                    >
                      <td className={cn("py-3.5 md:py-4 px-4 md:px-6 font-mono text-xs font-bold whitespace-nowrap", isDark ? "text-teal-400" : "text-navy")}>
                        #{m.movement_number}
                      </td>
                      <td className="py-3.5 md:py-4 px-3 md:px-4 font-bold">
                        <p className={cn("text-xs sm:text-sm", isDark ? "text-white" : "text-navy")}>{m.product_name}</p>
                      </td>
                      <td className="py-3.5 md:py-4 px-3 md:px-4 whitespace-nowrap">
                        {getMovementBadge(m.movement_type)}
                      </td>
                      <td className="py-3.5 md:py-4 px-3 md:px-4 text-center font-mono font-black text-xs sm:text-sm whitespace-nowrap">
                        <span className={m.quantity >= 0 ? "text-emerald-500" : "text-rose-500"}>
                          {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                        </span>
                      </td>
                      <td className="py-3.5 md:py-4 px-3 md:px-4 text-center font-mono text-xs font-bold text-slate-400 whitespace-nowrap">
                        {m.previous_quantity} ➔ <span className={cn(isDark ? "text-white" : "text-navy")}>{m.new_quantity}</span>
                      </td>
                      <td className="py-3.5 md:py-4 px-3 md:px-4 text-xs font-medium">
                        <p className="font-semibold">{m.reason || "—"}</p>
                        {m.reference_number && <p className={cn("text-[10.5px] font-mono", isDark ? "text-teal-400" : "text-navy/70")}>Ref: {m.reference_number}</p>}
                      </td>
                      <td className="py-3.5 md:py-4 px-4 md:px-6 text-xs text-slate-400 font-mono whitespace-nowrap">
                        {new Date(m.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      </div>
      </div>

      {/* 6. MODAL 1: STOCK TRANSFER BETWEEN WAREHOUSES */}
      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent className={cn(
          "max-w-xl rounded-3xl max-h-[90vh] overflow-y-auto border-2",
          isDark ? "bg-[#0a1033] text-white border-teal/20" : "bg-white text-navy border-navy/20 shadow-2xl"
        )}>
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-navy dark:text-white">
              <ArrowRightLeft className="h-5 w-5 text-navy dark:text-teal-400" />
              Warehouse Stock Transfer
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-400">
              Move authenticated product inventory between physical hubs and branch locations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                Select Product *
              </Label>
              <Select value={transferProductId ? String(transferProductId) : ""} onValueChange={val => setTransferProductId(Number(val))}>
                <SelectTrigger className={cn("h-11 rounded-xl text-sm font-medium border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy")}>
                  <SelectValue placeholder="Choose product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} (Stock: {p.stock} units)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                  Source Warehouse *
                </Label>
                <Select value={transferSourceWh} onValueChange={setTransferSourceWh}>
                  <SelectTrigger className={cn("h-11 rounded-xl text-sm font-medium border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy")}>
                    <SelectValue placeholder="Source..." />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                  Destination Warehouse *
                </Label>
                <Select value={transferDestWh} onValueChange={setTransferDestWh}>
                  <SelectTrigger className={cn("h-11 rounded-xl text-sm font-medium border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy")}>
                    <SelectValue placeholder="Destination..." />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                Transfer Quantity *
              </Label>
              <Input
                type="number"
                min="1"
                value={transferQty}
                onChange={e => setTransferQty(Math.max(1, parseInt(e.target.value) || 1))}
                className={cn("h-11 rounded-xl text-sm font-mono font-bold border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy")}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                Transfer Notes / Reason
              </Label>
              <Input
                placeholder="e.g. Showroom restocking or client allocation"
                value={transferReason}
                onChange={e => setTransferReason(e.target.value)}
                className={cn("h-11 rounded-xl text-sm font-medium border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy")}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTransferOpen(false)}
              className="h-11 rounded-xl px-5 font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExecuteTransfer}
              disabled={isTransferring}
              className="h-11 rounded-xl px-6 bg-navy hover:bg-navy/90 text-white font-bold transition-all shadow-md active:scale-95"
            >
              {isTransferring ? "Transferring..." : "Execute Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. MODAL 2: MANUAL STOCK ADJUSTMENT */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className={cn(
          "max-w-xl rounded-3xl max-h-[90vh] overflow-y-auto border-2",
          isDark ? "bg-[#0a1033] text-white border-teal/20" : "bg-white text-navy border-navy/20 shadow-2xl"
        )}>
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-navy dark:text-white">
              <SlidersHorizontal className="h-5 w-5 text-navy dark:text-teal-400" />
              Manual Stock Adjustment
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-400">
              Audited quantity adjustment with mandatory business reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                Select Product *
              </Label>
              <Select value={adjustProductId ? String(adjustProductId) : ""} onValueChange={val => setAdjustProductId(Number(val))}>
                <SelectTrigger className={cn("h-11 rounded-xl text-sm font-medium border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy")}>
                  <SelectValue placeholder="Choose product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} (Current Stock: {p.stock} units)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                  Adjustment Type
                </Label>
                <Select value={adjustType} onValueChange={(val: any) => setAdjustType(val)}>
                  <SelectTrigger className={cn("h-11 rounded-xl text-sm font-medium border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual_adjustment">Manual Adjustment</SelectItem>
                    <SelectItem value="opening_stock">Opening Stock Count</SelectItem>
                    <SelectItem value="damage_loss">Damaged / Lost Stock</SelectItem>
                    <SelectItem value="audit_correction">Audit Physical Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                  Warehouse
                </Label>
                <Select value={adjustWh || warehouses[0]?.id} onValueChange={setAdjustWh}>
                  <SelectTrigger className={cn("h-11 rounded-xl text-sm font-medium border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                Quantity Change (+ to add, - to subtract) *
              </Label>
              <Input
                type="number"
                value={adjustQty}
                onChange={e => setAdjustQty(parseInt(e.target.value) || 0)}
                className={cn("h-11 rounded-xl text-sm font-mono font-bold border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy")}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                Reason *
              </Label>
              <Input
                placeholder="e.g. Physical inventory count discrepancy resolved"
                value={adjustReason}
                onChange={e => setAdjustReason(e.target.value)}
                className={cn("h-11 rounded-xl text-sm font-medium border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy")}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAdjustOpen(false)}
              className="h-11 rounded-xl px-5 font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExecuteAdjustment}
              disabled={isAdjusting}
              className="h-11 rounded-xl px-6 bg-navy hover:bg-navy/90 text-white font-bold transition-all shadow-md active:scale-95"
            >
              {isAdjusting ? "Applying..." : "Save Stock Adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
