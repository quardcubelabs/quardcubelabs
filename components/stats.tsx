"use client"

import { motion } from "framer-motion"
import { Users, Briefcase, Award, CheckCircle } from "lucide-react"

const stats = [
  { icon: <Users className="h-6 w-6" />, value: "50+", label: "Team Members" },
  { icon: <Briefcase className="h-6 w-6" />, value: "200+", label: "Projects Completed" },
  { icon: <Award className="h-6 w-6" />, value: "15+", label: "Years Experience" },
  { icon: <CheckCircle className="h-6 w-6" />, value: "98%", label: "Client Satisfaction" },
]

export default function Stats() {
  return (
    <section className="py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative py-12 sm:py-16 px-6 sm:px-8 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-amber-500/20 opacity-50"></div>
          <div className="absolute inset-0 noise-bg opacity-30"></div>

          <div className="relative z-10 grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-white/10 text-primary">{stat.icon}</div>
                </div>
                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-white/70">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
