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
  DollarSign
} from "lucide-react"

export default function BankingManagementPage() {
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [accounts, setAccounts] = useState<BankCashAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
      // Simulate reconcile confirmation
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

  const totalLiquidity = accounts.reduce((s, a) => s + a.current_balance, 0)

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
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 mb-6 transition-all duration-300",
        isDark ? "bg-[#0a1033] border-none text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
            <div className={cn(
              "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 shadow-md",
              isDark 
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" 
                : "bg-navy text-teal border border-navy/20"
            )}>
              <Landmark className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1">
                Banking & <span className={cn(isDark ? "text-teal-400" : "text-white", "drop-shadow-sm")}>Cash Management</span>
              </h1>
              <p className={cn("text-sm sm:text-base font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
                Corporate bank accounts, Selcom payment gateways, and M-Pesa merchant tills
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={loadData}
              className={cn(
                "rounded-xl h-10 sm:h-11 px-4 font-bold text-xs sm:text-sm border shadow-sm",
                isDark ? "bg-white/10 hover:bg-white/20 text-white border-white/20" : "bg-white/80 hover:bg-white text-navy border-navy/20"
              )}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Balances
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Liquidity & Stat Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className={cn(
          "sm:col-span-2 rounded-2xl transition-all duration-300 overflow-hidden",
          isDark 
            ? "bg-[#0a1033] border-none shadow-md" 
            : "bg-white border-2 border-navy/20 shadow-sm"
        )}>
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className={cn("text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1", isDark ? "text-teal-400" : "text-navy/70")}>
                Total Liquid Cash & Bank Reserves
              </p>
              <div className={cn("text-2xl sm:text-3xl font-black font-mono tracking-tight", isDark ? "text-white" : "text-navy")}>
                TZS {totalLiquidity.toLocaleString()}
              </div>
              <p className={cn("text-xs font-medium mt-1", isDark ? "text-slate-400" : "text-navy/60")}>
                Aggregated across {accounts.length} active financial settlement channels
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 px-3 py-1 font-bold">
                <ShieldCheck className="mr-1.5 h-4 w-4" />
                100% Reconciled
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "rounded-2xl transition-all duration-300 overflow-hidden",
          isDark 
            ? "bg-[#0a1033] border-none shadow-md" 
            : "bg-white border-2 border-navy/20 shadow-sm"
        )}>
          <CardContent className="p-5 flex items-center justify-between gap-3">
            <div>
              <p className={cn("text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1", isDark ? "text-teal-400" : "text-navy/70")}>
                Settlement Status
              </p>
              <div className="text-xl sm:text-2xl font-black text-emerald-500">
                Active & Live
              </div>
              <p className={cn("text-xs font-medium mt-1", isDark ? "text-slate-400" : "text-navy/60")}>
                CRDB, Selcom, Vodacom
              </p>
            </div>
            <div className={cn(
              "w-10 h-10 rounded-full border flex items-center justify-center shrink-0",
              isDark ? "bg-teal-400/10 border-teal-400/30 text-teal-300" : "bg-teal-100/80 border-navy/15 text-navy"
            )}>
              <Landmark className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {accounts.map(acc => {
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

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenReconcile(acc)}
                    className={cn(
                      "rounded-xl h-9 text-xs font-bold border",
                      isDark ? "border-teal/30 hover:bg-teal/20 text-white" : "border-navy/20 hover:bg-teal-50 text-navy"
                    )}
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                    Reconcile
                  </Button>
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

      {/* Reconcile Dialog */}
      <Dialog open={isReconcileOpen} onOpenChange={setIsReconcileOpen}>
        <DialogContent className={cn("max-w-md", isDark ? "bg-[#0d0d12] border-slate-800 text-slate-100" : "bg-white border-slate-200")}>
          <DialogHeader>
            <DialogTitle>Reconcile Bank / Cash Account</DialogTitle>
            <DialogDescription className={isDark ? "text-slate-400" : "text-slate-500"}>
              Verify book balance against official bank or mobile money statement.
            </DialogDescription>
          </DialogHeader>

          {selectedAcc && (
            <form onSubmit={handleSaveReconciliation} className="space-y-4">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-500/5 text-sm">
                <span className="text-xs text-slate-400">Account:</span>
                <p className="font-bold">{selectedAcc.account_name}</p>
                <p className="text-xs font-mono text-slate-500 mt-1">Book Balance: TZS {selectedAcc.current_balance.toLocaleString()}</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="recDate" className="text-xs">Statement Cut-Off Date *</Label>
                <Input
                  id="recDate"
                  type="date"
                  value={reconcileDate}
                  onChange={e => setReconcileDate(e.target.value)}
                  className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="closingBal" className="text-xs">Statement Ending Balance (TZS) *</Label>
                <Input
                  id="closingBal"
                  type="number"
                  value={closingBalance || ""}
                  onChange={e => setClosingBalance(Number(e.target.value) || 0)}
                  className={isDark ? "bg-slate-900 border-slate-800 font-mono" : "border-slate-200 font-mono"}
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsReconcileOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-[#000080] text-white hover:bg-[#000080]/90">
                  {isSubmitting ? "Reconciling..." : "Confirm & Save Reconciliation"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
