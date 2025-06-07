"use client"

import { motion } from "framer-motion"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, Building, ChartBar, Clock, Users } from "lucide-react"
import Image from "next/image"

const caseStudies = [
  {
    id: 1,
    title: "Digital Transformation for Regional Bank",
    client: "East African Bank",
    industry: "Banking & Finance",
    duration: "12 months",
    team: "15 members",
    challenge: "Modernize legacy systems and improve customer experience",
    solution: "Implemented a comprehensive digital banking platform with mobile app integration",
    results: [
      "40% increase in digital transactions",
      "65% improvement in customer satisfaction",
      "30% reduction in operational costs"
    ],
    image: "/images/case-studies/banking.jpg"
  },
  {
    id: 2,
    title: "Smart Grid Implementation",
    client: "National Power Utility",
    industry: "Energy",
    duration: "18 months",
    team: "20 members",
    challenge: "Optimize power distribution and reduce energy losses",
    solution: "Deployed smart grid technology with real-time monitoring and analytics",
    results: [
      "25% reduction in power losses",
      "40% improvement in outage response time",
      "35% increase in operational efficiency"
    ],
    image: "/images/case-studies/smart-grid.jpg"
  },
  {
    id: 3,
    title: "Healthcare Data Management System",
    client: "Regional Medical Center",
    industry: "Healthcare",
    duration: "9 months",
    team: "12 members",
    challenge: "Streamline patient data management and improve care coordination",
    solution: "Developed an integrated healthcare management system with AI-powered analytics",
    results: [
      "50% reduction in administrative time",
      "45% improvement in patient care coordination",
      "60% increase in data accuracy"
    ],
    image: "/images/case-studies/healthcare.jpg"
  }
]

export default function CaseStudiesPage() {
  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
      <Navbar />

      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">
              Case <span className="gradient-text">Studies</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-navy/80 max-w-3xl mx-auto">
              Explore how we've helped organizations transform their operations and achieve their goals
            </p>
          </div>

          <div className="space-y-16">
            {caseStudies.map((study, index) => (
              <motion.div
                key={study.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/50 rounded-2xl border-2 border-navy/20 overflow-hidden"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="relative h-64 lg:h-full">
                    <Image
                      src={study.image}
                      alt={study.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-8">
                    <div className="flex flex-wrap gap-4 mb-6">
                      <span className="px-3 py-1 bg-navy/10 rounded-full text-sm">
                        {study.industry}
                      </span>
                      <div className="flex items-center gap-2 text-navy/60">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{study.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-navy/60">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">{study.team}</span>
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{study.title}</h2>
                    <div className="flex items-center gap-2 text-navy/60 mb-6">
                      <Building className="h-4 w-4" />
                      <span>{study.client}</span>
                    </div>
                    <div className="space-y-4 mb-6">
                      <div>
                        <h3 className="font-semibold mb-2">Challenge</h3>
                        <p className="text-navy/80">{study.challenge}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Solution</h3>
                        <p className="text-navy/80">{study.solution}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Results</h3>
                        <ul className="space-y-2">
                          {study.results.map((result, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <ChartBar className="h-4 w-4 text-brand-red" />
                              <span className="text-navy/80">{result}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <Button className="bg-navy hover:bg-navy/90 text-white rounded-full">
                      Read Full Case Study <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Start Your Project?</h2>
            <p className="text-navy/80 mb-8 max-w-2xl mx-auto">
              Let's discuss how we can help transform your business with innovative technology solutions.
            </p>
            <Button className="bg-navy hover:bg-navy/90 text-white rounded-full px-8 py-6 text-lg">
              Contact Us <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
} 