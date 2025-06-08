import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL is not set in environment variables")
}

// Create the connection with SSL for Supabase
const client = postgres(process.env.POSTGRES_URL, {
  max: 1, // Use a single connection
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout of 10 seconds
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  },
  // Force IPv6
  family: 6
} as any)

// Create the database instance
export const db = drizzle(client, { schema }) 