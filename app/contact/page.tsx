"use client"

import type { Metadata } from "next"



import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { MapPin, Phone, Mail, Send, Facebook, Twitter, Linkedin, Instagram, Youtube } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import GoogleMap from "@/components/google-map"
import { submitContactForm } from "@/lib/actions"
import { useToast } from "@/components/ui/use-toast"

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

        // Reset form
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
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
      <Navbar />

      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">
              Get in <span className="gradient-text">Touch</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-navy/80 max-w-3xl mx-auto">
              Have a project in mind or want to learn more about our services? We'd love to hear from you!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="p-8 rounded-2xl  bg-white backdrop-blur-sm h-full">
                <h2 className="text-2xl font-bold mb-6 text-navy">Contact Information</h2>

                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-navy/100 text-white hover:bg-navy/20 transition-colors duration-300">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-1 text-navy">Our Location</h3>
                      <p className="text-navy/70">
                        Dar es Salaam, Tanzania
                        <br />
                        <span className="text-sm italic">QuardCube Labs Headquarters</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-navy/100 text-white hover:bg-navy/20 transition-colors duration-300">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-1 text-navy">Call Us</h3>
                      <p className="text-navy/70">
                        +255 652 540 496
                        <br />
                        +255 623 893 383
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-navy/100 text-white hover:bg-navy/20 transition-colors duration-300">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-1 text-navy">Email Us</h3>
                      <p className="text-navy/70">
                        info@quardcubelabs.com
                        <br />
                        support@quardcubelabs.com
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-12">
                  <h3 className="text-lg font-medium mb-4 text-navy">Business Hours</h3>
                  <div className="space-y-2 text-navy/70">
                    <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                    <p>Saturday: 10:00 AM - 4:00 PM</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>

                <div className="mt-12">
                  <h3 className="text-lg font-medium mb-4 text-navy">Follow Us</h3>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="#"
                      className="p-2 rounded-full bg-navy/10 hover:bg-navy hover:text-white transition-all duration-300 text-navy"
                      aria-label="Facebook"
                    >
                      <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
                    </a>
                    <a
                      href="#"
                      className="p-2 rounded-full bg-navy/10 hover:bg-navy hover:text-white transition-all duration-300 text-navy"
                      aria-label="Twitter"
                    >
                      <Twitter className="h-4 w-4 sm:h-5 sm:w-5" />
                    </a>
                    <a
                      href="#"
                      className="p-2 rounded-full bg-navy/10 hover:bg-navy hover:text-white transition-all duration-300 text-navy"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="h-4 w-4 sm:h-5 sm:w-5" />
                    </a>
                    <a
                      href="#"
                      className="p-2 rounded-full bg-navy/10 hover:bg-navy hover:text-white transition-all duration-300 text-navy"
                      aria-label="Instagram"
                    >
                      <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
                    </a>
                    <a
                      href="#"
                      className="p-2 rounded-full bg-navy/10 hover:bg-navy hover:text-white transition-all duration-300 text-navy"
                      aria-label="YouTube"
                    >
                      <Youtube className="h-4 w-4 sm:h-5 sm:w-5" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="p-8 rounded-2xl  bg-navy/10 backdrop-blur-sm">
                <h2 className="text-2xl font-bold mb-6 text-navy">Send Us a Message</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-navy">
                        Your Name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        value={formState.name}
                        onChange={handleChange}
                        required
                        className="bg-white border-navy/20 focus:border-navy "
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-navy">
                        Your Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formState.email}
                        onChange={handleChange}
                        required
                        className="bg-white border-navy/20 focus:border-navy"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-navy">
                      Subject
                    </Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="How can we help you?"
                      value={formState.subject}
                      onChange={handleChange}
                      required
                      className="bg-white border-navy/20 focus:border-navy"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-navy">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Tell us about your project..."
                      value={formState.message}
                      onChange={handleChange}
                      required
                      className="min-h-[150px] bg-white border-navy/20 focus:border-navy"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-navy hover:bg-navy/90 text-white border-0 flex items-center justify-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"} <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>

          {/* Google Maps Section */}
          <motion.div 
            className="mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-navy mb-2">Find Us on the Map</h2>
              <p className="text-navy/70">QuardCube Labs Headquarters - Dar es Salaam, Tanzania</p>
            </div>
            
            <div className="rounded-2xl overflow-hidden border-2 border-navy/20">
              <GoogleMap
                center={{ lat: -6.8001, lng: 39.2834 }} // Dar es Salaam coordinates
                zoom={15}
                className="w-full h-96"
              />
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-navy/70 mb-2">
                <span className="font-medium">Address:</span> Dar es Salaam, Tanzania
              </p>
              <p className="text-xs text-navy/50">
                Visit us at our headquarters for all your IT solution needs
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
