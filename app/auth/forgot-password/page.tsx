"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import Logo from "@/components/logo"
import { useAuth } from "@/contexts/auth-context"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { resetPassword } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await resetPassword(email)

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setIsSubmitted(true)
        toast({
          title: "Success",
          description: "Password reset instructions have been sent to your email.",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-teal flex flex-col justify-center items-center p-4">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-navy/20 p-8">
          <div className="flex justify-center mb-6">
            <Logo size="md" />
          </div>

          <h1 className="text-2xl font-bold text-center text-navy mb-2">Reset Password</h1>
          <p className="text-center text-gray-600 mb-6">
            Enter your email address and we'll send you instructions to reset your password.
          </p>

          {isSubmitted ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 text-green-800 p-4 rounded-lg">
                <p>Password reset instructions have been sent to your email.</p>
                <p className="text-sm mt-2">Please check your inbox and follow the instructions.</p>
              </div>

              <Button onClick={() => router.push("/auth/login")} className="mt-4 bg-navy hover:bg-navy/90 text-white">
                Return to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/70"
                />
              </div>

              <Button type="submit" className="w-full bg-navy hover:bg-navy/90 text-white" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Instructions"}
              </Button>

              <div className="text-center mt-4">
                <Link href="/auth/login" className="text-navy hover:text-brand-red text-sm">
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
