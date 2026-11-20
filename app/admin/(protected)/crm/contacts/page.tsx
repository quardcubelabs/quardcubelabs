"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminLoading from "@/components/admin/admin-loading"
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
  AdminInput,
  AdminSelect,
  type AdminTableColumn,
  type AdminTableAction,
  type AdminStatItem,
  type AdminFilterTab,
  type AdminDetailSectionData,
} from "@/components/admin/ui"
import { getCustomerAccounts, createCustomerAccount } from "@/lib/crm-actions"
import type { CustomerAccount } from "@/lib/erp/crm-types"
import {
  Users,
  Building2,
  Layers,
  DollarSign,
  Clock,
  FileText,
  Eye,
  ShieldCheck,
  Briefcase,
} from "lucide-react"

const CATEGORIES: CustomerAccount["category"][] = [
  "Corporate Enterprise",
  "Government / Parastatal",
  "SME",
  "Retail Client"
]

const PAYMENT_TERMS = ["Due on Receipt", "Net 15", "Net 30", "Net 60"]

const formatMoney = (value: number) => `TZS ${(value || 0).toLocaleString()}`

export default function CustomerAccountsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [customers, setCustomers] = useState<CustomerAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  // View Customer Modal
  const [selectedViewCustomer, setSelectedViewCustomer] = useState<CustomerAccount | null>(null)

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [companyName, setCompanyName] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("Dar es Salaam")
  const [region, setRegion] = useState("Dar es Salaam")
  const [tinNumber, setTinNumber] = useState("")
  const [vatNumber, setVatNumber] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("Net 30")
  const [category, setCategory] = useState<CustomerAccount["category"]>("Corporate Enterprise")

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getCustomerAccounts()
      setCustomers(data)
    } catch {
      toast({
        title: "Error",
        description: "Failed to load customer profiles.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const resetCreateForm = () => {
    setCompanyName("")
    setContactPerson("")
    setEmail("")
    setPhone("")
    setAddress("")
    setCity("Dar es Salaam")
    setRegion("Dar es Salaam")
    setTinNumber("")
    setVatNumber("")
    setPaymentTerms("Net 30")
    setCategory("Corporate Enterprise")
  }

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactPerson || !email || !phone) {
      toast({
        title: "Missing Fields",
        description: "Please specify contact person, email, and phone.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const code = `CUST-${(companyName || contactPerson).slice(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`
      await createCustomerAccount({
        customer_code: code,
        company_name: companyName,
        contact_person: contactPerson,
        email,
        phone,
        address,
        city,
        region,
        tin_number: tinNumber,
        vat_number: vatNumber,
        total_spend: 0,
        total_orders_count: 0,
        total_invoices_count: 0,
        outstanding_receivables: 0,
        payment_terms: paymentTerms,
        category,
        status: "active"
      })
      toast({
        title: "Customer Profile Created",
        description: "New client record added to Customer 360 database."
      })
      setIsCreateOpen(false)
      resetCreateForm()
      loadData()
    } catch {
      toast({
        title: "Error",
        description: "Could not create customer profile.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredCustomers = customers.filter(c => {
    const matchesSearch =
      c.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.company_name && c.company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.customer_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)

    const matchesCategory = categoryFilter === "all" || c.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Customer 360 Metrics
  const totalClients = customers.length
  const totalLTV = customers.reduce((sum, c) => sum + c.total_spend, 0)
  const totalAR = customers.reduce((sum, c) => sum + c.outstanding_receivables, 0)
  const corporateCount = customers.filter(c => c.category === "Corporate Enterprise").length

  const stats: AdminStatItem[] = [
    { title: "Total Client Accounts", value: totalClients.toString(), icon: Users },
    { title: "Cumulative Lifetime Spend", value: `TZS ${(totalLTV / 1000000).toFixed(1)}M`, icon: DollarSign },
    { title: "Outstanding Receivables (AR)", value: `TZS ${(totalAR / 1000000).toFixed(1)}M`, icon: Clock },
    { title: "Enterprise Corporates", value: corporateCount.toString(), icon: Building2 }
  ]

  const categoryTabs: AdminFilterTab[] = [
    { key: "all", label: "All Clients", icon: Layers, count: customers.length },
    { key: "Corporate Enterprise", label: "Corporate Enterprise", icon: Building2, count: customers.filter(c => c.category === "Corporate Enterprise").length },
    { key: "Government / Parastatal", label: "Government / Parastatal", icon: ShieldCheck, count: customers.filter(c => c.category === "Government / Parastatal").length },
    { key: "SME", label: "SME", icon: Briefcase, count: customers.filter(c => c.category === "SME").length },
    { key: "Retail Client", label: "Retail Client", icon: Users, count: customers.filter(c => c.category === "Retail Client").length }
  ]

  const columns: AdminTableColumn<CustomerAccount>[] = [
    {
      key: "account",
      header: "Customer Account",
      render: (customer) => (
        <AdminPrimaryCell
          icon={Building2}
          title={customer.company_name || customer.contact_person}
          subtitle={
            <span className="flex items-center gap-1.5">
              <span className="font-mono font-bold">{customer.customer_code}</span>
              {customer.company_name && customer.contact_person && (
                <span className="truncate max-w-[100px]">• {customer.contact_person}</span>
              )}
            </span>
          }
        />
      )
    },
    {
      key: "classification",
      header: "Classification",
      hidden: "sm",
      render: (customer) => (
        <div className="whitespace-nowrap">
          <AdminPill title={customer.category}>{customer.category}</AdminPill>
          <AdminMutedText className="block text-[11px] mt-0.5 font-semibold">
            Terms: {customer.payment_terms}
          </AdminMutedText>
        </div>
      )
    },
    {
      key: "contact",
      header: "Contact Info",
      hidden: "md",
      render: (customer) => (
        <div className="text-xs">
          <span className="font-medium truncate max-w-[170px] block" title={`${customer.email} • ${customer.phone}`}>
            {customer.email || customer.phone}
          </span>
          <AdminMutedText className="block text-[11px] truncate">
            {customer.city || customer.region || "Tanzania"}
          </AdminMutedText>
        </div>
      )
    },
    {
      key: "tax",
      header: "Tax ID",
      hidden: "lg",
      render: (customer) => (
        <AdminPill className="font-mono">
          {customer.tin_number ? `TIN: ${customer.tin_number}` : "Unregistered"}
        </AdminPill>
      )
    },
    {
      key: "spend",
      header: "Total Spend",
      align: "right",
      render: (customer) => (
        <span className="font-mono font-black text-xs sm:text-sm text-emerald-500 whitespace-nowrap">
          {formatMoney(customer.total_spend)}
        </span>
      )
    },
    {
      key: "receivables",
      header: "Outstanding (AR)",
      align: "right",
      render: (customer) => (
        <span className="font-mono font-black text-xs sm:text-sm text-amber-500 whitespace-nowrap">
          {formatMoney(customer.outstanding_receivables)}
        </span>
      )
    }
  ]

  const actions: AdminTableAction<CustomerAccount>[] = [
    {
      key: "view",
      label: "View Customer Profile",
      icon: Eye,
      variant: "view",
      onClick: (customer) => setSelectedViewCustomer(customer)
    },
    {
      key: "invoices",
      label: "View Invoices",
      icon: FileText,
      variant: "soft",
      mobile: false,
      href: () => "/admin/invoices"
    }
  ]

  const detailSections = (customer: CustomerAccount): AdminDetailSectionData[] => [
    {
      key: "financial",
      title: "Financial Balance Summary",
      icon: DollarSign,
      span: 1,
      fields: [
        { label: "Customer Code", value: <span className="font-mono">{customer.customer_code}</span> },
        { label: "Account Status", value: <AdminStatusBadge status={customer.status} /> },
        { label: "Total Lifetime Revenue (LTV)", value: <span className="font-mono font-black text-emerald-500">{formatMoney(customer.total_spend)}</span> },
        { label: "Outstanding Receivables", value: <span className="font-mono font-black text-amber-500">{formatMoney(customer.outstanding_receivables)}</span> },
        { label: "Total Orders", value: customer.total_orders_count.toString() },
        { label: "Total Invoices", value: customer.total_invoices_count.toString() }
      ]
    },
    {
      key: "contact",
      title: "Contact & Location",
      icon: Users,
      span: 1,
      fields: [
        { label: "Contact Person", value: customer.contact_person },
        { label: "Email", value: <span className="break-all">{customer.email}</span> },
        { label: "Phone", value: customer.phone },
        { label: "City / Region", value: `${customer.city}, ${customer.region}` },
        { label: "Address", value: customer.address || "—" }
      ]
    },
    {
      key: "tax",
      title: "Tax & Payment Terms",
      icon: ShieldCheck,
      span: 1,
      fields: [
        { label: "Classification", value: customer.category },
        { label: "Payment Terms", value: customer.payment_terms },
        { label: "TRA TIN", value: <span className="font-mono">{customer.tin_number || "Unregistered"}</span> },
        { label: "TRA VAT", value: <span className="font-mono">{customer.vat_number || "Not Applicable"}</span> },
        { label: "Credit Limit", value: customer.credit_limit ? formatMoney(customer.credit_limit) : "—" }
      ]
    }
  ]

  if (isLoading && customers.length === 0) {
    return <AdminLoading />
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="Customer 360 &"
        accent="Accounts"
        subtitle="Corporate client directory, billing histories, TRA TIN/VAT tax records, and account receivables"
        icon={Users}
        onRefresh={loadData}
        refreshing={isLoading}
        onAdd={() => setIsCreateOpen(true)}
        addLabel="Add Customer Profile"
      />

      <AdminStats items={stats} columns={4} />

      <AdminFilterBar
        tabs={categoryTabs}
        tabValue={categoryFilter}
        onTabChange={setCategoryFilter}
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search customer by name, company, email, phone, or code..."
      />

      <AdminTable
        columns={columns}
        data={filteredCustomers}
        rowKey={(customer) => customer.id}
        actions={actions}
        emptyIcon={Building2}
        emptyTitle="No customer records match your query"
        emptyDescription="Try adjusting your search query or filters"
      />

      <AdminDetailModal
        open={!!selectedViewCustomer}
        onOpenChange={(open) => !open && setSelectedViewCustomer(null)}
        icon={Building2}
        title={selectedViewCustomer ? (selectedViewCustomer.company_name || selectedViewCustomer.contact_person) : ""}
        badge={selectedViewCustomer && <AdminStatusBadge status={selectedViewCustomer.status} />}
        subtitle={selectedViewCustomer && (
          <>
            <span className="font-mono font-bold">{selectedViewCustomer.customer_code}</span>
            {" • Attn: "}
            <span className="font-bold">{selectedViewCustomer.contact_person}</span>
            {" • Classification: "}
            <span className="font-bold">{selectedViewCustomer.category}</span>
          </>
        )}
        sections={selectedViewCustomer ? detailSections(selectedViewCustomer) : []}
        footerActions={
          <Button
            onClick={() => router.push("/admin/invoices")}
            className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-5 gap-1.5 shadow-md"
          >
            <FileText className="w-4 h-4 text-teal" />
            View Account Invoices
          </Button>
        }
      />

      <AdminFormModal
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) resetCreateForm()
        }}
        icon={Users}
        title="Register Commercial Customer"
        description="Create a unified Customer 360 profile linked across Invoicing, Quotations, and CRM."
        onSubmit={handleCreateCustomer}
        isSubmitting={isSubmitting}
        createLabel="Save Customer"
        size="md"
      >
        <AdminFormGrid>
          <AdminFormField label="Company / Organization">
            <AdminInput
              placeholder="e.g. Serengeti Freight Logistics Ltd"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Primary Contact Person" required>
            <AdminInput
              required
              placeholder="e.g. Baraka Massawe"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Email Address" required>
            <AdminInput
              required
              type="email"
              placeholder="contact@company.co.tz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Phone Number" required>
            <AdminInput
              required
              placeholder="+255 7..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="TIN Number (TRA)">
            <AdminInput
              monospace
              placeholder="100-221-998"
              value={tinNumber}
              onChange={(e) => setTinNumber(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="VAT Number">
            <AdminInput
              monospace
              placeholder="40-001928-V"
              value={vatNumber}
              onChange={(e) => setVatNumber(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Category">
            <AdminSelect
              value={category}
              onValueChange={(value) => setCategory(value as CustomerAccount["category"])}
              options={CATEGORIES.map((item) => ({ value: item, label: item }))}
            />
          </AdminFormField>
          <AdminFormField label="Payment Terms">
            <AdminSelect
              value={paymentTerms}
              onValueChange={setPaymentTerms}
              options={PAYMENT_TERMS.map((item) => ({ value: item, label: item }))}
            />
          </AdminFormField>
          <AdminFormField label="City">
            <AdminInput value={city} onChange={(e) => setCity(e.target.value)} />
          </AdminFormField>
          <AdminFormField label="Region">
            <AdminInput value={region} onChange={(e) => setRegion(e.target.value)} />
          </AdminFormField>
        </AdminFormGrid>
        <AdminFormField label="Physical Address / Office Location">
          <AdminInput
            placeholder="Plot number, street, commercial building..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </AdminFormField>
      </AdminFormModal>
    </div>
  )
}
