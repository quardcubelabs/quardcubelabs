"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronDown } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

// Hero slide data
const heroSlides = [
  {
    id: 1,
    tagline: "AI-POWERED SOLUTIONS",
    title: "INTELLIGENT",
    titleAccent: "AUTOMATION",
    subtitle: "FOR YOUR BUSINESS",
    description:
      "Leverage the power of Artificial Intelligence to automate processes, enhance decision-making, and unlock new levels of productivity.",
    image: "/images/hero/ai-automation-01.png",
    stats: [
      { label: "EFFICIENCY", value: "10x" },
      { label: "AI MODELS", value: "50+" },
      { label: "UPTIME", value: "99.9%" },
    ],
    duration: 8000,
  },
  {
    id: 2,
    tagline: "ENTERPRISE GRADE",
    title: "SECURE",
    titleAccent: "SURVEILLANCE",
    subtitle: "SECURITY ASSUARENCE",
    description:
      "Secure your business on a foundation of modern, scalable, and reliable security systems designed for the modern era.",
    image: "/images/hero/cctv.png",
    stats: [
      { label: "PROTECTED", value: "100%" },
      { label: "CLIENTS", value: "50+" },
      { label: "COUNTRIES", value: "1+" },
    ],
    duration: 8000,
  },
  {
    id: 2,
    tagline: "ENTERPRISE GRADE",
    title: "STANDARD",
    titleAccent: "IT PRODUCTS",
    subtitle: "NEXT LEVEL EXPERIENCE",
    description:
      "Build your business on a foundation of secure, scalable, and reliable IT products designed for the modern enterprise.",
    image: "/images/hero/asus_rog.png",
    stats: [
      { label: "PROTECTED", value: "100%" },
      { label: "CLIENTS", value: "20+" },
      { label: "COUNTRIES", value: "1+" },
    ],
    duration: 8000,
  },
  {
    id: 3,
    tagline: "CUSTOM DEVELOPMENT",
    title: "SOFTWARE",
    titleAccent: "EXCELLENCE",
    subtitle: "FROM CONCEPT TO DEPLOY",
    description:
      "From concept to deployment, our expert team creates custom software solutions tailored to your unique business requirements.",
    image: "/images/hero/web-02.png",
    stats: [
      { label: "PROJECTS", value: "10+" },
      { label: "LANGUAGES", value: "20+" },
      { label: "DELIVERY", value: "ON TIME" },
    ],
    duration: 8000,
  },
]

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1))
  }, [])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide()
    }, heroSlides[currentSlide].duration)

    return () => clearInterval(interval)
  }, [nextSlide, currentSlide])

  const slide = heroSlides[currentSlide]

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-[#0a0a0f]">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-[0.07]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(76, 232, 214, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Radial glow behind content */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-red/5 rounded-full blur-[120px]" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-navy-500/10 rounded-full blur-[100px]" />

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 pt-24 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-4 items-center max-w-[1400px] mx-auto">
            {/* Left Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.6 }}
                className="space-y-6 sm:space-y-8"
              >
                {/* Tagline */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3"
                >
                  <div className="h-[2px] w-8 sm:w-12 bg-brand-red" />
                  <span className="text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] text-white/60 font-medium">
                    {slide.tagline}
                  </span>
                </motion.div>

                {/* Main Title */}
                <div>
                  <h1
                    className="text-5xl sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-[0.85] text-white"
                    style={{ fontFamily: "var(--font-anton)" }}
                  >
                    {slide.title}
                  </h1>
                  <h1
                    className="text-5xl sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-[0.85] text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-red-400 mt-1 sm:mt-2"
                    style={{ fontFamily: "var(--font-anton)" }}
                  >
                    {slide.titleAccent}
                  </h1>
                  <p className="text-lg sm:text-xl md:text-2xl text-white/30 font-light mt-2 sm:mt-3 tracking-wide">
                    {slide.subtitle}
                  </p>
                </div>

                {/* Description */}
                <p className="text-sm sm:text-base md:text-lg text-white/50 max-w-lg leading-relaxed">
                  {slide.description}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                  <Link href="/services">
                    <Button className="bg-brand-red hover:bg-red-700 text-white text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6 rounded-none font-bold tracking-wider uppercase w-full sm:w-auto">
                      Explore Services
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button
                      variant="outline"
                      className="border-white/20 text-blue hover:bg-white/10 hover:border-white/40 text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6 rounded-none font-bold tracking-wider uppercase w-full sm:w-auto"
                    >
                      Get in Touch
                    </Button>
                  </Link>
                </div>

                {/* Stats Row */}
                <div className="flex gap-6 sm:gap-8 md:gap-12 pt-4 sm:pt-8 border-t border-white/10">
                  {slide.stats.map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                    >
                      <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white" style={{ fontFamily: "var(--font-anton)" }}>
                        {stat.value}
                      </div>
                      <div className="text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] text-white/40 mt-1">
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Right - AI Image */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.7 }}
                className="relative flex items-center justify-center"
              >
                {/* Glowing rings behind image */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] md:w-[520px] md:h-[520px] lg:w-[580px] lg:h-[580px] rounded-full border border-brand-red/20"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] md:w-[440px] md:h-[440px] lg:w-[500px] lg:h-[500px] rounded-full border border-white/5"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  />
                </div>

                {/* Red glow spot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-64 sm:h-64 bg-brand-red/10 rounded-full blur-[80px]" />

                {/* AI Image */}
                <div className="relative z-10 w-[320px] h-[400px] sm:w-[400px] sm:h-[500px] md:w-[460px] md:h-[570px] lg:w-[520px] lg:h-[640px]">
                  <Image
                    src={slide.image}
                    alt="AI Technology"
                    fill
                    className="object-contain drop-shadow-[0_0_40px_rgba(255,0,0,0.15)]"
                    priority
                  />
                </div>

                {/* Floating label removed - moved to section level */}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Vertical text - right side, vertically centered with content */}
      <div className="absolute right-4 sm:right-6 lg:right-12 xl:right-20 top-0 bottom-0 z-10 hidden sm:flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="flex items-center gap-2"
            style={{ marginTop: "12px" }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.7 }}
          >
            <div
              className="text-[60px] md:text-[80px] lg:text-[100px] font-black text-transparent leading-none tracking-tighter select-none rotate-180"
              style={{ fontFamily: "var(--font-anton)", writingMode: "vertical-rl", WebkitTextStroke: "1px rgba(255,255,255,0.2)" }}
            >
              Q-LABS
            </div>
            <div className="text-[10px] sm:text-xs tracking-[0.3em] text-white font-medium rotate-180"
              style={{ writingMode: "vertical-rl" }}
            >
              INNOVATE • AUTOMATE • ELEVATE YOUR BUSINESS
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-12 xl:px-20 pb-6 sm:pb-8">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          {/* Slide indicators */}
          <div className="flex items-center gap-3 sm:gap-4">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className="group flex items-center gap-2"
                aria-label={`Go to slide ${index + 1}`}
              >
                <div
                  className={`h-[2px] transition-all duration-500 ${
                    currentSlide === index
                      ? "w-8 sm:w-12 bg-brand-red"
                      : "w-4 sm:w-6 bg-white/20 group-hover:bg-white/40"
                  }`}
                />
                <span
                  className={`text-xs font-mono transition-colors ${
                    currentSlide === index ? "text-white" : "text-white/20"
                  }`}
                >
                  0{index + 1}
                </span>
              </button>
            ))}
          </div>

          {/* Scroll indicator */}
          <motion.div
            className="flex items-center gap-2 text-white/30"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-xs tracking-wider hidden sm:inline">SCROLL DOWN</span>
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
