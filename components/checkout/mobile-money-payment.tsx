"use client"

import { useState, useEffect, useCallback } from "react"
import { Smartphone, X, Check, Loader2, ArrowLeft, Shield, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { getPaymentStatus, initiateMobileMoneyPush } from "@/lib/payment-actions"

type MobileMoneyProvider = {
  id: string
  name: string
  shortName: string
  color: string
  bgColor: string
  borderColor: string
  prefixes: string[]
  logo: string
  image: string
}

const mobileMoneyProviders: MobileMoneyProvider[] = [
  {
    id: "mpesa",
    name: "M-Pesa",
    shortName: "M-Pesa",
    color: "#00A651",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    prefixes: ["74", "75", "76", "78"],
    logo: "📱",
    image: "/images/payment/mpesa.png",
  },
  {
    id: "halopesa",
    name: "Halopesa",
    shortName: "Halopesa",
    color: "#E31837",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    prefixes: ["62", "63"],
    logo: "💳",
    image: "/images/payment/halopesa.jpg",
  },
  {
    id: "airtel",
    name: "Airtel Money",
    shortName: "Airtel",
    color: "#ED1C24",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    prefixes: ["68", "69"],
    logo: "💸",
    image: "/images/payment/airtel.png",
  },
  {
    id: "mixx",
    name: "Mixx by YAS",
    shortName: "Mixx",
    color: "#FF6B00",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    prefixes: ["67", "71"],
    logo: "🔄",
    image: "/images/payment/yas.png",
  },
]

type MobileMoneyPaymentProps = {
  amount: number
  onPaymentSuccess: (transactionId: string) => void
  onPaymentCancel: () => void
}

type PaymentStep = "select-provider" | "enter-phone" | "confirming" | "waiting" | "success" | "failed"

export default function MobileMoneyPayment({
  amount,
  onPaymentSuccess,
  onPaymentCancel,
}: MobileMoneyPaymentProps) {
  const [step, setStep] = useState<PaymentStep>("select-provider")
  const [selectedProvider, setSelectedProvider] = useState<MobileMoneyProvider | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [countdown, setCountdown] = useState(120)
  const [isProcessing, setIsProcessing] = useState(false)

  // Detect provider from phone number
  const detectProvider = useCallback((number: string) => {
    const clean = number.replace(/\D/g, "")
    const localNumber = clean.startsWith("255") ? clean.substring(3) : clean.startsWith("0") ? clean.substring(1) : clean

    if (localNumber.length >= 2) {
      const prefix = localNumber.substring(0, 2)
      const detected = mobileMoneyProviders.find((p) => p.prefixes.includes(prefix))
      if (detected) {
        setSelectedProvider(detected)
      }
    }
  }, [])

  // Handle phone input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, "")
    if (input.length <= 12) {
      let formatted = input
      if (input.length > 3) {
        formatted = `${input.slice(0, 3)} ${input.slice(3)}`
      }
      if (input.length > 6) {
        formatted = `${formatted.slice(0, 7)} ${formatted.slice(7)}`
      }
      setPhoneNumber(formatted)
      detectProvider(input)
    }
  }

  // Countdown timer
  useEffect(() => {
    if (step === "waiting" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
    if (countdown === 0 && step === "waiting") {
      setStep("failed")
      setErrorMessage("Payment timed out. Please try again.")
    }
  }, [countdown, step])

  // Poll for payment status
  useEffect(() => {
    if (step !== "waiting" || !transactionId) return

    const interval = setInterval(async () => {
      try {
        const result = await getPaymentStatus(transactionId)
        if (result.status === "completed") {
          clearInterval(interval)
          setStep("success")
          setTimeout(() => onPaymentSuccess(transactionId), 2000)
        } else if (result.status === "failed") {
          clearInterval(interval)
          setStep("failed")
          setErrorMessage(result.message || "Payment failed. Please try again.")
        }
      } catch {
        // Continue polling
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [step, transactionId, onPaymentSuccess])

  // Initiate payment
  const handleInitiatePayment = async () => {
    if (!selectedProvider) {
      setErrorMessage("Please select a payment provider")
      return
    }

    const cleanPhone = phoneNumber.replace(/\D/g, "")
    const fullPhone = cleanPhone.startsWith("0")
      ? `255${cleanPhone.substring(1)}`
      : cleanPhone.startsWith("255")
        ? cleanPhone
        : `255${cleanPhone}`

    if (fullPhone.length < 12) {
      setErrorMessage("Please enter a valid phone number")
      return
    }

    setIsProcessing(true)
    setErrorMessage("")

    try {
      const result = await initiateMobileMoneyPush({
        amount,
        phoneNumber: fullPhone,
        provider: selectedProvider.id,
        reference: `ORD-${Date.now()}`,
        description: `Payment for QuardCubeLabs order - TZS ${amount.toLocaleString()}`,
      })

      if (result.success && result.transactionId) {
        setTransactionId(result.transactionId)
        setStep("waiting")
        setCountdown(120)
      } else {
        setErrorMessage(result.message)
      }
    } catch {
      setErrorMessage("Failed to initiate payment. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-navy/10">
          {step !== "select-provider" && step !== "success" && step !== "failed" ? (
            <button
              onClick={() => {
                if (step === "enter-phone") setStep("select-provider")
                else if (step === "confirming") setStep("enter-phone")
              }}
              className="text-navy/60 hover:text-navy transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <div />
          )}
          <h2 className="text-lg font-bold text-navy">Mobile Money Payment</h2>
          <button onClick={onPaymentCancel} className="text-navy/40 hover:text-navy transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Select Provider */}
          {step === "select-provider" && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-navy/10 mx-auto flex items-center justify-center mb-4">
                  <Smartphone className="h-8 w-8 text-navy" />
                </div>
                <h3 className="font-bold text-xl text-navy">Choose Payment Method</h3>
                <p className="text-sm text-navy/60 mt-1">Select your mobile money provider</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {mobileMoneyProviders.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => {
                      setSelectedProvider(provider)
                      setStep("enter-phone")
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                      selectedProvider?.id === provider.id
                        ? `${provider.borderColor} ${provider.bgColor}`
                        : "border-navy/10 hover:border-navy/20"
                    }`}
                  >
                    <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <Image
                        src={provider.image}
                        alt={provider.name}
                        width={48}
                        height={48}
                        className="object-contain"
                      />
                    </div>
                    <p className="font-bold text-sm text-navy">{provider.name}</p>
                    <p className="text-xs text-navy/50 mt-0.5">
                      {provider.id === "mpesa" && "Vodacom"}
                      {provider.id === "halopesa" && "Tigo"}
                      {provider.id === "airtel" && "Airtel Tanzania"}
                      {provider.id === "mixx" && "By YAS"}
                    </p>
                  </button>
                ))}
              </div>

              <div className="mt-4 p-3 bg-navy/5 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-navy/60 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-navy/60">
                    Secure payment powered by mobile money. Your PIN is entered on your phone, never shared with us.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Enter Phone Number */}
          {step === "enter-phone" && selectedProvider && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${selectedProvider.color}15` }}
                >
                  <Image
                    src={selectedProvider.image}
                    alt={selectedProvider.name}
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <h3 className="font-bold text-xl text-navy">{selectedProvider.name}</h3>
                <p className="text-sm text-navy/60 mt-1">Enter your mobile money number</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-navy">
                  Phone Number
                </Label>
                <div className="flex">
                  <div className="bg-navy/5 border border-r-0 border-navy/20 rounded-l-xl px-4 flex items-center text-navy font-medium text-sm">
                    +255
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="7XX XXX XXX"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className="rounded-l-none border-navy/20 focus:border-navy text-lg tracking-wider"
                  />
                </div>
                {selectedProvider && (
                  <p className="text-xs text-navy/50">
                    Detected: <span className="font-medium" style={{ color: selectedProvider.color }}>{selectedProvider.name}</span>
                  </p>
                )}
              </div>

              <div className="bg-navy/5 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-navy/60">Amount to Pay</span>
                  <span className="text-xl font-bold text-navy">TZS {amount.toLocaleString()}</span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              )}

              <Button
                onClick={handleInitiatePayment}
                disabled={phoneNumber.replace(/\D/g, "").length < 9 || isProcessing}
                className="w-full py-3 text-white font-semibold rounded-xl"
                style={{ backgroundColor: selectedProvider.color }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Initiating...
                  </>
                ) : (
                  `Pay TZS ${amount.toLocaleString()}`
                )}
              </Button>
            </div>
          )}

          {/* Step 3: Waiting for Confirmation */}
          {step === "waiting" && (
            <div className="space-y-4 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-50 mx-auto flex items-center justify-center mb-4">
                <Clock className="h-10 w-10 text-blue-500 animate-pulse" />
              </div>
              <h3 className="font-bold text-xl text-navy">Check Your Phone</h3>
              <p className="text-navy/60 text-sm">
                A USSD prompt has been sent to <span className="font-semibold">{phoneNumber}</span>.
                Please enter your PIN on your phone to confirm the payment.
              </p>

              <div className="bg-navy/5 rounded-xl p-4">
                <p className="text-sm text-navy/60 mb-1">Time Remaining</p>
                <p className="text-3xl font-bold text-navy">{formatTime(countdown)}</p>
              </div>

              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 text-navy animate-spin" />
              </div>
              <p className="text-xs text-navy/50">Waiting for payment confirmation...</p>
            </div>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <div className="space-y-4 text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-4">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="font-bold text-xl text-navy">Payment Successful!</h3>
              <p className="text-navy/60">
                Your payment of <span className="font-bold">TZS {amount.toLocaleString()}</span> has
                been processed successfully.
              </p>
              <p className="text-sm text-navy/50">Redirecting to order confirmation...</p>
            </div>
          )}

          {/* Step 5: Failed */}
          {step === "failed" && (
            <div className="space-y-4 text-center">
              <div className="w-20 h-20 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-4">
                <X className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="font-bold text-xl text-navy">Payment Failed</h3>
              <p className="text-navy/60">
                {errorMessage || "There was an issue processing your payment. Please try again."}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onPaymentCancel}
                  className="flex-1 border-navy/20 text-navy"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setStep("select-provider")
                    setPhoneNumber("")
                    setSelectedProvider(null)
                    setErrorMessage("")
                    setCountdown(120)
                  }}
                  className="flex-1 bg-navy text-white"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
