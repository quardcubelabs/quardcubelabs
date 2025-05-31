"use client"

import { CreditCard, Smartphone } from "lucide-react"

type PaymentMethodSelectorProps = {
  selectedMethod: string | null
  onSelectMethod: (method: string) => void
}

export default function PaymentMethodSelector({ selectedMethod, onSelectMethod }: PaymentMethodSelectorProps) {
  const paymentMethods = [
    {
      id: "card",
      name: "Credit/Debit Card",
      icon: <CreditCard className="h-5 w-5" />,
      description: "Pay securely with your credit or debit card",
    },
    {
      id: "paypal",
      name: "PayPal",
      icon: (
        <div className="relative w-5 h-5">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082h-2.19c-1.717 0-3.146 1.27-3.403 2.981l-1.12 7.106c-.083.519.275.981.798.981h4.606c.524 0 .968-.382 1.05-.9l.878-5.562c.083-.518.527-.9 1.05-.9h1.313c4.485 0 7.957-1.821 8.982-7.106.542-2.829.117-4.76-1.208-5.929-.328-.287-.731-.54-1.208-.76.328.541.55 1.185.658 1.934v.36z" />
          </svg>
        </div>
      ),
      description: "Pay with your PayPal account",
    },
    {
      id: "mobile",
      name: "Mobile Payment",
      icon: <Smartphone className="h-5 w-5" />,
      description: "Pay using your mobile device with push notifications",
    },
  ]

  return (
    <div className="space-y-3">
      {paymentMethods.map((method) => (
        <div
          key={method.id}
          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
            selectedMethod === method.id ? "border-navy bg-navy/5" : "border-navy/20 hover:border-navy/40"
          }`}
          onClick={() => onSelectMethod(method.id)}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === method.id ? "border-navy" : "border-navy/30"
              }`}
            >
              {selectedMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-navy"></div>}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-navy">{method.icon}</div>
              <span className="font-medium">{method.name}</span>
            </div>
          </div>
          <p className="text-sm text-navy/70 mt-2 ml-8">{method.description}</p>
        </div>
      ))}
    </div>
  )
}
