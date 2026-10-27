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
  Cctv
} from "lucide-react"

const STAGES: { id: DealStage; label: string; color: string; border: string; bg: string }[] = [
  { id: "qualification", label: "Qualification", color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10" },
  { id: "site_survey", label: "Site Survey / Scope", color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" },
  { id: "proposal_quote", label: "Proposal / Quote Sent", color: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10" },
  { id: "negotiation", label: "Negotiation / Review", color: "text-indigo-400", border: "border-indigo-500/30", bg: "bg-indigo-500/10" },
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
      let lostReason: string | undefined = undefined
      if (newStage === "lost") {
        lostReason = prompt("Please provide reason for deal loss (e.g., Budget constraint, Competitor lower price):") || "Unspecified"
      }
      await updateDealStage(dealId, newStage, lostReason)
      toast({
        title: "Pipeline Updated",
        description: `Deal stage advanced to "${newStage}".`
      })
      loadData()
    } catch {
      toast({
        title: "Update Failed",
        description: "Could not advance pipeline stage.",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (dealId: string) => {
    if (!confirm("Are you sure you want to delete this deal?")) return
    try {
      await deleteDeal(dealId)
      toast({
        title: "Deal Removed",
        description: "Pipeline deal deleted."
      })
      loadData()
    } catch {
      toast({
        title: "Delete Failed",
        description: "Could not delete deal.",
        variant: "destructive"
      })
    }
  }

  const filteredDeals = deals.filter(d => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.deal_number.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStage = selectedStageFilter === "all" || d.stage === selectedStageFilter
    return matchesSearch && matchesStage
  })

  // Telemetry Calculations
  const totalPipelineValue = deals.filter(d => d.stage !== "lost").reduce((sum, d) => sum + (d.amount || 0), 0)
  const totalWonValue = deals.filter(d => d.stage === "won").reduce((sum, d) => sum + (d.amount || 0), 0)
  const weightedPipeline = deals.filter(d => d.stage !== "lost" && d.stage !== "won").reduce((sum, d) => sum + (d.amount * (d.probability / 100)), 0)
  const wonCount = deals.filter(d => d.stage === "won").length
  const closedCount = deals.filter(d => d.stage === "won" || d.stage === "lost").length
  const winRate = closedCount > 0 ? ((wonCount / closedCount) * 100).toFixed(0) : "100"

  if (isLoading && deals.length === 0) {
    return <AdminLoading />
  }

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 transition-all duration-300",
        isDark ? "bg-[#0a1033] text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
            <div className={cn(
              "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 shadow-md",
              isDark 
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" 
                : "bg-navy text-teal border border-navy/20"
            )}>
              <SlidersHorizontal className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black mb-1">
                Deals & <span className={cn(isDark ? "text-teal-300" : "text-white drop-shadow-sm")}>Sales Pipeline</span>
              </h1>
              <p className={cn("text-xs sm:text-sm font-semibold", isDark ? "text-teal-300/80" : "text-navy/90")}>
                Zoho CRM Opportunity Funnel: Qualification, Surveys, Quotations, and Won Deals
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-navy hover:bg-navy/90 text-white dark:bg-teal dark:text-navy dark:hover:bg-teal/90 font-bold rounded-xl shadow-md flex items-center gap-2 text-xs sm:text-sm px-4 py-2"
            >
              <Plus className="w-4 h-4" />
              New Deal
            </Button>
            <Button
              variant="outline"
              onClick={loadData}
              className={cn(
                "rounded-xl border-2 font-bold p-2.5",
                isDark ? "border-teal/30 hover:bg-white/5 text-white" : "border-navy/20 hover:bg-teal-50 text-navy"
              )}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Pipeline Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className={cn(
          "rounded-2xl border-2 transition-all",
          isDark ? "bg-[#0a1033] border-none shadow-md" : "bg-white border-navy/20 shadow-sm"
        )}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className={cn("text-[11px] font-bold uppercase tracking-wider", isDark ? "text-teal-400" : "text-navy/70")}>Total Active Pipeline</p>
              <p className={cn("text-xl sm:text-2xl font-black mt-1", isDark ? "text-white" : "text-navy")}>
                TZS {(totalPipelineValue / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center text-teal">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "rounded-2xl border-2 transition-all",
          isDark ? "bg-[#0a1033] border-none shadow-md" : "bg-white border-navy/20 shadow-sm"
        )}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className={cn("text-[11px] font-bold uppercase tracking-wider", isDark ? "text-teal-400" : "text-navy/70")}>Closed Won Revenue</p>
              <p className={cn("text-xl sm:text-2xl font-black mt-1 text-emerald-400")}>
                TZS {(totalWonValue / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "rounded-2xl border-2 transition-all",
          isDark ? "bg-[#0a1033] border-none shadow-md" : "bg-white border-navy/20 shadow-sm"
        )}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className={cn("text-[11px] font-bold uppercase tracking-wider", isDark ? "text-teal-400" : "text-navy/70")}>Weighted Forecast</p>
              <p className={cn("text-xl sm:text-2xl font-black mt-1 text-teal-300")}>
                TZS {(weightedPipeline / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center text-teal">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "rounded-2xl border-2 transition-all",
          isDark ? "bg-[#0a1033] border-none shadow-md" : "bg-white border-navy/20 shadow-sm"
        )}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className={cn("text-[11px] font-bold uppercase tracking-wider", isDark ? "text-teal-400" : "text-navy/70")}>Conversion Win Rate</p>
              <p className={cn("text-2xl font-black mt-1 text-emerald-400")}>{winRate}%</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stage Flow Indicator */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {STAGES.map((s, idx) => {
          const count = deals.filter(d => d.stage === s.id).length
          const stageTotal = deals.filter(d => d.stage === s.id).reduce((sum, d) => sum + (d.amount || 0), 0)
          return (
            <div
              key={s.id}
              onClick={() => setSelectedStageFilter(selectedStageFilter === s.id ? "all" : s.id)}
              className={cn(
                "p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02]",
                s.border,
                s.bg,
                selectedStageFilter === s.id && "ring-2 ring-teal"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{idx + 1}. Stage</span>
                <span className="text-xs font-black">{count}</span>
              </div>
              <p className={cn("text-xs font-bold mt-1 truncate", s.color)}>{s.label}</p>
              <p className="text-[11px] font-mono font-bold mt-1 text-gray-400">
                {(stageTotal / 1000000).toFixed(1)}M
              </p>
            </div>
          )
        })}
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search deals by title, customer, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pl-10 h-11 rounded-xl border-2 font-medium text-sm",
              isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
            )}
          />
        </div>
        {selectedStageFilter !== "all" && (
          <Button
            variant="ghost"
            onClick={() => setSelectedStageFilter("all")}
            className="text-xs font-bold text-teal"
          >
            Clear Filter (Show All)
          </Button>
        )}
      </div>

      {/* Deals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDeals.map((deal) => {
          const currentStageObj = STAGES.find(s => s.id === deal.stage) || STAGES[0]

          return (
            <Card
              key={deal.id}
              className={cn(
                "rounded-2xl border-2 transition-all hover:shadow-lg flex flex-col justify-between overflow-hidden",
                isDark ? "bg-[#0a1033] border-teal/20" : "bg-white border-navy/20"
              )}
            >
              <CardContent className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-teal">{deal.deal_number}</span>
                    <span className={cn(
                      "px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border",
                      currentStageObj.color,
                      currentStageObj.bg,
                      currentStageObj.border
                    )}>
                      {currentStageObj.label}
                    </span>
                  </div>

                  <h3 className={cn("text-base font-black mt-2 leading-snug", isDark ? "text-white" : "text-navy")}>
                    {deal.title}
                  </h3>

                  <p className="text-xs text-gray-400 mt-1 font-semibold">{deal.customer_name}</p>

                  <div className="mt-3 p-3 rounded-xl bg-teal/5 border border-teal/20 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Deal Value</p>
                      <p className="text-base font-black font-mono text-teal">
                        TZS {deal.amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Probability</p>
                      <p className="text-sm font-black font-mono">{deal.probability}%</p>
                    </div>
                  </div>

                  {deal.notes && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2 italic">
                      "{deal.notes}"
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-200/20 space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Close: {deal.expected_close_date || "Open"}
                    </span>
                    <span>Rep: {deal.assigned_to_name || "Sales Team"}</span>
                  </div>

                  {/* Stage Advancement Select */}
                  <div className="flex items-center gap-2">
                    <Select value={deal.stage} onValueChange={(val) => handleStageChange(deal.id, val as DealStage)}>
                      <SelectTrigger className="h-8 text-xs font-bold rounded-lg border flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STAGES.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Quick Action: Issue Quote */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push("/admin/quotations")}
                      className="h-8 text-xs font-bold rounded-lg border px-2 flex items-center gap-1"
                      title="Issue Quotation"
                    >
                      <FileText className="w-3.5 h-3.5 text-teal" />
                      Quote
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(deal.id)}
                      className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredDeals.length === 0 && (
        <Card className="p-12 text-center text-gray-400 text-sm rounded-2xl">
          No deals match the selected stage or search query.
        </Card>
      )}

      {/* Add Deal Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={cn(
          "max-w-xl rounded-2xl border-2 p-6",
          isDark ? "bg-[#0d0d12] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
        )}>
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Enter Pipeline Opportunity</DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              Track commercial deals through negotiation, surveys, and accepted orders.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateDeal} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold">Deal Title / Project Scope *</Label>
              <Input
                required
                placeholder="e.g. Serengeti Logistics 16-Camera 4K Surveillance Deployment"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl mt-1 h-10 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Client / Company Name *</Label>
                <Input
                  required
                  placeholder="e.g. Serengeti Freight Logistics Ltd"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="rounded-xl mt-1 h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Contract Amount (TZS) *</Label>
                <Input
                  required
                  type="number"
                  placeholder="e.g. 18500000"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="rounded-xl mt-1 h-10 text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Client Email</Label>
                <Input
                  type="email"
                  placeholder="procurement@company.co.tz"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="rounded-xl mt-1 h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Client Phone</Label>
                <Input
                  placeholder="+255 7..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="rounded-xl mt-1 h-10 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-bold">Initial Stage</Label>
                <Select value={stage} onValueChange={(val) => setStage(val as DealStage)}>
                  <SelectTrigger className="rounded-xl mt-1 h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold">Probability (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={probability}
                  onChange={(e) => setProbability(Number(e.target.value))}
                  className="rounded-xl mt-1 h-10 text-sm font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Expected Close</Label>
                <Input
                  type="date"
                  value={expectedCloseDate}
                  onChange={(e) => setExpectedCloseDate(e.target.value)}
                  className="rounded-xl mt-1 h-10 text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold">Opportunity Notes & Milestones</Label>
              <Textarea
                rows={3}
                placeholder="Key stakeholders, equipment deliverables, technical site conditions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl mt-1 text-sm"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-teal hover:bg-teal/90 text-navy font-bold rounded-xl text-xs px-5"
              >
                {isSubmitting ? "Saving..." : "Create Deal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
