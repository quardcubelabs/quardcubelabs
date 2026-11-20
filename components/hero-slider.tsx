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
    image: "/responsive_02.png",
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
    <section className="relative min-h-screen flex flex-col overflow-x-hidden bg-white">
      {/* Animated grid background - left side only */}
      <div className="absolute inset-0 right-auto w-1/2 opacity-[0.07]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(76, 232, 214, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,50,0.1) 1px, transparent 1px)
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
                className="space-y-6 sm:space-y-8 min-w-0"
              >
                {/* Tagline */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3"
                >
                  <div className="h-[2px] w-8 sm:w-12 bg-brand-red" />
                  <span className="text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] text-navy/60 font-medium">
                    {slide.tagline}
                  </span>
                </motion.div>

                {/* Main Title */}
                <div className="max-w-full overflow-visible">
                  <h1
                    className="text-[22px] xs:text-[28px] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight xs:tracking-normal sm:tracking-wider leading-[1.08] sm:leading-[1.0] text-navy pb-1 sm:pb-2 break-normal"
                    style={{ fontFamily: "'Blanka', var(--font-anton), sans-serif" }}
                  >
                    {slide.title}
                  </h1>
                  <h1
                    className="text-[22px] xs:text-[28px] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight xs:tracking-normal sm:tracking-wider leading-[1.08] sm:leading-[1.0] text-transparent bg-clip-text bg-gradient-to-r from-navy to-red-400 mt-1 sm:mt-2 pb-2 sm:pb-4 break-normal"
                    style={{ fontFamily: "'Blanka', var(--font-anton), sans-serif" }}
                  >
                    {slide.titleAccent}
                  </h1>
                  <p className="text-sm xs:text-base sm:text-xl md:text-2xl text-navy/40 font-light mt-1.5 sm:mt-3 tracking-wide">
                    {slide.subtitle}
                  </p>
                </div>

                {/* Description */}
                <p className="text-sm sm:text-base md:text-lg text-navy/50 max-w-lg leading-relaxed">
                  {slide.description}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-row items-center gap-2 sm:gap-3.5 pt-1.5 sm:pt-2 w-full max-w-sm sm:max-w-md">
                  <Link href="/services" className="flex-1 sm:flex-initial min-w-0">
                    <Button className="bg-brand-red hover:bg-navy text-white text-[11px] xs:text-xs sm:text-sm md:text-[14px] px-2.5 xs:px-4 sm:px-6 md:px-7 py-2.5 sm:py-3.5 h-auto min-h-[40px] sm:min-h-[46px] rounded-lg font-bold tracking-normal xs:tracking-wider uppercase w-full sm:w-auto justify-center shadow-md transition-all hover:shadow-lg">
                      <span className="truncate">Explore Services</span>
                      <ArrowRight className="ml-1 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    </Button>
                  </Link>
                  <Link href="/contact" className="flex-1 sm:flex-initial min-w-0">
                    <Button
                      variant="outline"
                      className="border-navy/20 text-navy hover:text-white hover:bg-navy hover:border-navy/40 text-[11px] xs:text-xs sm:text-sm md:text-[14px] px-2.5 xs:px-4 sm:px-6 md:px-7 py-2.5 sm:py-3.5 h-auto min-h-[40px] sm:min-h-[46px] rounded-lg font-bold tracking-normal xs:tracking-wider uppercase w-full sm:w-auto justify-center transition-all"
                    >
                      <span className="truncate">Get in Touch</span>
                    </Button>
                  </Link>
                </div>

                {/* Stats Row */}
                <div className="flex flex-wrap gap-6 sm:gap-8 md:gap-12 pt-4 sm:pt-8 border-t border-navy/10">
                  {slide.stats.map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                    >
                      <div className="text-2xl sm:text-3xl md:text-4xl font-black text-navy" style={{ fontFamily: "var(--font-anton)" }}>
                        {stat.value}
                      </div>
                      <div className="text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] text-navy/40 mt-1">
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
                className="relative flex items-center justify-end lg:justify-center pr-0 xs:pr-1 sm:pr-6 lg:pr-0"
              >
                {/* Radial navy glow behind image - squeezed & positioned behind the image on small screens */}
                <div className="absolute top-[42%] -right-4 xs:right-1 sm:right-2 lg:right-auto lg:left-[55%] lg:-translate-x-1/2 -translate-y-1/2 w-24 h-24 xs:w-28 xs:h-28 sm:w-44 sm:h-44 md:w-64 md:h-64 lg:w-[420px] lg:h-[420px] bg-navy/20 rounded-full blur-[40px] xs:blur-[50px] sm:blur-[70px] lg:blur-[90px] pointer-events-none" />

                {/* AI Image - pushed to the right on small screens */}
                <div className="relative z-10 w-full max-w-[140px] xs:max-w-[170px] sm:max-w-[240px] h-[200px] xs:h-[230px] sm:h-[300px] md:max-w-[320px] md:h-[400px] lg:max-w-[400px] lg:h-[500px] xl:max-w-[460px] xl:h-[570px] ml-auto lg:ml-0 translate-x-2 xs:translate-x-3 sm:translate-x-4 lg:translate-x-4 xl:translate-x-8 -translate-y-4 sm:-translate-y-6">
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
                  className={`h-[2px] transition-all duration-500 ${currentSlide === index
                      ? "w-8 sm:w-12 bg-brand-red"
                      : "w-4 sm:w-6 bg-navy/20 group-hover:bg-navy/40"
                    }`}
                />
                <span
                  className={`text-xs font-mono transition-colors ${currentSlide === index ? "text-navy" : "text-navy/20"
                    }`}
                >
                  0{index + 1}
                </span>
              </button>
            ))}
          </div>

          {/* Scroll indicator */}
          <motion.div
            className="flex items-center gap-2 text-navy/30"
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
