"use client"

import type React from "react"

import { useState } from "react"
import { Loader2, CreditCard, Calendar, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { processCardPayment } from "@/lib/payment-actions"
import Image from "next/image"

type CardPaymentFormProps = {
  amount: number
  onComplete: (transactionId: string) => void
  onError: (message: string) => void
}

export default function CardPaymentForm({ amount, onComplete, onError }: CardPaymentFormProps) {
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardholderName: "",
    expiryDate: "",
    cvv: "",
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [cardType, setCardType] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Format card number with spaces
    if (name === "cardNumber") {
      const formatted = value
        .replace(/\D/g, "")
        .slice(0, 16)
        .replace(/(\d{4})(?=\d)/g, "$1 ")

      setCardDetails((prev) => ({ ...prev, [name]: formatted }))

      // Detect card type
      detectCardType(formatted.replace(/\s/g, ""))
      return
    }

    // Format expiry date
    if (name === "expiryDate") {
      const formatted = value
        .replace(/\D/g, "")
        .slice(0, 4)
        .replace(/(\d{2})(?=\d)/, "$1/")

      setCardDetails((prev) => ({ ...prev, [name]: formatted }))
      return
    }

    // Format CVV (numbers only, max 4 digits)
    if (name === "cvv") {
      const formatted = value.replace(/\D/g, "").slice(0, 4)
      setCardDetails((prev) => ({ ...prev, [name]: formatted }))
      return
    }

    setCardDetails((prev) => ({ ...prev, [name]: value }))
  }

  // Detect card type based on card number
  const detectCardType = (cardNumber: string) => {
    // Visa
    if (/^4/.test(cardNumber)) {
      setCardType("visa")
    }
    // Mastercard
    else if (/^5[1-5]/.test(cardNumber)) {
      setCardType("mastercard")
    }
    // American Express
    else if (/^3[47]/.test(cardNumber)) {
      setCardType("amex")
    }
    // Discover
    else if (/^6(?:011|5)/.test(cardNumber)) {
      setCardType("discover")
    }
    // JCB
    else if (/^(?:2131|1800|35\d{3})/.test(cardNumber)) {
      setCardType("jcb")
    }
    // Diners Club
    else if (/^3(?:0[0-5]|[68])/.test(cardNumber)) {
      setCardType("diners")
    }
    // Unknown
    else {
      setCardType(null)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!cardDetails.cardNumber.replace(/\s/g, "").match(/^\d{16}$/)) {
      newErrors.cardNumber = "Please enter a valid 16-digit card number"
    }

    if (!cardDetails.cardholderName.trim()) {
      newErrors.cardholderName = "Cardholder name is required"
    }

    if (!cardDetails.expiryDate.match(/^\d{2}\/\d{2}$/)) {
      newErrors.expiryDate = "Please enter a valid expiry date (MM/YY)"
    } else {
      // Check if card is expired
      const [month, year] = cardDetails.expiryDate.split("/")
      const expiryDate = new Date(2000 + Number.parseInt(year), Number.parseInt(month) - 1)
      const currentDate = new Date()

      if (expiryDate < currentDate) {
        newErrors.expiryDate = "Card has expired"
      }
    }

    if (!cardDetails.cvv.match(/^\d{3,4}$/)) {
      newErrors.cvv = "Please enter a valid CVV (3-4 digits)"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsProcessing(true)

    try {
      const result = await processCardPayment({
        amount,
        cardDetails: {
          cardNumber: cardDetails.cardNumber.replace(/\s/g, ""),
          cardholderName: cardDetails.cardholderName,
          expiryDate: cardDetails.expiryDate,
          cvv: cardDetails.cvv,
        },
      })

      if (result.success) {
        onComplete(result.transactionId || "")
      } else {
        onError(result.message)
      }
    } catch (error) {
      console.error("Error processing card payment:", error)
      onError("An unexpected error occurred. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Card Payment</h3>
        <div className="flex gap-2">
          <Image src="/cards/visa.svg" alt="Visa" width={32} height={20} className="h-5 w-auto opacity-50" />
          <Image
            src="/cards/mastercard.svg"
            alt="Mastercard"
            width={32}
            height={20}
            className="h-5 w-auto opacity-50"
          />
          <Image
            src="/cards/amex.svg"
            alt="American Express"
            width={32}
            height={20}
            className="h-5 w-auto opacity-50"
          />
        </div>
      </div>

      <div>
        <label htmlFor="cardNumber" className="block text-sm font-medium mb-1">
          Card Number
        </label>
        <div className="relative">
          <input
            type="text"
            id="cardNumber"
            name="cardNumber"
            placeholder="1234 5678 9012 3456"
            value={cardDetails.cardNumber}
            onChange={handleInputChange}
            className={`w-full p-3 pl-10 rounded-md border ${
              errors.cardNumber ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent`}
          />
          {cardType ? (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Image src={`/cards/${cardType}.svg`} alt={cardType} width={32} height={20} className="h-5 w-auto" />
            </div>
          ) : (
            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          )}
        </div>
        {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
      </div>

      <div>
        <label htmlFor="cardholderName" className="block text-sm font-medium mb-1">
          Cardholder Name
        </label>
        <input
          type="text"
          id="cardholderName"
          name="cardholderName"
          placeholder="John Doe"
          value={cardDetails.cardholderName}
          onChange={handleInputChange}
          className={`w-full p-3 rounded-md border ${
            errors.cardholderName ? "border-red-500" : "border-gray-300"
          } focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent`}
        />
        {errors.cardholderName && <p className="text-red-500 text-xs mt-1">{errors.cardholderName}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="expiryDate" className="block text-sm font-medium mb-1">
            Expiry Date
          </label>
          <div className="relative">
            <input
              type="text"
              id="expiryDate"
              name="expiryDate"
              placeholder="MM/YY"
              value={cardDetails.expiryDate}
              onChange={handleInputChange}
              className={`w-full p-3 pl-10 rounded-md border ${
                errors.expiryDate ? "border-red-500" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent`}
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>}
        </div>

        <div>
          <label htmlFor="cvv" className="block text-sm font-medium mb-1">
            CVV
          </label>
          <div className="relative">
            <input
              type="text"
              id="cvv"
              name="cvv"
              placeholder="123"
              value={cardDetails.cvv}
              onChange={handleInputChange}
              className={`w-full p-3 pl-10 rounded-md border ${
                errors.cvv ? "border-red-500" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent`}
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
        </div>
      </div>

      <div className="text-sm text-gray-600">
        <p>
          Amount to be charged: <span className="font-bold">${amount.toFixed(2)}</span>
        </p>
      </div>

      <Button type="submit" disabled={isProcessing} className="w-full bg-navy hover:bg-navy/90 text-white py-3">
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          "Pay Now"
        )}
      </Button>
    </form>
  )
}
