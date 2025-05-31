"use client"

import { motion } from "framer-motion"
import Image from "next/image"

// Partner logos
const partners = [
  {
    name: "TechCorp",
    logo: "/eagle-tech-corp.png",
  },
  {
    name: "InnovateTech",
    logo: "/quard-03.png",
  },
  {
    name: "GlobalSystems",
    logo: "/quard-01.png",
  },
  {
    name: "FutureSoft",
    logo: "/eagle-tech-corp.png",
  },
  {
    name: "DataDynamics",
    logo: "/quard-03.png",
  },
  {
    name: "CloudNexus",
    logo: "/quard-01.png",
  },
]

export default function Partners() {
  return (
    <section className="py-16 sm:py-20 md:py-24 bg-teal">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">
            Working with <span className="gradient-text">Industry Leaders</span>
          </h2>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-navy/80">
            We collaborate with leading technology companies to deliver the best solutions for our clients
          </p>
        </motion.div>

        <div className="mx-auto mt-10 sm:mt-16 grid grid-cols-2 sm:grid-cols-3 items-center gap-x-6 gap-y-8 sm:gap-x-8 sm:gap-y-10 lg:gap-x-10 lg:gap-y-12">
          {partners.map((partner, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 128, 0.1), 0 8px 10px -6px rgba(0, 0, 128, 0.1)",
              }}
              className="col-span-1 flex justify-center"
            >
              <div className="relative h-20 w-full overflow-hidden rounded-lg p-3 flex items-center justify-center transition-all duration-300">
                <Image
                  src={partner.logo || "/placeholder.svg"}
                  alt={partner.name}
                  width={180}
                  height={80}
                  className="object-contain max-h-16"
                  priority={i === 0}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
