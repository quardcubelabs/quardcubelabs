"use client"

import { useState, useEffect, useMemo } from "react"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { useAdmin } from "@/contexts/admin-context"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Plus,
  Search,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Laptop,
  Wifi,
  Receipt,
  Boxes,
  Lock,
  Headphones,
  Send,
  FileQuestion,
  RefreshCw,
} from "lucide-react"

interface SupportTicket {
  id: string
  ticketNumber: string
  subject: string
  category: "pos" | "network" | "billing" | "inventory" | "access" | "other"
  priority: "low" | "medium" | "high" | "critical"
  status: "open" | "in_progress" | "resolved"
  description: string
  submitterName: string
  submitterRole: string
  branchName: string
  createdAt: string
  resolutionNotes?: string
}

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: "tick-001",
    ticketNumber: "TICK-8041",
    subject: "Thermal receipt printer offline at POS Counter 2",
    category: "pos",
    priority: "high",
    status: "in_progress",
    description: "The Epson receipt printer is refusing to print receipt vouchers. Paper roll is full and USB link shows connected.",
    submitterName: "Zuberi Mwamburi",
    submitterRole: "Cashier",
    branchName: "Kariakoo Commercial Hub",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    resolutionNotes: "IT tech dispatched to inspect print spooler and reset driver.",
  },
  {
    id: "tick-002",
    ticketNumber: "TICK-8038",
    subject: "Inventory barcode reader calibration mismatch",
    category: "inventory",
    priority: "medium",
    status: "open",
    description: "Scanning Hikvision NVR barcodes reads prefix incorrectly on Warehouse Terminal A.",
    submitterName: "Amina Salum",
    submitterRole: "Stock Manager",
    branchName: "QuardCube HQ & Innovation Hub",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "tick-003",
    ticketNumber: "TICK-8029",
    subject: "Staff account password unlock request",
    category: "access",
    priority: "medium",
    status: "resolved",
    description: "Account locked after 3 incorrect password entries during morning shift handover.",
    submitterName: "Neema Kimaro",
    submitterRole: "Sales Associate",
    branchName: "Arusha Branch",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    resolutionNotes: "Password credentials verified and temporary reset issued via SMS.",
  },
  {
    id: "tick-004",
    ticketNumber: "TICK-8022",
    subject: "Proforma invoice tax calculation verification for bulk purchase",
    category: "billing",
    priority: "low",
    status: "resolved",
    description: "Client requested 18% VAT exemption breakdown on government tender quotation.",
    submitterName: "Juma Bakari",
    submitterRole: "Accountant",
    branchName: "QuardCube HQ & Innovation Hub",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    resolutionNotes: "TIN and exemption certificate appended. Invoice cleared.",
  },
]

const FAQ_ITEMS = [
  {
    id: "faq-1",
    question: "How do I issue and convert a Proforma Invoice into a finalized Tax Invoice?",
    answer: "Navigate to 'Proforma Invoices' in the sidebar, select the approved proforma document, click 'Actions' and select 'Convert to Tax Invoice'. The system will generate a verified document with QR verification code and assign sequential invoice numbering.",
    icon: Receipt,
  },
  {
    id: "faq-2",
    question: "What should staff do if local internet disconnects during POS checkout?",
    answer: "QuardCube ERP runs local offline cache mode. Transactions completed offline will queue securely in the browser storage and automatically sync with the cloud database as soon as network connectivity is restored.",
    icon: Wifi,
  },
  {
    id: "faq-3",
    question: "How can branch managers add new staff members and grant role permissions?",
    answer: "Staff with 'Manage Staff' permissions can open 'Staff' under General in the sidebar, click 'Add Staff Member', fill out personal details, select their role (Cashier, Accountant, Stock Manager, Manager), and assign their primary branch.",
    icon: Lock,
  },
  {
    id: "faq-4",
    question: "How do I export monthly financial, sales, or inventory reports?",
    answer: "Go to 'Reports' in the sidebar. Select the desired category (Financial, Sales, Inventory, Audit Logs), choose your preferred timeframe, and click 'Export Report'. You can download in PDF format or Excel spreadsheet.",
    icon: Boxes,
  },
  {
    id: "faq-5",
    question: "How do I troubleshoot CCTV camera latency or disconnected feeds?",
    answer: "Open the 'CCTV Operations' dashboard. Check the device ping status. If a camera shows 'Offline', ensure POE network switch port has link activity. Contact 24/7 technical dispatch if remote IP tunnel is unresponsive.",
    icon: Laptop,
  },
]

