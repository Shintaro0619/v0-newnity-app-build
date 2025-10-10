import { neon } from "@neondatabase/serverless"

// Centralized database configuration
// Suppress browser warning since we only use this in Server Actions
// All database queries run server-side with 'use server' directive
export const sql = neon(process.env.DATABASE_URL!, {
  // @ts-ignore - Neon types don't include this option yet
  disableWarningInBrowsers: true,
})
