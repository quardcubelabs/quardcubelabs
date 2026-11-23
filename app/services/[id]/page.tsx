import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getServices } from "@/lib/services-actions"
import ServiceDetailClient from "@/components/services/service-detail-client"
import { getCanonicalSiteUrl } from "@/lib/site-config"
import type { Service } from "@/types/database"

export const dynamic = "force-dynamic"
export const revalidate = 0

const SITE_URL = getCanonicalSiteUrl()

interface ServiceDetailPageProps {
  params: Promise<{ id: string }>
}

async function findService(idOrSlug: string): Promise<{ service: Service | null; allServices: Service[] }> {
  try {
    const { data: servicesData } = await getServices()
    if (!servicesData) return { service: null, allServices: [] }

    const activeServices = servicesData
      .filter((s) => s.status === "active")
      .sort((a, b) => a.order_index - b.order_index)

    let found = activeServices.find((s) => s.slug === idOrSlug)
    if (!found) {
      found = activeServices.find((s) => s.id === idOrSlug)
    }
    if (!found && !isNaN(Number(idOrSlug))) {
      const idx = Number(idOrSlug) - 1
      if (idx >= 0 && idx < activeServices.length) {
        found = activeServices[idx]
      }
    }

    return { service: found || null, allServices: activeServices }
  } catch {
    return { service: null, allServices: [] }
  }
}

export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const { service } = await findService(id)

  if (!service) {
    return {
      title: "Service Not Found",
    }
  }

  const slug = (service.slug || "").toLowerCase()
  let title = `${service.title} in Tanzania | QuardCube Labs`
  let description = service.short_description || service.description

  if (slug.includes("ai")) {
    title = "AI Automation Agency & Business Solutions in Tanzania | QuardCube Labs"
    description = "Enterprise AI automation, AI agents, custom chatbots, and workflow automation for businesses in Dar es Salaam and Tanzania."
  } else if (slug.includes("cctv")) {
    title = "CCTV Camera Installation & Security Systems Dar es Salaam | QuardCube Labs"
    description = "Professional CCTV installation services in Dar es Salaam, Tanzania. IP & HD surveillance cameras, remote phone monitoring, and commercial security setups."
  } else if (slug.includes("web")) {
    title = "Website Design & Web Development Company in Tanzania | QuardCube Labs"
    description = "Modern responsive website design, ecommerce development, and web application solutions for Tanzanian companies."
  } else if (slug.includes("software")) {
    title = "Custom Software Development Company in Tanzania | QuardCube Labs"
    description = "Custom business software, ERP systems, dashboards, and enterprise application development in Dar es Salaam, Tanzania."
  } else if (slug.includes("network")) {
    title = "Network Infrastructure & IT Cabling Services Tanzania | QuardCube Labs"
    description = "Structured LAN/WAN network installation, enterprise WiFi configuration, switches, routers, and corporate connectivity in Tanzania."
  } else if (slug.includes("consulting") || slug.includes("support")) {
    title = "IT Support & Technical Consulting Services Tanzania | QuardCube Labs"
    description = "Reliable IT support contracts, corporate maintenance, hardware diagnostics, and technology consulting in Dar es Salaam."
  }

  const canonicalUrl = `${SITE_URL}/services/${service.slug || service.id}`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

function generateServiceJsonLd(service: Service) {
  const serviceUrl = `${SITE_URL}/services/${service.slug || service.id}`
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.description,
    url: serviceUrl,
    provider: {
      "@type": "Organization",
      name: "QuardCube Labs",
      url: SITE_URL,
      telephone: "+255-779-007-055",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Dar es Salaam",
        addressCountry: "TZ",
      },
    },
    areaServed: {
      "@type": "Country",
      name: "Tanzania",
    },
    serviceType: service.title,
  }
}

function generateBreadcrumbsJsonLd(service: Service) {
  const serviceUrl = `${SITE_URL}/services/${service.slug || service.id}`
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Services",
        item: `${SITE_URL}/services`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: service.title,
        item: serviceUrl,
      },
    ],
  }
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { id } = await params
  const { service, allServices } = await findService(id)

  if (!service) {
    notFound()
  }

  return (
    <>
      {/* Service Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateServiceJsonLd(service)),
        }}
      />

      {/* Breadcrumbs Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateBreadcrumbsJsonLd(service)),
        }}
      />

      <ServiceDetailClient service={service} allServices={allServices} serviceId={id} />
    </>
  )
}
