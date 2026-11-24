import type React from "react"
import type { Metadata } from "next"
import { getCanonicalSiteUrl } from "@/lib/site-config"

const SITE_URL = getCanonicalSiteUrl()

export const metadata: Metadata = {
  title: "IT Services, AI Automation, CCTV & Software Development Tanzania | QuardCube Labs",
  description:
    "Comprehensive technology and enterprise IT solutions in Tanzania: Custom Software Development, Website Design, Corporate AI Automation, CCTV Camera Installation, Network Infrastructure, and IT Consulting in Dar es Salaam.",
  alternates: {
    canonical: `${SITE_URL}/services`,
  },
  openGraph: {
    title: "IT Services, AI Automation, CCTV & Software Development Tanzania | QuardCube Labs",
    description:
      "Enterprise IT solutions in Dar es Salaam, Tanzania: AI Automation, Web Design, CCTV Installation, Network Infrastructure, and Custom Software Development.",
    url: `${SITE_URL}/services`,
  },
}

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
