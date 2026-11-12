"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin } from "lucide-react"

interface GoogleMapProps {
  center?: {
    lat: number
    lng: number
  }
  zoom?: number
  className?: string
  markers?: Array<{
    position: { lat: number; lng: number }
    title?: string
    info?: string
  }>
}

declare global {
  interface Window {
    google?: any
    initMap?: () => void
  }
}

function StaticMapFallback({ center, className }: { center: { lat: number; lng: number }; className?: string }) {
  const query = encodeURIComponent("QuardCube Labs, Kigamboni, Dar es Salaam, Tanzania")
  const googleMapsUrl = `https://maps.google.com/maps?q=${query}&t=&z=16&ie=UTF8&iwloc=&output=embed`
  
  return (
    <div className={`relative ${className || ""}`}>
      <iframe
        src={googleMapsUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="QuardCube Labs Location"
        className="rounded-lg w-full h-full"
      />
      {/* Floating QuardCube Labs Brand Indicator Badge */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm border border-navy/15 rounded-xl shadow-lg px-3.5 py-2.5 flex items-center gap-2.5 max-w-[260px] sm:max-w-xs pointer-events-auto">
        <div className="w-8 h-8 rounded-full bg-brand-red text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
          <MapPin className="h-4 w-4 fill-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-bold text-navy truncate">QuardCube Labs HQ</p>
          <p className="text-[10px] sm:text-xs text-navy/70 truncate">24 Ferry, Kigamboni, Dar es Salaam</p>
        </div>
      </div>
    </div>
  )
}

export default function GoogleMap({ 
  center = { lat: -6.8001, lng: 39.2834 },
  zoom = 15,
  className = "w-full h-96 rounded-lg",
  markers = []
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [apiKeyMissing, setApiKeyMissing] = useState(false)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      setApiKeyMissing(true)
      return
    }

    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap()
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`
      script.async = true
      script.defer = true

      window.initMap = initializeMap

      script.onerror = () => {
        console.error('Failed to load Google Maps API')
        setApiKeyMissing(true)
      }

      document.head.appendChild(script)

      return () => {
        document.head.removeChild(script)
        delete window.initMap
      }
    }

    const initializeMap = () => {
      if (!mapRef.current || !window.google) return

      map.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        styles: [
          {
            featureType: "all",
            elementType: "geometry.fill",
            stylers: [{ color: "#f1f5f9" }]
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#0ea5e9" }]
          },
          {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#1e3a8a" }, { weight: 0.5 }]
          },
          {
            featureType: "poi",
            elementType: "geometry.fill",
            stylers: [{ color: "#e2e8f0" }]
          }
        ],
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: window.google.maps.ControlPosition.TOP_RIGHT,
        },
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
      })

      const defaultMarker = new window.google.maps.Marker({
        position: center,
        map: map.current,
        title: "QuardCube Labs",
        icon: {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#1e3a8a" stroke="#ffffff" stroke-width="2"/>
              <circle cx="20" cy="20" r="8" fill="#ffffff"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20)
        }
      })

      const defaultInfoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; color: #1e3a8a; font-size: 16px; font-weight: bold;">QuardCube Labs</h3>
            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 14px;">Dar es Salaam, Tanzania</p>
            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 14px;">info@quardcubelabs.co.tz</p>
            <p style="margin: 0; color: #64748b; font-size: 14px;">+255 652 540 496</p>
          </div>
        `
      })

      defaultMarker.addListener('click', () => {
        defaultInfoWindow.open(map.current, defaultMarker)
      })

      markers.forEach((markerData) => {
        const marker = new window.google.maps.Marker({
          position: markerData.position,
          map: map.current,
          title: markerData.title || '',
        })

        if (markerData.info) {
          const infoWindow = new window.google.maps.InfoWindow({
            content: markerData.info
          })

          marker.addListener('click', () => {
            infoWindow.open(map.current, marker)
          })
        }
      })
    }

    loadGoogleMaps()

    return () => {
      if (window.initMap) {
        delete window.initMap
      }
    }
  }, [center.lat, center.lng, zoom, markers])

  if (apiKeyMissing) {
    return <StaticMapFallback center={center} className={className} />
  }

  return (
    <div className={className}>
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg bg-gray-100 flex items-center justify-center"
      >
        <div className="text-center text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy mx-auto mb-2"></div>
          <p className="text-sm">Loading map...</p>
        </div>
      </div>
    </div>
  )
}
