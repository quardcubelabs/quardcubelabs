"use client"

import { useState } from "react"
import { 
  Sparkles, 
  CheckCircle2, 
  Package, 
  Camera, 
  HardDrive, 
  Cable, 
  Wrench, 
  Layers, 
  ArrowRight,
  ShieldCheck,
  Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import { getQuickPackages } from "@/lib/cctv-utils"
import { QuickCctvPackage } from "@/types/cctv"

interface CctvPackagesViewProps {
  onSelectPackage: (pkg: QuickCctvPackage) => void
}

export default function CctvPackagesView({ onSelectPackage }: CctvPackagesViewProps) {
  const { isDark } = useAdminTheme()
  const packages = getQuickPackages()

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      maximumFractionDigits: 0
    }).format(val).replace('TZS', 'TZS ')
  }

  const getItemIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'cameras':
        return Camera
      case 'recording':
        return Layers
      case 'storage':
        return HardDrive
      case 'cabling':
        return Cable
      case 'services':
        return Wrench
      case 'networking':
        return Zap
      case 'accessories':
        return Package
      default:
        return CheckCircle2
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className={cn(
        "p-6 rounded-2xl sm:rounded-3xl border shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4",
        isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
      )}>
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-400 text-navy font-black text-xs">Turnkey Templates</Badge>
            <span className={cn("text-xs font-mono font-bold", isDark ? "text-teal-300" : "text-navy")}>Editable Standard Architecture</span>
          </div>
          <h2 className={cn("text-2xl font-black mt-1 flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
            <Sparkles className="h-6 w-6 text-amber-400" />
            Quick CCTV Packages & Templates
          </h2>
          <p className={cn("text-xs sm:text-sm mt-0.5 font-medium", isDark ? "text-slate-400" : "text-navy/80")}>
            Pre-configured complete CCTV bundles for residential, commercial and enterprise clients. Fully customizable upon selection.
          </p>
        </div>
      </div>

      {/* Package Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map(pkg => (
          <Card key={pkg.id} className={cn(
            "rounded-2xl sm:rounded-3xl border shadow-md flex flex-col justify-between relative overflow-hidden transition-all hover:-translate-y-0.5",
            isDark 
              ? "bg-[#0a1033] border-none text-white shadow-md hover:bg-[#0c1438]" 
              : "bg-white border-2 border-navy/20 hover:border-navy hover:shadow-md"
          )}>
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <Badge className={cn("font-black text-[10px]", isDark ? "bg-teal text-navy" : "bg-teal text-navy")}>{pkg.badgeText}</Badge>
                <span className={cn("text-xs font-mono font-bold", isDark ? "text-teal-400" : "text-navy")}>{pkg.code}</span>
              </div>

              <div>
                <h3 className={cn("font-black text-lg", isDark ? "text-white" : "text-navy")}>{pkg.name}</h3>
                <p className={cn("text-xs font-bold mt-0.5", isDark ? "text-teal-400" : "text-navy")}>{pkg.targetSegment}</p>
                <p className={cn("text-xs mt-2 font-medium", isDark ? "text-slate-400" : "text-navy/80")}>{pkg.description}</p>
              </div>

              {/* Price Tag */}
              <div className={cn(
                "p-3.5 rounded-xl border text-center space-y-0.5",
                isDark ? "bg-[#070d24] border-teal/40 text-white" : "bg-teal/15 border-2 border-navy/20 text-navy"
              )}>
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", isDark ? "text-teal-300" : "text-navy")}>Estimated Solution Cost</span>
                <div className={cn("text-xl sm:text-2xl font-black font-mono tracking-tight", isDark ? "text-teal-400" : "text-navy")}>
                  {formatCurrency(pkg.estimatedPriceTzs)}
                </div>
              </div>

              {/* Included Items Checklist */}
              <div className={cn("space-y-2.5 pt-2 border-t text-xs", isDark ? "border-slate-800" : "border-navy/10")}>
                <span className={cn("font-black text-[11px] uppercase tracking-wider block", isDark ? "text-teal-400" : "text-navy")}>Included In Package:</span>
                <div className="space-y-2.5">
                  {pkg.items.map((item, idx) => {
                    const ItemIcon = getItemIcon(item.category)
                    return (
                      <div key={idx} className="flex items-start gap-2.5">
                        <div className={cn(
                          "w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-transform",
                          isDark 
                            ? "bg-navy border-teal/30 text-teal" 
                            : "bg-teal-100/80 border-navy/15 text-navy"
                        )}>
                          <ItemIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="text-xs min-w-0 flex-1">
                          <span className={cn("font-bold block leading-snug", isDark ? "text-white" : "text-navy")}>
                            {item.quantity}× {item.name}
                          </span>
                          {item.description && (
                            <p className={cn("text-[10px] mt-0.5 font-medium", isDark ? "text-slate-400" : "text-navy/70")}>
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className={cn(
              "p-4 border-t flex items-center justify-between",
              isDark ? "bg-[#070d24] border-slate-800" : "bg-slate-50 border-navy/10"
            )}>
              <span className={cn("text-xs font-bold", isDark ? "text-teal-400" : "text-navy")}>
                {pkg.cameraCount} Camera Points
              </span>

              <Button
                onClick={() => onSelectPackage(pkg)}
                className="bg-teal hover:bg-teal-400 text-navy font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
              >
                <span>Select & Customize</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
