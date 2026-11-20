"use client"

import { useState, useEffect, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminLoading from "@/components/admin/admin-loading"
import {
  AdminConfirmDialog,
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
  AdminTextarea,
  type AdminTableAction,
  type AdminTableColumn,
} from "@/components/admin/ui"
import {
  getPurchaseOrders,
  createPurchaseOrder,
  createGoodsReceipt,
  deletePurchaseOrder,
} from "@/lib/purchase-actions"
import { getSuppliers } from "@/lib/supplier-actions"
import { getWarehouses } from "@/lib/inventory-actions"
import { getProducts } from "@/lib/product-actions"
import {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  Supplier,
  Warehouse,
} from "@/lib/erp/types"
import { Product } from "@/types/database"
import {
  Truck,
  PackagePlus,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  Trash2,
  Printer,
  Boxes,
  Building2,
  Package,
} from "lucide-react"

export default function PurchaseOrdersPage() {
  const { toast } = useToast()

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
  const [grnItems, setGrnItems] = useState<
    Array<{ productId: number; name: string; quantityReceived: number; unitCost: number }>
  >([])
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
        description: `Successfully deleted PO #${poToDelete.po_number}.`,
      })
      setPoToDelete(null)
      loadData()
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message || "Could not delete purchase order.",
        variant: "destructive",
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
        getProducts(),
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
    const prod = products.find((p) => p.id === productId)
    if (!prod) return
    const existingIdx = poItems.findIndex((i) => i.product_id === prod.id)
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
          total_cost: cost * 5,
        },
      ])
    }
  }

  // Create PO
  const handleCreatePo = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!selectedSupplierId || poItems.length === 0) {
      toast({
        title: "Incomplete PO",
        description: "Select supplier and add at least one line item.",
        variant: "destructive",
      })
      return
    }

    const sup = suppliers.find((s) => s.id === selectedSupplierId)
    const wh = warehouses.find((w) => w.id === selectedWarehouseId) || warehouses[0]
    if (!sup) return

    setIsCreating(true)
    try {
      const subtotal = poItems.reduce((acc, it) => acc + it.total_cost, 0)
      const taxAmount = (subtotal * poTaxRate) / 100
      const total = subtotal + taxAmount + poShipping - poDiscount
      void total

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
        notes: poNotes || undefined,
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
      po.items.map((it) => ({
        productId: it.product_id,
        name: it.name,
        quantityReceived: it.quantity - (it.received_quantity || 0),
        unitCost: it.unit_cost,
      }))
    )
    setIsGrnOpen(true)
  }

  // Execute GRN
  const handleExecuteGrn = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!activeGrnPo) return

    const totalQty = grnItems.reduce((acc, it) => acc + it.quantityReceived, 0)
    if (totalQty <= 0) {
      toast({
        title: "Zero Quantity",
        description: "Specify delivered quantities greater than zero.",
        variant: "destructive",
      })
      return
    }

    setIsReceiving(true)
    try {
      await createGoodsReceipt({
        purchaseOrderId: activeGrnPo.id,
        warehouseId: activeGrnPo.warehouse_id,
        warehouseName: activeGrnPo.warehouse_name,
        receivedItems: grnItems.map((it) => ({
          productId: it.productId,
          name: it.name,
          quantityReceived: it.quantityReceived,
          unitCost: it.unitCost,
        })),
        deliveryNoteNumber: deliveryNote || undefined,
        carrierName: carrier || undefined,
        notes: "Verified physical receiving into inventory stock ledger",
      })

      toast({
        title: "Goods Received & Stock Updated",
        description: `Successfully received ${totalQty} units into inventory.`,
      })
      setIsGrnOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: "Receiving Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsReceiving(false)
    }
  }

  const poStatusLabel = (status: PurchaseOrderStatus) => {
    switch (status) {
      case "received":
        return "Fully Received"
      case "partially_received":
        return "Partially Received"
      case "sent":
        return "Sent to Vendor"
      default:
        return undefined
    }
  }

  const totalPoVolume = purchaseOrders.reduce((acc, po) => acc + (Number(po.total) || 0), 0)
  const receivedPos = purchaseOrders.filter((po) => po.status === "received").length
  const pendingPos = purchaseOrders.filter(
    (po) =>
      po.status === "sent" || po.status === "confirmed" || po.status === "partially_received"
  ).length

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

  const filteredOrders = purchaseOrders.filter((po) => {
    if (statusFilter !== "all" && po.status !== statusFilter) return false
    if (searchQuery) {
      return (
        po.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return true
  })

  const columns: AdminTableColumn<PurchaseOrder>[] = [
    {
      key: "po_number",
      header: "PO #",
      render: (po) => (
        <AdminPrimaryCell
          icon={Truck}
          title={`#${po.po_number}`}
          subtitle={
            po.order_date
              ? new Date(po.order_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
              : undefined
          }
        />
      ),
    },
    {
      key: "supplier",
      header: "Supplier / Vendor",
      render: (po) => <AdminMutedText className="font-bold">{po.supplier_name}</AdminMutedText>,
    },
    {
      key: "items",
      header: "Items",
      hidden: "sm",
      align: "center",
      render: (po) => <AdminPill>{po.items?.length || 0} Items</AdminPill>,
    },
    {
      key: "total",
      header: "Order Total",
      align: "right",
      render: (po) => <span className="font-mono font-black">TSH {Number(po.total).toLocaleString()}</span>,
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (po) => (
        <AdminStatusBadge status={po.status} label={poStatusLabel(po.status)} />
      ),
    },
    {
      key: "order_date",
      header: "Date",
      hidden: "md",
      render: (po) =>
        po.order_date ? (
          <AdminMutedText>
            {new Date(po.order_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
          </AdminMutedText>
        ) : (
          <AdminMutedText>â€”</AdminMutedText>
        ),
    },
  ]

  const poItemColumns: AdminTableColumn<PurchaseOrderItem>[] = [
    {
      key: "item",
      header: "Item",
      render: (item) => <span className="font-bold">{item.name}</span>,
    },
    {
      key: "qty",
      header: "Qty",
      align: "center",
      render: (item) => <span className="font-mono font-bold">{item.quantity}</span>,
    },
    {
      key: "unit_cost",
      header: "Unit Cost",
      align: "right",
      render: (item) => (
        <span className="font-mono">TZS {Number(item.unit_cost).toLocaleString()}</span>
      ),
    },
    {
      key: "total_cost",
      header: "Total",
      align: "right",
      render: (item) => (
        <span className="font-mono font-bold">TZS {Number(item.total_cost).toLocaleString()}</span>
      ),
    },
  ]

  const actions: AdminTableAction<PurchaseOrder>[] = [
    {
      key: "view",
      label: "View Purchase Order Details",
      icon: Eye,
      variant: "view",
      onClick: (po) => {
        setSelectedPo(po)
        setIsViewPoOpen(true)
      },
    },
    {
      key: "grn",
      label: "Receive Goods (GRN)",
      icon: PackagePlus,
      variant: "soft",
      hide: (po) => po.status === "received" || po.status === "cancelled",
      onClick: handleOpenGrn,
    },
    {
      key: "delete",
      label: "Delete Purchase Order",
      icon: Trash2,
      variant: "danger-soft",
      mobile: false,
      onClick: (po) => setPoToDelete(po),
    },
  ]

  if (isLoading) return <AdminLoading />

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="Purchase"
        accent="Orders"
        subtitle="Manage vendor procurement cycles, goods receiving notes (GRN), and automated stock increments"
        icon={PackagePlus}
        onAdd={() => setIsCreateOpen(true)}
        addLabel="Issue Purchase Order"
      />

      <AdminStats
        columns={4}
        items={[
          { title: "Total Purchase Orders", value: purchaseOrders.length.toString(), icon: Truck },
          { title: "Pending Receiving", value: pendingPos.toString(), icon: Clock },
          { title: "Fulfilled / Received", value: receivedPos.toString(), icon: CheckCircle2 },
          { title: "Procurement Outlay", value: formatStatCurrency(totalPoVolume), icon: DollarSign },
        ]}
      />

      <AdminFilterBar
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by PO number or supplier name..."
        selects={[
          {
            value: statusFilter,
            onValueChange: setStatusFilter,
            placeholder: "All PO Statuses",
            allLabel: "All PO Statuses",
            options: [
              { value: "draft", label: "Draft" },
              { value: "sent", label: "Sent" },
              { value: "confirmed", label: "Confirmed" },
              { value: "partially_received", label: "Partially Received" },
              { value: "received", label: "Received" },
              { value: "cancelled", label: "Cancelled" },
            ],
          },
        ]}
      />

      <AdminTable
        columns={columns}
        data={filteredOrders}
        rowKey={(po) => po.id}
        actions={actions}
        emptyIcon={Truck}
        emptyTitle="No purchase orders found"
        emptyDescription="Try adjusting your filters or search keyword"
      />

      {/* CREATE PO MODAL */}
      <AdminFormModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        icon={Truck}
        title="Issue Purchase Order (PO)"
        description="Issue vendor purchase order with automatic inventory and tax calculations."
        onSubmit={handleCreatePo}
        isSubmitting={isCreating}
        size="lg"
        createLabel="Confirm & Issue PO"
      >
        <AdminFormGrid>
          <AdminFormField label="Select Vendor / Supplier" required>
            <AdminSelect
              value={selectedSupplierId}
              onValueChange={setSelectedSupplierId}
              placeholder="Choose Supplier..."
              options={suppliers.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.payment_terms})`,
              }))}
            />
          </AdminFormField>

          <AdminFormField label="Receiving Warehouse" required>
            <AdminSelect
              value={selectedWarehouseId || warehouses[0]?.id || ""}
              onValueChange={setSelectedWarehouseId}
              placeholder="Choose warehouse..."
              options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            />
          </AdminFormField>

          <AdminFormField label="Expected Delivery Date">
            <AdminInput
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
            />
          </AdminFormField>

          <AdminFormField
            label="Tax Rate (%)"
            hint="Applied to the full order subtotal."
          >
            <AdminInput
              type="number"
              value={poTaxRate}
              onChange={(e) => setPoTaxRate(Number(e.target.value) || 0)}
            />
          </AdminFormField>

          <AdminFormField label="Discount (TZS)">
            <AdminInput
              type="number"
              value={poDiscount}
              onChange={(e) => setPoDiscount(Number(e.target.value) || 0)}
            />
          </AdminFormField>

          <AdminFormField label="Shipping (TZS)">
            <AdminInput
              type="number"
              value={poShipping}
              onChange={(e) => setPoShipping(Number(e.target.value) || 0)}
            />
          </AdminFormField>
        </AdminFormGrid>

        <div className="space-y-3 rounded-2xl border-2 border-navy/20 p-3 sm:p-4 dark:border-teal/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-wider">Add Order Line Items</span>
            <AdminSelect
              value=""
              onValueChange={(value) => handleAddProductToPo(Number(value))}
              placeholder="+ Add Product..."
              options={products.map((p) => ({ value: String(p.id), label: p.name }))}
              className="w-full sm:w-56"
            />
          </div>

          {poItems.length === 0 ? (
            <p className="py-4 text-center text-xs opacity-70">
              No products added yet. Select a product above.
            </p>
          ) : (
            <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
              {poItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="space-y-2.5 rounded-xl border-2 border-navy/15 p-3 dark:border-teal/30"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-navy/10 pb-2 dark:border-teal/20">
                    <div className="flex min-w-0 items-center gap-2">
                      <Package className="h-4 w-4 shrink-0" />
                      <span className="truncate text-xs font-bold sm:text-sm">{item.name}</span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))}
                      className="h-7 w-7 shrink-0 rounded-lg text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                      title="Remove Item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <AdminFormGrid className="sm:grid-cols-3">
                    <AdminFormField label="Quantity">
                      <AdminInput
                        monospace
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const q = Math.max(1, parseInt(e.target.value) || 1)
                          const updated = [...poItems]
                          updated[idx].quantity = q
                          updated[idx].total_cost = q * updated[idx].unit_cost
                          setPoItems(updated)
                        }}
                      />
                    </AdminFormField>

                    <AdminFormField label="Unit Cost (TZS)">
                      <AdminInput
                        monospace
                        type="number"
                        value={item.unit_cost}
                        onChange={(e) => {
                          const c = parseFloat(e.target.value) || 0
                          const updated = [...poItems]
                          updated[idx].unit_cost = c
                          updated[idx].total_cost = updated[idx].quantity * c
                          setPoItems(updated)
                        }}
                      />
                    </AdminFormField>

                    <AdminFormField label="Subtotal">
                      <div className="flex h-10 items-center justify-between rounded-xl border-2 border-navy/20 px-3 font-mono text-xs font-bold sm:h-11 dark:border-teal/30">
                        <span className="text-[10px] font-bold uppercase opacity-75">TZS</span>
                        <span>{item.total_cost.toLocaleString()}</span>
                      </div>
                    </AdminFormField>
                  </AdminFormGrid>
                </div>
              ))}
            </div>
          )}
        </div>

        <AdminFormField label="Purchase Order Notes">
          <AdminTextarea
            placeholder="Delivery instructions, quotation cross-reference, payment milestones..."
            value={poNotes}
            onChange={(e) => setPoNotes(e.target.value)}
          />
        </AdminFormField>
      </AdminFormModal>

      {/* GOODS RECEIPT (GRN) MODAL */}
      <AdminFormModal
        open={isGrnOpen}
        onOpenChange={setIsGrnOpen}
        icon={PackagePlus}
        title={`Goods Receiving Note (GRN) â€” #${activeGrnPo?.po_number || ""}`}
        description="Receiving delivered items increments active warehouse inventory stock immediately."
        onSubmit={handleExecuteGrn}
        isSubmitting={isReceiving}
        size="lg"
        createLabel="Accept & Increment Stock"
      >
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-wider">Verify Delivered Items</p>
          {grnItems.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border-2 border-navy/15 p-3.5 dark:border-teal/30"
            >
              <div>
                <p className="text-sm font-bold">{item.name}</p>
                <p className="text-[11px] opacity-70">Unit Cost: TZS {item.unitCost.toLocaleString()}</p>
              </div>
              <AdminFormField label="Delivered Qty">
                <AdminInput
                  monospace
                  type="number"
                  min="0"
                  value={item.quantityReceived}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value) || 0)
                    const updated = [...grnItems]
                    updated[idx].quantityReceived = val
                    setGrnItems(updated)
                  }}
                  className="w-full sm:w-24"
                />
              </AdminFormField>
            </div>
          ))}
        </div>

        <AdminFormGrid>
          <AdminFormField label="Delivery Note / Waybill #">
            <AdminInput
              placeholder="e.g. DN-992812"
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Courier / Transporter">
            <AdminInput
              placeholder="e.g. DHL / In-House Courier"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
            />
          </AdminFormField>
        </AdminFormGrid>
      </AdminFormModal>

      {/* PURCHASE ORDER DETAILS MODAL */}
      <AdminDetailModal
        open={isViewPoOpen}
        onOpenChange={setIsViewPoOpen}
        icon={PackagePlus}
        title={`PO #${selectedPo?.po_number || "Details"}`}
        subtitle={
          selectedPo
            ? `Issued on ${
                selectedPo.order_date
                  ? new Date(selectedPo.order_date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "â€”"
              }${
                selectedPo.expected_delivery_date
                  ? ` â€¢ Expected: ${new Date(selectedPo.expected_delivery_date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}`
                  : ""
              }`
            : undefined
        }
        badge={
          selectedPo ? (
            <AdminStatusBadge status={selectedPo.status} label={poStatusLabel(selectedPo.status)} />
          ) : undefined
        }
        size="xl"
        sections={[
          {
            key: "items",
            title: `Ordered Line Items (${selectedPo?.items?.length || 0})`,
            icon: Boxes,
            span: 2,
            content: (
              <AdminTable
                inline
                columns={poItemColumns}
                data={selectedPo?.items ?? []}
                rowKey={(item) => item.id ?? `${item.product_id}-${item.name}`}
              />
            ),
          },
          {
            key: "supplier",
            title: "Vendor / Supplier",
            icon: Building2,
            fields: [
              { label: "Supplier", value: selectedPo?.supplier_name || "â€”" },
              { label: "Email", value: selectedPo?.supplier_email || "â€”" },
              { label: "Phone", value: selectedPo?.supplier_phone || "â€”" },
            ],
          },
          {
            key: "warehouse",
            title: "Delivery Warehouse",
            icon: Truck,
            fields: [
              { label: "Warehouse", value: selectedPo?.warehouse_name || "Main Lab Warehouse" },
              { label: "Warehouse ID", value: selectedPo?.warehouse_id || "â€”" },
            ],
          },
          {
            key: "financial",
            title: "Financial Breakdown",
            icon: DollarSign,
            fields: [
              {
                label: "Subtotal",
                value: `TZS ${Number(selectedPo?.subtotal || 0).toLocaleString()}`,
              },
              {
                label: "Tax / VAT",
                value: `TZS ${Number(selectedPo?.tax_amount || 0).toLocaleString()}`,
              },
              ...(Number(selectedPo?.shipping_amount || 0) > 0
                ? [
                    {
                      label: "Shipping",
                      value: `TZS ${Number(selectedPo?.shipping_amount || 0).toLocaleString()}`,
                    },
                  ]
                : []),
              ...(Number(selectedPo?.discount_amount || 0) > 0
                ? [
                    {
                      label: "Discount",
                      value: `-TZS ${Number(selectedPo?.discount_amount || 0).toLocaleString()}`,
                    },
                  ]
                : []),
              {
                label: "Grand Total",
                value: `TZS ${Number(selectedPo?.total || 0).toLocaleString()}`,
              },
            ],
          },
          ...(selectedPo?.notes
            ? [
                {
                  key: "notes",
                  title: "Order Notes & Terms",
                  icon: Clock,
                  span: 2 as const,
                  content: <p className="text-xs leading-relaxed opacity-90">{selectedPo.notes}</p>,
                },
              ]
            : []),
        ]}
        footerActions={
          <>
            {selectedPo &&
              selectedPo.status !== "received" &&
              selectedPo.status !== "cancelled" && (
                <Button
                  size="sm"
                  onClick={() => {
                    setIsViewPoOpen(false)
                    handleOpenGrn(selectedPo)
                  }}
                  className="gap-1.5 bg-navy font-bold text-white hover:bg-navy/90"
                >
                  <PackagePlus className="h-4 w-4 text-teal" />
                  Receive Goods
                </Button>
              )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.print()}
              className="gap-1.5 font-bold"
            >
              <Printer className="h-4 w-4" />
              Print PO
            </Button>
          </>
        }
        onDelete={
          selectedPo
            ? () => {
                setIsViewPoOpen(false)
                setPoToDelete(selectedPo)
              }
            : undefined
        }
        deleteLabel="Delete PO"
      />

      {/* DELETE PO CONFIRMATION DIALOG */}
      <AdminConfirmDialog
        open={!!poToDelete}
        onOpenChange={(open) => !open && setPoToDelete(null)}
        title="Delete Purchase Order"
        description={`Are you sure you want to delete PO #${poToDelete?.po_number}? This action cannot be undone.`}
        confirmLabel={isDeletingPo ? "Deleting..." : "Delete Purchase Order"}
        isSubmitting={isDeletingPo}
        onConfirm={handleDeletePo}
      />
    </div>
  )
}
