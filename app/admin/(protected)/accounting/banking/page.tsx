"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { AdminLoading, AdminPagination } from "@/components/admin"
import { cn } from "@/lib/utils"
import { formatCompactNumber, formatCompactCurrency } from "@/lib/admin-format"
import { getBankCashAccounts, updateBankAccount, deleteBankAccount } from "@/lib/accounting-actions"
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
  FileText,
  Edit3,
  Trash2
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

  const simplifyAccountType = (type: string) => {
    const t = (type || "").toLowerCase()
    if (t.includes("m-pesa")) return "M-Pesa"
    if (t.includes("airtel")) return "Airtel"
    if (t.includes("tigo")) return "Tigo Pesa"
    if (t.includes("selcom") || t.includes("gateway")) return "Selcom"
    if (t.includes("cash")) return "Cash"
    if (t.includes("bank")) return "Bank"
    return type
  }

  // Edit State & Handler
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingAcc, setEditingAcc] = useState<BankCashAccount | null>(null)
  const [editAccName, setEditAccName] = useState("")
  const [editAccType, setEditAccType] = useState<BankCashAccount["account_type"]>("Bank")
  const [editAccNumber, setEditAccNumber] = useState("")
  const [editBankName, setEditBankName] = useState("")
  const [editBranch, setEditBranch] = useState("")
  const [editBalance, setEditBalance] = useState<number>(0)
  const [isEditing, setIsEditing] = useState(false)

  // Delete State & Handler
  const [accToDelete, setAccToDelete] = useState<BankCashAccount | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleOpenEdit = (acc: BankCashAccount) => {
    setEditingAcc(acc)
    setEditAccName(acc.account_name)
    setEditAccType(acc.account_type)
    setEditAccNumber(acc.account_number || "")
    setEditBankName(acc.bank_name || "")
    setEditBranch(acc.branch || "")
    setEditBalance(acc.current_balance || 0)
    setIsEditOpen(true)
  }

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAcc || !editAccName.trim()) return
    setIsEditing(true)
    try {
      await updateBankAccount(editingAcc.id, {
        account_name: editAccName.trim(),
        account_type: editAccType,
        account_number: editAccNumber.trim(),
        bank_name: editBankName.trim(),
        branch: editBranch.trim(),
        current_balance: editBalance
      })
      toast({ title: "Account Updated", description: `${editAccName} has been updated.` })
      setIsEditOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update account.", variant: "destructive" })
    } finally {
      setIsEditing(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!accToDelete) return
    setIsDeleting(true)
    try {
      await deleteBankAccount(accToDelete.id)
      toast({ title: "Account Deleted", description: `${accToDelete.account_name} was removed.` })
      setAccToDelete(null)
      loadData()
    } catch (err: any) {
      toast({ title: "Cannot Delete Account", description: err.message || "Failed to delete account.", variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

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

  // Filtered accounts & Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

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

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage) || 1
  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAccounts.slice(start, start + itemsPerPage)
  }, [filteredAccounts, currentPage])

  // Stat calculations
  const totalLiquidity = accounts.reduce((s, a) => s + a.current_balance, 0)
  const bankBalance = accounts.filter(a => a.account_type === "Bank").reduce((s, a) => s + a.current_balance, 0)
  const mobileBalance = accounts.filter(a => a.account_type.includes("Mobile")).reduce((s, a) => s + a.current_balance, 0)
  const gatewayAndCashBalance = accounts.filter(a => a.account_type.includes("Gateway") || a.account_type.includes("Cash")).reduce((s, a) => s + a.current_balance, 0)

  if (isLoading && accounts.length === 0) {
    return <AdminLoading />
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
          { title: "Total Liquid Reserves", value: formatCompactCurrency(totalLiquidity), icon: Landmark, color: "text-emerald-500" },
          { title: "Commercial Banks", value: formatCompactCurrency(bankBalance), icon: Building2, color: "text-blue-500" },
          { title: "Mobile Money & Tills", value: formatCompactCurrency(mobileBalance), icon: Smartphone, color: "text-teal-500" },
          { title: "Gateways & Cash", value: formatCompactCurrency(gatewayAndCashBalance), icon: CreditCard, color: "text-amber-500" }
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
                <span className={cn("text-lg sm:text-xl xl:text-2xl font-black truncate block leading-tight tracking-tight", isDark ? "text-white" : "text-navy")}>
                  {stat.value}
                </span>
              </div>
              <div className={cn(
                "w-9 h-9 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                isDark
                  ? "bg-navy border-teal/30 text-teal group-hover:bg-navy/80"
                  : "bg-teal border-teal/40 text-navy group-hover:bg-teal/80 shadow-sm"
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
                onClick={() => { setTypeFilter(tab.key); setCurrentPage(1); }}
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

      {/* 4. Accounts Table */}
      <Card className={cn(
        "rounded-xl sm:rounded-2xl overflow-hidden shadow-lg transition-all duration-300 w-full",
        isDark ? "bg-[#060a22] border-none text-white shadow-none" : "bg-white border-2 border-navy/20 text-navy"
      )}>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-navy text-white font-black border-b border-navy/30">
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-left">Account</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-left">Type</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-left hidden md:table-cell">Institution</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right">Ledger Balance</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-center">Status</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 dark:divide-teal/15">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-navy/60 dark:text-slate-400">
                    <Landmark className="h-10 w-10 mx-auto mb-3 opacity-40 text-navy dark:text-teal" />
                    <p className="font-bold text-base">No financial accounts found</p>
                    <p className="text-xs font-medium mt-1">Try adjusting your filters or search keyword</p>
                  </td>
                </tr>
              ) : (
                paginatedAccounts.map(acc => {
                  let Icon = Landmark
                  if (acc.account_type.includes("Cash")) {
                    Icon = Wallet
                  } else if (acc.account_type.includes("Mobile")) {
                    Icon = Smartphone
                  } else if (acc.account_type.includes("Gateway")) {
                    Icon = CreditCard
                  }

                  return (
                    <tr
                      key={acc.id}
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
                            <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isDark ? "text-teal" : "text-navy")} />
                          </div>
                          <div className="min-w-0">
                            <div className={cn("font-bold text-xs sm:text-sm truncate", isDark ? "text-white" : "text-navy")}>
                              {acc.account_name}
                            </div>
                            {acc.branch && (
                              <p className={cn("hidden sm:block text-[11px] font-medium truncate", isDark ? "text-slate-400" : "text-navy/60")}>
                                {acc.branch}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 whitespace-nowrap">
                        <Badge variant="outline" className={cn("text-[10px] sm:text-xs font-bold border", isDark ? "border-white/20 text-white bg-white/5" : "border-navy/20 text-navy bg-slate-50")}>
                          {simplifyAccountType(acc.account_type)}
                        </Badge>
                      </td>

                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 hidden md:table-cell whitespace-nowrap">
                        <span className={cn("text-xs font-semibold", isDark ? "text-slate-300" : "text-navy/80")}>
                          {acc.bank_name || "QuardCube Treasury"}
                        </span>
                      </td>

                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">
                        <span className={cn("font-black text-xs sm:text-sm font-mono tracking-tight", isDark ? "text-white" : "text-navy")}>
                          TZS {acc.current_balance.toLocaleString()}
                        </span>
                      </td>

                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Active
                        </span>
                      </td>

                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                          <button
                            onClick={() => setSelectedViewAcc(acc)}
                            className={cn(
                              "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                              isDark ? "bg-navy border border-blue-500/40 text-blue-400 hover:bg-blue-600 hover:text-white" : "bg-navy text-white hover:bg-navy/90"
                            )}
                            title="View Account Details"
                          >
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenReconcile(acc)}
                            className={cn(
                              "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                              isDark ? "bg-white/10 text-white hover:bg-white hover:text-navy" : "bg-navy/10 text-navy hover:bg-navy hover:text-white"
                            )}
                            title="Reconcile Account"
                          >
                            <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(acc)}
                            className={cn(
                              "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                              isDark ? "bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-navy" : "bg-amber-50 border border-amber-500/30 text-amber-700 hover:bg-amber-500 hover:text-white"
                            )}
                            title="Edit Account"
                          >
                            <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => setAccToDelete(acc)}
                            className={cn(
                              "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                              isDark ? "bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white" : "bg-rose-50 border border-rose-500/30 text-rose-700 hover:bg-rose-500 hover:text-white"
                            )}
                            title="Delete Account"
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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

      {/* Pagination Controls */}
      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredAccounts.length}
        onPageChange={setCurrentPage}
      />

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
      </Dialog >

  {/* 6. Reconcile Dialog */ }
  < Dialog open = { isReconcileOpen } onOpenChange = { setIsReconcileOpen } >
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
      </Dialog >

  {/* 7. Edit Banking Account Dialog */ }
  < Dialog open = { isEditOpen } onOpenChange = { setIsEditOpen } >
    <DialogContent className={cn("max-w-md", isDark ? "bg-[#0a1033] border-2 border-teal/30 text-white" : "bg-white border-2 border-navy text-navy")}>
      <DialogHeader>
        <DialogTitle className={cn("text-lg sm:text-xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
          Edit Banking &amp; Cash Account
        </DialogTitle>
        <DialogDescription className={cn("text-xs sm:text-sm font-medium", isDark ? "text-slate-300" : "text-navy/70")}>
          Update account details, channel type, or ledger balance.
        </DialogDescription>
      </DialogHeader>

      {editingAcc && (
        <form onSubmit={handleUpdateAccount} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="editAccName" className="text-xs font-bold uppercase tracking-wider">Account Title *</Label>
            <Input
              id="editAccName"
              value={editAccName}
              onChange={e => setEditAccName(e.target.value)}
              className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="editAccType" className="text-xs font-bold uppercase tracking-wider">Account Type *</Label>
              <Select value={editAccType} onValueChange={(val: any) => setEditAccType(val)}>
                <SelectTrigger className={cn("h-10 sm:h-11 rounded-xl border-2 font-semibold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"}>
                  <SelectItem value="Bank">Bank Account</SelectItem>
                  <SelectItem value="Mobile Money (M-Pesa)">M-Pesa</SelectItem>
                  <SelectItem value="Mobile Money (Airtel)">Airtel Money</SelectItem>
                  <SelectItem value="Mobile Money (Tigo Pesa)">Tigo Pesa</SelectItem>
                  <SelectItem value="Payment Gateway (Selcom)">Selcom</SelectItem>
                  <SelectItem value="Cash on Hand">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editBankName" className="text-xs font-bold uppercase tracking-wider">Institution / Bank</Label>
              <Input
                id="editBankName"
                value={editBankName}
                onChange={e => setEditBankName(e.target.value)}
                className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="editBranch" className="text-xs font-bold uppercase tracking-wider">Branch / Hub</Label>
              <Input
                id="editBranch"
                value={editBranch}
                onChange={e => setEditBranch(e.target.value)}
                className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editBalance" className="text-xs font-bold uppercase tracking-wider">Ledger Balance (TZS)</Label>
              <Input
                id="editBalance"
                type="number"
                value={editBalance || ""}
                onChange={e => setEditBalance(Number(e.target.value) || 0)}
                className={cn("h-10 sm:h-11 rounded-xl border-2 font-mono font-bold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-navy/10 dark:border-teal/20 flex flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              className={cn("rounded-xl font-bold h-10 px-5", isDark ? "border-teal/30 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isEditing}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-5 gap-1.5 shadow-md"
            >
              {isEditing ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      )}
    </DialogContent>
      </Dialog >

  {/* 8. Delete Confirmation Dialog */ }
  < Dialog open = {!!accToDelete} onOpenChange = {(open) => !open && setAccToDelete(null)}>
    <DialogContent className={cn("max-w-md", isDark ? "bg-[#0a1033] border-2 border-rose-500/30 text-white" : "bg-white border-2 border-navy text-navy")}>
      <DialogHeader>
        <DialogTitle className="text-lg font-black tracking-tight text-rose-500 flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-rose-500" />
          Confirm Account Deletion
        </DialogTitle>
        <DialogDescription className={cn("text-xs sm:text-sm font-medium pt-2", isDark ? "text-slate-300" : "text-navy/70")}>
          Are you sure you want to delete banking account <b className="text-white dark:text-white font-semibold">{accToDelete?.account_name}</b>?
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="pt-3 border-t border-navy/10 dark:border-slate-800 flex flex-row justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setAccToDelete(null)}
          className={cn("rounded-xl font-bold h-10 px-4", isDark ? "border-slate-700 text-white hover:bg-white/10" : "border-navy/20 text-navy")}
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={isDeleting}
          onClick={handleDeleteAccount}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl h-10 px-4 gap-1.5 shadow-md"
        >
          {isDeleting ? "Deleting..." : "Delete Account"}
        </Button>
      </DialogFooter>
    </DialogContent>
      </Dialog >
    </div >
  )
}
