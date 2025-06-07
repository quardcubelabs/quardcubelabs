"use client"

import { motion } from "framer-motion"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, User, Tag } from "lucide-react"
import Image from "next/image"

const blogPosts = [
  {
    id: 1,
    title: "The Future of Cloud Computing in Africa",
    excerpt: "Exploring the growing adoption of cloud technologies and their impact on African businesses.",
    author: "Sarah Chen",
    date: "March 15, 2024",
    category: "Technology",
    image: "/images/blog/cloud-computing.jpg",
    readTime: "5 min read"
  },
  {
    id: 2,
    title: "Cybersecurity Best Practices for 2024",
    excerpt: "Essential security measures every business should implement to protect their digital assets.",
    author: "Michael Ochieng",
    date: "March 10, 2024",
    category: "Security",
    image: "/images/blog/cybersecurity.jpg",
    readTime: "7 min read"
  },
  {
    id: 3,
    title: "Digital Transformation in East Africa",
    excerpt: "How businesses in East Africa are leveraging technology to drive growth and innovation.",
    author: "Aisha Patel",
    date: "March 5, 2024",
    category: "Business",
    image: "/images/blog/digital-transformation.jpg",
    readTime: "6 min read"
  },
  {
    id: 4,
    title: "The Rise of AI in Software Development",
    excerpt: "How artificial intelligence is revolutionizing the way we build and deploy software.",
    author: "Dr. James Wilson",
    date: "February 28, 2024",
    category: "Technology",
    image: "/images/blog/ai-development.jpg",
    readTime: "8 min read"
  }
]

const categories = [
  "All",
  "Technology",
  "Security",
  "Business",
  "Development",
  "Innovation"
]

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
      <Navbar />

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
                variant="outline"
                className="rounded-full border-navy/20 hover:bg-navy/10"
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {blogPosts.map((post, index) => (
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
                    src={post.image}
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
                    <span className="text-navy/60 text-sm">{post.readTime}</span>
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
                        <span className="text-sm text-navy/60">{post.date}</span>
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

          <div className="mt-12 text-center">
            <Button className="bg-navy hover:bg-navy/90 text-white rounded-full px-8 py-6 text-lg">
              Load More Posts <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
} 