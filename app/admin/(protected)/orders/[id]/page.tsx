"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Package,
  User,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  ShieldCheck,
  ShoppingCart,
  Receipt,
  Trash2,
  Edit,
  Eye,
} from "lucide-react"
import AdminLoading from "@/components/admin/admin-loading"
import {
  AdminPageHeader,
  AdminTable,
  AdminPrimaryCell,
  AdminPill,
  AdminTag,
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
  type AdminDetailSectionData,
} from "@/components/admin/ui"
import { getOrderById } from "@/lib/order-actions"
import { adminUpdateOrderStatus, adminDeleteOrder } from "@/lib/admin-actions"

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

interface OrderItem {
  id?: string | number
  name: string
  quantity: number
  price: number
  image?: string
}

interface OrderData {
  id: string
  order_number?: string
  user_id?: string
  userId?: string
  items: OrderItem[]
  total: number
  status: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  shippingAddress?: string
  created_at?: string
  updated_at?: string
  createdAt?: string
  updatedAt?: string
}

const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Pending Approval" },
  { value: "processing", label: "Processing Order" },
  { value: "completed", label: "Completed & Delivered" },
  { value: "cancelled", label: "Cancelled Order" },
]

export default function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const resolvedParams = use(params)
  const orderId = resolvedParams.id
  const router = useRouter()
  const { isDark } = useAdminTheme()
  const { toast } = useToast()

  const [order, setOrder] = useState<OrderData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [statusDraft, setStatusDraft] = useState("pending")
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)

  const loadOrder = async () => {
    try {
      const data = await getOrderById(orderId)
      if (data) {
        setOrder(data as OrderData)
      } else {
        setOrder(null)
      }
    } catch (err) {
      console.error("Error loading order:", err)
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
  }, [orderId])

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return
    setIsUpdatingStatus(true)

    try {
      await adminUpdateOrderStatus(order.id, newStatus)
      setOrder(prev => prev ? { ...prev, status: newStatus } : null)
      toast({
        title: "Status Updated",
        description: `Order status changed to "${newStatus}". Customer notified via email.`,
      })
      setIsStatusModalOpen(false)
    } catch (err) {
      console.error("Error updating status:", err)
      toast({
        title: "Update Failed",
        description: "Could not update order status",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void handleStatusChange(statusDraft)
  }

  const handleDelete = async () => {
    if (!order) return

    setIsDeleting(true)
    try {
      await adminDeleteOrder(order.id)
      toast({
        title: "Order Deleted",
        description: "The order has been cancelled and removed.",
      })
      router.push("/admin/orders")
    } catch (err) {
      console.error("Error deleting order:", err)
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  const openStatusModal = () => {
    if (!order) return
    setStatusDraft(order.status)
    setIsStatusModalOpen(true)
  }

  const statusBadge = (status: string) => {
    const labels: Record<string, string> = {
      completed: "Completed",
      processing: "Processing",
      pending: "Pending",
      cancelled: "Cancelled",
    }
    return <AdminStatusBadge status={status} label={labels[status]} />
  }

  if (isLoading) {
    return <AdminLoading />
  }

  if (!order) {
    return (
      <div className="min-h-screen py-16 px-4 max-w-2xl mx-auto text-center">
        <div className={cn(
          "p-8 rounded-3xl border-2 shadow-lg",
          isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
        )}>
          <Package className="h-16 w-16 mx-auto mb-4 text-brand-red opacity-80" />
          <h2 className="text-2xl font-black mb-2">Order Not Found</h2>
          <p className="text-sm opacity-80 mb-6">
            The order #{orderId} does not exist or has been removed.
          </p>
          <Link href="/admin/orders">
            <Button className="bg-navy hover:bg-navy/85 text-white font-bold rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const createdAtDate = order.created_at || order.createdAt
  const formattedDate = createdAtDate ? new Date(createdAtDate).toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }) : "Date unavailable"

  const itemColumns: AdminTableColumn<OrderItem>[] = [
    {
      key: "item",
      header: "Item Details",
      cellClassName: "max-w-[240px]",
      render: (item) => (
        <AdminPrimaryCell
          icon={Package}
          title={item.name}
          subtitle={item.id ? `Catalog reference: ${item.id}` : "Custom / uncatalogued item"}
          badge={item.id ? <AdminTag>Shop</AdminTag> : undefined}
        />
      ),
    },
    {
      key: "quantity",
      header: "Qty",
      align: "center",
      render: (item) => <AdminPill>{item.quantity}</AdminPill>,
    },
    {
      key: "price",
      header: "Unit Price",
      align: "right",
      render: (item) => (
        <span className="font-bold whitespace-nowrap">TSH {Number(item.price).toLocaleString()}</span>
      ),
    },
    {
      key: "subtotal",
      header: "Subtotal",
      align: "right",
      render: (item) => (
        <span className="font-black whitespace-nowrap">
          TSH {(Number(item.price) * Number(item.quantity)).toLocaleString()}
        </span>
      ),
    },
  ]

  const itemActions: AdminTableAction<OrderItem>[] = [
    {
      key: "view",
      label: "View Line Item Details",
      icon: Eye,
      variant: "view",
      onClick: (item) => {
        setSelectedItem(item)
        setIsItemModalOpen(true)
      },
    },
    {
      key: "shop",
      label: "View in Shop",
      icon: ExternalLink,
      variant: "soft",
      mobile: false,
      hide: (item) => !item.id,
      href: (item) => `/shop/${item.id}`,
    },
  ]

  const itemDetailSections: AdminDetailSectionData[] = selectedItem
    ? [
        {
          key: "preview",
          title: "Item Preview",
          icon: Package,
          content: selectedItem.image ? (
            <img
              src={selectedItem.image}
              alt={selectedItem.name}
              className="h-32 w-32 object-contain rounded-xl border-2 border-navy/15 bg-white p-2"
              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
            />
          ) : (
            <div className="h-32 w-32 rounded-xl border-2 border-dashed border-navy/15 dark:border-teal/30 flex items-center justify-center">
              <Package className="h-10 w-10 opacity-40" />
            </div>
          ),
        },
        {
          key: "pricing",
          title: "Pricing & Quantity",
          icon: Receipt,
          span: 2,
          fields: [
            { label: "Item Name", value: selectedItem.name },
            {
              label: "Catalog Reference",
              value: selectedItem.id ? (
                <AdminTag title={String(selectedItem.id)}>#{String(selectedItem.id)}</AdminTag>
              ) : (
                <AdminMutedText>Not catalogued</AdminMutedText>
              ),
            },
            { label: "Quantity", value: <AdminPill>{selectedItem.quantity}</AdminPill> },
            {
              label: "Unit Price",
              value: `TSH ${Number(selectedItem.price).toLocaleString()}`,
            },
            {
              label: "Line Subtotal",
              value: (
                <span className="font-mono font-black">
                  TSH {(Number(selectedItem.price) * Number(selectedItem.quantity)).toLocaleString()}
                </span>
              ),
            },
          ],
        },
      ]
    : []

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden pb-16">
      <AdminPageHeader
        title={`Order #${order.order_number || order.id.slice(0, 8)}`}
        accent="Details"
        subtitle={`Placed on ${formattedDate}`}
        icon={ShoppingCart}
        onRefresh={loadOrder}
        actions={
          <>
            <Link href="/admin/orders">
              <Button
                variant="outline"
                size="sm"
                className="font-bold rounded-xl h-10 px-4 border-2 border-navy/20 bg-white text-navy hover:bg-teal-50 dark:border-teal/30 dark:bg-transparent dark:text-white dark:hover:bg-teal/10"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back to Orders
              </Button>
            </Link>
            <Button
              onClick={() => router.push(`/admin/receipts?orderId=${order.id}`)}
              className="rounded-xl bg-teal text-navy hover:bg-teal-400 font-black h-10 px-4 flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Receipt className="h-4 w-4" />
              Official Receipt
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(true)}
              disabled={isDeleting}
              className="rounded-xl border-brand-red/40 text-brand-red hover:bg-brand-red/10 font-bold h-10 px-4 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Cancel Order
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Order Items & Financials */}
        <div className="lg:col-span-2 space-y-6">
          <AdminTable
            columns={itemColumns}
            data={order.items || []}
            rowKey={(item) => String(item.id ?? `${item.name}-${item.price}-${item.quantity}`)}
            actions={itemActions}
            emptyIcon={Package}
            emptyTitle="No item records recorded for this order."
            footer={
              <tfoot>
                <tr>
                  <td colSpan={itemColumns.length + itemActions.length} className="p-4 sm:p-6 border-t border-navy/10 dark:border-teal/20 bg-slate-50/50 dark:bg-[#070d2b]/50">
                    <div className="max-w-xs ml-auto space-y-2">
                      <div className="flex justify-between text-sm whitespace-nowrap">
                        <span className="opacity-70">Subtotal:</span>
                        <span className="font-bold">TSH {Number(order.total).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm whitespace-nowrap">
                        <span className="opacity-70">Shipping:</span>
                        <span className="font-bold text-green-600">FREE</span>
                      </div>
                      <div className="flex justify-between text-sm whitespace-nowrap">
                        <span className="opacity-70">Tax / VAT:</span>
                        <span className="font-bold">Included</span>
                      </div>
                      <div className="border-t border-navy/10 dark:border-teal/30 pt-2.5 flex justify-between items-baseline whitespace-nowrap">
                        <span className="font-black text-base">Grand Total:</span>
                        <span className="text-xl sm:text-2xl font-black text-navy dark:text-teal-400 whitespace-nowrap tracking-tight">
                          TSH {Number(order.total).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            }
          />

          <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">
            Telemetry ID: #{order.id.slice(0, 12)}
          </p>
        </div>

        {/* Right 1 Column: Customer Details & Order Status Controls */}
        <div className="space-y-6">
          {/* Order Status Controller Card */}
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl border-2 p-5 shadow-lg space-y-4",
            isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
          )}>
            <div className="border-b border-navy/10 dark:border-teal/20 pb-3">
              <h3 className="text-base font-black flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-navy dark:text-teal" />
                Manage Order Status
              </h3>
              <p className="text-xs opacity-70">Update the current fulfillment phase</p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1.5">
                  Current Status
                </p>
                {statusBadge(order.status)}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={openStatusModal}
                disabled={isUpdatingStatus}
                className={cn(
                  "rounded-xl h-10 px-4 text-xs font-bold border-2 gap-1.5",
                  isDark ? "border-teal/30 text-teal hover:bg-teal/10" : "border-navy/20 text-navy hover:bg-navy/10"
                )}
              >
                <Edit className="h-3.5 w-3.5" />
                Change Status
              </Button>
            </div>

            <div className={cn(
              "p-3 rounded-xl border text-xs leading-relaxed",
              isDark ? "bg-[#060a22]/80 border-teal/20 text-slate-300" : "bg-teal-50/70 border-navy/10 text-navy/90"
            )}>
              <span className="font-bold">Automated notification:</span> Changing the order status triggers an automatic email notification directly to the customer.
            </div>
          </Card>

          {/* Customer Information Card */}
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl border-2 p-5 shadow-lg space-y-4",
            isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
          )}>
            <div className="border-b border-navy/10 dark:border-teal/20 pb-3">
              <h3 className="text-base font-black flex items-center gap-2">
                <User className="h-5 w-5 text-navy dark:text-teal" />
                Customer Information
              </h3>
              <p className="text-xs opacity-70">Buyer profile & delivery address</p>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-navy dark:text-teal mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60">Full Name</p>
                  <p className="font-bold text-sm">{order.customerName || "Customer Name Not Provided"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-navy dark:text-teal mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60">Email Address</p>
                  <p className="font-medium text-sm truncate">{order.customerEmail || "No email on record"}</p>
                </div>
              </div>

              {order.customerPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-navy dark:text-teal mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider opacity-60">Phone Contact</p>
                    <p className="font-medium text-sm">{order.customerPhone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-navy dark:text-teal mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60">Delivery Address</p>
                  <p className="font-medium text-sm leading-relaxed">{order.shippingAddress || "Physical pickup or digital delivery"}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Line item detail */}
      <AdminDetailModal
        open={isItemModalOpen}
        onOpenChange={(open) => {
          setIsItemModalOpen(open)
          if (!open) setSelectedItem(null)
        }}
        icon={Package}
        title={selectedItem?.name ?? "Line Item"}
        badge={selectedItem?.id ? <AdminTag>Ref #{String(selectedItem.id)}</AdminTag> : undefined}
        subtitle="Order line item specification and pricing"
        sections={itemDetailSections}
        headerActions={
          selectedItem?.id ? (
            <a
              href={`/shop/${selectedItem.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-teal hover:bg-teal-400 text-navy font-bold rounded-xl shadow-sm flex items-center gap-1.5 h-9 px-3.5 text-xs transition-all active:scale-95"
            >
              View in Shop
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : undefined
        }
      />

      {/* Status edit */}
      <AdminFormModal
        open={isStatusModalOpen}
        onOpenChange={setIsStatusModalOpen}
        icon={ShieldCheck}
        title="Change Order Status"
        description="Update the current fulfillment phase. The customer is notified automatically."
        onSubmit={handleStatusSubmit}
        isSubmitting={isUpdatingStatus}
        isEdit
        editLabel="Update Status"
      >
        <AdminFormGrid>
          <AdminFormField label="Fulfillment Status" required>
            <AdminSelect
              value={statusDraft}
              onValueChange={setStatusDraft}
              options={ORDER_STATUS_OPTIONS}
            />
          </AdminFormField>
          <AdminFormField label="Current Status" hint="Shown for reference only">
            {statusBadge(order.status)}
          </AdminFormField>
        </AdminFormGrid>
      </AdminFormModal>

      {/* Destructive confirmation */}
      <AdminConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Cancel and delete order?"
        description={`Order #${order.order_number || order.id.slice(0, 8)} will be permanently removed. This action cannot be undone.`}
        confirmLabel="Delete Order"
        onConfirm={handleDelete}
        isSubmitting={isDeleting}
      />
    </div>
  )
}
