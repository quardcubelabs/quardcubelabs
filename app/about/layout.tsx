import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us - QuardCubeLabs",
  description: "Learn about QuardCubeLabs — our story, mission, leadership team, and commitment to providing innovative IT solutions in Tanzania and beyond.",
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
