"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Logo from "@/components/logo"

// Hero slide data
const heroSlides = [
  {
    id: 1,
    title: "Innovative IT Solutions for the Digital Future",
    description:
      "QuardCubeLabs delivers cutting-edge technology solutions that transform businesses and drive innovation in the digital landscape.",
    gradient: "from-navy/10 to-brand-red/10",
  },
  {
    id: 2,
    title: "Secure & Reliable Technology Infrastructure",
    description:
      "Build your business on a foundation of secure, scalable, and reliable technology infrastructure designed for the modern enterprise.",
    gradient: "from-teal/20 to-navy/20",
  },
  {
    id: 3,
    title: "Custom Software Development Excellence",
    description:
      "From concept to deployment, our expert team creates custom software solutions tailored to your unique business requirements.",
    gradient: "from-brand-red/10 to-teal/20",
  },
  {
    id: 4,
    title: "Empowering Businesses Through Technology",
    description:
      "Partner with us to leverage the latest technologies and stay ahead in today's competitive digital marketplace.",
    gradient: "from-purple-500/20 to-teal/20",
  },
]

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1))
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))
  }, [])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide()
    }, 6000) // Change slide every 6 seconds

    return () => clearInterval(interval)
  }, [nextSlide])

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-12 sm:py-20 md:py-32">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex flex-col items-center"
          >
            <motion.div
              className="animate-float"
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
              }}
            >
              <Logo size="lg" />
            </motion.div>
          </motion.div>

          <div className="w-full relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center"
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-4 sm:mb-6">
                  {heroSlides[currentSlide].title.split(" ").map((word, i, arr) =>
                    i === arr.length - 2 ? (
                      <span key={i}>
                        {word} <span className="gradient-text">{arr[arr.length - 1]}</span>
                      </span>
                    ) : i === arr.length - 1 ? null : (
                      <span key={i}>{word} </span>
                    ),
                  )}
                </h1>

                <p className="text-base sm:text-lg md:text-xl text-navy/80 mb-6 sm:mb-8 max-w-3xl">
                  {heroSlides[currentSlide].description}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-16 w-full sm:w-auto">
                  <Button className="bg-navy hover:bg-navy/90 text-white text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-full w-full sm:w-auto">
                    Explore Our Services
                  </Button>
                  <Button
                    variant="outline"
                    className="text-navy border-navy hover:bg-navy/10 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-full w-full sm:w-auto"
                  >
                    Contact Us <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slide navigation dots */}
            <div className="flex justify-center mt-8 gap-3">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    currentSlide === index ? "bg-navy w-8" : "bg-navy/30"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
