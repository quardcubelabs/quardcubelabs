"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { MapPin, Phone, Mail, Send, Clock, Facebook, Linkedin, Instagram, Youtube, ArrowRight, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Footer from "@/components/footer"
import GoogleMap from "@/components/google-map"
import { submitContactForm } from "@/lib/actions"
import { useToast } from "@/components/ui/use-toast"

const contactInfo = [
  {
    icon: MapPin,
    title: "Visit Us",
    lines: ["24 Ferry, Kigamboni", "Kigamboni, Dar es Salaam 17101, Tanzania"],
  },
  {
    icon: Phone,
    title: "Call Us",
    lines: ["+255 652 540 496", "+255 623 893 383"],
  },
  {
    icon: Mail,
    title: "Email Us",
    lines: ["info@quardcubelabs.co.tz", "support@quardcubelabs.co.tz"],
  },
]

const businessHours = [
  { day: "Monday - Friday", hours: "9:00 AM - 6:00 PM" },
  { day: "Saturday", hours: "10:00 AM - 4:00 PM" },
  { day: "Sunday", hours: "Closed" },
]

const socialLinks = [
  { icon: Facebook, label: "Facebook", href: "https://www.facebook.com/share/1EZ4tcGJnw/?mibextid=wwXIfr" },
  { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/in/quardcube-labs-13431241a/" },
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/quardcubelabs?igsh=cjJ0bHViYW84anJp&utm_source=qr" },
  { icon: Youtube, label: "YouTube", href: "https://www.youtube.com/channel/UC4CN_47KDUc-ucmQR1xLkqA" },
]

export default function ContactPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      Object.entries(formState).forEach(([key, value]) => {
        formData.append(key, value)
      })

      const result = await submitContactForm(formData)

      if (result.success) {
        toast({
          title: "Message Sent",
          description: result.message,
        })

        setFormState({
          name: "",
          email: "",
          subject: "",
          message: "",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-teal">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>

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
              <MessageSquare className="h-4 w-4 text-navy" />
              <span className="text-sm font-semibold text-navy">Contact Us</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-navy mb-6 leading-tight">
              Let&apos;s Build Something{" "}
              <span className="gradient-text">Great Together</span>
            </h1>
            <p className="text-lg sm:text-xl text-navy/70 max-w-2xl mx-auto leading-relaxed">
              Ready to transform your business with innovative IT solutions?
              Reach out to us and let&apos;s start a conversation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-16 sm:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">

            {/* Left Column - Contact Info + Business Hours (2 cols) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Contact Info Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,128,0.08)] border border-navy/5"
              >
                <h2 className="text-xl font-bold text-navy mb-6 pb-4 border-b border-navy/10">
                  Contact Information
                </h2>

                <div className="space-y-6">
                  {contactInfo.map((item) => (
                    <div key={item.title} className="flex items-start gap-4 group">
                      <div className="p-3 rounded-xl bg-navy text-white group-hover:bg-navy/90 transition-colors duration-300 flex-shrink-0">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-navy mb-1 uppercase tracking-wide">
                          {item.title}
                        </h3>
                        <div className="space-y-0.5">
                          {item.lines.map((line, i) => (
                            <p key={i} className="text-sm text-navy/60">
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Business Hours Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,128,0.08)] border border-navy/5"
              >
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-navy/10">
                  <Clock className="h-5 w-5 text-navy" />
                  <h2 className="text-xl font-bold text-navy">Business Hours</h2>
                </div>

                <div className="space-y-3">
                  {businessHours.map((item) => (
                    <div key={item.day} className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-navy/70">{item.day}</span>
                      <span className={`text-sm font-semibold ${item.hours === "Closed" ? "text-brand-red" : "text-navy"}`}>
                        {item.hours}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Social Links Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,128,0.08)] border border-navy/5"
              >
                <h2 className="text-xl font-bold text-navy mb-6 pb-4 border-b border-navy/10">
                  Follow Us
                </h2>
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      className="p-3 rounded-xl bg-teal-200 hover:bg-navy hover:text-white transition-all duration-300 text-navy"
                      aria-label={social.label}
                    >
                      <social.icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Form (3 cols) */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl p-6 sm:p-8 lg:p-10 shadow-[0_4px_24px_rgba(0,0,128,0.08)] border border-navy/5"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-navy mb-2">Send Us a Message</h2>
                  <p className="text-sm text-navy/60">
                    Fill out the form below and we&apos;ll get back to you within 24 hours.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold text-navy">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        value={formState.name}
                        onChange={handleChange}
                        required
                        className="h-12 bg-teal/30 border-navy/10 focus:border-navy focus:ring-navy/20 rounded-xl text-navy placeholder:text-navy/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold text-navy">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formState.email}
                        onChange={handleChange}
                        required
                        className="h-12 bg-teal/30 border-navy/10 focus:border-navy focus:ring-navy/20 rounded-xl text-navy placeholder:text-navy/40"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-semibold text-navy">
                      Subject
                    </Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="How can we help you?"
                      value={formState.subject}
                      onChange={handleChange}
                      required
                      className="h-12 bg-teal/30 border-navy/10 focus:border-navy focus:ring-navy/20 rounded-xl text-navy placeholder:text-navy/40"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-semibold text-navy">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Tell us about your project, requirements, or any questions you have..."
                      value={formState.message}
                      onChange={handleChange}
                      required
                      className="min-h-[160px] bg-teal/30 border-navy/10 focus:border-navy focus:ring-navy/20 rounded-xl text-navy placeholder:text-navy/40 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-navy hover:bg-navy/90 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-navy/20 hover:shadow-navy/30"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="pb-16 sm:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,128,0.08)] border border-navy/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-navy text-white">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-navy">Find Us on the Map</h2>
                  <p className="text-sm text-navy/60">QuardCube Labs Headquarters - Dar es Salaam, Tanzania</p>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden border border-navy/10">
                <GoogleMap
                  center={{ lat: -6.8001, lng: 39.2834 }}
                  zoom={15}
                  className="w-full h-[350px] sm:h-[400px]"
                />
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-sm text-navy/60">
                  <span className="font-semibold text-navy">Address:</span> 24 Ferry, Kigamboni, Dar es Salaam
                </p>
                <p className="text-xs text-navy/40">
                  Visit us at our headquarters for all your IT solution needs
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
