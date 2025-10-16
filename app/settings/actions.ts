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
    // Check if profile exists
    const existing = await sql`
      SELECT wallet_address FROM users WHERE LOWER(wallet_address) = LOWER(${data.address}) LIMIT 1
    `

    if (existing.length === 0) {
      console.log("[v0] [SERVER ACTION] Creating new profile")
      await sql`
        INSERT INTO users (wallet_address, name, email, bio, website, avatar, created_at, updated_at)
        VALUES (${data.address}, ${data.name}, ${data.email}, ${data.bio}, ${data.website}, ${data.avatar}, NOW(), NOW())
      `
    } else {
      console.log("[v0] [SERVER ACTION] Updating existing profile")
      await sql`
        UPDATE users
        SET name = ${data.name},
            email = ${data.email},
            bio = ${data.bio},
            website = ${data.website},
            avatar = ${data.avatar},
            updated_at = NOW()
        WHERE LOWER(wallet_address) = LOWER(${data.address})
      `
    }

    console.log("[v0] [SERVER ACTION] Profile updated successfully")
    return { success: true }
  } catch (error) {
    console.error("[v0] [SERVER ACTION] Error updating profile:", error)
    throw new Error("Failed to update profile")
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
