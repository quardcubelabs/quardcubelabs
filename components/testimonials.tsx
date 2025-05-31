"use client"

import { motion } from "framer-motion"
import Image from "next/image"

const testimonials = [
  {
    content:
      "QuardCubeLabs transformed our business with their innovative software solutions. Their team's expertise and dedication exceeded our expectations.",
    author: "Sarah Johnson",
    role: "CTO, TechVision Inc.",
    image: "/client 01.jpg",
  },
  {
    content:
      "The web design team at QuardCubeLabs created a stunning website that perfectly captures our brand identity and has significantly increased our online conversions.",
    author: "Michael Chen",
    role: "Marketing Director, Nexus Brands",
    image: "/client 02.jpg",
  },
  {
    content:
      "Their security solutions have given us peace of mind. We've seen a 90% reduction in security incidents since implementing their recommendations.",
    author: "David Rodriguez",
    role: "CISO, Global Finance Group",
    image: "/client 03.jpg",
  },
]

export default function Testimonials() {
  return (
    <section className="py-16 sm:py-20 md:py-32 bg-white/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">
            What Our <span className="gradient-text">Clients Say</span>
          </h2>
        </div>
        <div className="mx-auto mt-10 sm:mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col justify-between rounded-2xl bg-white p-8 shadow-xl border-2 border-navy/10"
            >
              <div>
                <div className="flex gap-x-3">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6 text-brand-red">
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 12L11 15L16 10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-lg font-semibold text-navy">Verified Client</span>
                </div>
                <p className="mt-6 text-base leading-7 text-navy/80">{testimonial.content}</p>
              </div>
              <div className="mt-8 flex items-center gap-x-4">
                <div className="h-12 w-12 rounded-full overflow-hidden relative">
                  <Image
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.author}
                    width={80}
                    height={80}
                    className="object-cover object-center"
                    style={{ objectPosition: "center 30%" }}
                  />
                </div>
                <div>
                  <div className="font-semibold text-navy">{testimonial.author}</div>
                  <div className="text-sm leading-6 text-navy/70">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
