"use client"

import { useState, useEffect, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
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
  Printer,
  FileText,
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
import { getAdminInvoiceById, updateInvoiceStatus, deleteAdminInvoice, type AdminInvoice, type InvoiceItem } from "@/lib/invoice-actions"
import { printInvoiceDocument } from "@/lib/print-invoice"

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>
}

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled"

const INVOICE_STATUS_OPTIONS = [
  { value: "draft", label: "Draft / Pending" },
  { value: "sent", label: "Sent / Processing" },
  { value: "paid", label: "Paid & Completed" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
]

export default function AdminInvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const resolvedParams = use(params)
  const invoiceId = resolvedParams.id
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isDark } = useAdminTheme()
  const { toast } = useToast()

  const [invoice, setInvoice] = useState<AdminInvoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [statusDraft, setStatusDraft] = useState<InvoiceStatus>("draft")
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InvoiceItem | null>(null)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)

  const loadInvoice = async () => {
    try {
      const data = await getAdminInvoiceById(invoiceId)
      setInvoice(data)
    } catch (err) {
      console.error("Error loading invoice:", err)
      toast({
        title: "Error",
        description: "Failed to load invoice details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInvoice()
  }, [invoiceId])

  useEffect(() => {
    if (!isLoading && invoice && searchParams.get("print") === "true") {
      setTimeout(() => {
        window.print()
      }, 300)
    }
  }, [isLoading, invoice, searchParams])

  const handleStatusChange = async (newStatus: InvoiceStatus) => {
    if (!invoice) return
    setIsUpdatingStatus(true)

    try {
      const updated = await updateInvoiceStatus(invoice.id, newStatus)
      if (updated) {
        setInvoice(updated)
      } else {
        setInvoice(prev => prev ? { ...prev, status: newStatus } : null)
      }
      toast({
        title: "Status Updated",
        description: `Invoice status changed to "${newStatus}".`,
      })
      setIsStatusModalOpen(false)
    } catch (err) {
      console.error("Error updating status:", err)
      toast({
        title: "Update Failed",
        description: "Could not update invoice status",
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
    if (!invoice) return

    setIsDeleting(true)
    try {
      await deleteAdminInvoice(invoice.id)
      toast({
        title: "Invoice Deleted",
        description: "The invoice has been removed.",
      })
      router.push("/admin/invoices")
    } catch (err) {
      console.error("Error deleting invoice:", err)
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  const openStatusModal = () => {
    if (!invoice) return
    setStatusDraft(invoice.status)
    setIsStatusModalOpen(true)
  }

  const statusBadge = (status: string) => {
    const labels: Record<string, string> = {
      paid: "Paid & Completed",
      sent: "Sent / Processing",
      draft: "Draft / Pending",
      overdue: "Overdue",
      cancelled: "Cancelled",
    }
    return <AdminStatusBadge status={status} label={labels[status]} />
  }

  if (isLoading) {
    return <AdminLoading />
  }

  if (!invoice) {
    return (
      <div className="min-h-screen py-16 px-4 max-w-2xl mx-auto text-center">
        <div className={cn(
          "p-8 rounded-3xl border-2 shadow-lg",
          isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
        )}>
          <Package className="h-16 w-16 mx-auto mb-4 text-brand-red opacity-80" />
          <h2 className="text-2xl font-black mb-2">Invoice Not Found</h2>
          <p className="text-sm opacity-80 mb-6">
            The invoice #{invoiceId} does not exist or has been removed.
          </p>
          <Link href="/admin/invoices">
            <Button className="bg-navy hover:bg-navy/85 text-white font-bold rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoices
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const formattedDate = invoice.created_at ? new Date(invoice.created_at).toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }) : "Date unavailable"

  const itemColumns: AdminTableColumn<InvoiceItem>[] = [
    {
      key: "item",
      header: "Item Details",
      cellClassName: "max-w-[240px]",
      render: (item) => (
        <AdminPrimaryCell
          icon={Package}
          title={item.name}
          subtitle={item.id ? `Catalog reference: ${item.id}` : "Custom / uncatalogued item"}
          badge={<AdminTag>Shop</AdminTag>}
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

  const itemActions: AdminTableAction<InvoiceItem>[] = [
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
          icon: FileText,
          span: 2,
          fields: [
            { label: "Item Name", value: selectedItem.name },
            {
              label: "Catalog Reference",
              value: selectedItem.id ? (
                <AdminTag title={selectedItem.id}>#{selectedItem.id}</AdminTag>
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
        title={`Invoice #${invoice.invoice_number}`}
        accent="Details"
        subtitle={`Issued on ${formattedDate}`}
        icon={FileText}
        onRefresh={loadInvoice}
        actions={
          <>
            <Link href="/admin/invoices">
              <Button
                variant="outline"
                size="sm"
                className="font-bold rounded-xl h-10 px-4 border-2 border-navy/20 bg-white text-navy hover:bg-teal-50 dark:border-teal/30 dark:bg-transparent dark:text-white dark:hover:bg-teal/10"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back to Invoices
              </Button>
            </Link>
            <Button
              onClick={() => printInvoiceDocument(invoice)}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl shadow-md flex items-center gap-2 h-10 px-4"
            >
              <Printer className="h-4 w-4 text-white" />
              Print Invoice
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(true)}
              disabled={isDeleting}
              className="rounded-xl border-brand-red/40 text-brand-red hover:bg-brand-red/10 font-bold h-10 px-4 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Invoice
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Invoice Items & Financials */}
        <div className="lg:col-span-2 space-y-6">
          <AdminTable
            columns={itemColumns}
            data={invoice.items || []}
            rowKey={(item) => String(item.id || `${item.name}-${item.price}-${item.quantity}`)}
            actions={itemActions}
            emptyIcon={Package}
            emptyTitle="No item records on this invoice."
            footer={
              <tfoot>
                <tr>
                  <td colSpan={itemColumns.length + itemActions.length} className="p-4 sm:p-6 border-t border-navy/10 dark:border-teal/20 bg-slate-50/50 dark:bg-[#070d2b]/50">
                    <div className="max-w-xs ml-auto space-y-2">
                      <div className="flex justify-between text-sm whitespace-nowrap">
                        <span className="opacity-70">Subtotal:</span>
                        <span className="font-bold">TSH {Number(invoice.total).toLocaleString()}</span>
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
                          TSH {Number(invoice.total).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            }
          />

          <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">
            ID: #{invoice.id.slice(0, 12)}
          </p>
        </div>

        {/* Right 1 Column: Invoice Status & Customer Information */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl border-2 p-5 shadow-lg space-y-4",
            isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
          )}>
            <div className="border-b border-navy/10 dark:border-teal/20 pb-3">
              <h3 className="text-base font-black flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-navy dark:text-white" />
                Manage Invoice Status
              </h3>
              <p className="text-xs opacity-70">Update payment & delivery status</p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1.5">
                  Current Status
                </p>
                {statusBadge(invoice.status)}
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

            {invoice.notes && (
              <div className={cn(
                "p-3 rounded-xl border text-xs leading-relaxed",
                isDark ? "bg-[#060a22]/80 border-teal/20 text-slate-300" : "bg-teal-50/70 border-navy/10 text-navy/90"
              )}>
                <span className="font-bold">Reference:</span> {invoice.notes}
              </div>
            )}
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
              <p className="text-xs opacity-70">Client profile & billing details</p>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-navy dark:text-teal mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60">Full Name</p>
                  <p className="font-bold text-sm">{invoice.customer_name || "Customer Name Not Provided"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-navy dark:text-teal mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60">Email Address</p>
                  <p className="font-medium text-sm truncate">{invoice.customer_email || "No email on record"}</p>
                </div>
              </div>

              {invoice.customer_phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-navy dark:text-teal mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider opacity-60">Phone Contact</p>
                    <p className="font-medium text-sm">{invoice.customer_phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-navy dark:text-teal mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60">Billing / Delivery Address</p>
                  <p className="font-medium text-sm leading-relaxed">{invoice.customer_address || "Tanzania"}</p>
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
        badge={selectedItem?.id ? <AdminTag>Ref #{selectedItem.id}</AdminTag> : undefined}
        subtitle="Invoice line item specification and pricing"
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
        title="Change Invoice Status"
        description="Update the payment and delivery status of this invoice."
        onSubmit={handleStatusSubmit}
        isSubmitting={isUpdatingStatus}
        isEdit
        editLabel="Update Status"
      >
        <AdminFormGrid>
          <AdminFormField label="Invoice Status" required>
            <AdminSelect
              value={statusDraft}
              onValueChange={(val) => setStatusDraft(val as InvoiceStatus)}
              options={INVOICE_STATUS_OPTIONS}
            />
          </AdminFormField>
          <AdminFormField label="Current Status" hint="Shown for reference only">
            {statusBadge(invoice.status)}
          </AdminFormField>
        </AdminFormGrid>
      </AdminFormModal>

      {/* Destructive confirmation */}
      <AdminConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete invoice?"
        description={`Invoice #${invoice.invoice_number} will be permanently removed. This action cannot be undone.`}
        confirmLabel="Delete Invoice"
        onConfirm={handleDelete}
        isSubmitting={isDeleting}
      />

      {/* Printable Invoice View - active only when printing */}
      <div className="hidden print:flex w-full font-sans text-navy bg-transparent relative flex-col justify-between" style={{ width: '100%', minHeight: '297mm', padding: '10mm 14mm 10mm 14mm', boxSizing: 'border-box' }}>
        {/* Fixed Watermark that repeats on EVERY printed page */}
        <div className="print-watermark absolute inset-0 flex items-center justify-center pointer-events-none z-0" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 0 }}>
          <Image
            src="/turquoise.png"
            alt="QuardCubeLabs Watermark"
            width={350}
            height={350}
            className="object-contain opacity-20"
            priority
            unoptimized
          />
        </div>

        <div className="relative z-10 flex flex-col justify-between flex-1 w-full min-h-[calc(297mm-20mm)]">
          {/* Top Print Running Header with Generation Timestamp */}
          <div className="flex justify-between items-center text-[12px] text-navy/70 font-semibold border-b border-navy/15 pb-2 mb-4">
            <span>QUARDCUBE LABS &bull; TAX INVOICE</span>
            <span>{new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
          </div>

          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-navy tracking-tight uppercase">QUARDCUBELABS</h2>
              <p className="text-[18px] text-navy/80 font-medium">Your trusted partner in digital solutions</p>
              <p className="text-[18px] text-navy/80 font-medium mt-0.5">Email: info@quardcubelabs.co.tz</p>
              <p className="text-[18px] text-navy/80 font-medium">Website: www.quardcubelabs.co.tz</p>
            </div>
            <div className="text-right">
              <h1 className="text-3xl sm:text-4xl font-black text-navy mb-1.5 tracking-tight uppercase">INVOICE</h1>
              <p className="text-[18px] text-navy/80">Invoice #<span className="font-bold text-navy text-[18px]">{invoice.invoice_number}</span></p>
              <p className="text-[18px] text-navy/80">Date: <span className="font-bold text-navy text-[18px]">{new Date(invoice.created_at).toLocaleDateString()}</span></p>
              <p className="text-[18px] text-navy/80 mt-1.5">Status: <span className="font-bold capitalize text-navy text-[18px]">{invoice.status}</span></p>
            </div>
          </div>

          <hr className="border-navy/30 mb-6" />

          <div className="flex justify-between mb-6">
            <div className="w-1/2 pr-4">
              <h3 className="text-[18px] font-black text-navy mb-2 uppercase tracking-wider">From:</h3>
              <p className="text-[18px] text-navy font-bold uppercase">QUARDCUBELABS</p>
              <p className="text-[18px] text-navy/80">24 Ferry, Kigamboni</p>
              <p className="text-[18px] text-navy/80">Dar es Salaam 17101</p>
              <p className="text-[18px] text-navy/80">Tanzania</p>
              <p className="text-[18px] text-navy/80 mt-1">Phone: +255 652 540 496</p>
            </div>
            <div className="w-1/2 pl-4 text-right">
              <h3 className="text-[18px] font-black text-navy mb-2 uppercase tracking-wider">To:</h3>
              <p className="text-[18px] text-navy font-bold">{invoice.customer_name || "Customer"}</p>
              <p className="text-[18px] text-navy/80">{invoice.customer_email}</p>
              {invoice.customer_phone && (
                <p className="text-[18px] text-navy/80">Phone: {invoice.customer_phone}</p>
              )}
              {invoice.customer_address && (
                <p className="text-[18px] text-navy/80">{invoice.customer_address}</p>
              )}
            </div>
          </div>

          <div className="mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-navy/60 bg-transparent">
                  <th className="text-left text-[18px] font-black text-navy py-3 px-2 uppercase tracking-wider">Item</th>
                  <th className="text-right text-[18px] font-black text-navy py-3 px-2 w-20 uppercase tracking-wider">Qty</th>
                  <th className="text-right text-[18px] font-black text-navy py-3 px-2 w-36 uppercase tracking-wider">Unit Price</th>
                  <th className="text-right text-[18px] font-black text-navy py-3 px-2 w-36 uppercase tracking-wider">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={item.id || index} className="border-b border-navy/15" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <td className="text-[18px] text-navy/90 py-3.5 px-2 font-semibold">{item.name}</td>
                    <td className="text-right text-[18px] text-navy/90 py-3.5 px-2 w-20 font-bold">{item.quantity}</td>
                    <td className="text-right text-[18px] text-navy/90 py-3.5 px-2 w-36 font-bold whitespace-nowrap">TZS {Number(item.price).toFixed(2)}</td>
                    <td className="text-right text-[18px] text-navy py-3.5 px-2 w-36 font-black whitespace-nowrap">TZS {(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-start pt-4 border-t border-navy/10" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <div className="w-1/2 pr-6">
              <h3 className="text-[18px] font-black text-navy mb-2.5 uppercase tracking-wider">Payment Information:</h3>
              <p className="text-[18px] text-navy/80 mb-5 font-medium">Payment Method: Bank Transfer / Mobile Money / Office Pickup</p>
              <h3 className="text-[18px] font-black text-navy mb-2.5 uppercase tracking-wider">Terms & Conditions:</h3>
              <ol className="list-decimal list-inside text-[18px] text-navy/80 space-y-1.5 font-medium">
                <li>Goods are dispatched upon confirmation of 100% payment.</li>
                <li>Standard terms & conditions apply to all service deliverables.</li>
                <li>All payments should reference invoice #{invoice.invoice_number}.</li>
              </ol>
            </div>
            <div className="w-1/2 pl-6 text-right">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[18px] text-navy/80 font-medium">
                  <span>Subtotal:</span>
                  <span className="font-bold text-navy">TZS {Number(invoice.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[18px] text-navy/80 font-medium">
                  <span>Shipping Cost:</span>
                  <span className="font-bold text-green-600">TZS 0.00</span> 
                </div>
                <div className="flex justify-between text-[18px] text-navy/80 font-medium border-b border-navy/20 pb-1.5">
                  <span>Tax:</span>
                  <span className="font-bold text-navy">TZS 0.00</span> 
                </div>
                <div className="flex justify-between text-xl font-black text-navy pt-1.5">
                  <span>TOTAL DUE:</span>
                  <span>TZS {Number(invoice.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6 text-center text-[18px] text-navy/70 border-t border-navy/20" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
          <p>&copy; {new Date().getFullYear()} QuardCubeLabs. All rights reserved.</p>
          <p className="mt-1 font-bold text-navy">Thank you for your business!</p>

          {/* Bottom Print Running Footer with Page Number */}
          <div className="flex justify-between items-center text-[12px] text-navy/70 font-semibold border-t border-navy/15 pt-2 mt-4">
            <span>Invoice Ref: #{invoice.invoice_number}</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  )
}
