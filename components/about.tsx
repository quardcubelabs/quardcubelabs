"use client"

import { motion } from "framer-motion"
import { CheckCircle } from "lucide-react"
import Image from "next/image"

export default function About() {
  return (
    <section id="about" className="py-16 sm:py-20 md:py-24 relative bg-white/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-navy/20 to-brand-red/20 rounded-2xl blur-xl opacity-50"></div>
            <div className="relative rounded-2xl overflow-hidden border-2 border-navy/30">
              <Image
                src="/Quardcubelabs_01.png"
                alt="QuardCubeLabs team"
                width={800}
                height={600}
                className="w-full h-auto"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-navy/50 to-transparent h-1/3"></div>
              <div className="absolute bottom-4 left-4 bg-brand-red text-white px-4 py-2 rounded-lg font-medium">
                Since 2008
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
              About <span className="gradient-text">QuardCubeLabs</span>
            </h2>

            <p className="text-base sm:text-lg text-navy mb-4 sm:mb-6">
              QuardCubeLabs is a leading IT solutions provider with a mission to empower businesses through innovative
              technology. Founded in 2008, we've been at the forefront of digital transformation, helping organizations
              of all sizes navigate the complex technology landscape.
            </p>

            <p className="text-navy/80 mb-8">
              Our team of experts brings together decades of experience across various technology domains, allowing us
              to deliver comprehensive solutions that address the unique challenges of each client. We pride ourselves
              on our commitment to excellence, innovation, and customer satisfaction.
            </p>

            <div className="space-y-4 mb-8">
              {[
                "Cutting-edge technology solutions",
                "Dedicated expert support team",
                "Customized approach for each client",
                "Continuous innovation and improvement",
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-brand-red mt-0.5 flex-shrink-0" />
                  <span className="text-navy/80">{item}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4 sm:gap-x-6 sm:gap-y-4">
              <div>
                <p className="text-2xl sm:text-3xl font-semibold text-navy">50+</p>
                <p className="mt-1 text-xs sm:text-sm leading-5 sm:leading-6 text-navy/70">Team Members</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-semibold text-navy">200+</p>
                <p className="mt-1 text-xs sm:text-sm leading-5 sm:leading-6 text-navy/70">Projects Completed</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-semibold text-navy">15+</p>
                <p className="mt-1 text-xs sm:text-sm leading-5 sm:leading-6 text-navy/70">Years Experience</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-semibold text-navy">98%</p>
                <p className="mt-1 text-xs sm:text-sm leading-5 sm:leading-6 text-navy/70">Client Satisfaction</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
