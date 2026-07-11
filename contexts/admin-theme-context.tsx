"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

type AdminTheme = "dark" | "light"

interface AdminThemeContextType {
  theme: AdminTheme
  toggleTheme: () => void
  isDark: boolean
}

const AdminThemeContext = createContext<AdminThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  isDark: true,
})

export const useAdminTheme = () => useContext(AdminThemeContext)

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AdminTheme>("dark")

  useEffect(() => {
    const saved = localStorage.getItem("admin-theme") as AdminTheme | null
    if (saved === "light" || saved === "dark") {
      setTheme(saved)
    }
  }, [])

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark"
      localStorage.setItem("admin-theme", next)
      return next
    })
  }

  return (
    <AdminThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </AdminThemeContext.Provider>
  )
}
