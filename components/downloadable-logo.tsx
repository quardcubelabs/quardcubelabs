"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DownloadableLogo() {
  const [size, setSize] = useState(200)

  // SVG content for the logo
  const svgContent = `
<svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="50" cy="50" r="50" fill="#40E0D0"/>
  
  <!-- Border circle -->
  <circle cx="50" cy="50" r="45" stroke="#000080" strokeWidth="3" fill="none"/>
  
  <!-- Dotted circle -->
  <circle cx="50" cy="50" r="40" stroke="#000080" strokeWidth="1" strokeDasharray="2 2" fill="none"/>

  <!-- Grid elements - scaled to fit inside dotted circle with space -->
  <!-- Row 1: Empty, Square, Semi-circle -->
  <rect x="40" y="25" width="10" height="10" fill="#FF0000"/>
  <path d="M60,25 h10 v10 a10,10 0 0 1 -10,-10 z" fill="#FF0000"/>

  <!-- Row 2: Square, Square, Square -->
  <rect x="25" y="40" width="10" height="10" fill="#FF0000"/>
  <rect x="45" y="40" width="10" height="10" fill="#FF0000"/>
  <rect x="65" y="40" width="10" height="10" fill="#FF0000"/>

  <!-- Row 3: Semi-circle, Square, Empty -->
  <path d="M25,65 h10 v-10 a10,10 0 0 0 -10,10 z" fill="#FF0000"/>
  <rect x="45" y="65" width="10" height="10" fill="#FF0000"/>
  
  <!-- Company name -->
  <text x="50" y="90" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="10" fill="#000080" textAnchor="middle">QUARDCUBELABS</text>
</svg>
`.trim()

  // Function to download the SVG
  const downloadSVG = () => {
    const blob = new Blob([svgContent], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "quardcubelabs-logo.svg"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-white/50 rounded-2xl border-2 border-navy/20">
      <h2 className="text-xl font-bold text-navy">QuardCubeLabs Logo</h2>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div dangerouslySetInnerHTML={{ __html: svgContent }} />
      </div>

      <div className="w-full max-w-xs">
        <label htmlFor="size-slider" className="block text-sm font-medium text-navy mb-2">
          Logo Size: {size}px
        </label>
        <input
          id="size-slider"
          type="range"
          min="50"
          max="500"
          step="10"
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-full h-2 bg-navy/20 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <Button onClick={downloadSVG} className="bg-navy hover:bg-navy/90 text-white">
        <Download className="h-4 w-4 mr-2" />
        Download SVG
      </Button>
    </div>
  )
}
