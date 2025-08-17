"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Mail, MessageSquare, Send, Loader2 } from "lucide-react"
import type { Order } from "@/lib/order-actions"

interface NotificationActionsProps {
  order: Order
  userEmail?: string
  userPhone?: string
}

export default function NotificationActions({ order, userEmail, userPhone }: NotificationActionsProps) {
  const [isLoading, setIsLoading] = useState({
    email: false,
    sms: false,
    invoice: false
  })
  const { toast } = useToast()

  const sendNotification = async (type: string, contact: string) => {
    try {
      setIsLoading(prev => ({ ...prev, [type]: true }))

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          type,
          email: type.includes('email') ? contact : undefined,
          phone: type.includes('sms') ? contact : undefined,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Notification Sent!",
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} notification sent successfully.`,
        })
      } else {
        throw new Error(result.error || 'Failed to send notification')
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      toast({
        title: "Error",
        description: `Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(prev => ({ ...prev, [type]: false }))
    }
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-navy mb-2">Resend Notifications</h4>
      
      <div className="flex flex-wrap gap-2">
        {/* Email Notifications */}
        {userEmail && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendNotification('confirmation_email', userEmail)}
              disabled={isLoading.email}
              className="text-xs"
            >
              {isLoading.email ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Mail className="h-3 w-3 mr-1" />
              )}
              Email Confirmation
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => sendNotification('invoice_email', userEmail)}
              disabled={isLoading.invoice}
              className="text-xs"
            >
              {isLoading.invoice ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Send className="h-3 w-3 mr-1" />
              )}
              Email Invoice
            </Button>
          </>
        )}

        {/* SMS Notifications */}
        {userPhone && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendNotification('confirmation_sms', userPhone)}
            disabled={isLoading.sms}
            className="text-xs"
          >
            {isLoading.sms ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <MessageSquare className="h-3 w-3 mr-1" />
            )}
            SMS Confirmation
          </Button>
        )}
      </div>

      {!userEmail && !userPhone && (
        <p className="text-xs text-navy/60">
          Add email and phone to your profile to enable notifications
        </p>
      )}
    </div>
  )
}
