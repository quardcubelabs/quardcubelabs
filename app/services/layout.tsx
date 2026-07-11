import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Services - QuardCubeLabs",
  description: "Explore QuardCubeLabs services: software development, web design, cloud solutions, security products, networking, and IT consulting.",
}

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
