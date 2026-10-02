"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

export type AdminTheme = "dark" | "light"

interface AdminThemeContextType {
  theme: AdminTheme
  setTheme: (theme: AdminTheme) => void
  toggleTheme: () => void
  isDark: boolean
}

const AdminThemeContext = createContext<AdminThemeContextType>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: true,
})

export const useAdminTheme = () => useContext(AdminThemeContext)

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>("dark")

  useEffect(() => {
    const saved = localStorage.getItem("admin-theme") as AdminTheme | null
    if (saved === "light" || saved === "dark") {
      setThemeState(saved)
    }
  }, [])

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.add("admin-theme")
      document.body.classList.add("admin-theme")
      if (theme === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }
    return () => {
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("admin-theme")
        document.body.classList.remove("admin-theme")
      }
    }
  }, [theme])

  const setTheme = (newTheme: AdminTheme) => {
    setThemeState(newTheme)
    localStorage.setItem("admin-theme", newTheme)
  }

  const toggleTheme = () => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark"
      localStorage.setItem("admin-theme", next)
      return next
    })
  }

  return (
    <AdminThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </AdminThemeContext.Provider>
  )
}
