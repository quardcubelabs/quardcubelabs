"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Cctv,
  ExternalLink,
  Shield,
  ShieldCheck,
  Video,
  HardDrive,
  Activity,
  ArrowUpRight,
  Server,
  Wifi,
  Eye,
  Lock,
  Radio,
  Sliders,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"

const HIK_PARTNER_URL = "https://cloudsso.hikvision.com/login?service=https://ieu.hik-partner.com%2F%23%2FticketJump%2Flogin&plateFormType=9&typeList=4,6,1,2,10,8,7&showAutoLogin=true&countryEditable=false&country=TZ&locale=en&regUrl=https://ieu.hik-partner.com%2F%23%2FRegister"

export default function AdminCctvPage() {
  const { isDark } = useAdminTheme()
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handleOpenPortal = () => {
    setIsRedirecting(true)
    window.open(HIK_PARTNER_URL, "_blank", "noopener,noreferrer")
    setTimeout(() => setIsRedirecting(false), 2000)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl p-6 sm:p-8 border shadow-xl transition-all",
        isDark 
          ? "bg-gradient-to-br from-slate-900 via-[#0d1624] to-slate-900 border-teal-500/20 text-white" 
          : "bg-gradient-to-br from-navy via-[#122844] to-navy border-teal/30 text-white"
      )}>
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-xl bg-teal/20 text-teal border border-teal/40 inline-flex items-center justify-center">
                <Cctv className="h-6 w-6 stroke-[2.2]" />
              </span>
              <Badge className="bg-teal text-navy font-black tracking-wide uppercase px-2.5 py-0.5">
                Hik-Partner Pro
              </Badge>
              <span className="flex items-center gap-1.5 text-xs text-teal-300 font-semibold bg-white/10 px-2.5 py-0.5 rounded-full border border-teal/20">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Cloud Gateway
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              CCTV Surveillance & Security Portal
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-medium">
              Manage your connected CCTV security devices, NVRs, live surveillance feeds, and camera health through the official Hik-Partner Pro portal.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              onClick={handleOpenPortal}
              className="bg-teal hover:bg-teal-400 text-navy font-black text-sm px-6 py-5 rounded-xl shadow-lg shadow-teal/25 border border-teal-300 flex items-center justify-center gap-2 group transition-all"
            >
              <span>Launch CCTV Portal</span>
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={cn(
          "border shadow-sm transition-all",
          isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Portal Status
            </CardTitle>
            <Activity className="h-4 w-4 text-teal" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-500">Operational</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Hik-Partner cloud connected
            </p>
          </CardContent>
        </Card>

        <Card className={cn(
          "border shadow-sm transition-all",
          isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Video Feeds
            </CardTitle>
            <Video className="h-4 w-4 text-teal" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black">Full HD Streams</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Multi-channel live viewing
            </p>
          </CardContent>
        </Card>

        <Card className={cn(
          "border shadow-sm transition-all",
          isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Cloud Storage
            </CardTitle>
            <HardDrive className="h-4 w-4 text-teal" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black">NVR & Cloud</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              24/7 continuous recording
            </p>
          </CardContent>
        </Card>

        <Card className={cn(
          "border shadow-sm transition-all",
          isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Security Protocol
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-teal" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black">Encrypted</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              End-to-end stream protection
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Hub Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Portal Launcher Card */}
        <Card className={cn(
          "lg:col-span-2 border shadow-sm",
          isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
        )}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black">Hik-Partner Pro Management Hub</CardTitle>
                <CardDescription>
                  Access device configurations, playback footage, and security alerts.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-teal border-teal/30">
                Official Gateway
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={cn(
              "rounded-xl p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
              isDark ? "bg-slate-800/40 border-slate-700/60" : "bg-slate-50 border-slate-200"
            )}>
              <div className="space-y-1">
                <div className="font-bold text-sm flex items-center gap-2">
                  <Server className="h-4 w-4 text-teal" />
                  Direct URL
                </div>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {HIK_PARTNER_URL}
                </p>
              </div>
              <Button
                asChild
                className="bg-teal hover:bg-teal-400 text-navy font-bold text-xs shrink-0"
              >
                <a
                  href={HIK_PARTNER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5"
                >
                  <span>Open in New Tab</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={cn(
                "p-4 rounded-xl border space-y-2",
                isDark ? "bg-slate-800/20 border-slate-800" : "bg-white border-slate-100 shadow-sm"
              )}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Eye className="h-4 w-4 text-teal" />
                  <span>Real-Time Monitoring</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  View multiple camera channels simultaneously with PTZ controls and digital zoom.
                </p>
              </div>

              <div className={cn(
                "p-4 rounded-xl border space-y-2",
                isDark ? "bg-slate-800/20 border-slate-800" : "bg-white border-slate-100 shadow-sm"
              )}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Radio className="h-4 w-4 text-teal" />
                  <span>Alarm Notifications</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Receive motion detection triggers, perimeter breach warnings, and camera offline alerts.
                </p>
              </div>

              <div className={cn(
                "p-4 rounded-xl border space-y-2",
                isDark ? "bg-slate-800/20 border-slate-800" : "bg-white border-slate-100 shadow-sm"
              )}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Sliders className="h-4 w-4 text-teal" />
                  <span>Device Management</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Configure camera IP addresses, firmware upgrades, and recording schedules.
                </p>
              </div>

              <div className={cn(
                "p-4 rounded-xl border space-y-2",
                isDark ? "bg-slate-800/20 border-slate-800" : "bg-white border-slate-100 shadow-sm"
              )}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Lock className="h-4 w-4 text-teal" />
                  <span>Access Control</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Manage user roles, camera channel permissions, and audit logs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right col: Help & Instructions */}
        <Card className={cn(
          "border shadow-sm",
          isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
        )}>
          <CardHeader>
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <Shield className="h-5 w-5 text-teal" />
              Quick Guide
            </CardTitle>
            <CardDescription>
              Hik-Partner Pro access tips
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-2">
              <p className="font-bold text-sm">1. Sign In</p>
              <p className="text-muted-foreground">
                Use your registered QuardCube installer or admin credentials on the Hik-Partner portal.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-sm">2. Account Dashboard</p>
              <p className="text-muted-foreground">
                Navigate to "My Account &gt; Dashboard" to inspect your customer sites, linked NVR devices, and active cameras.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-sm">3. Direct Sidebar Shortcut</p>
              <p className="text-muted-foreground">
                You can also click the <strong>CCTV</strong> item in the sidebar menu anytime to open the portal instantly.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                asChild
                variant="outline"
                className="w-full text-xs font-bold border-teal/40 hover:bg-teal/10"
              >
                <a
                  href={HIK_PARTNER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <span>Launch Hik-Partner Pro</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
