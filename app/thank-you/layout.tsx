import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Thank You - QuardCubeLabs",
  description: "Thank you for your order! Your request has been received and we'll be in touch soon.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
