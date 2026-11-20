"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getAllOrders, adminUpdateOrderStatus, adminDeleteOrder } from "@/lib/admin-actions"
import { useToast } from "@/hooks/use-toast"
import AdminLoading from "@/components/admin/admin-loading"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AdminPageHeader,
  AdminStats,
  AdminFilterBar,
  AdminTable,
  AdminPrimaryCell,
  AdminPill,
  AdminMutedText,
  AdminStatusBadge,
  AdminDetailModal,
  AdminFormModal,
  AdminFormGrid,
  AdminFormField,
  AdminSelect,
  AdminConfirmDialog,
  type AdminTableColumn,
  type AdminTableAction,
  type AdminFilterTab,
  type AdminDetailSectionData,
} from "@/components/admin/ui"
import {
  Eye,
  Edit,
  Trash2,
  User,
  ShoppingCart,
  Receipt,
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Printer,
  ShieldCheck,
} from "lucide-react"

interface Order {
  id: string
  order_number?: string
  user_id?: string
  items: any[]
  total: number
  status: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  shippingAddress?: string
  created_at: string
  updated_at?: string
}

interface OrderLineItem {
  id?: string | number
  _rowKey?: string | number
  name?: string
  image?: string
  quantity?: number
  price?: number
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [editStatus, setEditStatus] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const tabs: AdminFilterTab[] = [
    { key: "all", label: "All Orders", icon: ShoppingCart, count: orders.length },
    { key: "pending", label: "Pending", icon: Clock, count: orders.filter((o) => o.status === "pending").length },
    { key: "processing", label: "Processing", icon: Package, count: orders.filter((o) => o.status === "processing").length },
    { key: "completed", label: "Completed", icon: CheckCircle, count: orders.filter((o) => o.status === "completed").length },
    { key: "cancelled", label: "Cancelled", icon: XCircle, count: orders.filter((o) => o.status === "cancelled").length },
  ]

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getAllOrders()
      setOrders(data)
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError("Failed to load orders. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId)
      await adminUpdateOrderStatus(orderId, newStatus as any)

      setOrders((previous) =>
        previous.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      )

      setSelectedOrder((previous) =>
        previous && previous.id === orderId ? { ...previous, status: newStatus } : previous
      )

      toast({
        title: "Status Updated",
        description: `Order status changed to ${newStatus}`,
      })
    } catch (err) {
      console.error("Error updating order status:", err)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await adminDeleteOrder(orderId)
      setOrders((previous) => previous.filter((order) => order.id !== orderId))
      setSelectedOrder((previous) => (previous?.id === orderId ? null : previous))

      toast({
        title: "Order Deleted",
        description: "Order has been removed successfully",
      })
    } catch (err) {
      console.error("Error deleting order:", err)
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      })
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      (order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (order.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab = activeTab === "all" || order.status === activeTab
    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    return matchesSearch && matchesTab && matchesStatus
  })

  const totalOrders = orders.length
  const pendingOrders = orders.filter((o) => o.status === "pending").length
  const processingOrders = orders.filter((o) => o.status === "processing").length
  const completedOrders = orders.filter((o) => o.status === "completed").length
  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, order) => sum + (Number(order.total) || 0), 0)

  const formatStatNumber = (num: number) => {
    const n = Number(num) || 0
    if (n >= 1_000_000) {
      const m = n / 1_000_000
      return m % 1 === 0 ? `${m.toFixed(0)}M` : `${m.toFixed(1)}M`
    }
    if (n >= 1_000) {
      const k = n / 1_000
      return k % 1 === 0 ? `${k.toFixed(0)}K` : `${k.toFixed(1)}K`
    }
    return n.toLocaleString()
  }

  const formatStatCurrency = (num: number) => {
    const n = Number(num) || 0
    if (n >= 1_000_000) {
      const m = n / 1_000_000
      const formatted = m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)
      return `TSH ${formatted}M`
    }
    if (n >= 1_000) {
      const k = n / 1_000
      const formatted = k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)
      return `TSH ${formatted}K`
    }
    return `TSH ${n.toLocaleString()}`
  }

  const columns: AdminTableColumn<Order>[] = [
    {
      key: "order",
      header: "Order #",
      render: (order) => (
        <AdminPrimaryCell
          icon={ShoppingCart}
          title={`#${order.order_number || order.id.slice(0, 8)}`}
        />
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (order) => (
        <AdminPrimaryCell
          icon={User}
          title={order.customerName || "Unknown Customer"}
          subtitle={order.customerEmail}
        />
      ),
    },
    {
      key: "items",
      header: "Items",
      align: "center",
      hidden: "sm",
      render: (order) => <AdminPill>{order.items?.length || 0}</AdminPill>,
    },
    {
      key: "total",
      header: "Order Total",
      align: "right",
      render: (order) => (
        <span className="whitespace-nowrap font-black text-xs sm:text-sm tracking-tight">
          TSH {Number(order.total).toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (order) => <AdminStatusBadge status={order.status} />,
    },
    {
      key: "date",
      header: "Date",
      hidden: "md",
      render: (order) => <AdminMutedText>{new Date(order.created_at).toLocaleDateString()}</AdminMutedText>,
    },
  ]

  const orderItemColumns: AdminTableColumn<OrderLineItem>[] = [
    {
      key: "item",
      header: "Item Details",
      render: (item) => (
        <div className="flex items-center gap-2.5">
          {item.image && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-navy/15 bg-white p-0.5">
              <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
            </div>
          )}
          <span className="font-bold">{item.name}</span>
        </div>
      ),
    },
    {
      key: "qty",
      header: "Qty",
      align: "center",
      render: (item) => <span className="font-mono font-bold">x{item.quantity}</span>,
    },
    {
      key: "unit_price",
      header: "Unit Price",
      align: "right",
      render: (item) => (
        <span className="font-mono">TZS {Number(item.price || 0).toLocaleString()}</span>
      ),
    },
    {
      key: "subtotal",
      header: "Subtotal",
      align: "right",
      render: (item) => (
        <span className="font-mono font-bold">
          TZS {(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}
        </span>
      ),
    },
  ]

  const actions: AdminTableAction<Order>[] = [
    {
      key: "view",
      label: "View order details",
      icon: Eye,
      variant: "view",
      onClick: (order) => {
        setSelectedOrder(order)
        setIsViewModalOpen(true)
      },
    },
    {
      key: "receipt",
      label: "View / Issue Official QLABS Receipt",
      icon: Receipt,
      variant: "soft",
      mobile: false,
      href: (order) => `/admin/receipts?orderId=${order.id}`,
    },
    {
      key: "edit",
      label: "Edit order status",
      icon: Edit,
      variant: "edit",
      mobile: false,
      onClick: (order) => {
        setEditingOrder(order)
        setEditStatus(order.status)
        setIsEditDialogOpen(true)
      },
    },
    {
      key: "delete",
      label: "Delete order",
      icon: Trash2,
      variant: "delete",
      onClick: (order) => setOrderToDelete(order),
    },
  ]

  const detailSections: AdminDetailSectionData[] = selectedOrder
    ? [
        {
          key: "items",
          title: `Ordered Items (${selectedOrder.items?.length || 0})`,
          icon: Package,
          span: 2,
          content: (
            <AdminTable
              inline
              columns={orderItemColumns}
              data={(selectedOrder.items || []).map((item: any, idx: number) => ({
                ...item,
                _rowKey: item.id ?? idx,
              }))}
              rowKey={(item) => item._rowKey ?? 0}
              emptyTitle="No item records on this order."
            />
          ),
        },
        {
          key: "financials",
          title: "Financial Summary",
          icon: DollarSign,
          fields: [
            { label: "Subtotal", value: `TZS ${Number(selectedOrder.total).toLocaleString()}` },
            { label: "Shipping", value: "FREE" },
            { label: "Total Amount", value: `TZS ${Number(selectedOrder.total).toLocaleString()}` },
          ],
        },
        {
          key: "customer",
          title: "Customer & Delivery",
          icon: User,
          fields: [
            { label: "Client Name", value: selectedOrder.customerName || "Customer Name Not Provided" },
            { label: "Email Address", value: selectedOrder.customerEmail || "â€”" },
            { label: "Phone Number", value: selectedOrder.customerPhone || "â€”" },
            {
              label: "Shipping Destination",
              value: selectedOrder.shippingAddress || "Main Laboratory Address, Dar es Salaam, Tanzania",
            },
          ],
        },
        {
          key: "fulfillment",
          title: "Fulfillment Status",
          icon: ShieldCheck,
          fields: [
            { label: "Current Status", value: <AdminStatusBadge status={selectedOrder.status} /> },
            {
              label: "Placed On",
              value: new Date(selectedOrder.created_at).toLocaleString("en-US", {
                dateStyle: "full",
                timeStyle: "short",
              }),
            },
          ],
        },
      ]
    : []

  if (isLoading) {
    return <AdminLoading />
  }

  if (error) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
        <AdminPageHeader
          title="Orders"
          accent="Management"
          subtitle="Real-time customer order processing and fulfillment telemetry"
          icon={ShoppingCart}
        />
        <Alert className="border-2 border-brand-red bg-brand-red/10 text-brand-red rounded-xl">
          <AlertDescription className="font-bold">{error}</AlertDescription>
        </Alert>
        <Button
          onClick={fetchOrders}
          className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl"
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="Orders"
        accent="Management"
        subtitle="Real-time customer order processing and fulfillment telemetry"
        icon={ShoppingCart}
        onRefresh={fetchOrders}
      />

      <AdminStats
        columns={5}
        items={[
          { title: "Total Orders", value: formatStatNumber(totalOrders), icon: ShoppingCart },
          { title: "Pending", value: formatStatNumber(pendingOrders), icon: Clock, onClick: () => setActiveTab("pending") },
          { title: "Processing", value: formatStatNumber(processingOrders), icon: Package, onClick: () => setActiveTab("processing") },
          { title: "Completed", value: formatStatNumber(completedOrders), icon: CheckCircle, onClick: () => setActiveTab("completed") },
          { title: "Total Revenue", value: formatStatCurrency(totalRevenue), icon: DollarSign },
        ]}
      />

      <AdminFilterBar
        tabs={tabs}
        tabValue={activeTab}
        onTabChange={setActiveTab}
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by order number, customer name or email..."
        selects={[
          {
            value: statusFilter,
            onValueChange: setStatusFilter,
            placeholder: "Filter by status",
            allLabel: "All Statuses",
            options: STATUS_OPTIONS,
          },
        ]}
      />

      <AdminTable
        columns={columns}
        data={filteredOrders}
        rowKey={(order) => order.id}
        actions={actions}
        emptyIcon={Package}
        emptyTitle="No orders found"
        emptyDescription="Try changing your search terms or filter selection"
      />

      <AdminDetailModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        icon={ShoppingCart}
        title={`Order #${selectedOrder?.order_number || selectedOrder?.id.slice(0, 8)}`}
        subtitle={
          selectedOrder
            ? `Placed on ${new Date(selectedOrder.created_at).toLocaleString("en-US", {
                dateStyle: "full",
                timeStyle: "short",
              })}`
            : undefined
        }
        badge={selectedOrder ? <AdminStatusBadge status={selectedOrder.status} /> : undefined}
        sections={detailSections}
        fields={
          selectedOrder
            ? [
                { label: "Order ID", value: selectedOrder.id },
                { label: "Order Number", value: selectedOrder.order_number || "â€”" },
                { label: "User ID", value: selectedOrder.user_id || "â€”" },
                { label: "Items", value: selectedOrder.items?.length || 0 },
                { label: "Total", value: `TZS ${Number(selectedOrder.total).toLocaleString()}` },
                { label: "Last Updated", value: selectedOrder.updated_at ? new Date(selectedOrder.updated_at).toLocaleString() : "â€”" },
              ]
            : undefined
        }
        size="xl"
        footerActions={
          <>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (selectedOrder) {
                  setEditingOrder(selectedOrder)
                  setEditStatus(selectedOrder.status)
                  setIsViewModalOpen(false)
                  setIsEditDialogOpen(true)
                }
              }}
              className="font-bold rounded-xl h-10 px-4 text-xs bg-navy hover:bg-navy/90 text-white"
            >
              <Edit className="h-4 w-4 mr-1.5" />
              Change Status
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => selectedOrder && router.push(`/admin/receipts?orderId=${selectedOrder.id}`)}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-4 text-xs"
            >
              <Receipt className="h-4 w-4 mr-1.5 text-teal" />
              Issue Receipt
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => window.print()}
              className="font-bold rounded-xl h-10 px-4 text-xs border-2"
            >
              <Printer className="h-4 w-4 mr-1.5" />
              Print
            </Button>
          </>
        }
      />

      <AdminFormModal
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        icon={Edit}
        title="Update Order Status"
        description={`Change order #${editingOrder?.order_number || editingOrder?.id.slice(0, 8)} fulfillment state`}
        onSubmit={async (event) => {
          event.preventDefault()
          if (!editingOrder || !editStatus) return
          await handleStatusUpdate(editingOrder.id, editStatus)
          setIsEditDialogOpen(false)
        }}
        isSubmitting={Boolean(editingOrder && updatingStatus === editingOrder.id)}
        isEdit
        submitLabel="Save Changes"
        editLabel="Save Changes"
        size="sm"
      >
        <AdminFormGrid className="grid-cols-1">
          <AdminFormField label="Select New Status" required>
            <AdminSelect
              value={editStatus}
              onValueChange={setEditStatus}
              options={STATUS_OPTIONS}
              placeholder="Choose status..."
            />
          </AdminFormField>
        </AdminFormGrid>
        <p className="rounded-xl border-2 border-navy p-3 text-xs leading-relaxed dark:border-teal/40">
          <span className="font-bold">Notice:</span> Updating the order status will synchronize telemetry and trigger automatic notifications.
        </p>
      </AdminFormModal>

      <AdminConfirmDialog
        open={orderToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setOrderToDelete(null)
        }}
        title="Delete Order"
        description={`Delete order #${orderToDelete?.order_number || orderToDelete?.id.slice(0, 8)}? This action cannot be undone.`}
        confirmLabel="Delete Order"
        isSubmitting={isDeleting}
        onConfirm={async () => {
          if (!orderToDelete) return
          setIsDeleting(true)
          await handleDeleteOrder(orderToDelete.id)
          setIsDeleting(false)
          setOrderToDelete(null)
        }}
      />
    </div>
  )
}
