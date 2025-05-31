"use client"

import { motion } from "framer-motion"
import { teamMembers, companyHistory, faqs } from "@/lib/data"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle, Plus, Minus } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function AboutPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
      <Navbar />

      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">
              About <span className="gradient-text">QuardCubeLabs</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-navy/80 max-w-3xl mx-auto">
              Learn about our company, our mission, and the team behind our innovative solutions
            </p>
          </div>

          {/* Company Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center mb-16 sm:mb-20 md:mb-24">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative rounded-2xl overflow-hidden border-2 border-navy/20">
                <Image
                  src="/placeholder.svg?height=600&width=800"
                  alt="QuardCubeLabs office"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <p className="text-navy/80 mb-6">
                QuardCubeLabs was founded in 2008 with a vision to transform how businesses leverage technology. What
                began as a small team of passionate technologists has grown into a comprehensive IT solutions provider
                serving clients across various industries worldwide.
              </p>
              <p className="text-navy/80 mb-8">
                Our journey has been defined by a commitment to innovation, excellence, and client success. We've
                evolved our service offerings to address the changing technology landscape while maintaining our core
                values of integrity, expertise, and client-focused solutions.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-brand-red mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold">Our Mission</h3>
                    <p className="text-navy/80">
                      To empower businesses through innovative technology solutions that drive growth, efficiency, and
                      competitive advantage.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-brand-red mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold">Our Vision</h3>
                    <p className="text-navy/80">
                      To be the trusted technology partner for businesses seeking to thrive in the digital era.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-brand-red mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold">Our Values</h3>
                    <p className="text-navy/80">
                      Innovation, Excellence, Integrity, Collaboration, and Client Success.
                    </p>
                  </div>
                </div>
              </div>

              <Link href="/contact">
                <Button className="bg-navy hover:bg-navy/90 text-white rounded-full">
                  Contact Us <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Company History */}
          <div className="mb-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Journey</h2>
              <p className="text-xl text-navy/80 max-w-3xl mx-auto">
                The evolution of QuardCubeLabs from its founding to the present day
              </p>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-navy/20"></div>

              <div className="space-y-12">
                {companyHistory.map((event, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`flex items-center ${index % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}
                  >
                    <div className={`w-1/2 ${index % 2 === 0 ? "pr-12 text-right" : "pl-12 text-left"}`}>
                      <div className="bg-white/50 rounded-2xl border-2 border-navy/20 p-6">
                        <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                        <p className="text-navy/80">{event.description}</p>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-navy flex items-center justify-center text-white font-bold z-10 relative">
                        {event.year}
                      </div>
                    </div>

                    <div className="w-1/2"></div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div className="mb-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Leadership Team</h2>
              <p className="text-xl text-navy/80 max-w-3xl mx-auto">
                Meet the experts behind QuardCubeLabs' innovative solutions
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
                {teamMembers.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="group w-full max-w-sm"
                  >
                    <div className="bg-white/50 rounded-2xl border-2 border-navy/20 overflow-hidden transition-all duration-300 hover:border-navy hover:shadow-lg">
                      <div className="relative overflow-hidden">
                        <Image
                          src={member.image || "/placeholder.svg"}
                          alt={member.name}
                          width={400}
                          height={400}
                          className="w-full h-auto transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <div className="flex gap-2 justify-center">
                            {member.socialMedia.whatsapp && (
                              <a
                                href={member.socialMedia.whatsapp}
                                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-navy hover:bg-navy hover:text-white transition-colors"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                              </a>
                            )}
                            {member.socialMedia.instagram && (
                              <a
                                href={member.socialMedia.instagram}
                                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-navy hover:bg-navy hover:text-white transition-colors"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                              </a>
                            )}
                            {member.socialMedia.twitter && (
                              <a
                                href={member.socialMedia.twitter}
                                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-navy hover:bg-navy hover:text-white transition-colors"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                                </svg>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                      <p className="text-brand-red mb-4">{member.role}</p>
                      <p className="text-navy/80 text-sm mb-4 line-clamp-3">{member.bio}</p>

                      <div className="flex flex-wrap gap-2">
                        {member.expertise.slice(0, 2).map((skill, i) => (
                          <span key={i} className="text-xs bg-navy/10 text-navy px-2 py-1 rounded-full">
                            {skill}
                          </span>
                        ))}
                        {member.expertise.length > 2 && (
                          <span className="text-xs bg-navy/10 text-navy px-2 py-1 rounded-full">
                            +{member.expertise.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-xl text-navy/80 max-w-3xl mx-auto">
                Find answers to common questions about our services and approach
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <div
                      className={`bg-white/50 rounded-2xl border-2 ${openFaq === index ? "border-navy" : "border-navy/20"} overflow-hidden transition-all duration-300`}
                    >
                      <button
                        className="flex justify-between items-center w-full p-6 text-left"
                        onClick={() => toggleFaq(index)}
                      >
                        <h3 className="text-lg font-bold">{faq.question}</h3>
                        <div className="flex-shrink-0 ml-4">
                          {openFaq === index ? (
                            <Minus className="h-5 w-5 text-navy" />
                          ) : (
                            <Plus className="h-5 w-5 text-navy" />
                          )}
                        </div>
                      </button>

                      {openFaq === index && (
                        <div className="px-6 pb-6">
                          <p className="text-navy/80">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-navy/10 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Work With Us?</h2>
            <p className="text-xl text-navy/80 max-w-3xl mx-auto mb-8">
              Contact us today to discuss how we can help your business thrive in the digital landscape
            </p>
            <Link href="/contact">
              <Button className="bg-navy hover:bg-navy/90 text-white rounded-full px-8 py-6 text-lg">
                Get in Touch <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
