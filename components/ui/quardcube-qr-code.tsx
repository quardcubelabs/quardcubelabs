"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"
import QRCode from "qrcode"

interface QuardCubeQRCodeProps {
  value: string
  size?: number
  darkColor?: string
  lightColor?: string
  className?: string
  includeLabel?: boolean
  label?: string
  centerLogo?: boolean
  logoSizeRatio?: number // default ~0.18 for guaranteed scannability with Level H
  errorCorrectionLevel?: "L" | "M" | "Q" | "H"
  clickable?: boolean
}

/**
 * QuardCube QR Code Component
 * Generates ISO/IEC standard QR Codes.
 * When centerLogo is enabled, uses Level 'H' (30% Error Correction).
 * When centerLogo is disabled (e.g. on official receipts), uses Level 'M' or 'L'
 * for a simple, bold, highly legible and un-cluttered QR code matrix.
 * 
 * In development environments (localhost, local IP, or custom dev port),
 * it dynamically routes to the active local server (e.g. http://localhost:3000/verify?...)
 * so testing doesn't 404 against un-deployed production hosts.
 */
export default function QuardCubeQRCode({
  value,
  size = 96,
  darkColor = "#000000",
  lightColor = "#ffffff",
  className = "",
  includeLabel = true,
  label = "Scan to Authenticate",
  centerLogo = true,
  logoSizeRatio = 0.18,
  errorCorrectionLevel,
  clickable = true
}: QuardCubeQRCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const [resolvedValue, setResolvedValue] = useState<string>(() => {
    return value && value.trim().length > 0 ? value.trim() : "https://quardcubelabs.co.tz"
  })

  // Resolve environment-aware verification destination URL
  useEffect(() => {
    let finalUrl = value && value.trim().length > 0 ? value.trim() : "https://quardcubelabs.co.tz"

    if (typeof window !== "undefined") {
      const hostname = window.location.hostname
      const isLocal =
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("10.") ||
        hostname.startsWith("172.") ||
        window.location.port !== ""

      if (isLocal) {
        try {
          if (finalUrl.startsWith("/")) {
            finalUrl = `${window.location.origin}${finalUrl}`
          } else if (finalUrl.includes("quardcubelabs.co.tz") || finalUrl.includes("quardcubelabs.com")) {
            const urlObj = new URL(finalUrl)
            finalUrl = `${window.location.origin}${urlObj.pathname}${urlObj.search}${urlObj.hash}`
          }
        } catch (e) {
          if (finalUrl.includes("/verify")) {
            const pathAndQuery = finalUrl.substring(finalUrl.indexOf("/verify"))
            finalUrl = `${window.location.origin}${pathAndQuery}`
          }
        }
      }
    }

    setResolvedValue(finalUrl)
  }, [value])

  const ecl = errorCorrectionLevel || (centerLogo ? "H" : "M")

  useEffect(() => {
    let isMounted = true

    // Generate high-resolution QR with crisp matrix
    QRCode.toDataURL(resolvedValue, {
      errorCorrectionLevel: ecl,
      margin: 2, // Standard quiet zone for fast camera recognition
      width: Math.max(size * 3, 300), // Render at 3x resolution for super crisp scanning on screens & print
      color: {
        dark: darkColor,
        light: lightColor
      }
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url)
      })
      .catch((err) => {
        console.error("Error generating QR Code:", err)
      })

    return () => {
      isMounted = false
    }
  }, [resolvedValue, darkColor, lightColor, size])

  // Center logo size: scaled proportionally to QR width (~24%)
  const calculatedLogoSize = Math.max(18, Math.floor(size * (logoSizeRatio || 0.24)))

  const qrElement = (
    <div
      className="relative inline-flex items-center justify-center rounded-2xl bg-white p-2.5 border border-slate-200/80 shadow-xs transition-all duration-200 hover:shadow-md"
      style={{ width: size, height: size }}
      title={`Verify URL: ${resolvedValue}`}
    >
      {/* Crisp High-DPI QR Code Image */}
      {qrDataUrl ? (
        <img
          src={qrDataUrl}
          alt="Verification QR Code"
          width={size - 20}
          height={size - 20}
          className="block w-full h-full object-contain"
          style={{ imageRendering: "pixelated" }}
        />
      ) : (
        <div
          className="animate-pulse bg-slate-100 rounded-xl flex items-center justify-center"
          style={{ width: size - 20, height: size - 20 }}
        >
          <span className="text-[10px] text-slate-400 font-mono">QR</span>
        </div>
      )}

      {/* Center Turquoise Logo - Clean Circular Emblem matching user reference */}
      {centerLogo && (
        <div
          className="absolute rounded-full bg-white p-[2px] shadow-xs flex items-center justify-center pointer-events-none z-10"
          style={{
            width: calculatedLogoSize,
            height: calculatedLogoSize,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
          }}
        >
          <img
            src="/turquoise.png"
            alt="QuardCube Logo"
            className="w-full h-full object-contain rounded-full"
            style={{ imageRendering: "auto" }}
          />
        </div>
      )}
    </div>
  )

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      {clickable ? (
        <a
          href={resolvedValue}
          target="_blank"
          rel="noopener noreferrer"
          className="group cursor-pointer flex flex-col items-center"
          title="Click to open verification page"
        >
          {qrElement}
          {includeLabel && (
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mt-1.5 text-center font-mono select-none group-hover:text-teal-600 transition-colors">
              {label}
            </span>
          )}
        </a>
      ) : (
        <>
          {qrElement}
          {includeLabel && (
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mt-1.5 text-center font-mono select-none">
              {label}
            </span>
          )}
        </>
      )}
    </div>
  )
}
