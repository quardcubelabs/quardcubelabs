"use client"

import { useState, useEffect } from "react"
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
  AdminTextarea,
  AdminSelect,
  type AdminTableColumn,
  type AdminTableAction,
} from "@/components/admin/ui"
import { getChartOfAccounts, createAccount } from "@/lib/accounting-actions"
import type { ChartOfAccount, AccountType } from "@/lib/erp/accounting-types"
import {
  BookOpen,
  Landmark,
  Scale,
  Wallet,
  TrendingUp,
  TrendingDown,
  Layers,
  Eye,
  FileText,
  Calendar,
} from "lucide-react"

const ACCOUNT_TYPES: { label: string; value: AccountType; color: string }[] = [
  { label: "Assets (1000s)", value: "asset", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  { label: "Liabilities (2000s)", value: "liability", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { label: "Equity (3000s)", value: "equity", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { label: "Revenue (4000s)", value: "revenue", color: "text-teal-500 bg-teal-500/10 border-teal-500/20" },
  { label: "Cost of Sales (5000s)", value: "cogs", color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
  { label: "Operating Expenses (6000s)", value: "expense", color: "text-purple-500 bg-purple-500/10 border-purple-500/20" }
]

const TYPE_OPTIONS = ACCOUNT_TYPES.map((type) => ({ value: type.value, label: type.label }))

export default function ChartOfAccountsPage() {
  const { toast } = useToast()

  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<ChartOfAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState<AccountType>("asset")
  const [subCategory, setSubCategory] = useState("Current Assets")
  const [description, setDescription] = useState("")
  const [startingBalance, setStartingBalance] = useState<number>(0)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getChartOfAccounts()
      setAccounts(data)
    } catch {
      toast({
        title: "Error",
        description: "Failed to load Chart of Accounts.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || !name) {
      toast({ title: "Validation Error", description: "Account code and name are required.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      await createAccount({
        code,
        name,
        type,
        sub_category: subCategory,
        currency: "TZS",
        current_balance: startingBalance,
        description,
        is_active: true,
        is_system: false
      })
      toast({ title: "Account Created", description: `Account ${code} â€” ${name} added to General Ledger.` })
      setIsCreateOpen(false)
      setCode("")
      setName("")
      setDescription("")
      setStartingBalance(0)
      loadData()
    } catch {
      toast({ title: "Creation Failed", description: "Could not persist new ledger account.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch =
      acc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.sub_category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || acc.type === typeFilter
    return matchesSearch && matchesType
  })

  // Summary Metrics
  const totalAssets = accounts.filter(a => a.type === "asset").reduce((s, a) => s + a.current_balance, 0)
  const totalLiabilities = accounts.filter(a => a.type === "liability").reduce((s, a) => s + a.current_balance, 0)
  const totalEquity = accounts.filter(a => a.type === "equity").reduce((s, a) => s + a.current_balance, 0)
  const totalRevenue = accounts.filter(a => a.type === "revenue").reduce((s, a) => s + a.current_balance, 0)
  const totalExpenses = accounts.filter(a => a.type === "expense" || a.type === "cogs").reduce((s, a) => s + a.current_balance, 0)

  const columns: AdminTableColumn<ChartOfAccount>[] = [
    {
      key: "account",
      header: "Account",
      render: (account) => (
        <AdminPrimaryCell
          icon={BookOpen}
          title={
            <>
              <span className="font-mono opacity-70 mr-2">{account.code}</span>
              {account.name}
            </>
          }
          subtitle={account.description || undefined}
        />
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (account) => (
        <AdminPill className={ACCOUNT_TYPES.find(t => t.value === account.type)?.color}>
          {account.type}
        </AdminPill>
      ),
    },
    {
      key: "subCategory",
      header: "Sub-Category",
      hidden: "sm",
      render: (account) => <AdminMutedText>{account.sub_category}</AdminMutedText>,
    },
    {
      key: "balance",
      header: "Current Balance",
      align: "right",
      render: (account) => (
        <span className="font-black text-xs sm:text-sm font-mono tracking-tight whitespace-nowrap">
          TZS {account.current_balance.toLocaleString()}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      align: "center",
      hidden: "md",
      render: (account) =>
        account.is_system ? (
          <AdminPill className="bg-navy text-white border-navy">System</AdminPill>
        ) : (
          <AdminMutedText>Custom</AdminMutedText>
        ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: () => <AdminStatusBadge status="active" label="Active" />,
    },
  ]

  const actions: AdminTableAction<ChartOfAccount>[] = [
    {
      key: "view",
      label: "View Account Details",
      icon: Eye,
      variant: "view",
      onClick: (account) => setSelectedAccount(account),
    },
  ]

  if (isLoading && accounts.length === 0) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <AdminLoading />
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="Chart of"
        accent="Accounts"
        subtitle="Standard General Ledger hierarchy, asset valuations, and double-entry account codes"
        icon={BookOpen}
        onRefresh={loadData}
        onAdd={() => setIsCreateOpen(true)}
        addLabel="New Account"
      />

      <AdminStats
        columns={5}
        items={[
          { title: "Total Assets", value: `TZS ${totalAssets.toLocaleString()}`, icon: Landmark },
          { title: "Total Liabilities", value: `TZS ${totalLiabilities.toLocaleString()}`, icon: Scale },
          { title: "Shareholder Equity", value: `TZS ${totalEquity.toLocaleString()}`, icon: Wallet },
          { title: "Operating Revenue", value: `TZS ${totalRevenue.toLocaleString()}`, icon: TrendingUp },
          { title: "Direct Costs & Exp.", value: `TZS ${totalExpenses.toLocaleString()}`, icon: TrendingDown },
        ]}
      />

      <AdminFilterBar
        tabs={[
          { key: "all", label: "All Accounts", icon: BookOpen, count: accounts.length },
          { key: "asset", label: "Assets", icon: Landmark, count: accounts.filter(a => a.type === "asset").length },
          { key: "liability", label: "Liabilities", icon: Scale, count: accounts.filter(a => a.type === "liability").length },
          { key: "equity", label: "Equity", icon: Wallet, count: accounts.filter(a => a.type === "equity").length },
          { key: "revenue", label: "Revenue", icon: TrendingUp, count: accounts.filter(a => a.type === "revenue").length },
          { key: "cogs", label: "COGS", icon: Layers, count: accounts.filter(a => a.type === "cogs").length },
          { key: "expense", label: "Expenses", icon: TrendingDown, count: accounts.filter(a => a.type === "expense").length },
        ]}
        tabValue={typeFilter}
        onTabChange={setTypeFilter}
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search account code, name, or subcategory..."
        selects={[
          {
            value: typeFilter,
            onValueChange: setTypeFilter,
            placeholder: "Category",
            allLabel: "All Categories",
            options: TYPE_OPTIONS,
          },
        ]}
      />

      <AdminTable
        columns={columns}
        data={filteredAccounts}
        rowKey={(account) => account.id}
        actions={actions}
        emptyIcon={BookOpen}
        emptyTitle="No ledger accounts found"
      />

      <AdminDetailModal
        open={!!selectedAccount}
        onOpenChange={(open) => !open && setSelectedAccount(null)}
        icon={BookOpen}
        title={selectedAccount?.name ?? "Account Details"}
        subtitle={
          selectedAccount
            ? `Category: ${selectedAccount.type.toUpperCase()} â€¢ Sub-Category: ${selectedAccount.sub_category}`
            : undefined
        }
        badge={selectedAccount && (
          <AdminPill className="font-mono normal-case tracking-normal bg-teal/20 text-teal border-teal/30">
            {selectedAccount.code}
          </AdminPill>
        )}
        sections={
          selectedAccount
            ? [
                {
                  key: "balance",
                  title: "Current Ledger Balance",
                  icon: Landmark,
                  fields: [
                    { label: "Balance", value: <span className="font-mono font-black">{selectedAccount.currency || "TZS"} {selectedAccount.current_balance.toLocaleString()}</span> },
                    { label: "Status", value: <AdminStatusBadge status="active" label="Active in General Ledger" /> },
                  ],
                },
                {
                  key: "policy",
                  title: "Accounting Policy & Notes",
                  icon: FileText,
                  span: 2,
                  content: (
                    <p className="text-xs leading-relaxed opacity-85">
                      {selectedAccount.description || "No specific accounting notes or policy documented for this account."}
                    </p>
                  ),
                },
                {
                  key: "scope",
                  title: "Account Scope",
                  icon: Calendar,
                  fields: [
                    { label: "Classification", value: selectedAccount.is_system ? "System Protected" : "Custom Account" },
                    { label: "Currency", value: <span className="font-mono">{selectedAccount.currency || "TZS"}</span> },
                    { label: "Account ID", value: <span className="font-mono text-[11px] opacity-80">{selectedAccount.id}</span> },
                    { label: "Created Date", value: selectedAccount.created_at ? new Date(selectedAccount.created_at).toLocaleDateString() : "System Standard" },
                  ],
                },
              ]
            : []
        }
      />

      <AdminFormModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        icon={BookOpen}
        title="Add General Ledger Account"
        description="Assign a structured accounting code and classification to expand your chart of accounts."
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        createLabel="Save Account"
      >
        <AdminFormGrid>
          <AdminFormField label="Account Code" required>
            <AdminInput
              id="code"
              placeholder="e.g. 1550"
              value={code}
              onChange={e => setCode(e.target.value)}
              monospace
              required
            />
          </AdminFormField>
          <AdminFormField label="Category" required>
            <AdminSelect
              value={type}
              onValueChange={(value) => setType(value as AccountType)}
              options={[
                { value: "asset", label: "Asset (1000)" },
                { value: "liability", label: "Liability (2000)" },
                { value: "equity", label: "Equity (3000)" },
                { value: "revenue", label: "Revenue (4000)" },
                { value: "cogs", label: "Cost of Goods Sold (5000)" },
                { value: "expense", label: "Operating Expense (6000)" },
              ]}
            />
          </AdminFormField>
        </AdminFormGrid>

        <AdminFormField label="Account Name" required>
          <AdminInput
            id="name"
            placeholder="e.g. Office Hardware & Laptops"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </AdminFormField>

        <AdminFormField label="Sub-Category">
          <AdminInput
            id="subCategory"
            placeholder="e.g. Fixed Assets, Current Assets, Payroll"
            value={subCategory}
            onChange={e => setSubCategory(e.target.value)}
          />
        </AdminFormField>

        <AdminFormField label="Starting Balance (TZS)">
          <AdminInput
            id="balance"
            type="number"
            placeholder="0"
            value={startingBalance || ""}
            onChange={e => setStartingBalance(Number(e.target.value) || 0)}
            monospace
          />
        </AdminFormField>

        <AdminFormField label="Description / Accounting Policy">
          <AdminTextarea
            id="desc"
            placeholder="Optional notes regarding this ledger account"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
          />
        </AdminFormField>
      </AdminFormModal>
    </div>
  )
}
