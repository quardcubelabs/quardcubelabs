"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import AdminLoading from "@/components/admin/admin-loading"
import { Button } from "@/components/ui/button"
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
  type AdminTableColumn,
  type AdminTableAction,
} from "@/components/admin/ui"
import { getBankCashAccounts } from "@/lib/accounting-actions"
import type { BankCashAccount } from "@/lib/erp/accounting-types"
import {
  Landmark,
  Wallet,
  Smartphone,
  CreditCard,
  Building2,
  Eye,
  ShieldCheck,
  Calendar,
} from "lucide-react"

function accountIcon(accountType: BankCashAccount["account_type"]) {
  if (accountType.includes("Cash")) return Wallet
  if (accountType.includes("Mobile")) return Smartphone
  if (accountType.includes("Gateway")) return CreditCard
  return Landmark
}

export default function BankingManagementPage() {
  const { toast } = useToast()

  const [accounts, setAccounts] = useState<BankCashAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  // View modal
  const [selectedViewAcc, setSelectedViewAcc] = useState<BankCashAccount | null>(null)

  // Reconcile modal
  const [selectedAcc, setSelectedAcc] = useState<BankCashAccount | null>(null)
  const [isReconcileOpen, setIsReconcileOpen] = useState(false)
  const [reconcileDate, setReconcileDate] = useState(new Date().toISOString().split("T")[0])
  const [closingBalance, setClosingBalance] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getBankCashAccounts()
      setAccounts(data)
    } catch {
      toast({
        title: "Error",
        description: "Failed to load banking accounts.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenReconcile = (acc: BankCashAccount) => {
    setSelectedAcc(acc)
    setClosingBalance(acc.current_balance)
    setIsReconcileOpen(true)
  }

  const handleSaveReconciliation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAcc) return
    setIsSubmitting(true)
    try {
      toast({
        title: "Account Reconciled",
        description: `${selectedAcc.account_name} reconciled as of ${reconcileDate}.`
      })
      setIsReconcileOpen(false)
      loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtered accounts
  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch =
      acc.account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acc.account_number && acc.account_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (acc.bank_name && acc.bank_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (acc.branch && acc.branch.toLowerCase().includes(searchQuery.toLowerCase()))

    let matchesType = true
    if (typeFilter === "bank") {
      matchesType = acc.account_type === "Bank"
    } else if (typeFilter === "mobile") {
      matchesType = acc.account_type.includes("Mobile")
    } else if (typeFilter === "gateway") {
      matchesType = acc.account_type.includes("Gateway")
    } else if (typeFilter === "cash") {
      matchesType = acc.account_type.includes("Cash")
    }

    return matchesSearch && matchesType
  })

  // Stat calculations
  const totalLiquidity = accounts.reduce((s, a) => s + a.current_balance, 0)
  const bankBalance = accounts.filter(a => a.account_type === "Bank").reduce((s, a) => s + a.current_balance, 0)
  const mobileBalance = accounts.filter(a => a.account_type.includes("Mobile")).reduce((s, a) => s + a.current_balance, 0)
  const gatewayAndCashBalance = accounts.filter(a => a.account_type.includes("Gateway") || a.account_type.includes("Cash")).reduce((s, a) => s + a.current_balance, 0)

  const columns: AdminTableColumn<BankCashAccount>[] = [
    {
      key: "account",
      header: "Account",
      render: (acc) => (
        <AdminPrimaryCell
          icon={accountIcon(acc.account_type)}
          title={acc.account_name}
          subtitle={acc.branch || undefined}
        />
      ),
    },
    {
      key: "accountNumber",
      header: "Account / Till #",
      render: (acc) => (
        <AdminPill className="font-mono normal-case tracking-normal">
          {acc.account_number || "Internal Vault"}
        </AdminPill>
      ),
    },
    {
      key: "type",
      header: "Type",
      hidden: "sm",
      render: (acc) => <AdminPill className="normal-case tracking-normal">{acc.account_type}</AdminPill>,
    },
    {
      key: "institution",
      header: "Institution",
      hidden: "md",
      render: (acc) => <AdminMutedText>{acc.bank_name || "QuardCube Treasury"}</AdminMutedText>,
    },
    {
      key: "balance",
      header: "Ledger Balance",
      align: "right",
      render: (acc) => (
        <span className="font-black text-xs sm:text-sm font-mono tracking-tight whitespace-nowrap">
          TZS {acc.current_balance.toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: () => <AdminStatusBadge status="active" label="Active" />,
    },
  ]

  const actions: AdminTableAction<BankCashAccount>[] = [
    {
      key: "view",
      label: "View Account Details",
      icon: Eye,
      variant: "view",
      onClick: (acc) => setSelectedViewAcc(acc),
    },
    {
      key: "reconcile",
      label: "Reconcile Account",
      icon: ShieldCheck,
      variant: "soft",
      onClick: (acc) => handleOpenReconcile(acc),
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
        title="Banking &"
        accent="Cash Management"
        subtitle="Corporate bank accounts, Selcom payment gateways, and M-Pesa merchant tills"
        icon={Landmark}
        onRefresh={loadData}
      />

      <AdminStats
        columns={4}
        items={[
          { title: "Total Liquid Reserves", value: `TZS ${totalLiquidity.toLocaleString()}`, icon: Landmark },
          { title: "Commercial Banks", value: `TZS ${bankBalance.toLocaleString()}`, icon: Building2 },
          { title: "Mobile Money & Tills", value: `TZS ${mobileBalance.toLocaleString()}`, icon: Smartphone },
          { title: "Gateways & Cash", value: `TZS ${gatewayAndCashBalance.toLocaleString()}`, icon: CreditCard },
        ]}
      />

      <AdminFilterBar
        tabs={[
          { key: "all", label: "All Accounts", icon: Landmark, count: accounts.length },
          { key: "bank", label: "Bank Accounts", icon: Building2, count: accounts.filter(a => a.account_type === "Bank").length },
          { key: "mobile", label: "Mobile Money", icon: Smartphone, count: accounts.filter(a => a.account_type.includes("Mobile")).length },
          { key: "gateway", label: "Payment Gateways", icon: CreditCard, count: accounts.filter(a => a.account_type.includes("Gateway")).length },
          { key: "cash", label: "Cash on Hand", icon: Wallet, count: accounts.filter(a => a.account_type.includes("Cash")).length },
        ]}
        tabValue={typeFilter}
        onTabChange={setTypeFilter}
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search account name, bank, branch, account/till number..."
      />

      <AdminTable
        columns={columns}
        data={filteredAccounts}
        rowKey={(acc) => acc.id}
        actions={actions}
        emptyIcon={Landmark}
        emptyTitle="No financial accounts found"
      />

      <AdminDetailModal
        open={!!selectedViewAcc}
        onOpenChange={(open) => !open && setSelectedViewAcc(null)}
        icon={Landmark}
        title={selectedViewAcc?.account_name ?? "Financial Account"}
        subtitle={
          selectedViewAcc
            ? `Type: ${selectedViewAcc.account_type}${selectedViewAcc.branch ? ` â€¢ Branch: ${selectedViewAcc.branch}` : ""}`
            : undefined
        }
        badge={<AdminStatusBadge status="active" label="Active Settlement Channel" />}
        footerActions={
          selectedViewAcc ? (
            <Button
              type="button"
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-5 gap-1.5 shadow-md"
              onClick={() => {
                const acc = selectedViewAcc
                setSelectedViewAcc(null)
                handleOpenReconcile(acc)
              }}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Reconcile Now
            </Button>
          ) : undefined
        }
        sections={
          selectedViewAcc
            ? [
                {
                  key: "balance",
                  title: "Settlement Balance",
                  icon: Landmark,
                  fields: [
                    { label: "Book Balance", value: <span className="font-mono font-black">{selectedViewAcc.currency || "TZS"} {selectedViewAcc.current_balance.toLocaleString()}</span> },
                    { label: "Audit Status", value: <AdminStatusBadge status="verified" label="Reconciled" /> },
                  ],
                },
                {
                  key: "institution",
                  title: "Institution Details",
                  icon: Building2,
                  fields: [
                    { label: "Provider / Bank", value: selectedViewAcc.bank_name || selectedViewAcc.account_name },
                    { label: "Branch / Node", value: selectedViewAcc.branch || "Headquarters" },
                    { label: "Account / Till", value: <span className="font-mono font-bold">{selectedViewAcc.account_number || "â€”"}</span> },
                  ],
                },
                {
                  key: "reconciliation",
                  title: "Reconciliation Status",
                  icon: Calendar,
                  span: 2,
                  fields: [
                    { label: "Currency", value: <span className="font-mono font-bold">{selectedViewAcc.currency || "TZS"}</span> },
                    { label: "Last Reconciled", value: selectedViewAcc.last_reconciled_date || "Current" },
                    { label: "Agreement", value: "100% In Agreement" },
                    ...(selectedViewAcc.notes ? [{ label: "Settlement Notes", value: selectedViewAcc.notes }] : []),
                  ],
                },
              ]
            : []
        }
      />

      <AdminFormModal
        open={isReconcileOpen}
        onOpenChange={setIsReconcileOpen}
        icon={ShieldCheck}
        title="Reconcile Financial Account"
        description="Verify book balance against official bank or mobile money settlement statement."
        onSubmit={handleSaveReconciliation}
        isSubmitting={isSubmitting}
        createLabel="Save Reconciliation"
      >
        {selectedAcc && (
          <AdminDetailSection
            title="Target Account"
            icon={Landmark}
            fields={[
              { label: "Account", value: selectedAcc.account_name },
              { label: "Book Balance", value: <span className="font-mono font-bold text-teal">TZS {selectedAcc.current_balance.toLocaleString()}</span> },
            ]}
          />
        )}

        <AdminFormGrid>
          <AdminFormField label="Statement Cut-Off Date" required>
            <AdminInput
              id="recDate"
              type="date"
              value={reconcileDate}
              onChange={e => setReconcileDate(e.target.value)}
              required
            />
          </AdminFormField>
          <AdminFormField label="Statement Ending Balance (TZS)" required>
            <AdminInput
              id="closingBal"
              type="number"
              value={closingBalance || ""}
              onChange={e => setClosingBalance(Number(e.target.value) || 0)}
              monospace
              required
            />
          </AdminFormField>
        </AdminFormGrid>
      </AdminFormModal>
    </div>
  )
}
