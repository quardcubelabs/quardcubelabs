import type React from "react"
import { Montserrat } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { OrderProvider } from "@/contexts/order-context"
import { AuthProvider } from "@/contexts/auth-context"
import { CartProvider } from "@/contexts/cart-context"
import AuthStatusLogger from "@/components/auth-status-logger"
import CartDrawer from "@/components/cart-drawer"
import ClientOnly from "@/components/client-only"

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
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7790070552613400"
               crossOrigin="anonymous"></script>
      </head>
      <body className={`${montserrat.className} bg-teal`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <AuthStatusLogger />
            <CartProvider>
              <OrderProvider>
                {children}
                <ClientOnly>
                  <Toaster />
                  <CartDrawer />
                </ClientOnly>
              </OrderProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
