"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function CTA() {
  return (
    <section className="py-16 sm:py-20 md:py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-amber-500 opacity-90"></div>
          <div className="absolute inset-0 noise-bg opacity-10"></div>

          <div className="relative z-10 py-12 sm:py-16 md:py-24 px-6 sm:px-8 md:px-16 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-white">
              Ready to Transform Your Business?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-3xl mx-auto mb-6 sm:mb-8">
              Let's work together to create innovative solutions that drive your business forward in the digital age.
            </p>
            <Button className="bg-white text-primary hover:bg-white/90 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-full">
              Get Started Today <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
