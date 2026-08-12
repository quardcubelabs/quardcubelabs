"use client"

import { useState } from "react"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { useOrders } from "@/contexts/order-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Minus, Plus, Trash2, ShoppingBag, CreditCard, ArrowRight, Check, Loader2, Smartphone } from "lucide-react"
import Image from "next/image"
import MobileMoneyPayment from "./mobile-money-payment"

type CheckoutStep = "billing" | "payment" | "processing"
type PaymentMethod = "selcom" | "mobile-money" | null

export default function CheckoutContent() {
  const { state, updateQuantity, removeFromCart, clearCart, getCartTotal } = useCart()
  const { user, isLoading: authLoading } = useAuth()
  const { addOrder } = useOrders()
  const router = useRouter()
  const { toast } = useToast()

  const [isProcessing, setIsProcessing] = useState(false)
  const [isSelcomRedirecting, setIsSelcomRedirecting] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("billing")
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(null)
  const [showMobileMoneyPayment, setShowMobileMoneyPayment] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.user_metadata?.name || user?.email?.split("@")[0] || "",
    email: user?.email || "",
    phone: user?.user_metadata?.phone || "",
    address: user?.user_metadata?.address || "",
    city: "",
    postalCode: "",
    notes: "",
  })

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    router.push("/auth/login")
    return null
  }

  // Redirect to shop if cart is empty
  if (state.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-navy mb-4">Your cart is empty</h2>
        <p className="text-gray-600 mb-6">Add some products to proceed with checkout</p>
        <Button onClick={() => router.push("/shop")} className="bg-navy hover:bg-navy/90 text-white">
          Continue Shopping
        </Button>
      </div>
    )
  }

  const handleInputChange = (field: string, value: string) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }))
  }

  const handleContinueToPayment = () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }
    setCheckoutStep("payment")
  }

  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method)
  }

  const handleMobileMoneySuccess = async (transactionId: string) => {
    setShowMobileMoneyPayment(false)
    setCheckoutStep("processing")
    setIsProcessing(true)
    try {
      const orderItems = state.items.map((item) => ({
        id: String(item.product.id),
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        image: item.product.image,
      }))

      const total = getCartTotal()

      await addOrder(orderItems, total, customerInfo)

      toast({
        title: "Order placed successfully!",
        description: "Thank you for your order. You will receive an email confirmation shortly.",
        duration: 5000,
      })

      clearCart()
      router.push("/orders")
    } catch (error) {
      console.error("Error placing order:", error)
      toast({
        title: "Error placing order",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive",
      })
      setCheckoutStep("payment")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMobileMoneyCancel = () => {
    setShowMobileMoneyPayment(false)
  }

  const handlePlaceOrder = async () => {
    setCheckoutStep("processing")
    setIsProcessing(true)
    try {
      const orderItems = state.items.map((item) => ({
        id: String(item.product.id),
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        image: item.product.image,
      }))

      const total = getCartTotal()

      await addOrder(orderItems, total, customerInfo)

      toast({
        title: "Order placed successfully!",
        description: "Thank you for your order. You will receive an email confirmation shortly.",
        duration: 5000,
      })

      clearCart()
      router.push("/orders")
    } catch (error) {
      console.error("Error placing order:", error)
      toast({
        title: "Error placing order",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive",
      })
      setCheckoutStep("payment")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSelcomPayment = async () => {
    setIsSelcomRedirecting(true)
    setCheckoutStep("processing")
    try {
      const res = await fetch("/api/selcom/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: state.items.map((item) => ({
            id: String(item.product.id),
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
          })),
          customerInfo,
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        let errorMsg = "Failed to initialize payment."
        try {
          const errorData = JSON.parse(errorText)
          errorMsg = errorData.error || errorMsg
        } catch {
          errorMsg = errorText || errorMsg
        }
        toast({
          title: "Payment failed",
          description: errorMsg,
          variant: "destructive",
        })
        setCheckoutStep("payment")
        setIsSelcomRedirecting(false)
        return
      }

      const data = await res.json()

      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        toast({
          title: "Payment failed",
          description: data.error || "Failed to initialize payment. Please try again.",
          variant: "destructive",
        })
        setCheckoutStep("payment")
        setIsSelcomRedirecting(false)
      }
    } catch (error) {
      console.error("Selcom checkout error:", error)
      toast({
        title: "Payment error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
      setCheckoutStep("payment")
      setIsSelcomRedirecting(false)
    }
  }

  const total = getCartTotal()

  return (
    <div className="max-w-6xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                checkoutStep === "billing" || checkoutStep === "payment" || checkoutStep === "processing"
                  ? "bg-navy text-white"
                  : "bg-navy/10 text-navy/50"
              }`}
            >
              {checkoutStep === "billing" ? "1" : <Check className="h-4 w-4" />}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${checkoutStep === "billing" ? "text-navy" : "text-navy/50"}`}>
              Billing
            </span>
          </div>
          <div className={`h-0.5 w-12 sm:w-20 ${checkoutStep === "billing" ? "bg-navy/10" : "bg-navy"}`} />
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                checkoutStep === "payment" || checkoutStep === "processing" ? "bg-navy text-white" : "bg-navy/10 text-navy/50"
              }`}
            >
              {checkoutStep === "processing" ? <Check className="h-4 w-4" /> : "2"}
            </div>
            <span
              className={`text-sm font-medium hidden sm:block ${checkoutStep === "payment" || checkoutStep === "processing" ? "text-navy" : "text-navy/50"}`}
            >
              Payment
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Step 1: Billing Information */}
          {checkoutStep === "billing" && (
            <Card className="border-navy/20">
              <CardHeader>
                <CardTitle className="text-navy flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={customerInfo.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="border-navy/20 focus:border-navy"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="border-navy/20 focus:border-navy"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="border-navy/20 focus:border-navy"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      value={customerInfo.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      className="border-navy/20 focus:border-navy"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={customerInfo.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        className="border-navy/20 focus:border-navy"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={customerInfo.postalCode}
                        onChange={(e) => handleInputChange("postalCode", e.target.value)}
                        className="border-navy/20 focus:border-navy"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Order Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={customerInfo.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      className="border-navy/20 focus:border-navy"
                      rows={3}
                      placeholder="Any special instructions or comments..."
                    />
                  </div>

                  <Button
                    onClick={handleContinueToPayment}
                    className="w-full bg-navy hover:bg-navy/90 text-white py-3"
                    size="lg"
                  >
                    Continue to Payment
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Payment */}
          {checkoutStep === "payment" && !showMobileMoneyPayment && (
            <Card className="border-navy/20">
              <CardHeader>
                <CardTitle className="text-navy flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Choose Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <p className="text-sm text-navy/60">
                    Select your preferred payment method to complete the purchase.
                  </p>

                  {/* Payment Method Options */}
                  <div className="space-y-3">
                    {/* Selcom Option */}
                    <div
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedPaymentMethod === "selcom"
                          ? "border-navy bg-navy/5"
                          : "border-navy/10 hover:border-navy/30"
                      }`}
                      onClick={() => handleSelectPaymentMethod("selcom")}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            selectedPaymentMethod === "selcom" ? "border-navy" : "border-navy/30"
                          }`}
                        >
                          {selectedPaymentMethod === "selcom" && (
                            <div className="w-2.5 h-2.5 rounded-full bg-navy"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-navy" />
                            <span className="font-semibold text-navy">Pay via Selcom</span>
                          </div>
                          <p className="text-sm text-navy/60 mt-1">
                            Credit/Debit Card (Visa, Mastercard, Amex) or Mobile Money via Selcom gateway
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Image src="/images/payment/selcom.png" alt="Selcom" width={40} height={24} className="object-contain" />
                            <Image src="/images/payment/mpesa.png" alt="M-Pesa" width={24} height={24} className="object-contain" />
                            <Image src="/images/payment/airtel.png" alt="Airtel" width={24} height={24} className="object-contain" />
                            <Image src="/images/payment/halopesa.jpg" alt="Halopesa" width={24} height={24} className="object-contain" />
                            <Image src="/images/payment/yas.png" alt="YAS" width={24} height={24} className="object-contain" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Money Direct Option */}
                    <div
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedPaymentMethod === "mobile-money"
                          ? "border-navy bg-navy/5"
                          : "border-navy/10 hover:border-navy/30"
                      }`}
                      onClick={() => handleSelectPaymentMethod("mobile-money")}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            selectedPaymentMethod === "mobile-money" ? "border-navy" : "border-navy/30"
                          }`}
                        >
                          {selectedPaymentMethod === "mobile-money" && (
                            <div className="w-2.5 h-2.5 rounded-full bg-navy"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-navy" />
                            <span className="font-semibold text-navy">Mobile Money Direct</span>
                          </div>
                          <p className="text-sm text-navy/60 mt-1">
                            Pay directly with M-Pesa, Halopesa, Airtel Money, or Mixx by YAS
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Image src="/images/payment/mpesa.png" alt="M-Pesa" width={24} height={24} className="object-contain" />
                            <Image src="/images/payment/halopesa.jpg" alt="Halopesa" width={24} height={24} className="object-contain" />
                            <Image src="/images/payment/airtel.png" alt="Airtel" width={24} height={24} className="object-contain" />
                            <Image src="/images/payment/yas.png" alt="YAS" width={24} height={24} className="object-contain" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setCheckoutStep("billing")}
                      className="flex-1 border-navy/20 text-navy"
                    >
                      Back
                    </Button>
                    {selectedPaymentMethod === "selcom" && (
                      <Button
                        onClick={handleSelcomPayment}
                        disabled={isSelcomRedirecting}
                        className="flex-1 bg-navy hover:bg-navy/90 text-white py-3"
                        size="lg"
                      >
                        {isSelcomRedirecting ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Redirecting...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-5 w-5 mr-2" />
                            Pay TZS {total.toLocaleString()}
                          </>
                        )}
                      </Button>
                    )}
                    {selectedPaymentMethod === "mobile-money" && (
                      <Button
                        onClick={() => setShowMobileMoneyPayment(true)}
                        className="flex-1 bg-navy hover:bg-navy/90 text-white py-3"
                        size="lg"
                      >
                        <Smartphone className="h-5 w-5 mr-2" />
                        Pay TZS {total.toLocaleString()}
                      </Button>
                    )}
                    {!selectedPaymentMethod && (
                      <Button
                        disabled
                        className="flex-1 bg-navy/30 text-white py-3 cursor-not-allowed"
                        size="lg"
                      >
                        Select a Payment Method
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mobile Money Payment Modal */}
          {showMobileMoneyPayment && (
            <MobileMoneyPayment
              amount={total}
              onPaymentSuccess={handleMobileMoneySuccess}
              onPaymentCancel={handleMobileMoneyCancel}
            />
          )}

          {/* Step 3: Processing */}
          {checkoutStep === "processing" && (
            <Card className="border-navy/20">
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-navy/10 mx-auto flex items-center justify-center mb-4">
                    <div className="w-8 h-8 border-4 border-navy/30 border-t-navy rounded-full animate-spin" />
                  </div>
                  <h3 className="text-xl font-bold text-navy mb-2">Processing Your Order</h3>
                  <p className="text-navy/60">Please wait while we confirm your order...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="border-navy/20 sticky top-32">
            <CardHeader>
              <CardTitle className="text-navy flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {state.items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3 p-3 bg-navy/5 rounded-lg">
                    <Image
                      src={item.product.image || "/placeholder.svg"}
                      alt={item.product.name}
                      width={48}
                      height={48}
                      className="rounded-md object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-navy text-sm truncate">{item.product.name}</h4>
                      <p className="text-xs text-navy/60">
                        Qty: {item.quantity} × TZS {item.product.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-navy text-sm">
                        TZS {(item.product.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-navy/60">
                  <span>Subtotal</span>
                  <span>TZS {total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-navy/60">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold text-navy">
                  <span>Total</span>
                  <span>TZS {total.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  )
}
