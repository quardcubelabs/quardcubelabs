"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface AdminLoadingProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}

export default function AdminLoading({ 
  message = "Loading...", 
  size = 'md',
  fullScreen = false 
}: AdminLoadingProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-6 h-6 scale-[1.5]'
      case 'md':
        return 'w-8 h-8 scale-[2]'
      case 'lg':
        return 'w-10 h-10 scale-[2.5]'
      default:
        return 'w-8 h-8 scale-[2]'
    }
  }

  const getGridSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3'
      case 'md':
        return 'w-4 h-4'
      case 'lg':
        return 'w-6 h-6'
      default:
        return 'w-4 h-4'
    }
  }

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-sm'
      case 'md':
        return 'text-base'
      case 'lg':
        return 'text-lg'
      default:
        return 'text-base'
    }
  }

  // Center the loading component like the normal page
  const getPositionClasses = () => {
    return "fixed inset-0 z-50 flex items-center justify-center"
  }

  return (
    <>
      <style jsx>{`
        .border-turquoise {
          border-color: #40E0D0;
        }
        .bg-turquoise {
          background-color: #40E0D0;
        }
        @keyframes popFade {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          20% {
            transform: scale(1);
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        .animated-shape {
          animation: popFade 2s ease-in-out infinite;
        }
      `}</style>
      
      {/* Overlay with blur effect */}
      <div className="fixed inset-0 backdrop-blur-sm z-40 bg-white" />
      
      {/* Loading content positioned dynamically based on screen size */}
      <div className={getPositionClasses()}>
        <div className="flex flex-col items-center justify-center">
            <div className={`relative flex items-center justify-center rounded-full border-[2.5px] border-turquoise bg-turquoise ${getSizeClasses()}`}>
              <div className={`relative grid grid-cols-3 grid-rows-3 gap-[1px] ${getGridSizeClasses()}`}>
                {/* Row 1 */}
                <div></div>
                <div className="bg-red-600 animated-shape" style={{ animationDelay: "0.1s" }}></div>
                <div className="bg-red-600 rounded-tr-full animated-shape" style={{ animationDelay: "0.2s" }}></div>

                {/* Row 2 */}
                <div className="bg-red-600 animated-shape" style={{ animationDelay: "0.3s" }}></div>
                <div className="bg-red-600 animated-shape" style={{ animationDelay: "0.4s" }}></div>
                <div className="bg-red-600 animated-shape" style={{ animationDelay: "0.5s" }}></div>

                {/* Row 3 */}
                <div className="bg-red-600 rounded-bl-full animated-shape" style={{ animationDelay: "0.6s" }}></div>
                <div className="bg-red-600 animated-shape" style={{ animationDelay: "0.7s" }}></div>
                <div></div>
              </div>
            </div>
            
            {/* Removed message display - only show animation */}
          </div>
      </div>
    </>
  )
}
