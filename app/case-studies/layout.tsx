import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Case Studies - QuardCubeLabs",
  description: "Explore our case studies showcasing successful IT projects and digital transformation solutions for various clients.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
