"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

// Hero slide data
const heroSlides = [
  {
    id: 5,
    title: "AI Agents: Revolutionizing Business Efficiency",
    description:
      "Leverage the power of Artificial Intelligence to automate processes, enhance decision-making, and unlock new levels of productivity.",
    gradient: "from-blue-500/20 to-green-500/20",
    image: "/images/hero/ai-automation.png",
    duration: 18000,
    backgroundType: "image",
  },
  {
    id: 1,
    title: "Innovative IT Solutions for the Digital Future",
    description:
      "QuardCubeLabs delivers cutting-edge technology solutions that transform businesses and drive innovation in the digital landscape.",
    gradient: "from-cyan-500/30 via-blue-600/20 to-purple-600/30",
    duration: 6000,
    backgroundType: "futuristic",
    backgroundVideo: "https://cdn.pixabay.com/video/2020/05/25/40130-424930942_large.mp4",
  },
  {
    id: 2,
    title: "Secure & Reliable Technology Infrastructure",
    description:
      "Build your business on a foundation of secure, scalable, and reliable technology infrastructure designed for the modern enterprise.",
    gradient: "from-emerald-500/30 via-teal-500/20 to-cyan-600/30",
    duration: 6000,
    backgroundType: "futuristic",
    backgroundVideo: "https://cdn.pixabay.com/video/2021/02/21/66015-515677340_large.mp4",
  },
  {
    id: 3,
    title: "Custom Software Development Excellence",
    description:
      "From concept to deployment, our expert team creates custom software solutions tailored to your unique business requirements.",
    gradient: "from-violet-500/30 via-purple-500/20 to-fuchsia-600/30",
    duration: 6000,
    backgroundType: "futuristic",
    backgroundVideo: "https://cdn.pixabay.com/video/2019/07/30/25482-351654582_large.mp4",
  },
  {
    id: 4,
    title: "Empowering Businesses Through Technology",
    description:
      "Partner with us to leverage the latest technologies and stay ahead in today's competitive digital marketplace.",
    gradient: "from-orange-500/30 via-rose-500/20 to-pink-600/30",
    duration: 6000,
    backgroundType: "futuristic",
    backgroundVideo: "https://cdn.pixabay.com/video/2020/02/10/32112-391247731_large.mp4",
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
    }, heroSlides[currentSlide].duration) // Use duration from current slide

    return () => clearInterval(interval)
  }, [nextSlide, currentSlide]) // Re-run effect when currentSlide changes

  const currentSlideData = heroSlides[currentSlide]
  const isFuturisticSlide = currentSlideData.backgroundType === "futuristic"

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden pt-20">
      {/* Futuristic Background Container for slides 2-5 */}
      <AnimatePresence mode="wait">
        {isFuturisticSlide && (
          <motion.div
            key={`bg-${currentSlide}`}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-0 flex items-center justify-center"
          >
            {/* Curved Futuristic Container - Smaller and Centered */}
            <div className="absolute top-32 bottom-24 left-6 right-6 sm:top-36 sm:bottom-28 sm:left-12 sm:right-12 md:top-40 md:bottom-32 md:left-20 md:right-20 lg:top-44 lg:bottom-36 lg:left-32 lg:right-32 rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] overflow-hidden border border-navy/10 shadow-2xl">
              {/* Video Background */}
              {currentSlideData.backgroundVideo && (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  <source src={currentSlideData.backgroundVideo} type="video/mp4" />
                </video>
              )}
              
              {/* White Overlay for clean background */}
              <div className="absolute inset-0 bg-white/85" />
              
              {/* Subtle Gradient Accent */}
              <div className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.gradient} opacity-30`} />
              
              {/* Futuristic Grid Pattern - subtle */}
              <div className="absolute inset-0 opacity-10">
                <div 
                  className="w-full h-full"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(0,50,100,0.15) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0,50,100,0.15) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                  }}
                />
              </div>
              
              {/* Glowing Edge Effect - navy tinted */}
              <div className="absolute inset-0 rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] shadow-[inset_0_0_60px_rgba(0,50,100,0.08)]" />
              
              {/* Animated Corner Accents - navy colored */}
              <div className="absolute top-4 left-4 w-12 h-12 sm:w-16 sm:h-16 border-l-2 border-t-2 border-navy/30 rounded-tl-2xl" />
              <div className="absolute top-4 right-4 w-12 h-12 sm:w-16 sm:h-16 border-r-2 border-t-2 border-navy/30 rounded-tr-2xl" />
              <div className="absolute bottom-4 left-4 w-12 h-12 sm:w-16 sm:h-16 border-l-2 border-b-2 border-navy/30 rounded-bl-2xl" />
              <div className="absolute bottom-4 right-4 w-12 h-12 sm:w-16 sm:h-16 border-r-2 border-b-2 border-navy/30 rounded-br-2xl" />
              
              {/* Floating Particles - navy colored */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(15)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 sm:w-2 sm:h-2 bg-navy/40 rounded-full"
                    initial={{
                      x: Math.random() * 100 + "%",
                      y: "100%",
                      opacity: 0,
                    }}
                    animate={{
                      y: "-10%",
                      opacity: [0, 0.6, 0],
                    }}
                    transition={{
                      duration: Math.random() * 4 + 3,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                      ease: "linear",
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-12 sm:py-20 md:py-32">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          <div className="w-full relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className={`flex flex-col items-center ${currentSlide === 0 ? "-mt-16" : "mt-8"}`}
              >
                {/* Only show AI image for first slide */}
                {currentSlideData.image && currentSlide === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mb-8 w-auto h-auto"
                  >
                    <Image
                      src={currentSlideData.image}
                      alt="AI Automation Image"
                      width={800}
                      height={600}
                      className="w-auto h-auto"
                    />
                  </motion.div>
                )}
                
                {/* Futuristic Icon for slides 2-5 - navy themed */}
                {isFuturisticSlide && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, type: "spring" }}
                    className="mb-8 relative"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 relative">
                      {/* Outer Ring */}
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-navy/40"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      />
                      {/* Middle Ring */}
                      <motion.div
                        className="absolute inset-2 rounded-full border border-teal/50"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      />
                      {/* Inner Glow */}
                      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-navy/10 to-teal/20 backdrop-blur-sm flex items-center justify-center">
                        <motion.div
                          className="w-3 h-3 sm:w-4 sm:h-4 bg-navy rounded-full shadow-[0_0_20px_rgba(0,50,100,0.5)]"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Title - original navy color */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-4 sm:mb-6">
                  {currentSlideData.title.split(" ").map((word, i, arr) =>
                    i === arr.length - 2 ? (
                      <span key={i}>
                        {word} <span className="gradient-text">{arr[arr.length - 1]}</span>
                      </span>
                    ) : i === arr.length - 1 ? null : (
                      <span key={i}>{word} </span>
                    ),
                  )}
                </h1>

                <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-3xl text-navy/80">
                  {currentSlideData.description}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-16 w-full sm:w-auto">
                  <Link href="/services" className="w-full sm:w-auto">
                    <Button className="bg-navy hover:bg-navy/90 text-white text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-full w-full">
                      Explore Our Services
                    </Button>
                  </Link>
                  <Link href="/contact" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      className="text-navy border-navy hover:bg-navy/10 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-full w-full"
                    >
                      Contact Us <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </Link>
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
