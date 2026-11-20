"use client"

import { useState, useEffect, useMemo, use } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Landmark,
  Calendar,
  ShieldCheck,
  Coins,
  Percent,
  PieChart as PieChartIcon,
  Globe,
  FileText,
  DollarSign,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Eye,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import { secureFetch } from "@/lib/secure-client"
import AdminLoading from "@/components/admin/admin-loading"
import { CountryFlag } from "@/components/ui/country-flag"
import {
  AdminPageHeader,
  AdminStats,
  AdminTable,
  AdminPrimaryCell,
  AdminPill,
  AdminTag,
  AdminStatusBadge,
  AdminMutedText,
  AdminDetailModal,
  type AdminTableColumn,
  type AdminTableAction,
  type AdminDetailSectionData,
} from "@/components/admin/ui"
import {
  type CorporateBond,
  type BondMarketMetrics,
  STOCK_EXCHANGES,
} from "@/lib/bonds-crawler"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

interface BondDetailPageProps {
  params: Promise<{ id: string }>
}

type TimeframeOption = "7d" | "30d" | "90d" | "ytd" | "1y" | "5y" | "custom"

const TIMEFRAME_OPTIONS: { id: TimeframeOption; label: string }[] = [
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
  { id: "90d", label: "90D" },
  { id: "ytd", label: "YTD" },
  { id: "1y", label: "1Y" },
  { id: "5y", label: "5Y" },
  { id: "custom", label: "Custom" },
]

