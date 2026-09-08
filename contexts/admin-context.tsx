"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { adminSignIn, adminSignOut, verifyAdminSession, type AdminUser } from "@/lib/admin-auth"

interface AdminContextType {
  isAdmin: boolean
  user: AdminUser | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  user: null,
  isLoading: true,
  signIn: async () => ({ error: "Not implemented" }),
  signOut: async () => {},
})

export const useAdmin = () => useContext(AdminContext)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function checkAuth() {
      try {
        const { isAdmin: verifiedAdmin, user: verifiedUser } = await verifyAdminSession()
        if (isMounted) {
          setIsAdmin(verifiedAdmin)
          setUser(verifiedUser)
        }
      } catch (err) {
        if (isMounted) {
          setIsAdmin(false)
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    checkAuth()
    return () => {
      isMounted = false
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await adminSignIn(email, password)
      
      if (error) {
        return { error }
      }

      if (data?.user) {
        setIsAdmin(true)
        setUser(data.user)
        return {}
      }

      return { error: "Authentication failed" }
    } catch (error) {
      console.error("Admin sign in error:", error)
      return { error: "Authentication failed" }
    }
  }

  const signOut = async () => {
    try {
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
    }}>
      {children}
    </AdminContext.Provider>
  )
}
