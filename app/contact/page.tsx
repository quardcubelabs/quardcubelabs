"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { MapPin, Phone, Mail, Send, Facebook, Twitter, Linkedin, Instagram, Youtube, Navigation, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { submitContactForm } from "@/lib/actions"
import { useToast } from "@/components/ui/use-toast"

export default function ContactPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [location, setLocation] = useState<{
    latitude: number | null
    longitude: number | null
    city: string | null
    country: string | null
    loading: boolean
    error: string | null
  }>({
    latitude: null,
    longitude: null,
    city: null,
    country: null,
    loading: true,
    error: null
  })
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  // Get current location and update company address
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        if (!navigator.geolocation) {
          return
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes cache
          })
        })

        const { latitude, longitude } = position.coords

        // Get location details from coordinates
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          )
          const data = await response.json()
          
          setLocation({
            latitude,
            longitude,
            city: data.city || data.locality || "Unknown City",
            country: data.countryName || "Unknown Country",
            loading: false,
            error: null
          })

          // Update the company location display
          const locationElement = document.getElementById('company-location')
          if (locationElement) {
            const address = data.principalSubdivision 
              ? `${data.city || data.locality}, ${data.principalSubdivision}`
              : `${data.city || data.locality}, ${data.countryName}`
            
            locationElement.innerHTML = `
              ${address}
              <br />
              <span class="text-sm italic">QuardCube Labs Headquarters</span>
              <br />
              <span class="text-xs text-navy/50">Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}</span>
            `
          }
        } catch (geoError) {
          console.error('Geocoding error:', geoError)
        }
      } catch (error) {
        console.error('Location error:', error)
        setLocation(prev => ({
          ...prev,
          loading: false,
          error: "Unable to get location"
        }))
      }
    }

    getCurrentLocation()
  }, [])

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
              <div className="p-8 rounded-2xl border-2 border-navy/20 bg-white/50 backdrop-blur-sm h-full">
                <h2 className="text-2xl font-bold mb-6 text-navy">Contact Information</h2>

                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-navy/10 text-navy hover:bg-navy/20 transition-colors duration-300">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-1 text-navy">Our Location</h3>
                      <p className="text-navy/70" id="company-location">
                        Getting current location...
                        <br />
                        <span className="text-sm italic">QuardCube Labs Headquarters</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-navy/10 text-navy hover:bg-navy/20 transition-colors duration-300">
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
                    <div className="p-3 rounded-full bg-navy/10 text-navy hover:bg-navy/20 transition-colors duration-300">
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
              <div className="p-8 rounded-2xl border-2 border-navy/20 bg-white/50 backdrop-blur-sm">
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
                        className="bg-white/70 border-navy/20 focus:border-navy"
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
                        className="bg-white/70 border-navy/20 focus:border-navy"
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
                      className="bg-white/70 border-navy/20 focus:border-navy"
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
                      className="min-h-[150px] bg-white/70 border-navy/20 focus:border-navy"
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

          {/* Dynamic Map Section */}
          <motion.div 
            className="mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-navy mb-2">Find Us on the Map</h2>
              <p className="text-navy/70">QuardCube Labs Headquarters - Live Location</p>
            </div>
            
            <div className="rounded-2xl overflow-hidden border-2 border-navy/20 h-96 relative">
              {location.loading ? (
                <div className="flex items-center justify-center h-full bg-white/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
                    <span className="text-navy/70">Loading map with your location...</span>
                  </div>
                </div>
              ) : location.latitude !== null && location.longitude !== null ? (
                <>
                  <iframe
                    src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${location.latitude},${location.longitude}&zoom=15`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`QuardCube Labs Headquarters - ${location.city}, ${location.country}`}
                    onError={() => {
                      // Fallback to OpenStreetMap if Google Maps fails
                      const iframe = document.querySelector('iframe')
                      if (iframe && location.latitude && location.longitude) {
                        iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.01},${location.latitude - 0.01},${location.longitude + 0.01},${location.latitude + 0.01}&layer=mapnik&marker=${location.latitude},${location.longitude}`
                      }
                    }}
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-navy">Live HQ Location</span>
                    </div>
                    <p className="text-xs text-navy/70 mt-1">{location.city}, {location.country}</p>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full bg-white/50 backdrop-blur-sm">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 mx-auto text-navy/40 mb-4" />
                    <h3 className="text-lg font-medium text-navy mb-2">Location Access Needed</h3>
                    <p className="text-navy/70 mb-4">Enable location to see our headquarters on the map</p>
                    <Button 
                      onClick={() => window.location.reload()} 
                      className="bg-navy hover:bg-navy/90 text-white"
                    >
                      Enable Location
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {location.latitude !== null && location.longitude !== null && (
              <div className="mt-4 text-center">
                <p className="text-sm text-navy/70">
                  <span className="font-medium">Coordinates:</span> {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
                <p className="text-xs text-navy/50 mt-1">
                  This map shows the live location of QuardCube Labs headquarters
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
} 