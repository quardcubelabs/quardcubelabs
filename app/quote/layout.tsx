import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Request Quote - QuardCubeLabs",
  description: "Request a custom quote for QuardCubeLabs services. Get a personalized proposal for your IT needs.",
}

export default function QuoteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
