"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"

const projects = [
  {
    title: "Enterprise Resource Planning System",
    category: "Software Development",
    description:
      "A comprehensive ERP solution for a manufacturing company that streamlined operations and increased efficiency by 40%.",
    image: "/images/projects/erp-system.jpg",
    tags: ["React", "Node.js", "MongoDB", "Docker"],
  },
  {
    title: "E-commerce Platform Redesign",
    category: "Web Designing",
    description:
      "Complete redesign of an e-commerce platform resulting in 35% increase in conversion rate and improved user experience.",
    image: "/images/projects/ecommerce-redesign.jpg",
    tags: ["UI/UX", "Next.js", "Tailwind CSS", "Shopify"],
  },
  {
    title: "Secure Banking Infrastructure",
    category: "Security Products",
    description:
      "Implementation of a secure banking infrastructure with advanced encryption and multi-factor authentication.",
    image: "/images/projects/banking-security.jpg",
    tags: ["Cybersecurity", "Encryption", "Authentication", "Compliance"],
  },
  {
    title: "Smart Grid Power Management",
    category: "Power Solutions",
    description:
      "Developed a smart grid power management system for a commercial building complex, reducing power consumption by 25%.",
    image: "/images/projects/smart-grid.jpg",
    tags: ["IoT", "Energy Management", "Smart Grid", "Analytics"],
  },
  {
    title: "Corporate Network Infrastructure",
    category: "Connectivity & Networking",
    description:
      "Design and implementation of a scalable network infrastructure for a multinational corporation with 20+ locations.",
    image: "/images/projects/network-infrastructure.jpg",
    tags: ["Networking", "Cisco", "Cloud", "Security"],
  },
  {
    title: "Healthcare IT System Integration",
    category: "IT Products & Services",
    description:
      "Integration of various healthcare IT systems to create a unified platform for patient data management and analytics.",
    image: "/images/projects/healthcare-it.jpg",
    tags: ["Healthcare", "Integration", "Data Management", "HIPAA"],
  },
]

const categories = [
  "All",
  "Software Development",
  "Web Designing",
  "Security Products",
  "Power Solutions",
  "Connectivity & Networking",
  "IT Products & Services",
]

export default function Projects() {
  const [activeCategory, setActiveCategory] = useState("All")

  const filteredProjects =
    activeCategory === "All" ? projects : projects.filter((project) => project.category === activeCategory)

  return (
    <section id="projects" className="py-16 sm:py-20 md:py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">
              Featured <span className="gradient-text">Projects</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="text-base sm:text-lg md:text-xl text-navy/80 max-w-3xl mx-auto">
              Explore our portfolio of successful projects across various technology domains
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-nowrap overflow-x-auto pb-4 justify-start sm:justify-center gap-2 sm:gap-3 mb-8 sm:mb-12 -mx-4 sm:mx-0 px-4 sm:px-0"
        >
          {categories.map((category, index) => (
            <Button
              key={index}
              variant={activeCategory === category ? "default" : "outline"}
              className={`rounded-full whitespace-nowrap flex-shrink-0 ${
                activeCategory === category
                  ? "bg-navy hover:bg-navy/90 text-white border-0"
                  : "text-navy border-navy/20 hover:text-navy hover:border-navy"
              }`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </Button>
          ))}
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="group"
            >
              <div className="relative overflow-hidden rounded-2xl border-2 border-navy/20 bg-white/50 h-full flex flex-col">
                <div className="relative h-40 md:h-60 overflow-hidden">
                  <Image
                    src={project.image || "/placeholder.svg"}
                    alt={project.title}
                    width={800}
                    height={600}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/30 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 z-20 hidden">
                    <Badge className="bg-brand-red text-white border-0">{project.category}</Badge>
                  </div>
                </div>

                <div className="p-4 md:p-6 flex-1 flex flex-col">
                  <h3 className="text-lg sm:text-xl font-bold mb-2 md:mb-3 group-hover:text-brand-red transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-navy/70 mb-0 md:mb-4 flex-1 text-sm sm:text-base md:text-base hidden md:block">{project.description}</p>

                  <div className="flex flex-wrap gap-2 mb-1 md:mb-4 hidden md:flex">
                    {project.tags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="text-xs bg-teal-200 text-navy px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <Link href={`/projects/${project.title.toLowerCase().replace(/ /g, '-')}`}>
                    <div className="inline-flex items-center gap-2 text-navy hover:text-brand-red transition-colors cursor-pointer group/link">
                      <span className="text-sm font-medium">View Project</span>
                      <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 text-center"
        >
          <Button className="bg-navy hover:bg-navy/90 text-white border-0 px-8 py-6 rounded-full text-lg">
            View All Projects
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
