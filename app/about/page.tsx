"use client"

import { motion, useInView } from "framer-motion"
import { teamMembers, companyHistory, faqs } from "@/lib/data"
import Footer from "@/components/footer"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Plus, Minus, Phone, Mail, MessageSquare, Users, Award, Briefcase, Target, ChevronDown, Rocket, Handshake, Layers, Building, Trophy, Brain } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1 },
  }),
}

const stats = [
  { value: 5, suffix: "+", label: "Team Members", icon: Users },
  { value: 20, suffix: "+", label: "Projects Completed", icon: Briefcase },
  { value: 3, suffix: "+", label: "Years Experience", icon: Award },
  { value: 98, suffix: "%", label: "Client Satisfaction", icon: Target },
]

function CountUp({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const duration = 2000
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [isInView, target])

  return <span ref={ref}>{count}{suffix}</span>
}

export default function AboutPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
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
              <Briefcase className="h-4 w-4 text-navy" />
              <span className="text-sm font-semibold text-navy">About Us</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-navy mb-6 leading-tight">
              The Team Behind{" "}
              <span className="gradient-text">Innovation</span>
            </h1>
            <p className="text-lg sm:text-xl text-navy/70 max-w-2xl mx-auto leading-relaxed">
              Discover the story, mission, and people driving QuardCubeLabs
              forward as a leading IT solutions provider.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="pb-16 sm:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-6 sm:p-8"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className="text-center"
                >
                  <div className="w-14 h-14 rounded-xl bg-navy/10 flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="h-7 w-7 text-navy" />
                  </div>
                  <p className="text-4xl sm:text-5xl font-bold text-navy">
                    <CountUp target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-sm sm:text-base text-navy/60 mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Company Overview */}
      <section className="pb-16 sm:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative rounded-2xl overflow-hidden border-2 border-navy/10 shadow-[0_8px_40px_rgba(0,0,128,0.08)]">
                <Image
                  src="/team-02.png"
                  alt="QuardCubeLabs team"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
                <div className="absolute bottom-4 left-4 bg-navy text-white px-4 py-2 rounded-lg font-semibold text-sm">
                  Est. 2023
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Our <span className="gradient-text">Story</span>
              </h2>
              <p className="text-navy/70 mb-4 leading-relaxed">
                QuardCubeLabs was founded in 2023 with a vision to transform
                how businesses leverage technology. What began as a small team
                of passionate technologists has grown into a comprehensive IT
                solutions provider serving clients across various industries.
              </p>
              <p className="text-navy/70 mb-8 leading-relaxed">
                Our journey has been defined by a commitment to innovation,
                excellence, and client success. We&apos;ve evolved our service
                offerings to address the changing technology landscape while
                maintaining our core values.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border border-navy/10">
                  <div className="w-10 h-10 rounded-lg bg-navy/10 flex items-center justify-center mb-3">
                    <Target className="h-5 w-5 text-navy" />
                  </div>
                  <h3 className="font-bold text-sm mb-1">Our Mission</h3>
                  <p className="text-navy/60 text-xs leading-relaxed">
                    Empower businesses through innovative technology solutions
                    that drive growth and efficiency.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-navy/10">
                  <div className="w-10 h-10 rounded-lg bg-navy/10 flex items-center justify-center mb-3">
                    <Award className="h-5 w-5 text-navy" />
                  </div>
                  <h3 className="font-bold text-sm mb-1">Our Vision</h3>
                  <p className="text-navy/60 text-xs leading-relaxed">
                    Be the trusted technology partner for businesses thriving
                    in the digital era.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-navy/10">
                  <div className="w-10 h-10 rounded-lg bg-navy/10 flex items-center justify-center mb-3">
                    <Users className="h-5 w-5 text-navy" />
                  </div>
                  <h3 className="font-bold text-sm mb-1">Our Values</h3>
                  <p className="text-navy/60 text-xs leading-relaxed">
                    Innovation, Excellence, Integrity, Collaboration, and
                    Client Success.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Company History / Timeline */}
      <section className="pb-16 sm:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Our <span className="gradient-text">Journey</span>
            </h2>
            <p className="text-lg text-navy/70 max-w-2xl mx-auto">
              Key milestones in our growth and innovation.
            </p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            {/* Timeline line */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-navy/15"></div>

            <div className="space-y-6 md:space-y-8">
              {companyHistory.map((event, index) => {
                const iconMap: Record<string, React.ReactNode> = {
                  Rocket: <Rocket className="h-4 w-4" />,
                  Handshake: <Handshake className="h-4 w-4" />,
                  Layers: <Layers className="h-4 w-4" />,
                  Building: <Building className="h-4 w-4" />,
                  Trophy: <Trophy className="h-4 w-4" />,
                  Brain: <Brain className="h-4 w-4" />,
                }
                return (
                  <motion.div
                    key={index}
                    custom={index}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    className={`relative flex items-center ${
                      index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                    } flex-col md:flex-row`}
                  >
                    {/* Content */}
                    <div
                      className={`w-full md:w-[calc(50%-2rem)] ${
                        index % 2 === 0 ? "md:text-right md:pr-10" : "md:text-left md:pl-10"
                      }`}
                    >
                      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-navy/10 hover:shadow-[0_4px_24px_rgba(0,0,128,0.08)] transition-shadow duration-300 inline-flex md:float-none">
                        <div className="w-9 h-9 rounded-full bg-navy/10 flex items-center justify-center text-navy flex-shrink-0">
                          {iconMap[event.icon]}
                        </div>
                        <div className={index % 2 === 0 ? "md:text-right" : ""}>
                          <p className="text-xs font-semibold text-navy/50">{event.year}</p>
                          <p className="text-sm font-bold text-navy leading-tight">{event.title}</p>
                        </div>
                      </div>
                    </div>

                    {/* Dot */}
                    <div className="hidden md:flex relative my-4 md:my-0">
                      <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white text-xs z-10 shadow-lg">
                        {event.year.toString().slice(-2)}
                      </div>
                    </div>

                    {/* Mobile dot */}
                    <div className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-navy -translate-x-1"></div>

                    <div className="hidden md:block md:w-[calc(50%-2rem)]"></div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="pb-16 sm:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Our <span className="gradient-text">Leadership</span>
            </h2>
            <p className="text-lg text-navy/70 max-w-2xl mx-auto">
              Meet the experts driving innovation and excellence at
              QuardCubeLabs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.id}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                className="group"
              >
                <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden hover:shadow-[0_8px_40px_rgba(0,0,128,0.1)] transition-all duration-300 flex flex-col h-full">
                  {/* Image */}
                  <div className="relative flex-1 min-h-[300px] overflow-hidden">
                    <Image
                      src={member.image || "/placeholder.svg"}
                      alt={member.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      style={{ objectPosition: "center 20%" }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-5 sm:p-6">
                    <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                    <p className="text-brand-red text-sm font-medium mb-3">{member.role}</p>
                    <p className="text-navy/60 text-sm leading-relaxed mb-4 line-clamp-2">{member.bio}</p>

                    {/* Social links */}
                    <div className="flex gap-2">
                      {member.socialMedia.whatsapp && (
                        <a
                          href={member.socialMedia.whatsapp}
                          className="w-9 h-9 rounded-full bg-navy/5 flex items-center justify-center text-navy hover:bg-navy hover:text-white transition-colors"
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
                          className="w-9 h-9 rounded-full bg-navy/5 flex items-center justify-center text-navy hover:bg-navy hover:text-white transition-colors"
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
                          className="w-9 h-9 rounded-full bg-navy/5 flex items-center justify-center text-navy hover:bg-navy hover:text-white transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="pb-16 sm:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-lg text-navy/70 max-w-2xl mx-auto">
              Find answers to common questions about our services and approach.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-20px" }}
                  variants={fadeUp}
                >
                  <div
                    className={`bg-white rounded-xl border transition-all duration-300 ${
                      openFaq === index
                        ? "border-navy/30 shadow-[0_4px_24px_rgba(0,0,128,0.08)]"
                        : "border-navy/10 hover:border-navy/20"
                    }`}
                  >
                    <button
                      className="flex justify-between items-center w-full p-5 text-left gap-4"
                      onClick={() => toggleFaq(index)}
                    >
                      <h3 className="text-sm sm:text-base font-semibold text-navy">{faq.question}</h3>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                        openFaq === index ? "bg-navy text-white" : "bg-navy/10 text-navy"
                      }`}>
                        {openFaq === index ? (
                          <Minus className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </div>
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        openFaq === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="px-5 pb-5">
                        <p className="text-sm text-navy/60 leading-relaxed">{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
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
                  Ready to Work With Us?
                </h2>
                <p className="text-navy/70 mb-6 leading-relaxed">
                  Let&apos;s discuss how we can help your business thrive in
                  the digital landscape. Our team is ready to bring your vision
                  to life.
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
                  <a href="tel:+255652540496" className="text-navy/70 text-sm hover:text-brand-red transition-colors block">
                    +255 652 540 496
                  </a>
                  <a href="tel:+255623893383" className="text-navy/70 text-sm hover:text-brand-red transition-colors block">
                    +255 623 893 383
                  </a>
                </div>
                <div className="bg-navy/5 rounded-xl p-4">
                  <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center mb-3">
                    <Mail className="h-5 w-5 text-navy" />
                  </div>
                  <h3 className="font-semibold text-navy text-sm mb-1">Email Us</h3>
                  <a href="mailto:info@quardcubelabs.co.tz" className="text-navy/70 text-sm hover:text-brand-red transition-colors block">
                    info@quardcubelabs.co.tz
                  </a>
                  <a href="mailto:support@quardcubelabs.co.tz" className="text-navy/70 text-sm hover:text-brand-red transition-colors block">
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
