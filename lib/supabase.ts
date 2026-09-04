import { createClient } from "@supabase/supabase-js"

// Create a single supabase client for the browser
export const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://knwhislemfzeatkujwcz.supabase.co"
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtud2hpc2xlbWZ6ZWF0a3Vqd2N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTQ5NzgsImV4cCI6MjA2MDIzMDk3OH0.E_x5fqi74z9pUw5_GcQU5gOBuetrwxROVIoKFbb2xrs"

  return createClient(supabaseUrl, supabaseAnonKey)
}

// Create a single supabase client for server components
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://knwhislemfzeatkujwcz.supabase.co"
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtud2hpc2xlbWZ6ZWF0a3Vqd2N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTQ5NzgsImV4cCI6MjA2MDIzMDk3OH0.E_x5fqi74z9pUw5_GcQU5gOBuetrwxROVIoKFbb2xrs"

  return createClient(supabaseUrl, supabaseServiceKey)
}

