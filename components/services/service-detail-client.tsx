"use client"

import { motion } from "framer-motion"
import { getServiceImage } from "@/lib/service-images"
import type { Service } from "@/types/database"
import Footer from "@/components/footer"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, CheckCircle, ShoppingBag, ShieldCheck, Cpu, Wifi, Video, Wrench } from "lucide-react"
import ServiceQuote from "@/components/services/service-quote"

interface ServiceDetailClientProps {
  service: Service
  allServices: Service[]
  serviceId: string
}

export default function ServiceDetailClient({
  service,
  allServices,
  serviceId,
}: ServiceDetailClientProps) {
  // Determine relevant product category to link to
  const getRelatedCategory = () => {
    const slug = (service.slug || "").toLowerCase()
    if (slug.includes("cctv") || slug.includes("security")) {
      return {
        label: "Browse CCTV Cameras & Storage",
        href: "/shop?category=CCTV%20Cameras",
        icon: Video,
        items: ["IP & HD Cameras", "NVR & DVR Recorders", "Surveillance Hard Drives", "PoE Network Switches"],
      }
    }
    if (slug.includes("network")) {
      return {
        label: "Browse Networking Equipment",
        href: "/shop?category=Networking",
        icon: Wifi,
        items: ["Gigabit Routers", "Access Points", "Managed Switches", "Cat6 Structured Cabling"],
      }
    }
    if (slug.includes("power")) {
      return {
        label: "Browse UPS & Power Backup",
        href: "/shop?category=UPS",
        icon: Cpu,
        items: ["Line-Interactive UPS", "Online Double-Conversion", "Powerstations", "Surge Protectors"],
      }
    }
    if (slug.includes("software") || slug.includes("web") || slug.includes("ai")) {
      return {
        label: "Browse Workstations & Enterprise Hardware",
        href: "/shop?category=Laptops",
        icon: ShoppingBag,
        items: ["High-Performance Laptops", "All-in-One Desktops", "Licensed Software", "Storage Solutions"],
      }
    }
    return {
      label: "Explore QuardCube Computer Store",
      href: "/shop",
      icon: ShoppingBag,
      items: ["Laptops", "Desktops", "Printers", "Components"],
    }
  }

  const relatedStore = getRelatedCategory()
  const StoreIcon = relatedStore.icon

  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none z-10"></div>

      <section className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <Link
            href="/services"
            className="inline-flex items-center text-navy hover:text-brand-red transition-colors mb-8 font-bold text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Services
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-2"
            >
              <div className="inline-flex items-center gap-2 bg-navy/10 px-3 py-1 rounded-full text-xs font-bold text-navy mb-4">
                <ShieldCheck className="w-3.5 h-3.5 text-navy" />
                <span>Enterprise Service • Tanzania & East Africa</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black mb-6 text-navy tracking-tight">{service.title}</h1>

              <div className="relative rounded-2xl overflow-hidden border-2 border-navy/20 mb-8 bg-white shadow-md">
                <Image
                  src={getServiceImage(service.slug, service.image_url)}
                  alt={`${service.title} in Tanzania - QuardCube Labs`}
                  width={800}
                  height={500}
                  priority
                  className="w-full h-auto object-cover max-h-[460px]"
                />
              </div>

              <div className="prose prose-lg max-w-none">
                <h2 className="text-2xl font-black mb-4 text-navy">Overview & Commercial Scope</h2>
                <p className="text-navy/90 mb-6 leading-relaxed text-base sm:text-lg">{service.description}</p>

                {/* Process Section */}
                {service.process && Array.isArray(service.process) && service.process.length > 0 && (
                  <>
                    <h2 className="text-2xl font-black mb-4 text-navy">Engineering & Implementation Process</h2>
                    <ul className="space-y-4 mb-8">
                      {service.process.map((step: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 bg-white/70 p-3.5 rounded-xl border border-navy/10 shadow-xs">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center font-black text-sm">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-navy text-sm sm:text-base">{step}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {/* Commercial Product Connection (Internal Linking Pillar) */}
                <div className="bg-white rounded-2xl border-2 border-navy/20 p-6 mb-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-teal/20 text-navy">
                      <StoreIcon className="w-5 h-5 text-navy" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-navy">Hardware & Equipment for This Service</h3>
                      <p className="text-xs text-navy/70">Equipped with official hardware backed by QuardCube Labs warranty</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {relatedStore.items.map((item, idx) => (
                      <span key={idx} className="p-2 rounded-lg bg-navy/5 text-navy text-xs font-bold text-center border border-navy/10">
                        {item}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={relatedStore.href}
                    className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-brand-red hover:underline"
                  >
                    {relatedStore.label} →
                  </Link>
                </div>

                {/* Technologies Section */}
                {service.technologies && Array.isArray(service.technologies) && service.technologies.length > 0 && (
                  <>
                    <h2 className="text-2xl font-black mb-4 text-navy">Technologies & Tools</h2>
                    <div className="flex flex-wrap gap-2.5 mb-8">
                      {service.technologies.map((tech: string, i: number) => (
                        <span key={i} className="px-4 py-1.5 bg-white border-2 border-navy/15 rounded-full font-bold text-xs text-navy shadow-xs">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {/* Case Studies Section */}
                {service.case_studies && Array.isArray(service.case_studies) && service.case_studies.length > 0 && (
                  <>
                    <h2 className="text-2xl font-black mb-4 text-navy">Verified Tanzanian Projects & Case Studies</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {service.case_studies.map((caseStudy, i: number) => (
                        <div key={i} className="bg-white border-2 border-navy/20 rounded-2xl p-6 shadow-sm">
                          <h3 className="text-lg font-black mb-2 text-navy">{caseStudy.title}</h3>
                          <p className="text-xs text-navy/70 mb-4 font-semibold">Client / Sector: {caseStudy.client}</p>
                          <div className="flex items-center gap-2 text-emerald-700">
                            <CheckCircle className="h-4 w-4 shrink-0" />
                            <span className="font-bold text-xs">{caseStudy.outcome}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Formal Quote & Proposal Box */}
                <div className="bg-white rounded-2xl border-2 border-navy/20 p-6 sm:p-8 mb-8 shadow-md">
                  <h2 className="text-2xl font-black mb-2 text-navy">Request a Formal Proposal & Estimate</h2>
                  <p className="text-sm text-navy/80 mb-6 leading-relaxed">
                    Request a tailored estimate for our {service.title} service. Our technical consultants in Dar es Salaam will prepare a comprehensive proposal tailored to your specifications.
                  </p>
                  <ServiceQuote service={service} />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-32 space-y-6">
                <div className="bg-white rounded-2xl border-2 border-navy/20 overflow-hidden shadow-sm">
                  <div className="p-5">
                    <h2 className="text-lg font-black mb-4 text-navy">All Technical Services</h2>
                    <ul className="space-y-1.5">
                      {allServices.map((s) => {
                        const isCurrent = s.slug === serviceId || s.id === serviceId
                        return (
                          <li key={s.id}>
                            <Link
                              href={`/services/${s.slug || s.id}`}
                              className={`block p-2.5 rounded-xl font-bold text-xs transition-colors ${
                                isCurrent
                                  ? "bg-navy text-white shadow-xs"
                                  : "text-navy hover:bg-navy/10"
                              }`}
                            >
                              {s.title}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border-2 border-navy/20 overflow-hidden shadow-sm">
                  <div className="p-5">
                    <h2 className="text-lg font-black mb-3 text-navy">Direct Technical Consultation</h2>
                    <p className="text-xs text-navy/80 mb-5 leading-relaxed">
                      Our certified engineers and consultants are available to assist with site surveys, architectural planning, and technology procurement.
                    </p>
                    <div className="space-y-3.5 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center shrink-0">
                          <span className="text-navy font-bold">✉</span>
                        </div>
                        <div>
                          <p className="font-semibold text-navy/70 text-[10px] uppercase">Email Inquiries</p>
                          <a href="mailto:info@quardcubelabs.co.tz" className="text-brand-red font-bold hover:underline">
                            info@quardcubelabs.co.tz
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center shrink-0">
                          <span className="text-navy font-bold">☎</span>
                        </div>
                        <div>
                          <p className="font-semibold text-navy/70 text-[10px] uppercase">Hotline & WhatsApp</p>
                          <a href="tel:+255652540496" className="text-brand-red font-bold hover:underline">
                            +255 652 540 496
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
