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
  FileSpreadsheet,
  Eye,
  Calendar,
  Tag,
  FileText
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
      {/* 1. Header Banner */}
      <div className={cn(
        "p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 mb-6 transition-all duration-300",
        isDark ? "bg-[#0a1033] border-none text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className={cn(
              "w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 shadow-md",
              isDark 
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" 
                : "bg-navy text-teal border border-navy/20"
            )}>
              <BookOpen className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-0.5 sm:mb-1 truncate">
                Chart of <span className={cn(isDark ? "text-teal-400" : "text-white", "drop-shadow-sm")}>Accounts</span>
              </h1>
              <p className={cn("text-xs sm:text-base font-semibold line-clamp-1 sm:line-clamp-none", isDark ? "text-teal-300" : "text-navy/90")}>
                Standard General Ledger hierarchy, asset valuations, and double-entry account codes
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={loadData}
              className={cn(
                "rounded-lg sm:rounded-xl h-8 sm:h-11 px-2.5 sm:px-4 font-bold text-xs sm:text-sm border shadow-sm flex-1 sm:flex-none justify-center",
                isDark ? "bg-white/10 hover:bg-white/20 text-white border-white/20" : "bg-white/80 hover:bg-white text-navy border-navy/20"
              )}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Sync GL
            </Button>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-lg sm:rounded-xl h-8 sm:h-11 text-xs sm:text-sm px-3 sm:px-5 gap-1.5 sm:gap-2 shadow-lg transition-all active:scale-95 flex-1 sm:flex-none justify-center shrink-0"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">New Account</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 mb-6">
        {[
          { title: "Total Assets", value: `TZS ${totalAssets.toLocaleString()}`, icon: Landmark, sub: "Cash, Bank, AR & Stock" },
          { title: "Total Liabilities", value: `TZS ${totalLiabilities.toLocaleString()}`, icon: Scale, sub: "Payables & TRA VAT" },
          { title: "Shareholder Equity", value: `TZS ${totalEquity.toLocaleString()}`, icon: Wallet, sub: "Capital & Earnings" },
          { title: "Operating Revenue", value: `TZS ${totalRevenue.toLocaleString()}`, icon: TrendingUp, sub: "Hardware & Projects" },
          { title: "Direct Costs & Exp.", value: `TZS ${totalExpenses.toLocaleString()}`, icon: TrendingDown, sub: "COGS & OpEx" },
        ].map((stat, idx) => (
          <Card
            key={idx}
            className={cn(
              "rounded-xl sm:rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
              isDark 
                ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]" 
                : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md",
              idx === 4 ? "col-span-2 sm:col-span-1" : ""
            )}
          >
            <CardContent className="p-2.5 sm:p-4 flex items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <p className={cn("text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-0.5 sm:mb-1 truncate block", isDark ? "text-teal-400/80" : "text-navy/70")}>
                  {stat.title}
                </p>
                <span className={cn("text-base sm:text-lg font-black truncate block leading-tight tracking-tight", isDark ? "text-white" : "text-navy")}>
                  {stat.value}
                </span>
                <p className={cn("text-[10px] font-medium mt-0.5 sm:mt-1 truncate", isDark ? "text-slate-400" : "text-navy/60")}>
                  {stat.sub}
                </p>
              </div>
              <div className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                isDark 
                  ? "bg-teal-400/10 border-teal-400/30 text-teal-300 group-hover:bg-teal-400/20" 
                  : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
              )}>
                <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. Search & Filter Bar with Category Tabs */}
      <Card className={cn(
        "rounded-2xl p-3 sm:p-4 transition-all duration-300 space-y-3",
        isDark ? "bg-[#0a1033] border-none shadow-none" : "bg-white border-2 border-navy/20 shadow-sm"
      )}>
        {/* Category Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: "all", label: "All Accounts", icon: BookOpen, count: accounts.length },
            { key: "asset", label: "Assets", icon: Landmark, count: accounts.filter(a => a.type === "asset").length },
            { key: "liability", label: "Liabilities", icon: Scale, count: accounts.filter(a => a.type === "liability").length },
            { key: "equity", label: "Equity", icon: Wallet, count: accounts.filter(a => a.type === "equity").length },
            { key: "revenue", label: "Revenue", icon: TrendingUp, count: accounts.filter(a => a.type === "revenue").length },
            { key: "cogs", label: "COGS", icon: Layers, count: accounts.filter(a => a.type === "cogs").length },
            { key: "expense", label: "Expenses", icon: TrendingDown, count: accounts.filter(a => a.type === "expense").length },
          ].map((tab) => {
            const isSelected = typeFilter === tab.key
            const Icon = tab.icon

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTypeFilter(tab.key)}
                className={cn(
                  "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer",
                  isSelected
                    ? "bg-navy text-white shadow-md"
                    : isDark 
                      ? "text-slate-300 hover:bg-teal-400/10 hover:text-teal-300" 
                      : "text-navy/70 hover:bg-teal-50 hover:text-navy"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isSelected ? "text-white" : isDark ? "text-slate-400" : "text-navy/60")} />
                <span>{tab.label}</span>
                <span className={cn(
                  "ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors",
                  isSelected 
                    ? "bg-white/20 text-white"
                    : isDark ? "bg-slate-800 text-slate-300" : "bg-navy/10 text-navy"
                )}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search & Sub-category Filter */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-1">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal h-4 w-4" />
            <Input
              placeholder="Search account code, name, or subcategory..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10 h-10 sm:h-11 rounded-xl border font-medium text-xs sm:text-sm w-full border-slate-300 dark:border-slate-600",
                isDark ? "bg-[#080d2a] text-white" : "bg-white text-navy"
              )}
            />
          </div>

          <div className="w-full sm:w-56 shrink-0">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className={cn(
                "h-10 sm:h-11 rounded-xl border font-bold text-xs shrink-0 border-slate-300 dark:border-slate-600",
                isDark ? "bg-[#080d2a] text-white" : "bg-white text-navy"
              )}>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"}>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="asset">Assets (1000s)</SelectItem>
                <SelectItem value="liability">Liabilities (2000s)</SelectItem>
                <SelectItem value="equity">Equity (3000s)</SelectItem>
                <SelectItem value="revenue">Revenue (4000s)</SelectItem>
                <SelectItem value="cogs">Cost of Goods Sold (5000s)</SelectItem>
                <SelectItem value="expense">Operating Expenses (6000s)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* 4. Accounts Table Card */}
      <Card className={cn(
        "rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg transition-all duration-300 w-full",
        isDark ? "bg-[#060a22] border-none text-white shadow-none" : "bg-white border-2 border-navy/20 text-navy"
      )}>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-navy text-white font-black border-b border-navy/30">
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-left">Account</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-left">Category</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-left hidden sm:table-cell">Sub-Category</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right">Current Balance</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-center hidden md:table-cell">Type</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-center">Status</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 dark:divide-teal/15">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-navy/60 dark:text-slate-400">
                    <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40 text-navy dark:text-teal" />
                    <p className="font-bold text-base">No ledger accounts found</p>
                    <p className="text-xs font-medium mt-1">Try adjusting your filters or search keyword</p>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map(account => {
                  const typeConfig = ACCOUNT_TYPES.find(t => t.value === account.type)
                  return (
                    <tr
                      key={account.id}
                      className={cn(
                        "transition-colors duration-150",
                        isDark ? "hover:bg-teal/30 hover:text-white" : "hover:bg-teal/50 hover:text-navy"
                      )}
                    >
                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className={cn(
                            "hidden sm:flex w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full items-center justify-center shrink-0 shadow-sm border",
                            isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40"
                          )}>
                            <BookOpen className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isDark ? "text-teal" : "text-navy")} />
                          </div>
                          <div>
                            <span className={cn("font-bold font-mono text-xs sm:text-sm mr-2", isDark ? "text-teal-400" : "text-navy")}>
                              {account.code}
                            </span>
                            <span className={cn("font-bold text-xs sm:text-sm", isDark ? "text-white" : "text-navy")}>
                              {account.name}
                            </span>
                            {account.description && (
                              <p className={cn("text-[11px] font-medium truncate max-w-xs", isDark ? "text-slate-400" : "text-navy/60")}>
                                {account.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-4">
                        <Badge variant="outline" className={cn("text-[10px] sm:text-xs font-bold uppercase", typeConfig?.color)}>
                          {account.type}
                        </Badge>
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 hidden sm:table-cell">
                        <span className={cn("text-xs font-semibold", isDark ? "text-slate-300" : "text-navy/80")}>
                          {account.sub_category}
                        </span>
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">
                        <span className={cn("font-black text-xs sm:text-sm font-mono tracking-tight", isDark ? "text-white" : "text-navy")}>
                          TZS {account.current_balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-center hidden md:table-cell">
                        {account.is_system ? (
                          <Badge className="bg-navy text-white text-[10px] font-bold">
                            System
                          </Badge>
                        ) : (
                          <span className={cn("text-xs font-semibold", isDark ? "text-slate-400" : "text-navy/60")}>Custom</span>
                        )}
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Active
                        </span>
                      </td>
                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                          <button
                            onClick={() => setSelectedAccount(account)}
                            className={cn(
                              "p-1 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                              isDark ? "bg-navy border border-teal/40 text-teal hover:bg-teal hover:text-navy" : "bg-navy text-white hover:bg-navy/90"
                            )}
                            title="View Account Details"
                          >
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        </div>
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
        <DialogContent className={cn("max-w-lg", isDark ? "bg-[#0a1033] border-2 border-teal/30 text-white" : "bg-white border-2 border-navy text-navy")}>
          <DialogHeader>
            <DialogTitle className={cn("text-lg sm:text-xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
              Add General Ledger Account
            </DialogTitle>
            <DialogDescription className={cn("text-xs sm:text-sm font-medium", isDark ? "text-slate-300" : "text-navy/70")}>
              Assign a structured accounting code and classification to expand your chart of accounts.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-xs font-bold uppercase tracking-wider">Account Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g. 1550"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-mono font-bold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type" className="text-xs font-bold uppercase tracking-wider">Category *</Label>
                <Select value={type} onValueChange={(val: AccountType) => setType(val)}>
                  <SelectTrigger className={cn("h-10 sm:h-11 rounded-xl border-2 font-semibold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"}>
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

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider">Account Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Office Hardware & Laptops"
                value={name}
                onChange={e => setName(e.target.value)}
                className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subCategory" className="text-xs font-bold uppercase tracking-wider">Sub-Category</Label>
              <Input
                id="subCategory"
                placeholder="e.g. Fixed Assets, Current Assets, Payroll"
                value={subCategory}
                onChange={e => setSubCategory(e.target.value)}
                className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="balance" className="text-xs font-bold uppercase tracking-wider">Starting Balance (TZS)</Label>
              <Input
                id="balance"
                type="number"
                placeholder="0"
                value={startingBalance || ""}
                onChange={e => setStartingBalance(Number(e.target.value) || 0)}
                className={cn("h-10 sm:h-11 rounded-xl border-2 font-mono font-bold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc" className="text-xs font-bold uppercase tracking-wider">Description / Accounting Policy</Label>
              <Input
                id="desc"
                placeholder="Optional notes regarding this ledger account"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
              />
            </div>

            <DialogFooter className="pt-3 border-t border-navy/10 dark:border-teal/20 flex flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className={cn("rounded-xl font-bold h-10 px-5", isDark ? "border-teal/30 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-5 gap-1.5 shadow-md"
              >
                {isSubmitting ? "Creating..." : "Save Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Account Details View Modal */}
      <Dialog open={!!selectedAccount} onOpenChange={(open) => !open && setSelectedAccount(null)}>
        <DialogContent className={cn("max-w-2xl", isDark ? "bg-[#0a1033] border-2 border-teal/30 text-white" : "bg-white border-2 border-navy text-navy")}>
          {selectedAccount && (
            <div className="space-y-6">
              {/* Header Navigation Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-navy/10 dark:border-teal/20 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-inner", isDark ? "bg-teal/20 text-teal" : "bg-navy text-white")}>
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-sm px-2 py-0.5 rounded-md bg-teal/20 text-teal border border-teal/30">
                        {selectedAccount.code}
                      </span>
                      <h2 className={cn("text-xl sm:text-2xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
                        {selectedAccount.name}
                      </h2>
                    </div>
                    <p className={cn("text-xs sm:text-sm font-medium mt-0.5", isDark ? "text-slate-300" : "text-navy/70")}>
                      Category: <span className="font-bold uppercase">{selectedAccount.type}</span> • Sub-Category: <span className="font-bold">{selectedAccount.sub_category}</span>
                    </p>
                  </div>
                </div>

                <Badge
                  className={cn(
                    "font-bold text-xs px-3 py-1 rounded-lg",
                    selectedAccount.is_system ? "bg-navy text-white" : "bg-teal text-navy font-black"
                  )}
                >
                  {selectedAccount.is_system ? "System Protected" : "Custom Account"}
                </Badge>
              </div>

              {/* Main Balance Banner */}
              <div className={cn(
                "p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
                isDark ? "bg-teal/15 border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
              )}>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider opacity-70 block">Current Ledger Balance</span>
                  <div className="font-mono font-black text-2xl sm:text-3xl tracking-tight mt-0.5">
                    {selectedAccount.currency || "TZS"} {selectedAccount.current_balance.toLocaleString()}
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  Active in General Ledger
                </div>
              </div>

              {/* Account Scope and Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={cn(
                  "p-4 rounded-2xl border space-y-3",
                  isDark ? "bg-teal/10 border-teal/30 text-white" : "bg-slate-50 border-2 border-navy/20 text-navy"
                )}>
                  <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b border-navy/10 dark:border-teal/20 pb-2">
                    <FileText className="h-4 w-4 text-teal" />
                    Accounting Policy & Notes
                  </h3>
                  <p className="text-xs leading-relaxed opacity-85">
                    {selectedAccount.description || "No specific accounting notes or policy documented for this account."}
                  </p>
                </div>

                <div className={cn(
                  "p-4 rounded-2xl border space-y-3",
                  isDark ? "bg-teal/10 border-teal/30 text-white" : "bg-slate-50 border-2 border-navy/20 text-navy"
                )}>
                  <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b border-navy/10 dark:border-teal/20 pb-2">
                    <Calendar className="h-4 w-4 text-teal" />
                    Ledger Details
                  </h3>
                  <div className="space-y-2 text-xs font-medium">
                    <div className="flex justify-between items-center">
                      <span className="opacity-70">Currency</span>
                      <span className="font-mono font-bold">{selectedAccount.currency || "TZS"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="opacity-70">Account ID</span>
                      <span className="font-mono text-[11px] opacity-80">{selectedAccount.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="opacity-70">Created Date</span>
                      <span className="font-bold">
                        {selectedAccount.created_at ? new Date(selectedAccount.created_at).toLocaleDateString() : "System Standard"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <DialogFooter className="border-t border-navy/10 dark:border-teal/20 pt-4 flex flex-row justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedAccount(null)}
                  className={cn("rounded-xl font-bold h-10 px-5", isDark ? "border-teal/30 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
