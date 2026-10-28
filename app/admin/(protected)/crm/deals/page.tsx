"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { AdminLoading } from "@/components/admin"
import { cn } from "@/lib/utils"
import { getDeals, createDeal, updateDealStage, deleteDeal } from "@/lib/crm-actions"
import { CrmDeal, DealStage } from "@/lib/erp/crm-types"
import {
  SlidersHorizontal,
  Plus,
  Search,
  RefreshCw,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  TrendingUp,
  FileText,
  ShoppingCart,
  Trash2,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Cctv,
  Eye,
  Layers,
  Building2,
  User,
  ShieldCheck,
  CheckCircle
} from "lucide-react"

const STAGES: { id: DealStage; label: string; color: string; border: string; bg: string }[] = [
  { id: "qualification", label: "Qualification", color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10" },
  { id: "site_survey", label: "Site Survey", color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" },
  { id: "proposal_quote", label: "Proposal Sent", color: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10" },
  { id: "negotiation", label: "Negotiation", color: "text-indigo-400", border: "border-indigo-500/30", bg: "bg-indigo-500/10" },
  { id: "won", label: "Closed Won", color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" },
  { id: "lost", label: "Closed Lost", color: "text-rose-400", border: "border-rose-500/30", bg: "bg-rose-500/10" }
]

export default function DealsPipelinePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [deals, setDeals] = useState<CrmDeal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>("all")

  // View Deal Modal
  const [selectedViewDeal, setSelectedViewDeal] = useState<CrmDeal | null>(null)

  // Create Deal Dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [amount, setAmount] = useState<number>(0)
  const [stage, setStage] = useState<DealStage>("qualification")
  const [probability, setProbability] = useState<number>(50)
  const [expectedCloseDate, setExpectedCloseDate] = useState("")
  const [assignedToName, setAssignedToName] = useState("Framani Mwamba")
  const [notes, setNotes] = useState("")

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getDeals()
      setDeals(data)
    } catch {
      toast({
        title: "Error",
        description: "Failed to load sales deals.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !customerName || !amount) {
      toast({
        title: "Required Fields",
        description: "Please specify deal title, customer name, and contract amount.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      await createDeal({
        title,
        customer_name: customerName,
        customer_email: customerEmail || "client@company.co.tz",
        customer_phone: customerPhone,
        stage,
        amount: Number(amount) || 0,
        probability: Number(probability) || 50,
        expected_close_date: expectedCloseDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        assigned_to_name: assignedToName,
        notes
      })
      toast({
        title: "Deal Created",
        description: "New pipeline opportunity entered into CRM."
      })
      setIsCreateOpen(false)
      setTitle("")
      setCustomerName("")
      setCustomerEmail("")
      setCustomerPhone("")
      setAmount(0)
      setNotes("")
      loadData()
    } catch {
      toast({
        title: "Submission Error",
        description: "Could not create deal record.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStageChange = async (dealId: string, newStage: DealStage) => {
    try {
      await updateDealStage(dealId, newStage)
      toast({
        title: "Deal Stage Advanced",
        description: `Deal moved to ${newStage.replace("_", " ")}.`
      })
      loadData()
    } catch {
      toast({
        title: "Update Error",
        description: "Failed to advance deal stage.",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (dealId: string) => {
    if (!confirm("Are you sure you want to delete this deal?")) return
    try {
      await deleteDeal(dealId)
      toast({
        title: "Deal Deleted",
        description: "Opportunity removed from pipeline."
      })
      loadData()
    } catch {
      toast({
        title: "Delete Error",
        description: "Could not remove deal record.",
        variant: "destructive"
      })
    }
  }

  const filteredDeals = deals.filter((d) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      d.deal_number.toLowerCase().includes(q) ||
      d.title.toLowerCase().includes(q) ||
      d.customer_name.toLowerCase().includes(q)

    const matchesStage = selectedStageFilter === "all" || d.stage === selectedStageFilter
    return matchesSearch && matchesStage
  })

  // Pipeline Metrics
  const totalDeals = deals.length
  const totalPipelineValue = deals.reduce((sum, d) => sum + (d.amount || 0), 0)
  const wonDeals = deals.filter(d => d.stage === "won")
  const wonValue = wonDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
  const winRate = totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0

  if (isLoading && deals.length === 0) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <AdminLoading />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div
        className={cn(
          "p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 mb-6 transition-all duration-300",
          isDark
            ? "bg-[#0a1033] border-none text-white shadow-none"
            : "bg-teal text-navy"
        )}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div
              className={cn(
                "w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 shadow-md",
                isDark
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                  : "bg-navy text-teal border border-navy/20"
              )}
            >
              <SlidersHorizontal className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-0.5 sm:mb-1 truncate">
                Commercial Deals &amp;{" "}
                <span
                  className={cn(
                    isDark ? "text-teal-400" : "text-white",
                    "drop-shadow-sm"
                  )}
                >
                  Pipeline
                </span>
              </h1>
              <p
                className={cn(
                  "text-xs sm:text-sm font-semibold line-clamp-1 sm:line-clamp-none",
                  isDark ? "text-teal-300" : "text-navy/90"
                )}
              >
                Enterprise contract negotiations, site surveys, multi-camera scopes, and win-rate analytics
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5 sm:gap-3 shrink-0 w-full sm:w-auto">
            <Button
              onClick={loadData}
              variant="outline"
              size="sm"
              className={cn(
                "rounded-xl h-8 sm:h-11 px-2.5 sm:px-4 font-bold text-xs sm:text-sm border shadow-sm transition-all active:scale-95 flex-1 sm:flex-none justify-center",
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-white border-white/20"
                  : "bg-white/80 hover:bg-white text-navy border-navy/20"
              )}
            >
              <RefreshCw className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-8 sm:h-11 text-xs sm:text-sm px-3 sm:px-5 gap-1.5 sm:gap-2 shadow-lg transition-all active:scale-95 flex-1 sm:flex-none justify-center shrink-0"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Add Sales Opportunity</span>
              <span className="sm:hidden">Add Deal</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
        {[
          { title: "Total Opportunities", value: totalDeals.toString(), icon: SlidersHorizontal, color: "text-blue-500", sub: "Active sales pipeline" },
          { title: "Total Pipeline Value", value: `TZS ${(totalPipelineValue / 1000000).toFixed(1)}M`, icon: DollarSign, color: "text-teal-500", sub: "Aggregated contracts" },
          { title: "Closed Won Revenue", value: `TZS ${(wonValue / 1000000).toFixed(1)}M`, icon: CheckCircle2, color: "text-emerald-500", sub: `${wonDeals.length} won contracts` },
          { title: "Win Rate", value: `${winRate}%`, icon: TrendingUp, color: "text-amber-500", sub: "Historical conversion" }
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
                <span className={cn("text-base sm:text-xl xl:text-2xl font-black truncate block font-mono leading-tight tracking-tight", isDark ? "text-white" : "text-navy")}>
                  {stat.value}
                </span>
                <p className={cn("text-[10px] font-medium mt-0.5 sm:mt-1 truncate opacity-70", isDark ? "text-slate-300" : "text-navy/60")}>
                  {stat.sub}
                </p>
              </div>
              <div
                className={cn(
                  "w-9 h-9 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                  isDark
                    ? "bg-navy border-teal/30 text-teal group-hover:bg-navy/80"
                    : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
                )}
              >
                <stat.icon className={cn("h-4 w-4 sm:h-5 sm:w-5 shrink-0", isDark ? "text-teal" : "")} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <Card
        className={cn(
          "rounded-2xl p-3 sm:p-4 transition-all duration-300 space-y-3",
          isDark ? "bg-[#0a1033] border-none shadow-none" : "bg-white border-2 border-navy/20 shadow-sm"
        )}
      >
        {/* Stage Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedStageFilter("all")}
            className={cn(
              "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer",
              selectedStageFilter === "all"
                ? "bg-navy text-white shadow-md"
                : isDark 
                  ? "text-slate-300 hover:bg-teal-400/10 hover:text-teal-300" 
                  : "text-navy/70 hover:bg-teal-50 hover:text-navy"
            )}
          >
            <Layers className="h-4 w-4 shrink-0" />
            <span>All Stages</span>
            <span className={cn("ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold", selectedStageFilter === "all" ? "bg-white/20 text-white" : isDark ? "bg-slate-800 text-slate-300" : "bg-navy/10 text-navy")}>
              {deals.length}
            </span>
          </button>
          {STAGES.map((s) => {
            const isSelected = selectedStageFilter === s.id
            const count = deals.filter(d => d.stage === s.id).length

            return (
              <button
                key={s.id}
                onClick={() => setSelectedStageFilter(s.id)}
                className={cn(
                  "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer",
                  isSelected
                    ? "bg-navy text-white shadow-md"
                    : isDark 
                      ? "text-slate-300 hover:bg-teal-400/10 hover:text-teal-300" 
                      : "text-navy/70 hover:bg-teal-50 hover:text-navy"
                )}
              >
                <span>{s.label}</span>
                <span className={cn(
                  "ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold",
                  isSelected ? "bg-white/20 text-white" : isDark ? "bg-slate-800 text-slate-300" : "bg-navy/10 text-navy"
                )}>
                  {count}
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
              placeholder="Search deals by title, customer, or deal code..."
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

      {/* Deals Table */}
      <Card className={cn(
        "rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg transition-all duration-300 w-full",
        isDark ? "bg-[#060a22] border-none text-white shadow-none" : "bg-white border-2 border-navy/20 text-navy"
      )}>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-navy text-white font-black border-b border-navy/30">
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-left">Opportunity Deal</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-left hidden sm:table-cell">Client Account</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-left">Pipeline Stage</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right">Contract Value</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-center hidden md:table-cell">Win Prob.</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-left hidden lg:table-cell">Expected Close</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 dark:divide-teal/15 text-xs sm:text-sm">
              {filteredDeals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-navy/60 dark:text-slate-400">
                    <SlidersHorizontal className="h-10 w-10 mx-auto mb-3 opacity-40 text-navy dark:text-teal" />
                    <p className="font-bold text-base">No sales deals found</p>
                    <p className="text-xs font-medium mt-1">Try adjusting your filters or search keywords</p>
                  </td>
                </tr>
              ) : (
                filteredDeals.map((deal) => {
                  const currentStageObj = STAGES.find(s => s.id === deal.stage) || STAGES[0]

                  return (
                    <tr
                      key={deal.id}
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
                            <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className={cn("font-bold text-xs sm:text-sm truncate max-w-[160px] sm:max-w-xs", isDark ? "text-white" : "text-navy")} title={deal.title}>
                              {deal.title}
                            </div>
                            <span className={cn("font-mono font-bold text-[10px] sm:text-[11px]", isDark ? "text-slate-300" : "text-navy/70")}>
                              {deal.deal_number}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 hidden sm:table-cell">
                        <div className={cn("font-bold text-xs sm:text-sm truncate max-w-[150px]", isDark ? "text-slate-200" : "text-navy")} title={deal.customer_name}>
                          {deal.customer_name}
                        </div>
                      </td>

                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-lg border inline-block",
                          currentStageObj.color,
                          currentStageObj.bg,
                          currentStageObj.border
                        )}>
                          {currentStageObj.label}
                        </span>
                      </td>

                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right font-mono font-black text-emerald-500 whitespace-nowrap">
                        TZS {deal.amount.toLocaleString()}
                      </td>

                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-center hidden md:table-cell whitespace-nowrap">
                        <span className="font-mono font-bold text-xs">
                          {deal.probability}%
                        </span>
                      </td>

                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 hidden lg:table-cell whitespace-nowrap text-xs">
                        <div className="flex items-center gap-1 font-mono font-medium text-slate-400">
                          <Calendar className="w-3 h-3 text-teal" />
                          {deal.expected_close_date || "Open"}
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          Rep: {deal.assigned_to_name || "Sales Team"}
                        </span>
                      </td>

                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                          <button
                            onClick={() => setSelectedViewDeal(deal)}
                            className={cn(
                              "p-1 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                              isDark ? "bg-navy border border-teal/40 text-teal hover:bg-teal hover:text-navy" : "bg-navy text-white hover:bg-navy/90"
                            )}
                            title="View Deal Details"
                          >
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => router.push("/admin/quotations")}
                            className={cn(
                              "p-1 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                              isDark ? "bg-white/10 text-white hover:bg-white hover:text-navy" : "bg-navy/10 text-navy hover:bg-navy hover:text-white"
                            )}
                            title="Issue Quotation"
                          >
                            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(deal.id)}
                            className={cn(
                              "p-1 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                              isDark ? "bg-teal/15 text-white hover:bg-teal hover:text-navy" : "bg-red-50 text-brand-red hover:bg-red-500 hover:text-white"
                            )}
                            title="Delete Opportunity"
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

      {/* View Deal Details Modal */}
      <Dialog open={!!selectedViewDeal} onOpenChange={(open) => !open && setSelectedViewDeal(null)}>
        <DialogContent className={cn("max-w-2xl", isDark ? "bg-[#0a1033] border-2 border-teal/30 text-white" : "bg-white border-2 border-navy text-navy")}>
          {selectedViewDeal && (
            <div className="space-y-6">
              {/* Header Navigation Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-navy/10 dark:border-teal/20 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-inner", isDark ? "bg-teal/20 text-teal" : "bg-navy text-white")}>
                    <SlidersHorizontal className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-md bg-teal/20 text-teal border border-teal/30">
                        {selectedViewDeal.deal_number}
                      </span>
                      <h2 className={cn("text-xl sm:text-2xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
                        {selectedViewDeal.title}
                      </h2>
                    </div>
                    <p className={cn("text-xs sm:text-sm font-medium mt-0.5", isDark ? "text-slate-300" : "text-navy/70")}>
                      Customer: <span className="font-bold">{selectedViewDeal.customer_name}</span> • Rep: <span className="font-bold">{selectedViewDeal.assigned_to_name || "Sales Team"}</span>
                    </p>
                  </div>
                </div>

                <Badge className="font-bold text-xs uppercase px-3 py-1 rounded-lg bg-teal text-navy">
                  {selectedViewDeal.stage.replace("_", " ")}
                </Badge>
              </div>

              {/* Financial Value Banner */}
              <div className={cn(
                "p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
                isDark ? "bg-teal/15 border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
              )}>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider opacity-70 block">Opportunity Contract Value</span>
                  <div className="font-mono font-black text-2xl sm:text-3xl tracking-tight mt-0.5">
                    TZS {selectedViewDeal.amount.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black uppercase tracking-wider opacity-70 block">Probability & Close</span>
                  <div className="font-mono font-bold text-sm sm:text-base mt-0.5 text-teal">
                    {selectedViewDeal.probability}% • Close: {selectedViewDeal.expected_close_date || "Open"}
                  </div>
                </div>
              </div>

              {/* Scope & Details */}
              <div className={cn("p-4 rounded-2xl border space-y-2", isDark ? "bg-[#080d2a] border-teal/20" : "bg-slate-50 border-navy/20")}>
                <span className="text-xs font-black uppercase tracking-wider opacity-70 block">Deal Narrative & Scope</span>
                <p className="text-xs leading-relaxed opacity-90">
                  {selectedViewDeal.notes || "No detailed scope notes registered for this deal."}
                </p>
              </div>

              {/* Modal Footer */}
              <DialogFooter className="border-t border-navy/10 dark:border-teal/20 pt-4 flex flex-row justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedViewDeal(null)}
                  className={cn("rounded-xl font-bold h-10 px-5", isDark ? "border-teal/30 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}
                >
                  Close
                </Button>
                <Button
                  onClick={() => router.push("/admin/quotations")}
                  className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-5 gap-1.5 shadow-md"
                >
                  <FileText className="w-4 h-4 text-teal" />
                  Issue Quotation
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Deal Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={cn(
          "max-w-xl",
          isDark ? "bg-[#0a1033] border-2 border-teal/30 text-white" : "bg-white border-2 border-navy text-navy"
        )}>
          <DialogHeader>
            <DialogTitle className={cn("text-lg sm:text-xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
              Create Sales Opportunity
            </DialogTitle>
            <DialogDescription className={cn("text-xs sm:text-sm font-medium", isDark ? "text-slate-300" : "text-navy/70")}>
              Register a commercial opportunity into the revenue pipeline.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateDeal} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">Opportunity Title *</Label>
              <Input
                required
                placeholder="e.g. 16-Channel 4K ColorVu IP Surveillance & Access Control System"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Customer / Company *</Label>
                <Input
                  required
                  placeholder="e.g. Serengeti Breweries HQ"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Contract Value (TZS) *</Label>
                <Input
                  required
                  type="number"
                  placeholder="e.g. 35000000"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-mono font-bold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Initial Pipeline Stage</Label>
                <Select value={stage} onValueChange={(val) => setStage(val as DealStage)}>
                  <SelectTrigger className={cn("h-10 sm:h-11 rounded-xl border-2 font-semibold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"}>
                    {STAGES.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Win Probability (%)</Label>
                <Input
                  type="number"
                  placeholder="50"
                  value={probability}
                  onChange={(e) => setProbability(Number(e.target.value))}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-mono font-bold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Expected Close Date</Label>
                <Input
                  type="date"
                  value={expectedCloseDate}
                  onChange={(e) => setExpectedCloseDate(e.target.value)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Assigned Rep</Label>
                <Input
                  placeholder="e.g. Framani Mwamba"
                  value={assignedToName}
                  onChange={(e) => setAssignedToName(e.target.value)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">Deal Highlights &amp; Scope Requirements</Label>
              <Textarea
                rows={3}
                placeholder="Hardware specs, NVR channels, storage days, or client SLA parameters..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={cn("rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
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
                {isSubmitting ? "Creating..." : "Save Deal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
