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
    email: 'quardcube.labs@gmail.com',
    phone: '+255623893383',
    type: 'test_sms',
    message: 'Hello from QuardCube Labs NextSMS Integration!'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [serviceStatus, setServiceStatus] = useState<any>(null)
  const { toast } = useToast()

  const checkServiceStatus = async () => {
    try {
      const response = await fetch('/api/notifications')
      const status = await response.json()
      setServiceStatus(status)
      toast({
        title: "Status Checked",
        description: status.smsService?.status?.message || "Service status refreshed",
      })
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
    if (formData.type === 'test_sms' && !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please provide a phone number for the test SMS",
        variant: "destructive",
      })
      return
    }

    if (formData.type !== 'test_sms' && !formData.orderId && (!formData.email && !formData.phone)) {
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
          orderId: formData.orderId || undefined,
          type: formData.type,
          email: formData.type.includes('email') ? formData.email : undefined,
          phone: formData.type.includes('sms') ? formData.phone : undefined,
          message: formData.type === 'test_sms' ? formData.message : undefined,
        }),
      })

      const result = await response.json()

      if (response.ok && (result.success || result.results?.sms || result.results?.email)) {
        toast({
          title: "Success!",
          description: result.message || "Test notification sent successfully",
        })
      } else {
        throw new Error(result.error || result.results?.errors?.[0] || 'Failed to send notification')
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
            <Label htmlFor="type">Notification Type</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-background text-foreground rounded-md"
            >
              <option value="test_sms">⚡ Direct Test SMS (NextSMS)</option>
              <option value="confirmation_sms">SMS Order Confirmation</option>
              <option value="status_sms">SMS Order Status Update</option>
              <option value="confirmation_email">Email Confirmation</option>
              <option value="invoice_email">Email Invoice</option>
            </select>
          </div>

          {formData.type === 'test_sms' && (
            <div className="space-y-2">
              <Label htmlFor="message">SMS Message Content</Label>
              <Input
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Enter SMS message text"
              />
            </div>
          )}

          {formData.type !== 'test_sms' && (
            <div className="space-y-2">
              <Label htmlFor="orderId">Order ID</Label>
              <Input
                id="orderId"
                value={formData.orderId}
                onChange={(e) => setFormData(prev => ({ ...prev, orderId: e.target.value }))}
                placeholder="Enter order ID"
              />
            </div>
          )}

          {formData.type.includes('email') && (
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
          )}

          {formData.type.includes('sms') && (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Tanzanian / International)</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="e.g. 0712345678 or 255623893383"
              />
            </div>
          )}

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
