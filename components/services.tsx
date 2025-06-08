"use client"

import { motion } from "framer-motion"
import { Code, Shield, Zap, Wifi, Monitor, Server } from "lucide-react"
import Image from "next/image"

const services = [
  {
    icon: <Code className="h-8 w-8 md:h-10 md:w-10" />,
    title: "Software Development",
    description:
      "Custom software solutions tailored to your business needs, from web applications to enterprise systems.",
    image: "/images/services/software-development.jpeg",
    alt: "Software Development"
  },
  {
    icon: <Monitor className="h-8 w-8 md:h-10 md:w-10" />,
    title: "Web Designing",
    description: "Stunning, responsive websites with modern UI/UX that captivate your audience and drive conversions.",
    image: "/images/services/web-design.jpeg",
    alt: "Web Design"
  },
  {
    icon: <Zap className="h-8 w-8 md:h-10 md:w-10" />,
    title: "Power Solutions",
    description: "Reliable power management systems and solutions to keep your infrastructure running efficiently.",
    image: "/images/services/power-solutions.jpg",
    alt: "Power Solutions"
  },
  {
    icon: <Shield className="h-8 w-8 md:h-10 md:w-10" />,
    title: "Security Products",
    description: "Comprehensive security solutions to protect your digital assets and infrastructure from threats.",
    image: "/images/services/security.jpg",
    alt: "Security Products"
  },
  {
    icon: <Wifi className="h-8 w-8 md:h-10 md:w-10" />,
    title: "Connectivity & Networking",
    description: "Robust networking solutions that ensure seamless connectivity across your organization.",
    image: "/images/services/networking.jpg",
    alt: "Connectivity & Networking"
  },
  {
    icon: <Server className="h-8 w-8 md:h-10 md:w-10" />,
    title: "IT Products & Services",
    description: "Standard IT products and services to support your business operations and technology needs.",
    image: "/images/services/it-services.jpg",
    alt: "IT Products & Services"
  },
]

export default function Services() {
  return (
    <section id="services" className="py-16 sm:py-20 md:py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">
              Comprehensive <span className="gradient-text">IT Solutions</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="text-base sm:text-lg md:text-xl text-navy/80 max-w-3xl mx-auto">
              We offer a wide range of IT services designed to transform your business and drive innovation
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="relative h-full rounded-2xl border-2 border-navy/20 bg-white/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-navy hover:shadow-lg">
                <div className="relative h-32 md:h-48 w-full overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.alt}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
                
                <div className="relative z-10 p-3 md:p-6">
                  <div className="mb-2 p-2 md:p-4 rounded-xl bg-teal-200 w-fit -mt-8 md:-mt-12 shadow-lg">
                    <div className="text-navy group-hover:text-brand-red transition-colors duration-300">
                      {service.icon}
                    </div>
                  </div>
                  <h3 className="font-bold mb-1 md:mb-3 text-lg sm:text-xl text-navy">{service.title}</h3>
                  <p className="text-navy/70 hidden sm:block text-sm sm:text-base md:text-base">{service.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
