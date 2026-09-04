"use client"

import { useState, useEffect, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import { 
  ArrowLeft, 
  Package, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Trash2, 
  ExternalLink,
  ShieldCheck,
  Printer,
  Loader2
} from "lucide-react"
import AdminLoading from "@/components/admin/admin-loading"
import { getAdminInvoiceById, updateInvoiceStatus, deleteAdminInvoice, type AdminInvoice } from "@/lib/invoice-actions"
import { printInvoiceDocument } from "@/lib/print-invoice"

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>
}

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

  const handleStatusChange = async (newStatus: "draft" | "sent" | "paid" | "overdue" | "cancelled") => {
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

  const handleDelete = async () => {
    if (!invoice) return
    if (!confirm(`Are you sure you want to delete invoice #${invoice.invoice_number}?`)) {
      return
    }

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-600 text-white border-green-600 font-black px-3 py-1 text-xs uppercase tracking-wider shadow-xs">Paid & Completed</Badge>
      case "sent":
        return <Badge className="bg-teal text-navy border-teal font-black px-3 py-1 text-xs uppercase tracking-wider">Sent / Processing</Badge>
      case "draft":
        return <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 font-black px-3 py-1 text-xs uppercase tracking-wider">Draft / Pending</Badge>
      case "overdue":
        return <Badge className="bg-brand-red/20 text-brand-red border-brand-red/40 font-black px-3 py-1 text-xs uppercase tracking-wider">Overdue</Badge>
      case "cancelled":
        return <Badge className="bg-brand-red text-white border-brand-red font-black px-3 py-1 text-xs uppercase tracking-wider">Cancelled</Badge>
      default:
        return <Badge variant="outline" className="font-black px-3 py-1 text-xs capitalize">{status}</Badge>
    }
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

  return (
    <div className="min-h-screen pb-16 space-y-6 max-w-6xl mx-auto">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/invoices">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "rounded-xl h-10 px-3 font-bold transition-colors",
                isDark 
                  ? "border-teal/30 text-white hover:bg-teal/20" 
                  : "border-navy/20 text-navy hover:bg-navy/10"
              )}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Invoices
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className={cn("text-2xl sm:text-3xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
                Invoice #{invoice.invoice_number}
              </h1>
              {getStatusBadge(invoice.status)}
            </div>
            <p className={cn("text-xs sm:text-sm font-medium mt-0.5", isDark ? "text-teal-400/80" : "text-navy/70")}>
              Issued on {formattedDate}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => printInvoiceDocument(invoice)}
            className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl shadow-md flex items-center gap-2 h-10 px-4"
          >
            <Printer className="h-4 w-4 text-white" />
            <span>Print Invoice</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-xl border-brand-red/40 text-brand-red hover:bg-brand-red/10 font-bold h-10 px-4 flex items-center gap-2"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            <span>Delete Invoice</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Invoice Items & Financials */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Items Table Card */}
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl border-2 overflow-hidden shadow-lg transition-all",
            isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
          )}>
            <CardHeader className="p-4 sm:p-6 border-b border-navy/10 dark:border-teal/20 bg-teal/10 dark:bg-[#070d2b]">
              <CardTitle className="text-base sm:text-lg font-black flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-navy dark:text-white" />
                  Invoice Items ({invoice.items?.length || 0})
                </span>
                <span className="text-xs uppercase font-bold tracking-wider opacity-70">
                  ID: #{invoice.id.slice(0, 12)}
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                      <th className="text-left py-3 px-4">Item Details</th>
                      <th className="text-center py-3 px-4">Qty</th>
                      <th className="text-right py-3 px-4">Unit Price</th>
                      <th className="text-right py-3 px-4">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-slate-100")}>
                    {invoice.items && invoice.items.length > 0 ? (
                      invoice.items.map((item, idx) => (
                        <tr key={idx} className={cn("transition-colors duration-150 cursor-pointer group", isDark ? "hover:bg-teal/30 hover:text-white" : "hover:bg-teal/50 hover:text-navy")}>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl border-2 border-navy/15 bg-white p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {item.image ? (
                                  <img 
                                    src={item.image} 
                                    alt={item.name} 
                                    className="w-full h-full object-contain"
                                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
                                  />
                                ) : (
                                  <Package className="h-6 w-6 text-navy/40" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm truncate max-w-xs">{item.name}</p>
                                {item.id && (
                                  <Link 
                                    href={`/shop/${item.id}`} 
                                    target="_blank" 
                                    className="text-xs text-navy dark:text-white hover:underline flex items-center gap-1 font-medium mt-0.5"
                                  >
                                    View in Shop <ExternalLink className="h-3 w-3 text-navy dark:text-white" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center font-bold whitespace-nowrap">
                            <span className="w-6 h-6 rounded-full bg-navy/10 dark:bg-white/10 text-xs font-black inline-flex items-center justify-center">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right font-medium whitespace-nowrap">
                            TSH {Number(item.price).toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-right font-black whitespace-nowrap">
                            TSH {(Number(item.price) * Number(item.quantity)).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-sm opacity-60">
                          No item records on this invoice.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="p-4 sm:p-6 border-t border-navy/10 dark:border-teal/20 bg-slate-50/50 dark:bg-[#070d2b]/50">
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
              </div>
            </CardContent>
          </Card>
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

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider opacity-80">
                Change Status:
              </label>
              <Select
                value={invoice.status}
                onValueChange={(val: any) => handleStatusChange(val)}
                disabled={isUpdatingStatus}
              >
                <SelectTrigger className={cn(
                  "h-11 rounded-xl border-2 font-bold text-sm",
                  isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={cn("rounded-xl border-2", isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                  <SelectItem value="draft" className="font-bold">Draft / Pending</SelectItem>
                  <SelectItem value="sent" className="font-bold text-teal-600">Sent / Processing</SelectItem>
                  <SelectItem value="paid" className="font-bold text-green-600">Paid & Completed</SelectItem>
                  <SelectItem value="overdue" className="font-bold text-brand-red">Overdue</SelectItem>
                  <SelectItem value="cancelled" className="font-bold text-brand-red">Cancelled</SelectItem>
                </SelectContent>
              </Select>
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
                <User className="h-5 w-5 text-navy dark:text-white" />
                Customer Information
              </h3>
              <p className="text-xs opacity-70">Client profile & billing details</p>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-navy dark:text-white mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60">Full Name</p>
                  <p className="font-bold text-sm">{invoice.customer_name || "Customer Name Not Provided"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-navy dark:text-white mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60">Email Address</p>
                  <p className="font-medium text-sm truncate">{invoice.customer_email || "No email on record"}</p>
                </div>
              </div>

              {invoice.customer_phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-navy dark:text-white mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider opacity-60">Phone Contact</p>
                    <p className="font-medium text-sm">{invoice.customer_phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-navy dark:text-white mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60">Billing / Delivery Address</p>
                  <p className="font-medium text-sm leading-relaxed">{invoice.customer_address || "Tanzania"}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Printable Invoice View - active only when printing */}
      <div className="hidden print:block w-full p-0 m-0 font-sans text-navy bg-white">
        <div style={{ padding: '10mm 8mm' }}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-5">
              <Image 
                src="/turquoise.png" 
                alt="QuardCubeLabs Logo" 
                width={150} 
                height={150} 
                className="w-[150px] h-[150px] object-contain flex-shrink-0"
                priority
                unoptimized
              />
              <div>
                <h2 className="text-3xl font-black text-navy tracking-tight">QuardCubeLabs</h2>
                <p className="text-[15px] text-navy/80 font-medium">Your trusted partner in digital solutions</p>
                <p className="text-[15px] text-navy/80 font-medium mt-0.5">Email: info@quardcubelabs.co.tz</p>
                <p className="text-[15px] text-navy/80 font-medium">Website: www.quardcubelabs.co.tz</p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-navy mb-1">INVOICE</h1>
              <p className="text-xs text-navy/70">Invoice #<span className="font-semibold text-navy">{invoice.invoice_number}</span></p>
              <p className="text-xs text-navy/70">Date: <span className="font-semibold text-navy">{new Date(invoice.created_at).toLocaleDateString()}</span></p>
              <p className="text-xs text-navy/70 mt-2">Status: <span className="font-semibold capitalize text-navy">{invoice.status}</span></p>
            </div>
          </div>

          <hr className="border-navy/30 mb-6" />

          <div className="flex justify-between mb-6">
            <div className="w-1/2 pr-4">
              <h3 className="text-sm font-bold text-navy mb-2">From:</h3>
              <p className="text-xs text-navy/80 font-semibold">QuardCubeLabs Company Limited</p>
              <p className="text-xs text-navy/70">123 Kigamboni</p>
              <p className="text-xs text-navy/70">Dar es Salaam, Tanzania</p>
              <p className="text-xs text-navy/70 mt-1">Phone: +255 652540496</p>
            </div>
            <div className="w-1/2 pl-4 text-right">
              <h3 className="text-sm font-bold text-navy mb-2">To:</h3>
              <p className="text-xs text-navy/80 font-semibold">{invoice.customer_name || "Customer"}</p>
              <p className="text-xs text-navy/70">{invoice.customer_email}</p>
              {invoice.customer_phone && (
                <p className="text-xs text-navy/70">Phone: {invoice.customer_phone}</p>
              )}
              {invoice.customer_address && (
                <p className="text-xs text-navy/70">{invoice.customer_address}</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-navy/50 bg-transparent">
                  <th className="text-left text-xs font-bold text-navy py-2 px-2">Item</th>
                  <th className="text-right text-xs font-bold text-navy py-2 px-2 w-16">Qty</th>
                  <th className="text-right text-xs font-bold text-navy py-2 px-2 w-28">Unit Price</th>
                  <th className="text-right text-xs font-bold text-navy py-2 px-2 w-28">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={item.id || index} className="border-b border-navy/10">
                    <td className="text-xs text-navy/80 py-2 px-2">{item.name}</td>
                    <td className="text-right text-xs text-navy/80 py-2 px-2 w-16">{item.quantity}</td>
                    <td className="text-right text-xs text-navy/80 py-2 px-2 w-28">TZS {Number(item.price).toFixed(2)}</td>
                    <td className="text-right text-xs text-navy/80 py-2 px-2 w-28">TZS {(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between">
            <div className="w-1/2 pr-4">
              <h3 className="text-sm font-bold text-navy mb-2">Payment Information:</h3>
              <p className="text-xs text-navy/80 mb-3">Payment Method: Bank Transfer / Mobile Money / Office Pickup</p>
              <h3 className="text-sm font-bold text-navy mb-2">Terms & Conditions:</h3>
              <ol className="list-decimal list-inside text-xs text-navy/80 space-y-0.5">
                <li>Goods are dispatched upon confirmation of 100% payment.</li>
                <li>Standard terms & conditions apply to all service deliverables.</li>
                <li>All payments should reference invoice #{invoice.invoice_number}.</li>
              </ol>
            </div>
            <div className="w-1/2 pl-4 text-right">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-navy/80">
                  <span>Subtotal:</span>
                  <span>TZS {Number(invoice.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-navy/80">
                  <span>Shipping Cost:</span>
                  <span>TZS 0.00</span> 
                </div>
                <div className="flex justify-between text-xs text-navy/80 border-b border-navy/20 pb-1">
                  <span>Tax:</span>
                  <span>TZS 0.00</span> 
                </div>
                <div className="flex justify-between text-base font-bold text-navy pt-1">
                  <span>TOTAL DUE:</span>
                  <span>TZS {Number(invoice.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-navy/70">
            <p>&copy; {new Date().getFullYear()} QuardCubeLabs. All rights reserved.</p>
            <p className="mt-0.5">Thank you for your business!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
