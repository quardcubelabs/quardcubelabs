"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { adminSignIn, adminSignOut } from "@/lib/admin-auth"

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
    // Check if admin session exists in localStorage for client-side persistence
    const adminSession = localStorage.getItem('admin-session')
    if (adminSession === 'true') {
      setIsAdmin(true)
    }
    setIsLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await adminSignIn(email, password)
      
      if (error) {
        return { error }
      }

      if (data) {
        localStorage.setItem('admin-session', 'true')
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
      localStorage.removeItem('admin-session')
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
