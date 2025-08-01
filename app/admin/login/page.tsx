"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { adminSignIn } from "../../../lib/admin-auth"
import { Shield, Lock } from "lucide-react"
import { useToast } from "../../../components/ui/use-toast"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const { data, error } = await adminSignIn(email, password)

      if (error) {
        setError(error)
        toast({
          title: "Authentication Failed",
          description: error,
          variant: "destructive",
        })
        return
      }

      if (data) {
        toast({
          title: "Welcome Admin",
          description: "Successfully logged in to admin dashboard.",
        })
        
        // Set client-side session
        localStorage.setItem('admin-session', 'true')
        
        // Redirect to dashboard
        router.push("/admin/dashboard")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("An unexpected error occurred")
      toast({
        title: "Error",
        description: "An unexpected error occurred during login.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal via-teal/90 to-navy flex items-center justify-center p-4">
      <div className="pattern-grid fixed inset-0 pointer-events-none opacity-30"></div>
      
      <Card className="w-full max-w-md relative z-10 border-2 border-navy/20 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-navy/10 p-3 rounded-full">
              <Shield className="h-8 w-8 text-navy" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-navy">Admin Login</CardTitle>
          <CardDescription className="text-navy/70">
            Access the QuardCube Labs administration dashboard
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <Lock className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@quardcubelabs.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/70"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/70"
                disabled={isLoading}
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-navy hover:bg-navy/90 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Authenticating..." : "Sign In to Admin Dashboard"}
            </Button>
          </form>
          
          <div className="mt-6 pt-4 border-t border-navy/20">
            <p className="text-xs text-navy/60 text-center">
              Admin access is restricted. Contact system administrator if you need access.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
