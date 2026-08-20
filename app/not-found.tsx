"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home, Search } from "lucide-react"
import { useState, useEffect } from "react"

const phrases = [
  "This page took a vacation.",
  "Looks like you've wandered into the void.",
  "404: The page you seek does not exist.",
  "Houston, we have a problem.",
  "This page is playing hide and seek. It's winning.",
]

export default function NotFound() {
  const [phrase, setPhrase] = useState(phrases[0])
  const [glitch, setGlitch] = useState(false)

  useEffect(() => {
    setPhrase(phrases[Math.floor(Math.random() * phrases.length)])

    const interval = setInterval(() => {
      setGlitch(true)
      setTimeout(() => setGlitch(false), 200)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-teal flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="pattern-grid fixed inset-0 pointer-events-none z-10"></div>

      {/* Floating background elements */}
      <motion.div
        className="absolute top-20 left-10 w-32 h-32 rounded-full bg-brand-red/5 blur-[80px]"
        animate={{ y: [0, 30, 0], x: [0, 15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-navy/5 blur-[100px]"
        animate={{ y: [0, -20, 0], x: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center relative z-20 max-w-lg"
      >
        {/* 404 Number */}
        <motion.div
          className="relative mb-8"
          animate={glitch ? { x: [0, -3, 3, -2, 2, 0] } : {}}
          transition={{ duration: 0.2 }}
        >
          <h1
            className="text-[120px] sm:text-[160px] md:text-[200px] font-black leading-none text-navy/10 select-none"
            style={{ fontFamily: "var(--font-anton)" }}
          >
            404
          </h1>
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: [0, 2, -2, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <span
              className="text-[120px] sm:text-[160px] md:text-[200px] font-black leading-none text-transparent"
              style={{
                fontFamily: "var(--font-anton)",
                WebkitTextStroke: "2px rgba(0,0,128,0.15)",
              }}
            >
              404
            </span>
          </motion.div>
        </motion.div>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg sm:text-xl text-navy/60 mb-2 font-medium"
        >
          {phrase}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-navy/40 mb-10"
        >
          The page you&apos;re looking for might have been moved or doesn&apos;t exist.
        </motion.p>

        {/* Animated dots */}
        <motion.div
          className="flex justify-center gap-2 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-navy/20"
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link href="/">
            <Button className="bg-navy hover:bg-brand-red text-white rounded-lg px-6 py-5 font-bold w-full sm:w-auto transition-colors duration-300">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <Link href="/shop">
            <Button
              variant="outline"
              className="border-navy/20 text-navy hover:bg-navy/10 rounded-lg px-6 py-5 font-bold w-full sm:w-auto"
            >
              <Search className="mr-2 h-4 w-4" />
              Browse Shop
            </Button>
          </Link>
        </motion.div>

        {/* Fun footer text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-10 text-xs text-navy/30"
        >
          Error Code: PAGE_NOT_FOUND | Trust the process, not every path leads somewhere.
        </motion.p>
      </motion.div>
    </div>
  )
}
