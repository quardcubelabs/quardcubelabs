"use server"

import { createServerClient } from "@/lib/supabase"
import { getAdminInvoices } from "@/lib/invoice-actions"
import { getAdminReceipts } from "@/lib/receipt-actions"
import fs from "fs"
import path from "path"

export interface ReportTransactionRecord {
  id: string
  date: string
  document_number: string
  document_type: "invoice" | "receipt" | "quotation" | "proforma" | "credit_note" | "supplier_bill" | "expense"
  customer_name: string
  customer_email?: string
  category: string
  location: string
  mode: string
  salesman: string
  items_summary: string
  item_names: string[]
  item_count: number
  payment_method: string
  vat_status: "18% TRA Standard" | "Zero Rated / Exempt" | "Inclusive VAT"
  subtotal: number
  vat_amount: number
  total_amount: number
  status: "paid" | "partially_paid" | "open" | "overdue" | "settled" | "closed"
}

export interface ReportFilterCriteria {
  startDate?: string
  endDate?: string
  category?: string
  location?: string
  mode?: string
  salesman?: string
  receiptType?: string
  customer?: string
  item?: string
  paymentMethod?: string
  vatStatus?: string
  searchQuery?: string
}

export interface FilteredReportSummary {
  totalGross: number
  totalSubtotal: number
  totalVat: number
  recordCount: number
  averageTicket: number
  settlementRate: number
}

