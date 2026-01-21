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
import { Minus, Plus, Trash2, ShoppingBag, CreditCard } from "lucide-react"
import Image from "next/image"

export default function CheckoutContent() {
  const { state, updateQuantity, removeFromCart, clearCart, getCartTotal } = useCart()
  const { user, isLoading: authLoading } = useAuth()
  const { addOrder } = useOrders()
  const router = useRouter()
  const { toast } = useToast()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.user_metadata?.name || user?.email?.split('@')[0] || '',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || '',
    address: user?.user_metadata?.address || '',
    city: '',
    postalCode: '',
    notes: ''
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
        <Button 
          onClick={() => router.push("/shop")}
          className="bg-navy hover:bg-navy/90 text-white"
        >
          Continue Shopping
        </Button>
      </div>
    )
  }

  const handleInputChange = (field: string, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmitOrder = async () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    try {
      const orderItems = state.items.map(item => ({
        id: String(item.product.id),
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        image: item.product.image
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
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Summary */}
        <Card className="border-navy/20">
          <CardHeader>
            <CardTitle className="text-navy flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {state.items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <Image
                    src={item.product.image || "/placeholder.svg"}
                    alt={item.product.name}
                    width={60}
                    height={60}
                    className="rounded-md object-cover"
                  />
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-navy">{item.product.name}</h4>
                    <p className="text-sm text-gray-600">
                      TZS {item.product.price.toLocaleString()} each
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-navy">
                      TZS {(item.product.price * item.quantity).toLocaleString()}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 mt-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            <div className="space-y-2">
              <div className="flex justify-between text-lg font-bold text-navy">
                <span>Total:</span>
                <span>TZS {getCartTotal().toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checkout Form */}
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
                    onChange={(e) => handleInputChange('name', e.target.value)}
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
                    onChange={(e) => handleInputChange('email', e.target.value)}
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
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="border-navy/20 focus:border-navy"
                />
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={customerInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
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
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="border-navy/20 focus:border-navy"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={customerInfo.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    className="border-navy/20 focus:border-navy"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Order Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={customerInfo.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="border-navy/20 focus:border-navy"
                  rows={3}
                  placeholder="Any special instructions or comments..."
                />
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleSubmitOrder}
                  disabled={isProcessing || authLoading}
                  className="w-full bg-navy hover:bg-brand-red text-white py-3"
                  size="lg"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  {isProcessing ? "Processing Order..." : `Place Order - TZS ${getCartTotal().toLocaleString()}`}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => router.push("/shop")}
                  className="w-full border-navy/20 text-navy hover:bg-navy hover:text-white"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}