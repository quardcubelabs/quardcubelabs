"use client"

import { useState, useEffect, useMemo } from "react"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { useAdmin } from "@/contexts/admin-context"
import { cn } from "@/lib/utils"
import { CardTitleIcon } from "@/components/admin/card-title-icon"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
  AdminDetailSection,
  AdminFormModal,
  AdminFormGrid,
  AdminFormField,
  AdminInput,
  AdminTextarea,
  AdminSelect,
  type AdminTableColumn,
  type AdminTableAction,
} from "@/components/admin/ui"
import {
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  MessageSquare,
  Headphones,
  FileQuestion,
  Receipt,
  Wifi,
  Lock,
  Boxes,
  Laptop,
  Eye,
  Clock,
  AlertCircle,
  CheckCircle2,
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

const CATEGORY_OPTIONS = [
  { value: "pos", label: "POS & Thermal Printer" },
  { value: "network", label: "Network & Internet" },
  { value: "billing", label: "Invoicing & Billing" },
  { value: "inventory", label: "Inventory & Barcode" },
  { value: "access", label: "Access & Security" },
  { value: "other", label: "General Inquiries" },
]

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low (General)" },
  { value: "medium", label: "Medium (Impaired)" },
  { value: "high", label: "High (Urgent)" },
  { value: "critical", label: "Critical (Store Down)" },
]

const PRIORITY_CLASS: Record<SupportTicket["priority"], string> = {
  critical: "bg-rose-500/15 text-rose-500 border-rose-500/30",
  high: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  medium: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  low: "bg-slate-500/15 text-slate-500 border-slate-500/30",
}

