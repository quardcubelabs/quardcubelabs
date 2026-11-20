"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  Search,
  Globe,
  DollarSign,
  BarChart3,
  ExternalLink,
  ShieldCheck,
  Building2,
  Percent,
  Coins,
  AlertTriangle,
  Radio,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Factory,
  Zap,
  Award,
  Eye,
  Clock,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { useAdminSidebar } from "@/contexts/admin-sidebar-context"
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
  type BondNewsItem,
  type BondsCrawlerResult,
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
  const tickCleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [selectedBond, setSelectedBond] = useState<CorporateBond | null>(null)
  const [viewModal, setViewModal] = useState(false)

  // Background silent telemetry fetcher using secure encrypted transport
  const fetchBondsData = async (isInitial = false) => {
    try {
      // No refresh=true: reuse the crawler's in-memory cache instead of forcing a live scrape.
      const endpoint = "/api/admin/bonds"
      const json = await secureFetch<BondsCrawlerResult>(endpoint, { cache: "no-store" })

      if (json.success && json.data) {
        const incomingBonds: CorporateBond[] = json.data.bonds || []
        const newTicks: Record<string, PriceTickInfo> = {}
        const now = Date.now()

        incomingBonds.forEach((bond) => {
          const prev = prevPricesRef.current[bond.id]
          if (prev) {
            if (bond.priceUSD > prev.priceUSD) {
              newTicks[bond.id] = { direction: "up", timestamp: now }
            } else if (bond.priceUSD < prev.priceUSD) {
              newTicks[bond.id] = { direction: "down", timestamp: now }
            }
          }
          prevPricesRef.current[bond.id] = { priceUSD: bond.priceUSD, ytm: bond.ytm }
        })

        if (Object.keys(newTicks).length > 0) {
          setPriceTicks((prev) => ({ ...prev, ...newTicks }))

          // One-shot cleanup for this tick batch (no 1s re-render interval).
          if (tickCleanupTimeoutRef.current) clearTimeout(tickCleanupTimeoutRef.current)
          tickCleanupTimeoutRef.current = setTimeout(() => {
            setPriceTicks((prev) => {
              const next = { ...prev }
              let changed = false
              Object.keys(next).forEach((id) => {
                if (next[id].timestamp <= now) {
                  delete next[id]
                  changed = true
                }
              })
              return changed ? next : prev
            })
            tickCleanupTimeoutRef.current = null
          }, 2500)
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

  // Initial load and low-frequency silent background polling
  useEffect(() => {
    fetchBondsData(true)
    const interval = setInterval(() => {
      fetchBondsData(false)
    }, 60000)

    return () => {
      clearInterval(interval)
      if (tickCleanupTimeoutRef.current) clearTimeout(tickCleanupTimeoutRef.current)
    }
  }, [])

  // Filter and sort bonds
  const filteredBonds = useMemo(() => {
    if (!data?.bonds) return []

    return data.bonds
      .filter((bond) => {
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

  // Exchange tabs definition with Lucide React icons
  const exchangeTabs: {
    id: string
    label: string
    icon?: any
    countryCode?: string
    flag?: string
    count: number
  }[] = [
    { id: "ALL", label: "All Exchanges", icon: Layers, count: exchangeCounts.ALL },
    { id: "DSE", label: "DSE (Tanzania)", countryCode: "TZ", flag: "🇹🇿", count: exchangeCounts.DSE },
    { id: "NGX", label: "NGX (Nigeria)", countryCode: "NG", flag: "🇳🇬", count: exchangeCounts.NGX },
    { id: "NSE", label: "NSE (Kenya)", countryCode: "KE", flag: "🇰🇪", count: exchangeCounts.NSE },
    { id: "JSE", label: "JSE (South Africa)", countryCode: "ZA", flag: "🇿🇦", count: exchangeCounts.JSE },
    { id: "GLOBAL", label: "Global (NYSE/LSE)", icon: Globe, count: exchangeCounts.GLOBAL },
  ]

  if (!hasInitialLoaded && !data) {
    return <AdminLoading message="Loading multi-exchange corporate bonds telemetry..." />
  }

  const bondColumns: AdminTableColumn<CorporateBond>[] = [
    {
      key: "issuer",
      header: "Issuer & Security",
      render: (bond) => {
        const tickInfo = priceTicks[bond.id]
        return (
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <CountryFlag
              countryCode={bond.countryCode}
              countryName={bond.country}
              fallbackEmoji={bond.flag}
              size="md"
            />
            <AdminPrimaryCell
              title={bond.issuer}
              badge={<AdminTag title={`Ticker: ${bond.ticker}`}>{bond.ticker}</AdminTag>}
              subtitle={
                <span className="block">
                  <span className="block truncate">
                    {bond.sector}{!isSidebarOpen && <> • <span className="font-mono text-[9px]">{bond.isin}</span></>}
                  </span>
                  {(tickInfo?.direction === "up" || tickInfo?.direction === "down") && (
                    <span
                      className={cn(
                        "text-[9px] font-black uppercase",
                        tickInfo.direction === "up" ? "text-emerald-500" : "text-rose-500"
                      )}
                    >
                      {tickInfo.direction === "up" ? "▲ Tick up" : "▼ Tick down"}
                    </span>
                  )}
                </span>
              }
            />
          </div>
        )
      },
    },
    {
      key: "exchange",
      header: "Exchange",
      hidden: "sm",
      render: (bond) => (
        <div className="min-w-0">
          <AdminPill title={bond.exchangeName}>{bond.exchange}</AdminPill>
          <AdminMutedText className="block truncate max-w-[80px]">{bond.country}</AdminMutedText>
        </div>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      hidden: "md",
      render: (bond) => (
        <div className="min-w-0">
          <AdminPill
            className={cn(
              bond.rating.startsWith("AAA") || bond.rating.startsWith("AA")
                ? "text-emerald-600 dark:text-emerald-400"
                : bond.rating.startsWith("A")
                ? "text-blue-600 dark:text-blue-400"
                : "text-amber-600 dark:text-amber-400"
            )}
          >
            {bond.rating}
          </AdminPill>
          {!isSidebarOpen && <AdminMutedText className="block">{bond.ratingAgency}</AdminMutedText>}
        </div>
      ),
    },
    ...(!isSidebarOpen
      ? [
          {
            key: "coupon",
            header: "Coupon",
            hidden: "lg" as const,
            align: "right" as const,
            render: (bond: CorporateBond) => (
              <span className="font-bold">{bond.couponRate.toFixed(2)}%</span>
            ),
          },
        ]
      : []),
    {
      key: "ytm",
      header: "Yield (YTM)",
      hidden: "sm",
      align: "right",
      render: (bond) => {
        const tickInfo = priceTicks[bond.id]
        return (
          <span
            className={cn(
              "font-black text-xs sm:text-sm transition-all duration-300",
              tickInfo?.direction === "up"
                ? "text-emerald-600 dark:text-emerald-400"
                : tickInfo?.direction === "down"
                ? "text-rose-600 dark:text-rose-400"
                : "text-teal-700 dark:text-teal-400"
            )}
          >
            {bond.ytm.toFixed(2)}%
          </span>
        )
      },
    },
    {
      key: "price",
      header:
        priceViewMode === "unit" ? "Price" : priceViewMode === "local" ? "Local Price" : "Total Lot",
      align: "right",
      render: (bond) => {
        const tickInfo = priceTicks[bond.id]
        const priceClass = cn(
          "font-black text-xs sm:text-sm font-mono transition-all duration-300",
          tickInfo?.direction === "up"
            ? "text-emerald-600 dark:text-emerald-400"
            : tickInfo?.direction === "down"
            ? "text-rose-600 dark:text-rose-400"
            : priceViewMode === "local"
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-navy dark:text-teal"
        )
        if (priceViewMode === "unit") {
          return (
            <div>
              <div className={priceClass}>{formatDSEUnitPrice(bond.dseUnitPriceTZS)}</div>
              {!isSidebarOpen && <AdminMutedText className="block">TZS Benchmark</AdminMutedText>}
            </div>
          )
        }
        if (priceViewMode === "local") {
          return (
            <div>
              <div className={priceClass}>{formatLocalPrice(bond)}</div>
              {!isSidebarOpen && <AdminMutedText className="block">{bond.exchange} Listed</AdminMutedText>}
            </div>
          )
        }
        return (
          <div>
            <div className={priceClass}>{formatLotTZS(bond.priceTZS)}</div>
            {!isSidebarOpen && (
              <AdminMutedText className="block">Lot ({formatUSD(bond.priceUSD)})</AdminMutedText>
            )}
          </div>
        )
      },
    },
    ...(!isSidebarOpen
      ? [
          {
            key: "cleanPrice",
            header: "Clean Price",
            hidden: "lg" as const,
            align: "right" as const,
            render: (bond: CorporateBond) => (
              <span className="font-mono font-bold text-xs">{bond.pricePercentage.toFixed(2)}%</span>
            ),
          },
        ]
      : []),
    {
      key: "trend",
      header: "24h Trend",
      hidden: "sm",
      align: "right",
      render: (bond) => {
        const isPositive = bond.change24h >= 0
        return (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-bold text-[10px] sm:text-xs px-1.5 py-0.5 rounded transition-all duration-300",
              isPositive
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
            )}
          >
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {isPositive ? `+${bond.change24h.toFixed(2)}%` : `${bond.change24h.toFixed(2)}%`}
          </span>
        )
      },
    },
    ...(!isSidebarOpen
      ? [
          {
            key: "maturity",
            header: "Maturity",
            hidden: "md" as const,
            align: "center" as const,
            render: (bond: CorporateBond) => (
              <span className="font-semibold text-xs">{bond.maturityDate}</span>
            ),
          },
        ]
      : []),
  ]

  const bondActions: AdminTableAction<CorporateBond>[] = [
    {
      key: "view",
      label: "Inspect bond details",
      icon: Eye,
      variant: "view",
      onClick: (bond) => {
        setSelectedBond(bond)
        setViewModal(true)
      },
    },
    {
      key: "profile",
      label: "Open Bond Profile",
      icon: ExternalLink,
      variant: "soft",
      mobile: false,
      href: (bond) => `/admin/bonds/${bond.id}`,
    },
  ]

  const bondDetailSections: AdminDetailSectionData[] = selectedBond
    ? [
        {
          key: "identity",
          title: "Security Identity",
          icon: Landmark,
          fields: [
            { label: "Issuer", value: selectedBond.issuer },
            { label: "Ticker", value: selectedBond.ticker },
            { label: "ISIN", value: selectedBond.isin },
            { label: "Exchange", value: `${selectedBond.exchange} • ${selectedBond.exchangeName}` },
            { label: "Exchange City", value: selectedBond.exchangeCity },
            { label: "Country / Region", value: `${selectedBond.country} • ${selectedBond.region}` },
            { label: "Sector", value: selectedBond.sector },
            { label: "Regulator", value: selectedBond.regulator },
          ],
        },
        {
          key: "credit",
          title: "Credit Profile",
          icon: ShieldCheck,
          fields: [
            { label: "Credit Rating", value: <AdminPill>{selectedBond.rating}</AdminPill> },
            { label: "Rating Agency", value: selectedBond.ratingAgency },
            { label: "Annual Coupon", value: `${selectedBond.couponRate.toFixed(2)}%` },
            { label: "Yield to Maturity", value: `${selectedBond.ytm.toFixed(2)}%` },
            { label: "Trend", value: <AdminPill>{selectedBond.trend}</AdminPill> },
            { label: "Liquidity", value: <AdminPill>{selectedBond.liquidity}</AdminPill> },
          ],
        },
        {
          key: "pricing",
          title: "Pricing & Valuation",
          icon: DollarSign,
          fields: [
            { label: "Face Value (USD)", value: formatUSD(selectedBond.faceValueUSD) },
            { label: "Price (% of Par)", value: `${selectedBond.pricePercentage.toFixed(2)}%` },
            { label: "Price (USD)", value: formatUSD(selectedBond.priceUSD) },
            { label: "Contract Lot (TZS)", value: formatLotTZS(selectedBond.priceTZS) },
            { label: "DSE Unit Price", value: formatDSEUnitPrice(selectedBond.dseUnitPriceTZS) },
            { label: "DSE Clean Price", value: `${selectedBond.dseCleanPricePercent.toFixed(2)}%` },
            { label: "Face Value (TZS)", value: formatLotTZS(selectedBond.faceValueTZS) },
            { label: "Local Price", value: formatLocalPrice(selectedBond) },
            { label: "Local Face Value", value: `${selectedBond.exchangeCurrencySymbol} ${selectedBond.localCurrencyFaceValue.toLocaleString("en-US")}` },
          ],
        },
        {
          key: "market",
          title: "Market Activity",
          icon: TrendingUp,
          fields: [
            { label: "24h Change", value: `${selectedBond.change24h >= 0 ? "+" : ""}${selectedBond.change24h.toFixed(2)}%` },
            { label: "24h Points", value: selectedBond.changePoints.toFixed(2) },
            { label: "Volume (USD)", value: formatUSD(selectedBond.volume24hUSD) },
            { label: "Volume (TZS)", value: formatLotTZS(selectedBond.volume24hTZS) },
            { label: "Local Volume 24h", value: `${selectedBond.exchangeCurrencySymbol} ${selectedBond.localCurrencyVolume24h.toLocaleString("en-US")}` },
            { label: "Issue Date", value: selectedBond.issueDate },
            { label: "Maturity Date", value: selectedBond.maturityDate },
            { label: "Trading Currency", value: selectedBond.currency },
          ],
        },
        ...(selectedBond.description
          ? [
              {
                key: "description",
                title: "Security Description",
                icon: Building2,
                span: 3,
                content: (
                  <p className="text-xs leading-relaxed opacity-90 whitespace-pre-wrap">
                    {selectedBond.description}
                  </p>
                ),
              } as AdminDetailSectionData,
            ]
          : []),
      ]
    : []

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden pb-16 animate-in fade-in duration-300">
      <AdminPageHeader
        title="Corporate Bonds"
        accent="Live Multi-Exchange"
        subtitle="Live corporate debt telemetry from Dar es Salaam (DSE), Nigerian Exchange (NGX), Nairobi (NSE), JSE & Global Markets calibrated to Tanzanian Shillings (Tsh)"
        icon={Landmark}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <AdminStatusBadge
              status={data?.isLiveCrawled ? "active" : "pending"}
              label={`Auto Sync • ${data?.isLiveCrawled ? "Live" : "Cached"}`}
              className="uppercase tracking-wider px-2.5 py-1 shrink-0"
            />
          </div>
        }
      />

      <AdminStats
        items={[
          {
            title: "DSE Unit Benchmark",
            value: `TZS ${data?.metrics.usdToTzsRate ? data.metrics.usdToTzsRate.toFixed(3) : "2,500.488"}`,
            icon: Coins,
          },
          {
            title: "NGX Nigeria Benchmark",
            value: `₦${data?.metrics.usdToNgnRate ? data.metrics.usdToNgnRate.toFixed(2) : "1,520.50"}`,
            icon: Building2,
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
            icon: Percent,
          },
          {
            title: "Bonds Tracked",
            value: `${filteredBonds.length} Issues`,
            icon: Landmark,
          },
        ]}
      />

      {/* Supporting stat context preserved from the original KPI cards */}
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1.5 text-[11px] font-semibold text-navy/70 dark:text-slate-300 px-1">
        <span>Live TZS: <strong className="text-emerald-600 dark:text-emerald-400">+0.05%</strong> • DSE Reference Rate</span>
        <span>NGX / NGN: <strong>Avg Yield {data?.metrics.avgNigeriaCorporateYield || "12.45"}%</strong> • Lagos Stock Exchange</span>
        <span>YTM Spread: <strong className="text-emerald-600 dark:text-emerald-400">+28 bps</strong> • {selectedExchange === "ALL" ? "Global & Pan-African" : `${selectedExchange} Debt Index`}</span>
        <span>Auto Sync: <strong>{data?.news.length || 8} News Items</strong> • {exchangeCounts.ALL} Total Across 5 Exchanges</span>
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
                    <CountryFlag
                      countryCode={tab.countryCode}
                      countryName={tab.label}
                      fallbackEmoji={tab.flag}
                      size="sm"
                    />
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
      <Tabs defaultValue="bonds-table" value={activeTab} onValueChange={setActiveTab} className="space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-0 px-2 -mb-[2px] relative z-10">
          <TabsList className="px-0 -mb-0">
            <TabsTrigger value="bonds-table">
              <Landmark className="h-4 w-4 mr-1.5 shrink-0" />
              Corporate Bonds ({filteredBonds.length})
            </TabsTrigger>
            <TabsTrigger value="news-feed">
              <Radio className="h-4 w-4 mr-1.5 shrink-0" />
              Exchange News ({data?.news.length || 0})
            </TabsTrigger>
            <TabsTrigger value="yield-chart">
              <BarChart3 className="h-4 w-4 mr-1.5 shrink-0" />
              Yield Spread Chart
            </TabsTrigger>
          </TabsList>

          {/* Price View Mode Toggle */}
          <div className="flex items-center gap-1 bg-white dark:bg-[#0a1033] p-1 mb-1 rounded-xl border border-navy/15 dark:border-teal/20 text-xs font-bold self-start sm:self-auto flex-wrap">
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
        <TabsContent value="bonds-table" className="space-y-4">
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
                    <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-teal" /><span>All Sectors</span></div>
                  </SelectItem>
                  <SelectItem value="Banking & Finance">
                    <div className="flex items-center gap-2"><Landmark className="h-3.5 w-3.5 text-blue-500" /><span>Banking & Finance</span></div>
                  </SelectItem>
                  <SelectItem value="Telecommunications">
                    <div className="flex items-center gap-2"><Radio className="h-3.5 w-3.5 text-emerald-500" /><span>Telecommunications</span></div>
                  </SelectItem>
                  <SelectItem value="Infrastructure">
                    <div className="flex items-center gap-2"><Factory className="h-3.5 w-3.5 text-amber-500" /><span>Infrastructure & Cement</span></div>
                  </SelectItem>
                  <SelectItem value="Energy & Utilities">
                    <div className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-yellow-500" /><span>Energy & Utilities</span></div>
                  </SelectItem>
                  <SelectItem value="Consumer & Retail">
                    <div className="flex items-center gap-2"><Layers className="h-3.5 w-3.5 text-purple-500" /><span>Consumer & Foods</span></div>
                  </SelectItem>
                  <SelectItem value="Technology">
                    <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-cyan-500" /><span>Technology</span></div>
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
                    <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-teal" /><span>All Credit Ratings</span></div>
                  </SelectItem>
                  <SelectItem value="AAA">
                    <div className="flex items-center gap-2"><Award className="h-3.5 w-3.5 text-emerald-500" /><span>AAA (Prime Investment)</span></div>
                  </SelectItem>
                  <SelectItem value="AA">
                    <div className="flex items-center gap-2"><Award className="h-3.5 w-3.5 text-emerald-400" /><span>AA / AA+ / AA- (High Grade)</span></div>
                  </SelectItem>
                  <SelectItem value="A">
                    <div className="flex items-center gap-2"><Award className="h-3.5 w-3.5 text-blue-500" /><span>A / A+ / A- (Upper Medium)</span></div>
                  </SelectItem>
                  <SelectItem value="BBB">
                    <div className="flex items-center gap-2"><Award className="h-3.5 w-3.5 text-amber-500" /><span>BBB / BBB+ (Medium Grade)</span></div>
                  </SelectItem>
                  <SelectItem value="HY">
                    <div className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-rose-500" /><span>High Yield / Speculative</span></div>
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
                    <div className="flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-teal" /><span>Highest Yield (YTM %)</span></div>
                  </SelectItem>
                  <SelectItem value="yield-asc">
                    <div className="flex items-center gap-2"><TrendingDown className="h-3.5 w-3.5 text-blue-500" /><span>Lowest Yield (YTM %)</span></div>
                  </SelectItem>
                  <SelectItem value="unit-price-desc">
                    <div className="flex items-center gap-2"><DollarSign className="h-3.5 w-3.5 text-emerald-500" /><span>Highest Price</span></div>
                  </SelectItem>
                  <SelectItem value="change-desc">
                    <div className="flex items-center gap-2"><ArrowUpRight className="h-3.5 w-3.5 text-purple-500" /><span>Top 24h Gainers</span></div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Table Container - Smooth in-place real-time digits, position and trend transitions */}
          <AdminTable
            columns={bondColumns}
            data={filteredBonds}
            rowKey={(bond) => bond.id}
            actions={bondActions}
            emptyIcon={Landmark}
            emptyTitle={
              !hasInitialLoaded && filteredBonds.length === 0
                ? "Initializing live corporate debt streams..."
                : "No corporate bonds found"
            }
            emptyDescription={
              !hasInitialLoaded && filteredBonds.length === 0
                ? "Connecting to multi-exchange telemetry endpoints."
                : "No corporate bonds found matching your exchange and filter criteria."
            }
          />
        </TabsContent>

        {/* Tab 2: Multi-Exchange Corporate Bond News Feed */}
        <TabsContent value="news-feed" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.news.map((item: BondNewsItem) => (
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
        <TabsContent value="yield-chart" className="space-y-4">
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

      <AdminDetailModal
        open={viewModal}
        onOpenChange={(open) => {
          setViewModal(open)
          if (!open) setSelectedBond(null)
        }}
        icon={Landmark}
        title={selectedBond?.issuer ?? "Bond Details"}
        badge={selectedBond ? <AdminPill>{selectedBond.ticker}</AdminPill> : undefined}
        subtitle={
          selectedBond
            ? `${selectedBond.exchange} • ${selectedBond.country} • ${selectedBond.rating}`
            : undefined
        }
        sections={bondDetailSections}
      />
    </div>
  )
}
