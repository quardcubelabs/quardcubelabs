import type React from "react"
import { Montserrat } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { OrderProvider } from "@/contexts/order-context"
import { AuthProvider } from "@/contexts/auth-context"
import AuthStatusLogger from "@/components/auth-status-logger"

const montserrat = Montserrat({ subsets: ["latin"] })

export const metadata = {
  title: "QuardCubeLabs - Innovative IT Solutions",
  description:
    "QuardCubeLabs provides cutting-edge IT solutions including software development, web design, power solutions, security products, connectivity & networking, and standard IT products and services.",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={montserrat.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <AuthStatusLogger />
            <OrderProvider>
              {children}
              <Toaster />
            </OrderProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
