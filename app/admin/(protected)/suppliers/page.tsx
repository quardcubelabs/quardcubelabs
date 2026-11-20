"use client"

import { useState, useEffect, type FormEvent } from "react"
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
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from "@/lib/supplier-actions"
import { Supplier } from "@/lib/erp/types"
import {
  Building2,
  Mail,
  Phone,
  CreditCard,
  TrendingUp,
  Users,
  Eye,
  Trash2,
  ExternalLink,
  Pencil,
  ShieldCheck,
  FileText,
} from "lucide-react"

export default function SuppliersPage() {
  const { toast } = useToast()

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [name, setName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("Dar es Salaam")
  const [country, setCountry] = useState("Tanzania")
  const [tinNumber, setTinNumber] = useState("")
  const [vatNumber, setVatNumber] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("Net 30")
  const [openingBalance, setOpeningBalance] = useState<number>(0)
  const [notes, setNotes] = useState("")

  // Edit / status state
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editName, setEditName] = useState("")
  const [editCompanyName, setEditCompanyName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editAddress, setEditAddress] = useState("")
  const [editCity, setEditCity] = useState("")
  const [editCountry, setEditCountry] = useState("")
  const [editTinNumber, setEditTinNumber] = useState("")
  const [editVatNumber, setEditVatNumber] = useState("")
  const [editPaymentTerms, setEditPaymentTerms] = useState("Net 30")
  const [editStatus, setEditStatus] = useState<Supplier["status"]>("active")
  const [supplierForStatus, setSupplierForStatus] = useState<Supplier | null>(null)

  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getSuppliers()
      setSuppliers(data || [])
    } catch (err: any) {
      toast({ title: "Error Loading Suppliers", description: err.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const resetCreateForm = () => {
    setName("")
    setCompanyName("")
    setEmail("")
    setPhone("")
    setAddress("")
    setTinNumber("")
    setVatNumber("")
    setOpeningBalance(0)
    setNotes("")
  }

  const handleCreateSupplier = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!name || !email) {
      toast({
        title: "Missing Fields",
        description: "Supplier name and email are required.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const created = await createSupplier({
        name,
        company_name: companyName || undefined,
        email,
        phone: phone || undefined,
        address: address || undefined,
        city,
        country,
        tin_number: tinNumber || undefined,
        vat_number: vatNumber || undefined,
        payment_terms: paymentTerms,
        opening_balance: openingBalance,
        current_balance: openingBalance,
        status: "active",
        notes: notes || undefined,
      })

      toast({ title: "Supplier Registered", description: `Added ${created.name} (${created.supplier_code}).` })
      setSuppliers([created, ...suppliers])
      setIsCreateOpen(false)
      resetCreateForm()
    } catch (err: any) {
      toast({ title: "Registration Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const openEdit = (supplier: Supplier) => {
    setIsViewOpen(false)
    setSelectedSupplier(supplier)
    setEditName(supplier.name)
    setEditCompanyName(supplier.company_name || "")
    setEditEmail(supplier.email)
    setEditPhone(supplier.phone || "")
    setEditAddress(supplier.address || "")
    setEditCity(supplier.city || "")
    setEditCountry(supplier.country || "")
    setEditTinNumber(supplier.tin_number || "")
    setEditVatNumber(supplier.vat_number || "")
    setEditPaymentTerms(supplier.payment_terms || "Net 30")
    setEditStatus(supplier.status)
    setIsEditOpen(true)
  }

  const handleUpdateSupplier = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!selectedSupplier || !editName || !editEmail) {
      toast({
        title: "Missing Fields",
        description: "Supplier name and email are required.",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)
    try {
      const updated = await updateSupplier(selectedSupplier.id, {
        name: editName,
        company_name: editCompanyName || undefined,
        email: editEmail,
        phone: editPhone || undefined,
        address: editAddress || undefined,
        city: editCity,
        country: editCountry,
        tin_number: editTinNumber || undefined,
        vat_number: editVatNumber || undefined,
        payment_terms: editPaymentTerms,
        status: editStatus,
      })
      if (!updated) throw new Error("Supplier could not be updated.")

      toast({ title: "Supplier Updated", description: `Saved changes for ${updated.name}.` })
      setIsEditOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!supplierForStatus) return
    const nextStatus: Supplier["status"] = supplierForStatus.status === "active" ? "inactive" : "active"
    setIsUpdating(true)
    try {
      await updateSupplier(supplierForStatus.id, { status: nextStatus })
      toast({
        title: "Supplier Status Updated",
        description: `${supplierForStatus.name} is now ${nextStatus}.`,
      })
      setSupplierForStatus(null)
      loadData()
    } catch (err: any) {
      toast({ title: "Status Update Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return
    setIsDeleting(true)
    try {
      await deleteSupplier(supplierToDelete.id)
      toast({
        title: "Supplier Deleted",
        description: `Successfully deleted ${supplierToDelete.name}.`,
      })
      setSupplierToDelete(null)
      loadData()
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message || "Could not delete supplier.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const totalPayableBalance = suppliers.reduce((acc, s) => acc + (Number(s.current_balance) || 0), 0)
  const totalPurchasesVolume = suppliers.reduce(
    (acc, s) => acc + (Number(s.total_purchases_amount) || 0),
    0
  )

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

  const filteredSuppliers = suppliers.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false
    if (searchQuery) {
      return (
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.supplier_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.company_name && s.company_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }
    return true
  })

  const columns: AdminTableColumn<Supplier>[] = [
    {
      key: "name",
      header: "Vendor / Supplier",
      render: (s) => (
        <AdminPrimaryCell
          icon={Building2}
          title={s.name}
          subtitle={`#${s.supplier_code}`}
          href={`/admin/suppliers/${s.id}`}
        />
      ),
    },
    {
      key: "contact",
      header: "Contact Info",
      hidden: "sm",
      render: (s) => (
        <div className="min-w-0 space-y-0.5">
          <AdminMutedText className="flex items-center gap-1.5 font-bold">
            <Mail className="h-3.5 w-3.5 shrink-0" /> {s.email}
          </AdminMutedText>
          {s.phone && (
            <AdminMutedText className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0" /> {s.phone}
            </AdminMutedText>
          )}
        </div>
      ),
    },
    {
      key: "payment_terms",
      header: "Payment Terms",
      hidden: "md",
      render: (s) => <AdminPill>{s.payment_terms}</AdminPill>,
    },
    {
      key: "tax",
      header: "TIN / VRN",
      hidden: "lg",
      render: (s) => (
        <div className="font-mono text-xs">
          <p>{s.tin_number ? `TIN: ${s.tin_number}` : "â€”"}</p>
          {s.vat_number && <AdminMutedText className="block">VRN: {s.vat_number}</AdminMutedText>}
        </div>
      ),
    },
    {
      key: "current_balance",
      header: "Payable Balance",
      align: "right",
      render: (s) => (
        <span
          className={`font-mono font-black ${
            Number(s.current_balance) > 0 ? "text-rose-500" : "text-emerald-500"
          }`}
        >
          TSH {Number(s.current_balance || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      hidden: "sm",
      align: "center",
      render: (s) => <AdminStatusBadge status={s.status} />,
    },
  ]

  const actions: AdminTableAction<Supplier>[] = [
    {
      key: "view",
      label: "View Supplier Details",
      icon: Eye,
      variant: "view",
      onClick: (s) => {
        setSelectedSupplier(s)
        setIsViewOpen(true)
      },
    },
    {
      key: "profile",
      label: "Open Supplier Profile & Ledger",
      icon: ExternalLink,
      variant: "soft",
      href: (s) => `/admin/suppliers/${s.id}`,
      mobile: false,
    },
    {
      key: "edit",
      label: "Edit Supplier",
      icon: Pencil,
      variant: "edit",
      mobile: false,
      onClick: openEdit,
    },
    {
      key: "status",
      label: "Change Supplier Status",
      icon: ShieldCheck,
      variant: "soft",
      mobile: false,
      onClick: (s) => setSupplierForStatus(s),
    },
    {
      key: "delete",
      label: "Delete Supplier",
      icon: Trash2,
      variant: "danger-soft",
      mobile: false,
      onClick: (s) => setSupplierToDelete(s),
    },
  ]

  if (isLoading) return <AdminLoading />

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="Supplier"
        accent="Directory"
        subtitle="Manage procurement partners, payables balances, payment terms, and vendor performance"
        icon={Building2}
        onRefresh={loadData}
        onAdd={() => setIsCreateOpen(true)}
        addLabel="Add New Vendor"
      />

      <AdminStats
        columns={4}
        items={[
          { title: "Total Active Vendors", value: suppliers.length.toString(), icon: Building2 },
          { title: "Accounts Payable", value: formatStatCurrency(totalPayableBalance), icon: CreditCard },
          { title: "Procurement Volume", value: formatStatCurrency(totalPurchasesVolume), icon: TrendingUp },
          {
            title: "Active Orders",
            value: suppliers.reduce((acc, s) => acc + (s.total_orders_count || 0), 0).toString(),
            icon: Users,
          },
        ]}
      />

      <AdminFilterBar
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by vendor name, code, company, or email..."
        selects={[
          {
            value: statusFilter,
            onValueChange: setStatusFilter,
            placeholder: "All Status",
            allLabel: "All Status",
            options: [
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ],
          },
        ]}
      />

      <AdminTable
        columns={columns}
        data={filteredSuppliers}
        rowKey={(s) => s.id}
        actions={actions}
        emptyIcon={Building2}
        emptyTitle="No supplier records found"
        emptyDescription="Try adjusting your filters or search keyword"
      />

      {/* DETAIL MODAL */}
      <AdminDetailModal
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        icon={Building2}
        title={selectedSupplier?.name || "Supplier Details"}
        subtitle={`#${selectedSupplier?.supplier_code || ""}`}
        badge={
          selectedSupplier ? <AdminStatusBadge status={selectedSupplier.status} /> : undefined
        }
        size="lg"
        sections={[
          {
            key: "contact",
            title: "Contact Information",
            icon: Mail,
            fields: [
              { label: "Trade Name", value: selectedSupplier?.name || "â€”" },
              { label: "Legal Entity", value: selectedSupplier?.company_name || "â€”" },
              { label: "Email", value: selectedSupplier?.email || "â€”" },
              { label: "Phone", value: selectedSupplier?.phone || "â€”" },
              {
                label: "Address",
                value: [selectedSupplier?.address, selectedSupplier?.city, selectedSupplier?.country]
                  .filter(Boolean)
                  .join(", ") || "â€”",
              },
            ],
          },
          {
            key: "compliance",
            title: "Tax & Payment Terms",
            icon: FileText,
            fields: [
              { label: "TIN", value: selectedSupplier?.tin_number || "â€”" },
              { label: "VRN / VAT", value: selectedSupplier?.vat_number || "â€”" },
              { label: "Payment Terms", value: selectedSupplier?.payment_terms || "â€”" },
              { label: "Supplier Code", value: selectedSupplier?.supplier_code || "â€”" },
            ],
          },
          {
            key: "financial",
            title: "Payables Overview",
            icon: CreditCard,
            fields: [
              {
                label: "Opening Balance",
                value: `TSH ${Number(selectedSupplier?.opening_balance || 0).toLocaleString()}`,
              },
              {
                label: "Current Balance",
                value: `TSH ${Number(selectedSupplier?.current_balance || 0).toLocaleString()}`,
              },
              {
                label: "Total Purchases",
                value: `TSH ${Number(selectedSupplier?.total_purchases_amount || 0).toLocaleString()}`,
              },
              {
                label: "Total Orders",
                value: selectedSupplier?.total_orders_count || 0,
              },
            ],
          },
          ...(selectedSupplier?.notes
            ? [
                {
                  key: "notes",
                  title: "Notes",
                  icon: FileText,
                  span: 3 as const,
                  content: <p className="text-xs leading-relaxed opacity-90">{selectedSupplier.notes}</p>,
                },
              ]
            : []),
        ]}
        footerActions={
          <a
            href={`/admin/suppliers/${selectedSupplier?.id || ""}`}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-navy px-5 text-xs font-bold text-white hover:bg-navy/90"
          >
            <ExternalLink className="h-4 w-4" /> Open Profile & Ledger
          </a>
        }
        onEdit={selectedSupplier ? () => openEdit(selectedSupplier) : undefined}
        editLabel="Edit Supplier"
        onDelete={
          selectedSupplier
            ? () => {
                setIsViewOpen(false)
                setSupplierToDelete(selectedSupplier)
              }
            : undefined
        }
        deleteLabel="Delete Supplier"
      />

      {/* CREATE SUPPLIER MODAL */}
      <AdminFormModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        icon={Building2}
        title="Register New Vendor / Supplier"
        description="Add verified corporate supplier credentials, payment terms, and tax records."
        onSubmit={handleCreateSupplier}
        isSubmitting={isSaving}
        size="lg"
        createLabel="Register Vendor"
      >
        <AdminFormGrid>
          <AdminFormField label="Supplier Trade Name" required>
            <AdminInput
              placeholder="e.g. Hikvision East Africa"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Registered Legal Entity">
            <AdminInput
              placeholder="e.g. Hikvision Digital Tech Co."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Official Email" required>
            <AdminInput
              type="email"
              placeholder="sales@supplier.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Phone Number">
            <AdminInput
              placeholder="+255 7XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="TIN Number">
            <AdminInput
              placeholder="123-456-789"
              value={tinNumber}
              onChange={(e) => setTinNumber(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="VRN / VAT Number">
            <AdminInput
              placeholder="VRN-40019283"
              value={vatNumber}
              onChange={(e) => setVatNumber(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Payment Terms">
            <AdminSelect
              value={paymentTerms}
              onValueChange={setPaymentTerms}
              options={[
                { value: "Due on Receipt", label: "Due on Receipt" },
                { value: "Net 15", label: "Net 15 Days" },
                { value: "Net 30", label: "Net 30 Days" },
                { value: "Net 45", label: "Net 45 Days" },
                { value: "Net 60", label: "Net 60 Days" },
              ]}
            />
          </AdminFormField>
          <AdminFormField label="Opening Payable Balance (TZS)">
            <AdminInput
              monospace
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
            />
          </AdminFormField>
          <AdminFormField label="Physical Address" className="sm:col-span-2">
            <AdminInput
              placeholder="Plot / Street / District"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="City">
            <AdminInput value={city} onChange={(e) => setCity(e.target.value)} />
          </AdminFormField>
          <AdminFormField label="Country">
            <AdminInput value={country} onChange={(e) => setCountry(e.target.value)} />
          </AdminFormField>
          <AdminFormField label="Notes" className="sm:col-span-2">
            <AdminTextarea
              placeholder="Registration notes, contact persons, or vendor compliance details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </AdminFormField>
        </AdminFormGrid>
      </AdminFormModal>

      {/* EDIT SUPPLIER MODAL */}
      <AdminFormModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        icon={Pencil}
        title="Edit Supplier"
        description="Update supplier credentials, compliance details, and payment terms."
        onSubmit={handleUpdateSupplier}
        isSubmitting={isUpdating}
        size="lg"
        editLabel="Save Changes"
        isEdit
      >
        <AdminFormGrid>
          <AdminFormField label="Supplier Trade Name" required>
            <AdminInput value={editName} onChange={(e) => setEditName(e.target.value)} />
          </AdminFormField>
          <AdminFormField label="Registered Legal Entity">
            <AdminInput value={editCompanyName} onChange={(e) => setEditCompanyName(e.target.value)} />
          </AdminFormField>
          <AdminFormField label="Official Email" required>
            <AdminInput
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Phone Number">
            <AdminInput value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
          </AdminFormField>
          <AdminFormField label="TIN Number">
            <AdminInput value={editTinNumber} onChange={(e) => setEditTinNumber(e.target.value)} />
          </AdminFormField>
          <AdminFormField label="VRN / VAT Number">
            <AdminInput value={editVatNumber} onChange={(e) => setEditVatNumber(e.target.value)} />
          </AdminFormField>
          <AdminFormField label="Payment Terms">
            <AdminSelect
              value={editPaymentTerms}
              onValueChange={setEditPaymentTerms}
              options={[
                { value: "Due on Receipt", label: "Due on Receipt" },
                { value: "Net 15", label: "Net 15 Days" },
                { value: "Net 30", label: "Net 30 Days" },
                { value: "Net 45", label: "Net 45 Days" },
                { value: "Net 60", label: "Net 60 Days" },
              ]}
            />
          </AdminFormField>
          <AdminFormField label="Status">
            <AdminSelect
              value={editStatus}
              onValueChange={(value) => setEditStatus(value as Supplier["status"])}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "blocked", label: "Blocked" },
              ]}
            />
          </AdminFormField>
          <AdminFormField label="Physical Address" className="sm:col-span-2">
            <AdminInput value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
          </AdminFormField>
          <AdminFormField label="City">
            <AdminInput value={editCity} onChange={(e) => setEditCity(e.target.value)} />
          </AdminFormField>
          <AdminFormField label="Country">
            <AdminInput value={editCountry} onChange={(e) => setEditCountry(e.target.value)} />
          </AdminFormField>
        </AdminFormGrid>
      </AdminFormModal>

      {/* STATUS CHANGE CONFIRMATION */}
      <AdminConfirmDialog
        open={!!supplierForStatus}
        onOpenChange={(open) => !open && setSupplierForStatus(null)}
        title="Change Supplier Status"
        description={`Set ${supplierForStatus?.name} to ${
          supplierForStatus?.status === "active" ? "inactive" : "active"
        }?`}
        confirmLabel="Update Status"
        destructive={false}
        isSubmitting={isUpdating}
        onConfirm={handleToggleStatus}
      />

      {/* DELETE SUPPLIER CONFIRMATION */}
      <AdminConfirmDialog
        open={!!supplierToDelete}
        onOpenChange={(open) => !open && setSupplierToDelete(null)}
        title="Delete Supplier"
        description={`Are you sure you want to delete supplier ${supplierToDelete?.name}? This action cannot be undone.`}
        confirmLabel={isDeleting ? "Deleting..." : "Confirm Delete"}
        isSubmitting={isDeleting}
        onConfirm={handleDeleteSupplier}
      />
    </div>
  )
}
