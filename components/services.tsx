"use client"

import { motion } from "framer-motion"
import { Code, Server, Monitor, Bot, Sparkles, Camera, Eye } from "lucide-react"
import Image from "next/image"

const services = [
   {
    icon: <Bot className="h-8 w-8 md:h-10 md:w-10" />,
    title: "Corporate AI Automation",
    description: "Enterprise-grade AI automation solutions that streamline workflows, optimize operations, and boost productivity across your organization.",
    image: "/images/services/cooperate_ai.JPG",
    alt: "Corporate AI Automation"
  },
  {
    icon: <Sparkles className="h-8 w-8 md:h-10 md:w-10" />,
    title: "Personalized AI Automations",
    description: "Custom AI-powered automation tailored to your unique needs — from chatbots and virtual assistants to intelligent document processing.",
    image: "/images/services/personalized ai automation.jpg",
    alt: "Personalized AI Automations"
  },
  {
    icon: <Camera className="h-8 w-8 md:h-10 md:w-10" />,
    title: "CCTV Camera Installations",
    description: "Professional CCTV camera installation services for homes, offices, and commercial properties with remote monitoring and HD surveillance.",
    image: "/images/services/cctv camera installations.jpg",
    alt: "CCTV Camera Installations"
  },
  {
    icon: <Code className="h-8 w-8 md:h-10 md:w-10" />,
    title: "Software Development",
    description:
      "Custom software solutions tailored to your business needs, from web applications to enterprise systems.",
    image: "/images/services/custom software.jpg",
    alt: "Software Development"
  },
  {
    icon: <Monitor className="h-8 w-8 md:h-10 md:w-10" />,
    title: "Web Designing",
    description: "Stunning, responsive websites with modern UI/UX that captivate your audience and drive conversions.",
    image: "/images/services/web designing.jpg",
    alt: "Web Design"
  },
  {
    icon: <Server className="h-8 w-8 md:h-10 md:w-10" />,
    title: "IT Products & Services",
    description: "Standard IT products and services to support your business operations and technology needs.",
    image: "/images/services/it consulting.jpg",
    alt: "IT Products & Services"
  },
]

export default function Services() {
  return (
    <section id="services" className="py-16 sm:py-20 md:py-24 relative bg-white/30">
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

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-6 lg:gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="relative h-full rounded-xl sm:rounded-2xl border-2 border-navy/20 bg-white overflow-hidden transition-all duration-300 hover:border-navy hover:shadow-lg">
                <div className="relative h-24 xs:h-28 sm:h-36 md:h-48 w-full overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.alt}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="text-white text-center">
                      <Eye className="h-5 w-5 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2" />
                    </div>
                  </div>
                </div>
                
                <div className="relative z-10 p-2.5 xs:p-3.5 sm:p-5 md:p-6">
                  <div className="mb-1.5 sm:mb-2 p-1.5 xs:p-2 md:p-4 rounded-lg sm:rounded-xl bg-teal-200 w-fit shadow-xs sm:shadow-lg">
                    <div className="text-navy group-hover:text-brand-red transition-colors duration-300 [&>svg]:h-5 [&>svg]:w-5 sm:[&>svg]:h-8 sm:[&>svg]:w-8 md:[&>svg]:h-10 md:[&>svg]:w-10">
                      {service.icon}
                    </div>
                  </div>
                  <h3 className="font-bold mb-0.5 sm:mb-1 md:mb-3 text-xs xs:text-sm sm:text-lg md:text-xl text-navy leading-snug line-clamp-2">{service.title}</h3>
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
