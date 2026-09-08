"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Globe,
  DollarSign,
  BarChart3,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Radio,
  Clock,
  Layers,
  Percent,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronDown,
  Receipt,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  MapPin,
  Scale,
  Award,
  ArrowUpDown,
  Zap,
  Factory,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { useAdminSidebar } from "@/contexts/admin-sidebar-context"
import { cn } from "@/lib/utils"
import { secureFetch } from "@/lib/secure-client"
import {
  type CorporateBond,
  type BondNewsItem,
  type BondsCrawlerResult,
  type StockExchangeCode,
  STOCK_EXCHANGES,
} from "@/lib/bonds-crawler"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts"

interface PriceTickInfo {
  direction: "up" | "down" | "same"
  timestamp: number
}

export default function AdminBondsPage() {
  const router = useRouter()
  const { isDark } = useAdminTheme()
  const { isSidebarOpen } = useAdminSidebar()

  const [data, setData] = useState<BondsCrawlerResult | null>(null)
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedExchange, setSelectedExchange] = useState<string>("ALL")
  const [selectedRegion, setSelectedRegion] = useState("all")
  const [selectedSector, setSelectedSector] = useState("all")
  const [selectedRating, setSelectedRating] = useState("all")
  const [sortBy, setSortBy] = useState<"yield-desc" | "yield-asc" | "unit-price-desc" | "change-desc">("yield-desc")
  const [activeTab, setActiveTab] = useState("bonds-table")
  const [priceViewMode, setPriceViewMode] = useState<"unit" | "local" | "lot">("unit")

  // Real-time price tick animations map (bondId -> { direction: 'up' | 'down', timestamp })
  const [priceTicks, setPriceTicks] = useState<Record<string, PriceTickInfo>>({})
  const prevPricesRef = useRef<Record<string, { priceUSD: number; ytm: number }>>({})

  // Background silent telemetry fetcher using secure encrypted transport
  const fetchBondsData = async (isInitial = false) => {
    try {
      const endpoint = isInitial ? "/api/admin/bonds" : "/api/admin/bonds?refresh=true"
      const json = await secureFetch<BondsCrawlerResult>(endpoint, { cache: "no-store" })

      if (json.success && json.data) {
        const incomingBonds: CorporateBond[] = json.data.bonds || []
        const newTicks: Record<string, PriceTickInfo> = {}
        const now = Date.now()

        // Compare incoming bonds with previous values for live tick animations
        incomingBonds.forEach((bond) => {
          const prev = prevPricesRef.current[bond.id]
          if (prev) {
            if (bond.priceUSD > prev.priceUSD) {
              newTicks[bond.id] = { direction: "up", timestamp: now }
            } else if (bond.priceUSD < prev.priceUSD) {
              newTicks[bond.id] = { direction: "down", timestamp: now }
            }
          }
          // Store latest price reference
          prevPricesRef.current[bond.id] = { priceUSD: bond.priceUSD, ytm: bond.ytm }
        })

        if (Object.keys(newTicks).length > 0) {
          setPriceTicks((prev) => ({ ...prev, ...newTicks }))
        }

        setData(json.data)
        if (isInitial) setHasInitialLoaded(true)
      }
    } catch (err: any) {
      console.error("Silent background bonds sync:", err?.message || err)
    } finally {
      if (isInitial) setHasInitialLoaded(true)
    }
  }

  // Initial load and continuous silent background polling
  useEffect(() => {
    fetchBondsData(true)
    const interval = setInterval(() => {
      fetchBondsData(false)
    }, 6000) // Silent background sync every 6 seconds

    return () => clearInterval(interval)
  }, [])

  // Clear tick flash classes after 2.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now()
      setPriceTicks((prev) => {
        let changed = false
        const next = { ...prev }
        Object.keys(next).forEach((id) => {
          if (now - next[id].timestamp > 2500) {
            delete next[id]
            changed = true
          }
        })
        return changed ? next : prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Filter and sort bonds
  const filteredBonds = useMemo(() => {
    if (!data?.bonds) return []

    return data.bonds
      .filter((bond) => {
        // Stock exchange filter
        const matchesExchange =
          selectedExchange === "ALL" ||
          (selectedExchange === "GLOBAL"
            ? ["NYSE", "NASDAQ", "LSE"].includes(bond.exchange)
            : bond.exchange === selectedExchange)

        const matchesSearch =
          searchQuery === "" ||
          bond.issuer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bond.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bond.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bond.isin.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bond.exchange.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bond.exchangeName.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesRegion =
          selectedRegion === "all" ||
          (selectedRegion === "tz"
            ? bond.countryCode === "TZ" || bond.region.includes("Tanzania")
            : selectedRegion === "ng"
            ? bond.countryCode === "NG" || bond.region.includes("West Africa")
            : bond.region.toLowerCase().includes(selectedRegion.toLowerCase()))

        const matchesSector =
          selectedSector === "all" || bond.sector.toLowerCase() === selectedSector.toLowerCase()

        const matchesRating =
          selectedRating === "all" ||
          (selectedRating === "AAA" && bond.rating === "AAA") ||
          (selectedRating === "AA" && (bond.rating === "AA+" || bond.rating === "AA" || bond.rating === "AA-")) ||
          (selectedRating === "A" && (bond.rating === "A+" || bond.rating === "A" || bond.rating === "A-")) ||
          (selectedRating === "BBB" && (bond.rating === "BBB+" || bond.rating === "BBB")) ||
          (selectedRating === "HY" && (bond.rating === "BB+" || bond.rating === "B+"))

        return matchesExchange && matchesSearch && matchesRegion && matchesSector && matchesRating
      })
      .sort((a, b) => {
        if (sortBy === "yield-desc") return b.ytm - a.ytm
        if (sortBy === "yield-asc") return a.ytm - b.ytm
        if (sortBy === "unit-price-desc") return (b.dseUnitPriceTZS || b.priceTZS) - (a.dseUnitPriceTZS || a.priceTZS)
        if (sortBy === "change-desc") return b.change24h - a.change24h
        return 0
      })
  }, [data?.bonds, selectedExchange, searchQuery, selectedRegion, selectedSector, selectedRating, sortBy])

  // Count bonds per exchange for badges
  const exchangeCounts = useMemo(() => {
    if (!data?.bonds) return { ALL: 0, DSE: 0, NGX: 0, NSE: 0, JSE: 0, GLOBAL: 0 }
    return {
      ALL: data.bonds.length,
      DSE: data.bonds.filter((b) => b.exchange === "DSE").length,
      NGX: data.bonds.filter((b) => b.exchange === "NGX").length,
      NSE: data.bonds.filter((b) => b.exchange === "NSE").length,
      JSE: data.bonds.filter((b) => b.exchange === "JSE").length,
      GLOBAL: data.bonds.filter((b) => ["NYSE", "NASDAQ", "LSE"].includes(b.exchange)).length,
    }
  }, [data?.bonds])

  // Chart data: Yield vs Coupon by Company (Filtered by current selection)
  const chartData = useMemo(() => {
    if (!filteredBonds) return []
    return filteredBonds.slice(0, 10).map((b) => ({
      name: b.ticker,
      fullName: b.issuer,
      exchange: b.exchange,
      yield: b.ytm,
      coupon: b.couponRate,
      unitPrice: b.dseUnitPriceTZS || 2500.488,
      country: b.country,
    }))
  }, [filteredBonds])

  // Format DSE Unit Price with 3-decimal precision (e.g. 2,500.488)
  const formatDSEUnitPrice = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return "TZS 2,500.488"
    return `TZS ${val.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`
  }

  // Format Local Currency Price
  const formatLocalPrice = (bond: CorporateBond) => {
    return `${bond.exchangeCurrencySymbol} ${bond.localCurrencyPrice.toLocaleString("en-US")} ${bond.exchangeCurrency}`
  }

  // Format Total Contract/Lot in TZS
  const formatLotTZS = (val: number) => {
    return `TZS ${val.toLocaleString("en-US")}`
  }

  // Format money in USD
  const formatUSD = (val: number) => {
    return `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // 4 Standard Stats Cards configuration
  const statCards = [
    {
      title: "DSE Unit Benchmark",
      value: `TZS ${data?.metrics.usdToTzsRate ? data.metrics.usdToTzsRate.toFixed(3) : "2,500.488"}`,
      change: "+0.05%",
      changeType: "up" as const,
      subtext: "DSE Reference Rate",
      icon: Coins,
      badge: "Live TZS",
    },
    {
      title: "NGX Nigeria Benchmark",
      value: `₦${data?.metrics.usdToNgnRate ? data.metrics.usdToNgnRate.toFixed(2) : "1,520.50"}`,
      change: `Avg Yield ${data?.metrics.avgNigeriaCorporateYield || "12.45"}%`,
      changeType: "up" as const,
      subtext: "Lagos Stock Exchange",
      icon: Building2,
      badge: "NGX / NGN",
    },
    {
      title: "Avg Regional Yield",
      value: `${
        selectedExchange === "NGX"
          ? data?.metrics.avgNigeriaCorporateYield || "12.45"
          : selectedExchange === "DSE"
          ? data?.metrics.avgTanzaniaCorporateYield || "8.80"
          : selectedExchange === "NSE"
          ? data?.metrics.avgKenyaCorporateYield || "10.75"
          : selectedExchange === "JSE"
          ? data?.metrics.avgSouthAfricaCorporateYield || "8.85"
          : data?.metrics.avgCorporateYield || "8.45"
      }%`,
      change: "+28 bps",
      changeType: "up" as const,
      subtext: selectedExchange === "ALL" ? "Global & Pan-African" : `${selectedExchange} Debt Index`,
      icon: Percent,
      badge: "YTM Spread",
    },
    {
      title: "Bonds Tracked",
      value: `${filteredBonds.length} Issues`,
      change: `${data?.news.length || 8} News Items`,
      changeType: "up" as const,
      subtext: `${exchangeCounts.ALL} Total Across 5 Exchanges`,
      icon: Landmark,
      badge: "Auto Sync",
    },
  ]

  // Exchange tabs definition with Lucide React icons
  const exchangeTabs: {
    id: string
    label: string
    icon?: any
    flag?: string
    count: number
  }[] = [
    { id: "ALL", label: "All Exchanges", icon: Layers, count: exchangeCounts.ALL },
    { id: "DSE", label: "DSE (Tanzania)", flag: "🇹🇿", count: exchangeCounts.DSE },
    { id: "NGX", label: "NGX (Nigeria)", flag: "🇳🇬", count: exchangeCounts.NGX },
    { id: "NSE", label: "NSE (Kenya)", flag: "🇰🇪", count: exchangeCounts.NSE },
    { id: "JSE", label: "JSE (South Africa)", flag: "🇿🇦", count: exchangeCounts.JSE },
    { id: "GLOBAL", label: "Global (NYSE/LSE)", icon: Globe, count: exchangeCounts.GLOBAL },
  ]

  return (
    <div className="w-full space-y-5 sm:space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Header styled in QuardCube Teal Brand Standard (Without manual sync button) */}
      <div className="bg-teal p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-navy">
                Corporate <span className="text-white drop-shadow-sm">Bonds</span>
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-navy text-white uppercase tracking-wider inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Multi-Exchange
              </span>
            </div>
            <p className="text-xs sm:text-sm md:text-base text-navy/90 font-semibold">
              Live corporate debt telemetry from Dar es Salaam (DSE), Nigerian Exchange (NGX), Nairobi (NSE), JSE & Global Markets calibrated to Tanzanian Shillings (Tsh)
            </p>
          </div>
        </div>
      </div>

      {/* 4 Standard Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card
              key={index}
              className={cn(
                "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
                isDark
                  ? "bg-[#0a1033] border-none shadow-md hover:shadow-lg text-slate-100"
                  : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md text-navy"
              )}
            >
              <CardContent className="p-3.5 sm:p-4.5 flex items-center justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5 truncate block",
                    isDark ? "text-teal-400/80" : "text-navy/70"
                  )}>
                    {stat.title}
                  </p>
                  <span className={cn(
                    "font-black truncate block leading-tight tracking-tight font-mono transition-all duration-300",
                    isSidebarOpen ? "text-base sm:text-lg xl:text-xl" : "text-lg sm:text-xl xl:text-2xl",
                    isDark ? "text-white" : "text-navy"
                  )}>
                    {stat.value}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 truncate">
                    <span className="text-[10px] sm:text-[11px] font-bold flex items-center text-teal-600 dark:text-teal-400">
                      <TrendingUp className="h-3 w-3 mr-0.5 shrink-0" />
                      {stat.change}
                    </span>
                    {!isSidebarOpen && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate hidden xl:inline">
                        • {stat.subtext}
                      </span>
                    )}
                  </div>
                </div>
                <div className={cn(
                  "w-9 h-9 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                  isDark
                    ? "bg-navy border-teal/30 text-teal group-hover:bg-navy/80"
                    : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
                )}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 🌟 Stock Exchange Platform Selector Tabs */}
      <div className={cn(
        "p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl border-2 shadow-sm transition-all",
        isDark ? "bg-[#0e1438] border-teal/30" : "bg-teal/10 border-navy/20"
      )}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-2 mb-2 border-b border-navy/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-navy text-white text-xs font-black shrink-0">
              <Landmark className="h-3.5 w-3.5" />
            </span>
            <span className="font-extrabold text-xs sm:text-sm text-navy dark:text-white uppercase tracking-wider">
              Select Stock Exchange Platform:
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono font-semibold text-navy/80 dark:text-teal-300">
            <span>Live FX Rate:</span>
            <span className="px-2 py-0.5 rounded bg-white dark:bg-black/40 border border-navy/15 dark:border-teal/30 font-bold">
              1 USD = Tsh {data?.metrics.usdToTzsRate ? data.metrics.usdToTzsRate.toFixed(2) : "2500.48"} | ₦{data?.metrics.usdToNgnRate ? data.metrics.usdToNgnRate.toFixed(2) : "1520.50"} | KSh {data?.metrics.usdToKesRate ? data.metrics.usdToKesRate.toFixed(2) : "129.40"}
            </span>
          </div>
        </div>

        {/* Exchange Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {exchangeTabs.map((tab) => {
            const isSelected = selectedExchange === tab.id
            const TabIcon = tab.icon

            return (
              <button
                key={tab.id}
                onClick={() => setSelectedExchange(tab.id)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all border",
                  isSelected
                    ? isDark
                      ? "bg-teal text-navy border-teal font-black shadow-md scale-[1.02]"
                      : "bg-navy text-white border-navy font-black shadow-md scale-[1.02]"
                    : isDark
                    ? "bg-[#141a45] text-slate-200 border-white/10 hover:bg-[#1a225c] hover:border-teal/40"
                    : "bg-white text-navy border-navy/15 hover:bg-teal-50 hover:border-navy"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  {TabIcon ? (
                    <TabIcon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isSelected
                          ? isDark ? "text-navy" : "text-white"
                          : "text-teal-600 dark:text-teal-400"
                      )}
                    />
                  ) : (
                    <span className="text-base shrink-0">{tab.flag}</span>
                  )}
                  <span className="truncate">{tab.label}</span>
                </div>
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-black shrink-0 ml-1 font-mono",
                  isSelected
                    ? isDark ? "bg-navy text-white" : "bg-teal text-navy"
                    : isDark ? "bg-white/10 text-slate-300" : "bg-navy/10 text-navy"
                )}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Tabs Navigation (Corporate Bonds / Market News / Yield Chart) */}
      <Tabs defaultValue="bonds-table" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList className={cn(
            "p-1 rounded-2xl border flex flex-wrap h-auto",
            isDark ? "bg-[#181820] border-white/10" : "bg-navy/5 border-navy/15"
          )}>
            <TabsTrigger
              value="bonds-table"
              className={cn(
                "rounded-xl px-3.5 py-1.5 font-bold text-xs sm:text-sm transition-all",
                "data-[state=active]:bg-navy data-[state=active]:text-white dark:data-[state=active]:bg-teal dark:data-[state=active]:text-navy"
              )}
            >
              <Landmark className="h-3.5 w-3.5 mr-1.5" />
              Corporate Bonds ({filteredBonds.length})
            </TabsTrigger>
            <TabsTrigger
              value="news-feed"
              className={cn(
                "rounded-xl px-3.5 py-1.5 font-bold text-xs sm:text-sm transition-all",
                "data-[state=active]:bg-navy data-[state=active]:text-white dark:data-[state=active]:bg-teal dark:data-[state=active]:text-navy"
              )}
            >
              <Radio className="h-3.5 w-3.5 mr-1.5" />
              Exchange News ({data?.news.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="yield-chart"
              className={cn(
                "rounded-xl px-3.5 py-1.5 font-bold text-xs sm:text-sm transition-all",
                "data-[state=active]:bg-navy data-[state=active]:text-white dark:data-[state=active]:bg-teal dark:data-[state=active]:text-navy"
              )}
            >
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
              Yield Spread Chart
            </TabsTrigger>
          </TabsList>

          {/* Price View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-navy/15 dark:border-white/10 text-xs font-bold self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setPriceViewMode("unit")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all text-xs",
                priceViewMode === "unit"
                  ? isDark ? "bg-teal text-navy font-black shadow" : "bg-navy text-white font-black shadow"
                  : "text-gray-600 dark:text-gray-400 hover:text-navy"
              )}
            >
              DSE Unit Price (TZS)
            </button>
            <button
              onClick={() => setPriceViewMode("local")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all text-xs",
                priceViewMode === "local"
                  ? isDark ? "bg-teal text-navy font-black shadow" : "bg-navy text-white font-black shadow"
                  : "text-gray-600 dark:text-gray-400 hover:text-navy"
              )}
            >
              Local Exchange Currency
            </button>
            <button
              onClick={() => setPriceViewMode("lot")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all text-xs",
                priceViewMode === "lot"
                  ? isDark ? "bg-teal text-navy font-black shadow" : "bg-navy text-white font-black shadow"
                  : "text-gray-600 dark:text-gray-400 hover:text-navy"
              )}
            >
              Contract Lot (TZS)
            </button>
          </div>
        </div>

        {/* Tab 1: Live Corporate Bonds Table & Filters */}
        <TabsContent value="bonds-table" className="mt-4 space-y-4">
          {/* Filter Bar */}
          <Card className={cn(
            "p-3.5 rounded-2xl border-2 shadow-sm",
            isDark ? "bg-[#181820] border-white/10 text-slate-100" : "bg-white border-navy/15 text-navy"
          )}>
            <div className={cn(
              "grid gap-2.5",
              isSidebarOpen ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
            )}>
              {/* Search */}
              <div className={cn("relative", isSidebarOpen ? "sm:col-span-2 lg:col-span-1" : "lg:col-span-2")}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="Search issuer (Dangote, NMB, MTN, Apple)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "pl-9 h-9 rounded-xl text-xs font-medium",
                    isDark ? "bg-[#101015] border-white/10" : "bg-gray-50 border-navy/20"
                  )}
                />
              </div>

              {/* Sector Filter */}
              <Select value={selectedSector} onValueChange={setSelectedSector}>
                <SelectTrigger className={cn("h-9 rounded-xl text-xs font-bold", isDark ? "bg-[#101015] border-white/10" : "bg-gray-50 border-navy/20")}>
                  <SelectValue placeholder="Sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-teal" />
                      <span>All Sectors</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Banking & Finance">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-3.5 w-3.5 text-blue-500" />
                      <span>Banking & Finance</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Telecommunications">
                    <div className="flex items-center gap-2">
                      <Radio className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Telecommunications</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Infrastructure">
                    <div className="flex items-center gap-2">
                      <Factory className="h-3.5 w-3.5 text-amber-500" />
                      <span>Infrastructure & Cement</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Energy & Utilities">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-yellow-500" />
                      <span>Energy & Utilities</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Consumer & Retail">
                    <div className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-purple-500" />
                      <span>Consumer & Foods</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Technology">
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-cyan-500" />
                      <span>Technology</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Rating Filter */}
              <Select value={selectedRating} onValueChange={setSelectedRating}>
                <SelectTrigger className={cn("h-9 rounded-xl text-xs font-bold", isDark ? "bg-[#101015] border-white/10" : "bg-gray-50 border-navy/20")}>
                  <SelectValue placeholder="Credit Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-teal" />
                      <span>All Credit Ratings</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="AAA">
                    <div className="flex items-center gap-2">
                      <Award className="h-3.5 w-3.5 text-emerald-500" />
                      <span>AAA (Prime Investment)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="AA">
                    <div className="flex items-center gap-2">
                      <Award className="h-3.5 w-3.5 text-emerald-400" />
                      <span>AA / AA+ / AA- (High Grade)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="A">
                    <div className="flex items-center gap-2">
                      <Award className="h-3.5 w-3.5 text-blue-500" />
                      <span>A / A+ / A- (Upper Medium)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="BBB">
                    <div className="flex items-center gap-2">
                      <Award className="h-3.5 w-3.5 text-amber-500" />
                      <span>BBB / BBB+ (Medium Grade)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="HY">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                      <span>High Yield / Speculative</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                <SelectTrigger className={cn("h-9 rounded-xl text-xs font-bold", isDark ? "bg-[#101015] border-white/10" : "bg-gray-50 border-navy/20")}>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yield-desc">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-teal" />
                      <span>Highest Yield (YTM %)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="yield-asc">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-3.5 w-3.5 text-blue-500" />
                      <span>Lowest Yield (YTM %)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="unit-price-desc">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Highest Price</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="change-desc">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-3.5 w-3.5 text-purple-500" />
                      <span>Top 24h Gainers</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Table Container - Smooth in-place real-time digits, position and trend transitions */}
          <div className={cn(
            "overflow-x-auto rounded-2xl border-2 shadow-sm",
            isDark ? "bg-[#14141a] border-white/10" : "bg-white border-navy/15"
          )}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={cn(
                  "border-b text-[11px] font-black uppercase tracking-wider",
                  isDark ? "bg-[#181822] text-slate-300 border-white/10" : "bg-navy text-white border-navy"
                )}>
                  <th className="py-3 px-3 sm:px-4">Issuer & Security</th>
                  <th className="py-3 px-2.5">Exchange</th>
                  <th className="py-3 px-2.5">Rating</th>
                  {!isSidebarOpen && <th className="py-3 px-2.5 text-right">Coupon</th>}
                  <th className="py-3 px-2.5 text-right">Yield (YTM)</th>
                  <th className="py-3 px-3 text-right">
                    {priceViewMode === "unit"
                      ? "DSE Unit Price (TZS)"
                      : priceViewMode === "local"
                      ? "Local Currency Price"
                      : "Total Lot (TZS)"}
                  </th>
                  {!isSidebarOpen && <th className="py-3 px-2.5 text-right">Clean Price (% Par)</th>}
                  <th className="py-3 px-2.5 text-right">24h Trend</th>
                  {!isSidebarOpen && <th className="py-3 px-3 text-center">Maturity</th>}
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/10 dark:divide-white/10 text-xs sm:text-sm">
                {!hasInitialLoaded && filteredBonds.length === 0 ? (
                  <tr>
                    <td colSpan={isSidebarOpen ? 7 : 10} className="py-12 text-center text-gray-500 font-medium">
                      <div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Initializing live corporate debt streams...
                    </td>
                  </tr>
                ) : filteredBonds.length === 0 ? (
                  <tr>
                    <td colSpan={isSidebarOpen ? 7 : 10} className="py-12 text-center text-gray-500 font-medium">
                      No corporate bonds found matching your exchange and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredBonds.map((bond) => {
                    const isPositive = bond.change24h >= 0
                    const tickInfo = priceTicks[bond.id]
                    const isTickUp = tickInfo?.direction === "up"
                    const isTickDown = tickInfo?.direction === "down"

                    return (
                      <tr
                        key={bond.id}
                        className={cn(
                          "transition-all duration-300 group cursor-pointer",
                          isTickUp && (isDark ? "bg-emerald-950/40" : "bg-emerald-50"),
                          isTickDown && (isDark ? "bg-rose-950/40" : "bg-rose-50"),
                          !isTickUp && !isTickDown && (isDark ? "hover:bg-teal/10" : "hover:bg-teal/15")
                        )}
                        onClick={() => router.push(`/admin/bonds/${bond.id}`)}
                      >
                        {/* Company & Country */}
                        <td className="py-3 px-3 sm:px-4">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl shrink-0" role="img" aria-label={bond.country}>
                              {bond.flag}
                            </span>
                            <div className="min-w-0">
                              <div className="font-bold text-navy dark:text-slate-100 flex items-center gap-1.5 truncate">
                                <span className="truncate">{bond.issuer}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-white/10 font-mono font-bold text-gray-700 dark:text-gray-300 shrink-0">
                                  {bond.ticker}
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5 font-medium truncate">
                                <span>{bond.sector}</span>
                                {!isSidebarOpen && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono text-[10px]">{bond.isin}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Exchange Badge */}
                        <td className="py-3 px-2.5">
                          <Badge
                            className={cn(
                              "font-black text-[10px] px-2 py-0.5 rounded font-mono shadow-xs",
                              bond.exchange === "DSE"
                                ? "bg-emerald-600 text-white"
                                : bond.exchange === "NGX"
                                ? "bg-green-700 text-white"
                                : bond.exchange === "NSE"
                                ? "bg-amber-600 text-white"
                                : bond.exchange === "JSE"
                                ? "bg-blue-700 text-white"
                                : "bg-purple-700 text-white"
                            )}
                          >
                            {bond.exchange}
                          </Badge>
                          <span className="text-[9px] block text-gray-400 font-semibold mt-0.5 truncate max-w-[80px]">
                            {bond.country}
                          </span>
                        </td>

                        {/* Rating */}
                        <td className="py-3 px-2.5">
                          <Badge
                            className={cn(
                              "font-black text-[10px] px-2 py-0.5 rounded",
                              bond.rating.startsWith("AAA") || bond.rating.startsWith("AA")
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                : bond.rating.startsWith("A")
                                ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            )}
                          >
                            {bond.rating}
                          </Badge>
                          {!isSidebarOpen && (
                            <span className="text-[9px] block opacity-60 font-bold mt-0.5">
                              {bond.ratingAgency}
                            </span>
                          )}
                        </td>

                        {/* Coupon */}
                        {!isSidebarOpen && (
                          <td className="py-3 px-2.5 text-right font-bold text-navy dark:text-slate-200">
                            {bond.couponRate.toFixed(2)}%
                          </td>
                        )}

                        {/* Yield (YTM) with seamless digit animation */}
                        <td className="py-3 px-2.5 text-right">
                          <span className={cn(
                            "font-black text-xs sm:text-sm transition-all duration-300",
                            isTickUp
                              ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                              : isTickDown
                              ? "text-rose-600 dark:text-rose-400 font-extrabold"
                              : "text-teal-700 dark:text-teal-400"
                          )}>
                            {bond.ytm.toFixed(2)}%
                          </span>
                        </td>

                        {/* Price (Unit / Local / Lot) with seamless live tick highlight */}
                        <td className="py-3 px-3 text-right">
                          {priceViewMode === "unit" ? (
                            <div>
                              <div className={cn(
                                "font-black text-xs sm:text-sm font-mono transition-all duration-300",
                                isTickUp
                                  ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                                  : isTickDown
                                  ? "text-rose-600 dark:text-rose-400 font-extrabold"
                                  : "text-navy dark:text-teal"
                              )}>
                                {formatDSEUnitPrice(bond.dseUnitPriceTZS)}
                              </div>
                              {!isSidebarOpen && (
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium block">
                                  TZS Benchmark
                                </span>
                              )}
                            </div>
                          ) : priceViewMode === "local" ? (
                            <div>
                              <div className={cn(
                                "font-black text-xs sm:text-sm font-mono transition-all duration-300",
                                isTickUp
                                  ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                                  : isTickDown
                                  ? "text-rose-600 dark:text-rose-400 font-extrabold"
                                  : "text-emerald-700 dark:text-emerald-400"
                              )}>
                                {formatLocalPrice(bond)}
                              </div>
                              {!isSidebarOpen && (
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium block">
                                  {bond.exchange} Listed
                                </span>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div className={cn(
                                "font-black text-xs sm:text-sm font-mono transition-all duration-300",
                                isTickUp
                                  ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                                  : isTickDown
                                  ? "text-rose-600 dark:text-rose-400 font-extrabold"
                                  : "text-navy dark:text-teal"
                              )}>
                                {formatLotTZS(bond.priceTZS)}
                              </div>
                              {!isSidebarOpen && (
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium block">
                                  Lot ({formatUSD(bond.priceUSD)})
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Clean Price (% Par) */}
                        {!isSidebarOpen && (
                          <td className="py-3 px-2.5 text-right font-mono font-bold text-xs text-gray-700 dark:text-gray-300">
                            {bond.pricePercentage.toFixed(2)}%
                          </td>
                        )}

                        {/* 24h Trend */}
                        <td className="py-3 px-2.5 text-right">
                          <div className={cn(
                            "inline-flex items-center gap-0.5 font-bold text-[10px] sm:text-xs px-1.5 py-0.5 rounded transition-all duration-300",
                            isPositive
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          )}>
                            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {isPositive ? `+${bond.change24h.toFixed(2)}%` : `${bond.change24h.toFixed(2)}%`}
                          </div>
                        </td>

                        {/* Maturity Date */}
                        {!isSidebarOpen && (
                          <td className="py-3 px-3 text-center font-semibold text-xs text-gray-600 dark:text-gray-400">
                            {bond.maturityDate}
                          </td>
                        )}

                        {/* Action Details */}
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/bonds/${bond.id}`)}
                            className={cn(
                              "h-7 px-3 rounded-lg text-xs font-bold transition-all shadow-xs",
                              isDark
                                ? "bg-[#000080] text-white border-[#000080] hover:bg-[#000080]/85 hover:text-white"
                                : "bg-white text-navy border-navy/20 hover:bg-navy hover:text-white"
                            )}
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Tab 2: Multi-Exchange Corporate Bond News Feed */}
        <TabsContent value="news-feed" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.news.map((item) => (
              <Card
                key={item.id}
                className={cn(
                  "border-2 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between",
                  isDark ? "bg-[#181820] border-white/10 text-slate-100" : "bg-white border-navy/15 text-navy"
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      {item.exchange && (
                        <Badge className="bg-navy dark:bg-teal dark:text-navy text-white text-[10px] font-black">
                          {item.exchange}
                        </Badge>
                      )}
                      <Badge
                        className={cn(
                          "font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded",
                          item.sentiment === "Bullish"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : item.sentiment === "Cautious"
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                            : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
                        )}
                      >
                        {item.sentiment} Signal
                      </Badge>
                    </div>
                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {item.publishedAt}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm sm:text-base text-navy dark:text-slate-100 leading-snug mb-1.5">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-slate-300 leading-relaxed mb-3">
                    {item.summary}
                  </p>

                  <div className={cn(
                    "p-2.5 rounded-xl border text-[11px] font-medium mb-3",
                    isDark ? "bg-teal/5 border-teal/20 text-teal-300" : "bg-teal/10 border-navy/10 text-navy"
                  )}>
                    <span className="font-bold">Market Impact: </span>
                    {item.impact}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-navy/10 dark:border-white/10 text-[11px] text-gray-500">
                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 className="h-3 w-3 text-teal shrink-0" />
                    <span className="font-semibold text-navy dark:text-slate-200 truncate">{item.company}</span>
                    <span>•</span>
                    <span className="truncate">{item.source}</span>
                  </div>
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-bold text-teal hover:underline shrink-0 ml-2"
                  >
                    Source <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 3: Yield Analytics Chart */}
        <TabsContent value="yield-chart" className="mt-4 space-y-4">
          <Card className={cn(
            "p-5 rounded-2xl border-2 shadow-sm",
            isDark ? "bg-[#181820] border-white/10 text-slate-100" : "bg-white border-navy/15 text-navy"
          )}>
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-navy dark:text-slate-100 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-teal" />
                  Yield to Maturity (YTM %) vs Annual Coupon Rate (%)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Comparative yield spread across {selectedExchange === "ALL" ? "all stock exchanges" : selectedExchange} corporate issuers.
                </p>
              </div>
              <Badge className="bg-teal text-navy font-bold text-xs self-start sm:self-auto">
                {selectedExchange === "ALL" ? "Global & Pan-African" : selectedExchange}
              </Badge>
            </div>

            <div className="h-72 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={isDark ? 0.1 : 0.2} />
                  <XAxis dataKey="name" stroke={isDark ? "#94a3b8" : "#000080"} fontSize={11} fontStyle="bold" />
                  <YAxis unit="%" stroke={isDark ? "#94a3b8" : "#000080"} fontSize={11} domain={[0, 18]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#1e1e26" : "#ffffff",
                      borderColor: isDark ? "#334155" : "#00008020",
                      borderRadius: "12px",
                      color: isDark ? "#f8fafc" : "#000080",
                      fontWeight: 600,
                    }}
                    formatter={(val: any, name: any) => [`${val}%`, name === "yield" ? "Yield to Maturity (YTM)" : "Annual Coupon Rate"]}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload
                      return item ? `${item.fullName} [${item.exchange}]` : label
                    }}
                  />
                  <Legend />
                  <Bar dataKey="yield" name="Yield to Maturity (YTM %)" fill={isDark ? "#2dd4bf" : "#000080"} radius={[5, 5, 0, 0]} />
                  <Bar dataKey="coupon" name="Annual Coupon (%)" fill={isDark ? "#38bdf8" : "#0d9488"} radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
