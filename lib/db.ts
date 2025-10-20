import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set. Please add it to your environment variables.")
}

// Centralized database configuration
// Suppress browser warning since we only use this in Server Actions
// All database queries run server-side with 'use server' directive
export const sql = neon(process.env.DATABASE_URL, {
  // @ts-ignore - Neon types don't include this option yet
  disableWarningInBrowsers: true,
})
