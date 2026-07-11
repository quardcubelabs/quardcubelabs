'use client'

import { MessageCircle } from 'lucide-react'
import { getBusinessWhatsAppUrl } from '@/lib/whatsapp-utils'

interface WhatsAppButtonProps {
  phone?: string
  message?: string
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function WhatsAppButton({
  phone = '255623893383',
  message,
  className = '',
  showLabel = true,
  size = 'md',
}: WhatsAppButtonProps) {
  const whatsappUrl = getBusinessWhatsAppUrl(phone)
  
  const sizeClasses = {
    sm: 'p-2 h-10 w-10',
    md: 'p-3 h-12 w-12',
    lg: 'p-4 h-14 w-14',
  }

  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-7 w-7',
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        inline-flex items-center gap-2 rounded-full 
        bg-green-500 text-white shadow-lg 
        hover:bg-green-600 transition-all duration-300
        ${sizeClasses[size]}
        ${className}
      `}
      aria-label="Chat on WhatsApp"
      title="Message us on WhatsApp"
    >
      <MessageCircle className={iconSizes[size]} />
      {showLabel && <span className="text-sm font-medium">Chat</span>}
    </a>
  )
}
