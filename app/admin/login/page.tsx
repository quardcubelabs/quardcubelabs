"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Lock, Eye, EyeOff, KeyRound, ArrowLeft, Mail, Smartphone } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

function AdminLoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false)
  const [tempToken, setTempToken] = useState("")
  const [maskedEmail, setMaskedEmail] = useState("")
  const [maskedPhone, setMaskedPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [isVerifying2FA, setIsVerifying2FA] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const redirectTo = searchParams.get("redirectTo") || "/admin/dashboard"

  // If already logged in, automatically redirect to dashboard
  useEffect(() => {
    let isMounted = true
    fetch("/api/admin/auth/verify")
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.isAdmin) {
          window.location.href = redirectTo
        }
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [redirectTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const result = await res.json().catch(() => ({ success: false, error: "Network response error" }))

      if (!res.ok || !result.success) {
        const errorMsg = result.error || "Authentication failed. Please check your credentials."
        setError(errorMsg)
        toast({
          title: "Authentication Failed",
          description: errorMsg,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Check if 2FA is required by Security Settings
      if (result.requires2FA) {
        setRequires2FA(true)
        setTempToken(result.tempToken || "")
        setMaskedEmail(result.maskedEmail || "")
        setMaskedPhone(result.maskedPhone || "")
        setIsLoading(false)
        toast({
          title: "Two-Factor Verification Required",
          description: "A 6-digit verification code has been dispatched via SMS and Email.",
        })
        return
      }

      const staffName = 
        result.user?.staffMember?.full_name || 
        result.user?.full_name || 
        result.user?.name || 
        (result.user?.email ? result.user.email.split("@")[0] : null) || 
        "Staff Member"

      const staffRole = 
        result.user?.roleName || 
        (result.user?.role ? result.user.role.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "Staff")

      toast({
        title: `Welcome, ${staffName}!`,
        description: `Successfully authenticated as ${staffRole}. Loading portal...`,
      })

      // Immediate window navigation guarantees the browser sends the session cookie
      window.location.href = redirectTo
    } catch (err: any) {
      console.error("Login error:", err)
      const errorMsg = err?.message || "An unexpected error occurred during login."
      setError(errorMsg)
      toast({
        title: "Login Error",
        description: errorMsg,
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying2FA(true)
    setError("")

    try {
      const res = await fetch("/api/admin/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, otp }),
      })

      const result = await res.json().catch(() => ({ success: false, error: "Network response error" }))

      if (!res.ok || !result.success) {
        const errorMsg = result.error || "Invalid or expired verification code."
        setError(errorMsg)
        toast({
          title: "Verification Failed",
          description: errorMsg,
          variant: "destructive",
        })
        setIsVerifying2FA(false)
        return
      }

      const staffName = 
        result.user?.staffMember?.full_name || 
        result.user?.full_name || 
        result.user?.name || 
        (result.user?.email ? result.user.email.split("@")[0] : null) || 
        "Staff Member"

      const staffRole = 
        result.user?.roleName || 
        (result.user?.role ? result.user.role.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "Staff")

      toast({
        title: `Welcome, ${staffName}!`,
        description: `Two-Factor verification verified. Loading portal...`,
      })

      window.location.href = redirectTo
    } catch (err: any) {
      console.error("2FA error:", err)
      const errorMsg = err?.message || "An unexpected error occurred during 2FA verification."
      setError(errorMsg)
      toast({
        title: "Verification Error",
        description: errorMsg,
        variant: "destructive",
      })
      setIsVerifying2FA(false)
    }
  }

  if (requires2FA) {
    return (
      <Card className="w-full max-w-md relative z-10 border border-navy/20 bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl">
        <CardHeader className="text-center space-y-4 pt-8">
          <div className="flex justify-center">
            <div className="bg-navy p-3.5 rounded-2xl shadow-lg ring-2 ring-blue-500/40">
              <KeyRound className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-black tracking-tight text-navy">Two-Factor Authentication</CardTitle>
            <CardDescription className="text-navy/70 text-xs sm:text-sm mt-1">
              Enter the 6-digit verification code sent to your authorized contact channels.
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 sm:p-8 pt-0">
          <form onSubmit={handleVerify2FA} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="rounded-xl">
                <Lock className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-navy/10 rounded-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-navy/60">Dispatched To</span>
              <div className="flex flex-wrap items-center gap-2">
                {maskedPhone && (
                  <div className="flex items-center gap-1.5 text-xs text-navy/80 bg-white px-2.5 py-1 rounded-lg border border-navy/15 shadow-xs font-mono">
                    <Smartphone className="h-3.5 w-3.5 text-blue-600" />
                    <span>SMS: {maskedPhone}</span>
                  </div>
                )}
                {maskedEmail && (
                  <div className="flex items-center gap-1.5 text-xs text-navy/80 bg-white px-2.5 py-1 rounded-lg border border-navy/15 shadow-xs font-mono">
                    <Mail className="h-3.5 w-3.5 text-blue-600" />
                    <span>Email: {maskedEmail}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-xs font-bold uppercase tracking-wider text-navy/80">Security Code (6 Digits)</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
                className="bg-slate-50/80 border border-navy rounded-xl h-12 text-navy text-center font-mono text-2xl tracking-[0.35em] font-bold placeholder:tracking-normal placeholder:font-sans placeholder:text-sm focus:bg-white focus:border-navy focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={isVerifying2FA}
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-navy hover:bg-brand-red text-white font-bold h-11 rounded-xl shadow-lg transition-all duration-200 active:scale-98"
              disabled={isVerifying2FA || otp.length !== 6}
            >
              {isVerifying2FA ? "Verifying Code..." : "Verify & Sign In"}
            </Button>

            <button
              type="button"
              onClick={() => {
                setRequires2FA(false)
                setOtp("")
                setError("")
              }}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold text-navy/70 hover:text-navy py-2 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Admin Credentials</span>
            </button>
          </form>
          
          <div className="mt-4 pt-4 border-t border-navy/15 text-center">
            <p className="text-[11px] text-navy/60 font-medium">
              Powered by NextSMS Gateway & SMTP2GO Security Infrastructure
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md relative z-10 border border-navy/20 bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl">
      <CardHeader className="text-center space-y-4 pt-8">
        <div className="flex justify-center">
          <div className="bg-navy p-3.5 rounded-2xl shadow-lg ring-2 ring-teal-400/40">
            <Shield className="h-8 w-8 text-teal-400" />
          </div>
        </div>
        <div>
          <CardTitle className="text-2xl font-black tracking-tight text-navy">Admin Portal</CardTitle>
          <CardDescription className="text-navy/70 text-xs sm:text-sm mt-1">
            Access the QuardCube Labs administration dashboard
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 sm:p-8 pt-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="rounded-xl">
              <Lock className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-navy/80">Admin Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@quardcubelabs.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-slate-50/80 border border-navy rounded-xl h-11 text-navy placeholder:text-navy/40 focus:bg-white focus:border-navy focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-navy/80">Admin Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={cn(
                  "bg-slate-50/80 border border-navy rounded-xl h-11 text-navy placeholder:text-navy/40 pr-11 focus:bg-white focus:border-navy focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                  !showPassword && password ? "tracking-[0.25em] text-lg font-mono placeholder:tracking-normal placeholder:font-sans placeholder:text-sm" : "text-sm"
                )}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/60 hover:text-navy transition-colors p-1 rounded-lg focus:outline-none"
                title={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          
          <Button
            type="submit"
            className="w-full bg-navy hover:bg-brand-red text-white font-bold h-11 rounded-xl shadow-lg transition-all duration-200 active:scale-98"
            disabled={isLoading}
          >
            {isLoading ? "Authenticating..." : "Sign In to Admin Dashboard"}
          </Button>
        </form>
        
        <div className="mt-6 pt-4 border-t border-navy/15">
          <p className="text-xs text-navy/60 text-center font-medium">
            Admin access is restricted. Contact system administrator if you need access.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal via-teal/90 to-navy flex items-center justify-center p-4 relative overflow-hidden">
      <div className="pattern-grid fixed inset-0 pointer-events-none z-20"></div>
      
      {/* Ambient Glow Orbs */}
      <div className="fixed top-12 left-1/4 w-96 h-96 rounded-full bg-white/15 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-12 right-1/4 w-96 h-96 rounded-full bg-navy/25 blur-[120px] pointer-events-none z-0" />
      
      <Suspense fallback={<div className="text-white font-semibold">Loading...</div>}>
        <AdminLoginForm />
      </Suspense>
    </div>
  )
}
