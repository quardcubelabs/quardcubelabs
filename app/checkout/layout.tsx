import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Checkout - QuardCubeLabs",
  description: "Secure checkout for QuardCubeLabs. Complete your purchase with our simple and secure payment process.",
}

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
