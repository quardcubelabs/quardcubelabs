"use client"

import { useEffect, useRef } from "react"

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

export default function GoogleMap({ 
  center = { lat: -6.8001, lng: 39.2834 }, // Dar es Salaam, Tanzania coordinates
  zoom = 15,
  className = "w-full h-96 rounded-lg",
  markers = []
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)

  useEffect(() => {
    const loadGoogleMaps = () => {
      // Check if Google Maps API is already loaded
      if (window.google && window.google.maps) {
        initializeMap()
        return
      }

      // Create script element
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&callback=initMap`
      script.async = true
      script.defer = true

      // Set global callback
      window.initMap = initializeMap

      // Handle script load error
      script.onerror = () => {
        console.error('Failed to load Google Maps API')
        if (mapRef.current) {
          mapRef.current.innerHTML = `
            <div class="flex items-center justify-center h-full bg-gray-100 rounded-lg">
              <div class="text-center text-gray-600">
                <p class="text-lg font-medium mb-2">Map not available</p>
                <p class="text-sm">Please check your Google Maps API configuration</p>
              </div>
            </div>
          `
        }
      }

      document.head.appendChild(script)

      // Cleanup function
      return () => {
        document.head.removeChild(script)
        delete window.initMap
      }
    }

    const initializeMap = () => {
      if (!mapRef.current || !window.google) return

      // Create map
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

      // Add default marker for company location
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

      // Add info window for default marker
      const defaultInfoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; color: #1e3a8a; font-size: 16px; font-weight: bold;">QuardCube Labs</h3>
            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 14px;">📍 Dar es Salaam, Tanzania</p>
            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 14px;">📧 info@quardcubelabs.com</p>
            <p style="margin: 0; color: #64748b; font-size: 14px;">📞 +255 XXX XXX XXX</p>
          </div>
        `
      })

      defaultMarker.addListener('click', () => {
        defaultInfoWindow.open(map.current, defaultMarker)
      })

      // Add additional markers if provided
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

    // Cleanup
    return () => {
      if (window.initMap) {
        delete window.initMap
      }
    }
  }, [center.lat, center.lng, zoom, markers])

  // Fallback content while loading
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
