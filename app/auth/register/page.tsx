"use client"

import type React from "react"

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
import { countries } from "@/lib/countries"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { signUp, signInWithGoogle, signInWithFacebook, signInWithApple, user } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
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

  const handleCountryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, country: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const { error } = await signUp(formData.email, formData.password, {
        name: formData.name,
        country: formData.country,
      })

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Registration successful. Please check your email to verify your account.",
        })
        router.push("/auth/login")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during registration.",
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

          <h1 className="text-2xl font-bold text-center text-navy mb-6">Create an Account</h1>

          <div className="space-y-4 mb-6">
            <Button
              onClick={handleGoogleSignIn}
              className="w-full bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 flex items-center justify-center gap-2"
            >
              <FaGoogle className="text-red-500" />
              Continue with Google
            </Button>

            <Button
              onClick={handleFacebookSignIn}
              className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white flex items-center justify-center gap-2"
            >
              <FaFacebook />
              Continue with Facebook
            </Button>

            <Button
              onClick={handleAppleSignIn}
              className="w-full bg-black hover:bg-gray-900 text-white flex items-center justify-center gap-2"
            >
              <FaApple />
              Continue with Apple
            </Button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white/80 text-gray-500">Or register with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
                className="bg-white/70"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-white/70"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select value={formData.country} onValueChange={handleCountryChange} required>
                <SelectTrigger className="bg-white/70">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="bg-white/70"
              />
            </div>

            <Button type="submit" className="w-full bg-navy hover:bg-navy/90 text-white" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-navy hover:text-brand-red font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
