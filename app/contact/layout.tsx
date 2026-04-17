import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact - QuardCubeLabs",
  description: "Get in touch with QuardCubeLabs. Contact us for inquiries about our IT solutions, services, and general information.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
