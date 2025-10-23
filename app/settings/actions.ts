"use server"

import { neon } from "@neondatabase/serverless"
import { put } from "@vercel/blob"

const sql = neon(process.env.DATABASE_URL!)

export async function getUserProfile(address: string) {
  console.log("[v0] [SERVER ACTION] Getting profile for:", address)

  try {
    const result = await sql`
      SELECT wallet_address, name, email, bio, website, avatar, created_at, updated_at
      FROM users
      WHERE LOWER(wallet_address) = LOWER(${address})
      LIMIT 1
    `

    console.log("[v0] [SERVER ACTION] Query result:", result)

    if (result.length === 0) {
      console.log("[v0] [SERVER ACTION] No profile found")
      return { profile: null }
    }

    return { profile: result[0] }
  } catch (error) {
    console.error("[v0] [SERVER ACTION] Error getting profile:", error)
    throw new Error("Failed to get profile")
  }
}

// This allows multiple wallets to use the same email address
export async function updateUserProfile(data: {
  address: string
  name: string
  email: string
  bio: string
  website: string
  avatar: string
}) {
  console.log("[v0] [SERVER ACTION] Updating profile for:", data.address)

  try {
    // Normalize and validate input
    const normalizedEmail = data.email.trim().toLowerCase()
    const normalizedName = data.name.trim()
    const normalizedBio = data.bio.trim()
    const normalizedWebsite = data.website.trim()

    if (!normalizedName) {
      return {
        success: false,
        error: "Display name is required",
      }
    }

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return {
        success: false,
        error: "Valid email address is required",
      }
    }

    // This eliminates the need for separate INSERT/UPDATE logic and email duplicate checks
    const result = await sql`
      INSERT INTO users (wallet_address, name, email, bio, website, avatar, created_at, updated_at)
      VALUES (
        ${data.address},
        ${normalizedName},
        ${normalizedEmail},
        ${normalizedBio},
        ${normalizedWebsite},
        ${data.avatar},
        NOW(),
        NOW()
      )
      ON CONFLICT (wallet_address)
      DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        bio = EXCLUDED.bio,
        website = EXCLUDED.website,
        avatar = EXCLUDED.avatar,
        updated_at = NOW()
      RETURNING *
    `

    console.log("[v0] [SERVER ACTION] Profile upserted successfully:", result[0])
    return { success: true, profile: result[0] }
  } catch (error) {
    console.error("[v0] [SERVER ACTION] Error updating profile:", error)

    if (error instanceof Error) {
      // Handle any remaining database constraint errors
      if (error.message.includes("duplicate key value violates unique constraint")) {
        return {
          success: false,
          error: "A profile with this information already exists. Please try different values.",
        }
      }
    }

    return {
      success: false,
      error: "Failed to update profile. Please try again.",
    }
  }
}

export async function uploadAvatar(formData: FormData) {
  console.log("[v0] [SERVER ACTION] Uploading avatar")

  try {
    const file = formData.get("file") as File
    const address = formData.get("address") as string

    if (!file) {
      throw new Error("No file provided")
    }

    if (!address) {
      throw new Error("No address provided")
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("File too large. Maximum size is 5MB")
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      throw new Error("File must be an image")
    }

    // Upload to Vercel Blob
    const blob = await put(`avatars/${address}-${Date.now()}.${file.name.split(".").pop()}`, file, {
      access: "public",
    })

    console.log("[v0] [SERVER ACTION] Avatar uploaded successfully:", blob.url)
    return { success: true, url: blob.url }
  } catch (error) {
    console.error("[v0] [SERVER ACTION] Error uploading avatar:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to upload avatar")
  }
}

export async function runDatabaseMigration() {
  console.log("[v0] [SERVER ACTION] Starting database migration: Remove UNIQUE constraint from users.email")

  try {
    // Step 1: Check if the constraint exists
    console.log("[v0] [SERVER ACTION] Step 1: Checking for existing UNIQUE constraint...")

    const constraintCheck = await sql`
      SELECT conname
      FROM pg_constraint
      WHERE conname = 'users_email_key'
        AND conrelid = 'public.users'::regclass
    `

    if (constraintCheck.length > 0) {
      console.log("[v0] [SERVER ACTION] Found constraint: users_email_key. Removing...")

      // Step 2: Remove the UNIQUE constraint
      await sql`ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_key`

      console.log("[v0] [SERVER ACTION] ✓ Successfully removed UNIQUE constraint: users_email_key")
    } else {
      console.log("[v0] [SERVER ACTION] ℹ Constraint users_email_key does not exist, skipping")
    }

    // Step 3: Create a non-unique index for efficient email searches
    console.log("[v0] [SERVER ACTION] Step 2: Creating non-unique index for email searches...")

    await sql`CREATE INDEX IF NOT EXISTS idx_users_email_lower ON public.users (LOWER(email))`

    console.log("[v0] [SERVER ACTION] ✓ Successfully created index: idx_users_email_lower")

    // Step 4: Verify the migration
    const verificationCheck = await sql`
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = 'public.users'::regclass
    `

    console.log("[v0] [SERVER ACTION] Verification - Current constraints:", verificationCheck)

    return {
      success: true,
      message: "Database migration completed successfully! Multiple wallets can now use the same email address.",
    }
  } catch (error) {
    console.error("[v0] [SERVER ACTION] Error running database migration:", error)

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to run database migration",
    }
  }
}
