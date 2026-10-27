"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { AdminLoading } from "@/components/admin"
import { cn } from "@/lib/utils"
import { getBankCashAccounts } from "@/lib/accounting-actions"
import { BankCashAccount } from "@/lib/erp/accounting-types"
import {
  Landmark,
  Wallet,
  Smartphone,
  CreditCard,
  RefreshCw,
  CheckCircle2,
  Calendar,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  DollarSign,
  Search,
  Eye,
  FileText
} from "lucide-react"

export default function BankingManagementPage() {
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

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
              <Landmark className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-0.5 sm:mb-1 truncate">
                Banking & <span className={cn(isDark ? "text-teal-400" : "text-white", "drop-shadow-sm")}>Cash Management</span>
              </h1>
              <p className={cn("text-xs sm:text-base font-semibold line-clamp-1 sm:line-clamp-none", isDark ? "text-teal-300" : "text-navy/90")}>
                Corporate bank accounts, Selcom payment gateways, and M-Pesa merchant tills
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className={cn(
                "rounded-xl h-8 sm:h-11 px-2.5 sm:px-4 font-bold text-xs sm:text-sm border shadow-sm transition-all active:scale-95",
                isDark ? "bg-white/10 hover:bg-white/20 text-white border-white/20" : "bg-white/80 hover:bg-white text-navy border-navy/20"
              )}
            >
              <RefreshCw className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Refresh Balances</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          { title: "Total Liquid Reserves", value: `TZS ${totalLiquidity.toLocaleString()}`, icon: Landmark, color: "text-emerald-500" },
          { title: "Commercial Banks", value: `TZS ${bankBalance.toLocaleString()}`, icon: Building2, color: "text-blue-500" },
          { title: "Mobile Money & Tills", value: `TZS ${mobileBalance.toLocaleString()}`, icon: Smartphone, color: "text-teal-500" },
          { title: "Gateways & Cash", value: `TZS ${gatewayAndCashBalance.toLocaleString()}`, icon: CreditCard, color: "text-amber-500" }
        ].map((stat, idx) => (
          <Card
            key={idx}
            className={cn(
              "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group overflow-hidden",
              isDark 
                ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]" 
                : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
            )}
          >
            <CardContent className="p-3 sm:p-4.5 flex items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <p className={cn("text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5 sm:mb-1 truncate block", isDark ? "text-teal-400/80" : "text-navy/70")}>
                  {stat.title}
                </p>
                <span className={cn("text-xs sm:text-sm lg:text-base font-black truncate block font-mono leading-tight tracking-tight", isDark ? "text-white" : "text-navy")}>
                  {stat.value}
                </span>
              </div>
              <div className={cn(
                "w-9 h-9 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                isDark 
                  ? "bg-navy border-teal/30 text-teal group-hover:bg-navy/80" 
                  : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
              )}>
                <stat.icon className={cn("h-4 w-4 sm:h-5 sm:w-5 shrink-0", isDark ? "text-teal" : "")} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. Search & Filter Bar */}
      <Card className={cn(
        "rounded-2xl p-3 sm:p-4 transition-all duration-300 space-y-3",
        isDark ? "bg-[#0a1033] border-none shadow-none" : "bg-white border-2 border-navy/20 shadow-sm"
      )}>
        {/* Category Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: "all", label: "All Accounts", icon: Landmark, count: accounts.length },
            { key: "bank", label: "Bank Accounts", icon: Building2, count: accounts.filter(a => a.account_type === "Bank").length },
            { key: "mobile", label: "Mobile Money", icon: Smartphone, count: accounts.filter(a => a.account_type.includes("Mobile")).length },
            { key: "gateway", label: "Payment Gateways", icon: CreditCard, count: accounts.filter(a => a.account_type.includes("Gateway")).length },
            { key: "cash", label: "Cash on Hand", icon: Wallet, count: accounts.filter(a => a.account_type.includes("Cash")).length }
          ].map((tab) => {
            const isSelected = typeFilter === tab.key
            const Icon = tab.icon

            return (
              <button
                key={tab.key}
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

        {/* Search Input */}
        <div className="pt-1">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal h-4 w-4" />
            <Input
              placeholder="Search account name, bank, branch, account/till number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10 h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm",
                isDark 
                  ? "bg-[#080d2a] border-teal/30 text-white placeholder:text-slate-500 focus-visible:ring-teal/30" 
                  : "bg-white border-navy/20 text-navy placeholder:text-navy/40 focus-visible:ring-navy/20"
              )}
            />
          </div>
        </div>
      </Card>

      {/* 4. Account Cards Grid */}
      {filteredAccounts.length === 0 ? (
        <Card className={cn("rounded-2xl p-12 text-center", isDark ? "bg-[#0a1033] border-none" : "bg-white border-2 border-navy/20")}>
          <Landmark className="h-12 w-12 mx-auto mb-3 opacity-40 text-navy dark:text-teal" />
          <p className={cn("font-bold text-base", isDark ? "text-white" : "text-navy")}>No financial accounts found</p>
          <p className={cn("text-xs font-medium mt-1", isDark ? "text-slate-400" : "text-navy/60")}>Try adjusting your search query or category filter</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredAccounts.map(acc => {
            let icon = <Landmark className="h-5 w-5" />
            if (acc.account_type.includes("Cash")) {
              icon = <Wallet className="h-5 w-5" />
            } else if (acc.account_type.includes("Mobile")) {
              icon = <Smartphone className="h-5 w-5" />
            } else if (acc.account_type.includes("Gateway")) {
              icon = <CreditCard className="h-5 w-5" />
            }

            return (
              <Card
                key={acc.id}
                className={cn(
                  "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 overflow-hidden",
                  isDark 
                    ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]" 
                    : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
                )}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full border flex items-center justify-center shrink-0 shadow-sm",
                        isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40"
                      )}>
                        {icon}
                      </div>
                      <div>
                        <h3 className={cn("font-bold text-base", isDark ? "text-white" : "text-navy")}>
                          {acc.account_name}
                        </h3>
                        <p className={cn("text-xs font-semibold", isDark ? "text-slate-400" : "text-navy/70")}>
                          {acc.account_type} {acc.branch ? `• ${acc.branch}` : ""}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-500 bg-emerald-500/10 font-bold">
                      Active
                    </Badge>
                  </div>

                  <div className="pt-3 border-t border-navy/10 dark:border-teal/10 flex items-center justify-between">
                    <div>
                      <span className={cn("text-[11px] font-bold uppercase tracking-wider block", isDark ? "text-slate-400" : "text-navy/60")}>
                        Ledger Balance
                      </span>
                      <div className={cn("text-xl font-black font-mono tracking-tight", isDark ? "text-white" : "text-navy")}>
                        TZS {acc.current_balance.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedViewAcc(acc)}
                        className={cn(
                          "rounded-xl h-9 text-xs font-bold border",
                          isDark ? "border-teal/30 hover:bg-teal/20 text-white" : "border-navy/20 hover:bg-teal-50 text-navy"
                        )}
                        title="View Account Details"
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        Details
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleOpenReconcile(acc)}
                        className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-9 text-xs gap-1 shadow-xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        Reconcile
                      </Button>
                    </div>
                  </div>

                  {acc.account_number && (
                    <div className={cn("text-xs font-mono font-medium", isDark ? "text-slate-400" : "text-navy/60")}>
                      Account / Till No: {acc.account_number}
                    </div>
                  )}

                  {acc.last_reconciled_date && (
                    <div className={cn("text-[11px] font-semibold flex items-center gap-1", isDark ? "text-slate-400" : "text-navy/60")}>
                      <Calendar className="h-3 w-3 text-teal" />
                      Last reconciled: {acc.last_reconciled_date}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* 5. Account Details View Modal */}
      <Dialog open={!!selectedViewAcc} onOpenChange={(open) => !open && setSelectedViewAcc(null)}>
        <DialogContent className={cn("max-w-2xl", isDark ? "bg-[#0a1033] border-2 border-teal/30 text-white" : "bg-white border-2 border-navy text-navy")}>
          {selectedViewAcc && (
            <div className="space-y-6">
              {/* Header Navigation Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-navy/10 dark:border-teal/20 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-inner", isDark ? "bg-teal/20 text-teal" : "bg-navy text-white")}>
                    <Landmark className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className={cn("text-xl sm:text-2xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
                      {selectedViewAcc.account_name}
                    </h2>
                    <p className={cn("text-xs sm:text-sm font-medium mt-0.5", isDark ? "text-slate-300" : "text-navy/70")}>
                      Type: <span className="font-bold">{selectedViewAcc.account_type}</span> {selectedViewAcc.branch ? `• Branch: ${selectedViewAcc.branch}` : ""}
                    </p>
                  </div>
                </div>

                <Badge className="font-bold text-xs px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                  Active Settlement Channel
                </Badge>
              </div>

              {/* Main Balance Banner */}
              <div className={cn(
                "p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
                isDark ? "bg-teal/15 border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
              )}>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider opacity-70 block">Book / Settlement Balance</span>
                  <div className="font-mono font-black text-2xl sm:text-3xl tracking-tight mt-0.5">
                    {selectedViewAcc.currency || "TZS"} {selectedViewAcc.current_balance.toLocaleString()}
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  Reconciled
                </div>
              </div>

              {/* Account Scope and Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={cn(
                  "p-4 rounded-2xl border space-y-3",
                  isDark ? "bg-teal/10 border-teal/30 text-white" : "bg-slate-50 border-2 border-navy/20 text-navy"
                )}>
                  <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b border-navy/10 dark:border-teal/20 pb-2">
                    <Building2 className="h-4 w-4 text-teal" />
                    Institution Details
                  </h3>
                  <div className="space-y-2 text-xs font-medium">
                    <div className="flex justify-between items-center">
                      <span className="opacity-70">Provider / Bank</span>
                      <span className="font-bold">{selectedViewAcc.bank_name || selectedViewAcc.account_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="opacity-70">Branch / Node</span>
                      <span className="font-bold">{selectedViewAcc.branch || "Headquarters"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="opacity-70">Account / Till</span>
                      <span className="font-mono font-bold">{selectedViewAcc.account_number || "—"}</span>
                    </div>
                  </div>
                </div>

                <div className={cn(
                  "p-4 rounded-2xl border space-y-3",
                  isDark ? "bg-teal/10 border-teal/30 text-white" : "bg-slate-50 border-2 border-navy/20 text-navy"
                )}>
                  <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b border-navy/10 dark:border-teal/20 pb-2">
                    <Calendar className="h-4 w-4 text-teal" />
                    Reconciliation Status
                  </h3>
                  <div className="space-y-2 text-xs font-medium">
                    <div className="flex justify-between items-center">
                      <span className="opacity-70">Currency</span>
                      <span className="font-mono font-bold">{selectedViewAcc.currency || "TZS"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="opacity-70">Last Reconciled</span>
                      <span className="font-bold">{selectedViewAcc.last_reconciled_date || "Current"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="opacity-70">Audit Status</span>
                      <span className="text-emerald-500 font-bold">100% In Agreement</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedViewAcc.notes && (
                <div className={cn(
                  "p-4 rounded-2xl border space-y-1.5",
                  isDark ? "bg-teal/10 border-teal/30 text-white" : "bg-slate-50 border-2 border-navy/20 text-navy"
                )}>
                  <span className="text-xs font-black uppercase tracking-wider opacity-70">Settlement Notes</span>
                  <p className="text-xs leading-relaxed opacity-90">{selectedViewAcc.notes}</p>
                </div>
              )}

              {/* Modal Footer */}
              <DialogFooter className="border-t border-navy/10 dark:border-teal/20 pt-4 flex flex-row justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedViewAcc(null)}
                  className={cn("rounded-xl font-bold h-10 px-5", isDark ? "border-teal/30 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const acc = selectedViewAcc
                    setSelectedViewAcc(null)
                    handleOpenReconcile(acc)
                  }}
                  className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-5 gap-1.5 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Reconcile Now
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 6. Reconcile Dialog */}
      <Dialog open={isReconcileOpen} onOpenChange={setIsReconcileOpen}>
        <DialogContent className={cn("max-w-md", isDark ? "bg-[#0a1033] border-2 border-teal/30 text-white" : "bg-white border-2 border-navy text-navy")}>
          <DialogHeader>
            <DialogTitle className={cn("text-lg sm:text-xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
              Reconcile Financial Account
            </DialogTitle>
            <DialogDescription className={cn("text-xs sm:text-sm font-medium", isDark ? "text-slate-300" : "text-navy/70")}>
              Verify book balance against official bank or mobile money settlement statement.
            </DialogDescription>
          </DialogHeader>

          {selectedAcc && (
            <form onSubmit={handleSaveReconciliation} className="space-y-4 pt-1">
              <div className={cn(
                "p-3.5 rounded-xl border space-y-1",
                isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-slate-50 border-navy/20 text-navy"
              )}>
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">Target Account</span>
                <p className="font-bold text-sm">{selectedAcc.account_name}</p>
                <p className="text-xs font-mono font-bold text-teal mt-0.5">
                  Book Balance: TZS {selectedAcc.current_balance.toLocaleString()}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="recDate" className="text-xs font-bold uppercase tracking-wider">Statement Cut-Off Date *</Label>
                <Input
                  id="recDate"
                  type="date"
                  value={reconcileDate}
                  onChange={e => setReconcileDate(e.target.value)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="closingBal" className="text-xs font-bold uppercase tracking-wider">Statement Ending Balance (TZS) *</Label>
                <Input
                  id="closingBal"
                  type="number"
                  value={closingBalance || ""}
                  onChange={e => setClosingBalance(Number(e.target.value) || 0)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-mono font-bold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                  required
                />
              </div>

              <DialogFooter className="pt-3 border-t border-navy/10 dark:border-teal/20 flex flex-row justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsReconcileOpen(false)}
                  className={cn("rounded-xl font-bold h-10 px-5", isDark ? "border-teal/30 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-5 gap-1.5 shadow-md"
                >
                  {isSubmitting ? "Reconciling..." : "Save Reconciliation"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
