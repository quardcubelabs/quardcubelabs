"use client"

import { motion } from "framer-motion"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, Linkedin, Twitter, Mail } from "lucide-react"
import Image from "next/image"

const teamMembers = [
  {
    name: "Dr. James Wilson",
    role: "Founder & CEO",
    image: "/images/team/ceo.jpg",
    bio: "With over 20 years of experience in technology and business leadership, Dr. Wilson founded QuardCubeLabs with a vision to transform businesses through innovative IT solutions.",
    social: {
      linkedin: "#",
      twitter: "#",
      email: "james.wilson@quardcubelabs.com"
    }
  },
  {
    name: "Sarah Chen",
    role: "Chief Technology Officer",
    image: "/images/team/cto.jpg",
    bio: "Sarah leads our technical strategy and innovation initiatives, bringing 15+ years of experience in software architecture and emerging technologies.",
    social: {
      linkedin: "#",
      twitter: "#",
      email: "sarah.chen@quardcubelabs.com"
    }
  },
  {
    name: "Michael Ochieng",
    role: "Head of Operations",
    image: "/images/team/operations.jpg",
    bio: "Michael ensures smooth delivery of our services and maintains the highest standards of operational excellence across all projects.",
    social: {
      linkedin: "#",
      twitter: "#",
      email: "michael.ochieng@quardcubelabs.com"
    }
  },
  {
    name: "Aisha Patel",
    role: "Lead Software Architect",
    image: "/images/team/architect.jpg",
    bio: "Aisha designs and implements scalable software solutions, specializing in enterprise architecture and cloud technologies.",
    social: {
      linkedin: "#",
      twitter: "#",
      email: "aisha.patel@quardcubelabs.com"
    }
  }
]

export default function TeamPage() {
  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
      <Navbar />

      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">
              Meet Our <span className="gradient-text">Team</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-navy/80 max-w-3xl mx-auto">
              The talented individuals behind our innovative solutions and exceptional service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/50 rounded-2xl border-2 border-navy/20 overflow-hidden"
              >
                <div className="relative h-64">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                  <p className="text-brand-red font-medium mb-4">{member.role}</p>
                  <p className="text-navy/80 mb-6">{member.bio}</p>
                  <div className="flex gap-3">
                    <a
                      href={member.social.linkedin}
                      className="p-2 rounded-full bg-navy/10 hover:bg-navy/20 transition-colors"
                      aria-label={`${member.name}'s LinkedIn`}
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                    <a
                      href={member.social.twitter}
                      className="p-2 rounded-full bg-navy/10 hover:bg-navy/20 transition-colors"
                      aria-label={`${member.name}'s Twitter`}
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                    <a
                      href={`mailto:${member.social.email}`}
                      className="p-2 rounded-full bg-navy/10 hover:bg-navy/20 transition-colors"
                      aria-label={`Email ${member.name}`}
                    >
                      <Mail className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-4">Join Our Team</h2>
            <p className="text-navy/80 mb-8 max-w-2xl mx-auto">
              We're always looking for talented individuals who are passionate about technology and innovation.
              Check out our open positions and become part of our growing team.
            </p>
            <Button className="bg-navy hover:bg-navy/90 text-white rounded-full px-8 py-6 text-lg">
              View Open Positions <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
} 