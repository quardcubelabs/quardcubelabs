"use client"

import React, { createContext, useContext, useReducer, useEffect } from "react"
import { Product } from "@/types/database"

export interface CartItem {
  product: Product
  quantity: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
}

type CartAction =
  | { type: "ADD_TO_CART"; product: Product }
  | { type: "REMOVE_FROM_CART"; productId: number }
  | { type: "UPDATE_QUANTITY"; productId: number; quantity: number }
  | { type: "CLEAR_CART" }
  | { type: "TOGGLE_CART" }
  | { type: "OPEN_CART" }
  | { type: "CLOSE_CART" }
  | { type: "LOAD_CART"; items: CartItem[] }

const CartContext = createContext<{
  state: CartState
  dispatch: React.Dispatch<CartAction>
  addToCart: (product: Product) => void
  removeFromCart: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  getCartTotal: () => number
  getCartItemsCount: () => number
  getItemQuantity: (productId: number) => number
} | null>(null)

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_TO_CART": {
      const existingItem = state.items.find(item => item.product.id === action.product.id)
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.product.id === action.product.id
              ? { ...item, quantity: Math.min(item.quantity + 1, action.product.stock) }
              : item
          )
        }
      } else {
        return {
          ...state,
          items: [...state.items, { product: action.product, quantity: 1 }]
        }
      }
    }
    
    case "REMOVE_FROM_CART":
      return {
        ...state,
        items: state.items.filter(item => item.product.id !== action.productId)
      }
    
    case "UPDATE_QUANTITY": {
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.product.id !== action.productId)
        }
      }
      
      return {
        ...state,
        items: state.items.map(item =>
          item.product.id === action.productId
            ? { ...item, quantity: Math.min(action.quantity, item.product.stock) }
            : item
        )
      }
    }
    
    case "CLEAR_CART":
      return {
        ...state,
        items: []
      }
    
    case "TOGGLE_CART":
      return {
        ...state,
        isOpen: !state.isOpen
      }
    
    case "OPEN_CART":
      return {
        ...state,
        isOpen: true
      }
    
    case "CLOSE_CART":
      return {
        ...state,
        isOpen: false
      }
    
    case "LOAD_CART":
      return {
        ...state,
        items: action.items
      }
    
    default:
      return state
  }
}

const initialState: CartState = {
  items: [],
  isOpen: false
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("quardcube-cart")
    if (savedCart && typeof savedCart === "string" && savedCart.startsWith("[")) {
      try {
        const parsedCart = JSON.parse(savedCart)
        if (Array.isArray(parsedCart)) {
          dispatch({ type: "LOAD_CART", items: parsedCart })
        }
      } catch {
        localStorage.removeItem("quardcube-cart")
      }
    }
  }, [])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem("quardcube-cart", JSON.stringify(state.items))
  }, [state.items])

  const addToCart = (product: Product) => {
    dispatch({ type: "ADD_TO_CART", product })
  }

  const removeFromCart = (productId: number) => {
    dispatch({ type: "REMOVE_FROM_CART", productId })
  }

  const updateQuantity = (productId: number, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", productId, quantity })
  }

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" })
  }

  const toggleCart = () => {
    dispatch({ type: "TOGGLE_CART" })
  }

  const openCart = () => {
    dispatch({ type: "OPEN_CART" })
  }

  const closeCart = () => {
    dispatch({ type: "CLOSE_CART" })
  }

  const getCartTotal = () => {
    return state.items.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  }

  const getCartItemsCount = () => {
    return state.items.reduce((count, item) => count + item.quantity, 0)
  }

  const getItemQuantity = (productId: number) => {
    const item = state.items.find(item => item.product.id === productId)
    return item ? item.quantity : 0
  }

  const value = {
    state,
    dispatch,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleCart,
    openCart,
    closeCart,
    getCartTotal,
    getCartItemsCount,
    getItemQuantity
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}