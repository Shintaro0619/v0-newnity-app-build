import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const address = request.nextUrl.searchParams.get("address")
    console.log("[v0] [API] GET /api/profile called with address:", address)

    if (!address) {
      console.log("[v0] [API] No address provided")
      return NextResponse.json({ error: "Address is required" }, { status: 400 })
    }

    console.log("[v0] [API] Fetching profile for address:", address)

    const users = await sql`
      SELECT name, bio, website, avatar 
      FROM users 
      WHERE wallet_address = ${address.toLowerCase()}
    `

    console.log("[v0] [API] Query result:", users)

    if (users.length === 0) {
      console.log("[v0] [API] No profile found for address:", address)
      return NextResponse.json({ profile: null }, { status: 200 })
    }

    console.log("[v0] [API] Profile found:", users[0])
    return NextResponse.json({ profile: users[0] }, { status: 200 })
  } catch (error) {
    console.error("[v0] [API] Error fetching profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, name, bio, website, avatar } = body

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 })
    }

    console.log("[v0] [API] Updating profile for address:", address)

    await sql`
      INSERT INTO users (wallet_address, name, bio, website, avatar, updated_at)
      VALUES (
        ${address.toLowerCase()},
        ${name || ""},
        ${bio || ""},
        ${website || ""},
        ${avatar || ""},
        NOW()
      )
      ON CONFLICT (wallet_address) 
      DO UPDATE SET
        name = EXCLUDED.name,
        bio = EXCLUDED.bio,
        website = EXCLUDED.website,
        avatar = EXCLUDED.avatar,
        updated_at = NOW()
    `

    console.log("[v0] [API] Profile updated successfully")
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] [API] Error updating profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
