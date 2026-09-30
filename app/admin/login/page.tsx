"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Lock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

function AdminLoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
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

      toast({
        title: "Welcome Admin",
        description: "Successfully logged in. Loading dashboard...",
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
              className="bg-slate-50/80 border-navy/20 rounded-xl h-11 text-navy placeholder:text-navy/40 focus:bg-white focus:border-navy focus:ring-2 focus:ring-navy/20"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-navy/80">Admin Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-slate-50/80 border-navy/20 rounded-xl h-11 text-navy placeholder:text-navy/40 focus:bg-white focus:border-navy focus:ring-2 focus:ring-navy/20"
              disabled={isLoading}
            />
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
