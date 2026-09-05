"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { adminSignIn, adminSignOut, verifyAdminSession } from "@/lib/admin-auth"

interface AdminContextType {
  isAdmin: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  isLoading: true,
  signIn: async () => ({ error: "Not implemented" }),
  signOut: async () => {},
})

export const useAdmin = () => useContext(AdminContext)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function checkAuth() {
      try {
        const { isAdmin: verifiedAdmin } = await verifyAdminSession()
        if (isMounted) {
          setIsAdmin(verifiedAdmin)
        }
      } catch (err) {
        if (isMounted) {
          setIsAdmin(false)
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

      if (data) {
        setIsAdmin(true)
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
    } catch (error) {
      console.error("Admin sign out error:", error)
    }
  }

  return (
    <AdminContext.Provider value={{
      isAdmin,
      isLoading,
      signIn,
      signOut,
    }}>
      {children}
    </AdminContext.Provider>
  )
}
