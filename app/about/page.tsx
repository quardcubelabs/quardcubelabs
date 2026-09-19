"use client"

import { motion, useInView } from "framer-motion"
import { teamMembers, companyHistory, faqs } from "@/lib/data"
import Footer from "@/components/footer"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Plus, Minus, Phone, Mail, MessageSquare, Users, Award, Briefcase, Target, ChevronDown, Rocket, Handshake, Layers, Building, Trophy, Brain } from "lucide-react"
import { FaWhatsapp, FaInstagram, FaXTwitter, FaLinkedinIn } from "react-icons/fa6"
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
                    <div className="flex flex-wrap gap-2.5">
                      {member.socialMedia?.whatsapp && (
                        <a
                          href={member.socialMedia.whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-teal-200 hover:bg-navy hover:text-white transition-all duration-300 text-navy"
                          aria-label={`${member.name}'s WhatsApp`}
                        >
                          <FaWhatsapp className="h-4 w-4 sm:h-5 sm:w-5" />
                        </a>
                      )}
                      {member.socialMedia?.instagram && (
                        <a
                          href={member.socialMedia.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-teal-200 hover:bg-navy hover:text-white transition-all duration-300 text-navy"
                          aria-label={`${member.name}'s Instagram`}
                        >
                          <FaInstagram className="h-4 w-4 sm:h-5 sm:w-5" />
                        </a>
                      )}
                      {member.socialMedia?.twitter && (
                        <a
                          href={member.socialMedia.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-teal-200 hover:bg-navy hover:text-white transition-all duration-300 text-navy"
                          aria-label={`${member.name}'s X / Twitter`}
                        >
                          <FaXTwitter className="h-4 w-4 sm:h-5 sm:w-5" />
                        </a>
                      )}
                      {(member.socialMedia as any)?.linkedin && (
                        <a
                          href={(member.socialMedia as any).linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-teal-200 hover:bg-navy hover:text-white transition-all duration-300 text-navy"
                          aria-label={`${member.name}'s LinkedIn`}
                        >
                          <FaLinkedinIn className="h-4 w-4 sm:h-5 sm:w-5" />
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
