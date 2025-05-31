"use client"

import { useParams, notFound } from "next/navigation"
import { motion } from "framer-motion"
import { services } from "@/lib/data"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle, ArrowRight } from "lucide-react"

export default function ServiceDetailPage() {
  const params = useParams()
  const serviceId = Number(params.id)
  const service = services.find((s) => s.id === serviceId)

  if (!service) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
      <Navbar />

      <section className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <Link
            href="/services"
            className="inline-flex items-center text-navy hover:text-brand-red transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Services
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-2"
            >
              <h1 className="text-4xl font-bold mb-6">{service.title}</h1>

              <div className="relative rounded-2xl overflow-hidden border-2 border-navy/20 mb-8">
                <Image
                  src={service.image || "/placeholder.svg"}
                  alt={service.title}
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
              </div>

              <div className="prose prose-lg max-w-none">
                <h2 className="text-2xl font-bold mb-4">Overview</h2>
                <p className="text-navy/80 mb-6">{service.description}</p>

                <h2 className="text-2xl font-bold mb-4">Our Process</h2>
                <ul className="space-y-4 mb-8">
                  {service.process.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center font-bold">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium">{step}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <h2 className="text-2xl font-bold mb-4">Technologies We Use</h2>
                <div className="flex flex-wrap gap-3 mb-8">
                  {service.technologies.map((tech, i) => (
                    <span key={i} className="px-4 py-2 bg-white/50 border border-navy/20 rounded-full">
                      {tech}
                    </span>
                  ))}
                </div>

                <h2 className="text-2xl font-bold mb-4">Case Studies</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {service.caseStudies.map((caseStudy, i) => (
                    <div key={i} className="bg-white/50 border-2 border-navy/20 rounded-2xl p-6">
                      <h3 className="text-xl font-bold mb-2">{caseStudy.title}</h3>
                      <p className="text-navy/70 mb-4">Client: {caseStudy.client}</p>
                      <div className="flex items-center gap-2 text-brand-red">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">{caseStudy.outcome}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-navy/10 rounded-2xl p-8 mb-8">
                  <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
                  <p className="mb-6">
                    Contact us today to discuss how our {service.title} can help your business thrive in the digital
                    landscape.
                  </p>
                  <Link href="/contact">
                    <Button className="bg-navy hover:bg-navy/90 text-white rounded-full">
                      Contact Us <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-32">
                <div className="bg-white/50 rounded-2xl border-2 border-navy/20 overflow-hidden mb-8">
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">Our Services</h2>
                    <ul className="space-y-2">
                      {services.map((s) => (
                        <li key={s.id}>
                          <Link
                            href={`/services/${s.id}`}
                            className={`block p-3 rounded-lg transition-colors ${
                              s.id === serviceId ? "bg-navy text-white" : "hover:bg-navy/10"
                            }`}
                          >
                            {s.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-white/50 rounded-2xl border-2 border-navy/20 overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">Need Help?</h2>
                    <p className="text-navy/80 mb-6">
                      Our team of experts is ready to answer your questions and help you find the right solution for
                      your business.
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-navy"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">Email Us</p>
                          <a href="mailto:info@quardcubelabs.com" className="text-brand-red hover:underline">
                            info@quardcubelabs.com
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-navy"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">Call Us</p>
                          <a href="tel:+15551234567" className="text-brand-red hover:underline">
                            +1 (555) 123-4567
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