const STATUS_LABEL: Record<SupportTicket["status"], string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
}

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

  const priorityPill = (priority: SupportTicket["priority"]) => (
    <AdminPill className={cn("normal-case tracking-normal text-[10px]", PRIORITY_CLASS[priority])}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </AdminPill>
  )

  const columns: AdminTableColumn<SupportTicket>[] = [
    {
      key: "ticket",
      header: "Ticket",
      render: (ticket) => (
        <AdminPrimaryCell
          title={<span className="font-mono font-black text-teal">#{ticket.ticketNumber}</span>}
          subtitle={new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        />
      ),
    },
    {
      key: "subject",
      header: "Subject",
      render: (ticket) => (
        <AdminPrimaryCell
          title={<span className="line-clamp-1 max-w-[240px] sm:max-w-[320px]">{ticket.subject}</span>}
          subtitle={<span className="line-clamp-1 max-w-[240px] sm:max-w-[320px]">{ticket.description}</span>}
        />
      ),
    },
    {
      key: "category",
      header: "Category",
      hidden: "sm",
      render: (ticket) => <AdminPill className="normal-case tracking-normal">{ticket.category}</AdminPill>,
    },
    {
      key: "priority",
      header: "Priority",
      render: (ticket) => priorityPill(ticket.priority),
    },
    {
      key: "status",
      header: "Status",
      render: (ticket) => <AdminStatusBadge status={ticket.status} label={STATUS_LABEL[ticket.status]} />,
    },
    {
      key: "submitter",
      header: "Submitter",
      hidden: "md",
      render: (ticket) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">{ticket.submitterName}</span>
          <AdminMutedText>{ticket.branchName}</AdminMutedText>
        </div>
      ),
    },
  ]

  const actions: AdminTableAction<SupportTicket>[] = [
    {
      key: "view",
      label: "View Ticket Details",
      icon: Eye,
      variant: "view",
      onClick: (ticket) => { setSelectedTicket(ticket); setStatusNote("") },
    },
  ]

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 pb-12 overflow-hidden">
      <AdminPageHeader
        title="Help &"
        accent="Support Desk"
        subtitle="Internal staff assistance, issue ticketing, system status & operational knowledge base"
        icon={HelpCircle}
        onAdd={() => setIsCreateOpen(true)}
        addLabel="New Support Ticket"
        actions={
          <a
            href="https://wa.me/255623893383?text=Hello%20QuardCube%20IT%20Support%2C%20I%20need%20urgent%20staff%20assistance."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center font-bold rounded-xl h-10 px-4 border-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all text-xs sm:text-sm flex-1 sm:flex-none"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            WhatsApp Dispatch
          </a>
        }
      />

      {/* Emergency Contact & System Status Cards */}
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

      {/* Ticket Management Section */}
      <div className="space-y-4">
        <div>
          <h2 className={cn("text-lg sm:text-xl font-bold flex items-center gap-2.5", isDark ? "text-white" : "text-navy")}>
            <CardTitleIcon icon={Headphones} isDark={isDark} />
            Staff Support Tickets
          </h2>
          <p className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
            Log and track operational hardware, POS, billing, and access issues
          </p>
        </div>

        <AdminStats
          columns={4}
          items={[
            { title: "Total Tickets", value: stats.total, icon: FileQuestion },
            { title: "Open", value: stats.open, icon: AlertCircle },
            { title: "In Progress", value: stats.inProgress, icon: Clock },
            { title: "Resolved", value: stats.resolved, icon: CheckCircle2 },
          ]}
        />

        <AdminFilterBar
          tabs={[
            { key: "all", label: "All Tickets", count: stats.total },
            { key: "open", label: "Open", count: stats.open },
            { key: "in_progress", label: "In Progress", count: stats.inProgress },
            { key: "resolved", label: "Resolved", count: stats.resolved },
          ]}
          tabValue={activeTab}
          onTabChange={(value) => setActiveTab(value as typeof activeTab)}
          search={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search tickets by subject, staff, ticket number..."
          selects={[
            {
              value: categoryFilter,
              onValueChange: setCategoryFilter,
              placeholder: "All Categories",
              allLabel: "All Categories",
              options: CATEGORY_OPTIONS,
            },
          ]}
        />

        <AdminTable
          columns={columns}
          data={filteredTickets}
          rowKey={(ticket) => ticket.id}
          actions={actions}
          emptyIcon={FileQuestion}
          emptyTitle="No tickets match the selected filters"
        />
      </div>

      {/* Operational Knowledge Base & Troubleshooting Guides */}
      <Card className={cn(
        "rounded-2xl transition-all duration-300",
        isDark ? "bg-[#0a1033] border-none shadow-lg" : "bg-white border-2 border-navy/20 shadow-md"
      )}>
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className={cn("text-lg sm:text-xl font-bold flex items-center gap-2.5", isDark ? "text-white" : "text-navy")}>
            <CardTitleIcon icon={FileQuestion} isDark={isDark} />
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

      <AdminFormModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        icon={Headphones}
        title="Submit IT Support Ticket"
        description="Provide incident details to dispatch to our support engineers."
        onSubmit={handleCreateTicket}
        isSubmitting={isSubmitting}
        createLabel="Submit Ticket"
      >
        <AdminFormField label="Issue Subject" required>
          <AdminInput
            placeholder="e.g. POS Thermal printer offline, network outage..."
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            required
          />
        </AdminFormField>

        <AdminFormGrid>
          <AdminFormField label="Category">
            <AdminSelect
              value={newCategory}
              onValueChange={(value) => setNewCategory(value as SupportTicket["category"])}
              options={CATEGORY_OPTIONS}
            />
          </AdminFormField>
          <AdminFormField label="Priority">
            <AdminSelect
              value={newPriority}
              onValueChange={(value) => setNewPriority(value as SupportTicket["priority"])}
              options={PRIORITY_OPTIONS}
            />
          </AdminFormField>
        </AdminFormGrid>

        <AdminFormField label="Branch Location">
          <AdminInput
            value={newBranch}
            onChange={(e) => setNewBranch(e.target.value)}
          />
        </AdminFormField>

        <AdminFormField label="Description & Steps to Reproduce" required>
          <AdminTextarea
            rows={4}
            placeholder="Describe what happened, any error messages displayed, and what troubleshooting steps were already attempted..."
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            required
          />
        </AdminFormField>
      </AdminFormModal>

      <AdminDetailModal
        open={!!selectedTicket}
        onOpenChange={(open) => !open && setSelectedTicket(null)}
        icon={Headphones}
        title={selectedTicket?.subject ?? "Ticket Details"}
        subtitle={
          selectedTicket
            ? `Logged by ${selectedTicket.submitterName} (${selectedTicket.submitterRole}) at ${selectedTicket.branchName}`
            : undefined
        }
        badge={
          selectedTicket && (
            <div className="flex items-center gap-2">
              {priorityPill(selectedTicket.priority)}
              <AdminStatusBadge status={selectedTicket.status} label={STATUS_LABEL[selectedTicket.status]} />
            </div>
          )
        }
        sections={
          selectedTicket
            ? [
                {
                  key: "issue",
                  title: "Issue Details",
                  icon: FileQuestion,
                  span: 3,
                  content: <p className="leading-relaxed font-medium whitespace-pre-wrap">{selectedTicket.description}</p>,
                },
                ...(selectedTicket.resolutionNotes
                  ? [{
                      key: "resolution",
                      title: "Resolution / Engineering Notes",
                      icon: CheckCircle2,
                      span: 3 as const,
                      content: <p className="leading-relaxed font-medium whitespace-pre-wrap">{selectedTicket.resolutionNotes}</p>,
                    }]
                  : []),
                {
                  key: "meta",
                  title: "Ticket Record",
                  icon: Headphones,
                  fields: [
                    { label: "Ticket Number", value: <span className="font-mono font-bold">#{selectedTicket.ticketNumber}</span> },
                    { label: "Category", value: selectedTicket.category },
                    { label: "Priority", value: priorityPill(selectedTicket.priority) },
                    { label: "Status", value: <AdminStatusBadge status={selectedTicket.status} label={STATUS_LABEL[selectedTicket.status]} /> },
                    { label: "Submitted By", value: selectedTicket.submitterName },
                    { label: "Role", value: selectedTicket.submitterRole },
                    { label: "Branch", value: selectedTicket.branchName },
                    { label: "Logged At", value: new Date(selectedTicket.createdAt).toLocaleString() },
                  ],
                },
              ]
            : []
        }
        footerActions={
          selectedTicket ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400">Change Status:</span>
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
                className="h-7 text-[10px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Mark Resolved
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedTicket && (
          <AdminDetailSection
            title="Add Staff Note / Update"
            icon={MessageSquare}
            span={3}
            content={
              <AdminInput
                placeholder="e.g. Printer driver reinstalled; testing receipt print."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
            }
          />
        )}
      </AdminDetailModal>
    </div>
  )
}
