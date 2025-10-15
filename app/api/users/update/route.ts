import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { wallet_address, name, bio, website, avatar } = body

    if (!wallet_address) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    // Check if user exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE LOWER(wallet_address) = LOWER(${wallet_address})
    `

    if (existingUsers.length === 0) {
      // Create new user
      const newUsers = await sql`
        INSERT INTO users (wallet_address, name, bio, website, avatar)
        VALUES (${wallet_address}, ${name}, ${bio}, ${website}, ${avatar})
        RETURNING *
      `
      return NextResponse.json(newUsers[0])
    } else {
      // Update existing user
      const updatedUsers = await sql`
        UPDATE users
        SET 
          name = ${name},
          bio = ${bio},
          website = ${website},
          avatar = ${avatar},
          updated_at = NOW()
        WHERE LOWER(wallet_address) = LOWER(${wallet_address})
        RETURNING *
      `
      return NextResponse.json(updatedUsers[0])
    }
  } catch (error) {
    console.error("[v0] Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
