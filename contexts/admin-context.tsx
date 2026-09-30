"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react"
import { adminSignIn, adminSignOut, verifyAdminSession, type AdminUser } from "@/lib/admin-auth"

interface AdminContextType {
  isAdmin: boolean
  user: AdminUser | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  user: null,
  isLoading: true,
  signIn: async () => ({ error: "Not implemented" }),
  signOut: async () => {},
  checkAuth: async () => {},
})

export const useAdmin = () => useContext(AdminContext)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth/verify", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setIsAdmin(!!data.isAdmin)
        setUser(data.user || null)
      } else {
        const { isAdmin: verifiedAdmin, user: verifiedUser } = await verifyAdminSession()
        setIsAdmin(verifiedAdmin)
        setUser(verifiedUser)
      }
    } catch (err) {
      console.error("Error verifying admin session:", err)
      try {
        const { isAdmin: verifiedAdmin, user: verifiedUser } = await verifyAdminSession()
        setIsAdmin(verifiedAdmin)
        setUser(verifiedUser)
      } catch {
        setIsAdmin(false)
        setUser(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
    
    // Safety fallback: ensure loading never gets stuck indefinitely
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 4000)

    return () => clearTimeout(timer)
  }, [checkAuth])

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      
      if (!res.ok || !data.success) {
        setIsLoading(false)
        return { error: data.error || "Authentication failed" }
      }

      if (data?.user) {
        setIsAdmin(true)
        setUser(data.user)
        setIsLoading(false)
        return {}
      }

      setIsLoading(false)
      return { error: "Authentication failed" }
    } catch (error) {
      console.error("Admin sign in error:", error)
      setIsLoading(false)
      return { error: "Authentication failed" }
    }
  }

  const signOut = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" })
      await adminSignOut()
      setIsAdmin(false)
      setUser(null)
    } catch (error) {
      console.error("Admin sign out error:", error)
    }
  }

  return (
    <AdminContext.Provider value={{
      isAdmin,
      user,
      isLoading,
      signIn,
      signOut,
      checkAuth,
    }}>
      {children}
    </AdminContext.Provider>
  )
}

