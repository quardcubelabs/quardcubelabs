"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"

export default function VideoPreview() {
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const isMounted = useRef(true)

  // Track component mount status
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const handlePlayPause = async () => {
    if (!videoRef.current || !isMounted.current) return

    try {
      if (isPlaying) {
        videoRef.current.pause()
        if (isMounted.current) {
          setIsPlaying(false)
        }
      } else {
        // Use await with try/catch to handle potential play() rejection
        await videoRef.current.play()
        if (isMounted.current) {
          setIsPlaying(true)
        }
      }
    } catch (error) {
      console.error("Video playback error:", error)
      // Reset playing state if there was an error
      if (isMounted.current) {
        setIsPlaying(false)
      }
    }
  }

  // Clean up video when component unmounts
  useEffect(() => {
    return () => {
      if (videoRef.current && isPlaying) {
        videoRef.current.pause()
        videoRef.current.src = ""
        videoRef.current.load()
      }
    }
  }, [isPlaying])

  return (
    <section id="video-preview" className="py-16 sm:py-20 md:py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">
            Discover <span className="gradient-text">QuardCubeLabs</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-navy/80 max-w-3xl mx-auto">
            Watch our company overview video to learn more about our services and approach
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden border-2 border-navy/20 shadow-xl"
        >
          <div className="relative aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              poster="/placeholder.svg?height=720&width=1280"
              controls={isPlaying}
              preload="metadata"
              onPlay={() => isMounted.current && setIsPlaying(true)}
              onPause={() => isMounted.current && setIsPlaying(false)}
              onEnded={() => isMounted.current && setIsPlaying(false)}
            >
              <source src="https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {!isPlaying && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-navy/30 cursor-pointer"
                onClick={handlePlayPause}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-navy flex items-center justify-center">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
