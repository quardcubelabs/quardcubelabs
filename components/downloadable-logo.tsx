"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function DownloadableLogo() {
  const [size, setSize] = useState(200)

  // Function to download the PNG logo
  const downloadLogo = async () => {
    try {
      const response = await fetch('/quardcubelabs.png')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "quardcubelabs-logo.png"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading logo:", error)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-white/50 rounded-2xl border-2 border-navy/20">
      <h2 className="text-xl font-bold text-navy">QuardCubeLabs Logo</h2>

      <div className="bg-white p-4 rounded-lg shadow-sm relative" style={{ width: size, height: size }}>
        <Image
          src="/quardcubelabs.png"
          alt="QuardCubeLabs Logo"
          fill
          className="object-contain"
        />
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

      <Button onClick={downloadLogo} className="bg-navy hover:bg-navy/90 text-white">
        <Download className="h-4 w-4 mr-2" />
        Download PNG Logo
      </Button>
    </div>
  )
}
