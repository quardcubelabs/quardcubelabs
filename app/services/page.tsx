"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { getServices } from "@/lib/services-actions"
import { getServiceImage } from "@/lib/service-images"
import type { Service } from "@/types/database"
import Footer from "@/components/footer"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle, Phone, Mail, MessageSquare, Sparkles } from "lucide-react"

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1 },
  }),
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadServices = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await getServices()
        if (!error && data) {
          const activeServices = data
            .filter((service) => service.status === "active")
            .sort((a, b) => a.order_index - b.order_index)
          setServices(activeServices)
        }
      } catch (error) {
        console.error("Error loading services:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadServices()
  }, [])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none z-10"></div>
        <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto"></div>
              <p className="mt-4 text-navy/80">Loading services...</p>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none z-10"></div>

      {/* Hero Section */}
      <section className="pt-28 sm:pt-32 md:pt-36 pb-16 sm:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-navy/10 rounded-full px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-navy" />
              <span className="text-sm font-semibold text-navy">What We Offer</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-navy mb-6 leading-tight">
              Our{" "}
              <span className="gradient-text">Services</span>
            </h1>
            <p className="text-lg sm:text-xl text-navy/70 max-w-2xl mx-auto leading-relaxed">
              Comprehensive IT solutions designed to transform your business
              and drive innovation across every dimension of your operations.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="pb-16 sm:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
              >
                <Link
                  href={`/services/${service.slug || service.id}`}
                  className="group block h-full"
                >
                  <div className="relative h-full rounded-2xl border-2 border-navy/10 bg-white overflow-hidden transition-all duration-300 hover:border-navy/30 hover:shadow-[0_8px_40px_rgba(0,0,128,0.12)] flex flex-col">
                    {/* Image */}
                    <div className="relative h-48 sm:h-56 w-full overflow-hidden z-20">
                      <Image
                        src={getServiceImage(service.slug, service.image_url)}
                        alt={service.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-navy/10 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">
                          {service.title}
                        </h3>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 sm:p-6 flex flex-col flex-1">
                      <p className="text-navy/70 text-sm sm:text-base mb-4 line-clamp-3">
                        {service.description}
                      </p>

                      {/* Process Preview */}
                      {service.process &&
                        Array.isArray(service.process) &&
                        service.process.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-xs font-semibold text-navy/50 uppercase tracking-wider mb-2">
                              Our Approach
                            </h4>
                            <ul className="space-y-1.5">
                              {service.process.slice(0, 3).map((step: string, i: number) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-2 text-sm text-navy/70"
                                >
                                  <CheckCircle className="h-3.5 w-3.5 text-brand-red mt-0.5 flex-shrink-0" />
                                  <span className="line-clamp-1">{step}</span>
                                </li>
                              ))}
                              {service.process.length > 3 && (
                                <li className="text-xs text-navy/50 pl-5">
                                  +{service.process.length - 3} more steps
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pb-16 sm:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl border-2 border-navy/10 p-8 sm:p-12"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-4">
                  Ready to Transform Your Business?
                </h2>
                <p className="text-navy/70 mb-6 leading-relaxed">
                  Our team of experts is ready to help you find the right
                  solution for your business. Get in touch today and let&apos;s
                  discuss your project.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/contact">
                    <Button className="bg-navy hover:bg-navy/90 text-white rounded-full">
                      Get in Touch
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <a href="https://wa.me/255623893383?text=Hello%20QuardCubeLabs%2C%20I%20would%20like%20to%20inquire%20about%20your%20services" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="border-navy/30 text-navy hover:bg-navy hover:text-white rounded-full">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      WhatsApp Us
                    </Button>
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-navy/5 rounded-xl p-4">
                  <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center mb-3">
                    <Phone className="h-5 w-5 text-navy" />
                  </div>
                  <h3 className="font-semibold text-navy text-sm mb-1">Call Us</h3>
                  <a
                    href="tel:+255652540496"
                    className="text-navy/70 text-sm hover:text-brand-red transition-colors"
                  >
                    +255 652 540 496
                  </a>
                  <br />
                  <a
                    href="tel:+255623893383"
                    className="text-navy/70 text-sm hover:text-brand-red transition-colors"
                  >
                    +255 623 893 383
                  </a>
                </div>
                <div className="bg-navy/5 rounded-xl p-4">
                  <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center mb-3">
                    <Mail className="h-5 w-5 text-navy" />
                  </div>
                  <h3 className="font-semibold text-navy text-sm mb-1">Email Us</h3>
                  <a
                    href="mailto:info@quardcubelabs.co.tz"
                    className="text-navy/70 text-sm hover:text-brand-red transition-colors block"
                  >
                    info@quardcubelabs.co.tz
                  </a>
                  <a
                    href="mailto:support@quardcubelabs.co.tz"
                    className="text-navy/70 text-sm hover:text-brand-red transition-colors block"
                  >
                    support@quardcubelabs.co.tz
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