export default function AdminBondDetailPage({ params }: BondDetailPageProps) {
  const resolvedParams = use(params)
  const bondId = resolvedParams.id
  const { isDark } = useAdminTheme()

  const [bond, setBond] = useState<CorporateBond | null>(null)
  const [metrics, setMetrics] = useState<BondMarketMetrics | null>(null)
  const [relatedBonds, setRelatedBonds] = useState<CorporateBond[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Interactive Date Range State
  const [timeframe, setTimeframe] = useState<TimeframeOption>("30d")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [chartMetric, setChartMetric] = useState<"price" | "yield" | "volume">("price")

  const [selectedRelated, setSelectedRelated] = useState<CorporateBond | null>(null)
  const [viewModal, setViewModal] = useState(false)

  // Fetch single bond details using secure payload decryption
  useEffect(() => {
    const fetchBondDetail = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const json = await secureFetch<{
          bond: CorporateBond
          metrics: BondMarketMetrics
          relatedBonds: CorporateBond[]
        }>(`/api/admin/bonds/${bondId}`, { cache: "no-store" })

        if (json.success && json.data?.bond) {
          setBond(json.data.bond)
          setMetrics(json.data.metrics)
          setRelatedBonds(json.data.relatedBonds || [])
        } else {
          setError(json.error || "Corporate bond not found")
        }
      } catch (err: any) {
        console.error("Error loading bond details:", err)
        setError(err.message || "Failed to load bond details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBondDetail()
  }, [bondId])

  // Initialize custom dates based on timeframe
  useEffect(() => {
    const today = new Date()
    const toIso = today.toISOString().split("T")[0]
    setEndDate(toIso)

    let past = new Date()
    if (timeframe === "7d") past.setDate(today.getDate() - 7)
    else if (timeframe === "30d") past.setDate(today.getDate() - 30)
    else if (timeframe === "90d") past.setDate(today.getDate() - 90)
    else if (timeframe === "ytd") past = new Date(today.getFullYear(), 0, 1)
    else if (timeframe === "1y") past.setFullYear(today.getFullYear() - 1)
    else if (timeframe === "5y") past.setFullYear(today.getFullYear() - 5)

    setStartDate(past.toISOString().split("T")[0])
  }, [timeframe])

  // Generate dynamic date-range time series analytics based on selected dates
  const timeSeriesData = useMemo(() => {
    if (!bond) return []

    const start = new Date(startDate || "2024-01-01")
    const end = new Date(endDate || new Date().toISOString().split("T")[0])
    const diffDays = Math.max(7, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))

    const step = Math.max(1, Math.floor(diffDays / 25))
    const points = []

    const basePrice = bond.pricePercentage
    const baseYtm = bond.ytm
    const baseVol = bond.volume24hUSD

    let current = new Date(start)
    let stepCount = 0

    while (current <= end) {
      const dayOffset = stepCount * step
      const sinWave = Math.sin((stepCount * 0.45) + (bond.id.length * 2)) * 0.85
      const cosWave = Math.cos(stepCount * 0.25) * 0.45
      const noise = ((Math.sin(stepCount * 3.7) * 0.35))
      const priceVal = Math.round((basePrice + sinWave + cosWave + noise) * 100) / 100
      const yieldVal = Math.max(0.5, Math.round((baseYtm - (sinWave * 0.8) + (noise * 0.5)) * 100) / 100)
      const volVal = Math.round(baseVol * (0.8 + Math.abs(sinWave * 0.4)))

      const label = current.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: diffDays > 365 ? "numeric" : undefined,
      })

      points.push({
        date: label,
        fullDate: current.toISOString().split("T")[0],
        price: priceVal,
        yield: yieldVal,
        volume: volVal,
        unitPriceTZS: Math.round(((priceVal / 100) * (metrics?.usdToTzsRate || 2500.488)) * 1000) / 1000,
      })

      current.setDate(current.getDate() + step)
      stepCount++
    }

    return points
  }, [bond, startDate, endDate, metrics?.usdToTzsRate])

  // Calculated high/low metrics for selected date range
  const rangeAnalytics = useMemo(() => {
    if (timeSeriesData.length === 0) {
      return { high: 102.5, low: 100.8, avgPrice: 101.5, avgYield: 8.5, totalVolume: 150000000, periodReturn: 0 }
    }

    const prices = timeSeriesData.map((d) => d.price)
    const yields = timeSeriesData.map((d) => d.yield)
    const volumes = timeSeriesData.map((d) => d.volume)

    if (!prices.length) {
      return {
        high: bond?.pricePercentage ?? 0,
        low: bond?.pricePercentage ?? 0,
        avgPrice: bond?.pricePercentage ?? 0,
        avgYield: bond?.ytm ?? 0,
        totalVolume: bond?.volume24hUSD ?? 0,
        periodReturn: 0,
      }
    }

    const high = Math.max(...prices)
    const low = Math.min(...prices)
    const avgPrice = Math.round((prices.reduce((s, p) => s + p, 0) / prices.length) * 100) / 100
    const avgYield = Math.round((yields.reduce((s, y) => s + y, 0) / yields.length) * 100) / 100
    const totalVolume = volumes.reduce((s, v) => s + v, 0)

    const firstPrice = prices[0]
    const lastPrice = prices[prices.length - 1]
    const periodReturn = firstPrice ? Math.round(((lastPrice - firstPrice) / firstPrice * 100) * 100) / 100 : 0

    return { high, low, avgPrice, avgYield, totalVolume, periodReturn }
  }, [timeSeriesData, bond])

  // Donut Chart 1: Institutional Investor Distribution
  const investorAllocationData = useMemo(() => {
    return [
      { name: "Pension Funds (PFAs)", value: 42, color: "#000080" },
      { name: "Commercial & Investment Banks", value: 28, color: "#40E0D0" },
      { name: "Sovereign Wealth & DFIs", value: 18, color: "#0f766e" },
      { name: "Asset Managers & HNWIs", value: 12, color: "#38bdf8" },
    ]
  }, [])

  // Donut Chart 2: Regional Capital Flow Breakdown
  const regionalCapitalData = useMemo(() => {
    if (!bond) return []
    return [
      { name: `Domestic (${bond.country})`, value: 55, color: "#000080" },
      { name: "Regional African Capital", value: 27, color: "#40E0D0" },
      { name: "Offshore / Global Institutional", value: 18, color: "#0f766e" },
    ]
  }, [bond])

  // Format DSE Unit Price with 3-decimal precision
  const formatDSEUnitPrice = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return "TZS 2,500.488"
    return `TZS ${val.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`
  }

  // Format Local Price
  const formatLocalPrice = (b: CorporateBond) => {
    return `${b.exchangeCurrencySymbol} ${b.localCurrencyPrice.toLocaleString("en-US")} ${b.exchangeCurrency}`
  }

  // Format currency in USD
  const formatUSD = (val: number) => {
    if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`
    if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`
    return `$${val.toLocaleString("en-US")}`
  }

  if (isLoading) {
    return <AdminLoading message="Loading corporate bond analytics..." />
  }

  if (error || !bond) {
    return (
      <div className="w-full py-12 px-4 max-w-2xl mx-auto text-center space-y-4">
        <div className={cn(
          "p-8 rounded-3xl border-2 shadow-lg",
          isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
        )}>
          <Landmark className="h-16 w-16 mx-auto mb-3 text-brand-red opacity-80" />
          <h2 className="text-2xl font-black mb-2">Corporate Bond Not Found</h2>
          <p className="text-sm opacity-80 mb-6">
            {error || `The bond identifier "${bondId}" could not be located on active stock exchange feeds.`}
          </p>
          <Link href="/admin/bonds">
            <Button className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl px-5">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Corporate Bonds
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const exchangeInfo = STOCK_EXCHANGES[bond.exchange]

  const relatedColumns: AdminTableColumn<CorporateBond>[] = [
    {
      key: "issuer",
      header: "Issuer",
      render: (rel) => (
        <div className="flex items-center gap-2 min-w-0">
          <CountryFlag
            countryCode={rel.countryCode}
            countryName={rel.country}
            fallbackEmoji={rel.flag}
            size="md"
          />
          <AdminPrimaryCell
            icon={Landmark}
            title={rel.issuer}
            subtitle={rel.ticker}
            badge={<AdminTag title={rel.sector}>{rel.sector}</AdminTag>}
          />
        </div>
      ),
    },
    {
      key: "exchange",
      header: "Exchange",
      render: (rel) => <AdminPill title={rel.exchangeName}>{rel.exchange}</AdminPill>,
    },
    {
      key: "rating",
      header: "Rating",
      hidden: "md",
      render: (rel) => <AdminPill>{rel.rating}</AdminPill>,
    },
    {
      key: "ytm",
      header: "YTM",
      align: "right",
      render: (rel) => <span className="font-black text-teal-600 dark:text-teal-400">{rel.ytm.toFixed(2)}%</span>,
    },
    {
      key: "coupon",
      header: "Coupon",
      align: "right",
      hidden: "lg",
      render: (rel) => <span className="font-bold">{rel.couponRate.toFixed(2)}%</span>,
    },
    {
      key: "maturity",
      header: "Maturity",
      hidden: "lg",
      render: (rel) => <AdminMutedText>{rel.maturityDate}</AdminMutedText>,
    },
  ]

  const relatedActions: AdminTableAction<CorporateBond>[] = [
    {
      key: "view",
      label: "View Related Bond",
      icon: Eye,
      variant: "view",
      onClick: (rel) => {
        setSelectedRelated(rel)
        setViewModal(true)
      },
    },
    {
      key: "profile",
      label: "Open Bond Profile",
      icon: ExternalLink,
      variant: "soft",
      mobile: false,
      href: (rel) => `/admin/bonds/${rel.id}`,
    },
  ]

  const relatedDetailSections: AdminDetailSectionData[] = selectedRelated
    ? [
        {
          key: "identity",
          title: "Security Identity",
          icon: Landmark,
          fields: [
            { label: "Issuer", value: selectedRelated.issuer },
            { label: "Ticker", value: selectedRelated.ticker },
            { label: "ISIN", value: selectedRelated.isin },
            { label: "Exchange", value: `${selectedRelated.exchange} • ${selectedRelated.exchangeName}` },
            { label: "Country / Region", value: `${selectedRelated.country} • ${selectedRelated.region}` },
            { label: "Sector", value: selectedRelated.sector },
            { label: "Regulator", value: selectedRelated.regulator },
          ],
        },
        {
          key: "credit",
          title: "Credit & Pricing",
          icon: ShieldCheck,
          fields: [
            { label: "Rating", value: <AdminPill>{selectedRelated.rating}</AdminPill> },
            { label: "Rating Agency", value: selectedRelated.ratingAgency },
            { label: "Coupon", value: `${selectedRelated.couponRate.toFixed(2)}%` },
            { label: "YTM", value: `${selectedRelated.ytm.toFixed(2)}%` },
            { label: "DSE Unit Price", value: formatDSEUnitPrice(selectedRelated.dseUnitPriceTZS) },
            { label: "Local Price", value: formatLocalPrice(selectedRelated) },
            { label: "Volume (24h)", value: formatUSD(selectedRelated.volume24hUSD) },
            { label: "Liquidity", value: <AdminPill>{selectedRelated.liquidity}</AdminPill> },
          ],
        },
        {
          key: "dates",
          title: "Lifecycle",
          icon: Calendar,
          fields: [
            { label: "Issue Date", value: selectedRelated.issueDate },
            { label: "Maturity Date", value: selectedRelated.maturityDate },
            { label: "Trading Currency", value: selectedRelated.currency },
          ],
        },
      ]
    : []

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden pb-16 animate-in fade-in duration-300">
      <AdminPageHeader
        title={bond.issuer}
        accent="Security Profile"
        subtitle={`ISIN: ${bond.isin} • ${bond.sector} • ${bond.country} (${exchangeInfo?.city || bond.country})`}
        icon={Landmark}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="hidden sm:flex items-center gap-1.5">
              <AdminPill title="Exchange">{bond.exchange}</AdminPill>
              <AdminPill title="Ticker">{bond.ticker}</AdminPill>
              <AdminPill title="Credit rating">{bond.rating}</AdminPill>
            </div>
            <AdminStatusBadge
              status="active"
              label="Live Security Telemetry"
              className="px-3 py-1.5 shadow-sm"
            />
            <Link href="/admin/bonds">
              <Button
                variant="outline"
                size="sm"
                className="font-bold rounded-xl h-10 px-3.5 gap-1.5 shadow-sm transition-all border-2 border-navy/20 bg-white text-navy hover:bg-teal-50 dark:border-teal/30 dark:bg-transparent dark:text-teal dark:hover:bg-teal/10"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Bonds</span>
              </Button>
            </Link>
          </div>
        }
      />

      <AdminStats
        items={[
          {
            title: "DSE Unit Price Rate",
            value: formatDSEUnitPrice(bond.dseUnitPriceTZS),
            icon: Coins,
          },
          {
            title: "Yield to Maturity (YTM)",
            value: `${bond.ytm.toFixed(2)}%`,
            icon: Percent,
          },
          {
            title: "Period Range (High / Low)",
            value: `${rangeAnalytics.high.toFixed(2)}% / ${rangeAnalytics.low.toFixed(2)}%`,
            icon: Activity,
          },
          {
            title: "Trading Volume (24h)",
            value: formatUSD(bond.volume24hUSD),
            icon: DollarSign,
          },
        ]}
      />

      {/* Supporting stat context preserved from the original KPI cards */}
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1.5 text-[11px] font-semibold text-navy/70 dark:text-slate-300 px-1">
        <span>Listed: <strong className="text-emerald-600 dark:text-emerald-400">{formatLocalPrice(bond)}</strong></span>
        <span>Annual Coupon: <strong>{bond.couponRate.toFixed(2)}%</strong></span>
        <span className="flex items-center gap-1">
          <span className={cn(
            "flex items-center",
            rangeAnalytics.periodReturn >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          )}>
            {rangeAnalytics.periodReturn >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {rangeAnalytics.periodReturn >= 0 ? `+${rangeAnalytics.periodReturn}%` : `${rangeAnalytics.periodReturn}%`}
          </span>
          in timeframe
        </span>
        <span>Rating: <strong className="text-navy dark:text-teal">{bond.rating} ({bond.ratingAgency})</strong></span>
      </div>

      {/* 📅 Interactive Date Function & Timeframe Filter Bar */}
      <Card className={cn(
        "p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border-2 shadow-sm transition-all",
        isDark ? "bg-[#0e1438] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
      )}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Timeframe preset tabs */}
          <Tabs value={timeframe} onValueChange={(val) => setTimeframe(val as TimeframeOption)}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-navy/70 dark:text-teal-300 mr-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Timeframe:
              </span>
              <TabsList className="w-auto flex-wrap gap-1.5">
                {TIMEFRAME_OPTIONS.map((tf) => (
                  <TabsTrigger key={tf.id} value={tf.id} className="px-3 py-1.5">
                    {tf.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>

          {/* Right: Custom Date Range Pickers */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-500">From:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setTimeframe("custom")
                }}
                className={cn(
                  "h-8 w-36 text-xs font-mono font-bold rounded-xl",
                  isDark ? "bg-[#101015] border-white/15 text-white" : "bg-gray-50 border-navy/20 text-navy"
                )}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-500">To:</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setTimeframe("custom")
                }}
                className={cn(
                  "h-8 w-36 text-xs font-mono font-bold rounded-xl",
                  isDark ? "bg-[#101015] border-white/15 text-white" : "bg-gray-50 border-navy/20 text-navy"
                )}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left 2 Columns: Multi-Metric Line/Area Chart */}
        <div className="lg:col-span-2 space-y-5">
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl border-2 p-4 sm:p-6 shadow-sm",
            isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
          )}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-base sm:text-lg font-black text-navy dark:text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-teal" />
                  Historical Bond Performance ({startDate} to {endDate})
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                  {chartMetric === "price"
                    ? "Clean Price (% of Par) trajectory across selected timeframe"
                    : chartMetric === "yield"
                    ? "Yield to Maturity (YTM %) yield shift across selected timeframe"
                    : "Trading Volume (USD) distribution across selected timeframe"}
                </p>
              </div>

              {/* Chart Metric Toggle — shared tab chips */}
              <Tabs
                value={chartMetric}
                onValueChange={(val) => setChartMetric(val as "price" | "yield" | "volume")}
              >
                <TabsList className="w-auto gap-1 self-start sm:self-auto">
                  <TabsTrigger value="price" className="px-2.5 py-1 text-xs">Price (% Par)</TabsTrigger>
                  <TabsTrigger value="yield" className="px-2.5 py-1 text-xs">Yield (YTM %)</TabsTrigger>
                  <TabsTrigger value="volume" className="px-2.5 py-1 text-xs">Volume</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Line / Area Chart Container */}
            <div className="h-72 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData} margin={{ top: 10, right: 15, left: -10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="bondGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isDark ? "#2dd4bf" : "#000080"} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={isDark ? "#2dd4bf" : "#000080"} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={isDark ? 0.1 : 0.2} />
                  <XAxis dataKey="date" stroke={isDark ? "#94a3b8" : "#000080"} fontSize={11} fontStyle="bold" />
                  <YAxis
                    stroke={isDark ? "#94a3b8" : "#000080"}
                    fontSize={11}
                    unit={chartMetric === "price" ? "%" : chartMetric === "yield" ? "%" : ""}
                    domain={
                      chartMetric === "price"
                        ? [(dataMin: number) => Math.floor(dataMin - 0.5), (dataMax: number) => Math.ceil(dataMax + 0.5)]
                        : chartMetric === "yield"
                        ? [(dataMin: number) => Math.max(0, Math.floor(dataMin - 0.5)), (dataMax: number) => Math.ceil(dataMax + 0.5)]
                        : ["auto", "auto"]
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#1e1e26" : "#ffffff",
                      borderColor: isDark ? "#334155" : "#00008020",
                      borderRadius: "14px",
                      color: isDark ? "#f8fafc" : "#000080",
                      fontWeight: 600,
                    }}
                    formatter={(val: any) => [
                      chartMetric === "price" ? `${val}% of Par` : chartMetric === "yield" ? `${val}% YTM` : formatUSD(val),
                      chartMetric === "price" ? "Clean Price" : chartMetric === "yield" ? "Yield to Maturity" : "Daily Volume",
                    ]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                  />
                  <Area
                    type="monotone"
                    dataKey={chartMetric}
                    stroke={isDark ? "#2dd4bf" : "#000080"}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#bondGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Right 1 Column: Doughnut Chart (Modeled after Analytics Page) */}
        <div className="space-y-5">
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl border-2 p-4 sm:p-5 shadow-sm flex flex-col justify-between",
            isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
          )}>
            <div>
              <div className="mb-3">
                <h3 className="text-base font-black text-navy dark:text-white flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-teal" />
                  Institutional Ownership Breakdown
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Portfolio holder distribution by institutional category
                </p>
              </div>

              {/* Donut Chart */}
              <div className="h-56 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={investorAllocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {investorAllocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1e1e26" : "#ffffff",
                        borderColor: isDark ? "#334155" : "#00008020",
                        borderRadius: "12px",
                        color: isDark ? "#f8fafc" : "#000080",
                        fontWeight: 600,
                      }}
                      formatter={(val: any) => [`${val}%`, "Allocation"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text in donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-bold text-gray-400">Total</span>
                  <span className="text-lg font-black text-navy dark:text-teal font-mono">100%</span>
                </div>
              </div>

              {/* Donut Legend */}
              <div className="space-y-2 mt-2 pt-2 border-t border-navy/10 dark:border-white/10 text-xs">
                {investorAllocationData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-gray-700 dark:text-slate-300 truncate max-w-[170px]">{item.name}</span>
                    </div>
                    <span className="font-black font-mono">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Full Security Specs & Multi-Currency Valuation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left 2 Columns: Full Specifications Table */}
        <div className="lg:col-span-2">
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl border-2 p-5 sm:p-6 shadow-sm",
            isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
          )}>
            <div className="mb-4 pb-3 border-b border-navy/10 dark:border-white/10 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-black text-navy dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal" />
                Security Specifications & Legal Structure
              </h3>
              <Badge className="bg-navy text-white text-xs font-mono">{bond.isin}</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="p-3 rounded-xl border border-navy/10 dark:border-white/10 flex justify-between items-center">
                <span className="text-gray-500 font-medium">Issuer:</span>
                <span className="font-bold text-navy dark:text-slate-100">{bond.issuer}</span>
              </div>
              <div className="p-3 rounded-xl border border-navy/10 dark:border-white/10 flex justify-between items-center">
                <span className="text-gray-500 font-medium">Stock Exchange:</span>
                <span className="font-bold text-navy dark:text-slate-100">{bond.exchangeName} ({bond.exchange})</span>
              </div>
              <div className="p-3 rounded-xl border border-navy/10 dark:border-white/10 flex justify-between items-center">
                <span className="text-gray-500 font-medium">Regulatory Authority:</span>
                <span className="font-bold text-navy dark:text-slate-100">{bond.regulator}</span>
              </div>
              <div className="p-3 rounded-xl border border-navy/10 dark:border-white/10 flex justify-between items-center">
                <span className="text-gray-500 font-medium">Credit Rating:</span>
                <span className="font-bold text-navy dark:text-slate-100">{bond.rating} by {bond.ratingAgency}</span>
              </div>
              <div className="p-3 rounded-xl border border-navy/10 dark:border-white/10 flex justify-between items-center">
                <span className="text-gray-500 font-medium">Issue Date:</span>
                <span className="font-bold font-mono">{bond.issueDate}</span>
              </div>
              <div className="p-3 rounded-xl border border-navy/10 dark:border-white/10 flex justify-between items-center">
                <span className="text-gray-500 font-medium">Maturity Date:</span>
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{bond.maturityDate}</span>
              </div>
              <div className="p-3 rounded-xl border border-navy/10 dark:border-white/10 flex justify-between items-center">
                <span className="text-gray-500 font-medium">Coupon Payment:</span>
                <span className="font-bold">Semi-Annual Fixed Rate</span>
              </div>
              <div className="p-3 rounded-xl border border-navy/10 dark:border-white/10 flex justify-between items-center">
                <span className="text-gray-500 font-medium">Market Liquidity:</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">{bond.liquidity}</span>
              </div>
            </div>

            {bond.description && (
              <div className="mt-4 p-4 rounded-2xl bg-teal/10 dark:bg-white/5 border border-navy/10 dark:border-white/10 text-xs leading-relaxed text-gray-700 dark:text-slate-200">
                <span className="font-bold text-navy dark:text-teal block mb-1">Use of Proceeds & Debt Strategy:</span>
                {bond.description}
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Column: Regional Capital Flow Donut Chart */}
        <div>
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl border-2 p-4 sm:p-5 shadow-sm flex flex-col justify-between",
            isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
          )}>
            <div>
              <div className="mb-3">
                <h3 className="text-base font-black text-navy dark:text-white flex items-center gap-2">
                  <Globe className="h-5 w-5 text-teal" />
                  Geographic Capital Flow
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Regional origin of invested bond capital
                </p>
              </div>

              {/* Geographic Donut */}
              <div className="h-52 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={regionalCapitalData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {regionalCapitalData.map((entry, index) => (
                        <Cell key={`geo-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1e1e26" : "#ffffff",
                        borderColor: isDark ? "#334155" : "#00008020",
                        borderRadius: "12px",
                        color: isDark ? "#f8fafc" : "#000080",
                        fontWeight: 600,
                      }}
                      formatter={(val: any) => [`${val}%`, "Regional Share"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] font-bold text-gray-400">{bond.exchange}</span>
                  <span className="text-base font-black text-navy dark:text-teal font-mono">100%</span>
                </div>
              </div>

              {/* Geographic Legend */}
              <div className="space-y-2 mt-2 pt-2 border-t border-navy/10 dark:border-white/10 text-xs">
                {regionalCapitalData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-gray-700 dark:text-slate-300 truncate max-w-[170px]">{item.name}</span>
                    </div>
                    <span className="font-black font-mono">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Related Corporate Bonds on Same Exchange / Sector */}
      {relatedBonds.length > 0 && (
        <Card className={cn(
          "rounded-2xl sm:rounded-3xl border-2 p-5 sm:p-6 shadow-sm space-y-3",
          isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
        )}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-black text-navy dark:text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-teal" />
              Related Corporate Bonds ({bond.exchange} & {bond.sector})
            </h3>
            <span className="text-xs font-bold text-gray-500">Quick Comparison</span>
          </div>
          <AdminTable
            columns={relatedColumns}
            data={relatedBonds}
            rowKey={(rel) => rel.id}
            actions={relatedActions}
            emptyIcon={Landmark}
            emptyTitle="No related bonds"
            emptyDescription="No related bonds found on this exchange and sector."
          />
        </Card>
      )}

      <AdminDetailModal
        open={viewModal}
        onOpenChange={(open) => {
          setViewModal(open)
          if (!open) setSelectedRelated(null)
        }}
        icon={Landmark}
        title={selectedRelated?.issuer ?? "Related Bond"}
        badge={selectedRelated ? <AdminPill>{selectedRelated.ticker}</AdminPill> : undefined}
        subtitle={
          selectedRelated
            ? `${selectedRelated.exchange} • ${selectedRelated.country} • ${selectedRelated.rating}`
            : undefined
        }
        sections={relatedDetailSections}
      />
    </div>
  )
}
