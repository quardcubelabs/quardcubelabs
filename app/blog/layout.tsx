import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Blog - QuardCubeLabs",
  description: "Read the latest articles and insights from QuardCubeLabs on IT solutions, web development, and technology trends.",
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
