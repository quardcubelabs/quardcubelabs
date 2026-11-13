"use client"

import { useState, useEffect } from "react"
import {
  X,
  DollarSign,
  ArrowRightLeft,
  CheckCircle2,
  CreditCard,
  Smartphone,
  Building2,
  ShieldCheck,
  Info,
  TrendingUp,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface CurrencyModalProps {
  isOpen: boolean
  onClose: () => void
}

interface CurrencyOption {
  code: string
  name: string
  symbol: string
  rateAgainstTZS: number // 1 unit in TZS
  flag: string
}

const CURRENCIES: CurrencyOption[] = [
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", rateAgainstTZS: 1, flag: "🇹🇿" },
  { code: "USD", name: "US Dollar", symbol: "$", rateAgainstTZS: 2600, flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", rateAgainstTZS: 2820, flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", rateAgainstTZS: 3310, flag: "🇬🇧" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", rateAgainstTZS: 20.2, flag: "🇰🇪" },
]

const PAYMENT_METHODS = [
  {
    category: "Mobile Money (Tanzania)",
    icon: Smartphone,
    items: [
      { name: "M-Pesa", provider: "Vodacom", badge: "Instant", color: "bg-red-500/10 text-red-600 border-red-200" },
      { name: "Tigo Pesa", provider: "Mixx by Yas", badge: "Instant", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
      { name: "Airtel Money", provider: "Airtel", badge: "Instant", color: "bg-red-500/10 text-red-600 border-red-200" },
      { name: "HaloPesa", provider: "Halotel", badge: "Instant", color: "bg-orange-500/10 text-orange-600 border-orange-200" },
    ],
  },
  {
    category: "Cards & Gateways",
    icon: CreditCard,
    items: [
      { name: "Visa", provider: "Credit / Debit", badge: "3D Secure", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
      { name: "Mastercard", provider: "Credit / Debit", badge: "3D Secure", color: "bg-orange-500/10 text-orange-700 border-orange-200" },
      { name: "Selcom Pay", provider: "Selcom Gateway", badge: "Popular", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
    ],
  },
  {
    category: "Direct Bank Transfer",
    icon: Building2,
    items: [
      { name: "CRDB Bank", provider: "Account Transfer", badge: "Verified", color: "bg-green-500/10 text-green-700 border-green-200" },
      { name: "NMB Bank", provider: "Account Transfer", badge: "Verified", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
    ],
  },
]

export default function CurrencyModal({ isOpen, onClose }: CurrencyModalProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<string>("TZS")
  const [calcAmount, setCalcAmount] = useState<string>("100000")
  const [fromCurrency, setFromCurrency] = useState<string>("TZS")

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Calculate conversions based on input
  const numericInput = parseFloat(calcAmount.replace(/,/g, "")) || 0
  const fromRate = CURRENCIES.find((c) => c.code === fromCurrency)?.rateAgainstTZS || 1
  const tzsEquivalent = numericInput * fromRate

  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals > 0 ? 0 : 0,
    }).format(num)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-navy/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-navy/10 overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="bg-navy px-5 sm:px-6 py-4 flex items-center justify-between text-white border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal/20 text-teal flex items-center justify-center font-black text-lg border border-teal/30">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  Currency & Payments
                  <span className="text-[10px] font-bold bg-teal text-navy px-2 py-0.5 rounded-full uppercase tracking-wider">
                    TZS Primary
                  </span>
                </h3>
                <p className="text-xs text-white/70">
                  Store prices, live conversion rates & accepted Tanzania payments
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
            
            {/* Store Currency Notice */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
              <Info className="w-5 h-5 text-navy shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 leading-relaxed">
                <strong className="text-navy font-bold block mb-0.5">
                  Quardcube Official Billing Currency
                </strong>
                All product listings and checkouts on Quardcube are billed in{" "}
                <span className="font-bold text-navy">Tanzanian Shillings (TZS)</span>.
                Foreign exchange calculations shown below are estimates based on standard commercial bank rates.
              </div>
            </div>

            {/* Quick Currency Converter */}
            <div className="rounded-2xl border border-navy/15 p-4 sm:p-5 bg-gradient-to-br from-white to-slate-50 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-navy flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-teal" />
                  Live Price & Currency Converter
                </h4>
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-teal" /> Indicative Rates
                </span>
              </div>

              {/* Converter Input Row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 mb-4">
                <div className="sm:col-span-8 relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Amount to calculate
                  </label>
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(e.target.value)}
                    placeholder="Enter amount..."
                    className="w-full h-11 px-3.5 text-sm font-bold text-navy bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal focus:border-teal"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    From
                  </label>
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    className="w-full h-11 px-3 text-xs sm:text-sm font-bold text-navy bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal focus:border-teal"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Converted Values Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {CURRENCIES.map((curr) => {
                  const converted =
                    curr.code === "TZS"
                      ? tzsEquivalent
                      : tzsEquivalent / curr.rateAgainstTZS
                  const isSelected = selectedCurrency === curr.code

                  return (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => setSelectedCurrency(curr.code)}
                      className={`text-left p-2.5 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-navy text-white border-navy shadow-md ring-2 ring-teal"
                          : "bg-white text-navy border-slate-200 hover:border-teal hover:bg-teal/5"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold flex items-center gap-1">
                          <span>{curr.flag}</span> {curr.code}
                        </span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-teal" />}
                      </div>
                      <div
                        className={`text-xs font-black truncate ${
                          isSelected ? "text-teal" : "text-navy"
                        }`}
                      >
                        {curr.symbol} {formatNumber(converted, curr.code === "TZS" ? 0 : 2)}
                      </div>
                      <div
                        className={`text-[9px] truncate ${
                          isSelected ? "text-white/60" : "text-slate-400"
                        }`}
                      >
                        1 {curr.code} = {formatNumber(curr.rateAgainstTZS, 0)} TZS
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Payment Methods Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-navy flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-brand-red" />
                  Accepted Payment Methods in Tanzania
                </h4>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Secure Checkout
                </div>
              </div>

              <div className="space-y-3">
                {PAYMENT_METHODS.map((cat) => {
                  const Icon = cat.icon
                  return (
                    <div
                      key={cat.category}
                      className="p-3 sm:p-4 rounded-xl border border-slate-200 bg-slate-50/50"
                    >
                      <div className="flex items-center gap-2 mb-2 text-xs font-bold text-navy">
                        <Icon className="w-4 h-4 text-teal" />
                        <span>{cat.category}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {cat.items.map((item) => (
                          <div
                            key={item.name}
                            className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-extrabold text-xs text-navy">
                                {item.name}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${item.color}`}
                              >
                                {item.badge}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {item.provider}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Delivery & Security Assurance */}
            <div className="p-3.5 rounded-xl bg-teal/10 border border-teal/30 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2 text-navy font-semibold">
                <CheckCircle2 className="w-4 h-4 text-teal shrink-0" />
                <span>Pay on delivery available within Dar es Salaam & Arusha</span>
              </div>
              <span className="text-[11px] text-navy/70">
                Official Receipt / Tax Invoice provided with every order
              </span>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="bg-slate-100 px-5 sm:px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-500">
              Active currency view: <strong className="text-navy">{selectedCurrency}</strong>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy/90 transition-colors shadow-xs"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

