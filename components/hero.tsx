"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Logo from "@/components/logo"
import Link from "next/link"

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20">
      <div className="container mx-auto px-4 relative z-10 py-20 md:py-32">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex flex-col items-center"
          >
            <div className="mb-6 animate-float">
              <Logo size="lg" />
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Innovative IT Solutions for the <span className="gradient-text">Digital Future</span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="text-xl text-navy/80 mb-8 max-w-3xl">
              QuardCubeLabs delivers cutting-edge technology solutions that transform businesses and drive innovation in
              the digital landscape.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/services">
              <Button className="bg-navy hover:bg-navy/90 text-white text-lg px-8 py-6 rounded-full">
                Explore Our Services
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="text-navy border-navy hover:bg-navy/10 text-lg px-8 py-6 rounded-full">
                Contact Us <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-16 w-full"
          >
            <div className="relative rounded-2xl overflow-hidden border-2 border-navy shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-navy/10 to-brand-red/10 opacity-30"></div>
              <div className="w-full aspect-[16/9] bg-white/50 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block p-3 rounded-full bg-navy/10 mb-4">
                    <div className="w-16 h-16 rounded-full bg-navy flex items-center justify-center">
                      <span className="text-2xl text-white">▶</span>
                    </div>
                  </div>
                  <p className="text-navy/80">Watch our company overview</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
