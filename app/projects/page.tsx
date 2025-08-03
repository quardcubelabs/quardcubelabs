"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { getProjects } from "@/lib/projects-actions"
import type { Project } from "@/types/database"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("All")

  // Define categories based on your project categories
  const categories = [
    "All",
    "Software Development",
    "Web Designing", 
    "Security Products",
    "Power Solutions",
    "Connectivity & Networking",
    "IT Products & Services"
  ]

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await getProjects()
        if (!error && data) {
          // Filter only completed and featured projects for public display
          const publicProjects = data.filter(project => 
            project.status === 'completed' && project.featured
          )
          setProjects(publicProjects)
        }
      } catch (error) {
        console.error('Error loading projects:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProjects()
  }, [])

  const filteredProjects = activeCategory === "All" 
    ? projects 
    : projects.filter((project) => project.category === activeCategory)

  if (isLoading) {
    return (
      <main className="min-h-screen bg-teal text-navy">
        <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
        <Navbar />
        <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto"></div>
              <p className="mt-4 text-navy/80">Loading projects...</p>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
      <Navbar />

      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">
              Our <span className="gradient-text">Projects</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-navy/80 max-w-3xl mx-auto">
              Explore our portfolio of successful projects across various technology domains
            </p>
          </div>

          <div className="flex flex-nowrap overflow-x-auto pb-4 justify-start sm:justify-center gap-2 sm:gap-3 mb-8 sm:mb-12 -mx-4 sm:mx-0 px-4 sm:px-0">
            {categories.map((category, index) => (
              <Button
                key={index}
                variant={activeCategory === category ? "default" : "outline"}
                className={`rounded-full ${
                  activeCategory === category
                    ? "bg-navy hover:bg-navy/90 text-white border-0"
                    : "text-navy border-navy/20 hover:text-navy hover:border-navy"
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link href={`/projects/${project.slug || project.id}`} className="group block h-full">
                  <div className="h-full rounded-2xl border-2 border-navy/20 bg-white/50 overflow-hidden transition-all duration-300 hover:border-navy hover:shadow-lg">
                    <div className="relative h-60 overflow-hidden">
                      <Image
                        src={project.image_url || "/placeholder.svg"}
                        alt={project.title}
                        width={800}
                        height={600}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/30 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 z-20">
                        <Badge className="bg-brand-red text-white border-0">{project.category}</Badge>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-3 group-hover:text-brand-red transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-navy/70 mb-4 line-clamp-3">
                        {project.short_description || project.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-navy/70">{project.client}</span>
                        <span className="text-sm text-navy/70">
                          {project.start_date ? new Date(project.start_date).getFullYear() : 'Recent'}
                        </span>
                      </div>

                      <div className="mt-4 inline-flex items-center gap-2 text-navy hover:text-brand-red transition-colors">
                        <span className="text-sm font-medium">View Project</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