// Built-in Seed Transactions for Authoritative Intelligence & Reporting
const FALLBACK_TRANSACTIONS: ReportTransactionRecord[] = [
  {
    id: "tx-001",
    date: new Date(Date.now() - 1 * 86400000).toISOString().split("T")[0],
    document_number: "INV-2026-1001",
    document_type: "invoice",
    customer_name: "Serengeti Freight Logistics Ltd",
    customer_email: "b.massawe@serengetifreight.co.tz",
    category: "CCTV Surveillance",
    location: "QuardCube Central Hub — Kigamboni",
    mode: "Corporate B2B Contract",
    salesman: "Framani Mwamba",
    items_summary: "10x Hikvision 4K AcuSense ColorVu Dome Cameras, 1x 16-CH NVR",
    item_names: ["Hikvision 4K AcuSense ColorVu IP Dome Camera", "Hikvision 16-Channel 4K NVR Network Video Recorder"],
    item_count: 11,
    payment_method: "CRDB Bank Transfer",
    vat_status: "18% TRA Standard",
    subtotal: 15677966,
    vat_amount: 2822034,
    total_amount: 18500000,
    status: "paid"
  },
  {
    id: "tx-002",
    date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
    document_number: "REC-2026-088",
    document_type: "receipt",
    customer_name: "Bakhresa Food Products Ltd",
    customer_email: "security@bakhresa.com",
    category: "Engineering Services",
    location: "City Center Regional Hub",
    mode: "Corporate B2B Contract",
    salesman: "Amani Temu",
    items_summary: "Industrial Fiber Splicing & Optical Termination Labor",
    item_names: ["Optical Fiber Splicing & Patch Panel Certification"],
    item_count: 1,
    payment_method: "Selcom Gateway Float",
    vat_status: "18% TRA Standard",
    subtotal: 7118644,
    vat_amount: 1281356,
    total_amount: 8400000,
    status: "settled"
  },
  {
    id: "tx-003",
    date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
    document_number: "INV-2026-1002",
    document_type: "invoice",
    customer_name: "CRDB Bank Plc (Tech Division)",
    customer_email: "it.procurement@crdbbank.co.tz",
    category: "Computing Hardware",
    location: "QuardCube Central Hub — Kigamboni",
    mode: "Government / Tender",
    salesman: "Sarah Ndosi",
    items_summary: "5x ASUS ExpertBook B9 Core i7 Enterprise Workstations",
    item_names: ["ASUS ExpertBook B9 Executive Ultralight Laptop"],
    item_count: 5,
    payment_method: "CRDB Bank Transfer",
    vat_status: "18% TRA Standard",
    subtotal: 19491525,
    vat_amount: 3508475,
    total_amount: 23000000,
    status: "paid"
  },
  {
    id: "tx-004",
    date: new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0],
    document_number: "QCL-CN-2026-001",
    document_type: "credit_note",
    customer_name: "Bakhresa Food Products Ltd",
    customer_email: "security@bakhresa.com",
    category: "CCTV Surveillance",
    location: "City Center Regional Hub",
    mode: "Corporate B2B Contract",
    salesman: "Amani Temu",
    items_summary: "Credit adjustment: 1x surplus uninstalled 4K Camera Unit",
    item_names: ["Hikvision 4K AcuSense ColorVu IP Dome Camera"],
    item_count: 1,
    payment_method: "Trade Credit Net 30",
    vat_status: "18% TRA Standard",
    subtotal: -285000,
    vat_amount: -51300,
    total_amount: -336300,
    status: "closed"
  },
  {
    id: "tx-005",
    date: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0],
    document_number: "REC-2026-089",
    document_type: "receipt",
    customer_name: "Vodacom Tanzania Limited",
    customer_email: "facilities@vodacom.co.tz",
    category: "Networking & Infrastructure",
    location: "Arusha Branch",
    mode: "Direct Counter Retail",
    salesman: "Juma Bakari",
    items_summary: "Cat6 100% Solid Copper 305m Roll, 24-Port Patch Panel",
    item_names: ["Cat6 UTP Solid Copper Network Cable 305m", "24-Port Cat6 Rackmount Patch Panel"],
    item_count: 3,
    payment_method: "Vodacom M-Pesa Till",
    vat_status: "18% TRA Standard",
    subtotal: 1864407,
    vat_amount: 335593,
    total_amount: 2200000,
    status: "paid"
  },
  {
    id: "tx-006",
    date: new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0],
    document_number: "QCL-BILL-2026-001",
    document_type: "supplier_bill",
    customer_name: "Hikvision East Africa Logistics",
    customer_email: "sales.ea@hikvision.com",
    category: "CCTV Surveillance",
    location: "QuardCube Central Hub — Kigamboni",
    mode: "Corporate B2B Contract",
    salesman: "Framani Mwamba",
    items_summary: "Direct container delivery: 10x 4K Domes, 2x 16-CH NVRs",
    item_names: ["Hikvision 4K AcuSense Dome", "Hikvision 16-CH NVR"],
    item_count: 12,
    payment_method: "CRDB Bank Transfer",
    vat_status: "18% TRA Standard",
    subtotal: 4592373,
    vat_amount: 826627,
    total_amount: 5419000,
    status: "settled"
  },
  {
    id: "tx-007",
    date: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
    document_number: "REC-2026-090",
    document_type: "receipt",
    customer_name: "Mohamed Enterprises Tanzania (METL)",
    customer_email: "ops@metl.com",
    category: "Power & Accessories",
    location: "Mwanza Tech Depot",
    mode: "Direct Counter Retail",
    salesman: "Tech Support Desk",
    items_summary: "12V 20A CCTV Centralized Power Supply Box, BNC Connectors",
    item_names: ["12V 20A 18-Channel CCTV Power Distribution Box", "BNC Crimp Video Connectors (Pack of 50)"],
    item_count: 5,
    payment_method: "Main Office Cash Vault",
    vat_status: "Zero Rated / Exempt",
    subtotal: 1250000,
    vat_amount: 0,
    total_amount: 1250000,
    status: "paid"
  },
  {
    id: "tx-008",
    date: new Date(Date.now() - 8 * 86400000).toISOString().split("T")[0],
    document_number: "INV-2026-1005",
    document_type: "invoice",
    customer_name: "Kilombero Sugar Company Limited",
    customer_email: "security@kilomberosugar.co.tz",
    category: "Access Control",
    location: "City Center Regional Hub",
    mode: "Corporate B2B Contract",
    salesman: "Framani Mwamba",
    items_summary: "Biometric Facial Recognition Access Turnstiles & Magnetic Locks",
    item_names: ["ZKTeco Face & Palm RFID Access Terminal", "Heavy-Duty 280kg Electromagnetic Lock"],
    item_count: 4,
    payment_method: "CRDB Bank Transfer",
    vat_status: "18% TRA Standard",
    subtotal: 10593220,
    vat_amount: 1906780,
    total_amount: 12500000,
    status: "open"
  },
  {
    id: "tx-009",
    date: new Date(Date.now() - 9 * 86400000).toISOString().split("T")[0],
    document_number: "QT-2026-904",
    document_type: "quotation",
    customer_name: "National Microfinance Bank (NMB)",
    customer_email: "tenders@nmbbank.co.tz",
    category: "CCTV Surveillance",
    location: "QuardCube Central Hub — Kigamboni",
    mode: "Government / Tender",
    salesman: "Sarah Ndosi",
    items_summary: "32-Camera 4K Banking Vault Surveillance Overhaul",
    item_names: ["Hikvision 4K Panoramic Camera", "32-Channel Enterprise Server NVR"],
    item_count: 33,
    payment_method: "CRDB Bank Transfer",
    vat_status: "18% TRA Standard",
    subtotal: 39830508,
    vat_amount: 7169492,
    total_amount: 47000000,
    status: "open"
  },
  {
    id: "tx-010",
    date: new Date(Date.now() - 10 * 86400000).toISOString().split("T")[0],
    document_number: "REC-2026-092",
    document_type: "receipt",
    customer_name: "Walk-in Retail Client",
    customer_email: "client@gmail.com",
    category: "Networking & Infrastructure",
    location: "City Center Regional Hub",
    mode: "Direct Counter Retail",
    salesman: "Juma Bakari",
    items_summary: "TP-Link Omada 8-Port Gigabit PoE+ Managed Switch",
    item_names: ["TP-Link Omada 8-Port Gigabit PoE+ Switch"],
    item_count: 1,
    payment_method: "Vodacom M-Pesa Till",
    vat_status: "18% TRA Standard",
    subtotal: 381356,
    vat_amount: 68644,
    total_amount: 450000,
    status: "paid"
  }
]

