'use client'

import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FloatingWhatsAppProps {
  phone?: string
  position?: 'left' | 'right'
  showLabel?: boolean
}

export default function FloatingWhatsApp({
  phone = '255623893383',
  position = 'right',
  showLabel = true,
}: FloatingWhatsAppProps) {
  const [isOpen, setIsOpen] = useState(false)

  const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=Hello%20QuardCubeLabs%2C%20I%20have%20a%20question`

  const positionClass = position === 'left' ? 'left-6' : 'right-6'

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 ${positionClass} p-3 rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 transition-all duration-300 z-40 animate-pulse hover:animate-none`}
        aria-label="WhatsApp Chat"
        title="Chat with us on WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat Preview */}
      {isOpen && (
        <div
          className={`fixed bottom-20 ${positionClass} w-80 bg-white rounded-lg shadow-2xl p-4 z-40 animate-in fade-in slide-in-from-bottom-2`}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-500 rounded-full">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-navy">QuardCube Labs</h3>
                <p className="text-xs text-green-600 font-medium">Online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="bg-gray-50 rounded p-3 mb-4 text-sm text-navy">
            <p>Hi there! 👋 How can we help you today? Feel free to reach out with any questions.</p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Start Chat
          </a>

          <p className="text-xs text-gray-500 text-center mt-3">
            +255 623 893 383
          </p>
        </div>
      )}
    </>
  )
}
