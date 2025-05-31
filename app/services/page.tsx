"use client"

import { motion } from "framer-motion"
import { services } from "@/lib/data"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle } from "lucide-react"

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
      <Navbar />

      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">
              Our <span className="gradient-text">Services</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-navy/80 max-w-3xl mx-auto">
              Comprehensive IT solutions designed to transform your business and drive innovation
            </p>
          </div>

          <div className="space-y-16 sm:space-y-20 md:space-y-24">
            {services.map((service, index) => (
              <div key={service.id} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className={`order-1 ${index % 2 === 0 ? "lg:order-1" : "lg:order-2"}`}
                >
                  <div className="relative rounded-2xl overflow-hidden border-2 border-navy/20">
                    <Image
                      src={service.image || "/placeholder.svg"}
                      alt={service.title}
                      width={800}
                      height={600}
                      className="w-full h-auto"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-navy/50 to-transparent h-1/3"></div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: index % 2 === 0 ? 20 : -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className={`order-2 ${index % 2 === 0 ? "lg:order-2" : "lg:order-1"}`}
                >
                  <h2 className="text-3xl font-bold mb-4">{service.title}</h2>
                  <p className="text-navy/80 mb-6">{service.description}</p>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Our Process:</h3>
                    <ul className="space-y-2">
                      {service.process.map((step, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-brand-red mt-0.5 flex-shrink-0" />
                          <span className="text-navy/80">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-3">Technologies:</h3>
                    <div className="flex flex-wrap gap-2">
                      {service.technologies.map((tech, i) => (
                        <span key={i} className="px-3 py-1 bg-white/50 border border-navy/20 rounded-full text-sm">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link href={`/services/${service.id}`}>
                    <Button className="bg-navy hover:bg-navy/90 text-white rounded-full">
                      Learn More <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
