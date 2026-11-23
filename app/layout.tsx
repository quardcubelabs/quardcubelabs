import type React from "react"
import Script from "next/script"
import { Montserrat, Anton } from "next/font/google"
import { getCanonicalSiteUrl } from "@/lib/site-config"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { OrderProvider } from "@/contexts/order-context"
import { AuthProvider } from "@/contexts/auth-context"
import { CartProvider } from "@/contexts/cart-context"
import { WishlistProvider } from "@/contexts/wishlist-context"
import AuthStatusLogger from "@/components/auth-status-logger"
import CartDrawer from "@/components/cart-drawer"
import WishlistDrawer from "@/components/wishlist-drawer"
import ClientOnly from "@/components/client-only"
import Navbar from "@/components/navbar"

const montserrat = Montserrat({ subsets: ["latin"], display: "swap", preload: true })
const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap", preload: true })

export const metadata = {
  metadataBase: new URL(getCanonicalSiteUrl()),
  applicationName: "QuardCube Labs",
  title: {
    default: "QuardCube Labs | IT Products, Services & AI Solutions Tanzania",
    template: "%s | QuardCube Labs Tanzania",
  },
  description:
    "QuardCube Labs is a premier Tanzanian technology company and computer store based in Dar es Salaam. We supply genuine laptops, desktops, printers, CCTV security systems, networking equipment, custom software development, web design, and enterprise AI automation solutions.",
  keywords: [
    "computer store Tanzania",
    "computer shop Dar es Salaam",
    "laptops Tanzania",
    "laptops Dar es Salaam",
    "desktop computers Tanzania",
    "CCTV installation Tanzania",
    "CCTV installation Dar es Salaam",
    "networking equipment Tanzania",
    "IT company Tanzania",
    "IT services Dar es Salaam",
    "AI automation Tanzania",
    "AI agency Tanzania",
    "website design Tanzania",
    "web development Dar es Salaam",
    "software development Tanzania",
    "QuardCube Labs",
  ],
  authors: [{ name: "QuardCube Labs", url: "https://www.quardcubelabs.co.tz" }],
  creator: "QuardCube Labs",
  publisher: "QuardCube Labs",
  generator: "Next.js",
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "Gs4cEZUDOBLXKjrQW1PDgFQvOWTIM94yjXL3W9kPudE",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "QuardCube Labs | IT Products, Services & AI Solutions Tanzania",
    description:
      "Premier technology company & computer store in Dar es Salaam, Tanzania. Genuine laptops, desktops, CCTV security, network infrastructure, web development, and AI automation.",
    siteName: "QuardCube Labs",
    images: ["/quard.png"],
    type: "website",
    locale: "en_TZ",
  },
  twitter: {
    card: "summary_large_image",
    title: "QuardCube Labs | IT Products, Services & AI Solutions Tanzania",
    description:
      "Leading technology company & IT hardware store in Dar es Salaam, Tanzania. Computers, CCTV, networking, software, and AI solutions.",
    images: ["/quard.png"],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const siteUrl = getCanonicalSiteUrl()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script async src="https://www.googletagmanager.com/gtm.js?id=GTM-K3GS8XH4"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
`,
          }}
        />
        <Script
          type="application/ld+json"
          id="schema-website"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'QuardCube Labs',
              alternateName: 'QuardCubeLabs',
              url: siteUrl,
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${siteUrl}/shop?q={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <Script
          type="application/ld+json"
          id="schema-organization"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'QuardCube Labs',
              alternateName: 'QuardCubeLabs',
              url: siteUrl,
              logo: `${siteUrl}/turquoise.png`,
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+255-779-007-055',
                contactType: 'Customer Support & Sales',
                areaServed: 'TZ',
                availableLanguage: ['English', 'Swahili'],
              },
              sameAs: [
                'https://www.instagram.com/quardcube',
                'https://twitter.com/quardcube',
                'https://linkedin.com/company/quardcube',
              ],
            }),
          }}
        />
        <Script
          type="application/ld+json"
          id="schema-localbusiness"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': ['ComputerStore', 'ProfessionalService'],
              name: 'QuardCube Labs',
              image: `${siteUrl}/quard.png`,
              '@id': `${siteUrl}/#localbusiness`,
              url: siteUrl,
              telephone: '+255-779-007-055',
              priceRange: 'TZS',
              currenciesAccepted: 'TZS',
              paymentAccepted: 'Cash, Credit Card, Mobile Money (M-Pesa, Tigo Pesa, Airtel Money), Selcom',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Dar es Salaam',
                addressRegion: 'Dar es Salaam',
                addressCountry: 'TZ',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: -6.7924,
                longitude: 39.2083,
              },
              openingHoursSpecification: [
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                  opens: '08:30',
                  closes: '18:00',
                },
              ],
            }),
          }}
        />
        <Script
          id="google-adsense"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7790070552613400"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${montserrat.className} ${anton.variable} bg-teal`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <AuthStatusLogger />
            <CartProvider>
              <WishlistProvider>
                <OrderProvider>
                  <Navbar />
                  {children}
                  <ClientOnly>
                    <Toaster />
                    <CartDrawer />
                    <WishlistDrawer />
                  </ClientOnly>
                </OrderProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
