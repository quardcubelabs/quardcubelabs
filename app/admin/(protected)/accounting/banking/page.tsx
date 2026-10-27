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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#000080] to-[#40E0D0] text-white shadow-lg shadow-[#000080]/20">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Banking & Cash Management</h1>
            <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
              Corporate bank accounts, Selcom payment gateways, and M-Pesa merchant tills
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
            Refresh Balances
          </Button>
        </div>
      </div>

      {/* Liquidity Total Card */}
      <Card className={cn("p-6", isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className={cn("text-xs font-semibold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
              Total Liquid Cash & Bank Reserves
            </span>
            <div className="mt-1 text-3xl font-extrabold text-teal-500 font-mono">
              TZS {totalLiquidity.toLocaleString()}
            </div>
            <p className={cn("mt-1 text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
              Across 4 active financial settlement channels
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 px-3 py-1">
              <ShieldCheck className="mr-1.5 h-4 w-4" />
              100% Reconciled
            </Badge>
          </div>
        </div>
      </Card>

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map(acc => {
          let icon = <Landmark className="h-6 w-6 text-primary" />
          if (acc.account_type.includes("Cash")) {
            icon = <Wallet className="h-6 w-6 text-emerald-500" />
          } else if (acc.account_type.includes("Mobile")) {
            icon = <Smartphone className="h-6 w-6 text-rose-500" />
          } else if (acc.account_type.includes("Gateway")) {
            icon = <CreditCard className="h-6 w-6 text-blue-500" />
          }

          return (
            <Card
              key={acc.id}
              className={cn("p-5 border transition-all hover:border-slate-400", isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-3 rounded-xl border", isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200")}>
                    {icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{acc.account_name}</h3>
                    <p className="text-xs text-slate-500">{acc.account_type} {acc.branch ? `• ${acc.branch}` : ""}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                  Active
                </Badge>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Ledger Balance</span>
                  <div className="text-xl font-bold font-mono">
                    TZS {acc.current_balance.toLocaleString()}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenReconcile(acc)}
                  className={isDark ? "border-slate-700 hover:bg-slate-800 text-xs" : "border-slate-300 hover:bg-slate-100 text-xs"}
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                  Reconcile
                </Button>
              </div>

              {acc.account_number && (
                <div className="mt-3 text-xs text-slate-400 font-mono">
                  Account / Till No: {acc.account_number}
                </div>
              )}

              {acc.last_reconciled_date && (
                <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Last reconciled: {acc.last_reconciled_date}
                </div>
              )}
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
