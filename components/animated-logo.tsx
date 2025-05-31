"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

type AnimatedLogoProps = {
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  isLoading?: boolean
  className?: string
}

export default function AnimatedLogo({ size = "md", isLoading = false, className = "" }: AnimatedLogoProps) {
  const [isAnimating, setIsAnimating] = useState(true)

  // Size mapping
  const sizes = {
    xs: 40,
    sm: 60,
    md: 80,
    lg: 120,
    xl: 160,
  }

  const svgSize = sizes[size]
  const strokeWidth = svgSize * 0.02 // Responsive stroke width

  // Reset animation when isLoading changes
  useEffect(() => {
    if (isLoading) {
      setIsAnimating(true)
    }
  }, [isLoading])

  // Animation variants for cube outlines
  const outlineVariants = (delay: number) => ({
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        delay: 0.1 + delay * 0.1, // Stagger the outlines
        duration: 0.8,
        ease: "easeInOut",
      },
    },
  })

  // Animation variants for cube fills
  const fillVariants = (delay: number) => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay: 1.2 + delay * 0.1, // Stagger the fills after all outlines are drawn
        duration: 0.5,
        ease: "easeOut",
      },
    },
  })

  // Continuous rotation animation for the entire logo
  const rotateVariants = {
    rotate: {
      rotate: [0, 360],
      transition: {
        duration: 8,
        repeat: Number.POSITIVE_INFINITY,
        ease: "linear",
      },
    },
  }

  // Continuous pulse animation for loading state
  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      opacity: [0.9, 1, 0.9],
      transition: {
        duration: 2,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "loop",
      },
    },
  }

  return (
    <div className={`relative ${className}`}>
      <motion.svg
        width={svgSize}
        height={svgSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial="hidden"
        animate={isLoading ? ["visible", "rotate", "pulse"] : "visible"}
        variants={{
          ...rotateVariants,
          ...pulseVariants,
        }}
      >
        {/* Grid layout for the cubes */}
        <g transform="translate(25, 25)">
          {/* Cube 1: Top-Middle Square - Outline */}
          <motion.rect
            x="15"
            y="0"
            width="10"
            height="10"
            stroke="#FF0000"
            strokeWidth={strokeWidth * 0.75}
            fill="none"
            variants={outlineVariants(0)}
          />
          {/* Cube 1: Top-Middle Square - Fill */}
          <motion.rect
            x="15"
            y="0"
            width="10"
            height="10"
            fill="#FF0000"
            fillOpacity="1"
            variants={fillVariants(0)}
            initial={{ opacity: 0 }}
          />

          {/* Cube 2: Top-Right Semi-circle - Outline */}
          <motion.path
            d="M35,0 h10 v10 a10,10 0 0 1 -10,-10 z"
            stroke="#FF0000"
            strokeWidth={strokeWidth * 0.75}
            fill="none"
            variants={outlineVariants(1)}
          />
          {/* Cube 2: Top-Right Semi-circle - Fill */}
          <motion.path
            d="M35,0 h10 v10 a10,10 0 0 1 -10,-10 z"
            fill="#FF0000"
            fillOpacity="1"
            variants={fillVariants(1)}
            initial={{ opacity: 0 }}
          />

          {/* Cube 3: Middle-Left Square - Outline */}
          <motion.rect
            x="0"
            y="15"
            width="10"
            height="10"
            stroke="#FF0000"
            strokeWidth={strokeWidth * 0.75}
            fill="none"
            variants={outlineVariants(2)}
          />
          {/* Cube 3: Middle-Left Square - Fill */}
          <motion.rect
            x="0"
            y="15"
            width="10"
            height="10"
            fill="#FF0000"
            fillOpacity="1"
            variants={fillVariants(2)}
            initial={{ opacity: 0 }}
          />

          {/* Cube 4: Middle-Center Square - Outline */}
          <motion.rect
            x="20"
            y="15"
            width="10"
            height="10"
            stroke="#FF0000"
            strokeWidth={strokeWidth * 0.75}
            fill="none"
            variants={outlineVariants(3)}
          />
          {/* Cube 4: Middle-Center Square - Fill */}
          <motion.rect
            x="20"
            y="15"
            width="10"
            height="10"
            fill="#FF0000"
            fillOpacity="1"
            variants={fillVariants(3)}
            initial={{ opacity: 0 }}
          />

          {/* Cube 5: Middle-Right Square - Outline */}
          <motion.rect
            x="40"
            y="15"
            width="10"
            height="10"
            stroke="#FF0000"
            strokeWidth={strokeWidth * 0.75}
            fill="none"
            variants={outlineVariants(4)}
          />
          {/* Cube 5: Middle-Right Square - Fill */}
          <motion.rect
            x="40"
            y="15"
            width="10"
            height="10"
            fill="#FF0000"
            fillOpacity="1"
            variants={fillVariants(4)}
            initial={{ opacity: 0 }}
          />

          {/* Cube 6: Bottom-Left Semi-circle - Outline */}
          <motion.path
            d="M0,40 h10 v-10 a10,10 0 0 0 -10,10 z"
            stroke="#FF0000"
            strokeWidth={strokeWidth * 0.75}
            fill="none"
            variants={outlineVariants(5)}
          />
          {/* Cube 6: Bottom-Left Semi-circle - Fill */}
          <motion.path
            d="M0,40 h10 v-10 a10,10 0 0 0 -10,10 z"
            fill="#FF0000"
            fillOpacity="1"
            variants={fillVariants(5)}
            initial={{ opacity: 0 }}
          />

          {/* Cube 7: Bottom-Middle Square - Outline */}
          <motion.rect
            x="20"
            y="40"
            width="10"
            height="10"
            stroke="#FF0000"
            strokeWidth={strokeWidth * 0.75}
            fill="none"
            variants={outlineVariants(6)}
          />
          {/* Cube 7: Bottom-Middle Square - Fill */}
          <motion.rect
            x="20"
            y="40"
            width="10"
            height="10"
            fill="#FF0000"
            fillOpacity="1"
            variants={fillVariants(6)}
            initial={{ opacity: 0 }}
          />
        </g>
      </motion.svg>
    </div>
  )
}
