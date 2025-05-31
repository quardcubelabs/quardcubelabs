"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { initiatePaypalPayment, checkPaypalPaymentStatus } from "@/lib/payment-actions"
import Image from "next/image"

type PaypalPaymentProps = {
  amount: number
  onComplete: (transactionId: string) => void
  onError: (message: string) => void
}

export default function PaypalPayment({ amount, onComplete, onError }: PaypalPaymentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [paymentInitiated, setPaymentInitiated] = useState(false)
  const [paymentId, setPaymentId] = useState("")
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [paypalCredentials, setPaypalCredentials] = useState({
    email: "",
    password: "",
  })
  const [showCredentials, setShowCredentials] = useState(false)

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  const handlePaypalClick = async () => {
    setShowCredentials(true)
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await initiatePaypalPayment({
        amount,
        returnUrl: window.location.origin + "/cart?paypal=success",
        cancelUrl: window.location.origin + "/cart?paypal=cancel",
        email: paypalCredentials.email,
        password: paypalCredentials.password,
      })

      if (result.success && result.paymentId) {
        setPaymentId(result.paymentId)
        setPaymentInitiated(true)
        setShowCredentials(false)

        // Start polling for payment status
        const interval = setInterval(async () => {
          try {
            const statusResult = await checkPaypalPaymentStatus(result.paymentId)

            if (statusResult.status === "completed") {
              clearInterval(interval)
              setPollingInterval(null)
              onComplete(result.paymentId)
            } else if (statusResult.status === "failed" || statusResult.status === "cancelled") {
              clearInterval(interval)
              setPollingInterval(null)
              onError(statusResult.message || "Payment was cancelled or failed")
            }
          } catch (error) {
            console.error("Error checking PayPal payment status:", error)
          }
        }, 3000) // Check every 3 seconds

        setPollingInterval(interval)
      } else {
        onError(result.message || "Failed to initiate PayPal payment")
      }
    } catch (error) {
      console.error("Error initiating PayPal payment:", error)
      onError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPaypalCredentials((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="space-y-4">
      {!paymentInitiated && !showCredentials && (
        <>
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Image src="/paypal-logo.svg" alt="PayPal" width={80} height={80} />
            </div>
            <h3 className="font-bold text-lg">Pay with PayPal</h3>
            <p className="text-sm text-gray-600">Fast, secure payment using your PayPal account</p>
          </div>

          <div className="text-sm text-gray-600 mb-4">
            <p>
              Amount to be charged: <span className="font-bold">${amount.toFixed(2)}</span>
            </p>
          </div>

          <Button
            onClick={handlePaypalClick}
            disabled={isLoading}
            className="w-full bg-[#0070ba] hover:bg-[#003087] text-white py-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Continue with PayPal"
            )}
          </Button>
        </>
      )}

      {showCredentials && (
        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Image src="/paypal-logo.svg" alt="PayPal" width={80} height={80} />
            </div>
            <h3 className="font-bold text-lg">Log in to PayPal</h3>
            <p className="text-sm text-gray-600">Enter your PayPal credentials to complete the payment</p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={paypalCredentials.email}
              onChange={handleInputChange}
              required
              className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0070ba] focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={paypalCredentials.password}
              onChange={handleInputChange}
              required
              className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0070ba] focus:border-transparent"
            />
          </div>

          <div className="text-sm text-gray-600">
            <p>
              Amount to be charged: <span className="font-bold">${amount.toFixed(2)}</span>
            </p>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full bg-[#0070ba] hover:bg-[#003087] text-white py-3">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Log In and Pay"
            )}
          </Button>

          <Button type="button" variant="outline" onClick={() => setShowCredentials(false)} className="w-full">
            Cancel
          </Button>
        </form>
      )}

      {paymentInitiated && (
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-4 text-[#0070ba] animate-spin" />
          <p className="font-medium">Processing your PayPal payment...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we complete your transaction.</p>
        </div>
      )}
    </div>
  )
}
