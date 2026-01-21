"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { MessageSquare, Send, TestTube, User, ShoppingCart, FileText } from "lucide-react"

export default function WhatsAppTestPanel() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])
  const { toast } = useToast()

  const runTest = async (testType: string, testName: string) => {
    setIsLoading(true)
    const startTime = Date.now()
    
    try {
      const response = await fetch('/api/whatsapp/test', {
        method: testType === 'general' ? 'GET' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: testType !== 'general' ? JSON.stringify({ type: testType }) : undefined,
      })

      const result = await response.json()
      const duration = Date.now() - startTime
      
      const resultMessage = `${testName}: ${result.success ? '✅ SUCCESS' : '❌ FAILED'} (${duration}ms) - ${result.message}`
      
      setTestResults(prev => [resultMessage, ...prev.slice(0, 9)]) // Keep last 10 results
      
      toast({
        title: result.success ? "Test Successful" : "Test Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
        duration: 3000,
      })
    } catch (error) {
      const errorMessage = `${testName}: ❌ ERROR - ${error instanceof Error ? error.message : 'Network error'}`
      setTestResults(prev => [errorMessage, ...prev.slice(0, 9)])
      
      toast({
        title: "Test Error",
        description: error instanceof Error ? error.message : 'Network error occurred',
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testButtons = [
    {
      type: 'general',
      name: 'Connection Test',
      icon: MessageSquare,
      description: 'Test basic WhatsApp API connection',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      type: 'signup',
      name: 'Signup Notification',
      icon: User,
      description: 'Test customer signup notification',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      type: 'purchase',
      name: 'Purchase Notification',
      icon: ShoppingCart,
      description: 'Test purchase order notification',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      type: 'quote',
      name: 'Quote Request',
      icon: FileText,
      description: 'Test quote request notification',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
  ]

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-navy">
          <TestTube className="h-5 w-5" />
          WhatsApp Integration Test Panel
        </CardTitle>
        <p className="text-sm text-gray-600">
          Test WhatsApp notifications to ensure everything is working properly
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Test Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {testButtons.map((button) => {
              const Icon = button.icon
              return (
                <Button
                  key={button.type}
                  onClick={() => runTest(button.type, button.name)}
                  disabled={isLoading}
                  className={`${button.color} text-white p-4 h-auto flex flex-col items-start text-left`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{button.name}</span>
                  </div>
                  <span className="text-xs opacity-90">{button.description}</span>
                </Button>
              )
            })}
          </div>

          {/* Configuration Info */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Configuration Status</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={process.env.WHATSAPP_ACCESS_TOKEN ? "default" : "destructive"}>
                    {process.env.WHATSAPP_ACCESS_TOKEN ? "✓" : "✗"} Access Token
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={process.env.WHATSAPP_PHONE_NUMBER_ID ? "default" : "destructive"}>
                    {process.env.WHATSAPP_PHONE_NUMBER_ID ? "✓" : "✗"} Phone ID
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={process.env.WHATSAPP_BUSINESS_PHONE ? "default" : "destructive"}>
                    {process.env.WHATSAPP_BUSINESS_PHONE ? "✓" : "✗"} Business Phone
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-xs font-mono">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded ${
                        result.includes('SUCCESS')
                          ? 'bg-green-50 text-green-800'
                          : 'bg-red-50 text-red-800'
                      }`}
                    >
                      {result}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Make sure your WhatsApp Business API is properly configured</li>
                <li>Your business phone number ({process.env.WHATSAPP_BUSINESS_PHONE || 'Not Set'}) should be registered</li>
                <li>Click each test button to verify different notification types</li>
                <li>Check your WhatsApp for the test messages</li>
                <li>Green results indicate successful API calls</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}