"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Smartphone, X, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getPaymentStatus, processMobilePayment, sendUssdPush } from "@/lib/payment-actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { countries } from "@/lib/countries"
import { useAuth } from "@/contexts/auth-context"

type MobilePaymentModalProps = {
  amount: number
  onComplete: () => void
  onCancel: () => void
}

export default function MobilePaymentModal({ amount, onComplete, onCancel }: MobilePaymentModalProps) {
  const { user } = useAuth()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "ussd_sent" | "success" | "failed">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [networkProvider, setNetworkProvider] = useState<"unknown" | "mpesa" | "tigopesa" | "airtel" | "other">(
    "unknown",
  )
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [countryCode, setCountryCode] = useState<string>(user?.user_metadata?.country || "TZ")
  const [selectedProvider, setSelectedProvider] = useState<string>("")

  // Get country dial code
  const getCountryDialCode = (): string => {
    const country = countries.find((c) => c.code === countryCode)
    return country ? country.dialCode : "+255" // Default to Tanzania
  }

  // Format phone number as user types
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, "")
    if (input.length <= 12) {
      let formatted = input
      if (input.length > 3) {
        formatted = `${input.slice(0, 3)}-${input.slice(3)}`
      }
      if (input.length > 6) {
        formatted = `${formatted.slice(0, 7)}-${formatted.slice(7)}`
      }
      setPhoneNumber(formatted)

      // Auto-detect provider based on number prefix (Tanzania example)
      if (countryCode === "TZ") {
        const numericOnly = input.replace(/\D/g, "")
        if (numericOnly.startsWith("0")) {
          // Convert local format to international
          const internationalFormat = "255" + numericOnly.substring(1)
          detectProviderFromNumber(internationalFormat)
        } else {
          detectProviderFromNumber(numericOnly)
        }
      }
    }
  }

  // Detect provider from phone number (Tanzania example)
  const detectProviderFromNumber = (number: string) => {
    if (number.startsWith("255")) {
      const prefix = number.substring(3, 5)
      if (["67", "71", "65"].includes(prefix)) {
        setNetworkProvider("tigopesa")
      } else if (["74", "75", "76", "78"].includes(prefix)) {
        setNetworkProvider("mpesa")
      } else if (["68", "69"].includes(prefix)) {
        setNetworkProvider("airtel")
      } else {
        setNetworkProvider("unknown")
      }
    }
  }

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  // Poll for payment status
  const startPollingPaymentStatus = (txnId: string) => {
    setTransactionId(txnId)

    const interval = setInterval(async () => {
      try {
        if (!txnId) return

        const result = await getPaymentStatus(txnId)

        if (result.status === "completed") {
          clearInterval(interval)
          setPollingInterval(null)
          setPaymentStatus("success")

          // Auto-complete after showing success
          setTimeout(() => {
            onComplete()
          }, 2000)
        } else if (result.status === "failed") {
          clearInterval(interval)
          setPollingInterval(null)
          setPaymentStatus("failed")
          setErrorMessage(result.message || "Payment failed. Please try again.")
        }
      } catch (error) {
        console.error("Error checking payment status:", error)
      }
    }, 3000) // Check every 3 seconds

    setPollingInterval(interval)
  }

  const handleInitiatePayment = async () => {
    if (phoneNumber.replace(/\D/g, "").length < 9) {
      setErrorMessage("Please enter a valid phone number")
      return
    }

    if (selectedProvider === "" && networkProvider === "unknown") {
      setErrorMessage("Please select a mobile payment provider")
      return
    }

    const provider = selectedProvider || networkProvider

    setIsProcessing(true)
    setErrorMessage("")

    try {
      const numericPhone = phoneNumber.replace(/\D/g, "")
      const fullPhoneNumber = numericPhone.startsWith("0")
        ? getCountryDialCode().replace("+", "") + numericPhone.substring(1)
        : numericPhone

      if (provider === "tigopesa") {
        // For Tigo numbers, send USSD push
        const result = await sendUssdPush({
          phoneNumber: fullPhoneNumber,
          amount: amount,
          reference: `Order-${Date.now()}`,
          description: "Payment for QuardCubeLabs order",
          provider: "tigopesa",
        })

        if (result.success && result.transactionId) {
          setPaymentStatus("ussd_sent")
          // Start polling for payment status
          startPollingPaymentStatus(result.transactionId)
        } else {
          setPaymentStatus("failed")
          setErrorMessage(result.message)
        }
      } else if (provider === "mpesa") {
        // For M-Pesa numbers
        const result = await sendUssdPush({
          phoneNumber: fullPhoneNumber,
          amount: amount,
          reference: `Order-${Date.now()}`,
          description: "Payment for QuardCubeLabs order",
          provider: "mpesa",
        })

        if (result.success && result.transactionId) {
          setPaymentStatus("ussd_sent")
          // Start polling for payment status
          startPollingPaymentStatus(result.transactionId)
        } else {
          setPaymentStatus("failed")
          setErrorMessage(result.message)
        }
      } else {
        // For other networks, use the regular mobile payment flow
        const result = await processMobilePayment({
          phoneNumber: fullPhoneNumber,
          amount: amount,
          reference: `Order-${Date.now()}`,
          description: "Payment for QuardCubeLabs order",
          provider: provider,
        })

        if (result.success && result.transactionId) {
          setPaymentStatus("success")
          // Auto-complete after showing success
          setTimeout(() => {
            onComplete()
          }, 2000)
        } else {
          setPaymentStatus("failed")
          setErrorMessage(result.message)
        }
      }
    } catch (error) {
      console.error("Error processing payment:", error)
      setPaymentStatus("failed")
      setErrorMessage("An unexpected error occurred. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // For demo purposes, simulate payment completion
  const simulatePaymentCompletion = () => {
    if (paymentStatus === "ussd_sent" && transactionId) {
      setPaymentStatus("success")
      setTimeout(() => {
        onComplete()
      }, 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-xs sm:max-w-md w-full mx-4 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">Mobile Payment</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {paymentStatus === "idle" && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-navy/10 mx-auto flex items-center justify-center mb-4">
                  <Smartphone className="h-8 w-8 text-navy" />
                </div>
                <h3 className="font-bold text-lg">Mobile Payment</h3>
                <p className="text-sm text-gray-600">Pay using your mobile money account</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="provider" className="block text-sm font-medium mb-1">
                  Payment Provider
                </label>
                <Select
                  value={selectedProvider || networkProvider}
                  onValueChange={(value) => {
                    setSelectedProvider(value)
                    setNetworkProvider(value as any)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="tigopesa">Tigo Pesa</SelectItem>
                    <SelectItem value="airtel">Airtel Money</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="country" className="block text-sm font-medium mb-1">
                  Country
                </label>
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name} ({country.dialCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium mb-1">
                  Phone Number
                </label>
                <div className="flex">
                  <div className="bg-gray-100 border border-gray-300 rounded-l-md px-3 flex items-center text-gray-600">
                    {getCountryDialCode()}
                  </div>
                  <input
                    type="text"
                    id="phone"
                    placeholder="712 345 678"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className="flex-1 p-3 rounded-r-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
                  />
                </div>
                {networkProvider !== "unknown" && (
                  <p className="mt-1 text-xs">
                    Detected: <span className="font-medium capitalize">{networkProvider}</span> number
                  </p>
                )}
              </div>

              <div className="text-sm text-gray-600">
                <p>
                  Amount to be charged: <span className="font-bold">${amount.toFixed(2)}</span>
                </p>
              </div>

              {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}

              <Button
                onClick={handleInitiatePayment}
                disabled={phoneNumber.replace(/\D/g, "").length < 9 || isProcessing}
                className="w-full bg-navy hover:bg-navy/90 text-white py-3"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : networkProvider === "tigopesa" || networkProvider === "mpesa" ? (
                  "Send USSD Prompt"
                ) : (
                  "Process Payment"
                )}
              </Button>
            </div>
          )}

          {paymentStatus === "ussd_sent" && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 mx-auto flex items-center justify-center mb-4">
                <Smartphone className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-xl">USSD Prompt Sent!</h3>
              <p className="text-gray-600">
                Please check your phone for a USSD prompt and enter your PIN to complete the payment.
              </p>
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 text-navy animate-spin" />
              </div>
              <p className="text-sm text-gray-500">Waiting for payment confirmation...</p>
              <p className="text-sm text-gray-500">
                This window will automatically update when the payment is complete.
              </p>

              {/* For demo purposes only - simulate payment completion */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-400 mb-2">Demo Mode</p>
                <Button variant="outline" onClick={simulatePaymentCompletion} className="text-sm">
                  Simulate Payment Completion
                </Button>
              </div>

              <Button variant="outline" onClick={onCancel} className="mt-4">
                Cancel
              </Button>
            </div>
          )}

          {paymentStatus === "success" && (
            <div className="space-y-4 text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-4">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="font-bold text-xl">Payment Successful!</h3>
              <p className="text-gray-600">
                Your payment of <span className="font-bold">${amount.toFixed(2)}</span> has been processed successfully.
              </p>
              <p className="text-sm text-gray-500">Redirecting to order confirmation...</p>
            </div>
          )}

          {paymentStatus === "failed" && (
            <div className="space-y-4 text-center">
              <div className="w-20 h-20 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-4">
                <X className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="font-bold text-xl">Payment Failed</h3>
              <p className="text-gray-600">
                {errorMessage || "There was an issue processing your payment. Please try again."}
              </p>
              <Button onClick={() => setPaymentStatus("idle")} className="bg-navy hover:bg-navy/90 text-white">
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
