"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { FaGoogle, FaFacebook, FaApple } from "react-icons/fa"
import Logo from "@/components/logo"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { signIn, signInWithGoogle, signInWithFacebook, signInWithApple, user } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    emailOrPhone: "",
    password: "",
  })

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/")
    }
  }, [user, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Check if the input is a phone number (starts with +) or email
      const isPhoneNumber = formData.emailOrPhone.startsWith('+')
      
      const { error } = await signIn(formData.emailOrPhone, formData.password)

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } else {
        router.push("/")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during login.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during Google sign in.",
        variant: "destructive",
      })
    }
  }

  const handleFacebookSignIn = async () => {
    try {
      await signInWithFacebook()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during Facebook sign in.",
        variant: "destructive",
      })
    }
  }

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during Apple sign in.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-teal flex flex-col justify-center items-center p-4">
      <div className="pattern-grid fixed inset-0 pointer-events-none z-10"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-navy/10 p-8">
          <div className="flex justify-center mb-6">
            
               <Image 
               src="/turquoise.png"
               alt="QuardCubeLabs Logo"
               width={100}
               height={100}
               />
          </div>

          <h1 className="text-2xl font-bold text-center text-navy mb-6">Welcome Back</h1>

          {/* Social Login Icons */}
          <div className="flex justify-center items-center gap-3 sm:gap-4 mb-6">
            <button
              onClick={handleGoogleSignIn}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-white hover:bg-gray-50 border border-navy/15 flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-sm"
              title="Sign in with Google"
            >
              <FaGoogle className="text-red-500 text-base sm:text-lg" />
            </button>

            <button
              onClick={handleFacebookSignIn}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-white hover:bg-gray-50 border border-navy/15 flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-sm"
              title="Sign in with Facebook"
            >
              <FaFacebook className="text-[#1877F2] text-base sm:text-lg" />
            </button>

            <button
              onClick={handleAppleSignIn}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-white hover:bg-gray-50 border border-navy/15 flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-sm"
              title="Sign in with Apple"
            >
              <FaApple className="text-black text-base sm:text-lg" />
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2  text-gray-500">Or sign in with email/phone</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailOrPhone">Email or Phone Number</Label>
              <Input
                id="emailOrPhone"
                name="emailOrPhone"
                type="text"
                placeholder="name@example.com or +255123456789"
                value={formData.emailOrPhone}
                onChange={handleChange}
                required
                className="bg-white/70"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/forgot-password" className="text-sm text-navy hover:text-brand-red">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className="bg-white/70"
              />
            </div>

            <Button type="submit" className="w-full bg-navy hover:bg-navy/90 text-white" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-navy hover:text-brand-red font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
