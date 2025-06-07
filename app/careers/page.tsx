"use client"

import { motion } from "framer-motion"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, Briefcase, Users, Zap, Globe, Heart, Award } from "lucide-react"

const benefits = [
  {
    icon: <Briefcase className="h-8 w-8" />,
    title: "Competitive Compensation",
    description: "We offer competitive salaries and comprehensive benefits packages to attract and retain top talent."
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: "Collaborative Environment",
    description: "Work with talented individuals in a supportive and innovative team environment."
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: "Growth Opportunities",
    description: "Continuous learning and development opportunities to advance your career."
  },
  {
    icon: <Globe className="h-8 w-8" />,
    title: "Remote Flexibility",
    description: "Work from anywhere with our flexible remote work policies."
  },
  {
    icon: <Heart className="h-8 w-8" />,
    title: "Health & Wellness",
    description: "Comprehensive health coverage and wellness programs to support your well-being."
  },
  {
    icon: <Award className="h-8 w-8" />,
    title: "Recognition & Rewards",
    description: "Regular recognition and rewards for outstanding performance and contributions."
  }
]

const openPositions = [
  {
    title: "Senior Software Engineer",
    department: "Engineering",
    location: "Dar es Salaam, Tanzania",
    type: "Full-time",
    description: "We're looking for an experienced software engineer to join our core development team."
  },
  {
    title: "UX/UI Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
    description: "Join our design team to create beautiful and intuitive user experiences."
  },
  {
    title: "DevOps Engineer",
    department: "Engineering",
    location: "Dar es Salaam, Tanzania",
    type: "Full-time",
    description: "Help us build and maintain our cloud infrastructure and deployment pipelines."
  },
  {
    title: "Technical Project Manager",
    department: "Project Management",
    location: "Remote",
    type: "Full-time",
    description: "Lead technical projects and ensure successful delivery of our solutions."
  }
]

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
      <Navbar />

      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">
              Join Our <span className="gradient-text">Team</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-navy/80 max-w-3xl mx-auto">
              Build the future of technology with us. We're always looking for talented individuals who are passionate about innovation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/50 rounded-2xl border-2 border-navy/20 p-6"
              >
                <div className="text-brand-red mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-navy/80">{benefit.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">Open Positions</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {openPositions.map((position, index) => (
                <motion.div
                  key={position.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white/50 rounded-2xl border-2 border-navy/20 p-6"
                >
                  <h3 className="text-xl font-bold mb-2">{position.title}</h3>
                  <div className="flex flex-wrap gap-4 mb-4">
                    <span className="px-3 py-1 bg-navy/10 rounded-full text-sm">
                      {position.department}
                    </span>
                    <span className="px-3 py-1 bg-navy/10 rounded-full text-sm">
                      {position.location}
                    </span>
                    <span className="px-3 py-1 bg-navy/10 rounded-full text-sm">
                      {position.type}
                    </span>
                  </div>
                  <p className="text-navy/80 mb-4">{position.description}</p>
                  <Button className="bg-navy hover:bg-navy/90 text-white rounded-full">
                    Apply Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Don't See the Right Role?</h2>
            <p className="text-navy/80 mb-8 max-w-2xl mx-auto">
              We're always looking for talented individuals. Send us your resume and we'll keep you in mind for future opportunities.
            </p>
            <Button className="bg-navy hover:bg-navy/90 text-white rounded-full px-8 py-6 text-lg">
              Submit Your Resume <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
} 