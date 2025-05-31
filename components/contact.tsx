"use client"

import { motion } from "framer-motion"
import { MapPin, Phone, Mail } from "lucide-react"

export default function Contact() {
  return (
    <section id="contact" className="py-16 sm:py-20 md:py-24 relative bg-white/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">
              Get in <span className="gradient-text">Touch</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="text-base sm:text-lg md:text-xl text-navy/80 max-w-3xl mx-auto">
              Have a project in mind or want to learn more about our services? We'd love to hear from you!
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="p-6 sm:p-8 rounded-2xl border-2 border-navy/20 bg-white/50 backdrop-blur-sm">
            <h3 className="text-2xl font-bold mb-6 text-navy">Contact Information</h3>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-teal-200 text-navy">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-medium mb-1 text-navy">Our Location</h4>
                  <p className="text-navy/70">
                    123 Tech Park, Innovation Street
                    <br />
                    Kigamboni, Dar es Salaam 17101, Tanzania
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-teal-200 text-navy">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-medium mb-1 text-navy">Call Us</h4>
                  <p className="text-navy/70">
                    +255 652 540 496
                    <br />
                    +255 623 893 383
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-teal-200 text-navy">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-medium mb-1 text-navy">Email Us</h4>
                  <p className="text-navy/70">
                    info@quardcubelabs.com
                    <br />
                    support@quardcubelabs.com
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
