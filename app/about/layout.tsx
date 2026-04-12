import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About - QuardCubeLabs",
  description: "Learn about QuardCubeLabs, our mission, team, and commitment to providing innovative IT solutions and services.",
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
