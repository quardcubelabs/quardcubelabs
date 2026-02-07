"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

export type ThemeSettings = {
  theme: "light" | "dark" | "auto"
  primaryColor: string
  logoUrl: string
  faviconUrl: string
  customCSS: string
}

interface ThemeContextType {
  themeSettings: ThemeSettings
  setThemeSettings: (settings: ThemeSettings) => void
  isDarkMode: boolean
  applyTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

interface ThemeProviderProps {
  children: ReactNode
  initialSettings?: ThemeSettings
}

const defaultSettings: ThemeSettings = {
  theme: "light",
  primaryColor: "#1e40af",
  logoUrl: "/turquoise.png",
  faviconUrl: "/favicon.ico",
  customCSS: ""
}

export function ThemeProvider({ children, initialSettings = defaultSettings }: ThemeProviderProps) {
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(initialSettings)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Apply theme changes to the DOM
  const applyTheme = () => {
    const root = document.documentElement
    
    // Handle dark/light mode
    if (themeSettings.theme === "dark") {
      root.classList.add("dark")
      setIsDarkMode(true)
    } else if (themeSettings.theme === "light") {
      root.classList.remove("dark")
      setIsDarkMode(false)
    } else if (themeSettings.theme === "auto") {
      // Use system preference
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      if (mediaQuery.matches) {
        root.classList.add("dark")
        setIsDarkMode(true)
      } else {
        root.classList.remove("dark")
        setIsDarkMode(false)
      }
    }

    // Apply primary color as CSS custom property
    root.style.setProperty("--color-primary", themeSettings.primaryColor)
    
    // Apply custom CSS
    let customStyleElement = document.getElementById("custom-theme-styles")
    if (!customStyleElement) {
      customStyleElement = document.createElement("style")
      customStyleElement.id = "custom-theme-styles"
      document.head.appendChild(customStyleElement)
    }
    customStyleElement.textContent = themeSettings.customCSS

    // Update favicon
    let faviconElement = document.querySelector("link[rel='icon']") as HTMLLinkElement
    if (!faviconElement) {
      faviconElement = document.createElement("link")
      faviconElement.rel = "icon"
      document.head.appendChild(faviconElement)
    }
    faviconElement.href = themeSettings.faviconUrl
  }

  // Apply theme when settings change
  useEffect(() => {
    applyTheme()
  }, [themeSettings])

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (themeSettings.theme === "auto") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handleChange = () => applyTheme()
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }
  }, [themeSettings.theme])

  return (
    <ThemeContext.Provider
      value={{
        themeSettings,
        setThemeSettings,
        isDarkMode,
        applyTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
