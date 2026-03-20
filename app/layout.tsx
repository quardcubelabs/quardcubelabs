import type React from "react"
import { Montserrat, Anton } from "next/font/google"
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
const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" })

export const metadata = {
  metadataBase: new URL('https://quardcube.vercel.app'),
  applicationName: 'QuardCubeLabs',
  title: "QuardCubeLabs - Innovative IT Solutions",
  description:
    "QuardCubeLabs provides cutting-edge IT solutions including software development, web design, power solutions, security products, connectivity & networking, and standard IT products and services.",
  generator: 'QuardCubeLabs',
  verification: {
    google: 'Gs4cEZUDOBLXKjrQW1PDgFQvOWTIM94yjXL3W9kPudE',
  },
  icons: {
    icon: [
      { url: '/turquoise.png', sizes: 'any' },
      { url: '/turquoise.png', sizes: '32x32', type: 'image/png' },
      { url: '/turquoise.png', sizes: '192x192', type: 'image/png' },
      { url: '/turquoise.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/turquoise.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/turquoise.png',
  },
  openGraph: {
    title: 'QuardCubeLabs - Innovative IT Solutions',
    description: 'QuardCubeLabs provides cutting-edge IT solutions including software development, web design, power solutions, security products, connectivity & networking, and standard IT products and services.',
    images: ['/quard.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QuardCubeLabs - Innovative IT Solutions',
    description: 'QuardCubeLabs provides cutting-edge IT solutions including software development, web design, power solutions, security products, connectivity & networking, and standard IT products and services.',
    images: ['/quard.png'],
  },
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
      <body className={`${montserrat.className} ${anton.variable} bg-teal`} suppressHydrationWarning>
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
