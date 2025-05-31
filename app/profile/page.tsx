"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { countries } from "@/lib/countries"

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, updateProfile, isLoading } = useAuth()

  const [isSaving, setIsSaving] = useState(false)
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    country: "",
    phone: "",
  })

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login")
    }

    if (user) {
      setProfileData({
        name: user.user_metadata?.name || "",
        email: user.email || "",
        country: user.user_metadata?.country || "",
        phone: user.user_metadata?.phone || "",
      })
    }
  }, [user, isLoading, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCountryChange = (value: string) => {
    setProfileData((prev) => ({ ...prev, country: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const { error } = await updateProfile({
        name: profileData.name,
        country: profileData.country,
        phone: profileData.phone,
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
          description: "Your profile has been updated successfully.",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while updating your profile.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (profileData.name) {
      return profileData.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    }
    return profileData.email?.substring(0, 2).toUpperCase() || "U"
  }

  // Get user avatar URL
  const getAvatarUrl = () => {
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url
    }
    return null
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
      <Navbar />

      <section className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-navy/20 p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 border-2 border-navy/20">
                    <AvatarImage src={getAvatarUrl() || ""} alt={profileData.name || profileData.email || "User"} />
                    <AvatarFallback className="bg-navy text-white text-2xl">{getInitials()}</AvatarFallback>
                  </Avatar>

                  {user?.app_metadata?.provider && (
                    <p className="mt-2 text-sm text-gray-500">Signed in with {user.app_metadata.provider}</p>
                  )}
                </div>

                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2 text-center sm:text-left">{profileData.name || "User"}</h1>
                  <p className="text-gray-600 text-center sm:text-left">{profileData.email}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={profileData.name}
                    onChange={handleChange}
                    className="bg-white/70"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-white/70 opacity-70"
                  />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select value={profileData.country} onValueChange={handleCountryChange}>
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
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+1 (555) 123-4567"
                    value={profileData.phone}
                    onChange={handleChange}
                    className="bg-white/70"
                  />
                </div>

                <div className="pt-4">
                  <Button type="submit" className="bg-navy hover:bg-navy/90 text-white" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