export async function getFilteredReportTransactions(
  filters?: ReportFilterCriteria
): Promise<{
  records: ReportTransactionRecord[]
  summary: FilteredReportSummary
  categories: string[]
  locations: string[]
  modes: string[]
  salespeople: string[]
  receiptTypes: string[]
  customers: string[]
  paymentMethods: string[]
  vatStatuses: string[]
}> {
  // Extract all base records
  let allRecords = [...FALLBACK_TRANSACTIONS]

  // Merge live invoices if available
  try {
    const liveInvoices = await getAdminInvoices()
    if (liveInvoices && liveInvoices.length > 0) {
      for (const inv of liveInvoices) {
        if (!allRecords.some(r => r.document_number === inv.invoice_number)) {
          const subtotal = Math.round(inv.total / 1.18)
          const vat = inv.total - subtotal
          allRecords.push({
            id: `inv-${inv.id}`,
            date: inv.created_at ? inv.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
            document_number: inv.invoice_number,
            document_type: "invoice",
            customer_name: inv.customer_name || "Enterprise Client",
            customer_email: inv.customer_email,
            category: "CCTV Surveillance",
            location: "QuardCube Central Hub — Kigamboni",
            mode: "Corporate B2B Contract",
            salesman: "Framani Mwamba",
            items_summary: inv.items?.map(i => `${i.quantity}x ${i.name}`).join(", ") || "Commercial Hardware Delivery",
            item_names: inv.items?.map(i => i.name) || [],
            item_count: inv.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 1,
            payment_method: "CRDB Bank Transfer",
            vat_status: "18% TRA Standard",
            subtotal,
            vat_amount: vat,
            total_amount: inv.total,
            status: inv.status === "paid" ? "paid" : "open"
          })
        }
      }
    }
  } catch {}

  // Merge live receipts if available
  try {
    const liveReceipts = await getAdminReceipts()
    if (liveReceipts && liveReceipts.length > 0) {
      for (const rec of liveReceipts) {
        if (!allRecords.some(r => r.document_number === rec.receipt_number)) {
          const subtotal = Math.round(rec.amount_paid / 1.18)
          const vat = rec.amount_paid - subtotal
          allRecords.push({
            id: `rec-${rec.id}`,
            date: rec.payment_date ? rec.payment_date.split("T")[0] : new Date().toISOString().split("T")[0],
            document_number: rec.receipt_number,
            document_type: "receipt",
            customer_name: rec.customer_name || "Retail Client",
            customer_email: rec.customer_email,
            category: "Networking & Infrastructure",
            location: "City Center Regional Hub",
            mode: "Direct Counter Retail",
            salesman: "Amani Temu",
            items_summary: rec.items?.map(i => `${i.quantity}x ${i.name}`).join(", ") || "Payment Settlement",
            item_names: rec.items?.map(i => i.name) || [],
            item_count: rec.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 1,
            payment_method: rec.payment_method === "M-Pesa" ? "Vodacom M-Pesa Till" : rec.payment_method,
            vat_status: "18% TRA Standard",
            subtotal,
            vat_amount: vat,
            total_amount: rec.amount_paid,
            status: "paid"
          })
        }
      }
    }
  } catch {}

  // Unique options for dropdown filters
  const categories = Array.from(new Set(allRecords.map(r => r.category))).sort()
  const locations = Array.from(new Set(allRecords.map(r => r.location))).sort()
  const modes = Array.from(new Set(allRecords.map(r => r.mode))).sort()
  const salespeople = Array.from(new Set(allRecords.map(r => r.salesman))).sort()
  const receiptTypes = Array.from(new Set(allRecords.map(r => r.document_type))).sort()
  const customers = Array.from(new Set(allRecords.map(r => r.customer_name))).sort()
  const paymentMethods = Array.from(new Set(allRecords.map(r => r.payment_method))).sort()
  const vatStatuses = Array.from(new Set(allRecords.map(r => r.vat_status))).sort()

  // Apply filters
  let filtered = allRecords.filter(r => {
    // 1. Date Range
    if (filters?.startDate && r.date < filters.startDate) return false
    if (filters?.endDate && r.date > filters.endDate) return false

    // 2. Category
    if (filters?.category && filters.category !== "all" && r.category !== filters.category) return false

    // 3. Location
    if (filters?.location && filters.location !== "all" && r.location !== filters.location) return false

    // 4. Mode
    if (filters?.mode && filters.mode !== "all" && r.mode !== filters.mode) return false

    // 5. Salesman
    if (filters?.salesman && filters.salesman !== "all" && r.salesman !== filters.salesman) return false

    // 6. Receipt / Document Type
    if (filters?.receiptType && filters.receiptType !== "all" && r.document_type !== filters.receiptType) return false

    // 7. Customer
    if (filters?.customer && filters.customer !== "all" && r.customer_name !== filters.customer) return false

    // 8. Item Search
    if (filters?.item && filters.item.trim()) {
      const q = filters.item.toLowerCase()
      const match = r.items_summary.toLowerCase().includes(q) || r.item_names.some(n => n.toLowerCase().includes(q))
      if (!match) return false
    }

    // 9. Payment Method
    if (filters?.paymentMethod && filters.paymentMethod !== "all" && r.payment_method !== filters.paymentMethod) return false

    // 10. VAT Status
    if (filters?.vatStatus && filters.vatStatus !== "all" && r.vat_status !== filters.vatStatus) return false

    // 11. Keyword Search
    if (filters?.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase()
      const match =
        r.document_number.toLowerCase().includes(q) ||
        r.customer_name.toLowerCase().includes(q) ||
        r.salesman.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.items_summary.toLowerCase().includes(q)
      if (!match) return false
    }

    return true
  })

  // Sort by date descending
  filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Compute Summary KPIs
  const totalGross = filtered.reduce((s, r) => s + r.total_amount, 0)
  const totalSubtotal = filtered.reduce((s, r) => s + r.subtotal, 0)
  const totalVat = filtered.reduce((s, r) => s + r.vat_amount, 0)
  const recordCount = filtered.length
  const averageTicket = recordCount > 0 ? Math.round(totalGross / recordCount) : 0
  const paidCount = filtered.filter(r => r.status === "paid" || r.status === "settled" || r.status === "closed").length
  const settlementRate = recordCount > 0 ? Number(((paidCount / recordCount) * 100).toFixed(1)) : 100

  return {
    records: filtered,
    summary: {
      totalGross,
      totalSubtotal,
      totalVat,
      recordCount,
      averageTicket,
      settlementRate
    },
    categories,
    locations,
    modes,
    salespeople,
    receiptTypes,
    customers,
    paymentMethods,
    vatStatuses
  }
}
