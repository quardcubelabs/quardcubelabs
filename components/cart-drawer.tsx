"use client"

import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/contexts/cart-context"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function CartDrawer() {
  const { 
    state, 
    closeCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    getCartTotal,
    getCartItemsCount 
  } = useCart()
  const router = useRouter()

  const handleCheckout = () => {
    closeCart()
    router.push("/checkout")
  }

  const handleContinueShopping = () => {
    closeCart()
    router.push("/shop")
  }

  if (!state.isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[60]" 
        onClick={closeCart}
      />
      
      {/* Cart Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Shopping Cart
            </h2>
            <div className="flex items-center gap-3">
              {state.items.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Clear</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={closeCart}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Cart Items */}
          {state.items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">Your cart is empty</h3>
              <p className="text-gray-400 mb-4">Add some products to get started</p>
              <Button 
                onClick={handleContinueShopping}
                className="bg-navy hover:bg-navy/90 text-white"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {state.items.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <Image
                          src={item.product.image || "/placeholder.svg"}
                          alt={item.product.name}
                          width={60}
                          height={60}
                          className="rounded-md object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-navy text-sm truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          TZS {item.product.price.toLocaleString()}
                        </p>
                        
                        {/* Quantity Controls */}
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
                        <p className="font-bold text-sm text-navy">
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
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-navy">Total:</span>
                  <span className="text-lg font-bold text-navy">
                    TZS {getCartTotal().toLocaleString()}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={handleCheckout}
                    className="w-full bg-navy hover:bg-brand-red text-white"
                  >
                    Proceed to Checkout ({getCartItemsCount()} items)
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleContinueShopping}
                    className="w-full border-navy/20 text-navy hover:bg-navy hover:text-white"
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}