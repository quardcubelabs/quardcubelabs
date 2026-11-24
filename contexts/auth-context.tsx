"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createBrowserClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import type { User, Session, AuthError } from "@supabase/supabase-js"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: AuthError | { message: string } | null }>
  signIn: (emailOrPhone: string, password: string) => Promise<{ error: AuthError | { message: string } | null }>
  signInWithGoogle: () => Promise<void>
  signInWithFacebook: () => Promise<void>
  signInWithApple: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updateProfile: (data: any) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Strip privileged role/permission attributes from client-submitted user metadata
 * to prevent client-side mass-assignment privilege escalation attempts.
 */
function sanitizeUserMetadata(raw: Record<string, any> | undefined): Record<string, any> {
  if (!raw || typeof raw !== "object") return {}
  const { role: _r, staff_role: _sr, isAdmin: _ia, isSuperAdmin: _isa, permissions: _p, ...safe } = raw
  return safe
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [supabase] = useState(() => createBrowserClient())

  useEffect(() => {
    const setData = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        if (error) throw error
        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error("Error getting session:", error)
      } finally {
        setIsLoading(false)
      }
    }

    setData()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const safeMeta = sanitizeUserMetadata(metadata)
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            ...safeMeta,
            phone: safeMeta?.phone,
          },
        },
      })

      if (error) {
        // Generic message prevents revealing whether email is already registered
        return { error: { message: "Unable to complete registration. Please check your details or sign in if you already have an account." } }
      }

      try {
        await fetch("/api/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "signup",
            data: {
              name: safeMeta?.name || email.split("@")[0],
              email: email.trim().toLowerCase(),
            },
          }),
        })
      } catch {
        // Non-blocking notification
      }

      toast({
        title: "Check Your Email",
        description: "If this email is eligible, verification instructions have been sent.",
        variant: "default",
      })

      return { error: null }
    } catch {
      return { error: { message: "Registration request could not be processed." } }
    }
  }

  const signIn = async (emailOrPhone: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone: emailOrPhone.trim(), password }),
      })

      const payload = await res.json().catch(() => ({ success: false, error: "Invalid email or password." }))

      if (!res.ok || !payload.success || !payload.session) {
        return { error: { message: payload.error || "Invalid email or password." } }
      }

      const { error: sessionErr } = await supabase.auth.setSession({
        access_token: payload.session.access_token,
        refresh_token: payload.session.refresh_token,
      })

      if (sessionErr) {
        return { error: { message: "Invalid email or password." } }
      }

      const userName =
        payload.user?.user_metadata?.name ||
        payload.user?.user_metadata?.full_name ||
        (emailOrPhone.includes("@") ? emailOrPhone.split("@")[0] : emailOrPhone)

      toast({
        title: userName ? `Welcome back, ${userName}!` : "Welcome Back!",
        description: "You have successfully signed in.",
        variant: "default",
      })

      return { error: null }
    } catch {
      return { error: { message: "Invalid email or password." } }
    }
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const signInWithFacebook = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const signInWithApple = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      // Always return null error to prevent user enumeration on password reset
      return { error: null }
    } catch {
      return { error: null }
    }
  }

  const updateProfile = async (data: any) => {
    try {
      const safeData = sanitizeUserMetadata(data)
      const { error } = await supabase.auth.updateUser({
        data: safeData,
      })
      return { error }
    } catch (error: any) {
      console.error("Error in updateProfile:", error)
      return { error }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signUp,
        signIn,
        signInWithGoogle,
        signInWithFacebook,
        signInWithApple,
        signOut,
        resetPassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
