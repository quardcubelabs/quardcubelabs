import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Projects - QuardCubeLabs",
  description: "View our portfolio of successful IT projects spanning software development, web applications, cloud infrastructure, and digital transformation solutions.",
}

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
