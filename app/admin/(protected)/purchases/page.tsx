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
  createGoodsReceipt 
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
  DollarSign
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
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1">
              Purchase <span className={cn(isDark ? "text-teal-400" : "text-white", "drop-shadow-sm")}>Orders</span>
            </h1>
            <p className={cn("text-sm sm:text-base font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
              Manage vendor procurement cycles, goods receiving notes (GRN), and automated stock increments
            </p>
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 sm:h-11 px-4 sm:px-5 gap-2 shadow-lg transition-all active:scale-95 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Issue Purchase Order
          </Button>
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
              "pl-9 h-10 rounded-xl text-xs sm:text-sm font-medium border-2 border-navy/20 focus:border-navy",
              isDark ? "bg-[#080d2a] text-white placeholder:text-slate-400 border-slate-700" : "bg-white text-navy placeholder:text-navy/50"
            )}
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={cn(
              "h-10 rounded-xl text-xs font-bold w-44 border-2 border-navy/20",
              isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy"
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                <th className="text-left py-3.5 px-4 md:px-6">PO #</th>
                <th className="text-left py-3.5 px-3 md:px-4">
                  <span className="hidden sm:inline">Supplier / Vendor</span>
                  <span className="sm:hidden">Supplier</span>
                </th>
                <th className="text-center py-3.5 px-3 md:px-4">
                  <span className="hidden md:inline">Items</span>
                  <span className="md:hidden">Qty</span>
                </th>
                <th className="text-right py-3.5 px-3 md:px-4">
                  <span className="hidden sm:inline">Order Total</span>
                  <span className="sm:hidden">Total</span>
                </th>
                <th className="text-center py-3.5 px-3 md:px-4">
                  <span className="hidden sm:inline">Status</span>
                  <span className="sm:hidden">Stat</span>
                </th>
                <th className="text-left py-3.5 px-3 md:px-4">Date</th>
                <th className="text-right py-3.5 px-4 md:px-6">
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
                    className={cn(
                      "border-b transition-colors cursor-pointer group",
                      isDark ? "border-teal/10 hover:bg-teal/30 hover:text-white" : "border-navy/10 hover:bg-teal/50 hover:text-navy"
                    )}
                  >
                    <td className={cn("py-3.5 md:py-4 px-4 md:px-6 font-mono font-bold text-xs whitespace-nowrap", isDark ? "text-teal-400" : "text-navy")}>
                      #{po.po_number}
                    </td>
                      <td className="py-3.5 md:py-4 px-3 md:px-4">
                        <p className={cn("text-sm font-black", isDark ? "text-white" : "text-navy")}>{po.supplier_name}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{po.warehouse_name}</p>
                      </td>
                      <td className="py-3.5 md:py-4 px-3 md:px-4 text-center whitespace-nowrap">
                        <Badge variant="outline" className={cn("text-xs font-mono font-bold border", isDark ? "border-teal/40 bg-teal/10 text-teal-300" : "border-navy/20 bg-slate-50 text-navy")}>
                          {po.items?.length || 0} Products
                        </Badge>
                      </td>
                      <td className="py-3.5 md:py-4 px-3 md:px-4 text-right font-mono font-black text-sm whitespace-nowrap">
                        TSH {Number(po.total).toLocaleString()}
                      </td>
                      <td className="py-3.5 md:py-4 px-3 md:px-4 text-center whitespace-nowrap">
                        {getPoStatusBadge(po.status)}
                      </td>
                      <td className="py-3.5 md:py-4 px-3 md:px-4 text-xs font-semibold whitespace-nowrap">
                        {po.order_date ? new Date(po.order_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3.5 md:py-4 px-4 md:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {po.status !== "received" && po.status !== "cancelled" && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenGrn(po)}
                              className="h-8 px-3 text-xs font-bold bg-navy text-white hover:bg-navy/90 rounded-xl gap-1.5 shadow-sm active:scale-95"
                            >
                              <PackagePlus className="h-3.5 w-3.5" />
                              Receive Goods
                            </Button>
                          )}
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
              <Truck className="h-5 w-5 text-navy dark:text-teal-400" />
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
            <div className={cn("p-4 rounded-2xl border-2 space-y-3", isDark ? "bg-[#080d2a] border-slate-700" : "bg-slate-50 border-navy/15")}>
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
                <div className="space-y-2">
                  {poItems.map((it, idx) => (
                    <div key={idx} className={cn("flex items-center justify-between gap-3 p-3 rounded-xl border-2 text-xs", isDark ? "bg-[#0a1033] border-slate-700" : "bg-white border-navy/15")}>
                      <span className="font-bold truncate flex-1">{it.name}</span>
                      <div className="flex items-center gap-2">
                        <Label className="text-[10px] font-bold">Qty:</Label>
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
                          className="w-16 h-8 text-xs font-mono font-bold rounded-lg border-2 border-navy/20"
                        />
                        <Label className="text-[10px] font-bold">Cost (TZS):</Label>
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
                          className="w-28 h-8 text-xs font-mono font-bold rounded-lg border-2 border-navy/20"
                        />
                        <span className="font-mono font-bold w-24 text-right">
                          TZS {it.total_cost.toLocaleString()}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))}
                          className="h-8 w-8 text-rose-500 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
              <PackagePlus className="h-5 w-5 text-navy dark:text-teal-400" />
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
                <div key={idx} className={cn("flex items-center justify-between gap-3 p-3.5 rounded-2xl border-2 text-xs", isDark ? "bg-[#080d2a] border-slate-700" : "bg-slate-50 border-navy/15")}>
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
    </div>
  )
}
