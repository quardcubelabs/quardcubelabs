"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, User, Tag, Loader2 } from "lucide-react"
import Image from "next/image"
import { getBlogs } from "@/lib/blogs-actions"
import type { Blog } from "@/types/database"

const categories = [
  "All",
  "Technology",
  "Security", 
  "Business",
  "Development",
  "Innovation"
]

export default function BlogPage() {
  const [blogPosts, setBlogPosts] = useState<Blog[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Blog[]>([])
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBlogs()
  }, [])

  useEffect(() => {
    filterPosts()
  }, [blogPosts, selectedCategory])

  const loadBlogs = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await getBlogs()
      
      if (error) {
        setError(error)
        return
      }

      if (data) {
        setBlogPosts(data)
      }
    } catch (err) {
      setError('Failed to load blogs')
      console.error('Error loading blogs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const filterPosts = () => {
    if (selectedCategory === "All") {
      setFilteredPosts(blogPosts)
    } else {
      setFilteredPosts(blogPosts.filter(post => post.category === selectedCategory))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>

      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">
              Our <span className="gradient-text">Blog</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-navy/80 max-w-3xl mx-auto">
              Insights, updates, and perspectives on technology, innovation, and digital transformation
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`rounded-full border-navy/20 ${
                  selectedCategory === category 
                    ? "bg-navy hover:bg-navy/90 text-white" 
                    : "hover:bg-navy/10"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-navy" />
              <span className="ml-2 text-navy">Loading blogs...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">Error loading blogs: {error}</p>
              <Button onClick={loadBlogs} className="bg-navy hover:bg-navy/90 text-white">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {filteredPosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white/50 rounded-2xl border-2 border-navy/20 overflow-hidden"
                >
                  <div className="relative h-48">
                    <Image
                      src={post.featured_image || "/images/blog/default-blog.jpg"}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="px-3 py-1 bg-navy/10 rounded-full text-sm">
                        {post.category}
                      </span>
                      <span className="text-navy/60 text-sm">{post.reading_time} min read</span>
                    </div>
                    <h2 className="text-xl font-bold mb-2">{post.title}</h2>
                    <p className="text-navy/80 mb-4">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-navy/60" />
                          <span className="text-sm text-navy/60">{post.author}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-navy/60" />
                          <span className="text-sm text-navy/60">
                            {post.published_at ? formatDate(post.published_at) : formatDate(post.created_at)}
                          </span>
                        </div>
                      </div>
                      <Button className="bg-navy hover:bg-navy/90 text-white rounded-full">
                        Read More <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}

          {!isLoading && !error && filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-navy/60 text-lg">No blogs found for the selected category.</p>
            </div>
          )}

          {!isLoading && !error && filteredPosts.length > 0 && (
            <div className="mt-12 text-center">
              <Button className="bg-navy hover:bg-navy/90 text-white rounded-full px-8 py-6 text-lg">
                Load More Posts <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
} 