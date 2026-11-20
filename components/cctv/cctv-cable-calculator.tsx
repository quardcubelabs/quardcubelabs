"use client"

import { useState, useMemo } from "react"
import { 
  Cable, 
  Plus, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Box, 
  RotateCcw,
  Sliders,
  Check
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
import { calculateCabling } from "@/lib/cctv-utils"

interface CameraRunRow {
  id: string
  location: string
  distanceMeters: number
}

interface CctvCableCalculatorProps {
  onApplyToProject?: (cableBoxes: number, totalMeters: number) => void
}

export default function CctvCableCalculator({ onApplyToProject }: CctvCableCalculatorProps) {
  const { isDark } = useAdminTheme()

  const [cameraRuns, setCameraRuns] = useState<CameraRunRow[]>([
    { id: "1", location: "Main Gate Entry", distanceMeters: 45 },
    { id: "2", location: "Reception Desk", distanceMeters: 25 },
    { id: "3", location: "Parking Lot Perimeter", distanceMeters: 60 },
    { id: "4", location: "Cashier Counter", distanceMeters: 20 },
    { id: "5", location: "Warehouse Storage A", distanceMeters: 55 },
    { id: "6", location: "Warehouse Storage B", distanceMeters: 65 },
    { id: "7", location: "Rear Loading Dock", distanceMeters: 40 },
    { id: "8", location: "Server Rack / Office", distanceMeters: 15 }
  ])

  const [cableType, setCableType] = useState<'CAT6 Indoor' | 'CAT6 Outdoor (UV/Shielded)' | 'RG59 Coaxial' | 'RG59 + Power'>('CAT6 Indoor')
  const [wastagePercentage, setWastagePercentage] = useState<number>(10)
  const [slackMeters, setSlackMeters] = useState<number>(3)
  const [boxLengthMeters, setBoxLengthMeters] = useState<number>(305)

  // Live calculation
  const result = useMemo(() => {
    return calculateCabling({
      cameraRuns: cameraRuns.map(r => ({ location: r.location, distanceMeters: Number(r.distanceMeters) || 0 })),
      cableType,
      wastagePercentage: Number(wastagePercentage) || 10,
      spareSlackMetersPerRun: Number(slackMeters) || 3,
      boxLengthMeters: Number(boxLengthMeters) || 305
    })
  }, [cameraRuns, cableType, wastagePercentage, slackMeters, boxLengthMeters])

  const handleAddRun = () => {
    setCameraRuns([
      ...cameraRuns,
      {
        id: crypto.randomUUID(),
        location: `Camera Run #${cameraRuns.length + 1}`,
        distanceMeters: 30
      }
    ])
  }

  const handleUpdateRun = (id: string, field: 'location' | 'distanceMeters', value: any) => {
    setCameraRuns(cameraRuns.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const handleRemoveRun = (id: string) => {
    if (cameraRuns.length <= 1) return
    setCameraRuns(cameraRuns.filter(r => r.id !== id))
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className={cn(
        "p-6 rounded-2xl sm:rounded-3xl border shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4",
        isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
      )}>
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-teal text-navy font-black text-xs">CCTV Infrastructure Engineering</Badge>
            <span className={cn("text-xs font-mono font-bold", isDark ? "text-teal-300" : "text-navy/70")}>Wiring & Run Optimization</span>
          </div>
          <h2 className={cn("text-2xl font-black mt-1 flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
            <Cable className="h-6 w-6 text-blue-500" />
            CCTV Cable Distance & Box Calculator
          </h2>
          <p className={cn("text-xs sm:text-sm mt-0.5", isDark ? "text-slate-400" : "text-navy/70")}>
            Estimate individual camera point cable runs, conduit paths, bending wastage, and standard 305m (1000ft) drum boxes.
          </p>
        </div>

        {onApplyToProject && (
          <Button
            onClick={() => onApplyToProject(result.boxesRequired, result.finalRequiredLengthMeters)}
            className="bg-teal hover:bg-teal/90 text-navy font-bold text-xs px-5 py-5 rounded-xl shadow-md"
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Apply {result.boxesRequired} × 305m Boxes to Project
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Camera Runs Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl border shadow-sm overflow-hidden",
            isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
          )}>
            <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between border-b border-navy/10 dark:border-slate-800">
              <div>
                <CardTitle className={cn("text-base font-black flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                  <Layers className="h-4 w-4 text-blue-500" />
                  Camera Run Distances (From NVR / Switch)
                </CardTitle>
                <CardDescription className={cn("text-xs mt-0.5", isDark ? "text-slate-400" : "text-navy/70")}>
                  Measured cable path including ceiling routing & conduit rises
                </CardDescription>
              </div>

              <Button
                onClick={handleAddRun}
                size="sm"
                className="bg-teal hover:bg-teal/90 text-navy font-bold text-xs h-8 rounded-xl"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                + Add Camera Run
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={cn(
                      "border-b font-bold uppercase text-[10px]",
                      isDark ? "bg-[#070d24] text-slate-300 border-slate-800" : "bg-teal/10 text-navy border-navy/10"
                    )}>
                      <th className="py-2.5 px-3 text-left">Camera Location / Point</th>
                      <th className="py-2.5 px-3 text-right w-36">Run Distance (Meters)</th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy/10 dark:divide-slate-800">
                    {cameraRuns.map((run, idx) => (
                      <tr key={run.id} className="hover:bg-navy/5 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3">
                          <Input
                            value={run.location}
                            onChange={e => handleUpdateRun(run.id, "location", e.target.value)}
                            className={cn(
                              "h-7 text-xs font-bold rounded-lg",
                              isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-2 border-navy/20 text-navy"
                            )}
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Input
                              type="number"
                              min={1}
                              max={150}
                              value={run.distanceMeters}
                              onChange={e => handleUpdateRun(run.id, "distanceMeters", parseFloat(e.target.value) || 0)}
                              className={cn(
                                "h-7 w-20 text-right text-xs font-mono font-bold p-1 rounded-lg",
                                isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-2 border-navy/20 text-navy"
                              )}
                            />
                            <span className={cn("font-semibold text-xs", isDark ? "text-slate-400" : "text-navy/70")}>m</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            onClick={() => handleRemoveRun(run.id)}
                            className="text-navy/50 dark:text-slate-500 hover:text-red-500 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Settings */}
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl border shadow-sm p-5",
            isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
          )}>
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={cn("font-bold", isDark ? "text-slate-300" : "text-navy")}>Cable Media Type</Label>
                  <Select value={cableType} onValueChange={(val: any) => setCableType(val)}>
                    <SelectTrigger className={cn(
                      "text-xs font-semibold rounded-xl",
                      isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-2 border-navy/20 text-navy"
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CAT6 Indoor">CAT6 UTP Solid Pure Copper (Indoor)</SelectItem>
                      <SelectItem value="CAT6 Outdoor (UV/Shielded)">CAT6 STP Double-Jacket UV Outdoor</SelectItem>
                      <SelectItem value="RG59 Coaxial">RG59 Coaxial (Analog HD)</SelectItem>
                      <SelectItem value="RG59 + Power">RG59 Siamese (Coax + 2-Core Power)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className={cn("font-bold", isDark ? "text-slate-300" : "text-navy")}>Standard Box Packaging</Label>
                  <Select value={boxLengthMeters.toString()} onValueChange={val => setBoxLengthMeters(parseInt(val))}>
                    <SelectTrigger className={cn(
                      "text-xs font-semibold rounded-xl",
                      isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-2 border-navy/20 text-navy"
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="305">305m Drum / Pull-Box (1000 ft Standard)</SelectItem>
                      <SelectItem value="100">100m Roll</SelectItem>
                      <SelectItem value="500">500m Large Reel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className={cn("space-y-2 pt-2 border-t", isDark ? "border-slate-800" : "border-navy/10")}>
                <div className="flex items-center justify-between">
                  <Label className={cn("font-bold", isDark ? "text-slate-300" : "text-navy")}>Slack Allowance per Camera Run:</Label>
                  <span className="font-mono font-bold text-teal">{slackMeters}m per end</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("text-[10px]", isDark ? "text-slate-400" : "text-navy/60")}>1m</span>
                  <Slider
                    value={[slackMeters]}
                    min={1}
                    max={6}
                    step={1}
                    onValueChange={vals => setSlackMeters(vals[0])}
                    className="flex-1"
                  />
                  <span className={cn("text-[10px]", isDark ? "text-slate-400" : "text-navy/60")}>6m</span>
                </div>
              </div>

              <div className={cn("space-y-2 pt-2 border-t", isDark ? "border-slate-800" : "border-navy/10")}>
                <div className="flex items-center justify-between">
                  <Label className={cn("font-bold", isDark ? "text-slate-300" : "text-navy")}>Bending & Corner Wastage Margin (%):</Label>
                  <span className="font-mono font-bold text-teal">{wastagePercentage}% Wastage</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("text-[10px]", isDark ? "text-slate-400" : "text-navy/60")}>5%</span>
                  <Slider
                    value={[wastagePercentage]}
                    min={5}
                    max={25}
                    step={5}
                    onValueChange={vals => setWastagePercentage(vals[0])}
                    className="flex-1"
                  />
                  <span className={cn("text-[10px]", isDark ? "text-slate-400" : "text-navy/60")}>25%</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Cable Sizing Output */}
        <div className="space-y-6">
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl border shadow-md relative overflow-hidden",
            isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
          )}>
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-teal to-cyan-400" />

            <CardHeader className="pb-2">
              <CardTitle className={cn("text-base font-black flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                <Box className="h-5 w-5 text-teal" />
                Required Packaging
              </CardTitle>
              <CardDescription className={cn("text-xs", isDark ? "text-slate-400" : "text-navy/70")}>
                Cable drums and spool breakdown
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              <div className={cn(
                "p-5 rounded-2xl border text-center space-y-2",
                isDark ? "bg-[#070d24] border-teal/40 text-white" : "bg-teal/15 border-2 border-teal/40 text-navy"
              )}>
                <span className={cn("text-xs font-black uppercase tracking-wider", isDark ? "text-teal-300" : "text-navy/80")}>
                  Order Requirement
                </span>
                <div className="text-4xl font-black text-teal font-mono">
                  {result.boxesRequired} × Box
                </div>
                <div className={cn("text-xs font-bold", isDark ? "text-white" : "text-navy")}>
                  {result.boxesRequired} × {boxLengthMeters}m {cableType}
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <span className={cn(isDark ? "text-slate-400" : "text-navy/70")}>Total Measured Runs:</span>
                  <strong className="font-mono">{result.totalMeasuredLengthMeters} meters</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className={cn(isDark ? "text-slate-400" : "text-navy/70")}>Slack & Termination Buffer:</span>
                  <strong className="font-mono">{result.totalSlackLengthMeters} meters</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className={cn(isDark ? "text-slate-400" : "text-navy/70")}>Wastage Margin ({wastagePercentage}%):</span>
                  <strong className="font-mono">{result.totalWastageMeters} meters</strong>
                </div>

                <div className={cn("flex items-center justify-between border-t pt-2", isDark ? "border-slate-800" : "border-navy/10")}>
                  <span className={cn("font-bold", isDark ? "text-slate-300" : "text-navy")}>Total Required Length:</span>
                  <strong className="font-mono text-teal font-bold">{result.finalRequiredLengthMeters} meters</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className={cn(isDark ? "text-slate-400" : "text-navy/70")}>Spare Remaining in Last Box:</span>
                  <strong className="font-mono text-emerald-500 font-bold">{result.leftoverMeters} meters</strong>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
