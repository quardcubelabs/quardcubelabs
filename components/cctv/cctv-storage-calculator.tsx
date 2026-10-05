"use client"

import { useState, useMemo } from "react"
import { 
  HardDrive, 
  Layers, 
  Sparkles, 
  Info, 
  CheckCircle2, 
  ShieldCheck, 
  RotateCcw,
  Zap,
  Sliders,
  Database
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import { calculateStorage } from "@/lib/cctv-utils"
import { StorageCalculationParams } from "@/types/cctv"

interface CctvStorageCalculatorProps {
  onApplyToProject?: (recommendedTb: number) => void
}

export default function CctvStorageCalculator({ onApplyToProject }: CctvStorageCalculatorProps) {
  const { isDark } = useAdminTheme()

  // State
  const [cameraCount, setCameraCount] = useState<number>(8)
  const [resolution, setResolution] = useState<string>("4MP (2K)")
  const [fps, setFps] = useState<number>(25)
  const [codec, setCodec] = useState<'H.265+' | 'H.265' | 'H.264+' | 'H.264'>('H.265+')
  const [recordingHoursPerDay, setRecordingHoursPerDay] = useState<number>(24)
  const [retentionDays, setRetentionDays] = useState<number>(30)
  const [motionActivityPercentage, setMotionActivityPercentage] = useState<number>(100)
  const [safetyMarginPercentage, setSafetyMarginPercentage] = useState<number>(15)

  // Live calculation
  const result = useMemo(() => {
    return calculateStorage({
      cameraCount: Number(cameraCount) || 1,
      resolution,
      fps: Number(fps) || 25,
      codec,
      recordingHoursPerDay: Number(recordingHoursPerDay) || 24,
      retentionDays: Number(retentionDays) || 30,
      motionActivityPercentage: Number(motionActivityPercentage) || 100,
      safetyMarginPercentage: Number(safetyMarginPercentage) || 15
    })
  }, [cameraCount, resolution, fps, codec, recordingHoursPerDay, retentionDays, motionActivityPercentage, safetyMarginPercentage])

  // Comparison with H.264
  const h264Comparison = useMemo(() => {
    return calculateStorage({
      cameraCount: Number(cameraCount) || 1,
      resolution,
      fps: Number(fps) || 25,
      codec: 'H.264',
      recordingHoursPerDay: Number(recordingHoursPerDay) || 24,
      retentionDays: Number(retentionDays) || 30,
      motionActivityPercentage: Number(motionActivityPercentage) || 100,
      safetyMarginPercentage: Number(safetyMarginPercentage) || 15
    })
  }, [cameraCount, resolution, fps, recordingHoursPerDay, retentionDays, motionActivityPercentage, safetyMarginPercentage])

  const storageSavedGb = Math.max(0, h264Comparison.storageWithMarginGb - result.storageWithMarginGb)
  const storageSavedPercent = Math.round((storageSavedGb / (h264Comparison.storageWithMarginGb || 1)) * 100)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className={cn(
        "p-6 rounded-2xl sm:rounded-3xl border shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4",
        isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
      )}>
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-teal text-navy font-black text-xs">CCTV Engineering Suite</Badge>
            <span className={cn("text-xs font-mono font-bold", isDark ? "text-teal-300" : "text-navy/70")}>Surveillance Bandwidth & Capacity</span>
          </div>
          <h2 className={cn("text-2xl font-black mt-1 flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
            <HardDrive className="h-6 w-6 text-teal" />
            CCTV Storage & Retention Calculator
          </h2>
          <p className={cn("text-xs sm:text-sm mt-0.5", isDark ? "text-slate-400" : "text-navy/70")}>
            Calculate accurate hard drive storage requirements based on camera count, resolution, smart H.265+ codec, and retention days.
          </p>
        </div>

        {onApplyToProject && (
          <Button
            onClick={() => onApplyToProject(result.recommendedStorageTb)}
            className="bg-teal hover:bg-teal/90 text-navy font-bold text-xs px-5 py-5 rounded-xl shadow-md"
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Apply {result.recommendedStorageTb}TB to Project
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Parameters */}
        <div className="lg:col-span-2 space-y-6">
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl border shadow-sm",
            isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
          )}>
            <CardHeader className="pb-3 border-b border-navy/10 dark:border-slate-800">
              <CardTitle className={cn("text-base font-black flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                <Sliders className="h-4 w-4 text-teal" />
                Video Stream & Camera Parameters
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-6 text-xs">
              {/* Camera Count & Resolution */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className={cn("font-bold", isDark ? "text-slate-300" : "text-navy")}>Number of Cameras</Label>
                    <span className="font-mono font-black text-sm text-teal">{cameraCount} Cameras</span>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    max={128}
                    value={cameraCount}
                    onChange={e => setCameraCount(parseInt(e.target.value) || 1)}
                    className={cn(
                      "font-bold text-sm rounded-xl",
                      isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-2 border-navy/20 text-navy"
                    )}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className={cn("font-bold", isDark ? "text-slate-300" : "text-navy")}>Camera Resolution</Label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger className={cn(
                      "text-xs font-semibold rounded-xl",
                      isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-2 border-navy/20 text-navy"
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2MP (1080p)">2MP Full HD (1920 × 1080)</SelectItem>
                      <SelectItem value="4MP (2K)">4MP Ultra HD 2K (2560 × 1440)</SelectItem>
                      <SelectItem value="5MP">5MP High Resolution (2592 × 1944)</SelectItem>
                      <SelectItem value="8MP (4K)">8MP 4K Ultra HD (3840 × 2160)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Compression Codec & Frame Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={cn("font-bold", isDark ? "text-slate-300" : "text-navy")}>Video Compression Codec</Label>
                  <Select value={codec} onValueChange={(val: any) => setCodec(val)}>
                    <SelectTrigger className={cn(
                      "text-xs font-semibold rounded-xl",
                      isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-2 border-navy/20 text-navy"
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="H.265+">H.265+ Smart Codec (Recommended - 65% Savings)</SelectItem>
                      <SelectItem value="H.265">H.265 High Efficiency (50% Savings)</SelectItem>
                      <SelectItem value="H.264+">H.264+ Enhanced (30% Savings)</SelectItem>
                      <SelectItem value="H.264">H.264 Standard Baseline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className={cn("font-bold", isDark ? "text-slate-300" : "text-navy")}>Frame Rate (FPS)</Label>
                  <Select value={fps.toString()} onValueChange={val => setFps(parseInt(val))}>
                    <SelectTrigger className={cn(
                      "text-xs font-semibold rounded-xl",
                      isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-2 border-navy/20 text-navy"
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 FPS (Standard Surveillance)</SelectItem>
                      <SelectItem value="20">20 FPS (Fluid Motion)</SelectItem>
                      <SelectItem value="25">25 FPS (Real-Time PAL Standard)</SelectItem>
                      <SelectItem value="30">30 FPS (Full Real-Time NTSC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Retention Days Slider */}
              <div className={cn("space-y-2 pt-2 border-t", isDark ? "border-slate-800" : "border-navy/10")}>
                <div className="flex items-center justify-between">
                  <Label className={cn("font-bold", isDark ? "text-slate-300" : "text-navy")}>Required Retention Period (Days):</Label>
                  <span className="font-mono font-black text-sm text-teal">{retentionDays} Days</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("text-[10px]", isDark ? "text-slate-400" : "text-navy/60")}>7 Days</span>
                  <Slider
                    value={[retentionDays]}
                    min={7}
                    max={90}
                    step={1}
                    onValueChange={vals => setRetentionDays(vals[0])}
                    className="flex-1"
                  />
                  <span className={cn("text-[10px]", isDark ? "text-slate-400" : "text-navy/60")}>90 Days</span>
                </div>
              </div>

              {/* Recording Mode & Motion Slider */}
              <div className={cn("space-y-2 pt-2 border-t", isDark ? "border-slate-800" : "border-navy/10")}>
                <div className="flex items-center justify-between">
                  <Label className={cn("font-bold", isDark ? "text-slate-300" : "text-navy")}>Recording Mode & Motion %</Label>
                  <span className="font-mono font-black text-sm text-teal">
                    {motionActivityPercentage === 100 ? "24/7 Continuous (100%)" : `${motionActivityPercentage}% Smart Motion`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("text-[10px]", isDark ? "text-slate-400" : "text-navy/60")}>10% Light Motion</span>
                  <Slider
                    value={[motionActivityPercentage]}
                    min={10}
                    max={100}
                    step={5}
                    onValueChange={vals => setMotionActivityPercentage(vals[0])}
                    className="flex-1"
                  />
                  <span className={cn("text-[10px]", isDark ? "text-slate-400" : "text-navy/60")}>100% 24/7</span>
                </div>
              </div>

              {/* Safety Margin */}
              <div className={cn("space-y-2 pt-2 border-t", isDark ? "border-slate-800" : "border-navy/10")}>
                <div className="flex items-center justify-between">
                  <Label className={cn("font-bold", isDark ? "text-slate-300" : "text-navy")}>Safety Storage Buffer Margin</Label>
                  <span className={cn("font-mono font-black text-sm", isDark ? "text-white" : "text-navy")}>{safetyMarginPercentage}% Buffer</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("text-[10px]", isDark ? "text-slate-400" : "text-navy/60")}>5%</span>
                  <Slider
                    value={[safetyMarginPercentage]}
                    min={5}
                    max={30}
                    step={5}
                    onValueChange={vals => setSafetyMarginPercentage(vals[0])}
                    className="flex-1"
                  />
                  <span className={cn("text-[10px]", isDark ? "text-slate-400" : "text-navy/60")}>30%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Calculated HDD Results Card */}
        <div className="space-y-6">
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl border shadow-md relative overflow-hidden",
            isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
          )}>
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal via-cyan-400 to-emerald-400" />

            <CardHeader className="pb-2">
              <CardTitle className={cn("text-base font-black flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                <Database className="h-5 w-5 text-teal" />
                Recommended Storage
              </CardTitle>
              <CardDescription className={cn("text-xs", isDark ? "text-slate-400" : "text-navy/70")}>
                Surveillance-grade HDD sizing
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              {/* Highlight Recommended HDD Size */}
              <div className={cn(
                "p-5 rounded-2xl border text-center space-y-2",
                isDark ? "bg-[#070d24] border-teal/40 text-white" : "bg-teal/15 border-2 border-teal/40 text-navy"
              )}>
                <span className={cn("text-xs font-black uppercase tracking-wider", isDark ? "text-teal-300" : "text-navy/80")}>
                  HDD Capacity Required
                </span>
                <div className="text-4xl font-black text-teal font-mono">
                  {result.recommendedStorageTb} TB
                </div>
                <div className={cn("text-xs font-bold", isDark ? "text-white" : "text-navy")}>
                  {result.recommendedHddConfiguration.description}
                </div>
              </div>

              {/* Detailed Metrics Breakdown */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <span className={cn(isDark ? "text-slate-400" : "text-navy/70")}>Bitrate per Camera:</span>
                  <strong className="font-mono">{result.bitratePerCameraMbps} Mbps</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className={cn(isDark ? "text-slate-400" : "text-navy/70")}>Daily Storage / Camera:</span>
                  <strong className="font-mono">{result.dailyStorageGbPerCamera} GB / day</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className={cn(isDark ? "text-slate-400" : "text-navy/70")}>Total Daily Footage:</span>
                  <strong className="font-mono">{result.totalDailyStorageGb} GB / day</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className={cn(isDark ? "text-slate-400" : "text-navy/70")}>Raw Storage for {retentionDays} Days:</span>
                  <strong className="font-mono">{result.rawStorageRequiredGb} GB</strong>
                </div>

                <div className={cn("flex items-center justify-between border-t pt-2", isDark ? "border-slate-800" : "border-navy/10")}>
                  <span className={cn("font-bold", isDark ? "text-slate-300" : "text-navy")}>With {safetyMarginPercentage}% Buffer:</span>
                  <strong className="font-mono text-teal font-bold">{result.storageWithMarginGb} GB</strong>
                </div>
              </div>

              {/* Codec Savings Highlight Box */}
              {codec !== 'H.264' && (
                <div className={cn(
                  "p-3.5 rounded-xl border flex items-start gap-2.5 mt-2",
                  isDark ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300" : "bg-emerald-50 border-2 border-emerald-200 text-emerald-900"
                )}>
                  <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs">{codec} Codec Efficiency</div>
                    <p className="text-[11px] opacity-90">
                      Saves approximately <strong>{storageSavedPercent}%</strong> ({Math.round(storageSavedGb / 1024)}TB) of disk space compared to standard H.264.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
