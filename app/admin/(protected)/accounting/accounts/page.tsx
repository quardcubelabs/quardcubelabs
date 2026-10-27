"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { AdminLoading } from "@/components/admin"
import { cn } from "@/lib/utils"
import { getChartOfAccounts, createAccount } from "@/lib/accounting-actions"
import { ChartOfAccount, AccountType } from "@/lib/erp/accounting-types"
import {
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  Wallet,
  Landmark,
  Scale,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet
} from "lucide-react"

const ACCOUNT_TYPES: { label: string; value: AccountType; color: string }[] = [
  { label: "Assets (1000s)", value: "asset", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  { label: "Liabilities (2000s)", value: "liability", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { label: "Equity (3000s)", value: "equity", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { label: "Revenue (4000s)", value: "revenue", color: "text-teal-500 bg-teal-500/10 border-teal-500/20" },
  { label: "Cost of Sales (5000s)", value: "cogs", color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
  { label: "Operating Expenses (6000s)", value: "expense", color: "text-purple-500 bg-purple-500/10 border-purple-500/20" }
]

export default function ChartOfAccountsPage() {
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
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
      toast({ title: "Account Created", description: `Account ${code} — ${name} added to General Ledger.` })
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

  if (isLoading && accounts.length === 0) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <AdminLoading />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#000080] to-[#40E0D0] text-white shadow-lg shadow-[#000080]/20">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Chart of Accounts</h1>
            <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
              Standard General Ledger hierarchy, asset valuations, and double-entry account codes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className={cn(isDark ? "border-slate-800 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-100")}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync GL
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#000080] text-white hover:bg-[#000080]/90 shadow-md shadow-[#000080]/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Account
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                Total Assets
              </span>
              <Landmark className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-xl font-bold text-emerald-500">
              TZS {totalAssets.toLocaleString()}
            </div>
            <p className={cn("mt-1 text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
              Cash, Bank, AR & Inventory
            </p>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                Total Liabilities
              </span>
              <Scale className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-xl font-bold text-amber-500">
              TZS {totalLiabilities.toLocaleString()}
            </div>
            <p className={cn("mt-1 text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
              Payables & TRA VAT
            </p>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                Shareholder Equity
              </span>
              <Wallet className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2 text-xl font-bold text-blue-500">
              TZS {totalEquity.toLocaleString()}
            </div>
            <p className={cn("mt-1 text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
              Paid-in Capital & Earnings
            </p>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                Operating Revenue
              </span>
              <TrendingUp className="h-4 w-4 text-teal-500" />
            </div>
            <div className="mt-2 text-xl font-bold text-teal-500">
              TZS {totalRevenue.toLocaleString()}
            </div>
            <p className={cn("mt-1 text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
              Hardware & Engineering
            </p>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                Direct Costs & Exp.
              </span>
              <TrendingDown className="h-4 w-4 text-rose-500" />
            </div>
            <div className="mt-2 text-xl font-bold text-rose-500">
              TZS {totalExpenses.toLocaleString()}
            </div>
            <p className={cn("mt-1 text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
              COGS & OpEx
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className={cn("absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", isDark ? "text-slate-500" : "text-slate-400")} />
          <Input
            placeholder="Search account code, name, or subcategory..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={cn("pl-9", isDark ? "bg-[#0d0d12]/60 border-slate-800" : "bg-white border-slate-200")}
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className={cn("w-[200px]", isDark ? "bg-[#0d0d12]/60 border-slate-800" : "bg-white border-slate-200")}>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="asset">Assets (1000)</SelectItem>
              <SelectItem value="liability">Liabilities (2000)</SelectItem>
              <SelectItem value="equity">Equity (3000)</SelectItem>
              <SelectItem value="revenue">Revenue (4000)</SelectItem>
              <SelectItem value="cogs">Cost of Goods Sold (5000)</SelectItem>
              <SelectItem value="expense">Operating Expenses (6000)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Account Table */}
      <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={cn("border-b text-xs uppercase tracking-wider font-semibold", isDark ? "border-slate-800 bg-slate-900/50 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-600")}>
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Account Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Sub-Category</th>
                <th className="px-4 py-3 text-right">Current Balance</th>
                <th className="px-4 py-3 text-center">Type</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No ledger accounts found matching your query.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map(account => {
                  const typeConfig = ACCOUNT_TYPES.find(t => t.value === account.type)
                  return (
                    <tr
                      key={account.id}
                      className={cn(
                        "transition-colors",
                        isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"
                      )}
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-primary">
                        {account.code}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {account.name}
                        {account.description && (
                          <p className="text-xs text-slate-500 font-normal">{account.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn("text-xs capitalize font-normal border", typeConfig?.color)}>
                          {account.type.toUpperCase()}
                        </Badge>
                      </td>
                      <td className={cn("px-4 py-3 text-xs", isDark ? "text-slate-400" : "text-slate-600")}>
                        {account.sub_category}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">
                        TZS {account.current_balance.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {account.is_system ? (
                          <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                            System
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">Custom</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Active
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Account Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={cn("max-w-md", isDark ? "bg-[#0d0d12] border-slate-800 text-slate-100" : "bg-white border-slate-200")}>
          <DialogHeader>
            <DialogTitle>Add General Ledger Account</DialogTitle>
            <DialogDescription className={isDark ? "text-slate-400" : "text-slate-500"}>
              Assign a structured accounting code and classification to expand your chart of accounts.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="code" className="text-xs">Account Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g. 1550"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className={isDark ? "bg-slate-900 border-slate-800 font-mono" : "border-slate-200 font-mono"}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="type" className="text-xs">Category *</Label>
                <Select value={type} onValueChange={(val: AccountType) => setType(val)}>
                  <SelectTrigger className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">Asset (1000)</SelectItem>
                    <SelectItem value="liability">Liability (2000)</SelectItem>
                    <SelectItem value="equity">Equity (3000)</SelectItem>
                    <SelectItem value="revenue">Revenue (4000)</SelectItem>
                    <SelectItem value="cogs">Cost of Goods Sold (5000)</SelectItem>
                    <SelectItem value="expense">Operating Expense (6000)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs">Account Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Office Hardware & Laptops"
                value={name}
                onChange={e => setName(e.target.value)}
                className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="subCategory" className="text-xs">Sub-Category</Label>
              <Input
                id="subCategory"
                placeholder="e.g. Fixed Assets, Current Assets, Payroll"
                value={subCategory}
                onChange={e => setSubCategory(e.target.value)}
                className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="balance" className="text-xs">Starting Balance (TZS)</Label>
              <Input
                id="balance"
                type="number"
                placeholder="0"
                value={startingBalance || ""}
                onChange={e => setStartingBalance(Number(e.target.value) || 0)}
                className={isDark ? "bg-slate-900 border-slate-800 font-mono" : "border-slate-200 font-mono"}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="desc" className="text-xs">Description / Accounting Policy</Label>
              <Input
                id="desc"
                placeholder="Optional notes regarding this ledger account"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#000080] text-white hover:bg-[#000080]/90">
                {isSubmitting ? "Creating..." : "Save Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
