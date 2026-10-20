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
import { 
  getPurchaseOrders, 
  createPurchaseOrder, 
  updatePurchaseOrderStatus, 
  createGoodsReceipt,
  deletePurchaseOrder
} from "@/lib/purchase-actions"
import { getSuppliers } from "@/lib/supplier-actions"
import { getWarehouses } from "@/lib/inventory-actions"
import { getProducts } from "@/lib/product-actions"
import { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus, Supplier, Warehouse } from "@/lib/erp/types"
import { Product } from "@/types/database"
import {
  Truck,
  Plus,
  Search,
  RefreshCw,
  PackagePlus,
  CheckCircle2,
  Calendar,
  Building2,
  Boxes,
  Trash2,
  Clock,
  DollarSign,
  Eye,
  Package,
  AlertTriangle,
  Printer,
  Layers
} from "lucide-react"

export default function PurchaseOrdersPage() {
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Create PO Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedSupplierId, setSelectedSupplierId] = useState("")
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("")
  const [expectedDate, setExpectedDate] = useState("")
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([])
  const [poTaxRate, setPoTaxRate] = useState<number>(18)
  const [poDiscount, setPoDiscount] = useState<number>(0)
  const [poShipping, setPoShipping] = useState<number>(0)
  const [poNotes, setPoNotes] = useState("")

  // Goods Receiving (GRN) Modal State
  const [isGrnOpen, setIsGrnOpen] = useState(false)
  const [activeGrnPo, setActiveGrnPo] = useState<PurchaseOrder | null>(null)
  const [grnItems, setGrnItems] = useState<Array<{ productId: number; name: string; quantityReceived: number; unitCost: number }>>([])
  const [deliveryNote, setDeliveryNote] = useState("")
  const [carrier, setCarrier] = useState("")
  const [isReceiving, setIsReceiving] = useState(false)

  // View PO & Delete PO State
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null)
  const [isViewPoOpen, setIsViewPoOpen] = useState(false)
  const [poToDelete, setPoToDelete] = useState<PurchaseOrder | null>(null)
  const [isDeletingPo, setIsDeletingPo] = useState(false)

  const handleDeletePo = async () => {
    if (!poToDelete) return
    setIsDeletingPo(true)
    try {
      await deletePurchaseOrder(poToDelete.id)
      toast({
        title: "Purchase Order Deleted",
        description: `Successfully deleted PO #${poToDelete.po_number}.`
      })
      setPoToDelete(null)
      loadData()
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message || "Could not delete purchase order.",
        variant: "destructive"
      })
    } finally {
      setIsDeletingPo(false)
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [posList, supsList, whsList, prodsList] = await Promise.all([
        getPurchaseOrders(),
        getSuppliers(),
        getWarehouses(),
        getProducts()
      ])
      setPurchaseOrders(posList || [])
      setSuppliers(supsList || [])
      setWarehouses(whsList || [])
      setProducts(prodsList || [])
    } catch (err: any) {
      toast({ title: "Error Loading Purchases", description: err.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Add Item to new PO
  const handleAddProductToPo = (productId: number) => {
    const prod = products.find(p => p.id === productId)
    if (!prod) return
    const existingIdx = poItems.findIndex(i => i.product_id === prod.id)
    if (existingIdx !== -1) {
      const updated = [...poItems]
      updated[existingIdx].quantity += 1
      updated[existingIdx].total_cost = updated[existingIdx].quantity * updated[existingIdx].unit_cost
      setPoItems(updated)
    } else {
      const cost = Math.floor(prod.price * 0.7) // Default 70% estimated cost
      setPoItems([
        ...poItems,
        {
          id: `poi-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          product_id: prod.id,
          name: prod.name,
          quantity: 5,
          unit_cost: cost,
          total_cost: cost * 5
        }
      ])
    }
  }

  // Create PO
  const handleCreatePo = async () => {
    if (!selectedSupplierId || poItems.length === 0) {
      toast({ title: "Incomplete PO", description: "Select supplier and add at least one line item.", variant: "destructive" })
      return
    }

    const sup = suppliers.find(s => s.id === selectedSupplierId)
    const wh = warehouses.find(w => w.id === selectedWarehouseId) || warehouses[0]
    if (!sup) return

    setIsCreating(true)
    try {
      const subtotal = poItems.reduce((acc, it) => acc + it.total_cost, 0)
      const taxAmount = (subtotal * poTaxRate) / 100
      const total = subtotal + taxAmount + poShipping - poDiscount

      const created = await createPurchaseOrder({
        supplierId: sup.id,
        supplierName: sup.name,
        supplierEmail: sup.email,
        supplierPhone: sup.phone,
        warehouseId: wh?.id || "wh-dar-main",
        warehouseName: wh?.name || "Main Lab Warehouse",
        expectedDeliveryDate: expectedDate || undefined,
        items: poItems,
        taxRate: poTaxRate,
        discountAmount: poDiscount,
        shippingAmount: poShipping,
        notes: poNotes || undefined
      })

      toast({ title: "Purchase Order Issued", description: `Issued #${created.po_number} to ${sup.name}.` })
      setIsCreateOpen(false)
      setPoItems([])
      setPoNotes("")
      loadData()
    } catch (err: any) {
      toast({ title: "Failed to Issue PO", description: err.message, variant: "destructive" })
    } finally {
      setIsCreating(false)
    }
  }

  // Open Goods Receiving (GRN)
  const handleOpenGrn = (po: PurchaseOrder) => {
    setActiveGrnPo(po)
    setGrnItems(
      po.items.map(it => ({
        productId: it.product_id,
        name: it.name,
        quantityReceived: it.quantity - (it.received_quantity || 0),
        unitCost: it.unit_cost
      }))
    )
    setIsGrnOpen(true)
  }

  // Execute GRN
  const handleExecuteGrn = async () => {
    if (!activeGrnPo) return

    const totalQty = grnItems.reduce((acc, it) => acc + it.quantityReceived, 0)
    if (totalQty <= 0) {
      toast({ title: "Zero Quantity", description: "Specify delivered quantities greater than zero.", variant: "destructive" })
      return
    }

    setIsReceiving(true)
    try {
      await createGoodsReceipt({
        purchaseOrderId: activeGrnPo.id,
        warehouseId: activeGrnPo.warehouse_id,
        warehouseName: activeGrnPo.warehouse_name,
        receivedItems: grnItems.map(it => ({
          productId: it.productId,
          name: it.name,
          quantityReceived: it.quantityReceived,
          unitCost: it.unitCost
        })),
        deliveryNoteNumber: deliveryNote || undefined,
        carrierName: carrier || undefined,
        notes: "Verified physical receiving into inventory stock ledger"
      })

      toast({ title: "Goods Received & Stock Updated", description: `Successfully received ${totalQty} units into inventory.` })
      setIsGrnOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: "Receiving Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsReceiving(false)
    }
  }

  const getPoStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case "received":
        return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-bold uppercase">Fully Received</Badge>
      case "partially_received":
        return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] font-bold uppercase">Partially Received</Badge>
      case "confirmed":
        return <Badge className="bg-teal-500/15 text-teal-400 border-teal-500/30 text-[10px] font-bold uppercase">Confirmed</Badge>
      case "sent":
        return <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px] font-bold uppercase">Sent to Vendor</Badge>
      case "cancelled":
        return <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30 text-[10px] font-bold uppercase">Cancelled</Badge>
      default:
        return <Badge variant="outline" className="text-[10px] font-bold uppercase">{status}</Badge>
    }
  }

  const totalPoVolume = purchaseOrders.reduce((acc, po) => acc + (Number(po.total) || 0), 0)
  const receivedPos = purchaseOrders.filter(po => po.status === "received").length
  const pendingPos = purchaseOrders.filter(po => po.status === "sent" || po.status === "confirmed" || po.status === "partially_received").length

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

  const filteredOrders = purchaseOrders.filter(po => {
    if (statusFilter !== "all" && po.status !== statusFilter) return false
    if (searchQuery) {
      return (
        po.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return true
  })

  if (isLoading) return <AdminLoading />

  return (
    <div className="w-full space-y-6">
      {/* 1. Page Header Card in Teal */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 mb-6",
        isDark ? "bg-[#0a1033] border-none text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1">
              Purchase <span className={cn(isDark ? "text-teal-400" : "text-white", "drop-shadow-sm")}>Orders</span>
            </h1>
            <p className={cn("text-sm sm:text-base font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
              Manage vendor procurement cycles, goods receiving notes (GRN), and automated stock increments
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 ml-auto shrink-0 w-full sm:w-auto">
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 sm:h-11 px-4 sm:px-5 gap-2 shadow-lg transition-all active:scale-95 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Issue Purchase Order
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            title: "Total Purchase Orders",
            value: purchaseOrders.length.toString(),
            icon: Truck,
          },
          {
            title: "Pending Receiving",
            value: pendingPos.toString(),
            icon: Clock,
          },
          {
            title: "Fulfilled / Received",
            value: receivedPos.toString(),
            icon: CheckCircle2,
          },
          {
            title: "Procurement Outlay",
            value: formatStatCurrency(totalPoVolume),
            icon: DollarSign,
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
                  : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
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

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/50 dark:text-teal-400/80" />
          <Input
            placeholder="Search by PO number or supplier name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={cn(
              "pl-9 h-10 rounded-xl text-xs sm:text-sm font-medium border border-slate-300 dark:border-slate-600",
              isDark ? "bg-[#080d2a] text-white placeholder:text-slate-400" : "bg-white text-navy placeholder:text-navy/50"
            )}
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={cn(
              "h-10 rounded-xl text-xs font-bold w-44 border border-slate-300 dark:border-slate-600",
              isDark ? "bg-[#080d2a] text-white" : "bg-white text-navy"
            )}>
              <SelectValue placeholder="All PO Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All PO Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="partially_received">Partially Received</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={loadData} variant="outline" size="icon" className={cn("h-10 w-10 rounded-xl border-2 shrink-0", isDark ? "border-slate-700 text-teal-300 hover:bg-teal-400/15" : "border-navy/20 bg-white text-navy hover:bg-teal-50")}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 4. Purchase Orders Table */}
      <Card className={cn(
        "rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl",
        isDark ? "bg-[#0a1033] border-none shadow-lg" : "bg-white border-2 border-navy/20 shadow-md hover:border-navy"
      )}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                <th className="text-left py-3 px-3 md:px-4">PO #</th>
                <th className="text-left py-3 px-2 md:px-3">
                  <span className="hidden sm:inline">Supplier / Vendor</span>
                  <span className="sm:hidden">Supplier</span>
                </th>
                <th className="text-center py-3 px-2 md:px-3">
                  <span className="hidden md:inline">Items</span>
                  <span className="md:hidden">Qty</span>
                </th>
                <th className="text-right py-3 px-2 md:px-3">
                  <span className="hidden sm:inline">Order Total</span>
                  <span className="sm:hidden">Total</span>
                </th>
                <th className="text-center py-3 px-2 md:px-3">
                  <span className="hidden sm:inline">Status</span>
                  <span className="sm:hidden">Stat</span>
                </th>
                <th className="text-left py-3 px-2 md:px-3">Date</th>
                <th className="text-right py-3 px-3 md:px-4">
                  <span className="hidden sm:inline">Actions</span>
                  <span className="sm:hidden">Act</span>
                </th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-slate-100")}>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center font-semibold text-navy/60 dark:text-teal-400/80">
                    No purchase orders found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(po => (
                  <tr
                    key={po.id}
                    onClick={() => { setSelectedPo(po); setIsViewPoOpen(true); }}
                    className={cn(
                      "border-b transition-colors cursor-pointer group",
                      isDark ? "border-teal/10 hover:bg-teal/30 hover:text-white" : "border-navy/10 hover:bg-teal/50 hover:text-navy"
                    )}
                  >
                    <td className="py-2.5 sm:py-3 px-3 md:px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                          isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40"
                        )}>
                          <Truck className={cn("h-3.5 w-3.5", isDark ? "text-teal" : "text-navy")} />
                        </div>
                        <span className={cn("font-mono font-bold text-xs", isDark ? "text-teal-400" : "text-navy")}>
                          #{po.po_number}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 sm:py-3 px-2 md:px-3">
                      <p className={cn("text-xs font-bold truncate max-w-[130px]", isDark ? "text-white" : "text-navy")} title={po.supplier_name}>
                        {po.supplier_name}
                      </p>
                    </td>
                    <td className="py-2.5 sm:py-3 px-2 md:px-3 text-center whitespace-nowrap">
                      <Badge variant="outline" className={cn("text-[11px] font-mono font-bold border py-0 px-2", isDark ? "border-teal/40 bg-teal/10 text-teal-300" : "border-navy/20 bg-slate-50 text-navy")}>
                        {po.items?.length || 0} Items
                      </Badge>
                    </td>
                    <td className="py-2.5 sm:py-3 px-2 md:px-3 text-right font-mono font-black text-xs whitespace-nowrap">
                      TSH {Number(po.total).toLocaleString()}
                    </td>
                    <td className="py-2.5 sm:py-3 px-2 md:px-3 text-center whitespace-nowrap">
                      {getPoStatusBadge(po.status)}
                    </td>
                    <td className="py-2.5 sm:py-3 px-2 md:px-3 text-xs font-semibold whitespace-nowrap">
                      {po.order_date ? new Date(po.order_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—"}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 md:px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 sm:gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => { setSelectedPo(po); setIsViewPoOpen(true); }}
                          className={cn(
                            "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                            isDark ? "bg-navy border border-teal/40 text-teal hover:bg-teal hover:text-navy" : "bg-navy text-white hover:bg-navy/90"
                          )}
                          title="View Purchase Order Details"
                        >
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        {po.status !== "received" && po.status !== "cancelled" && (
                          <button
                            onClick={() => handleOpenGrn(po)}
                            className={cn(
                              "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                              isDark ? "bg-white/10 text-white hover:bg-white hover:text-navy" : "bg-navy/10 text-navy hover:bg-navy hover:text-white"
                            )}
                            title="Receive Goods (GRN)"
                          >
                            <PackagePlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setPoToDelete(po)}
                          className={cn(
                            "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                            isDark ? "bg-teal/15 text-white hover:bg-teal hover:text-navy" : "bg-red-50 text-brand-red hover:bg-red-500 hover:text-white"
                          )}
                          title="Delete Purchase Order"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </div>
        </Card>

      {/* 5. CREATE PO MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={cn(
          "max-w-3xl rounded-3xl max-h-[90vh] overflow-y-auto border-2",
          isDark ? "bg-[#0a1033] text-white border-teal/20" : "bg-white text-navy border-navy/20 shadow-2xl"
        )}>
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-navy dark:text-white">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border", isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40")}>
                <Truck className={cn("h-4 w-4", isDark ? "text-teal" : "text-navy")} />
              </div>
              Issue Purchase Order (PO)
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-400">
              Issue vendor purchase order with automatic inventory and tax calculations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                  Select Vendor / Supplier *
                </Label>
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger className={cn("h-11 rounded-xl text-sm font-medium border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy")}>
                    <SelectValue placeholder="Choose Supplier..." />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.payment_terms})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                  Receiving Warehouse *
                </Label>
                <Select value={selectedWarehouseId || warehouses[0]?.id} onValueChange={setSelectedWarehouseId}>
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

            {/* Add Products Section */}
            <div className={cn("p-4 rounded-2xl transition-all space-y-3", isDark ? "bg-teal/15 border border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy")}>
              <div className="flex items-center justify-between">
                <Label className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-teal-400" : "text-navy")}>Add Order Line Items</Label>
                <Select onValueChange={val => handleAddProductToPo(Number(val))}>
                  <SelectTrigger className="h-9 text-xs font-bold rounded-xl w-56 border-2 border-navy/20">
                    <SelectValue placeholder="+ Add Product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {poItems.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No products added yet. Select a product above.</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {poItems.map((it, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-3 sm:p-4 rounded-xl transition-all space-y-2.5",
                        isDark ? "bg-teal/15 border border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-navy/10 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Package className={cn("h-4 w-4 shrink-0", isDark ? "text-teal-400" : "text-navy")} />
                          <span className={cn("font-bold text-xs sm:text-sm truncate", isDark ? "text-white" : "text-navy")}>
                            {it.name}
                          </span>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))}
                          className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg shrink-0"
                          title="Remove Item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Quantity
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={e => {
                              const q = Math.max(1, parseInt(e.target.value) || 1)
                              const updated = [...poItems]
                              updated[idx].quantity = q
                              updated[idx].total_cost = q * updated[idx].unit_cost
                              setPoItems(updated)
                            }}
                            className={cn("h-9 text-xs font-mono font-bold rounded-lg border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white" : "bg-white text-navy")}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Unit Cost (TZS)
                          </Label>
                          <Input
                            type="number"
                            value={it.unit_cost}
                            onChange={e => {
                              const c = parseFloat(e.target.value) || 0
                              const updated = [...poItems]
                              updated[idx].unit_cost = c
                              updated[idx].total_cost = updated[idx].quantity * c
                              setPoItems(updated)
                            }}
                            className={cn("h-9 text-xs font-mono font-bold rounded-lg border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white" : "bg-white text-navy")}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Subtotal
                          </Label>
                          <div className={cn(
                            "h-9 px-3 rounded-lg flex items-center justify-between font-mono font-bold text-xs border",
                            isDark ? "bg-teal/15 border-teal/40 text-teal-300" : "bg-teal/15 border-2 border-navy text-navy"
                          )}>
                            <span className="text-[10px] uppercase font-bold opacity-75">TZS</span>
                            <span>{it.total_cost.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                Purchase Order Notes
              </Label>
              <Input
                placeholder="Delivery instructions, quotation cross-reference, payment milestones..."
                value={poNotes}
                onChange={e => setPoNotes(e.target.value)}
                className={cn("h-11 rounded-xl text-sm font-medium border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy")}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="h-11 rounded-xl px-5 font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePo}
              disabled={isCreating}
              className="h-11 rounded-xl px-6 bg-navy hover:bg-navy/90 text-white font-bold transition-all shadow-md active:scale-95"
            >
              {isCreating ? "Issuing..." : "Confirm & Issue PO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. GOODS RECEIPT (GRN) MODAL */}
      <Dialog open={isGrnOpen} onOpenChange={setIsGrnOpen}>
        <DialogContent className={cn(
          "max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto border-2",
          isDark ? "bg-[#0a1033] text-white border-teal/20" : "bg-white text-navy border-navy/20 shadow-2xl"
        )}>
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-navy dark:text-white">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border", isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40")}>
                <PackagePlus className={cn("h-4 w-4", isDark ? "text-teal" : "text-navy")} />
              </div>
              Goods Receiving Note (GRN) — #{activeGrnPo?.po_number}
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-400">
              Receiving delivered items increments active warehouse inventory stock immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-teal-400" : "text-navy")}>Verify Delivered Items</Label>
              {grnItems.map((it, idx) => (
                <div key={idx} className={cn("flex items-center justify-between gap-3 p-3.5 rounded-2xl transition-all text-xs", isDark ? "bg-teal/15 border border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy")}>
                  <div>
                    <p className={cn("font-bold text-sm", isDark ? "text-white" : "text-navy")}>{it.name}</p>
                    <p className="text-[11px] text-slate-400">Unit Cost: TZS {it.unitCost.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className={cn("text-xs font-bold", isDark ? "text-teal-400" : "text-navy")}>Delivered Qty:</Label>
                    <Input
                      type="number"
                      min="0"
                      value={it.quantityReceived}
                      onChange={e => {
                        const val = Math.max(0, parseInt(e.target.value) || 0)
                        const updated = [...grnItems]
                        updated[idx].quantityReceived = val
                        setGrnItems(updated)
                      }}
                      className={cn("w-20 h-9 text-sm font-mono font-black rounded-xl border-2 border-navy/20", isDark ? "bg-[#0a1033] border-slate-700 text-white" : "bg-white text-navy")}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                  Delivery Note / Waybill #
                </Label>
                <Input
                  placeholder="e.g. DN-992812"
                  value={deliveryNote}
                  onChange={e => setDeliveryNote(e.target.value)}
                  className={cn("h-11 rounded-xl text-sm font-medium border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                  Courier / Transporter
                </Label>
                <Input
                  placeholder="e.g. DHL / In-House Courier"
                  value={carrier}
                  onChange={e => setCarrier(e.target.value)}
                  className={cn("h-11 rounded-xl text-sm font-medium border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy")}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsGrnOpen(false)}
              className="h-11 rounded-xl px-5 font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExecuteGrn}
              disabled={isReceiving}
              className="h-11 rounded-xl px-6 bg-navy hover:bg-navy/90 text-white font-bold transition-all shadow-md active:scale-95"
            >
              {isReceiving ? "Receiving..." : "Accept & Increment Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. PURCHASE ORDER DETAILS MODAL (Item 01 & Item 03 Theme) */}
      <Dialog open={isViewPoOpen} onOpenChange={setIsViewPoOpen}>
        <DialogContent className={cn(
          "w-[95vw] sm:max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-7 rounded-2xl sm:rounded-3xl border-2 shadow-2xl",
          isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-slate-50 border-navy/20 text-navy"
        )}>
          <DialogHeader className="sr-only">
            <DialogTitle>Purchase Order #{selectedPo?.po_number || "Details"}</DialogTitle>
            <DialogDescription>Purchase order information and line item breakdown</DialogDescription>
          </DialogHeader>

          {selectedPo && (
            <div className="space-y-6">
              {/* Top Bar Header Navigation */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-navy/10 dark:border-teal/20 pb-4">
                <div className="flex items-center gap-4">
                  <img 
                    src="/turquoise.png" 
                    alt="QuardCubeLabs Logo" 
                    className="w-14 h-14 sm:w-16 sm:h-16 object-contain flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className={cn("text-xl sm:text-2xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
                        PO #{selectedPo.po_number}
                      </h2>
                      {getPoStatusBadge(selectedPo.status)}
                    </div>
                    <p className={cn("text-xs sm:text-sm font-medium mt-1", isDark ? "text-teal-400/80" : "text-navy/70")}>
                      Issued on {selectedPo.order_date ? new Date(selectedPo.order_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      {(selectedPo.expected_delivery_date || (selectedPo as any).expected_date) && ` • Expected: ${new Date(selectedPo.expected_delivery_date || (selectedPo as any).expected_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedPo.status !== "received" && selectedPo.status !== "cancelled" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsViewPoOpen(false)
                        handleOpenGrn(selectedPo)
                      }}
                      className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 h-9 px-3.5 text-xs"
                    >
                      <PackagePlus className="h-4 w-4 text-teal" />
                      Receive Goods
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.print()}
                    className={cn("font-bold rounded-xl shadow-xs flex items-center gap-1.5 h-9 px-3.5 text-xs border-2", isDark ? "border-teal/40 text-teal-300 hover:bg-teal/20" : "border-navy/20 text-navy hover:bg-slate-100")}
                  >
                    <Printer className="h-4 w-4" />
                    Print PO
                  </Button>
                </div>
              </div>

              {/* 2-Column Responsive Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left 2 Columns: Items & Scope */}
                <div className="lg:col-span-2 space-y-5">
                  <div className={cn(
                    "p-5 rounded-2xl transition-all space-y-4",
                    isDark ? "bg-teal/15 border border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
                  )}>
                    <div className="flex items-center justify-between border-b border-navy/10 dark:border-teal/20 pb-3">
                      <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider">
                        <Boxes className="h-4 w-4" />
                        <span>Ordered Line Items ({selectedPo.items?.length || 0})</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className={cn("border-b text-[10px] uppercase font-mono font-bold", isDark ? "border-teal/30 text-teal-300" : "border-navy/20 text-navy")}>
                            <th className="text-left py-2 px-2">Item</th>
                            <th className="text-center py-2 px-2">Qty</th>
                            <th className="text-right py-2 px-2">Unit Cost</th>
                            <th className="text-right py-2 px-2">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-navy/10 dark:divide-teal/20">
                          {selectedPo.items?.map((item, idx) => (
                            <tr key={idx} className="transition-colors hover:bg-teal/10">
                              <td className="py-2.5 px-2 font-bold">{item.name}</td>
                              <td className="py-2.5 px-2 text-center font-mono font-bold">{item.quantity}</td>
                              <td className="py-2.5 px-2 text-right font-mono">TZS {Number(item.unit_cost).toLocaleString()}</td>
                              <td className="py-2.5 px-2 text-right font-mono font-bold">TZS {Number(item.total_cost).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {selectedPo.notes && (
                    <div className={cn(
                      "p-5 rounded-2xl transition-all space-y-2",
                      isDark ? "bg-teal/15 border border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
                    )}>
                      <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Order Notes & Terms</span>
                      </h4>
                      <p className="text-xs leading-relaxed opacity-90">{selectedPo.notes}</p>
                    </div>
                  )}
                </div>

                {/* Right Column: Supplier, Warehouse & Totals Cards */}
                <div className="space-y-5">
                  <div className={cn(
                    "p-5 rounded-2xl transition-all space-y-3",
                    isDark ? "bg-teal/15 border border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
                  )}>
                    <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border-b border-navy/10 dark:border-teal/20 pb-2">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>Vendor / Supplier</span>
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      <p className="font-bold text-sm">{selectedPo.supplier_name}</p>
                      {selectedPo.supplier_email && (
                        <p className="opacity-80">Email: {selectedPo.supplier_email}</p>
                      )}
                      {selectedPo.supplier_phone && (
                        <p className="opacity-80">Phone: {selectedPo.supplier_phone}</p>
                      )}
                    </div>
                  </div>

                  <div className={cn(
                    "p-5 rounded-2xl transition-all space-y-3",
                    isDark ? "bg-teal/15 border border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
                  )}>
                    <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border-b border-navy/10 dark:border-teal/20 pb-2">
                      <Truck className="h-3.5 w-3.5" />
                      <span>Delivery Warehouse</span>
                    </h4>
                    <div className="space-y-1 text-xs">
                      <p className="font-bold">{selectedPo.warehouse_name || "Main Lab Warehouse"}</p>
                      <p className="opacity-80 text-[11px] font-mono">ID: {selectedPo.warehouse_id}</p>
                    </div>
                  </div>

                  <div className={cn(
                    "p-5 rounded-2xl transition-all space-y-3",
                    isDark ? "bg-teal/15 border border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
                  )}>
                    <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border-b border-navy/10 dark:border-teal/20 pb-2">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span>Financial Breakdown</span>
                    </h4>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="opacity-80">Subtotal:</span>
                        <span className="font-bold">TZS {Number(selectedPo.subtotal || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-80">Tax / VAT:</span>
                        <span className="font-bold">TZS {Number(selectedPo.tax_amount || (selectedPo as any).tax || 0).toLocaleString()}</span>
                      </div>
                      {Number(selectedPo.shipping_amount || (selectedPo as any).shipping || 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="opacity-80">Shipping:</span>
                          <span className="font-bold">TZS {Number(selectedPo.shipping_amount || (selectedPo as any).shipping).toLocaleString()}</span>
                        </div>
                      )}
                      {Number(selectedPo.discount_amount || (selectedPo as any).discount || 0) > 0 && (
                        <div className="flex justify-between text-emerald-500">
                          <span>Discount:</span>
                          <span className="font-bold">-TZS {Number(selectedPo.discount_amount || (selectedPo as any).discount).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-navy/20 dark:border-teal/40 pt-2 text-sm font-black">
                        <span className="uppercase">Grand Total:</span>
                        <span>TZS {Number(selectedPo.total || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 8. DELETE PO CONFIRMATION DIALOG */}
      <Dialog open={!!poToDelete} onOpenChange={(open) => !open && setPoToDelete(null)}>
        <DialogContent className={cn(
          "max-w-md rounded-3xl border-2 p-6 shadow-2xl",
          isDark ? "bg-[#0a1033] text-white border-teal/20" : "bg-white text-navy border-navy/20"
        )}>
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Purchase Order
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-400 mt-2">
              Are you sure you want to delete PO #{poToDelete?.po_number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPoToDelete(null)}
              className="h-10 rounded-xl px-4 font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeletePo}
              disabled={isDeletingPo}
              className="h-10 rounded-xl px-5 bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-md active:scale-95"
            >
              {isDeletingPo ? "Deleting..." : "Delete Purchase Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
