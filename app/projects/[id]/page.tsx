"use client"

import { useState, useEffect } from "react"
import { useParams, notFound } from "next/navigation"
import { motion } from "framer-motion"
import { getProjects, getProjectById } from "@/lib/projects-actions"
import type { Project } from "@/types/database"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, MapPin, Calendar, Building, Clock, CheckCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProject = async () => {
      setIsLoading(true)
      try {
        // Get all projects to find the current one and related ones
        const { data: allProjects } = await getProjects()
        if (allProjects) {
          // Find current project by slug or ID
          let foundProject = allProjects.find(p => p.slug === projectId || p.id === projectId)
          
          // For backward compatibility with numeric IDs
          if (!foundProject && !isNaN(Number(projectId))) {
            const legacyId = Number(projectId)
            const completedProjects = allProjects.filter(p => p.status === 'completed' && p.featured)
            if (legacyId <= completedProjects.length) {
              foundProject = completedProjects[legacyId - 1]
            }
          }

          if (foundProject) {
            setProject(foundProject)
            
            // Find related projects (same category, excluding current project)
            const related = allProjects
              .filter(p => 
                p.category === foundProject.category && 
                p.id !== foundProject.id && 
                p.status === 'completed' && 
                p.featured
              )
              .slice(0, 3)
            setRelatedProjects(related)
          }
        }
      } catch (error) {
        console.error('Error loading project:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProject()
  }, [projectId])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-teal text-navy">
        <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
        <Navbar />
        <section className="pt-32 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto"></div>
              <p className="mt-4 text-navy/80">Loading project...</p>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  if (!project) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
      <Navbar />

      <section className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <Link
            href="/projects"
            className="inline-flex items-center text-navy hover:text-brand-red transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-2"
            >
              <h1 className="text-4xl font-bold mb-6">{project.title}</h1>

              <div className="flex flex-wrap gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-brand-red" />
                  <span className="text-navy/80">{project.client}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-brand-red" />
                  <span className="text-navy/80">{project.year || (project.start_date ? new Date(project.start_date).getFullYear() : 'Recent')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-brand-red" />
                  <span className="text-navy/80">{project.duration || `${project.start_date && project.end_date ? Math.ceil((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30)) + ' months' : 'Ongoing'}`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-brand-red" />
                  <span className="text-navy/80">{project.location || 'Global'}</span>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden border-2 border-navy/20 mb-8">
                <Image
                  src={project.image_url || "/placeholder.svg"}
                  alt={project.title}
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
              </div>

              <Tabs defaultValue="overview" className="w-full mb-12">
                <TabsList className="bg-white/50 border-2 border-navy/20 rounded-full">
                  <TabsTrigger value="overview" className="rounded-full">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="challenge" className="rounded-full">
                    Challenge
                  </TabsTrigger>
                  <TabsTrigger value="solution" className="rounded-full">
                    Solution
                  </TabsTrigger>
                  <TabsTrigger value="results" className="rounded-full">
                    Results
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-6">
                  <div className="p-6 bg-white/50 rounded-2xl border-2 border-navy/20">
                    <h2 className="text-2xl font-bold mb-4">Project Overview</h2>
                    <p className="text-navy/80">{project.description}</p>
                  </div>
                </TabsContent>
                <TabsContent value="challenge" className="mt-6">
                  <div className="p-6 bg-white/50 rounded-2xl border-2 border-navy/20">
                    <h2 className="text-2xl font-bold mb-4">The Challenge</h2>
                    <p className="text-navy/80">{project.challenge || 'Project challenge details not available.'}</p>
                  </div>
                </TabsContent>
                <TabsContent value="solution" className="mt-6">
                  <div className="p-6 bg-white/50 rounded-2xl border-2 border-navy/20">
                    <h2 className="text-2xl font-bold mb-4">Our Solution</h2>
                    <p className="text-navy/80">{project.solution || 'Solution details not available.'}</p>
                  </div>
                </TabsContent>
                <TabsContent value="results" className="mt-6">
                  <div className="p-6 bg-white/50 rounded-2xl border-2 border-navy/20">
                    <h2 className="text-2xl font-bold mb-4">Results & Impact</h2>
                    {project.results && Array.isArray(project.results) && project.results.length > 0 ? (
                      <ul className="space-y-3">
                        {project.results.map((result: string, index: number) => (
                          <li key={index} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-brand-red mt-0.5 flex-shrink-0" />
                            <span className="text-navy/80">{result}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-navy/80">Project results information not available.</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {project.gallery && Array.isArray(project.gallery) && project.gallery.map((image: string, index: number) => (
                  <div key={index} className="rounded-2xl overflow-hidden border-2 border-navy/20">
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`${project.title} gallery image ${index + 1}`}
                      width={400}
                      height={300}
                      className="w-full h-auto"
                    />
                  </div>
                ))}
              </div>

              <div className="bg-white/50 rounded-2xl border-2 border-navy/20 p-6 mb-12">
                <h2 className="text-2xl font-bold mb-4">Technologies Used</h2>
                <div className="flex flex-wrap gap-3">
                  {project.technologies && project.technologies.map((tech: string, index: number) => (
                    <span key={index} className="px-4 py-2 bg-navy/10 rounded-full text-navy">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {project.testimonial && (
                <div className="bg-navy/10 rounded-2xl p-8 mb-12">
                  <div className="flex flex-col items-center text-center">
                    <svg className="h-12 w-12 text-navy/30 mb-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                    <p className="text-lg italic mb-6">{project.testimonial.quote}</p>
                    <div>
                      <p className="font-bold">{project.testimonial.author}</p>
                      <p className="text-navy/70">{project.testimonial.position}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <Link
                  href="/projects"
                  className="inline-flex items-center text-navy hover:text-brand-red transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  All Projects
                </Link>
                <Link href="/contact">
                  <Button className="bg-navy hover:bg-navy/90 text-white rounded-full">
                    Start Your Project <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-32">
                <div className="bg-white/50 rounded-2xl border-2 border-navy/20 overflow-hidden mb-8">
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">Project Details</h2>
                    <ul className="space-y-4">
                      <li className="flex justify-between">
                        <span className="text-navy/70">Client:</span>
                        <span className="font-medium">{project.client}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-navy/70">Year:</span>
                        <span className="font-medium">{project.year}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-navy/70">Duration:</span>
                        <span className="font-medium">{project.duration}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-navy/70">Location:</span>
                        <span className="font-medium">{project.location}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-navy/70">Category:</span>
                        <span className="font-medium">{project.category}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {relatedProjects.length > 0 && (
                  <div className="bg-white/50 rounded-2xl border-2 border-navy/20 overflow-hidden">
                    <div className="p-6">
                      <h2 className="text-xl font-bold mb-4">Related Projects</h2>
                      <div className="space-y-4">
                        {relatedProjects.map((relatedProject) => (
                          <Link key={relatedProject.id} href={`/projects/${relatedProject.id}`} className="group block">
                            <div className="flex gap-4">
                              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={relatedProject.images?.[0] || "/placeholder.svg"}
                                  alt={relatedProject.title}
                                  width={80}
                                  height={80}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <h3 className="font-medium group-hover:text-brand-red transition-colors line-clamp-2">
                                  {relatedProject.title}
                                </h3>
                                <p className="text-sm text-navy/70">{relatedProject.client}</p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
