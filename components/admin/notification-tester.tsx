"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, MessageSquare, Settings, CheckCircle, XCircle } from "lucide-react"

export default function NotificationTester() {
  const [formData, setFormData] = useState({
    orderId: '',
    email: '',
    phone: '',
    type: 'confirmation_email'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [serviceStatus, setServiceStatus] = useState<any>(null)
  const { toast } = useToast()

  const checkServiceStatus = async () => {
    try {
      const response = await fetch('/api/notifications')
      const status = await response.json()
      setServiceStatus(status)
    } catch (error) {
      console.error('Error checking service status:', error)
      toast({
        title: "Error",
        description: "Failed to check service status",
        variant: "destructive",
      })
    }
  }

  const sendTestNotification = async () => {
    if (!formData.orderId || (!formData.email && !formData.phone)) {
      toast({
        title: "Missing Information",
        description: "Please provide order ID and either email or phone number",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: formData.orderId,
          type: formData.type,
          email: formData.type.includes('email') ? formData.email : undefined,
          phone: formData.type.includes('sms') ? formData.phone : undefined,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Test notification sent successfully",
        })
      } else {
        throw new Error(result.error || 'Failed to send notification')
      }
    } catch (error) {
      console.error('Error sending test notification:', error)
      toast({
        title: "Error",
        description: `Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Service Tester
          </CardTitle>
          <CardDescription>
            Test email and SMS notifications for order confirmations and invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={checkServiceStatus} variant="outline" className="w-full">
            Check Service Status
          </Button>

          {serviceStatus && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4" />
                    <span className="font-medium">Email Service</span>
                    {serviceStatus.emailService?.configured ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <Badge variant={serviceStatus.emailService?.configured ? "default" : "destructive"}>
                    {serviceStatus.emailService?.configured ? "Configured" : "Not Configured"}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    Host: {serviceStatus.emailService?.host}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4" />
                    <span className="font-medium">SMS Service</span>
                    {serviceStatus.smsService?.configured ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <Badge variant={serviceStatus.smsService?.configured ? "default" : "destructive"}>
                    {serviceStatus.smsService?.configured ? "Configured" : "Not Configured"}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    Provider: {serviceStatus.smsService?.provider}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send Test Notification</CardTitle>
          <CardDescription>
            Enter order details to send a test notification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orderId">Order ID</Label>
            <Input
              id="orderId"
              value={formData.orderId}
              onChange={(e) => setFormData(prev => ({ ...prev, orderId: e.target.value }))}
              placeholder="Enter order ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter phone number (e.g., +255712345678)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Notification Type</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="confirmation_email">Email Confirmation</option>
              <option value="invoice_email">Email Invoice</option>
              <option value="confirmation_sms">SMS Confirmation</option>
              <option value="status_sms">SMS Status Update</option>
            </select>
          </div>

          <Button
            onClick={sendTestNotification}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Sending..." : "Send Test Notification"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