export default function AdminHelpPage() {
  const { isDark } = useAdminTheme()
  const { user, roleName } = useAdmin()
  const { toast } = useToast()

  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [activeTab, setActiveTab] = useState<"all" | "open" | "in_progress" | "resolved">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  // Ticket creation modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newSubject, setNewSubject] = useState("")
  const [newCategory, setNewCategory] = useState<SupportTicket["category"]>("pos")
  const [newPriority, setNewPriority] = useState<SupportTicket["priority"]>("medium")
  const [newBranch, setNewBranch] = useState("QuardCube HQ & Innovation Hub")
  const [newDescription, setNewDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Ticket detail view modal state
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [statusNote, setStatusNote] = useState("")

  // Load tickets from localStorage or initial seed
  useEffect(() => {
    try {
      const stored = localStorage.getItem("quardcube_admin_help_tickets")
      if (stored) {
        setTickets(JSON.parse(stored))
      } else {
        setTickets(INITIAL_TICKETS)
        localStorage.setItem("quardcube_admin_help_tickets", JSON.stringify(INITIAL_TICKETS))
      }
    } catch {
      setTickets(INITIAL_TICKETS)
    }
  }, [])

  const saveTickets = (updated: SupportTicket[]) => {
    setTickets(updated)
    try {
      localStorage.setItem("quardcube_admin_help_tickets", JSON.stringify(updated))
    } catch (e) {
      console.error("Failed to save help tickets:", e)
    }
  }

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (activeTab !== "all" && t.status !== activeTab) return false
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          t.ticketNumber.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.submitterName.toLowerCase().includes(q) ||
          t.branchName.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [tickets, activeTab, categoryFilter, searchQuery])

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      inProgress: tickets.filter((t) => t.status === "in_progress").length,
      resolved: tickets.filter((t) => t.status === "resolved").length,
    }
  }, [tickets])

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubject.trim() || !newDescription.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please enter a subject and a clear issue description.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const newTicket: SupportTicket = {
      id: `tick-${Date.now()}`,
      ticketNumber: `TICK-${randomNum}`,
      subject: newSubject.trim(),
      category: newCategory,
      priority: newPriority,
      status: "open",
      description: newDescription.trim(),
      submitterName: (user as any)?.staffMember?.full_name || user?.email?.split("@")[0] || "Staff Member",
      submitterRole: roleName || "Staff",
      branchName: (user as any)?.staffMember?.branch_name || newBranch,
      createdAt: new Date().toISOString(),
    }

    const updated = [newTicket, ...tickets]
    saveTickets(updated)
    setIsSubmitting(false)
    setIsCreateOpen(false)
    setNewSubject("")
    setNewDescription("")

    toast({
      title: "Support Ticket Logged",
      description: `Ticket ${newTicket.ticketNumber} submitted to IT & Help Desk dispatch.`,
    })
  }

  const handleUpdateStatus = (ticketId: string, newStatus: SupportTicket["status"]) => {
    const updated = tickets.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: newStatus,
          resolutionNotes: statusNote ? statusNote : t.resolutionNotes,
        }
      }
      return t
    })
    saveTickets(updated)
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({
        ...selectedTicket,
        status: newStatus,
        resolutionNotes: statusNote ? statusNote : selectedTicket.resolutionNotes,
      })
    }
    setStatusNote("")
    toast({
      title: "Ticket Status Updated",
      description: `Ticket marked as ${newStatus.replace("_", " ")}.`,
    })
  }

  const getPriorityBadge = (p: SupportTicket["priority"]) => {
    switch (p) {
      case "critical":
        return <Badge className="bg-rose-500/15 text-rose-500 border border-rose-500/30 text-[10px] font-bold">Critical</Badge>
      case "high":
        return <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[10px] font-bold">High</Badge>
      case "medium":
        return <Badge className="bg-blue-500/15 text-blue-500 border border-blue-500/30 text-[10px] font-bold">Medium</Badge>
      default:
        return <Badge className="bg-slate-500/15 text-slate-500 border border-slate-500/30 text-[10px] font-bold">Low</Badge>
    }
  }

  const getStatusBadge = (s: SupportTicket["status"]) => {
    switch (s) {
      case "resolved":
        return <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[10px] font-bold">Resolved</Badge>
      case "in_progress":
        return <Badge className="bg-teal-500/15 text-teal-500 border border-teal-500/30 text-[10px] font-bold">In Progress</Badge>
      default:
        return <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[10px] font-bold">Open</Badge>
    }
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* 1. Header Card with Round Icon */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 transition-all duration-300",
        isDark ? "bg-[#0a1033] text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
            <div className={cn(
              "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 shadow-md",
              isDark 
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" 
                : "bg-navy text-teal border border-navy/20"
            )}>
              <HelpCircle className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-1">
                Help &amp; <span className={cn(isDark ? "text-teal-300" : "text-white drop-shadow-sm")}>Support Desk</span>
              </h1>
              <p className={cn("text-sm sm:text-base font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
                Internal staff assistance, issue ticketing, system status &amp; operational knowledge base
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto shrink-0">
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-4 shadow-md transition-all active:scale-95 flex-1 sm:flex-none"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Support Ticket
            </Button>
            <a
              href="https://wa.me/255623893383?text=Hello%20QuardCube%20IT%20Support%2C%20I%20need%20urgent%20staff%20assistance."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center font-bold rounded-xl h-10 px-4 border-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all text-xs sm:text-sm flex-1 sm:flex-none"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              WhatsApp Dispatch
            </a>
          </div>
        </div>
      </div>

      {/* 2. Emergency Contact & System Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className={cn(
          "rounded-2xl transition-all duration-300",
          isDark ? "bg-[#0a1033] border-none shadow-md" : "bg-white border-2 border-navy/20 shadow-sm"
        )}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center shrink-0 border",
              isDark ? "bg-navy text-teal border-teal/30" : "bg-teal-100 text-navy border-teal/30"
            )}>
              <Phone className="h-5 w-5 text-teal" />
            </div>
            <div className="min-w-0">
              <span className={cn("text-[11px] font-bold uppercase tracking-wider block", isDark ? "text-teal-400/80" : "text-navy/70")}>
                24/7 Tech Hotline
              </span>
              <a href="tel:+255623893383" className={cn("text-sm sm:text-base font-black truncate block hover:underline", isDark ? "text-white" : "text-navy")}>
                +255 623 893 383
              </a>
              <span className="text-[10px] text-teal-500 font-semibold">Immediate Dispatch</span>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "rounded-2xl transition-all duration-300",
          isDark ? "bg-[#0a1033] border-none shadow-md" : "bg-white border-2 border-navy/20 shadow-sm"
        )}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center shrink-0 border",
              isDark ? "bg-navy text-teal border-teal/30" : "bg-teal-100 text-navy border-teal/30"
            )}>
              <Mail className="h-5 w-5 text-teal" />
            </div>
            <div className="min-w-0">
              <span className={cn("text-[11px] font-bold uppercase tracking-wider block", isDark ? "text-teal-400/80" : "text-navy/70")}>
                Support Email
              </span>
              <a href="mailto:support@quardcubelabs.co.tz" className={cn("text-xs sm:text-sm font-black truncate block hover:underline", isDark ? "text-white" : "text-navy")}>
                support@quardcubelabs.co.tz
              </a>
              <span className="text-[10px] text-teal-500 font-semibold">Max 2h Response</span>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "rounded-2xl transition-all duration-300",
          isDark ? "bg-[#0a1033] border-none shadow-md" : "bg-white border-2 border-navy/20 shadow-sm"
        )}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center shrink-0 border",
              isDark ? "bg-navy text-teal border-teal/30" : "bg-teal-100 text-navy border-teal/30"
            )}>
              <MapPin className="h-5 w-5 text-teal" />
            </div>
            <div className="min-w-0">
              <span className={cn("text-[11px] font-bold uppercase tracking-wider block", isDark ? "text-teal-400/80" : "text-navy/70")}>
                Primary Tech HQ
              </span>
              <span className={cn("text-xs sm:text-sm font-black truncate block", isDark ? "text-white" : "text-navy")}>
                Dar es Salaam, TZ
              </span>
              <span className="text-[10px] text-teal-500 font-semibold">Innovation Hub</span>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "rounded-2xl transition-all duration-300",
          isDark ? "bg-[#0a1033] border-none shadow-md" : "bg-white border-2 border-navy/20 shadow-sm"
        )}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center shrink-0 border",
              isDark ? "bg-navy text-emerald-400 border-emerald-400/30" : "bg-emerald-100 text-emerald-700 border-emerald-200"
            )}>
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <span className={cn("text-[11px] font-bold uppercase tracking-wider block", isDark ? "text-teal-400/80" : "text-navy/70")}>
                System Status
              </span>
              <span className="text-xs sm:text-sm font-black text-emerald-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                99.98% Operational
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">All nodes synchronized</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Ticket Management Section */}
      <Card className={cn(
        "rounded-2xl transition-all duration-300",
        isDark ? "bg-[#0a1033] border-none shadow-lg" : "bg-white border-2 border-navy/20 shadow-md"
      )}>
        <CardHeader className="p-4 sm:p-6 pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className={cn("text-lg sm:text-xl font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                <Headphones className="h-5 w-5 text-teal" />
                Staff Support Tickets
              </CardTitle>
              <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                Log and track operational hardware, POS, billing, and access issues
              </CardDescription>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-navy/10 dark:border-teal/20">
              {[
                { key: "all", label: "All Tickets", count: stats.total },
                { key: "open", label: "Open", count: stats.open },
                { key: "in_progress", label: "In Progress", count: stats.inProgress },
                { key: "resolved", label: "Resolved", count: stats.resolved },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5",
                    activeTab === tab.key
                      ? "bg-navy text-white shadow-sm"
                      : "text-navy/70 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                  )}
                >
                  <span>{tab.label}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-black",
                    activeTab === tab.key ? "bg-teal text-navy" : "bg-navy/10 dark:bg-white/10"
                  )}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal" />
              <Input
                placeholder="Search tickets by subject, staff, ticket number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-9 h-9 text-xs sm:text-sm rounded-xl border border-teal",
                  isDark ? "bg-[#0c1438] text-white" : "bg-white text-navy"
                )}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className={cn(
                "w-full sm:w-48 h-9 text-xs font-bold rounded-xl border-2",
                isDark ? "bg-[#0c1438] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
              )}>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="pos">POS &amp; Thermal Printer</SelectItem>
                <SelectItem value="network">Network &amp; Internet</SelectItem>
                <SelectItem value="billing">Invoicing &amp; Billing</SelectItem>
                <SelectItem value="inventory">Inventory &amp; Barcode</SelectItem>
                <SelectItem value="access">Access &amp; Security</SelectItem>
                <SelectItem value="other">General Inquiries</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 text-[11px] uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                  <th className="text-left py-3 px-4">Ticket</th>
                  <th className="text-left py-3 px-3">Subject</th>
                  <th className="text-left py-3 px-3">Category</th>
                  <th className="text-left py-3 px-3">Priority</th>
                  <th className="text-left py-3 px-3">Status</th>
                  <th className="text-left py-3 px-3">Submitter</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-slate-100")}>
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={cn(
                        "transition-colors cursor-pointer text-xs",
                        isDark ? "hover:bg-white/5" : "hover:bg-teal-50/80"
                      )}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={cn("font-black block", isDark ? "text-teal-300" : "text-navy")}>
                          #{ticket.ticketNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={cn("font-bold block line-clamp-1 max-w-[240px] sm:max-w-[320px]", isDark ? "text-white" : "text-navy")}>
                          {ticket.subject}
                        </span>
                        <span className="text-[11px] text-slate-400 line-clamp-1 max-w-[240px] sm:max-w-[320px]">
                          {ticket.description}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="capitalize font-semibold text-xs text-navy/70 dark:text-slate-300">
                          {ticket.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getPriorityBadge(ticket.priority)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getStatusBadge(ticket.status)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={cn("font-semibold block", isDark ? "text-slate-200" : "text-navy")}>
                          {ticket.submitterName}
                        </span>
                        <span className="text-[10px] text-slate-400">{ticket.branchName}</span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedTicket(ticket)
                          }}
                          className="h-8 text-xs font-bold text-teal hover:text-navy dark:hover:text-white"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-navy/60 font-medium">
                      No tickets match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 4. Operational Knowledge Base & Troubleshooting Guides */}
      <Card className={cn(
        "rounded-2xl transition-all duration-300",
        isDark ? "bg-[#0a1033] border-none shadow-lg" : "bg-white border-2 border-navy/20 shadow-md"
      )}>
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className={cn("text-lg sm:text-xl font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
            <FileQuestion className="h-5 w-5 text-teal" />
            Standard Operating Procedures &amp; Troubleshooting
          </CardTitle>
          <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
            Frequently asked operational questions and quick self-help guides for staff members
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {FAQ_ITEMS.map((faq) => {
              const Icon = faq.icon
              return (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className={cn(
                    "border rounded-xl px-4 py-1 transition-all",
                    isDark ? "border-teal/20 bg-white/5" : "border-navy/10 bg-slate-50/60"
                  )}
                >
                  <AccordionTrigger className="hover:no-underline text-left py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center shrink-0 border",
                        isDark ? "bg-navy text-teal border-teal/30" : "bg-navy text-teal border-navy/20"
                      )}>
                        <Icon className="h-3.5 w-3.5 text-teal" />
                      </div>
                      <span className={cn("text-sm font-bold", isDark ? "text-white" : "text-navy")}>
                        {faq.question}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm font-medium pl-10 text-navy/80 dark:text-slate-300 pb-3 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Modal: Create Support Ticket */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={cn(
          "w-[94vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl",
          isDark ? "bg-[#0c1438] text-white border-teal/30" : "bg-white text-navy border-navy/20"
        )}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Headphones className="h-5 w-5 text-teal" />
              Submit IT Support Ticket
            </DialogTitle>
            <DialogDescription className="text-xs text-navy/70 dark:text-slate-400">
              Provide incident details to dispatch to our support engineers.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTicket} className="space-y-3.5 pt-2">
            <div>
              <label className="text-xs font-bold block mb-1">Issue Subject *</label>
              <Input
                placeholder="e.g. POS Thermal printer offline, network outage..."
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                required
                className="h-9 text-xs sm:text-sm rounded-xl border border-teal"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold block mb-1">Category</label>
                <Select value={newCategory} onValueChange={(val: any) => setNewCategory(val)}>
                  <SelectTrigger className="h-9 text-xs font-semibold rounded-xl border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pos">POS &amp; Thermal Printer</SelectItem>
                    <SelectItem value="network">Network &amp; Internet</SelectItem>
                    <SelectItem value="billing">Invoicing &amp; Billing</SelectItem>
                    <SelectItem value="inventory">Inventory &amp; Barcode</SelectItem>
                    <SelectItem value="access">Access &amp; Security</SelectItem>
                    <SelectItem value="other">General Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Priority</label>
                <Select value={newPriority} onValueChange={(val: any) => setNewPriority(val)}>
                  <SelectTrigger className="h-9 text-xs font-semibold rounded-xl border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (General)</SelectItem>
                    <SelectItem value="medium">Medium (Impaired)</SelectItem>
                    <SelectItem value="high">High (Urgent)</SelectItem>
                    <SelectItem value="critical">Critical (Store Down)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Branch Location</label>
              <Input
                value={newBranch}
                onChange={(e) => setNewBranch(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Description &amp; Steps to Reproduce *</label>
              <Textarea
                rows={4}
                placeholder="Describe what happened, any error messages displayed, and what troubleshooting steps were already attempted..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                required
                className="text-xs sm:text-sm rounded-xl border border-teal"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl h-9 text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-9 px-4 text-xs"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Submit Ticket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: View Ticket Details & Update Status */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        {selectedTicket && (
          <DialogContent className={cn(
            "w-[94vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl",
            isDark ? "bg-[#0c1438] text-white border-teal/30" : "bg-white text-navy border-navy/20"
          )}>
            <DialogHeader>
              <div className="flex items-center justify-between pr-4">
                <span className="font-mono text-xs font-black text-teal">#{selectedTicket.ticketNumber}</span>
                <div className="flex items-center gap-2">
                  {getPriorityBadge(selectedTicket.priority)}
                  {getStatusBadge(selectedTicket.status)}
                </div>
              </div>
              <DialogTitle className="text-base font-bold text-left pt-1">
                {selectedTicket.subject}
              </DialogTitle>
              <DialogDescription className="text-xs text-left">
                Logged by {selectedTicket.submitterName} ({selectedTicket.submitterRole}) at {selectedTicket.branchName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2 text-xs">
              <div className={cn("p-3 rounded-xl border", isDark ? "bg-white/5 border-teal/20" : "bg-slate-50 border-navy/10")}>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Issue Details</span>
                <p className="leading-relaxed font-medium">{selectedTicket.description}</p>
              </div>

              {selectedTicket.resolutionNotes && (
                <div className={cn("p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10")}>
                  <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block mb-1">
                    Resolution / Engineering Notes
                  </span>
                  <p className="leading-relaxed font-medium">{selectedTicket.resolutionNotes}</p>
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold block">Add Staff Note / Update</label>
                <Input
                  placeholder="e.g. Printer driver reinstalled; testing receipt print."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="h-8 text-xs rounded-xl"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-navy/10 dark:border-white/10">
                <span className="text-[10px] text-slate-400">Change Status:</span>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus(selectedTicket.id, "open")}
                    className={cn(
                      "h-7 text-[10px] font-bold rounded-lg border",
                      selectedTicket.status === "open" ? "bg-amber-500/20 text-amber-500 border-amber-500/40" : ""
                    )}
                  >
                    Open
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus(selectedTicket.id, "in_progress")}
                    className={cn(
                      "h-7 text-[10px] font-bold rounded-lg border",
                      selectedTicket.status === "in_progress" ? "bg-teal-500/20 text-teal-500 border-teal-500/40" : ""
                    )}
                  >
                    In Progress
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedTicket.id, "resolved")}
                    className={cn(
                      "h-7 text-[10px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                    )}
                  >
                    Mark Resolved
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
